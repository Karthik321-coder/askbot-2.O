# AquaKeeper — Mechanical & Hardware Design

## 1. Design Overview

The AquaKeeper mechanism consists of a **2-axis gantry system** mounted onto a standard water polo goal frame (3 m wide × 0.9 m tall). A blocking paddle travels along horizontal and vertical linear rails to intercept incoming shots.

### Design Principles

1. **Full coverage** — The paddle can reach any point within the goal opening
2. **Speed** — Actuators sized to traverse the full goal width in < 0.75 s
3. **Water resistance** — All electronics in IP68 enclosures; frame in marine-grade stainless steel
4. **Safety** — Soft end-stops, force-limited motors, GFCI-protected power
5. **Modularity** — Each subsystem can be replaced independently

---

## 2. Goal Frame Mounting

```
         3000 mm
    ◄──────────────────►
    ┌──────────────────────────────────────┐  ▲
    │          HORIZONTAL RAIL              │  │
    │  ═══════════════════════════════════  │  │
    │  ║                                ║  │  │
    │  ║  VERTICAL      VERTICAL        ║  │  │ 900 mm
    │  ║  RAIL          RAIL            ║  │  │
    │  ║     ┌────────┐                 ║  │  │
    │  ║     │ PADDLE │                 ║  │  │
    │  ║     └────────┘                 ║  │  │
    │  ═══════════════════════════════════  │  │
    │          HORIZONTAL RAIL              │  ▼
    └──────────────────────────────────────┘
              GOAL FRAME (rear view)

    Mounting: 316L SS U-brackets bolted to goal posts
    Clearance: 50 mm between rail and goal frame inner edge
```

### Frame Materials

| Part | Material | Finish |
|---|---|---|
| Main rails | 316L Stainless Steel, 40 mm × 40 mm profile | Electropolished |
| Carriage plates | 6061-T6 Aluminum | Anodized (Type III hard coat) |
| Fasteners | 316 SS, M8 hex bolts with Nylock nuts | Passivated |
| Mounting brackets | 316L SS, 6 mm plate | Electropolished |

---

## 3. Linear Rail System

### Horizontal Axis (X)

- **Type:** Supported linear rail with recirculating ball carriage
- **Rail profile:** 25 mm HGR25 (Hiwin-compatible)
- **Length:** 3100 mm (3000 mm stroke + 50 mm overtravel each end)
- **Carriages:** 2 × HGW25 wide carriages (supports the vertical rail assembly)
- **Drive:** Brushless DC linear motor (coil on carriage, magnet track on rail)
  - Continuous force: 200 N
  - Peak force: 600 N
  - Max velocity: 4 m/s
  - Max acceleration: 20 m/s²

### Vertical Axis (Y)

- **Type:** Compact linear rail
- **Rail profile:** 15 mm HGR15
- **Length:** 1000 mm (900 mm stroke + 50 mm overtravel each end)
- **Carriages:** 1 × HGW15 carriage (supports the paddle)
- **Drive:** Brushless DC linear motor
  - Continuous force: 100 N
  - Peak force: 300 N
  - Max velocity: 3 m/s
  - Max acceleration: 15 m/s²

### Encoder Feedback

| Axis | Encoder Type | Resolution |
|---|---|---|
| Horizontal | Absolute linear encoder (Renishaw) | 1 μm |
| Vertical | Absolute linear encoder (Renishaw) | 1 μm |

---

## 4. Blocking Paddle Design

```
        600 mm
    ◄────────────►
    ┌──────────────┐  ▲
    │              │  │
    │   HDPE       │  │ 400 mm
    │   PANEL      │  │
    │   (12 mm)    │  │
    │              │  │
    └──────────────┘  ▼
    
    Edges: 10 mm radius chamfer (safety)
    Surface: Textured for splash reduction
    Color: High-visibility orange
    Mounting: 4× M6 bolts to carriage plate
```

### Paddle Specifications

| Property | Value |
|---|---|
| Dimensions | 600 mm × 400 mm × 12 mm |
| Material | HDPE (High-Density Polyethylene), marine grade |
| Mass | ~2.9 kg |
| Edge radius | 10 mm chamfer on all edges |
| Color | Signal orange (RAL 2010) |
| Surface | Fine textured (reduces splash on impact) |

### Coverage Analysis

The paddle can reach any position within the goal:
- Minimum X: 0 mm (left post) — paddle left edge at 0 mm
- Maximum X: 3000 mm (right post) — paddle right edge at 3000 mm
- Minimum Y: 0 mm (bottom bar) — paddle bottom edge at 0 mm
- Maximum Y: 900 mm (top bar) — paddle top edge at 900 mm

Even with the paddle at maximum offset, the 600 mm × 400 mm paddle size ensures overlap with adjacent positions.

---

## 5. 3D Model Specifications

All 3D models are provided as **OpenSCAD** files for parametric modification.

### 5.1 Frame Assembly (`hardware/frame_design.scad`)

```
  Top view of rail system:

  ┌─────────────────────────────────────────────────┐
  │  ┌─[Camera L]                    [Camera R]─┐  │
  │  │                                            │  │
  │  │  ╔═══════════════════════════════════════╗ │  │
  │  │  ║  H-Rail Top                           ║ │  │
  │  │  ╚═══════════════════════════════════════╝ │  │
  │  │     ┃         Carriage          ┃          │  │
  │  │     ┃  ╔═══╗                    ┃          │  │
  │  │     ┃  ║   ║ V-Rail            ┃          │  │
  │  │     ┃  ║ P ║ + Paddle          ┃          │  │
  │  │     ┃  ║   ║                    ┃          │  │
  │  │     ┃  ╚═══╝                    ┃          │  │
  │  │  ╔═══════════════════════════════════════╗ │  │
  │  │  ║  H-Rail Bottom                       ║ │  │
  │  │  ╚═══════════════════════════════════════╝ │  │
  │  └────────────────────────────────────────────┘  │
  └─────────────────────────────────────────────────┘
```

### 5.2 Electronics Enclosure (`hardware/enclosure_design.scad`)

```
  ┌─────────────────────┐
  │  IP68 Enclosure      │
  │  220×160×90 mm      │
  │                      │
  │  ┌────────────────┐ │
  │  │ Compute Module  │ │
  │  │ (RPi 5 / Jetson)│ │
  │  └────────────────┘ │
  │  ┌─────┐ ┌─────┐   │
  │  │ODrv │ │ODrv │   │
  │  │  H  │ │  V  │   │
  │  └─────┘ └─────┘   │
  │                      │
  │  Cable glands (×6)  │
  │  ● Power in          │
  │  ● Camera L USB      │
  │  ● Camera R USB      │
  │  ● Motor H           │
  │  ● Motor V           │
  │  ● E-stop            │
  └─────────────────────┘
```

### 5.3 Paddle Assembly (`hardware/paddle_design.scad`)

Parametric model with configurable width, height, thickness, chamfer radius, and mounting hole pattern.

---

## 6. Camera Mounting Design

```
  Side view:
                     ┌─── Camera housing (IP68)
                     │
                   ┌─┴─┐
  ────────────────│ C  │──────────── Crossbar
                   └─┬─┘
                     │  30° tilt
                     │ /
                     ▼/
                  
              Pool playing area
```

- **Position:** Centered on goal crossbar, 150 mm above rail
- **Stereo baseline:** 300 mm between left and right cameras
- **Tilt angle:** 30° below horizontal (covers full playing field to 15 m)
- **Housing:** Custom IP68 polycarbonate dome with anti-fog coating
- **Mounting:** Stainless steel L-bracket, M6 bolts, vibration-damping grommets

---

## 7. Electrical Design

### Power Distribution

```
  AC Mains (240V) ──► GFCI Breaker ──► 48V/20A PSU ──┬──► ODrive H (48V)
                                                        ├──► ODrive V (48V)
                                                        └──► 5V/10A DC-DC ──┬──► RPi 5
                                                                             ├──► Camera L
                                                                             └──► Camera R
```

### Wiring Summary

| Wire Run | Cable Type | Length |
|---|---|---|
| PSU → ODrive H | 10 AWG silicone, tinned copper | 2 m |
| PSU → ODrive V | 10 AWG silicone, tinned copper | 2 m |
| ODrive H → Motor H | 14 AWG shielded, 3-conductor | 4 m |
| ODrive V → Motor V | 14 AWG shielded, 3-conductor | 2 m |
| RPi → Camera L | USB 3.0 active cable | 3 m |
| RPi → Camera R | USB 3.0 active cable | 3 m |
| E-stop → RPi GPIO | 2-conductor shielded | 5 m |
| Encoder H → ODrive H | 6-conductor shielded | 4 m |
| Encoder V → ODrive V | 6-conductor shielded | 2 m |

All cables pass through IP68 cable glands at enclosure entry points.

---

## 8. Waterproofing Strategy

| Component | Protection Method |
|---|---|
| Compute module | IP68 polycarbonate enclosure, silicone gasket |
| ODrive controllers | Housed in same enclosure, conformal coating on PCBs |
| Cameras | IP68 dome housing, desiccant pack inside |
| Motors | Sealed BLDC construction, IP67 rated |
| Encoders | IP67 rated, stainless steel housing |
| Cables | Marine-grade cable with IP68 gland at each end |
| Rails | 316L stainless, no additional coating needed |
| Paddle | HDPE — inherently waterproof |

### Environmental Ratings

- **Operating temperature:** 10°C to 45°C
- **Humidity:** Up to 100 % (poolside)
- **Chemical resistance:** Chlorinated pool water (1–3 ppm Cl₂)
- **UV resistance:** All external plastics UV-stabilized

---

## 9. Dimensional Drawings

### Front Elevation

```
              3100 mm (rail length)
    ◄──────────────────────────────────────────►
    
    ┌──────────────────────────────────────────┐ ─ ▲
    │ H-Rail ═══════════════════════════════════│   │
    │ ║                                      ║ │   │
    │ V ┌─────────────────┐                  V │   │ 1000 mm
    │ R │    PADDLE        │                 R │   │ (rail)
    │ a │    600×400 mm    │                 a │   │
    │ i └─────────────────┘                  i │   │
    │ l                                      l │   │
    │ ║                                      ║ │   │
    │ H-Rail ═══════════════════════════════════│   │
    └──────────────────────────────────────────┘ ─ ▼
    
    │◄─►│                                │◄─►│
     50mm                                 50mm
     margin                               margin
```

### Side Elevation

```
         150 mm
    ◄────────────►
    ┌──────┐
    │Camera│   ▲
    │Mount │   │ 100 mm
    └──┬───┘   ▼
       │
    ═══╧═══ Crossbar
    ║     ║
    ║  P  ║  Rail + Paddle assembly
    ║  A  ║  (extends 80 mm from goal plane)
    ║  D  ║
    ║     ║
    ═══════ Bottom bar
```
