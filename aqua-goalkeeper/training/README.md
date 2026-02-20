# AquaKeeper — Model Training Guide

## Overview

AquaKeeper uses three trained models:

| Model | Purpose | Architecture |
|---|---|---|
| Ball Detector | Detect water polo balls in camera frames | YOLOv8-Nano (fine-tuned) |
| Trajectory LSTM | Predict ball impact point from observation sequence | 2-layer LSTM, 128 hidden |
| RL Decision Agent | Choose optimal paddle position | 3-layer MLP, PPO-trained |

---

## 1. Ball Detector Training

### Dataset

- **Source:** Manually annotated water polo match footage
- **Size:** 10,000+ annotated frames
- **Format:** YOLO format (one `.txt` label file per image)
- **Classes:** 1 (`water_polo_ball`)
- **Augmentations applied during training:**
  - Random brightness/contrast (simulating pool lighting variation)
  - Gaussian blur (simulating water splash)
  - Random crop and resize
  - Horizontal flip
  - Mosaic augmentation

### Configuration

See `data/water_polo_balls.yaml` for the dataset layout.

### Train

```bash
python training/train_detector.py \
    --data training/data/water_polo_balls.yaml \
    --epochs 100 \
    --batch-size 16 \
    --img-size 640 \
    --model yolov8n.pt
```

### Expected Results

| Metric | Target |
|---|---|
| mAP@0.5 | ≥ 0.90 |
| mAP@0.5:0.95 | ≥ 0.70 |
| Inference time | < 10 ms on RPi 5 with GPU |

### Export for Deployment

The training script automatically exports the best weights to `models/ball_detector.pt`.

---

## 2. Trajectory LSTM Training

### Dataset

- **Source:** Recorded 3D ball trajectories from pool tests or physics simulation
- **Format:** CSV with columns `trajectory_id, step, x, y, z, timestamp`
- **Size:** 50,000+ trajectory sequences

### Train

```bash
python training/train_trajectory.py \
    --data training/data/trajectories.csv \
    --epochs 200 \
    --batch-size 64 \
    --lr 0.001 \
    --hidden-size 128 \
    --sequence-length 10
```

### Expected Results

| Metric | Target |
|---|---|
| Mean absolute error (impact X) | < 5 cm |
| Mean absolute error (impact Y) | < 5 cm |
| R² score | ≥ 0.95 |

### Export

The script saves the model as TorchScript to `models/trajectory_lstm.pt`.

---

## 3. RL Decision Agent Training

### Environment

The agent is trained in a custom Gymnasium environment that simulates:
- Random ball trajectories toward the goal
- Paddle physics (max speed, acceleration)
- Reward: +1 for blocking, −1 for miss, small penalty for distance traveled

### Train

```bash
python training/train_rl_agent.py \
    --episodes 100000 \
    --lr 0.0003 \
    --gamma 0.99 \
    --batch-size 2048 \
    --hidden-layers 256 128 64
```

### Expected Results

| Metric | Target |
|---|---|
| Mean reward (last 1k episodes) | ≥ 0.75 |
| Simulated block rate | ≥ 80 % |

### Export

The script saves the policy as TorchScript to `models/rl_agent.pt`.

---

## Generating Synthetic Training Data

If you don't have real pool footage, use the physics simulator:

```bash
python training/generate_trajectories.py \
    --num-trajectories 50000 \
    --output training/data/trajectories.csv
```

This generates realistic ball trajectories with:
- Variable launch speed (10–25 m/s)
- Variable angles
- Gravity and aerodynamic drag
- Gaussian noise to simulate measurement error

---

## Hardware Requirements for Training

| Model | Recommended GPU | Training Time |
|---|---|---|
| Ball Detector | NVIDIA RTX 3060+ (6 GB VRAM) | ~2 hours (100 epochs) |
| Trajectory LSTM | Any GPU or CPU | ~30 min (200 epochs) |
| RL Agent | CPU sufficient | ~1 hour (100k episodes) |

Training can be done on any machine — the exported models are deployed to the Raspberry Pi / Jetson.
