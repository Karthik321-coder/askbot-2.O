# AquaKeeper — Bill of Materials

## 1. Structural Components

| # | Component | Specification | Qty | Est. Cost (USD) |
|---|---|---|---|---|
| S1 | Horizontal linear rail | HGR25, 3100 mm, 316L SS | 2 | 280 |
| S2 | Horizontal carriages | HGW25 wide, SS | 4 | 200 |
| S3 | Vertical linear rail | HGR15, 1000 mm, 316L SS | 2 | 120 |
| S4 | Vertical carriages | HGW15, SS | 2 | 80 |
| S5 | Mounting U-brackets | 316L SS, 6 mm plate, custom | 4 | 60 |
| S6 | Carriage mounting plates | 6061-T6 Al, anodized, custom | 4 | 100 |
| S7 | Fasteners kit | M6/M8 316 SS bolts, nuts, washers | 1 | 50 |
| | **Subtotal** | | | **890** |

## 2. Actuation Components

| # | Component | Specification | Qty | Est. Cost (USD) |
|---|---|---|---|---|
| A1 | Horizontal linear motor | BLDC, 200 N cont. / 600 N peak, 4 m/s | 1 | 800 |
| A2 | Vertical linear motor | BLDC, 100 N cont. / 300 N peak, 3 m/s | 1 | 500 |
| A3 | ODrive S1 controller | 48 V, FOC, CAN/USB | 2 | 300 |
| A4 | Linear encoder, horizontal | Renishaw absolute, 1 μm resolution | 1 | 350 |
| A5 | Linear encoder, vertical | Renishaw absolute, 1 μm resolution | 1 | 350 |
| A6 | Hall-effect limit switches | NPN, IP67, M8 barrel | 4 | 40 |
| | **Subtotal** | | | **2,340** |

## 3. Blocking Paddle

| # | Component | Specification | Qty | Est. Cost (USD) |
|---|---|---|---|---|
| P1 | HDPE sheet | 600 × 400 × 12 mm, marine grade | 1 | 30 |
| P2 | Paddle mounting hardware | M6 × 30 mm bolts, nylon washers | 1 set | 10 |
| | **Subtotal** | | | **40** |

## 4. Compute & Sensing

| # | Component | Specification | Qty | Est. Cost (USD) |
|---|---|---|---|---|
| C1 | Compute module | Raspberry Pi 5, 8 GB RAM | 1 | 80 |
| C2 | MicroSD card | 128 GB, A2 rated | 1 | 20 |
| C3 | Stereo camera | OAK-D Lite (Luxonis), 120 fps, global shutter | 2 | 300 |
| C4 | USB 3.0 active cables | 3 m, shielded | 2 | 40 |
| | **Subtotal** | | | **440** |

### Alternative Compute (High Performance)

| # | Component | Specification | Qty | Est. Cost (USD) |
|---|---|---|---|---|
| C1-ALT | Compute module | NVIDIA Jetson Orin Nano, 8 GB | 1 | 500 |

## 5. Power & Electrical

| # | Component | Specification | Qty | Est. Cost (USD) |
|---|---|---|---|---|
| E1 | Power supply | 48 V / 20 A, enclosed, industrial | 1 | 120 |
| E2 | DC-DC converter | 48 V → 5 V / 10 A, isolated | 1 | 25 |
| E3 | GFCI breaker | 30 mA trip, 240 V / 20 A | 1 | 40 |
| E4 | Emergency stop | Mushroom button, IP65, NC contacts | 1 | 25 |
| E5 | Power relay | 48 V coil, 30 A contacts (E-stop cut) | 1 | 15 |
| E6 | Motor cable, horizontal | 14 AWG, 3-conductor, shielded, 4 m | 1 | 30 |
| E7 | Motor cable, vertical | 14 AWG, 3-conductor, shielded, 2 m | 1 | 20 |
| E8 | Power cable | 10 AWG, silicone, 2 m | 2 | 20 |
| E9 | Encoder cable | 6-conductor, shielded, 4 m | 1 | 20 |
| E10 | Encoder cable | 6-conductor, shielded, 2 m | 1 | 15 |
| E11 | E-stop cable | 2-conductor, shielded, 5 m | 1 | 10 |
| E12 | Crimp connectors | Assorted XT60, Molex Micro-Fit | 1 kit | 30 |
| | **Subtotal** | | | **370** |

## 6. Enclosures & Waterproofing

| # | Component | Specification | Qty | Est. Cost (USD) |
|---|---|---|---|---|
| W1 | Electronics enclosure | IP68, polycarbonate, 220×160×90 mm | 1 | 60 |
| W2 | Camera dome housing | IP68, polycarbonate dome, custom | 2 | 80 |
| W3 | Cable glands | IP68, PG7/PG9/PG11, assorted | 12 | 30 |
| W4 | Desiccant packs | Silica gel, 10 g | 6 | 10 |
| W5 | Anti-fog coating | Hydrophilic spray, 100 ml | 1 | 15 |
| W6 | Marine silicone sealant | Clear, 300 ml cartridge | 1 | 12 |
| W7 | Conformal coating | Spray, for PCB protection, 200 ml | 1 | 20 |
| | **Subtotal** | | | **227** |

## 7. Miscellaneous

| # | Component | Specification | Qty | Est. Cost (USD) |
|---|---|---|---|---|
| M1 | DIN rail | 35 mm, 200 mm length | 1 | 5 |
| M2 | DIN rail adapter plates | For RPi and ODrive | 3 | 15 |
| M3 | Rail lubricant | Kluber Isoflex NBU 15, 50 g tube | 1 | 20 |
| M4 | Threadlocker | Loctite 243, 10 ml | 1 | 8 |
| M5 | Vibration-damping grommets | M6, rubber | 8 | 10 |
| M6 | Cable ties | UV-resistant, assorted sizes | 1 bag | 8 |
| M7 | Heat shrink tubing | Assorted sizes, adhesive-lined | 1 kit | 12 |
| | **Subtotal** | | | **78** |

---

## Cost Summary

| Category | Est. Cost (USD) |
|---|---|
| Structural | 890 |
| Actuation | 2,340 |
| Paddle | 40 |
| Compute & Sensing | 440 |
| Power & Electrical | 370 |
| Enclosures & Waterproofing | 227 |
| Miscellaneous | 78 |
| **Total (RPi 5 option)** | **4,385** |
| **Total (Jetson option)** | **4,805** |

---

## Sourcing Notes

| Component Category | Suggested Suppliers |
|---|---|
| Linear rails & carriages | Hiwin, THK, or compatible (AliExpress for prototyping) |
| Linear motors | LinMot, Faulhaber, or Tecnotion |
| ODrive controllers | ODrive Robotics (odriverobotics.com) |
| Linear encoders | Renishaw, Heidenhain |
| OAK-D cameras | Luxonis (shop.luxonis.com) |
| Raspberry Pi 5 | Authorized distributors (CanaKit, PiShop) |
| Jetson Orin Nano | NVIDIA / Seeed Studio |
| Enclosures | Bud Industries, Hammond, or Polycase |
| Stainless steel custom parts | Local metal fabrication shop or Xometry |
| HDPE sheet | McMaster-Carr, Grainger |
