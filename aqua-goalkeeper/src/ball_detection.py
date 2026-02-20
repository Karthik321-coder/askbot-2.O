"""Ball detection module using YOLOv8.

Detects water polo balls in camera frames and returns 2D/3D positions.
"""

from __future__ import annotations

import time
from dataclasses import dataclass
from typing import List, Optional, Tuple

import cv2
import numpy as np


@dataclass
class BallDetection:
    """A single ball detection result."""

    x: float          # Center X in pixels
    y: float          # Center Y in pixels
    width: float      # Bounding-box width in pixels
    height: float     # Bounding-box height in pixels
    confidence: float  # Detection confidence [0, 1]
    depth_m: float = 0.0  # Estimated depth in meters (0 if unknown)
    timestamp: float = 0.0

    @property
    def bbox(self) -> Tuple[float, float, float, float]:
        """Return (x1, y1, x2, y2) bounding box."""
        x1 = self.x - self.width / 2
        y1 = self.y - self.height / 2
        x2 = self.x + self.width / 2
        y2 = self.y + self.height / 2
        return (x1, y1, x2, y2)

    @property
    def position_3d(self) -> Optional[Tuple[float, float, float]]:
        """Return 3D position if depth is available."""
        if self.depth_m <= 0:
            return None
        return (self.x, self.y, self.depth_m)


class BallDetector:
    """Detects water polo balls using YOLOv8 or a colour-based fallback.

    When a YOLOv8 model file is available, inference runs through the
    Ultralytics library.  If the model cannot be loaded (e.g. during
    unit testing or on hardware without GPU support), a simple HSV
    colour-based detector is used as a fallback.

    Args:
        model_path: Path to a YOLOv8 ``.pt`` weights file.
        confidence_threshold: Minimum confidence to keep a detection.
        nms_threshold: IoU threshold for non-maximum suppression.
        input_size: Model input resolution ``(width, height)``.
        use_gpu: Whether to use GPU acceleration.
    """

    # Default HSV range for a yellow/orange water polo ball
    _HSV_LOWER = np.array([15, 100, 100], dtype=np.uint8)
    _HSV_UPPER = np.array([35, 255, 255], dtype=np.uint8)
    _MIN_CONTOUR_AREA = 200

    def __init__(
        self,
        model_path: str = "models/ball_detector.pt",
        confidence_threshold: float = 0.7,
        nms_threshold: float = 0.4,
        input_size: Tuple[int, int] = (640, 640),
        use_gpu: bool = True,
    ) -> None:
        self.model_path = model_path
        self.confidence_threshold = confidence_threshold
        self.nms_threshold = nms_threshold
        self.input_size = input_size
        self.use_gpu = use_gpu

        self._model = None
        self._use_fallback = False

    # -- Lifecycle --------------------------------------------------------

    def load_model(self) -> bool:
        """Attempt to load the YOLOv8 model.

        Returns:
            True if the model was loaded, False if falling back to HSV.
        """
        try:
            from ultralytics import YOLO  # type: ignore[import-untyped]

            self._model = YOLO(self.model_path)
            if self.use_gpu:
                self._model.to("cuda")
            self._use_fallback = False
            return True
        except Exception:
            self._use_fallback = True
            return False

    # -- Detection --------------------------------------------------------

    def detect(self, frame: np.ndarray, timestamp: float = 0.0) -> List[BallDetection]:
        """Detect balls in a single BGR frame.

        Args:
            frame: A BGR image as a NumPy array (H×W×3).
            timestamp: Capture timestamp for the frame.

        Returns:
            A list of ``BallDetection`` instances.
        """
        if self._model is not None and not self._use_fallback:
            return self._detect_yolo(frame, timestamp)
        return self._detect_hsv(frame, timestamp)

    # -- YOLOv8 path ------------------------------------------------------

    def _detect_yolo(self, frame: np.ndarray, timestamp: float) -> List[BallDetection]:
        results = self._model(frame, imgsz=self.input_size[0], conf=self.confidence_threshold, iou=self.nms_threshold, verbose=False)  # type: ignore[union-attr]
        detections: List[BallDetection] = []
        for result in results:
            for box in result.boxes:
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                conf = float(box.conf[0])
                cx = (x1 + x2) / 2
                cy = (y1 + y2) / 2
                w = x2 - x1
                h = y2 - y1
                detections.append(BallDetection(x=cx, y=cy, width=w, height=h, confidence=conf, timestamp=timestamp))
        return detections

    # -- HSV colour fallback path -----------------------------------------

    def _detect_hsv(self, frame: np.ndarray, timestamp: float) -> List[BallDetection]:
        """Simple HSV colour-based ball detector (fallback)."""
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        mask = cv2.inRange(hsv, self._HSV_LOWER, self._HSV_UPPER)
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))

        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        detections: List[BallDetection] = []
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area < self._MIN_CONTOUR_AREA:
                continue

            x_rect, y_rect, w_rect, h_rect = cv2.boundingRect(cnt)
            # Approximate circularity check
            aspect = w_rect / max(h_rect, 1)
            if aspect < 0.5 or aspect > 2.0:
                continue

            cx = x_rect + w_rect / 2.0
            cy = y_rect + h_rect / 2.0
            # Confidence heuristic based on area and circularity
            perimeter = cv2.arcLength(cnt, True)
            circularity = (4 * np.pi * area) / max(perimeter * perimeter, 1)
            conf = min(1.0, circularity * (area / 5000))

            if conf >= self.confidence_threshold:
                detections.append(
                    BallDetection(x=cx, y=cy, width=float(w_rect), height=float(h_rect), confidence=conf, timestamp=timestamp)
                )

        return detections

    # -- Utility ----------------------------------------------------------

    @staticmethod
    def annotate_frame(frame: np.ndarray, detections: List[BallDetection]) -> np.ndarray:
        """Draw detection bounding boxes on a frame (for debugging).

        Args:
            frame: BGR image.
            detections: List of detections to draw.

        Returns:
            Annotated copy of the frame.
        """
        out = frame.copy()
        for det in detections:
            x1, y1, x2, y2 = det.bbox
            cv2.rectangle(out, (int(x1), int(y1)), (int(x2), int(y2)), (0, 255, 0), 2)
            label = f"Ball {det.confidence:.2f}"
            cv2.putText(out, label, (int(x1), int(y1) - 8), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
        return out
