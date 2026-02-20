# 🏊 AquaKeeper — Automated Water Polo Goalkeeper System

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![Platform](https://img.shields.io/badge/Platform-Raspberry%20Pi%204%2F5-green.svg)](https://www.raspberrypi.com/)

> A high-speed, AI-powered automated goalkeeper system designed for water polo pools. Uses computer vision for real-time ball detection, machine-learning trajectory prediction, and precision linear actuators to block shots with full goal coverage.

---

## Table of Contents

1. [Overview](#overview)
2. [Key Features](#key-features)
3. [System Architecture](#system-architecture)
4. [Hardware Requirements](#hardware-requirements)
5. [Software Requirements](#software-requirements)
6. [Quick Start](#quick-start)
7. [How to Build](#how-to-build)
8. [How to Run](#how-to-run)
9. [Training the Model](#training-the-model)
10. [Testing](#testing)
11. [Project Structure](#project-structure)
12. [Documentation](#documentation)
13. [Troubleshooting](#troubleshooting)
14. [Contributing](#contributing)
15. [License](#license)

---

## Overview

**AquaKeeper** is a fully automated goalkeeper mechanism for water polo pools. It mounts onto a standard water polo goal frame (3 m × 0.9 m) and uses:

- **Stereo cameras** for real-time ball detection and depth estimation
- **A convolutional neural network (CNN)** for ball recognition under varying water/light conditions
- **A Kalman-filter trajectory predictor** combined with an LSTM network for shot-direction forecasting
- **High-speed linear actuators** driving a blocking paddle along horizontal and vertical rails to intercept the ball

The system operates at **≥ 60 fps** detection rate with an end-to-end latency of **< 50 ms** from detection to paddle movement.

---

## Key Features

| Feature | Description |
|---|---|
| **Real-Time Ball Detection** | Stereo-camera vision pipeline at 60+ fps using YOLOv8 optimized for water polo balls |
| **Trajectory Prediction** | Kalman filter + LSTM ensemble predicts impact point within ±5 cm accuracy |
| **Full Goal Coverage** | 2-axis linear rail system covers the entire 3 m × 0.9 m goal area |
| **High-Speed Actuation** | Brushless DC linear actuators reaching 4 m/s traverse speed |
| **Waterproof Design** | IP68-rated enclosures for all electronics; marine-grade stainless steel frame |
| **Intelligent Decision Making** | Reinforcement-learning agent trained on 100k+ simulated shots |
| **Low Latency** | End-to-end response time < 50 ms |
| **Modular Architecture** | Swap cameras, actuators, or compute modules independently |

---

## System Architecture

See **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** for full details.

```
┌──────────────┐    ┌───────────────────┐    ┌──────────────────┐
│  Stereo       │───▶│  Ball Detection    │───▶│  Trajectory      │
│  Camera Pair  │    │  (YOLOv8 + depth) │    │  Prediction      │
└──────────────┘    └───────────────────┘    │  (Kalman + LSTM) │
                                              └────────┬─────────┘
                                                       │
                                                       ▼
                    ┌───────────────────┐    ┌──────────────────┐
                    │  Motor Controller │◀───│  Decision Engine │
                    │  (H-axis + V-axis)│    │  (RL Agent)      │
                    └────────┬──────────┘    └──────────────────┘
                             │
                             ▼
                    ┌───────────────────┐
                    │  Blocking Paddle  │
                    │  (Goal Coverage)  │
                    └───────────────────┘
```

---

## Hardware Requirements

See **[BILL_OF_MATERIALS.md](docs/BILL_OF_MATERIALS.md)** for the complete parts list.

| Component | Specification |
|---|---|
| Compute Module | Raspberry Pi 5 (8 GB) or NVIDIA Jetson Orin Nano |
| Cameras | 2× OAK-D Lite stereo cameras (120 fps, global shutter) |
| Horizontal Actuator | Brushless DC linear actuator, 3 m stroke, 4 m/s |
| Vertical Actuator | Brushless DC linear actuator, 0.9 m stroke, 3 m/s |
| Motor Drivers | 2× ODrive S1 brushless controllers |
| Blocking Paddle | 0.6 m × 0.4 m HDPE panel, marine-grade |
| Frame | 316L stainless steel rail system, bolted to goal posts |
| Power Supply | 48 V / 20 A DC supply (poolside, GFCI-protected) |
| Enclosures | IP68 polycarbonate housings |

---

## Software Requirements

- Python 3.10+
- OpenCV 4.8+
- PyTorch 2.0+
- Ultralytics (YOLOv8)
- NumPy, SciPy
- RPi.GPIO or Jetson.GPIO
- ODrive Python library

Install all dependencies:

```bash
cd aqua-goalkeeper
pip install -r requirements.txt
```

---

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/Karthik321-coder/askbot-2.O.git
cd askbot-2.O/aqua-goalkeeper

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run system diagnostics
python -m src.goalkeeper_system --diagnostics

# 4. Start the goalkeeper
python -m src.goalkeeper_system --config config.yaml
```

---

## How to Build

See **[BUILD_GUIDE.md](docs/BUILD_GUIDE.md)** for the complete step-by-step assembly instructions.

### Summary

1. **Assemble the rail frame** — Mount horizontal and vertical linear rails onto the goal frame
2. **Install actuators** — Attach brushless linear actuators to both axes
3. **Mount the paddle** — Secure the HDPE blocking paddle to the carriage
4. **Install cameras** — Position stereo cameras above the goal looking into the pool
5. **Wire electronics** — Connect motor drivers, compute module, and power supply
6. **Waterproof** — Seal all enclosures, apply marine-grade sealant to cable pass-throughs
7. **Calibrate** — Run the calibration routine to map camera coordinates to paddle positions
8. **Test** — Execute the full test suite

---

## How to Run

### Calibration Mode

```bash
python -m src.goalkeeper_system --calibrate
```

This moves the paddle to known positions while the cameras record reference points. Required once after installation or after any physical adjustment.

### Live Mode

```bash
python -m src.goalkeeper_system --config config.yaml
```

### Simulation Mode (no hardware)

```bash
python -m src.goalkeeper_system --simulate
```

Runs the full detection and prediction pipeline against synthetic ball trajectories for testing without physical hardware.

### Command-Line Options

| Flag | Description |
|---|---|
| `--config <file>` | Path to YAML configuration file |
| `--calibrate` | Run camera-to-actuator calibration |
| `--simulate` | Run in simulation mode (no hardware) |
| `--diagnostics` | Run hardware diagnostics |
| `--log-level <level>` | Set log level (DEBUG, INFO, WARNING, ERROR) |
| `--record` | Record video and telemetry for later review |

---

## Training the Model

See **[training/README.md](training/README.md)** for full training instructions.

```bash
# Train the ball detection model
python training/train_detector.py --data training/data/water_polo_balls.yaml --epochs 100

# Train the trajectory LSTM
python training/train_trajectory.py --data training/data/trajectories.csv --epochs 200

# Train the RL decision agent
python training/train_rl_agent.py --episodes 100000
```

---

## Testing

See **[TESTING.md](docs/TESTING.md)** for the complete test plan.

```bash
# Unit tests
python -m pytest tests/ -v

# Integration tests (requires hardware or simulation mode)
python -m pytest tests/ -v -m integration

# Performance benchmarks
python -m pytest tests/ -v -m benchmark
```

---

## Project Structure

```
aqua-goalkeeper/
├── README.md                    # This file
├── requirements.txt             # Python dependencies
├── config.yaml                  # Default configuration
├── docs/
│   ├── ARCHITECTURE.md          # System architecture
│   ├── DESIGN.md                # Mechanical & hardware design
│   ├── BUILD_GUIDE.md           # Step-by-step build instructions
│   ├── BILL_OF_MATERIALS.md     # Complete parts list
│   ├── TESTING.md               # Test plan & procedures
│   └── images/                  # Diagrams and renderings
├── src/
│   ├── __init__.py
│   ├── ball_detection.py        # Computer vision pipeline
│   ├── trajectory_prediction.py # Kalman + LSTM predictor
│   ├── motor_controller.py      # Actuator control
│   ├── decision_engine.py       # RL-based shot blocking logic
│   ├── goalkeeper_system.py     # Main system orchestrator
│   ├── camera.py                # Camera interface
│   ├── calibration.py           # Camera-to-actuator calibration
│   └── config.py                # Configuration loader
├── hardware/
│   ├── frame_design.scad        # OpenSCAD 3D model — rail frame
│   ├── paddle_design.scad       # OpenSCAD 3D model — blocking paddle
│   ├── enclosure_design.scad    # OpenSCAD 3D model — electronics enclosure
│   ├── wiring_diagram.md        # Electrical wiring reference
│   └── specifications.md        # Component specifications
├── training/
│   ├── README.md                # Training instructions
│   ├── train_detector.py        # YOLOv8 fine-tuning script
│   ├── train_trajectory.py      # LSTM training script
│   ├── train_rl_agent.py        # Reinforcement learning training
│   └── data/                    # Training data configs
├── models/                      # Saved model weights (git-ignored)
└── tests/
    ├── __init__.py
    ├── test_ball_detection.py   # Ball detection unit tests
    ├── test_trajectory.py       # Trajectory prediction tests
    ├── test_motor_controller.py # Motor control tests
    ├── test_decision_engine.py  # Decision engine tests
    └── test_integration.py      # End-to-end integration tests
```

---

## Documentation

| Document | Description |
|---|---|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Full system architecture with data-flow diagrams |
| [DESIGN.md](docs/DESIGN.md) | Mechanical design, 3D models, waterproofing |
| [BUILD_GUIDE.md](docs/BUILD_GUIDE.md) | Step-by-step build and assembly guide |
| [BILL_OF_MATERIALS.md](docs/BILL_OF_MATERIALS.md) | Components, quantities, and sourcing |
| [TESTING.md](docs/TESTING.md) | Test procedures for every subsystem |
| [training/README.md](training/README.md) | Model training guide |

---

## Troubleshooting

| Problem | Solution |
|---|---|
| Camera not detected | Check USB connections; run `python -m src.camera --list` |
| Motor not responding | Verify ODrive firmware; run `python -m src.motor_controller --diagnostics` |
| High detection latency | Reduce resolution in `config.yaml`; ensure GPU acceleration is enabled |
| Poor ball detection in bright light | Adjust exposure in camera settings; retrain detector with augmented data |
| Paddle not reaching corners | Recalibrate with `--calibrate`; check rail alignment |

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-improvement`)
3. Commit your changes (`git commit -m "Add improvement"`)
4. Push to the branch (`git push origin feature/my-improvement`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License — see the [LICENSE](../LICENSE) file for details.
