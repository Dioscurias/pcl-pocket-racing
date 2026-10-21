# Driving Polish Design

## Goal

Polish the existing PCL Pocket Racing game without changing its architecture. Improve stability, track containment, presentation, vehicle variety, and audio while preserving every current course and multiplayer flow.

## Simulation

Keep the authoritative deterministic simulation and its fixed update loop. Add data-driven handling profiles for each vehicle. Grounded movement uses smooth surface following, capped step climbing, swept horizontal collision checks, speed-dependent steering, and lateral-grip damping. Wall response removes only velocity directed into the surface and preserves tangent velocity so impacts slide rather than stop. Human and AI racers automatically recover after being flipped, outside the course, or nearly stationary while applying throttle for several seconds.

Tracks gain soft edge containment derived from the centerline. This prevents accidental falls while leaving authored flight sectors and shortcuts open. Existing layouts, checkpoints, landmarks, ramps, and vertical routes remain intact. Track tests exercise complete AI laps and surface/edge safety.

## Vehicles

Vehicle behavior is defined in `car-catalog.js`. Club Sport and Formula are removed. Apex Formula replaces them as one open-wheel vehicle. A motorcycle joins Apex, Apex Formula, GT Roadster, and Rally Coupe.

The motorcycle has a dedicated arcade mechanism: a smaller collision radius, quicker acceleration, sharper low-speed steering, counter-steer-style high-speed turn response, reduced lateral grip while turning, faster drift charge, and automatic upright stabilization. Its procedural model has two wheels, a steering fork, rider pose, and visual lean. Lean is presentation state rather than an unstable rigid-body roll angle.

## Presentation

The existing Three.js course renderer receives brighter sky, vivid grass, saturated course colors, red-white curbs, checkered start lines, banners, and soft clouds. Geometry remains low-cost and repeated materials are reused.

## Audio

Extend the existing synthesized Web Audio engine. It creates separate procedural menu and race music, an engine layer, and short effects. Race intensity rises at high speed and on the final lap. Audio starts after interaction, and persistent mute plus master-volume controls live in the menu and pause dialog. No external audio files are required.

## Verification

Write failing tests before each behavior change. Cover the catalog migration, motorcycle stats, handling differences, wall sliding, tunneling, ground adhesion, automatic recovery, guard rails, and every vehicle on every track. Run unit tests, production build, and browser automation with console-error checks.
