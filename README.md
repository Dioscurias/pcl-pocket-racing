# PCL Pocket Racing

Toy-sized multiplayer kart racing through a reference-based recreation of UT Austin's Perry-Castañeda Library Level 3. A separate game with Speedster's own typography, monochrome panels, circular radar and speed-ring HUD.

## Run

`npm ci`, then `npm run dev`. `npm test` runs the deterministic race, records and transport tests. `npm run build` generates the static game; `npm run preview` serves it. `npm run test:browser` checks driving, time trials and a real two-browser private race.

## Controls

W/S accelerate and brake/reverse. A/D steer. Hold Space through a turn to drift; charge the drift meter, then release for a mini turbo. Shift uses your boost resource. R resets to your last earned checkpoint with a two-second penalty. Tab shows live positions. Escape opens pause, controls and sound. Solo races pause; private races continue when one racer opens a menu.

## Race modes

- Quick race: three laps against three AI racers, with collision, ramp jumps, track boosts, shortcuts and a live finishing order.
- Private race: create or join with a six-character invite code or link. Up to eight racers, ready checks, optional AI fill, host-controlled starts and rematches. Each racer keeps their host-assigned color and name across every participant's display.
- Time trial: one lap without AI. Best times are saved on the device, and a clean best lap supplies a translucent recorded ghost on the next run. The menu labels these records as local, not a global leaderboard.

All checkpoints must be crossed in order and forward. Reset penalties count in lap results and final positions. A race allows thirty seconds for remaining finishers after the first kart crosses the line. Disconnected guests are covered by AI; host loss returns the room to the menu.

## Multiplayer

PeerJS Cloud performs rendezvous. Actual match inputs and host-authoritative snapshots travel through WebRTC data channels. Clients cannot submit checkpoints, lap times, final positions or scores. The host browser needs to remain connected. Elapsed-time catch-up and incoming peer-input ticks keep simulation independent of rendering and reduce background-tab timer throttling.

Some restrictive networks need a TURN relay. Optional custom deployment configuration:

```dotenv
VITE_PEER_HOST=signal.example.com
VITE_PEER_PORT=443
VITE_PEER_PATH=/
VITE_PEER_SECURE=true
VITE_ICE_SERVERS=[{"urls":"stun:stun.l.google.com:19302"},{"urls":"turn:relay.example:3478","username":"temporary-user","credential":"temporary-credential"}]
```

Omit these variables to use PeerJS's default cloud and ICE settings. A self-hosted PeerServer and a time-limited TURN credential service can be configured for controlled production networking. No serverless process-local room storage is used.

## Location references and credits

The angular perimeter, central stair/elevator core, eastern stacks 3L–3Q, western stacks and Reflection Space are informed by [UT Libraries' public PCL floor plans](https://www.lib.utexas.edu/visit-us/locations/pcl/floor-plan). Geometry is authored in gameplay units. Course tape, ramps, shortcuts, furniture scale and toy racing are fictional additions, not a surveyed interior model. Reference photographs and floor-plan images are not redistributed. This is an independent arcade recreation, not an official university game.

Kart meshes, drivers, room geometry, books, textures and audio are generated locally. Inter Tight and IBM Plex Mono licenses are bundled with the fonts. Phosphor icon paths retain their MIT attribution. Three.js and PeerJS are MIT licensed.

## Reference car collection

Choose a vehicle in the main menu before starting or joining a race. Apex and Apex Formula are open-wheel designs, GT Roadster is open-top, Rally Coupe has a closed cockpit, and Motorcycle uses a lighter two-wheel model with dedicated agile handling and lean animation. The selection is remembered on this device and synchronized by the lobby host, including on rematches. Each vehicle has deterministic arcade handling and an appropriate collision footprint. Paint is assigned by the host so each racer keeps a distinct color on every screen. Vehicle shapes are original procedural models with no licensed manufacturer branding or external model downloads.

Music, engine tones, and effects are synthesized in the browser with the Web Audio API. No recorded or third-party audio files are bundled. Mute and master volume are stored on the device, and audio begins only after user interaction.
