// AquaKeeper — Blocking Paddle (OpenSCAD)
// Parametric 3D model for the HDPE blocking paddle.
//
// Units: millimeters

// =============================================================
// Parameters
// =============================================================

paddle_width     = 600;    // mm
paddle_height    = 400;    // mm
paddle_thickness = 12;     // mm
chamfer_radius   = 10;     // mm (edge chamfer)

// Mounting holes
mount_hole_d     = 6.5;    // mm (M6 clearance)
mount_inset      = 30;     // mm from edge

// Color
paddle_color     = "OrangeRed";  // Signal orange

// =============================================================
// Modules
// =============================================================

module rounded_rect(w, h, t, r) {
    // A rectangular solid with rounded vertical edges
    hull() {
        for (x = [r, w - r]) {
            for (y = [r, h - r]) {
                translate([x, y, 0])
                cylinder(h=t, r=r, $fn=32);
            }
        }
    }
}

module paddle() {
    color(paddle_color)
    difference() {
        // Main body with chamfered edges
        rounded_rect(paddle_width, paddle_height, paddle_thickness, chamfer_radius);

        // Mounting holes
        for (dx = [mount_inset, paddle_width - mount_inset]) {
            for (dy = [mount_inset, paddle_height - mount_inset]) {
                translate([dx, dy, -1])
                cylinder(h=paddle_thickness + 2, d=mount_hole_d, $fn=24);
            }
        }
    }
}

// =============================================================
// Render
// =============================================================

paddle();

echo("Paddle rendered.");
echo(str("Width: ", paddle_width, " mm"));
echo(str("Height: ", paddle_height, " mm"));
echo(str("Thickness: ", paddle_thickness, " mm"));
