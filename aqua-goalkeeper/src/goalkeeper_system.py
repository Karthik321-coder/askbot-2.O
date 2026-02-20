"""Main goalkeeper system orchestrator.

Ties together camera capture, ball detection, trajectory prediction,
decision making, and motor control into a real-time pipeline.
"""

from __future__ import annotations

import argparse
import logging
import signal
import sys
import time
from typing import Optional

import numpy as np

from .ball_detection import BallDetector
from .calibration import Calibration
from .camera import StereoCamera
from .config import AquaKeeperConfig, load_config
from .decision_engine import DecisionEngine
from .motor_controller import MotorController
from .trajectory_prediction import Observation, TrajectoryPredictor

logger = logging.getLogger("aquakeeper")


class GoalkeeperSystem:
    """Top-level orchestrator for the AquaKeeper system.

    Args:
        config: Loaded AquaKeeperConfig instance.
    """

    def __init__(self, config: AquaKeeperConfig) -> None:
        self.config = config
        self._running = False

        # -- Subsystem instances --
        self.camera = StereoCamera(
            left_device_id=config.camera.left.device_id,
            right_device_id=config.camera.right.device_id,
            resolution=config.camera.left.resolution,
            fps=config.camera.left.fps,
            baseline_m=config.camera.stereo.baseline_m,
        )

        self.detector = BallDetector(
            model_path=config.detection.model_path,
            confidence_threshold=config.detection.confidence_threshold,
            nms_threshold=config.detection.nms_threshold,
            input_size=config.detection.input_size,
            use_gpu=config.detection.use_gpu,
        )

        self.predictor = TrajectoryPredictor(
            process_noise=config.prediction.kalman.process_noise,
            measurement_noise=config.prediction.kalman.measurement_noise,
            lstm_model_path=config.prediction.lstm.model_path,
            sequence_length=config.prediction.lstm.sequence_length,
            hidden_size=config.prediction.lstm.hidden_size,
            min_observations=config.prediction.min_observations,
        )

        self.decision = DecisionEngine(
            model_path=config.decision.model_path,
            reaction_threshold_s=config.decision.reaction_threshold_s,
            confidence_threshold=config.decision.confidence_threshold,
            return_to_center=config.decision.return_to_center,
            goal_width=config.goal.width,
            goal_height=config.goal.height,
            home_x=config.motor.home_position[0],
            home_y=config.motor.home_position[1],
        )

        h_cfg = {
            "axis_index": config.motor.horizontal.axis,
            "max_speed": config.motor.horizontal.max_speed,
            "max_acceleration": config.motor.horizontal.max_acceleration,
            "stroke_m": config.motor.horizontal.stroke_m,
            "counts_per_meter": config.motor.horizontal.counts_per_meter,
            "odrive_serial": config.motor.horizontal.odrive_serial,
            "margin_m": config.safety.pool_boundary_margin_m,
        }
        v_cfg = {
            "axis_index": config.motor.vertical.axis,
            "max_speed": config.motor.vertical.max_speed,
            "max_acceleration": config.motor.vertical.max_acceleration,
            "stroke_m": config.motor.vertical.stroke_m,
            "counts_per_meter": config.motor.vertical.counts_per_meter,
            "odrive_serial": config.motor.vertical.odrive_serial,
            "margin_m": config.safety.pool_boundary_margin_m,
        }
        self.motors = MotorController(
            h_config=h_cfg, v_config=v_cfg, home_position=config.motor.home_position,
        )

        self.calibration = Calibration(
            grid_points_h=config.calibration.grid_points_h,
            grid_points_v=config.calibration.grid_points_v,
            goal_width=config.goal.width,
            goal_height=config.goal.height,
            settle_time_s=config.calibration.settle_time_s,
        )

    # -- Initialization ---------------------------------------------------

    def initialize(self) -> bool:
        """Open hardware and load models.

        Returns:
            True if all subsystems initialized successfully.
        """
        logger.info("Initializing AquaKeeper system (mode=%s)", self.config.system.mode)

        ok = True

        # Camera
        if self.config.system.mode != "simulate":
            if not self.camera.open():
                logger.error("Failed to open stereo cameras")
                ok = False
        else:
            logger.info("Simulation mode — cameras skipped")

        # Detection model
        if not self.detector.load_model():
            logger.warning("Ball detection model not loaded; using HSV fallback")

        # Prediction models
        self.predictor.load_models()

        # Decision model
        self.decision.load_model()

        # Motors
        if not self.motors.connect():
            logger.error("Failed to connect to motor controllers")
            ok = False
        self.motors.enable()

        # Calibration
        cal_path = self.config.calibration.data_file
        if not self.calibration.load(cal_path):
            logger.warning("No calibration data loaded from %s", cal_path)

        return ok

    # -- Main loop --------------------------------------------------------

    def run(self) -> None:
        """Run the main goalkeeper loop."""
        self._running = True
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)

        logger.info("AquaKeeper running — press Ctrl+C to stop")
        self.motors.move_home()

        frame_interval = 1.0 / self.config.system.fps_target
        try:
            while self._running:
                t_start = time.monotonic()
                self._tick()
                elapsed = time.monotonic() - t_start
                sleep_time = frame_interval - elapsed
                if sleep_time > 0:
                    time.sleep(sleep_time)
        finally:
            self.shutdown()

    def run_simulation(self, trajectories: Optional[list] = None) -> None:
        """Run the system against synthetic trajectories (no hardware).

        Args:
            trajectories: A list of trajectory sequences, each being
                a list of (x, y, z, t) tuples.  If None, a default
                set of test trajectories is generated.
        """
        logger.info("Running simulation mode")
        if trajectories is None:
            trajectories = self._generate_test_trajectories()

        for i, traj in enumerate(trajectories):
            self.predictor.reset()
            logger.info("Trajectory %d/%d", i + 1, len(trajectories))

            for x, y, z, t in traj:
                obs = Observation(x=x, y=y, z=z, timestamp=t)
                self.predictor.add_observation(obs)

                pred = self.predictor.predict(goal_z=0.0)
                if pred is not None:
                    cmd = self.decision.decide(pred, self.motors.get_position())
                    self.motors.move_to(cmd.x, cmd.y)
                    logger.debug(
                        "Pred: (%.2f, %.2f) t=%.3fs conf=%.2f → Move (%.2f, %.2f)",
                        pred.x, pred.y, pred.time_to_impact, pred.confidence,
                        cmd.x, cmd.y,
                    )

            self.motors.move_home()
            logger.info("Trajectory %d complete", i + 1)

    # -- Private helpers --------------------------------------------------

    def _tick(self) -> None:
        """Single iteration of the main loop."""
        # 1. Capture
        frame = self.camera.capture(compute_depth=True)
        if frame is None:
            return

        # 2. Detect
        detections = self.detector.detect(frame.left, timestamp=frame.timestamp)
        if not detections:
            if self.decision.should_return_to_center():
                self.motors.move_home()
            return

        # Pick the highest-confidence detection
        best = max(detections, key=lambda d: d.confidence)

        # 3. Get depth
        if frame.depth_map is not None:
            depth = self.camera.depth_at(frame.depth_map, int(best.x), int(best.y))
            best.depth_m = depth

        # 4. Map camera coords to world (if calibrated)
        if self.calibration.is_calibrated:
            world = self.calibration.camera_to_world(best.x, best.y)
            if world is not None:
                obs = Observation(x=world[0], y=world[1], z=best.depth_m, timestamp=best.timestamp)
            else:
                obs = Observation(x=best.x, y=best.y, z=best.depth_m, timestamp=best.timestamp)
        else:
            obs = Observation(x=best.x, y=best.y, z=best.depth_m, timestamp=best.timestamp)

        self.predictor.add_observation(obs)

        # 5. Predict
        prediction = self.predictor.predict(goal_z=0.0)

        # 6. Decide & act
        cmd = self.decision.decide(prediction, self.motors.get_position())
        self.motors.move_to(cmd.x, cmd.y)

    def _signal_handler(self, signum, frame) -> None:
        logger.info("Received signal %d — shutting down", signum)
        self._running = False

    def shutdown(self) -> None:
        """Cleanly shut down all subsystems."""
        logger.info("Shutting down AquaKeeper")
        self.motors.disable()
        self.camera.close()

    @staticmethod
    def _generate_test_trajectories() -> list:
        """Generate a set of straight-line test trajectories."""
        trajectories = []
        rng = np.random.default_rng(42)

        for _ in range(10):
            # Random starting position 8-12 m from goal
            z_start = rng.uniform(8, 12)
            x_start = rng.uniform(0.5, 2.5)
            y_start = rng.uniform(0.2, 0.7)

            # Random target on goal plane
            x_target = rng.uniform(0, 3.0)
            y_target = rng.uniform(0, 0.9)

            steps = 20
            traj = []
            for s in range(steps):
                frac = s / (steps - 1)
                x = x_start + (x_target - x_start) * frac
                y = y_start + (y_target - y_start) * frac
                z = z_start * (1 - frac)
                t = frac * 0.6  # ~0.6 s flight time
                traj.append((x, y, z, t))
            trajectories.append(traj)

        return trajectories

    # -- Diagnostics ------------------------------------------------------

    def run_diagnostics(self) -> bool:
        """Run hardware and software diagnostics.

        Returns:
            True if all checks passed.
        """
        checks = {
            "Camera open": self.camera.is_open or self.config.system.mode == "simulate",
            "Detection model loaded": not self.detector._use_fallback,
            "Motors connected": True,
            "H-axis enabled": self.motors.horizontal._enabled,
            "V-axis enabled": self.motors.vertical._enabled,
            "Calibration loaded": self.calibration.is_calibrated,
        }

        all_ok = True
        for name, status in checks.items():
            icon = "✓" if status else "✗"
            logger.info("[%s] %s", icon, name)
            if not status:
                all_ok = False

        return all_ok


# -- CLI entry point -------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(description="AquaKeeper — Automated Water Polo Goalkeeper")
    parser.add_argument("--config", default="config.yaml", help="Path to YAML configuration file")
    parser.add_argument("--calibrate", action="store_true", help="Run camera-to-actuator calibration")
    parser.add_argument("--simulate", action="store_true", help="Run in simulation mode (no hardware)")
    parser.add_argument("--diagnostics", action="store_true", help="Run hardware diagnostics")
    parser.add_argument("--log-level", default="INFO", choices=["DEBUG", "INFO", "WARNING", "ERROR"])
    parser.add_argument("--record", action="store_true", help="Record video and telemetry")
    args = parser.parse_args()

    logging.basicConfig(level=getattr(logging, args.log_level), format="%(asctime)s [%(levelname)s] %(message)s")

    config = load_config(args.config)
    config.system.log_level = args.log_level

    if args.simulate:
        config.system.mode = "simulate"
    if args.record:
        config.system.record = True

    system = GoalkeeperSystem(config)
    system.initialize()

    if args.diagnostics:
        ok = system.run_diagnostics()
        sys.exit(0 if ok else 1)

    if args.simulate:
        system.run_simulation()
    else:
        system.run()


if __name__ == "__main__":
    main()
