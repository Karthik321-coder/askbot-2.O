"""Unit tests for trajectory prediction module."""

from __future__ import annotations

import numpy as np
import pytest

from src.trajectory_prediction import (
    ImpactPrediction,
    KalmanPredictor,
    Observation,
    TrajectoryPredictor,
)


class TestKalmanPredictor:
    def test_straight_shot(self) -> None:
        """Ball moving straight toward the goal (decreasing z)."""
        kf = KalmanPredictor(process_noise=0.001, measurement_noise=0.01, gravity=0.0)

        # Ball at z=10 moving toward z=0 at ~20 m/s
        for i in range(10):
            t = i * 0.05  # 20 Hz
            z = 10.0 - 20.0 * t
            obs = Observation(x=1.5, y=0.45, z=z, timestamp=t)
            dt = 0.05 if i > 0 else 0.0
            kf.update(obs, dt)

        pred = kf.predict_impact(goal_z=0.0)
        assert pred is not None
        # Impact X should be near 1.5 m (center of goal)
        assert abs(pred.x - 1.5) < 0.2
        assert pred.time_to_impact > 0

    def test_no_prediction_before_init(self) -> None:
        kf = KalmanPredictor()
        pred = kf.predict_impact(goal_z=0.0)
        assert pred is None

    def test_reset(self) -> None:
        kf = KalmanPredictor()
        kf.update(Observation(x=1, y=1, z=5, timestamp=0), dt=0)
        kf.reset()
        assert kf.predict_impact(goal_z=0.0) is None

    def test_ball_moving_away(self) -> None:
        """Ball moving away from goal should produce no prediction."""
        kf = KalmanPredictor(gravity=0.0)
        for i in range(5):
            t = i * 0.05
            z = 5.0 + 10.0 * t  # Moving away from z=0
            kf.update(Observation(x=1.5, y=0.45, z=z, timestamp=t), dt=0.05 if i > 0 else 0.0)

        pred = kf.predict_impact(goal_z=0.0)
        assert pred is None


class TestTrajectoryPredictor:
    def test_min_observations_not_met(self) -> None:
        tp = TrajectoryPredictor(min_observations=5)
        tp.add_observation(Observation(x=1, y=1, z=10, timestamp=0))
        tp.add_observation(Observation(x=1, y=1, z=9, timestamp=0.05))
        pred = tp.predict(goal_z=0.0)
        assert pred is None

    def test_straight_shot_ensemble(self) -> None:
        tp = TrajectoryPredictor(min_observations=3, process_noise=0.001, measurement_noise=0.01)

        for i in range(10):
            t = i * 0.05
            z = 10.0 - 20.0 * t
            tp.add_observation(Observation(x=1.5, y=0.45, z=z, timestamp=t))

        pred = tp.predict(goal_z=0.0)
        assert pred is not None
        # With Kalman-only (LSTM not loaded), should still get reasonable prediction
        assert abs(pred.x - 1.5) < 0.5

    def test_observation_count(self) -> None:
        tp = TrajectoryPredictor()
        assert tp.observation_count == 0
        tp.add_observation(Observation(x=1, y=1, z=5, timestamp=0))
        assert tp.observation_count == 1

    def test_reset_clears_observations(self) -> None:
        tp = TrajectoryPredictor()
        tp.add_observation(Observation(x=1, y=1, z=5, timestamp=0))
        tp.reset()
        assert tp.observation_count == 0


class TestImpactPrediction:
    def test_fields(self) -> None:
        pred = ImpactPrediction(x=1.5, y=0.45, time_to_impact=0.3, confidence=0.9)
        assert pred.x == 1.5
        assert pred.y == 0.45
        assert pred.time_to_impact == 0.3
        assert pred.confidence == 0.9
