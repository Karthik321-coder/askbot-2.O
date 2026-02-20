"""Unit tests for ball detection module."""

from __future__ import annotations

import numpy as np
import pytest

from src.ball_detection import BallDetection, BallDetector


@pytest.fixture
def detector() -> BallDetector:
    """Create a detector that uses HSV fallback (no YOLO model)."""
    d = BallDetector(confidence_threshold=0.1)
    d._use_fallback = True
    return d


def _make_ball_frame(
    width: int = 640,
    height: int = 480,
    ball_center: tuple = (320, 240),
    ball_radius: int = 30,
) -> np.ndarray:
    """Synthesise a BGR frame with an orange circle (simulated ball)."""
    import cv2

    frame = np.zeros((height, width, 3), dtype=np.uint8)
    # Pool-blue background
    frame[:, :] = (200, 150, 50)  # BGR blueish
    # Orange ball
    cv2.circle(frame, ball_center, ball_radius, (0, 140, 255), -1)  # BGR orange
    return frame


def _make_empty_frame(width: int = 640, height: int = 480) -> np.ndarray:
    """Synthesise a BGR frame with no ball (just blue pool water)."""
    frame = np.zeros((height, width, 3), dtype=np.uint8)
    frame[:, :] = (200, 150, 50)
    return frame


class TestBallDetection:
    def test_detect_ball_in_frame(self, detector: BallDetector) -> None:
        frame = _make_ball_frame(ball_center=(320, 240), ball_radius=40)
        detections = detector.detect(frame, timestamp=1.0)
        assert len(detections) >= 1
        # The detected centre should be close to (320, 240)
        best = max(detections, key=lambda d: d.confidence)
        assert abs(best.x - 320) < 60
        assert abs(best.y - 240) < 60

    def test_no_false_positive(self, detector: BallDetector) -> None:
        frame = _make_empty_frame()
        detections = detector.detect(frame, timestamp=1.0)
        assert len(detections) == 0

    def test_confidence_threshold(self) -> None:
        d = BallDetector(confidence_threshold=0.99)
        d._use_fallback = True
        frame = _make_ball_frame(ball_radius=15)  # small → low confidence
        detections = d.detect(frame, timestamp=1.0)
        # High threshold should filter out marginal detections
        for det in detections:
            assert det.confidence >= 0.99

    def test_bbox_property(self) -> None:
        det = BallDetection(x=100, y=200, width=50, height=60, confidence=0.9)
        x1, y1, x2, y2 = det.bbox
        assert x1 == pytest.approx(75)
        assert y1 == pytest.approx(170)
        assert x2 == pytest.approx(125)
        assert y2 == pytest.approx(230)

    def test_position_3d_no_depth(self) -> None:
        det = BallDetection(x=100, y=200, width=50, height=60, confidence=0.9, depth_m=0)
        assert det.position_3d is None

    def test_position_3d_with_depth(self) -> None:
        det = BallDetection(x=100, y=200, width=50, height=60, confidence=0.9, depth_m=5.0)
        pos = det.position_3d
        assert pos is not None
        assert pos == (100, 200, 5.0)

    def test_annotate_frame(self, detector: BallDetector) -> None:
        frame = _make_ball_frame()
        detections = [BallDetection(x=320, y=240, width=60, height=60, confidence=0.9)]
        annotated = BallDetector.annotate_frame(frame, detections)
        assert annotated.shape == frame.shape
        # The annotated frame should differ from the original (has rectangles drawn)
        assert not np.array_equal(annotated, frame)
