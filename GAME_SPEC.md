# PCL Pocket Racing

## Copy-pasteable game and implementation specification

Build and maintain **PCL Pocket Racing**, a browser-based 3D arcade racing game set inside the Perry-Castañeda Library at The University of Texas at Austin. Players control toy-sized karts through a giant interpretation of PCL Level 3. The game supports solo racing, time trials, AI opponents, private peer-to-peer multiplayer, persistent best laps, and best-lap ghosts.

The game must feel colorful, fast, responsive, and playful. Preserve the miniature scale at all times. Shelves, books, desks, students, coffee cups, ramps, and architectural elements should tower over the karts. The visual identity should evoke a polished console arcade racer while remaining original to PCL Pocket Racing. Do not reproduce copyrighted characters, logos, tracks, vehicles, or interface art from another racing franchise.

Live game: `https://pcl-pocket-racing.vercel.app`

## Technology

- Vite browser application
- JavaScript ES modules
- Three.js for rendering
- PeerJS and WebRTC data channels for private multiplayer
- Web Audio API for synthesized engine and event audio
- HTML and CSS overlay interface
- Local Storage for player preferences, records, and ghost data
- No server-authoritative backend or account system

## Core game loop

1. The player enters a racer name.
2. The player chooses one of five kart bodies.
3. The player chooses one of eight paint colors.
4. The player selects Race or Time Trial.
5. The player starts a local race, creates a private lobby, or joins a lobby using a six-character invite code.
6. A three-second countdown begins.
7. Racers complete checkpoints and laps while drifting, boosting, jumping, collecting items, using shortcuts, and avoiding furniture.
8. Race position is calculated continuously from completed laps and track progress.
9. The first finisher starts a 30-second completion window for remaining racers.
10. Results show final order and elapsed times.
11. The host can start a rematch. Time-trial players can compare against their locally saved best-lap ghost.

## Controls

| Input | Action |
|---|---|
| W or Up Arrow | Accelerate |
| S or Down Arrow | Brake and reverse |
| A or Left Arrow | Steer left |
| D or Right Arrow | Steer right |
| Space | Hold to drift, release to trigger a charged mini turbo |
| Shift | Spend energy on boost |
| E or Enter | Use the held item |
| R | Reset to the most recently earned checkpoint and receive a two-second penalty |
| Tab | Hold to display the live scoreboard |
| Escape | Open or close the pause menu |

The control hint appears at the start of a round and fades after 6.5 seconds. Inputs are cleared whenever the window loses focus or a menu pauses local play.

## Game modes

### Race

- Three laps by default.
- Supports one to eight total racers.
- A local quick race adds three AI racers.
- A private lobby can contain up to eight human and AI racers.
- The host may enable three AI racers before starting.
- Race position and final placement are authoritative on the host.
- The first finisher begins a 30-second deadline for everyone else.

### Time Trial

- One lap.
- No AI racers.
- Stores the ten fastest valid local laps.
- Records a positional ghost only when the lap beats the previous best and contains no reset penalty.
- Replays the best ghost as a translucent kart named `BEST LAP`.
- Ghost samples interpolate position, height, and heading.

## Kart selection

Four supplied GLB vehicles use deterministic arcade handling profiles:

1. **Monster Buggy**: lime and cyan body, exposed suspension, oversized tires and rear wing.
2. **Velocity Bike**: blue and orange sport bike with a modeled rider and dedicated lean behavior.
3. **Nova 88**: magenta and navy canopy racer with four wide wheels and a rear loop wing.
4. **Apex Formula**: lime and purple open-wheel racer with exposed suspension and aero wings.

The supplied models preserve their embedded color, normal and metallic-roughness textures. Their single-mesh construction keeps the authored silhouettes intact. The body leans under steering, bounces with speed and reacts while airborne. The motorcycle uses its own lean pivot. Exhaust flames appear during boost and turbo states. Drift sparks change from blue to gold to purple as drift charge increases. A racer-color flag, lamps and underglow identify each player without tinting the original livery.

Vehicle render scale is `0.65`. Cars use collision radii near `0.56` world units. The motorcycle uses a narrower footprint, quicker acceleration, sharper steering, lighter grip, faster drift charge, and automatic visual lean. All profiles run through the same fixed-step authoritative simulation.

## Paint colors

Players choose from eight synchronized paint colors:

- Blue `#1677ff`
- Gold `#ffbf3f`
- Red `#ff5a4d`
- Teal `#18c7b5`
- Purple `#a970ff`
- Cream `#fff0c7`
- Green `#83d63f`
- Pink `#f04fa3`

The chosen name, kart, and paint are persisted locally. Multiplayer snapshots preserve the same car and color on every connected screen. If a color is not supplied or is invalid, the game assigns the first unused approved color.

## Movement and physics

- The host advances the authoritative simulation at 60 update calls per second.
- `stepWorld` divides time into substeps no larger than `1/120` second.
- Incoming time deltas are finite-checked and clamped to `0.1` seconds.
- Normal forward acceleration is `30` units per second squared.
- Boost or turbo acceleration is `43` units per second squared.
- Braking force is `47` units per second squared.
- Maximum normal speed is `32` units per second.
- Maximum boosted or turbo speed is `42` units per second.
- Maximum reverse speed is `9` units per second.
- Leaving the authored track and shortcuts reduces the speed cap to 65 percent.
- Active-throttle drag uses an exponential coefficient of `0.35`.
- Coasting drag uses an exponential coefficient of `1.6`.
- Normal lateral grip uses a coefficient of `13`.
- Drift lateral grip uses a coefficient of `3.8`, allowing controlled slip.
- Steering rate is `2.55`, scaled by speed.
- Drifting increases steering response by a factor of `1.12`.
- Airborne steering is reduced to 35 percent.
- Reverse steering is inverted.
- Gravity is `27` units per second squared.
- Ramp launch velocity starts at `6` and gains up to `5` more based on speed.
- Furniture collisions resolve penetration and reflect inward velocity without damaging health.
- Kart-to-kart collisions separate both vehicles and exchange closing velocity.
- Invalid positions, falling below the level, or leaving the floor polygon trigger a checkpoint reset.

## Drift and mini turbo

A drift begins only when all conditions are true:

- Space is held.
- Steering magnitude exceeds `0.15`.
- Forward speed exceeds `8`.
- The kart is grounded.

Drift charge grows at `38 + abs(steer) * 20` per second and is capped at `100`.

| Charge | Tier | Spark color | Turbo duration |
|---:|---:|---|---:|
| 30 to 59 | 1 | Blue | 0.85 seconds |
| 60 to 89 | 2 | Gold | 1.3 seconds |
| 90 to 100 | 3 | Purple | 1.8 seconds |

Releasing Space converts the accumulated charge into the matching mini turbo and resets drift charge to zero.

## Energy boost

- Energy starts at 100.
- Boost activates while Shift and forward throttle are held, the kart is grounded, the player is not stunned, and energy is above zero.
- Boost drains 35 energy per second.
- Energy regenerates at 8 per second while boost is inactive.
- Boost raises acceleration and speed cap.
- Two fixed boost pads grant 1.5 seconds of turbo and have a two-second retrigger lockout.

## Items

Five library-themed items are implemented:

1. **Study Sprint**: grants 2.2 seconds of turbo.
2. **Citation Shield**: protects the kart for six seconds and absorbs one disruptive hit.
3. **Book Stack**: drops a physical book hazard behind the kart for 18 seconds.
4. **Ink Spill**: drops an ink hazard behind the kart for 18 seconds.
5. **Library Cart**: launches a homing cart projectile for up to eight seconds.

Item boxes are positioned at 8, 27, 46, 65, and 84 percent of the circuit. A kart can collect a box when it is within `2.5` units, has no held item, and is outside the two-second pickup cooldown.

Item distribution uses position-sensitive pools. Racers in the lower half receive a pool weighted toward Study Sprint. Leading racers receive more hazards. The system is deterministic from item serial, lap, and position.

Book and ink hazards affect opponents inside `1.55` units. Library carts hit inside `1.7` units and steer toward the nearest active opponent. Ink stuns for 1.1 seconds. Books and carts stun for 1.45 seconds. A hit reduces current velocity to 35 percent. A shield consumes itself instead of applying the disruption.

## Track and PCL environment

The map is an authored racing interpretation informed by the public PCL Level 3 organization. It is not a measured architectural survey.

Environment components include:

- An angular Level 3 floor boundary.
- A closed Catmull-Rom racing circuit sampled from 17 authored control points.
- Track width of `10.2` world units.
- Eight ordered checkpoints.
- Red and cream miniature curbs.
- Directional arrows.
- Two glowing boost pads.
- Five animated item boxes.
- One reading-table shortcut.
- One textbook ramp.
- A checkered start line and overhead PCL Pocket Racing banner.
- Central stair and lift core.
- Library administration volume.
- Reflection Space signage.
- Shelf banks 3G through 3S.
- Thousands of instanced, varied books.
- Giant tables, chairs, computers, lamps, backpacks, coffee cups, scattered study objects, structural columns, windows, ceiling beams, and lights.
- Five giant articulated students with varied clothing, skin tones, backpacks, and laptops.

Students have procedural heads, hair, torsos, arms, legs, shoes, accessories, and subtle idle motion. They tower over the toy karts and reinforce the scale without interfering with the race simulation.

## AI racers

AI racers follow a point ahead of the nearest track location. Look-ahead distance scales from 7 to 15 units with speed. They inspect track curvature 25 units ahead and adjust target speed:

- Sharp bend above `0.9` radians: target speed 15.
- Medium bend above `0.5` radians: target speed 20.
- Otherwise: target speed 28.

AI steering is heading error multiplied by `1.65` and clamped to the legal input range. AI racers drift during medium turns, boost on straight sections with more than 30 energy, brake for sharp bends, and reset if stuck below speed 2 for more than three seconds.

## Checkpoints, laps, and ranking

- The circuit has eight ordered checkpoints.
- A checkpoint counts only when crossed in the forward direction and within 85 percent of track width.
- Skipping a gate does not advance progress.
- Reverse crossings do not count.
- Crossing checkpoint zero after all previous gates completes a lap.
- Lap duration includes penalties earned during that lap.
- Resetting adds two seconds to total time and the current lap.
- Ranking prioritizes finished racers by finish time, then active racers by completed-lap distance plus clamped track progress.

## Multiplayer

Private multiplayer uses PeerJS WebRTC data channels.

- One host owns the authoritative world simulation.
- Guests send only sanitized input state.
- The host sends world snapshots every 50 milliseconds, approximately 20 snapshots per second.
- Guests send input at most every 33 milliseconds, approximately 30 inputs per second.
- Guests use local movement prediction and smoothly reconcile toward host snapshots.
- Large corrections above four world units snap prediction back to the host state.
- Smaller position and velocity corrections blend at 40 percent per snapshot.
- Heading corrections blend at 25 percent through the shortest angular path.
- Room codes contain six unambiguous uppercase characters.
- Codes omit confusing characters such as I, L, O, 0, and 1.
- Host peer IDs use `manta-pcl-[ROOMCODE]`.
- One room supports one host plus seven guests.
- Invite links use the `?room=CODE` query parameter.
- All human racers must be ready before the host can start.
- If a guest disconnects during a race, an AI racer takes over that kart.
- If the host disconnects, guests return to the menu with a clear message.

Network messages are JSON validated. Validation rejects non-finite numbers, prototype-pollution keys, objects deeper than 16 levels, objects larger than 4096 nodes, and messages larger than 65,536 characters. Sends are dropped when the data channel exceeds the configured backpressure limits. Connection attempts time out after 18 seconds. Optional custom PeerJS signaling and ICE/TURN configuration can be supplied through Vite environment variables.

## Camera and rendering

- Perspective camera with a close, low third-person chase position.
- Near plane `0.12`, far plane `500`.
- Camera distance grows slightly with speed.
- Camera targets a point ahead of the kart.
- Obstacle checks pull the camera forward to avoid clipping into furniture.
- Position smoothing coefficient is based on `1 - exp(-dt * 6)`.
- Look-target smoothing uses `1 - exp(-dt * 11)`.
- Field of view starts around 56 degrees and increases with speed.
- Collision events trigger subtle vertical camera shake.
- Menu camera presents the live library environment.
- ACES filmic tone mapping and sRGB output are enabled.
- The renderer uses soft PCF shadows.
- The primary directional shadow map is 2048 by 2048.
- A generated room environment provides reflections.
- Fog adds depth across the giant interior.
- Restrained Unreal Bloom emphasizes item boxes, pads, and race effects.
- Static repeated geometry and books use instancing to reduce draw calls.

## HUD

The HUD overlays the full-screen 3D viewport and uses the same minimal visual language as the other Manta games.

- Top left: game and location label.
- Top center: current lap and race timer.
- Top right: circular rotating minimap.
- Bottom left: race position, field size, lap progress, and connection state.
- Bottom center/right: circular speed and energy display.
- Bottom right: lap time, best lap, and drift charge.
- Left side: held item.
- Event feed: mini turbo, item, impact, shield, jump, lap, reset, and finish messages.
- Pause and scoreboard buttons.
- Temporary starting control hint.
- Countdown and finish placement overlays.

The minimap rotates with player heading, renders the complete circuit, and draws every racer. The speedometer displays kilometers per hour by converting simulation speed with a factor of `3.6`. The HUD updates at approximately 12.5 frames per second to avoid unnecessary DOM work while the Three.js scene continues at animation-frame speed.

## Menus and interface

### Main menu

- Live library environment behind a translucent arcade garage card.
- Racer-name field limited to 20 characters.
- Rotating live 3D preview of the selected kart.
- Five-button kart carousel.
- Eight circular paint swatches.
- Mode selector.
- Quick Race or Time Trial button.
- Create Private Lobby button.
- Six-character invite-code join form.
- Best Laps dialog.
- Map Sources dialog.

### Lobby

- Invite code and copy-link button.
- Racer list with synchronized color indicators.
- Ready state.
- Optional three-AI fill setting for the host.
- Start button enabled only when every human racer is ready.

### Pause menu

- Resume.
- Full controls list.
- Sound toggle.
- Leave race.
- Solo mode pauses simulation. Multiplayer continues while the local menu is open.

### Results

- Result title based on outcome.
- Final time.
- Ordered result table.
- Rematch for the host.
- Return to main menu.

## Audio

Audio is synthesized in the browser and begins only after user interaction.

- A triangle oscillator provides continuous engine sound.
- Engine frequency rises from a base of 35 Hz using speed multiplied by 5, capped by simulation speed 30.
- Engine gain increases slightly with speed.
- Event oscillators produce boost, impact, item, and finish cues.
- Audio can be disabled from the pause menu.

## Persistence

Local Storage keys preserve:

- Racer name
- Selected kart
- Selected paint
- Top ten time-trial laps
- Best valid ghost recording

Malformed or unavailable storage data fails safely. Record names are limited to 20 characters. Ghost arrays are accepted only below 15,000 samples.

## State model

The world contains:

- `phase`: lobby, countdown, playing, or finished
- `time`
- `countdown`
- `players`
- `effects`
- `effectSerial`
- `hazards`
- `projectiles`
- `itemSerial`
- `settings`: mode, laps, and bot count
- `winner`
- `round`
- `raceStart`
- `finishDeadline`
- `remaining`
- Private host input map `_inputs`

Each player contains identity, name, approved color, car ID, bot state, transform, velocity, heading, energy, drift charge and tier, item state, shield and stun timers, lap state, checkpoint state, ranking, times, penalties, grounded state, and internal input-edge state.

## Function reference

### `src/simulation.js`

- `createWorld(options)`: creates a sanitized race or time-trial world.
- `addPlayer(world, id, name, options)`: validates identity, name, color, bot status, and car, then spawns a racer. Returns `null` at eight racers.
- `removePlayer(world, id)`: removes a racer, deletes input state, and recalculates ranking.
- `setInput(world, id, input)`: finite-checks and clamps throttle and steering, then converts action fields to strict booleans.
- `startMatch(world)`: prevents duplicate starts, creates configured AI racers, resets all racers, increments the round, and begins the countdown.
- `resetMatch(world)`: returns a completed game to lobby state and respawns racers.
- `botInput(world, player)`: calculates AI throttle, braking, steering, drift, and boost.
- `grantItem(world, player)`: assigns a deterministic position-sensitive item.
- `useItem(world, player)`: activates turbo, shield, dropped hazard, or homing projectile behavior.
- `stepWorld(world, dt)`: validates time and advances the host simulation in 120 Hz substeps.
- `snapshot(world)`: returns a JSON-safe public world without host-only input fields or private player fields.
- `emit(world, type, player)`: records a short-lived numbered effect event.
- `spawn(world, player, index)`: resets a player onto the staggered starting grid.
- `resetKart(world, player)`: returns a player to the last earned checkpoint and applies the reset penalty.
- `distanceToSegment(...)`: measures distance to shortcut segments.
- `onShortcut(player)`: identifies valid shortcut pavement.
- `wallContacts(world, player)`: resolves kart versus axis-aligned furniture collisions.
- `gateProgress(world, player, oldX, oldZ)`: validates ordered forward checkpoint crossings and completes laps.
- `rank(world)`: calculates live and finished race order.
- `driftTier(charge)`: maps charge to tiers zero through three.
- `disrupt(world, player, type)`: consumes shields or applies item stun.
- `updateItems(world, dt)`: advances pickups, hazards, projectiles, homing, collisions, and expiry.
- `move(world, player, dt)`: applies the full vehicle, drift, boost, gravity, jump, collision, checkpoint, and reset simulation.
- `advance(world, dt)`: advances countdowns, racers, kart collisions, items, ranking, and race completion.

### `src/track-layout.js`

- `pointAtDistance(distance)`: wraps distance around the closed circuit and returns interpolated position, heading, and segment index.
- `nearestTrack(x, z)`: finds the closest point, heading, distance, and progress along the centerline.
- `surfaceAt(x, z)`: returns floor or ramp height.
- `insideFloor(x, z)`: performs point-in-polygon testing against the PCL floor outline.
- `curve(a, b, c, d, t)`: evaluates the Catmull-Rom circuit interpolation.
- Exported map data: `TRACK_POINTS`, `CENTERLINE`, `TRACK_LENGTH`, `TRACK_WIDTH`, `CHECKPOINTS`, `STACKS`, `OBSTACLES`, `RAMPS`, `BOOSTS`, `ITEM_BOXES`, `SHORTCUTS`, and `FLOOR_OUTLINE`.

### `src/network.js`

- `RoomConnection.host()`: creates a unique six-character host room.
- `RoomConnection.join(code)`: validates and connects to a host room.
- `RoomConnection.send(data)`: sends a guest message to the host.
- `RoomConnection.sendTo(id, data)`: sends a host message to one guest.
- `RoomConnection.broadcast(data)`: sends host state to all guests and returns the successful send count.
- `RoomConnection.close()`: cancels pending work and closes every peer and data channel.
- `_start(code, isHost)`: creates the PeerJS instance, timeout, and host or guest connection flow.
- `_wire(connection, id, inbound, opened, failed, generation)`: attaches connection lifecycle and validated data handlers.
- `_send(connection, data)`: enforces open-channel, backpressure, JSON, and size requirements.
- `roomCode(value)`: validates the invite-code format.
- `randomCode()`: generates an unambiguous cryptographically random code.
- `peerOptions()`: builds PeerJS and optional ICE configuration from environment variables.
- `validJSON(value)`, `encode(data)`, and `decode(data)`: protect the transport against invalid and oversized structures.
- `friendlyError(error)`: turns PeerJS failure types into useful player-facing messages.

### `src/scene.js`

- `new LibraryScene(parent)`: creates the renderer, camera, lights, environment reflections, post-processing, map, effects, and resize handling.
- `createLibrary()`: builds the PCL floor, track, stacks, books, architecture, furniture, students, props, ramps, pads, boxes, windows, and ceiling.
- `bookRamp(ramp)`: constructs a playable giant-book ramp.
- `createStart()`: builds the start banner, pencil supports, and checkered line.
- `batchStatic()`: converts compatible repeated static boxes into instanced meshes.
- `createCar(player)`: builds a selected procedural vehicle, player name sprite, ghost treatment, and drift particles.
- `createEffects()`: creates the reusable skid-mark pool and camera-shake state.
- `syncArcadeObjects(world)`: creates, updates, and removes item hazards, projectiles, and shields.
- `update(world, localId, dt, options)`: animates students, cars, wheels, steering, body roll, suspension, driver lean, exhaust, drift sparks, skid marks, hazards, camera, and rendering.
- `drawRadar(canvas, world, id)`: draws the rotating circuit and racers onto the HUD canvas.
- `textTexture`, `texture`, `quadRibbon`, `label`, `mesh`, and `mat`: generate reusable visual materials, geometry, labels, and procedural textures.

### `src/vehicles.js`

- `buildVehicle(options)`: builds one of five selected procedural vehicle bodies and returns animation references.
- `material`, `part`, `box`, `rod`, `tube`, and `oval`: construct standard vehicle parts.
- `shell`: generates smooth custom body shells from longitudinal profile stations.
- `pane`: generates curved windshield geometry.
- `wheel`: builds tire, sidewall, rim, disc, spokes, hub, bolts, and tread with separate steering and rolling pivots.
- `spoiler`: creates supports, foil, and carbon details.
- `driver`: creates helmet, visor, suit, hands, arms, steering wheel, and driver pivot.
- `batch`: merges compatible meshes by material to reduce per-kart draw calls.

### `src/students.js`

- `buildStudent(options)`: creates a giant articulated student with configurable clothing, skin, hair, backpack, and laptop.
- `add(parent, geometry, material, position)`: creates a shadow-enabled student part.
- `STUDENT_HEIGHT`: target giant-student height of 18 world units.

### `src/interface.js`

- `mountInterface()`: creates every menu, dialog, HUD element, and update method.
- `escape(value)`: escapes player-controlled HTML content.
- `raceTime(seconds)`: formats seconds as `minutes:seconds.milliseconds`.
- Returned `show(panel)`: displays home, lobby, results, or game state.
- Returned `update(world, id, connection)`: updates HUD values, classes, countdown, placement, items, and event feed.
- Returned `table(world)`: creates the escaped live scoreboard and result table.
- Returned `event(text)`: adds a temporary HUD event.
- Returned `reset()`: clears HUD round state and peak speed.

### `src/main.js`

- `storageGet` and `storageSet`: safely read and write preferences.
- `selectedCar` and `selectedPaint`: validate and persist garage selections.
- `syncGarage`: updates car buttons, paint buttons, preview, and menu-scene vehicle.
- `racer`: sanitizes and stores the current racer name.
- `settings`: derives race or time-trial settings from the menu.
- `show`: changes major interface view.
- `neutral` and `clearInput`: create or transmit a safe inactive input state.
- `busy`: disables or enables connection actions.
- `closeSession`: closes networking and resets session-specific state.
- `home`: rebuilds the animated menu preview world.
- `lobby` and `drawLobby`: show synchronized lobby state and readiness.
- `publish`: broadcasts the authoritative snapshot.
- `acceptState`: validates guest snapshots and reconciles local prediction.
- `receive`: processes guest or host protocol messages according to authority.
- `transport`: creates a configured `RoomConnection` and disconnect behavior.
- `createRoom`: hosts a private lobby.
- `joinRoom`: joins a private lobby and sends player identity, car, and paint.
- `practice`: starts local Race or Time Trial.
- `beginVisual`: initializes an active round and optional ghost.
- `start`: validates lobby readiness and begins the host race.
- `saveRecords`: saves completed time-trial laps and valid ghost samples.
- `results`: creates the end-of-race view.
- `rematch`: resets local or multiplayer race state.
- `pause` and `resume`: manage local pausing and the pause dialog.
- `input`: maps keyboard state to simulation controls.
- `predict`: runs lightweight guest-side movement prediction.
- `openRecords`: renders stored local best laps.
- `tick`: advances authoritative simulation, sends inputs, broadcasts snapshots, and transitions results.
- `frame`: renders prediction, ghost recording, scene animation, HUD, radar, and audio on each animation frame.

### `src/records.js`

- `readRecords(storage)`: validates and returns the top laps and ghost.
- `saveLap(name, time, ghost, storage)`: inserts and sorts a lap, keeping only ten and replacing the ghost only for a new best.
- `sampleGhost(samples, time)`: binary-searches ghost samples and interpolates the current pose.

### `src/audio.js`

- `GameAudio.start()`: creates and resumes the Web Audio graph.
- `GameAudio.setEnabled(value)`: enables or mutes sound.
- `GameAudio.update(speed, active)`: changes engine pitch and volume.
- `GameAudio.effect(type)`: creates a short event sound.

### `src/garage-preview.js`

- `new GaragePreview(parent, selection)`: creates a separate transparent Three.js scene for the rotating menu kart.
- `set(car, color)`: disposes the previous model and displays the new selection.
- `destroy()`: stops animation, observation, and renderer resources.

### `src/car-catalog.js`

- `CARS`: immutable metadata for the six blueprint vehicle bodies.
- `DEFAULT_CAR`: `apex`.
- `normalizeCar(value)`: accepts a known car ID or returns the default.

## Reliability requirements

- Preserve host authority for simulation, items, checkpoints, finishing, and ranking.
- Never trust guest position or world state.
- Keep all multiplayer names escaped in generated HTML.
- Preserve approved color validation and stable cross-screen identities.
- Dispose removed Three.js geometry and materials.
- Keep the game playable at 360 CSS pixels wide.
- Keep reduced DOM update frequency separate from render frequency.
- Keep browser audio behind user interaction.
- Do not break current controls, private rooms, rematches, host-loss handling, ghosts, records, items, shortcuts, or AI.
- Run `npm test`, `npm run build`, and `npm run test:browser` before deployment.

## Current automated coverage

The test suite covers room exchange, room validation, game namespaces, message validation, backpressure, disconnects, eight-player limits, unauthorized inbound connections, connection cancellation, race-result penalties, record ordering, ghost interpolation, rematches, countdown, sanitized inputs, acceleration, boost, drift tiers, ramps, gravity, checkpoints, resets, boundaries, AI race completion, furniture collisions, items, shields, hazards, giant students, shared car selection, shared paint, names, procedural vehicle geometry, steering pivots, wheel-roll pivots, responsive UI, WebGL rendering, real two-player WebRTC movement, authoritative synchronization, and host loss.
