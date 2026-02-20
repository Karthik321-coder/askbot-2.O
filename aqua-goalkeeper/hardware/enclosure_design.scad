// AquaKeeper — Electronics Enclosure (OpenSCAD)
// Parametric IP68 enclosure for the compute module and motor drivers.
//
// Units: millimeters

// =============================================================
// Parameters
// =============================================================

enclosure_w      = 220;    // mm (internal width)
enclosure_d      = 160;    // mm (internal depth)
enclosure_h      = 90;     // mm (internal height)
wall_thickness   = 4;      // mm
lid_lip          = 5;      // mm overlap

// Cable gland holes
gland_positions  = [
    [30,  0],   // Power in
    [70,  0],   // Camera L USB
    [110, 0],   // Camera R USB
    [150, 0],   // Motor H
    [30,  1],   // Motor V (opposite wall)
    [70,  1],   // E-stop (opposite wall)
];

gland_diameters  = [20.5, 16, 16, 20.5, 20.5, 12.5];  // PG11, PG9, PG9, PG11, PG11, PG7

// =============================================================
// Modules
// =============================================================

module enclosure_body() {
    color("LightGray")
    difference() {
        // Outer shell
        cube([
            enclosure_w + 2 * wall_thickness,
            enclosure_d + 2 * wall_thickness,
            enclosure_h + wall_thickness
        ]);

        // Inner cavity
        translate([wall_thickness, wall_thickness, wall_thickness])
        cube([enclosure_w, enclosure_d, enclosure_h + 1]);

        // Cable gland holes
        for (i = [0 : len(gland_positions) - 1]) {
            pos = gland_positions[i];
            d = gland_diameters[i];
            if (pos[1] == 0) {
                // Front wall
                translate([pos[0] + wall_thickness, -1, enclosure_h / 2 + wall_thickness])
                rotate([-90, 0, 0])
                cylinder(h=wall_thickness + 2, d=d, $fn=32);
            } else {
                // Rear wall
                translate([pos[0] + wall_thickness, enclosure_d + wall_thickness - 1, enclosure_h / 2 + wall_thickness])
                rotate([-90, 0, 0])
                cylinder(h=wall_thickness + 2, d=d, $fn=32);
            }
        }
    }
}

module enclosure_lid() {
    color("LightBlue", 0.5)
    translate([0, 0, enclosure_h + wall_thickness + 2])
    difference() {
        cube([
            enclosure_w + 2 * wall_thickness,
            enclosure_d + 2 * wall_thickness,
            wall_thickness
        ]);

        // Gasket groove (simplified)
        translate([wall_thickness + 2, wall_thickness + 2, -1])
        difference() {
            cube([enclosure_w - 4, enclosure_d - 4, 2]);
            translate([2, 2, 0])
            cube([enclosure_w - 8, enclosure_d - 8, 2]);
        }
    }
}

module din_rail(length) {
    // Simplified 35mm DIN rail
    color("Silver")
    translate([0, 0, 0])
    cube([length, 35, 7.5]);
}

// =============================================================
// Assembly
// =============================================================

module enclosure_assembly() {
    enclosure_body();
    enclosure_lid();

    // DIN rail inside
    translate([wall_thickness + 10, wall_thickness + 30, wall_thickness])
    din_rail(enclosure_w - 20);
}

enclosure_assembly();

echo("Enclosure rendered.");
echo(str("External dimensions: ",
    enclosure_w + 2 * wall_thickness, " x ",
    enclosure_d + 2 * wall_thickness, " x ",
    enclosure_h + 2 * wall_thickness, " mm"));
