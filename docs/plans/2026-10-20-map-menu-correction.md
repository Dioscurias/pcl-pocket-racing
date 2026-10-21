# PCL maps and arcade menu correction

Goal: Correct the location structure and racing reliability of the three existing courses. Replace the dark vertical setup form with a colorful arcade racing selection screen, preserving HUD and multiplayer.

Design follows the user's already approved Mario Kart direction. Existing Three.js/PeerJS architecture stays intact. Jester receives a dedicated environment with the supplied JCL -> J2 -> market sequence. PCL Level 2 uses the public entry-level plan for desk, stair core, printer, and entry relationships. Race ramps and flight gates are fictional. No claim of surveyed architectural accuracy.

1. Add regression tests for complete AI laps on every track, continuous route within floor, height aware collision, and glider lifecycle. Observe failures.
2. Correct track definitions and shared elevation handling. Make ground and upper levels selectable by height. Fix reset, pickup, item, and obstacle height checks. Ensure flight route and landing can be driven.
3. Add a dedicated procedural Jester environment. Build stacked floors, dining counters, tables, atrium, climb, flight gates, and market shelves. Render barriers and track from the same physical data. Upgrade PCL architectural props.
4. Recompose the existing menu into garage and course selection areas. Preserve element IDs and network events. Use native SVG route previews and real scene screenshot covers, a large 3D kart, legible modes, name and paint. Keep mobile layout at 360px.
5. Run unit tests, build, and browser gameplay/real WebRTC checks. Capture and inspect screenshots of all maps and menu at desktop and narrow sizes. Commit, push and deploy after verification.
