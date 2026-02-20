# AquaKeeper — Test Plan & Procedures

## 1. Test Categories

| Category | Scope | Hardware Required |
|---|---|---|
| **Unit Tests** | Individual Python modules | None (mocked) |
| **Integration Tests** | Multi-module interactions | Simulation mode |
| **Hardware Tests** | Physical actuator and sensor checks | Full hardware |
| **Performance Benchmarks** | Latency, accuracy, speed | Full hardware |
| **Live Prototype Tests** | Real ball shots at goal | Full system + pool |

---

## 2. Unit Tests

Run with: `python -m pytest tests/ -v -m "not integration and not benchmark"`

### 2.1 Ball Detection (`tests/test_ball_detection.py`)

| Test | Description | Pass Criteria |
|---|---|---|
| `test_detect_ball_in_frame` | Detect ball in a synthetic image | Bounding box IoU ≥ 0.7 with ground truth |
| `test_no_false_positive` | No detection in an empty pool image | Zero detections returned |
| `test_confidence_threshold` | Low-confidence detections filtered | Only detections ≥ threshold returned |
| `test_multiple_balls` | Handle multiple balls in frame | Correct count and positions |
| `test_occluded_ball` | Partially occluded ball detection | Detection with reduced confidence |

### 2.2 Trajectory Prediction (`tests/test_trajectory.py`)

| Test | Description | Pass Criteria |
|---|---|---|
| `test_kalman_straight_shot` | Predict a straight-line trajectory | Impact point error < 10 cm |
| `test_kalman_curved_shot` | Predict a gravity-affected arc | Impact point error < 15 cm |
| `test_lstm_prediction` | LSTM prediction on known sequence | Impact point error < 10 cm |
| `test_ensemble_fusion` | Ensemble beats individual predictors | Ensemble error ≤ min(Kalman, LSTM) |
| `test_insufficient_observations` | Fewer than min observations | Returns None (no prediction) |

### 2.3 Motor Controller (`tests/test_motor_controller.py`)

| Test | Description | Pass Criteria |
|---|---|---|
| `test_position_command` | Send position, verify command sent | Correct position value in command |
| `test_velocity_limit` | Command exceeding max speed | Speed clamped to limit |
| `test_boundary_clamp` | Position outside rail range | Clamped to valid range |
| `test_emergency_stop` | E-stop signal disables motors | Motors disabled within 1 ms |
| `test_home_position` | Move to center | Position reaches center ± 5 mm |

### 2.4 Decision Engine (`tests/test_decision_engine.py`)

| Test | Description | Pass Criteria |
|---|---|---|
| `test_high_confidence_shot` | Confident prediction → move paddle | Target position matches prediction |
| `test_low_confidence` | Low confidence → hold center | Paddle stays at center |
| `test_time_pressure` | Very short time → commit | Uses last prediction immediately |
| `test_return_to_center` | After action → return to center | Paddle returns within 2 s |

---

## 3. Integration Tests

Run with: `python -m pytest tests/ -v -m integration`

### 3.1 Detection-to-Prediction Pipeline (`tests/test_integration.py`)

| Test | Description | Pass Criteria |
|---|---|---|
| `test_pipeline_synthetic_trajectory` | Synthetic ball moving toward goal | Predicted impact within 10 cm |
| `test_pipeline_latency` | Measure end-to-end pipeline time | Total < 20 ms (excl. actuator) |
| `test_full_loop_simulation` | Full system in simulation mode | Paddle moves to correct position |

### 3.2 System Startup & Shutdown

| Test | Description | Pass Criteria |
|---|---|---|
| `test_graceful_startup` | System initializes all subsystems | No errors; all health checks pass |
| `test_graceful_shutdown` | Clean shutdown on SIGINT | Motors disabled; resources released |
| `test_camera_disconnect` | Simulate camera failure | System logs error; enters safe mode |
| `test_motor_disconnect` | Simulate ODrive disconnection | Emergency stop triggered |

---

## 4. Hardware Tests

These tests require the physical system. Run individually at the poolside.

### 4.1 Actuator Range Test

```bash
python -m src.motor_controller --test range
```

| Check | Pass Criteria |
|---|---|
| Horizontal full stroke | Paddle reaches both ends within ± 5 mm |
| Vertical full stroke | Paddle reaches top and bottom within ± 5 mm |
| Diagonal motion | Paddle reaches all 4 corners |
| Return to center | Paddle returns to center within ± 5 mm |

### 4.2 Speed Test

```bash
python -m src.motor_controller --test speed
```

| Check | Pass Criteria |
|---|---|
| Horizontal max speed | ≥ 4 m/s measured over 2 m run |
| Vertical max speed | ≥ 3 m/s measured over 0.5 m run |
| Corner-to-corner time | < 1.2 s for diagonal traverse |

### 4.3 Camera Test

```bash
python -m src.camera --test
```

| Check | Pass Criteria |
|---|---|
| Left camera frame rate | ≥ 120 fps |
| Right camera frame rate | ≥ 120 fps |
| Stereo synchronization | Frame timestamp delta < 1 ms |
| Depth estimation accuracy | Error < 5 cm at 5 m distance |

### 4.4 Emergency Stop Test

```bash
python -m src.goalkeeper_system --test estop
```

| Check | Pass Criteria |
|---|---|
| E-stop button press | Motors disabled within 10 ms |
| Motor power cut | Verified by current measurement |
| System recovery | After E-stop release, system resumes cleanly |

---

## 5. Performance Benchmarks

Run with: `python -m pytest tests/ -v -m benchmark`

### 5.1 Detection Latency

| Metric | Target | Measurement Method |
|---|---|---|
| YOLOv8 inference time | < 10 ms | Average over 1000 frames |
| Depth lookup time | < 1 ms | Average over 1000 lookups |
| Total detection latency | < 12 ms | End-to-end per frame |

### 5.2 Prediction Accuracy

| Metric | Target | Measurement Method |
|---|---|---|
| Impact point error (straight shots) | < 5 cm | 100 synthetic trajectories |
| Impact point error (curved shots) | < 10 cm | 100 synthetic trajectories |
| Time-to-impact estimation error | < 20 ms | 100 synthetic trajectories |

### 5.3 System Throughput

| Metric | Target | Measurement Method |
|---|---|---|
| Pipeline frame rate | ≥ 60 fps | Sustained over 60 s |
| Motor command rate | ≥ 1000 Hz | Measured at ODrive input |

---

## 6. Live Prototype Testing

### 6.1 Test Setup

1. Install the AquaKeeper on a standard water polo goal in a pool
2. Mark shooting positions at 5 m, 8 m, 10 m, and 12 m from the goal
3. Mark target zones on the goal (9 zones: 3×3 grid)
4. Ensure the system is calibrated and running in live mode
5. Video record all tests for review

### 6.2 Shot Blocking Tests

#### Test Protocol

For each distance and target zone:
1. Shooter aims at the designated zone
2. Shooter throws the ball at match-level speed (~15–20 m/s)
3. Record: detected (Y/N), predicted zone, actual zone, blocked (Y/N)
4. Repeat 10 times per zone per distance

#### Target Metrics

| Distance | Detection Rate | Prediction Accuracy | Block Rate |
|---|---|---|---|
| 5 m | ≥ 95 % | ≥ 70 % correct zone | ≥ 50 % |
| 8 m | ≥ 98 % | ≥ 80 % correct zone | ≥ 65 % |
| 10 m | ≥ 99 % | ≥ 85 % correct zone | ≥ 75 % |
| 12 m | ≥ 99 % | ≥ 90 % correct zone | ≥ 80 % |

### 6.3 Corner Coverage Test

1. Shoot balls directly at each of the 4 goal corners from 8 m
2. 20 shots per corner
3. Pass: paddle reaches the correct corner in ≥ 80 % of attempts

### 6.4 Rapid Fire Test

1. 3 shooters alternate shots with < 3 s between shots
2. 30 total shots
3. Pass: system detects and responds to ≥ 90 % of shots

### 6.5 Environmental Robustness

| Condition | Test | Pass Criteria |
|---|---|---|
| Bright sunlight | Test at midday, outdoor pool | Detection rate ≥ 90 % |
| Artificial lighting | Test under pool floodlights | Detection rate ≥ 95 % |
| Splash interference | Shoot through active splash zone | Detection rate ≥ 85 % |
| Wet lens | Spray water on camera domes | Detection rate ≥ 80 % |

---

## 7. Training Validation Tests

### 7.1 Ball Detector Training

```bash
python training/train_detector.py --data training/data/water_polo_balls.yaml --epochs 100
```

| Metric | Target |
|---|---|
| mAP@0.5 on validation set | ≥ 0.90 |
| mAP@0.5:0.95 on validation set | ≥ 0.70 |
| Inference time (640×640 input) | < 10 ms |

### 7.2 Trajectory LSTM Training

```bash
python training/train_trajectory.py --data training/data/trajectories.csv --epochs 200
```

| Metric | Target |
|---|---|
| Mean absolute error (impact point) | < 8 cm |
| R² score (impact position) | ≥ 0.95 |

### 7.3 RL Agent Training

```bash
python training/train_rl_agent.py --episodes 100000
```

| Metric | Target |
|---|---|
| Mean reward (last 1000 episodes) | ≥ 0.75 |
| Block rate in simulation | ≥ 80 % |

---

## 8. Running the Full Test Suite

```bash
# All unit tests
python -m pytest tests/ -v -m "not integration and not benchmark"

# Integration tests (simulation mode)
python -m pytest tests/ -v -m integration

# Performance benchmarks
python -m pytest tests/ -v -m benchmark

# All tests
python -m pytest tests/ -v

# With coverage report
python -m pytest tests/ -v --cov=src --cov-report=html
```
