# AquaKeeper — System Architecture

## 1. High-Level Overview

AquaKeeper is a closed-loop robotic goalkeeper system composed of five subsystems that operate in a real-time pipeline:

```
 SENSE  ──▶  DETECT  ──▶  PREDICT  ──▶  DECIDE  ──▶  ACT
(cameras)   (YOLOv8)    (Kalman+LSTM)   (RL agent)  (actuators)
```

**Design targets:**

| Metric | Target |
|---|---|
| Detection frame rate | ≥ 60 fps |
| End-to-end latency | < 50 ms |
| Positional accuracy | ± 5 cm at impact plane |
| Paddle traverse speed | 4 m/s horizontal, 3 m/s vertical |
| Goal coverage | 100 % of 3 m × 0.9 m goal area |

---

## 2. Subsystem Descriptions

### 2.1 Sensing Subsystem

```
┌────────────────────────────────────────────────────────────────┐
│                    STEREO CAMERA RIG                           │
│                                                                │
│  ┌──────────┐   30 cm baseline   ┌──────────┐                │
│  │  Left     │◄────────────────►│  Right    │                │
│  │  OAK-D    │                   │  OAK-D    │                │
│  │  Lite     │                   │  Lite     │                │
│  └─────┬────┘                   └─────┬────┘                │
│        │ USB 3.0                       │ USB 3.0              │
│        └──────────┬───────────────────┘                      │
│                   ▼                                            │
│           ┌──────────────┐                                    │
│           │  Compute     │                                    │
│           │  Module      │                                    │
│           └──────────────┘                                    │
└────────────────────────────────────────────────────────────────┘
```

- **Cameras:** 2 × OAK-D Lite with global shutter (eliminates motion blur)
- **Frame rate:** 120 fps per camera; stereo pair synchronized via hardware trigger
- **Depth estimation:** Stereo disparity map computed on-device (OAK-D Lite Myriad X VPU)
- **Mounting:** Above the goal crossbar, angled 30° downward, enclosed in IP68 housing

### 2.2 Detection Subsystem

```
Raw Frame (640×480)
       │
       ▼
┌─────────────────────┐
│  YOLOv8-Nano        │   < 8 ms inference (GPU)
│  Ball Detector       │
│  ─────────────────  │
│  Input: RGB frame    │
│  Output: [x,y,w,h,  │
│           confidence]│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Stereo Depth Lookup │   < 1 ms
│  ─────────────────  │
│  Input: 2D bbox      │
│  Output: 3D position │
│         (x, y, z) m  │
└──────────┬──────────┘
           │
           ▼
   Ball 3D position
   at timestamp t
```

- **Model:** YOLOv8-Nano, fine-tuned on water polo ball dataset (10 k annotated frames)
- **Augmentations during training:** Water surface reflections, variable lighting, partial occlusion by splash
- **Confidence threshold:** 0.7 (tunable in `config.yaml`)
- **Post-processing:** Non-maximum suppression (IoU threshold 0.4)
- **3D localization:** Stereo disparity at the detection bounding box center → depth via triangulation

### 2.3 Prediction Subsystem

```
3D Ball positions over time:
  p(t-9), p(t-8), ..., p(t)
            │
            ├──────────────┐
            ▼              ▼
   ┌──────────────┐  ┌──────────────┐
   │ Kalman Filter │  │ LSTM Network │
   │ (physics-     │  │ (learned     │
   │  based prior) │  │  dynamics)   │
   └──────┬───────┘  └──────┬───────┘
          │                  │
          ▼                  ▼
   ┌──────────────────────────────┐
   │  Weighted Ensemble Fusion    │
   │  ────────────────────────── │
   │  w_kalman × pred_kalman +   │
   │  w_lstm   × pred_lstm       │
   │                              │
   │  Weights adapted by recent   │
   │  prediction error             │
   └──────────────┬───────────────┘
                  │
                  ▼
       Predicted impact point
       (x_goal, y_goal, t_impact)
```

- **Kalman filter:** 6-state model (x, y, z, vx, vy, vz) with gravity and drag
- **LSTM:** 2-layer, 128-hidden-unit network trained on 50 k trajectory sequences
- **Ensemble weights:** Kalman weight starts at 0.7 (reliable with few observations), LSTM weight grows as more frames are observed
- **Output:** Predicted (x, y) where the ball will cross the goal plane, plus estimated time-to-impact

### 2.4 Decision Subsystem

```
┌─────────────────────────────────┐
│        Decision Engine          │
│  ─────────────────────────────  │
│                                 │
│  Inputs:                        │
│   • Predicted impact (x, y)    │
│   • Confidence score            │
│   • Time to impact              │
│   • Current paddle position     │
│                                 │
│  RL Policy Network:             │
│   • 3-layer MLP (256-128-64)   │
│   • Output: target (x, y)      │
│   • Trained via PPO on 100k+   │
│     simulated shots             │
│                                 │
│  Rules:                         │
│   • If confidence < threshold  │
│     → hold center position     │
│   • If time_to_impact < 0.15s  │
│     → commit to current pred   │
│   • After save/miss → return   │
│     to center                   │
└────────────────┬────────────────┘
                 │
                 ▼
         Target paddle position
         (x_target, y_target)
```

### 2.5 Actuation Subsystem

```
┌───────────────────────────────────────────────────────────────┐
│                      GOAL FRAME (3m × 0.9m)                  │
│                                                               │
│  ═══════════════ Horizontal Rail (3m) ══════════════════      │
│  ║                                                     ║      │
│  ║ Vertical  ┌──────────┐                   Vertical  ║      │
│  ║ Rail      │ BLOCKING │                   Rail      ║      │
│  ║ (0.9m)   │ PADDLE   │                   (0.9m)    ║      │
│  ║           │ 0.6×0.4m │                             ║      │
│  ║           └──────────┘                             ║      │
│  ║                                                     ║      │
│  ═════════════════════════════════════════════════════════     │
│                                                               │
│  Actuator specs:                                              │
│   • Horizontal: BLDC linear, 3m stroke, 4 m/s, 20 m/s²     │
│   • Vertical:   BLDC linear, 0.9m stroke, 3 m/s, 15 m/s²   │
│   • Controller: ODrive S1 (FOC, 100 kHz control loop)        │
│   • Feedback:   Absolute linear encoders, 8192 counts/m      │
└───────────────────────────────────────────────────────────────┘
```

- **Motion profile:** Trapezoidal velocity profile with jerk limiting for smooth motion
- **Position control:** ODrive runs field-oriented control (FOC) at 100 kHz; position commands sent at 1 kHz from the compute module
- **Homing:** Hall-effect limit switches at each rail end for absolute reference

---

## 3. Data Flow Diagram

```
                    Time (ms)
   0        8       10       12        16       50
   │        │        │        │         │        │
   ▼        ▼        ▼        ▼         ▼        ▼
 Capture → Detect → Depth → Predict → Decide → Paddle
 Frame     Ball     Map      Impact    Target   Arrives
           Bbox     Lookup   Point     Pos.
```

Each pipeline stage runs concurrently in its own thread, communicating via lock-free queues.

---

## 4. Software Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GoalkeeperSystem                         │
│                    (Orchestrator)                            │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │ Camera   │  │ Ball     │  │Trajectory│  │ Decision   │  │
│  │ Module   │  │ Detector │  │ Predictor│  │ Engine     │  │
│  │          │  │          │  │          │  │            │  │
│  │ camera.py│  │ ball_    │  │trajectory│  │ decision_  │  │
│  │          │  │detection │  │_predict. │  │ engine.py  │  │
│  │          │  │ .py      │  │ py       │  │            │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └─────┬──────┘  │
│       │              │              │               │        │
│       │    Frame     │   3D Pos     │  Impact Pt    │ Target │
│       └──────►───────┘──────►──────┘──────►────────┘───┐    │
│                                                         │    │
│  ┌─────────────────┐  ┌──────────────┐                 │    │
│  │ Motor Controller │◀─┘  Calibration │                 │    │
│  │ motor_controller │    │ calibration │                 │    │
│  │ .py              │    │ .py         │                 │    │
│  └──────────────────┘    └─────────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

### Thread Model

| Thread | Responsibility | Priority |
|---|---|---|
| `camera_thread` | Frame capture and depth computation | High |
| `detection_thread` | YOLOv8 inference on each frame | High |
| `prediction_thread` | Kalman + LSTM trajectory prediction | High |
| `decision_thread` | RL policy evaluation | Real-time |
| `motor_thread` | Actuator position command transmission | Real-time |
| `telemetry_thread` | Logging, recording, monitoring | Normal |

---

## 5. Communication Protocols

| Interface | Protocol | Rate |
|---|---|---|
| Camera → Compute | USB 3.0 | 120 fps × 2 cameras |
| Compute → ODrive | USB / CAN bus | 1 kHz command rate |
| ODrive → Encoders | SPI | 100 kHz |
| Emergency stop | GPIO (active-low) | Interrupt-driven |

---

## 6. Safety Architecture

```
┌──────────────────────────────────────────┐
│              Safety Monitor              │
│  ────────────────────────────────────── │
│                                          │
│  1. Watchdog timer (1 s timeout)         │
│     → If compute module hangs, motors   │
│       are disabled automatically         │
│                                          │
│  2. Emergency stop button (poolside)     │
│     → Hardware interrupt cuts motor      │
│       power via relay                    │
│                                          │
│  3. Soft limits                          │
│     → Paddle cannot move beyond 5 cm    │
│       from rail ends                     │
│                                          │
│  4. Force limiting                       │
│     → Motor current limited to cap      │
│       paddle impact force at 500 N      │
│                                          │
│  5. GFCI power protection               │
│     → All poolside AC circuits use      │
│       ground-fault circuit interrupters  │
└──────────────────────────────────────────┘
```

---

## 7. Performance Budget

| Stage | Target Latency | Measured (typical) |
|---|---|---|
| Frame capture | 8.3 ms (120 fps) | 8.3 ms |
| Ball detection (YOLOv8) | 8 ms | 6–10 ms |
| Depth lookup | 1 ms | 0.5 ms |
| Trajectory prediction | 2 ms | 1–3 ms |
| Decision engine | 1 ms | 0.5–1 ms |
| Motor command TX | 1 ms | 1 ms |
| Actuator response | 30 ms | 25–35 ms |
| **Total pipeline** | **< 50 ms** | **42–60 ms** |

---

## 8. Deployment Diagram

```
┌─ Poolside Cabinet ────────────────────────────┐
│  ┌──────────────┐    ┌─────────────────────┐  │
│  │ 48V/20A PSU  │    │ Raspberry Pi 5      │  │
│  │              ├────┤ (or Jetson Orin)     │  │
│  └──────┬───────┘    │                     │  │
│         │            │ USB 3.0 ×2 (cams)   │  │
│         │            │ USB (ODrive H)       │  │
│         │            │ USB (ODrive V)       │  │
│         │            │ GPIO (E-stop)        │  │
│         │            └──────┬──────────────┘  │
│  ┌──────┴───────┐           │                 │
│  │ GFCI Breaker │    IP68 cable glands        │
│  └──────────────┘           │                 │
└─────────────────────────────┼─────────────────┘
                              │
           ┌──────────────────┼──────────────────┐
           │  Pool-side goal  │                   │
           │  ┌───────────────┴────────────────┐ │
           │  │ Camera L ──── Rail ──── Camera R│ │
           │  │      ║                    ║     │ │
           │  │    Rail ╠═══ Paddle ═══╣ Rail   │ │
           │  │      ║                    ║     │ │
           │  │      ╚════════════════════╝     │ │
           │  └────────────────────────────────┘ │
           └─────────────────────────────────────┘
```
