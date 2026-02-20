"""Integration tests — full pipeline in simulation mode."""

from __future__ import annotations

import pytest

from src.config import AquaKeeperConfig
from src.decision_engine import DecisionEngine
from src.motor_controller import MotorController
from src.trajectory_prediction import Observation, TrajectoryPredictor


pytestmark = pytest.mark.integration


class TestFullPipelineSimulation:
    """End-to-end pipeline test using simulated trajectory data."""

    def test_straight_shot_blocked(self) -> None:
        """Simulate a straight shot and verify the paddle moves to intercept."""
        predictor = TrajectoryPredictor(min_observations=3, process_noise=0.001, measurement_noise=0.01)
        engine = DecisionEngine(confidence_threshold=0.5, goal_width=3.0, goal_height=0.9)
        motors = MotorController(home_position=(1.5, 0.45))
        motors.connect()
        motors.enable()
        motors.move_home()

        # Ball approaching at z=10 → z=0, targeting (2.5, 0.7)
        target_x, target_y = 2.5, 0.7

        for i in range(15):
            t = i * 0.05
            frac = i / 14.0
            x = 1.5 + (target_x - 1.5) * frac
            y = 0.45 + (target_y - 0.45) * frac
            z = 10.0 * (1 - frac)

            predictor.add_observation(Observation(x=x, y=y, z=z, timestamp=t))
            pred = predictor.predict(goal_z=0.0)

            if pred is not None:
                cmd = engine.decide(pred, motors.get_position())
                motors.move_to(cmd.x, cmd.y)

        # The paddle should be near the target
        final_pos = motors.get_position()
        assert abs(final_pos[0] - target_x) < 0.5
        assert abs(final_pos[1] - target_y) < 0.3

    def test_paddle_returns_to_center(self) -> None:
        """After a shot, paddle should return to center when idle."""
        motors = MotorController(home_position=(1.5, 0.45))
        motors.connect()
        motors.enable()

        # Move paddle off-center
        motors.move_to(0.5, 0.1)
        pos = motors.get_position()
        assert pos[0] == pytest.approx(0.5)

        # Return home
        motors.move_home()
        pos = motors.get_position()
        assert pos[0] == pytest.approx(1.5)
        assert pos[1] == pytest.approx(0.45)


class TestConfigLoading:
    def test_default_config(self) -> None:
        cfg = AquaKeeperConfig()
        assert cfg.goal.width == 3.0
        assert cfg.goal.height == 0.9
        assert cfg.motor.home_position == (1.5, 0.45)
        assert cfg.detection.confidence_threshold == 0.7
