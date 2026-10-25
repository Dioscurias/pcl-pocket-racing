# Venue Polish Design

The existing track, simulation, controls, lap logic, and item state remain unchanged. This pass changes only rendering data and scene construction.

## Item box

Replace the single cyan cube with a named pickup assembly: translucent beveled shell, bright inner core, two counter-rotating rings, corner lights, and a high-contrast question-mark plate. The existing group remains the object that hides, respawns, floats, and rotates, so pickup behavior does not change.

## Campus perimeter and sky

Build a race-venue perimeter around the rectangular UT campus floor. Use low concrete safety walls, dark catch fencing, support posts, race banners, light towers, and a small number of grandstand silhouettes. This blocks the empty green horizon without creating collision geometry or adding obstacles to the racing line.

Replace the painted cloud strokes with layered, soft cloud clusters built from overlapping radial gradients. Keep the blue vertical gradient, place clouds above the horizon, avoid large opaque blobs, and retain the existing HDR environment for reflections.

## Vehicle proportions and wheels

Normalize each GLB to an explicit target length and type-specific display scale. Cars remain close in overall footprint while the motorcycle is narrower and slightly shorter. Store wheel centers, radii, and widths in one exported layout. Use those dimensions for extraction, placement, and road-distance rotation so the original tire mesh rotates at the correct rate. Preserve the dedicated motorcycle lean mechanism.

## Verification

Add tests for item-box assembly metadata, perimeter construction metadata, cloud density and opacity, normalized vehicle ratios, and per-model wheel radii. Run all unit and simulation tests, build production, and inspect every vehicle and the UT map in a real browser.
