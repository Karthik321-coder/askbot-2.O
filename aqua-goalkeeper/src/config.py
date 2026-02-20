"""Configuration loader for the AquaKeeper system.

Loads YAML configuration and provides typed access to all settings.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import List, Optional, Tuple

import yaml


@dataclass
class CameraDeviceConfig:
    device_id: int = 0
    resolution: Tuple[int, int] = (640, 480)
    fps: int = 120
    exposure: str = "auto"


@dataclass
class StereoConfig:
    baseline_m: float = 0.30
    convergence_angle: float = 5.0


@dataclass
class CameraConfig:
    left: CameraDeviceConfig = field(default_factory=CameraDeviceConfig)
    right: CameraDeviceConfig = field(default_factory=lambda: CameraDeviceConfig(device_id=1))
    stereo: StereoConfig = field(default_factory=StereoConfig)


@dataclass
class DetectionConfig:
    model_path: str = "models/ball_detector.pt"
    confidence_threshold: float = 0.7
    nms_threshold: float = 0.4
    input_size: Tuple[int, int] = (640, 640)
    ball_diameter_m: float = 0.22
    use_gpu: bool = True


@dataclass
class KalmanConfig:
    process_noise: float = 0.01
    measurement_noise: float = 0.1


@dataclass
class LSTMConfig:
    model_path: str = "models/trajectory_lstm.pt"
    sequence_length: int = 10
    hidden_size: int = 128


@dataclass
class PredictionConfig:
    kalman: KalmanConfig = field(default_factory=KalmanConfig)
    lstm: LSTMConfig = field(default_factory=LSTMConfig)
    min_observations: int = 3
    prediction_horizon_s: float = 0.5


@dataclass
class AxisConfig:
    odrive_serial: Optional[str] = None
    axis: int = 0
    max_speed: float = 4.0
    max_acceleration: float = 20.0
    stroke_m: float = 3.0
    counts_per_meter: int = 8192


@dataclass
class MotorConfig:
    horizontal: AxisConfig = field(default_factory=AxisConfig)
    vertical: AxisConfig = field(
        default_factory=lambda: AxisConfig(axis=1, max_speed=3.0, max_acceleration=15.0, stroke_m=0.9)
    )
    home_position: Tuple[float, float] = (1.5, 0.45)


@dataclass
class DecisionConfig:
    model_path: str = "models/rl_agent.pt"
    reaction_threshold_s: float = 0.15
    confidence_threshold: float = 0.8
    return_to_center: bool = True


@dataclass
class PaddleConfig:
    width_m: float = 0.6
    height_m: float = 0.4


@dataclass
class GoalConfig:
    width: float = 3.0
    height: float = 0.9


@dataclass
class SafetyConfig:
    max_force_n: float = 500.0
    emergency_stop_pin: int = 17
    watchdog_timeout_s: float = 1.0
    pool_boundary_margin_m: float = 0.05


@dataclass
class CalibrationConfig:
    grid_points_h: int = 5
    grid_points_v: int = 3
    settle_time_s: float = 0.5
    data_file: str = "calibration_data.yaml"


@dataclass
class SystemConfig:
    mode: str = "live"
    log_level: str = "INFO"
    record: bool = False
    fps_target: int = 60


@dataclass
class AquaKeeperConfig:
    """Root configuration for the AquaKeeper system."""

    system: SystemConfig = field(default_factory=SystemConfig)
    goal: GoalConfig = field(default_factory=GoalConfig)
    camera: CameraConfig = field(default_factory=CameraConfig)
    detection: DetectionConfig = field(default_factory=DetectionConfig)
    prediction: PredictionConfig = field(default_factory=PredictionConfig)
    motor: MotorConfig = field(default_factory=MotorConfig)
    decision: DecisionConfig = field(default_factory=DecisionConfig)
    paddle: PaddleConfig = field(default_factory=PaddleConfig)
    calibration: CalibrationConfig = field(default_factory=CalibrationConfig)
    safety: SafetyConfig = field(default_factory=SafetyConfig)


def _apply_dict(obj, data: dict) -> None:
    """Recursively apply dictionary values to a dataclass instance."""
    for key, value in data.items():
        if hasattr(obj, key):
            attr = getattr(obj, key)
            if isinstance(value, dict) and hasattr(attr, "__dataclass_fields__"):
                _apply_dict(attr, value)
            elif isinstance(value, list) and isinstance(attr, tuple):
                setattr(obj, key, tuple(value))
            else:
                setattr(obj, key, value)


def load_config(path: str) -> AquaKeeperConfig:
    """Load configuration from a YAML file.

    Args:
        path: Path to the YAML configuration file.

    Returns:
        Populated AquaKeeperConfig instance.

    Raises:
        FileNotFoundError: If the configuration file does not exist.
    """
    if not os.path.isfile(path):
        raise FileNotFoundError(f"Configuration file not found: {path}")

    with open(path, "r") as fh:
        data = yaml.safe_load(fh) or {}

    cfg = AquaKeeperConfig()
    _apply_dict(cfg, data)
    return cfg
