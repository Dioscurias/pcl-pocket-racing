# UT Grand Prix Design

## Outcome

Add a fourth selectable course, UT Grand Prix, without removing the three existing races. It is one continuous circuit that begins inside PCL Level 2, exits through the southwest main entrance, crosses the central UT Austin campus, enters Jester Center at JCL, climbs to J2, opens the kite over the atrium, descends to Jester City Market, and returns outside to the PCL finish.

## Map structure

The world uses three authored zones in one coordinate system:

1. PCL Level 2 follows the public floor plan. The route passes the Research Help and Checkout Desk, main stair core, printers and scanners, UFCU Room, learning labs, Scholars Lab, and main entry.
2. The outdoor campus uses the official UT map for relative placement. The route follows Speedway and East 21st Street, passes the Tower and Main Mall, cuts past Gregory Gym, and reaches Jester Circle. Buildings use recognizable massing, limestone, brick, live oaks, lawns, banners, lamp posts, and campus signs.
3. Jester preserves the existing JCL to J2 to City Market sequence. It adds an exterior entrance and exit so the indoor section belongs to the same circuit.

The route remains an arcade circuit rather than a surveying model. Widths, turns, ramps, and shortcuts are adjusted for racing, while landmark order and building relationships stay recognizable.

## Gameplay

UT Grand Prix is the longest and hardest course. It runs as one lap by default in time trial and can use the existing race lap settings in multiplayer. Indoor sections emphasize tight turns. Campus paths provide speed, drifting, boost strips, moving student hazards, and alternate lines. The Jester section provides the vertical climb and kite flight.

The minimap uses the full route. Checkpoints cover every zone so players cannot skip between buildings. Reset returns the racer to the last safe checkpoint and never places a kart inside a wall or in the flight gap.

## Presentation

The course card uses a real engine capture of the outdoor section with the UT Tower visible. Zone signs and HUD event messages announce PCL, Speedway, Main Mall, Jester, J2, and City Market. The existing arcade menu, kart garage, HUD, multiplayer, colors, names, and car selection remain unchanged.

## Performance

Repeated campus objects use instancing or merged geometry. Landmark buildings use simple authored geometry with strong silhouettes. Course construction avoids external map SDKs and runtime network calls. This keeps multiplayer deterministic and preserves browser performance.

## Validation

- Track catalog and geometry tests verify the fourth course, landmark order, safe surfaces, building bounds, and checkpoint coverage.
- A full AI lap proves the course is driveable without resets.
- Browser tests select the new course, load the campus scene, drive it, and confirm multiplayer still synchronizes.
- Desktop and 360 px menu screenshots verify the fourth course card remains usable.

## References

- UT Austin official campus map and campus building directory
- University of Texas Libraries public PCL floor plans
- University Housing and Dining pages for JCL, J2 Dining, and Jester City Market

