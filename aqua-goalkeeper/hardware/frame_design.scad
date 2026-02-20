// AquaKeeper — Rail Frame Assembly (OpenSCAD)
// Parametric 3D model for the 2-axis gantry frame
// that mounts onto a standard water polo goal.
//
// Units: millimeters
// To render: Open in OpenSCAD and press F6

// =============================================================
// Parameters
// =============================================================

// Goal dimensions
goal_width       = 3000;   // mm
goal_height      = 900;    // mm

// Rail profile
h_rail_profile   = 25;     // mm (HGR25)
v_rail_profile   = 15;     // mm (HGR15)

// Rail lengths (stroke + overtravel)
h_rail_length    = 3100;   // mm
v_rail_length    = 1000;   // mm

// Mounting bracket dimensions
bracket_width    = 60;     // mm
bracket_depth    = 50;     // mm
bracket_thickness = 6;     // mm

// Carriage plate
carriage_plate_w = 80;     // mm
carriage_plate_h = 80;     // mm
carriage_plate_t = 10;     // mm

// =============================================================
// Modules
// =============================================================

module rail(length, profile) {
    // Simplified linear rail: rectangular cross-section
    color("Silver")
    cube([length, profile, profile], center=false);
}

module carriage(profile) {
    // Simplified carriage block
    size = profile * 2;
    color("DimGray")
    translate([-size/4, -profile/2, 0])
    cube([size, profile * 2, profile * 1.5]);
}

module mounting_bracket() {
    color("Silver")
    difference() {
        cube([bracket_width, bracket_depth, bracket_thickness]);
        // Mounting holes
        for (dx = [15, bracket_width - 15]) {
            for (dy = [15, bracket_depth - 15]) {
                translate([dx, dy, -1])
                cylinder(h=bracket_thickness + 2, d=8.5, $fn=24);
            }
        }
    }
}

module carriage_plate() {
    color("LightGray")
    difference() {
        cube([carriage_plate_w, carriage_plate_h, carriage_plate_t]);
        // Mounting holes
        for (dx = [10, carriage_plate_w - 10]) {
            for (dy = [10, carriage_plate_h - 10]) {
                translate([dx, dy, -1])
                cylinder(h=carriage_plate_t + 2, d=6.5, $fn=24);
            }
        }
    }
}

// =============================================================
// Assembly
// =============================================================

module frame_assembly() {
    // Top horizontal rail
    translate([0, 0, v_rail_length + v_rail_profile])
    rail(h_rail_length, h_rail_profile);

    // Bottom horizontal rail
    translate([0, 0, 0])
    rail(h_rail_length, h_rail_profile);

    // Left vertical rail
    translate([50, 0, 0])
    rotate([0, 0, 0])
    rail(v_rail_length, v_rail_profile);

    // Right vertical rail
    translate([h_rail_length - 50 - v_rail_profile, 0, 0])
    rail(v_rail_length, v_rail_profile);

    // Horizontal carriages (4 total — 2 per rail)
    for (x = [50, h_rail_length - 150]) {
        translate([x, 0, v_rail_length + v_rail_profile])
        carriage(h_rail_profile);

        translate([x, 0, 0])
        carriage(h_rail_profile);
    }

    // Vertical carriage (paddle mount)
    translate([h_rail_length/2 - carriage_plate_w/2, 0, v_rail_length/2])
    carriage(v_rail_profile);

    // Mounting brackets (4 corners)
    for (x = [0, h_rail_length - bracket_width]) {
        translate([x, -bracket_depth, v_rail_length + v_rail_profile + h_rail_profile])
        mounting_bracket();

        translate([x, -bracket_depth, -bracket_thickness])
        mounting_bracket();
    }
}

// Render the assembly
frame_assembly();

echo("Frame assembly rendered.");
echo(str("Goal width: ", goal_width, " mm"));
echo(str("Goal height: ", goal_height, " mm"));
echo(str("H-rail length: ", h_rail_length, " mm"));
echo(str("V-rail length: ", v_rail_length, " mm"));
