# AquaKeeper — Component Specifications

## 1. Compute Module

### Option A: Raspberry Pi 5 (8 GB)

| Spec | Value |
|---|---|
| CPU | Broadcom BCM2712, Cortex-A76 quad-core @ 2.4 GHz |
| RAM | 8 GB LPDDR4X |
| GPU | VideoCore VII |
| USB | 2 × USB 3.0, 2 × USB 2.0 |
| GPIO | 40-pin header |
| Power | 5 V / 5 A via USB-C |
| OS | Raspberry Pi OS 64-bit (Debian Bookworm) |

### Option B: NVIDIA Jetson Orin Nano (8 GB)

| Spec | Value |
|---|---|
| CPU | 6-core Arm Cortex-A78AE @ 1.5 GHz |
| GPU | 1024-core NVIDIA Ampere, 32 Tensor Cores |
| RAM | 8 GB LPDDR5 |
| AI Performance | 40 TOPS |
| USB | 2 × USB 3.2 Gen2, 1 × USB 2.0 |
| Power | 7–15 W |

## 2. Stereo Cameras — OAK-D Lite

| Spec | Value |
|---|---|
| Color sensor | IMX214, 13 MP |
| Stereo pair | OV7251, 640×480 @ 120 fps, global shutter |
| Depth range | 0.2–20 m |
| Depth accuracy | < 2 % @ 4 m |
| On-device VPU | Intel Movidius Myriad X |
| Interface | USB 3.0 (USB-C) |
| Power | 2.5 W (USB bus-powered) |
| Dimensions | 91 × 28 × 17.5 mm |

## 3. Motor Controllers — ODrive S1

| Spec | Value |
|---|---|
| Voltage range | 12–56 V DC |
| Continuous current | 40 A |
| Peak current | 80 A (2 s) |
| Control modes | Position, velocity, torque |
| Control loop | FOC, 100 kHz |
| Encoder input | SPI, ABI, Hall |
| Communication | USB, CAN bus (1 Mbps) |
| Dimensions | 64 × 52 × 16 mm |

## 4. Linear Motors

### Horizontal (3 m axis)

| Spec | Value |
|---|---|
| Type | 3-phase BLDC linear (ironcore) |
| Continuous force | 200 N |
| Peak force | 600 N |
| Max velocity | 4 m/s |
| Max acceleration | 20 m/s² |
| Stroke | 3000 mm |
| Magnet track length | 3100 mm |
| Coil mass | 1.2 kg |

### Vertical (0.9 m axis)

| Spec | Value |
|---|---|
| Type | 3-phase BLDC linear (ironcore) |
| Continuous force | 100 N |
| Peak force | 300 N |
| Max velocity | 3 m/s |
| Max acceleration | 15 m/s² |
| Stroke | 900 mm |
| Magnet track length | 1000 mm |
| Coil mass | 0.6 kg |

## 5. Linear Encoders — Renishaw RGH24

| Spec | Value |
|---|---|
| Type | Optical, absolute |
| Resolution | 1 μm |
| Accuracy | ± 5 μm/m |
| Max speed | 12 m/s |
| Interface | SPI (BiSS-C) |
| Protection | IP67 (stainless steel housing) |

## 6. Linear Rails

### Horizontal — HGR25

| Spec | Value |
|---|---|
| Profile width | 25 mm |
| Rail height | 22 mm |
| Material | 316L Stainless Steel |
| Carriage type | HGW25 (wide, 4-row) |
| Load capacity | 32 kN (dynamic) |

### Vertical — HGR15

| Spec | Value |
|---|---|
| Profile width | 15 mm |
| Rail height | 16 mm |
| Material | 316L Stainless Steel |
| Carriage type | HGW15 (wide, 4-row) |
| Load capacity | 17 kN (dynamic) |

## 7. Power Supply

| Spec | Value |
|---|---|
| Output | 48 V DC, 20 A (960 W) |
| Input | 100–240 V AC, 50/60 Hz |
| Efficiency | ≥ 92 % |
| Protection | OVP, OCP, SCP, OTP |
| Cooling | Internal fan |
| Dimensions | 215 × 115 × 50 mm |
| Enclosure | Aluminum, IP20 (mounted in poolside cabinet) |

## 8. Emergency Stop Button

| Spec | Value |
|---|---|
| Type | Mushroom head, twist-release |
| Contacts | 1 NC + 1 NO |
| Rating | 10 A @ 240 V AC |
| Protection | IP65 |
| Mounting | 22 mm panel cutout |
