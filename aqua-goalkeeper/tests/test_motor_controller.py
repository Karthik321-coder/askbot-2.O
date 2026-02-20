"""Unit tests for motor controller module."""

from __future__ import annotations

import pytest

from src.motor_controller import AxisController, MotorController


class TestAxisController:
    def test_connect_simulation(self) -> None:
        axis = AxisController(name="test", stroke_m=3.0)
        assert axis.connect() is True
        assert axis.is_simulated is True

    def test_move_to_within_range(self) -> None:
        axis = AxisController(stroke_m=3.0, margin_m=0.05)
        axis.connect()
        axis.enable()
        actual = axis.move_to(1.5)
        assert actual == pytest.approx(1.5)

    def test_move_to_clamps_low(self) -> None:
        axis = AxisController(stroke_m=3.0, margin_m=0.05)
        axis.connect()
        axis.enable()
        actual = axis.move_to(-1.0)
        assert actual == pytest.approx(0.05)  # Clamped to margin

    def test_move_to_clamps_high(self) -> None:
        axis = AxisController(stroke_m=3.0, margin_m=0.05)
        axis.connect()
        axis.enable()
        actual = axis.move_to(10.0)
        assert actual == pytest.approx(2.95)  # stroke - margin

    def test_move_to_disabled_ignored(self) -> None:
        axis = AxisController(stroke_m=3.0)
        axis.connect()
        # Do NOT enable
        actual = axis.move_to(1.5)
        assert actual == pytest.approx(0.0)  # Initial sim position

    def test_get_position(self) -> None:
        axis = AxisController(stroke_m=3.0)
        axis.connect()
        axis.enable()
        axis.move_to(2.0)
        assert axis.get_position() == pytest.approx(2.0)

    def test_get_state(self) -> None:
        axis = AxisController(stroke_m=3.0)
        axis.connect()
        axis.enable()
        axis.move_to(1.0)
        state = axis.get_state()
        assert state.is_enabled is True
        assert state.position_m == pytest.approx(1.0)


class TestMotorController:
    def test_connect_and_enable(self) -> None:
        mc = MotorController()
        assert mc.connect() is True
        mc.enable()
        assert mc.horizontal._enabled is True
        assert mc.vertical._enabled is True

    def test_move_to(self) -> None:
        mc = MotorController()
        mc.connect()
        mc.enable()
        actual = mc.move_to(2.0, 0.6)
        assert actual[0] == pytest.approx(2.0)
        assert actual[1] == pytest.approx(0.6)

    def test_move_home(self) -> None:
        mc = MotorController(home_position=(1.5, 0.45))
        mc.connect()
        mc.enable()
        mc.move_to(0.5, 0.1)
        mc.move_home()
        pos = mc.get_position()
        assert pos[0] == pytest.approx(1.5)
        assert pos[1] == pytest.approx(0.45)

    def test_emergency_stop(self) -> None:
        mc = MotorController()
        mc.connect()
        mc.enable()
        mc.emergency_stop()
        assert mc.horizontal._enabled is False
        assert mc.vertical._enabled is False

    def test_get_position(self) -> None:
        mc = MotorController()
        mc.connect()
        mc.enable()
        mc.move_to(1.0, 0.3)
        pos = mc.get_position()
        assert pos == pytest.approx((1.0, 0.3))
