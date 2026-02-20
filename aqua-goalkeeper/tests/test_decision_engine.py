"""Unit tests for decision engine module."""

from __future__ import annotations

import pytest

from src.decision_engine import DecisionEngine, PaddleCommand
from src.trajectory_prediction import ImpactPrediction


@pytest.fixture
def engine() -> DecisionEngine:
    return DecisionEngine(
        confidence_threshold=0.8,
        reaction_threshold_s=0.15,
        goal_width=3.0,
        goal_height=0.9,
        home_x=1.5,
        home_y=0.45,
    )


class TestDecisionEngine:
    def test_no_prediction_holds_center(self, engine: DecisionEngine) -> None:
        cmd = engine.decide(None, (1.5, 0.45))
        assert cmd.x == pytest.approx(1.5)
        assert cmd.y == pytest.approx(0.45)
        assert cmd.urgency == 0.0

    def test_low_confidence_holds_center(self, engine: DecisionEngine) -> None:
        pred = ImpactPrediction(x=0.5, y=0.2, time_to_impact=0.4, confidence=0.3)
        cmd = engine.decide(pred, (1.5, 0.45))
        assert cmd.x == pytest.approx(1.5)
        assert cmd.y == pytest.approx(0.45)

    def test_high_confidence_moves_to_prediction(self, engine: DecisionEngine) -> None:
        pred = ImpactPrediction(x=2.0, y=0.7, time_to_impact=0.4, confidence=0.95)
        cmd = engine.decide(pred, (1.5, 0.45))
        assert cmd.x == pytest.approx(2.0)
        assert cmd.y == pytest.approx(0.7)
        assert cmd.urgency > 0

    def test_clamps_to_goal_bounds(self, engine: DecisionEngine) -> None:
        pred = ImpactPrediction(x=5.0, y=-1.0, time_to_impact=0.3, confidence=0.95)
        cmd = engine.decide(pred, (1.5, 0.45))
        assert 0 <= cmd.x <= 3.0
        assert 0 <= cmd.y <= 0.9

    def test_short_time_high_urgency(self, engine: DecisionEngine) -> None:
        pred = ImpactPrediction(x=1.0, y=0.3, time_to_impact=0.10, confidence=0.95)
        cmd = engine.decide(pred, (1.5, 0.45))
        assert cmd.urgency == 1.0

    def test_return_to_center_flag(self) -> None:
        engine = DecisionEngine(return_to_center=True)
        # After some time without action, should want to return
        engine._last_action_time = 0.0  # long ago
        assert engine.should_return_to_center(idle_time=0.001) is True

    def test_no_return_to_center_if_disabled(self) -> None:
        engine = DecisionEngine(return_to_center=False)
        engine._last_action_time = 0.0
        assert engine.should_return_to_center(idle_time=0.001) is False
