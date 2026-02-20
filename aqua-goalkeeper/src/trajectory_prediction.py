"""Trajectory prediction using Kalman filter and LSTM ensemble.

Predicts where the ball will cross the goal plane based on observed
3D positions over time.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import List, Optional, Tuple

import numpy as np
from scipy.linalg import block_diag


# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------

@dataclass
class Observation:
    """A single 3D ball observation."""

    x: float
    y: float
    z: float
    timestamp: float


@dataclass
class ImpactPrediction:
    """Predicted impact point on the goal plane."""

    x: float          # Horizontal position on the goal (meters)
    y: float          # Vertical position on the goal (meters)
    time_to_impact: float  # Seconds until impact
    confidence: float  # Prediction confidence [0, 1]


# ---------------------------------------------------------------------------
# Kalman Filter (physics-based)
# ---------------------------------------------------------------------------

class KalmanPredictor:
    """6-state Kalman filter: [x, y, z, vx, vy, vz].

    Assumes constant-velocity model with gravity acting on the y-axis
    and optional drag.

    Args:
        process_noise: Process noise scalar.
        measurement_noise: Measurement noise scalar.
        gravity: Gravitational acceleration (m/s²), applied to y-axis.
    """

    GRAVITY = 9.81  # m/s², acts downward on y

    def __init__(
        self,
        process_noise: float = 0.01,
        measurement_noise: float = 0.1,
        gravity: float = GRAVITY,
    ) -> None:
        self.process_noise = process_noise
        self.measurement_noise = measurement_noise
        self.gravity = gravity

        # State: [x, y, z, vx, vy, vz]
        self.state = np.zeros(6)
        self.P = np.eye(6) * 1.0  # Covariance
        self._initialized = False

    def reset(self) -> None:
        """Reset the filter state."""
        self.state = np.zeros(6)
        self.P = np.eye(6) * 1.0
        self._initialized = False

    def update(self, obs: Observation, dt: float) -> None:
        """Incorporate a new observation.

        Args:
            obs: 3D ball observation.
            dt: Time elapsed since the previous observation (seconds).
        """
        if not self._initialized:
            self.state[:3] = [obs.x, obs.y, obs.z]
            self._initialized = True
            return

        # -- Predict step --
        F = np.eye(6)
        F[0, 3] = dt
        F[1, 4] = dt
        F[2, 5] = dt

        # Gravity control input
        B = np.zeros(6)
        B[4] = -0.5 * self.gravity * dt * dt
        B[1] = -0.5 * self.gravity * dt * dt

        Q = np.eye(6) * self.process_noise * dt
        self.state = F @ self.state + B
        self.state[4] -= self.gravity * dt  # velocity update for gravity
        self.P = F @ self.P @ F.T + Q

        # -- Update step --
        H = np.zeros((3, 6))
        H[0, 0] = 1
        H[1, 1] = 1
        H[2, 2] = 1

        R = np.eye(3) * self.measurement_noise
        z = np.array([obs.x, obs.y, obs.z])
        y_res = z - H @ self.state
        S = H @ self.P @ H.T + R
        K = self.P @ H.T @ np.linalg.inv(S)
        self.state = self.state + K @ y_res
        self.P = (np.eye(6) - K @ H) @ self.P

    def predict_impact(self, goal_z: float = 0.0) -> Optional[ImpactPrediction]:
        """Predict where the ball crosses *goal_z* on the z-axis.

        Args:
            goal_z: The z-coordinate of the goal plane.

        Returns:
            An ImpactPrediction, or None if the ball is not moving toward the goal.
        """
        if not self._initialized:
            return None

        x, y, z, vx, vy, vz = self.state.tolist()

        # Ball must be moving toward the goal (decreasing z toward goal_z)
        if vz >= 0 and z > goal_z:
            return None
        if vz <= 0 and z < goal_z:
            return None

        dz = goal_z - z
        if abs(vz) < 1e-6:
            return None

        t_impact = dz / vz
        if t_impact < 0:
            return None

        x_impact = x + vx * t_impact
        y_impact = y + vy * t_impact - 0.5 * self.gravity * t_impact ** 2

        # Confidence decreases with prediction horizon
        confidence = max(0.0, min(1.0, 1.0 - t_impact * 0.5))

        return ImpactPrediction(
            x=x_impact, y=y_impact, time_to_impact=t_impact, confidence=confidence
        )


# ---------------------------------------------------------------------------
# LSTM Predictor (stub — loads a trained PyTorch model when available)
# ---------------------------------------------------------------------------

class LSTMPredictor:
    """LSTM-based trajectory predictor.

    Uses a sequence of recent 3D observations to predict the impact point.
    Falls back to ``None`` when the PyTorch model is not available.

    Args:
        model_path: Path to the trained ``.pt`` model.
        sequence_length: Number of observations in the input window.
        hidden_size: LSTM hidden dimension (must match the trained model).
    """

    def __init__(
        self,
        model_path: str = "models/trajectory_lstm.pt",
        sequence_length: int = 10,
        hidden_size: int = 128,
    ) -> None:
        self.model_path = model_path
        self.sequence_length = sequence_length
        self.hidden_size = hidden_size
        self._model = None

    def load_model(self) -> bool:
        """Attempt to load the PyTorch LSTM model.

        Returns:
            True if loaded successfully.
        """
        try:
            import torch

            self._model = torch.jit.load(self.model_path, map_location="cpu")
            self._model.eval()
            return True
        except Exception:
            self._model = None
            return False

    def predict(self, observations: List[Observation]) -> Optional[ImpactPrediction]:
        """Predict the impact point from a sequence of observations.

        Args:
            observations: Recent observations (newest last).

        Returns:
            An ImpactPrediction, or None if prediction is not possible.
        """
        if self._model is None:
            return None
        if len(observations) < self.sequence_length:
            return None

        try:
            import torch

            seq = observations[-self.sequence_length:]
            t0 = seq[0].timestamp
            data = np.array([[o.x, o.y, o.z, o.timestamp - t0] for o in seq], dtype=np.float32)
            tensor = torch.tensor(data).unsqueeze(0)  # (1, seq_len, 4)

            with torch.no_grad():
                output = self._model(tensor).squeeze(0).numpy()

            return ImpactPrediction(
                x=float(output[0]),
                y=float(output[1]),
                time_to_impact=float(output[2]),
                confidence=float(np.clip(output[3], 0, 1)) if len(output) > 3 else 0.8,
            )
        except Exception:
            return None


# ---------------------------------------------------------------------------
# Ensemble predictor
# ---------------------------------------------------------------------------

class TrajectoryPredictor:
    """Ensemble of Kalman filter and LSTM for robust prediction.

    The ensemble weighting adapts based on how many observations have
    been collected: the Kalman filter dominates early (few samples),
    and the LSTM gains weight as more data becomes available.

    Args:
        process_noise: Kalman process noise.
        measurement_noise: Kalman measurement noise.
        lstm_model_path: Path to trained LSTM weights.
        sequence_length: LSTM input window.
        hidden_size: LSTM hidden dimension.
        min_observations: Minimum observations before producing a prediction.
    """

    def __init__(
        self,
        process_noise: float = 0.01,
        measurement_noise: float = 0.1,
        lstm_model_path: str = "models/trajectory_lstm.pt",
        sequence_length: int = 10,
        hidden_size: int = 128,
        min_observations: int = 3,
    ) -> None:
        self.min_observations = min_observations
        self._kalman = KalmanPredictor(process_noise, measurement_noise)
        self._lstm = LSTMPredictor(lstm_model_path, sequence_length, hidden_size)
        self._observations: List[Observation] = []
        self._prev_timestamp: Optional[float] = None

    def load_models(self) -> None:
        """Load any ML models (LSTM)."""
        self._lstm.load_model()

    def reset(self) -> None:
        """Clear all observations and reset filters."""
        self._kalman.reset()
        self._observations.clear()
        self._prev_timestamp = None

    def add_observation(self, obs: Observation) -> None:
        """Feed a new 3D observation into the predictor.

        Args:
            obs: The 3D ball observation with timestamp.
        """
        dt = 0.0
        if self._prev_timestamp is not None:
            dt = obs.timestamp - self._prev_timestamp
        self._prev_timestamp = obs.timestamp

        self._kalman.update(obs, dt)
        self._observations.append(obs)

    def predict(self, goal_z: float = 0.0) -> Optional[ImpactPrediction]:
        """Predict the impact point on the goal plane.

        Args:
            goal_z: Z-coordinate of the goal plane.

        Returns:
            An ImpactPrediction, or None if insufficient data.
        """
        if len(self._observations) < self.min_observations:
            return None

        kalman_pred = self._kalman.predict_impact(goal_z)
        lstm_pred = self._lstm.predict(self._observations)

        if kalman_pred is None and lstm_pred is None:
            return None
        if kalman_pred is None:
            return lstm_pred
        if lstm_pred is None:
            return kalman_pred

        # Adaptive weighting: LSTM weight increases with observation count
        n = len(self._observations)
        lstm_weight = min(0.7, n / 20.0)
        kalman_weight = 1.0 - lstm_weight

        x = kalman_weight * kalman_pred.x + lstm_weight * lstm_pred.x
        y = kalman_weight * kalman_pred.y + lstm_weight * lstm_pred.y
        t = kalman_weight * kalman_pred.time_to_impact + lstm_weight * lstm_pred.time_to_impact
        c = kalman_weight * kalman_pred.confidence + lstm_weight * lstm_pred.confidence

        return ImpactPrediction(x=x, y=y, time_to_impact=t, confidence=c)

    @property
    def observation_count(self) -> int:
        return len(self._observations)
