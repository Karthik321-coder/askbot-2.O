"""Camera-to-actuator calibration module.

Builds a mapping between camera pixel coordinates and physical
paddle positions using a grid of reference points.
"""

from __future__ import annotations

import logging
import os
import time
from typing import Dict, List, Optional, Tuple

import numpy as np
import yaml

logger = logging.getLogger(__name__)


class Calibration:
    """Manages the mapping from camera coordinates to paddle coordinates.

    During calibration the paddle is moved to a grid of known positions.
    For each position the camera detects the paddle and records the
    pixel coordinates.  A perspective transform (homography) is then
    computed to map any future camera-space prediction to paddle-space.

    Args:
        grid_points_h: Number of horizontal calibration points.
        grid_points_v: Number of vertical calibration points.
        goal_width: Physical goal width (meters).
        goal_height: Physical goal height (meters).
        settle_time_s: Wait time after each paddle move.
    """

    def __init__(
        self,
        grid_points_h: int = 5,
        grid_points_v: int = 3,
        goal_width: float = 3.0,
        goal_height: float = 0.9,
        settle_time_s: float = 0.5,
    ) -> None:
        self.grid_points_h = grid_points_h
        self.grid_points_v = grid_points_v
        self.goal_width = goal_width
        self.goal_height = goal_height
        self.settle_time_s = settle_time_s

        self._camera_points: List[Tuple[float, float]] = []
        self._world_points: List[Tuple[float, float]] = []
        self._homography: Optional[np.ndarray] = None

    # -- Grid generation --------------------------------------------------

    def generate_grid(self) -> List[Tuple[float, float]]:
        """Generate the calibration grid positions in world (paddle) coordinates.

        Returns:
            List of (x, y) positions in meters.
        """
        points: List[Tuple[float, float]] = []
        for iy in range(self.grid_points_v):
            y = self.goal_height * iy / max(self.grid_points_v - 1, 1)
            for ix in range(self.grid_points_h):
                x = self.goal_width * ix / max(self.grid_points_h - 1, 1)
                points.append((round(x, 4), round(y, 4)))
        return points

    # -- Recording --------------------------------------------------------

    def record_point(self, camera_xy: Tuple[float, float], world_xy: Tuple[float, float]) -> None:
        """Record a camera–world point pair.

        Args:
            camera_xy: Pixel coordinates in the camera frame.
            world_xy: Physical paddle position in meters.
        """
        self._camera_points.append(camera_xy)
        self._world_points.append(world_xy)

    # -- Compute homography -----------------------------------------------

    def compute(self) -> bool:
        """Compute the camera-to-world homography.

        Requires at least 4 point pairs.

        Returns:
            True if the homography was computed successfully.
        """
        if len(self._camera_points) < 4:
            logger.error("Need at least 4 point pairs; have %d", len(self._camera_points))
            return False

        try:
            import cv2

            src = np.array(self._camera_points, dtype=np.float32)
            dst = np.array(self._world_points, dtype=np.float32)
            H, mask = cv2.findHomography(src, dst, cv2.RANSAC, 5.0)
            if H is None:
                logger.error("Homography computation failed")
                return False
            self._homography = H
            inliers = int(mask.sum()) if mask is not None else len(self._camera_points)
            logger.info("Calibration homography computed with %d/%d inliers", inliers, len(self._camera_points))
            return True
        except Exception as exc:
            logger.error("Calibration computation failed: %s", exc)
            return False

    # -- Transform --------------------------------------------------------

    def camera_to_world(self, camera_x: float, camera_y: float) -> Optional[Tuple[float, float]]:
        """Map a camera-space coordinate to world (paddle) space.

        Args:
            camera_x: Pixel X.
            camera_y: Pixel Y.

        Returns:
            (world_x, world_y) in meters, or None if not calibrated.
        """
        if self._homography is None:
            return None

        pt = np.array([camera_x, camera_y, 1.0], dtype=np.float64)
        dst = self._homography @ pt
        if abs(dst[2]) < 1e-9:
            return None
        return (float(dst[0] / dst[2]), float(dst[1] / dst[2]))

    # -- Persistence ------------------------------------------------------

    def save(self, path: str) -> None:
        """Save calibration data to a YAML file.

        Args:
            path: Output file path.
        """
        data = {
            "camera_points": [list(p) for p in self._camera_points],
            "world_points": [list(p) for p in self._world_points],
            "homography": self._homography.tolist() if self._homography is not None else None,
        }
        with open(path, "w") as fh:
            yaml.safe_dump(data, fh)
        logger.info("Calibration data saved to %s", path)

    def load(self, path: str) -> bool:
        """Load calibration data from a YAML file.

        Args:
            path: Input file path.

        Returns:
            True if loaded and homography is valid.
        """
        if not os.path.isfile(path):
            logger.warning("Calibration file not found: %s", path)
            return False

        with open(path, "r") as fh:
            data = yaml.safe_load(fh)

        self._camera_points = [tuple(p) for p in data.get("camera_points", [])]
        self._world_points = [tuple(p) for p in data.get("world_points", [])]
        h = data.get("homography")
        if h is not None:
            self._homography = np.array(h, dtype=np.float64)
            return True
        return self.compute()

    @property
    def is_calibrated(self) -> bool:
        return self._homography is not None
