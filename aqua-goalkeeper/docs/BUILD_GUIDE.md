# AquaKeeper — Step-by-Step Build Guide

## Prerequisites

### Tools Required

- Metric hex wrench set (M3–M10)
- Torque wrench (5–50 Nm range)
- Wire stripper / crimper
- Soldering iron (for encoder wires)
- Multimeter
- Spirit level
- Measuring tape (3 m+)
- Drill with stainless steel drill bits
- Threadlocker (Loctite 243, medium strength)

### Workspace

- Flat, clean surface at least 4 m × 2 m
- Access to a water polo goal for final installation
- Pool facility permission for installation and testing

---

## Phase 1: Frame Assembly

### Step 1.1 — Prepare the Horizontal Rails

1. Unpack both 3100 mm HGR25 horizontal rails
2. Inspect rail surfaces for damage or burrs
3. Clean rails with isopropyl alcohol
4. Slide 2 × HGW25 carriages onto each rail
5. Apply rail lubricant (Kluber Isoflex NBU 15)

### Step 1.2 — Prepare the Vertical Rails

1. Unpack both 1000 mm HGR15 vertical rails
2. Clean and lubricate as above
3. Slide 1 × HGW15 carriage onto each rail

### Step 1.3 — Assemble the Gantry Frame

1. Lay the top horizontal rail on a flat surface
2. Attach the vertical rail mounting plates to the horizontal carriages using M8 bolts (torque: 25 Nm)
3. Install the vertical rails onto the mounting plates
4. Attach the bottom horizontal rail to the bottom ends of the vertical rail mounting plates
5. Verify squareness: measure diagonals — they should be equal within 2 mm
6. Apply threadlocker to all frame bolts

### Step 1.4 — Install Mounting Brackets

1. Position 4 × U-brackets on the goal posts (2 per side)
2. Mark and drill mounting holes in the goal frame (M8 × 4 per bracket)
3. Bolt the gantry frame to the goal using the U-brackets
4. Verify level and plumb with spirit level
5. Torque all mounting bolts to 30 Nm

---

## Phase 2: Actuator Installation

### Step 2.1 — Horizontal Linear Motor

1. Mount the magnet track along the full length of the top horizontal rail
2. Attach the motor coil assembly to the horizontal carriage plate
3. Connect the 3-phase motor wires (use labeled connectors)
4. Mount the horizontal linear encoder along the rail
5. Connect encoder cable to the labeled port

### Step 2.2 — Vertical Linear Motor

1. Mount the magnet track along one vertical rail
2. Attach the motor coil to the vertical carriage plate
3. Connect 3-phase wires
4. Mount the vertical linear encoder
5. Connect encoder cable

### Step 2.3 — Install Limit Switches

1. Mount Hall-effect limit switches at all 4 rail ends
2. Connect each switch to the ODrive GPIO pins (see wiring diagram)
3. Verify each switch triggers when the carriage approaches within 10 mm

---

## Phase 3: Paddle Assembly

### Step 3.1 — Prepare the Paddle

1. Cut HDPE sheet to 600 mm × 400 mm × 12 mm (if not pre-cut)
2. Chamfer all edges to 10 mm radius using a router
3. Drill 4 × M6 mounting holes per the template (see `hardware/paddle_design.scad`)
4. Sand the surface lightly for texture

### Step 3.2 — Mount the Paddle

1. Attach the paddle to the vertical carriage plate using 4 × M6 × 30 mm bolts with nylon washers
2. Torque to 10 Nm
3. Verify the paddle moves freely on both axes without binding

---

## Phase 4: Electronics Installation

### Step 4.1 — Prepare the Enclosure

1. Open the IP68 polycarbonate enclosure (220 × 160 × 90 mm)
2. Install 6 × IP68 cable glands in the pre-drilled holes:
   - Power in (PG11)
   - Camera L USB (PG9)
   - Camera R USB (PG9)
   - Motor H (PG11)
   - Motor V (PG11)
   - E-stop (PG7)
3. Mount the DIN rail inside the enclosure
4. Apply a thin layer of silicone grease to the gasket

### Step 4.2 — Mount the Compute Module

1. Attach the Raspberry Pi 5 (or Jetson Orin Nano) to a DIN-rail adapter plate
2. Connect the heatsink / fan assembly
3. Snap onto the DIN rail inside the enclosure

### Step 4.3 — Mount the Motor Drivers

1. Attach 2 × ODrive S1 controllers to DIN-rail adapter plates
2. Snap onto the DIN rail beside the compute module
3. Label each ODrive: "H" (horizontal) and "V" (vertical)

### Step 4.4 — Wire the Power Supply

1. Mount the 48 V / 20 A PSU in the poolside cabinet
2. Connect AC input through the GFCI breaker
3. Run 10 AWG cable from PSU to enclosure through cable gland
4. Connect 48 V to both ODrive controllers (observe polarity)
5. Connect 48 V to the 5 V / 10 A DC-DC converter
6. Connect 5 V output to the Raspberry Pi USB-C power input

### Step 4.5 — Connect the Motors

1. Route motor H cable through cable gland to horizontal motor
2. Connect 3-phase wires: Match phase labels (A, B, C) on ODrive to motor
3. Connect encoder H cable to ODrive H encoder port
4. Repeat for vertical motor

### Step 4.6 — Connect the Cameras

1. Route USB 3.0 cable through cable gland to left camera mount
2. Route USB 3.0 cable through cable gland to right camera mount
3. Connect both to the Raspberry Pi USB 3.0 ports

### Step 4.7 — Install the Emergency Stop

1. Mount the E-stop mushroom button at the poolside, within reach of the operator
2. Wire the normally-closed contact to GPIO pin 17 on the Raspberry Pi
3. Wire a second contact to the ODrive enable pins (cuts motor power directly)
4. Test: pressing the E-stop should immediately disable all motor power

---

## Phase 5: Camera Installation

### Step 5.1 — Assemble Camera Housings

1. Insert each OAK-D Lite camera into its IP68 dome housing
2. Place a desiccant pack inside each housing
3. Apply anti-fog coating to the inside of each dome
4. Seal the housing and verify waterproofness (submerge for 1 hour, check for moisture)

### Step 5.2 — Mount Cameras

1. Attach the camera L bracket to the left side of the crossbar, 150 mm from the left post
2. Attach the camera R bracket to the right side, 300 mm from camera L (measured center to center)
3. Tilt both cameras 30° below horizontal
4. Tighten all bolts with vibration-damping grommets

---

## Phase 6: Software Setup

### Step 6.1 — Operating System

1. Flash Raspberry Pi OS (64-bit) onto a microSD card
2. Boot the Raspberry Pi, complete initial setup
3. Enable SSH, set hostname to `aquakeeper`
4. Update the system:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

### Step 6.2 — Install Dependencies

```bash
# Clone the repository
git clone https://github.com/Karthik321-coder/askbot-2.O.git
cd askbot-2.O/aqua-goalkeeper

# Create a virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
```

### Step 6.3 — Configure ODrive Controllers

```bash
# Connect ODrive H via USB, then:
python -m src.motor_controller --setup horizontal

# Connect ODrive V via USB, then:
python -m src.motor_controller --setup vertical
```

This runs the ODrive calibration routine (motor phase detection, encoder offset).

### Step 6.4 — Download Pre-trained Models

```bash
# Place model files in the models/ directory
# - ball_detector.pt   (YOLOv8 nano, fine-tuned)
# - trajectory_lstm.pt (LSTM trajectory predictor)
# - rl_agent.pt        (PPO-trained decision policy)
```

If training from scratch, see [training/README.md](../training/README.md).

---

## Phase 7: Calibration

### Step 7.1 — Camera Calibration

```bash
python -m src.calibration --cameras
```

Hold a checkerboard pattern in front of both cameras at various positions. The script captures 20+ images and computes intrinsic and extrinsic parameters.

### Step 7.2 — Camera-to-Actuator Mapping

```bash
python -m src.goalkeeper_system --calibrate
```

The paddle moves to a grid of known positions (5 horizontal × 3 vertical). At each position, the cameras detect the paddle and record the mapping from camera coordinates to actuator coordinates. This produces `calibration_data.yaml`.

---

## Phase 8: Verification

### Step 8.1 — Run Diagnostics

```bash
python -m src.goalkeeper_system --diagnostics
```

Checks:
- [x] Both cameras detected and streaming
- [x] Stereo calibration valid
- [x] Both ODrive controllers connected
- [x] Motors respond to position commands
- [x] Limit switches functional
- [x] Emergency stop functional
- [x] Ball detection model loaded
- [x] Trajectory prediction model loaded
- [x] Decision model loaded

### Step 8.2 — Dry Run

```bash
python -m src.goalkeeper_system --simulate
```

Runs the full pipeline with simulated ball trajectories. The paddle should move to intercept each simulated shot.

### Step 8.3 — Live Test

```bash
python -m src.goalkeeper_system --config config.yaml
```

Throw balls at the goal from increasing distances and angles. Monitor the telemetry dashboard for detection, prediction, and actuation performance.

---

## Maintenance

| Task | Frequency |
|---|---|
| Lubricate rails | Monthly |
| Inspect cable glands for seal integrity | Monthly |
| Replace desiccant packs in camera housings | Quarterly |
| Check belt/motor tension and alignment | Quarterly |
| Recalibrate camera-to-actuator mapping | After any physical adjustment |
| Inspect paddle for cracks or deformation | Weekly during heavy use |
| Clean camera lenses | Weekly |
