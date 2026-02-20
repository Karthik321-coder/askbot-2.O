"""Camera interface for the AquaKeeper system.

Provides stereo camera capture and depth estimation.
"""

from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Optional, Tuple

import cv2
import numpy as np


@dataclass
class StereoFrame:
    """A synchronized stereo frame pair with optional depth map."""

    left: np.ndarray
    right: np.ndarray
    depth_map: Optional[np.ndarray] = None
    timestamp: float = 0.0


class StereoCamera:
    """Manages a synchronized stereo camera pair for depth estimation.

    Args:
        left_device_id: OpenCV device index for the left camera.
        right_device_id: OpenCV device index for the right camera.
        resolution: Capture resolution as (width, height).
        fps: Target capture frame rate.
        baseline_m: Physical distance between camera centers in meters.
    """

    def __init__(
        self,
        left_device_id: int = 0,
        right_device_id: int = 1,
        resolution: Tuple[int, int] = (640, 480),
        fps: int = 120,
        baseline_m: float = 0.30,
    ) -> None:
        self.left_device_id = left_device_id
        self.right_device_id = right_device_id
        self.resolution = resolution
        self.fps = fps
        self.baseline_m = baseline_m

        self._left_cap: Optional[cv2.VideoCapture] = None
        self._right_cap: Optional[cv2.VideoCapture] = None
        self._stereo_matcher: Optional[cv2.StereoSGBM] = None
        self._is_open = False

    # -- Lifecycle --------------------------------------------------------

    def open(self) -> bool:
        """Open both cameras and configure them.

        Returns:
            True if both cameras opened successfully.
        """
        self._left_cap = cv2.VideoCapture(self.left_device_id)
        self._right_cap = cv2.VideoCapture(self.right_device_id)

        for cap in (self._left_cap, self._right_cap):
            cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.resolution[0])
            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.resolution[1])
            cap.set(cv2.CAP_PROP_FPS, self.fps)

        self._stereo_matcher = cv2.StereoSGBM_create(
            minDisparity=0,
            numDisparities=64,
            blockSize=9,
            P1=8 * 3 * 9 * 9,
            P2=32 * 3 * 9 * 9,
            disp12MaxDiff=1,
            uniquenessRatio=10,
            speckleWindowSize=100,
            speckleRange=32,
        )

        self._is_open = (
            self._left_cap.isOpened() and self._right_cap.isOpened()
        )
        return self._is_open

    def close(self) -> None:
        """Release both camera devices."""
        if self._left_cap is not None:
            self._left_cap.release()
        if self._right_cap is not None:
            self._right_cap.release()
        self._is_open = False

    @property
    def is_open(self) -> bool:
        return self._is_open

    # -- Capture ----------------------------------------------------------

    def capture(self, compute_depth: bool = True) -> Optional[StereoFrame]:
        """Capture a synchronized stereo frame.

        Args:
            compute_depth: If True, compute the disparity/depth map.

        Returns:
            A StereoFrame, or None if capture failed.
        """
        if not self._is_open:
            return None

        ret_l, frame_l = self._left_cap.read()  # type: ignore[union-attr]
        ret_r, frame_r = self._right_cap.read()  # type: ignore[union-attr]
        ts = time.monotonic()

        if not ret_l or not ret_r:
            return None

        depth = None
        if compute_depth and self._stereo_matcher is not None:
            gray_l = cv2.cvtColor(frame_l, cv2.COLOR_BGR2GRAY)
            gray_r = cv2.cvtColor(frame_r, cv2.COLOR_BGR2GRAY)
            disparity = self._stereo_matcher.compute(gray_l, gray_r).astype(np.float32) / 16.0
            # Avoid division by zero
            disparity[disparity <= 0] = 0.01
            # Depth in meters (Z = f * B / d)
            focal_length_px = self.resolution[0]  # Approximate
            depth = (focal_length_px * self.baseline_m) / disparity

        return StereoFrame(left=frame_l, right=frame_r, depth_map=depth, timestamp=ts)

    # -- Depth lookup -----------------------------------------------------

    def depth_at(self, depth_map: np.ndarray, x: int, y: int, window: int = 5) -> float:
        """Get the median depth at a pixel location.

        Args:
            depth_map: Depth map array (H×W) in meters.
            x: Horizontal pixel coordinate.
            y: Vertical pixel coordinate.
            window: Size of the averaging window.

        Returns:
            Depth in meters.
        """
        h, w = depth_map.shape[:2]
        half = window // 2
        y0 = max(0, y - half)
        y1 = min(h, y + half + 1)
        x0 = max(0, x - half)
        x1 = min(w, x + half + 1)
        region = depth_map[y0:y1, x0:x1]
        return float(np.median(region))
