# AquaKeeper — Wiring Diagram

## Overview

All electrical connections between poolside cabinet, enclosure, and goal-mounted components.

## Connection Table

| From | To | Cable | Connector | Notes |
|---|---|---|---|---|
| AC Mains | GFCI Breaker | 12 AWG Romex | Terminal block | 240 V / 20 A rated |
| GFCI Breaker | 48 V PSU | 12 AWG Romex | Terminal block | Earth ground connected |
| 48 V PSU (+) | Enclosure: ODrive H V+ | 10 AWG silicone | XT60 | Red wire |
| 48 V PSU (−) | Enclosure: ODrive H V− | 10 AWG silicone | XT60 | Black wire |
| 48 V PSU (+) | Enclosure: ODrive V V+ | 10 AWG silicone | XT60 | Red wire |
| 48 V PSU (−) | Enclosure: ODrive V V− | 10 AWG silicone | XT60 | Black wire |
| 48 V PSU (+) | DC-DC Converter IN+ | 10 AWG silicone | XT30 | |
| 48 V PSU (−) | DC-DC Converter IN− | 10 AWG silicone | XT30 | |
| DC-DC 5 V OUT | RPi 5 USB-C | USB-C cable | USB-C | 5 V / 5 A |
| ODrive H: M0 | Horizontal Motor A | 14 AWG shielded | Molex Micro-Fit | Phase A |
| ODrive H: M1 | Horizontal Motor B | 14 AWG shielded | Molex Micro-Fit | Phase B |
| ODrive H: M2 | Horizontal Motor C | 14 AWG shielded | Molex Micro-Fit | Phase C |
| ODrive V: M0 | Vertical Motor A | 14 AWG shielded | Molex Micro-Fit | Phase A |
| ODrive V: M1 | Vertical Motor B | 14 AWG shielded | Molex Micro-Fit | Phase B |
| ODrive V: M2 | Vertical Motor C | 14 AWG shielded | Molex Micro-Fit | Phase C |
| Horizontal Encoder | ODrive H: ENC | 6-conductor shielded | JST-GH | |
| Vertical Encoder | ODrive V: ENC | 6-conductor shielded | JST-GH | |
| RPi GPIO 17 | E-stop NC contact | 2-conductor shielded | Screw terminal | Pull-up to 3.3 V |
| E-stop NC contact | Power relay coil | 2-conductor | Spade terminal | Cuts 48 V on press |
| RPi USB 3.0 (port 1) | Camera L | USB 3.0 active | USB-A to USB-C | 3 m |
| RPi USB 3.0 (port 2) | Camera R | USB 3.0 active | USB-A to USB-C | 3 m |

## Grounding

- All enclosure metal parts connected to earth ground via green/yellow wire
- Cable shields connected to ground at the enclosure end only (single-point ground)
- GFCI breaker provides ground-fault protection (30 mA trip)

## Wire Color Code

| Color | Function |
|---|---|
| Red | +48 V |
| Black | 48 V GND |
| Green/Yellow | Earth ground |
| White | Signal / Encoder A |
| Blue | Signal / Encoder B |
| Orange | Motor Phase A |
| Yellow | Motor Phase B |
| Brown | Motor Phase C |

## Cable Gland Assignments

| Gland Position | Type | Cable |
|---|---|---|
| Front #1 (PG11) | Power in | 48 V + GND (10 AWG × 2) |
| Front #2 (PG9) | Camera L | USB 3.0 |
| Front #3 (PG9) | Camera R | USB 3.0 |
| Front #4 (PG11) | Motor H | 3-phase + encoder (bundled) |
| Rear #1 (PG11) | Motor V | 3-phase + encoder (bundled) |
| Rear #2 (PG7) | E-stop | 2-conductor signal |
