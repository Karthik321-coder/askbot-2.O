"""Decision engine — determines where the paddle should move.

Uses a reinforcement-learning policy when available; otherwise falls
back to a simple rule-based strategy.
"""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass
from typing import Optional, Tuple

import numpy as np

from .trajectory_prediction import ImpactPrediction

logger = logging.getLogger(__name__)


@dataclass
class PaddleCommand:
    """A command for the paddle position."""

    x: float  # Target horizontal position (meters)
    y: float  # Target vertical position (meters)
    urgency: float  # 0.0 (low) to 1.0 (immediate)


class DecisionEngine:
    """Decides the target paddle position based on trajectory predictions.

    When a trained RL model is available, the policy network is used.
    Otherwise, a rule-based strategy directly maps the predicted impact
    point to a paddle target.

    Args:
        model_path: Path to the RL agent weights (TorchScript .pt file).
        reaction_threshold_s: Minimum time-to-impact before committing.
        confidence_threshold: Minimum prediction confidence before acting.
        return_to_center: Whether to return the paddle to center after a shot.
        goal_width: Goal width in meters.
        goal_height: Goal height in meters.
        home_x: Center X position.
        home_y: Center Y position.
    """

    def __init__(
        self,
        model_path: str = "models/rl_agent.pt",
        reaction_threshold_s: float = 0.15,
        confidence_threshold: float = 0.8,
        return_to_center: bool = True,
        goal_width: float = 3.0,
        goal_height: float = 0.9,
        home_x: float = 1.5,
        home_y: float = 0.45,
    ) -> None:
        self.model_path = model_path
        self.reaction_threshold_s = reaction_threshold_s
        self.confidence_threshold = confidence_threshold
        self.return_to_center = return_to_center
        self.goal_width = goal_width
        self.goal_height = goal_height
        self.home_x = home_x
        self.home_y = home_y

        self._model = None
        self._last_action_time: float = 0.0

    # -- Model loading ----------------------------------------------------

    def load_model(self) -> bool:
        """Load the RL policy network (TorchScript).

        Returns:
            True if loaded successfully, False otherwise.
        """
        try:
            import torch

            self._model = torch.jit.load(self.model_path, map_location="cpu")
            self._model.eval()
            logger.info("RL policy model loaded from %s", self.model_path)
            return True
        except Exception as exc:
            logger.warning("Could not load RL model (%s); using rule-based fallback", exc)
            self._model = None
            return False

    # -- Decision ---------------------------------------------------------

    def decide(
        self,
        prediction: Optional[ImpactPrediction],
        current_position: Tuple[float, float],
    ) -> PaddleCommand:
        """Determine the paddle target position.

        Args:
            prediction: The trajectory prediction (may be None).
            current_position: Current paddle position (x, y) in meters.

        Returns:
            A PaddleCommand with the target position and urgency.
        """
        # No prediction → hold center
        if prediction is None:
            return PaddleCommand(x=self.home_x, y=self.home_y, urgency=0.0)

        # Low confidence → hold center
        if prediction.confidence < self.confidence_threshold:
            return PaddleCommand(x=self.home_x, y=self.home_y, urgency=0.1)

        # Try RL model first
        if self._model is not None:
            cmd = self._decide_rl(prediction, current_position)
            if cmd is not None:
                return cmd

        # Rule-based fallback
        return self._decide_rule_based(prediction, current_position)

    def _decide_rl(
        self,
        prediction: ImpactPrediction,
        current_position: Tuple[float, float],
    ) -> Optional[PaddleCommand]:
        """Use the RL policy network to decide."""
        try:
            import torch

            state = torch.tensor(
                [
                    prediction.x / self.goal_width,
                    prediction.y / self.goal_height,
                    prediction.time_to_impact,
                    prediction.confidence,
                    current_position[0] / self.goal_width,
                    current_position[1] / self.goal_height,
                ],
                dtype=torch.float32,
            ).unsqueeze(0)

            with torch.no_grad():
                action = self._model(state).squeeze(0).numpy()  # type: ignore[union-attr]

            target_x = float(np.clip(action[0] * self.goal_width, 0, self.goal_width))
            target_y = float(np.clip(action[1] * self.goal_height, 0, self.goal_height))
            urgency = 1.0 if prediction.time_to_impact < self.reaction_threshold_s else 0.7

            self._last_action_time = time.monotonic()
            return PaddleCommand(x=target_x, y=target_y, urgency=urgency)
        except Exception:
            return None

    def _decide_rule_based(
        self,
        prediction: ImpactPrediction,
        current_position: Tuple[float, float],
    ) -> PaddleCommand:
        """Simple rule-based decision: move directly to the predicted impact point."""
        target_x = float(np.clip(prediction.x, 0, self.goal_width))
        target_y = float(np.clip(prediction.y, 0, self.goal_height))

        # Urgency based on time to impact
        if prediction.time_to_impact < self.reaction_threshold_s:
            urgency = 1.0
        elif prediction.time_to_impact < 0.3:
            urgency = 0.8
        else:
            urgency = 0.5

        self._last_action_time = time.monotonic()
        return PaddleCommand(x=target_x, y=target_y, urgency=urgency)

    def should_return_to_center(self, idle_time: float = 2.0) -> bool:
        """Check if the paddle should return to center after inactivity.

        Args:
            idle_time: Seconds of inactivity before returning.

        Returns:
            True if the paddle should return to center.
        """
        if not self.return_to_center:
            return False
        return (time.monotonic() - self._last_action_time) > idle_time
