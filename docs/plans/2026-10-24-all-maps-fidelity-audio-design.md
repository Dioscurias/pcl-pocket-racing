# All Maps Fidelity and Audio Design

## Scope

Keep all four courses and preserve their layouts, collision geometry, controls, lap logic, item logic, and multiplayer behavior. Extend the existing local CC0 PBR asset system to PCL Lobby Loop, Bookstack Blitz, and Jester Flight. Replace the basic procedural note loop with an original 140 BPM race score using broad high-energy trap traits without copying or embedding a commercial recording.

## Rendering

All tracks use the local KTX2 material library and the Poly Haven reflection environment. Indoor courses keep their authored background colors while receiving neutral tone mapping, softer bloom, environment reflections, and course-specific light colors. Floors, walls, roads, shelves, counters, ramps, and architectural trim use shared PBR material families. Repeated fixtures and props remain batched or instanced.

## Course identity

- PCL Lobby Loop uses limestone, concrete, framed glass, warm brick, detailed counters, ceiling beams, and study furniture.
- Bookstack Blitz uses textured shelf frames, varied book banks, reading tables, signs, and warm library lighting.
- Jester Flight uses brick and limestone walls, a detailed upper dining deck, railings, market shelving, structural supports, and clearer flight gates.
- UT Grand Prix remains unchanged except for shared renderer improvements.

## Audio

The soundtrack is generated with Web Audio after user interaction. Race music runs at 140 BPM with a half-time snare, syncopated kick, closed hats, sub-bass, and filtered dark synth pulses. Final-lap intensity adds faster hats and a higher counter layer. Menu music remains quieter. Mute and volume persistence stay intact.

## Verification

Add tests for shared material coverage and the race music profile. Run the full unit suite, production build, local browser regression, then push and deploy to Vercel.
