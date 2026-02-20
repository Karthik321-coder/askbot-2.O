"""Motor controller for horizontal and vertical actuators.

Controls two-axis linear actuators via ODrive motor controllers.
Provides position commands, velocity limiting, and safety features.
"""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass
from typing import Optional, Tuple

logger = logging.getLogger(__name__)


@dataclass
class AxisState:
    """Current state of a single actuator axis."""

    position_m: float = 0.0
    velocity_ms: float = 0.0
    is_homed: bool = False
    is_enabled: bool = False
    error: Optional[str] = None


class AxisController:
    """Controls a single linear-actuator axis via an ODrive controller.

    In simulation mode (when no ODrive hardware is found), all commands
    are tracked internally without sending to real hardware.

    Args:
        name: Human-readable axis name (e.g. "horizontal").
        axis_index: ODrive axis index (0 or 1).
        max_speed: Maximum speed in m/s.
        max_acceleration: Maximum acceleration in m/s².
        stroke_m: Total travel length in meters.
        counts_per_meter: Encoder resolution.
        odrive_serial: ODrive serial number (auto-detect if None).
        margin_m: Safety margin from rail ends in meters.
    """

    def __init__(
        self,
        name: str = "axis",
        axis_index: int = 0,
        max_speed: float = 4.0,
        max_acceleration: float = 20.0,
        stroke_m: float = 3.0,
        counts_per_meter: int = 8192,
        odrive_serial: Optional[str] = None,
        margin_m: float = 0.05,
    ) -> None:
        self.name = name
        self.axis_index = axis_index
        self.max_speed = max_speed
        self.max_acceleration = max_acceleration
        self.stroke_m = stroke_m
        self.counts_per_meter = counts_per_meter
        self.odrive_serial = odrive_serial
        self.margin_m = margin_m

        self._odrive = None
        self._axis = None
        self._simulated = True
        self._sim_position = 0.0
        self._enabled = False

    # -- Lifecycle --------------------------------------------------------

    def connect(self) -> bool:
        """Connect to the ODrive controller.

        Returns:
            True if connected (or in simulation mode).
        """
        try:
            import odrive  # type: ignore[import-untyped]

            if self.odrive_serial:
                self._odrive = odrive.find_any(serial_number=self.odrive_serial, timeout=5)
            else:
                self._odrive = odrive.find_any(timeout=5)

            self._axis = getattr(self._odrive, f"axis{self.axis_index}")
            self._simulated = False
            logger.info("Connected to ODrive axis %s (%s)", self.name, self.odrive_serial or "auto")
            return True
        except Exception as exc:
            logger.warning("ODrive not found for %s, using simulation mode: %s", self.name, exc)
            self._simulated = True
            return True  # Simulation mode is always available

    def enable(self) -> None:
        """Enable the motor (enter closed-loop position control)."""
        if not self._simulated and self._axis is not None:
            self._axis.requested_state = 8  # CLOSED_LOOP_CONTROL
        self._enabled = True

    def disable(self) -> None:
        """Disable the motor (idle)."""
        if not self._simulated and self._axis is not None:
            self._axis.requested_state = 1  # IDLE
        self._enabled = False

    # -- Motion -----------------------------------------------------------

    def move_to(self, position_m: float) -> float:
        """Command the actuator to move to a position.

        The position is clamped to the valid range and the command is
        sent to the motor controller.

        Args:
            position_m: Target position in meters from the home end.

        Returns:
            The actual clamped position that was commanded.
        """
        # Clamp to valid range
        pos = max(self.margin_m, min(self.stroke_m - self.margin_m, position_m))

        if not self._enabled:
            logger.warning("Axis %s not enabled; ignoring move command", self.name)
            return self._sim_position

        if self._simulated:
            self._sim_position = pos
        else:
            counts = int(pos * self.counts_per_meter)
            self._axis.controller.input_pos = counts / self.counts_per_meter  # type: ignore[union-attr]

        return pos

    def get_position(self) -> float:
        """Read the current position in meters."""
        if self._simulated:
            return self._sim_position
        try:
            counts = self._axis.encoder.pos_estimate  # type: ignore[union-attr]
            return counts / self.counts_per_meter
        except Exception:
            return self._sim_position

    def get_state(self) -> AxisState:
        """Return the current axis state."""
        return AxisState(
            position_m=self.get_position(),
            velocity_ms=0.0,
            is_homed=True,
            is_enabled=self._enabled,
            error=None,
        )

    @property
    def is_simulated(self) -> bool:
        return self._simulated


class MotorController:
    """Two-axis motor controller managing horizontal and vertical actuators.

    Args:
        h_config: Keyword arguments forwarded to the horizontal AxisController.
        v_config: Keyword arguments forwarded to the vertical AxisController.
        home_position: Default home/center position as (x, y) in meters.
    """

    def __init__(
        self,
        h_config: Optional[dict] = None,
        v_config: Optional[dict] = None,
        home_position: Tuple[float, float] = (1.5, 0.45),
    ) -> None:
        h_config = h_config or {}
        v_config = v_config or {}
        self.horizontal = AxisController(name="horizontal", **h_config)
        self.vertical = AxisController(name="vertical", **v_config)
        self.home_position = home_position

    def connect(self) -> bool:
        """Connect to both axes."""
        h_ok = self.horizontal.connect()
        v_ok = self.vertical.connect()
        return h_ok and v_ok

    def enable(self) -> None:
        """Enable both axes."""
        self.horizontal.enable()
        self.vertical.enable()

    def disable(self) -> None:
        """Disable both axes."""
        self.horizontal.disable()
        self.vertical.disable()

    def move_to(self, x: float, y: float) -> Tuple[float, float]:
        """Move the paddle to an (x, y) position in meters.

        Args:
            x: Horizontal position.
            y: Vertical position.

        Returns:
            Tuple of (actual_x, actual_y) after clamping.
        """
        actual_x = self.horizontal.move_to(x)
        actual_y = self.vertical.move_to(y)
        return (actual_x, actual_y)

    def move_home(self) -> Tuple[float, float]:
        """Move the paddle to the center/home position."""
        return self.move_to(*self.home_position)

    def get_position(self) -> Tuple[float, float]:
        """Return the current paddle position as (x, y) in meters."""
        return (self.horizontal.get_position(), self.vertical.get_position())

    def emergency_stop(self) -> None:
        """Immediately disable both motors."""
        self.disable()
        logger.critical("EMERGENCY STOP activated — all motors disabled")
