# Six Blueprint Vehicles Design

## Goal

Replace every generic or legacy vehicle body with exactly six player-selectable designs based on the supplied references.

## Vehicle mapping

| ID | Game name | Reference-defining features |
| --- | --- | --- |
| `apex` | Monster Buggy | Lime and cyan body, exposed suspension, oversized knobby tires, roof scoop, rear wing, number 55 |
| `motorcycle` | Velocity Bike | Cyan and coral full fairing, black visor, rider, yellow accents, sport-bike stance |
| `roadster` | Nova 88 | Magenta and navy enclosed canopy, four huge covered wheels, low wedge nose, rear loop wing, number 88 |
| `apex-formula` | Solar Formula | Yellow body, cyan and coral ribbons, purple wheels, open cockpit, front and rear wings, number 7 |
| `formula-x` | Volt Formula | Lime and purple body, halo cockpit, black suspension, wide slicks, large wings, number 01 |
| `muscle-gt` | Muscle GT | Red wide-body coupe, twin white stripes, hood scoop, rear wing, oversized tires, number 24 |

`Rally Coupe` and its `coupe` identifier are removed. Stored or received legacy values fall back to `apex` through the existing catalog normalization.

## Rendering architecture

`src/vehicles.js` retains the shared materials, wheel animation contract, exhaust contract, and returned object shape used by the scene. Each of the six designs gets a dedicated builder with its own proportions and recognizable silhouette. Small shared helpers remain for wheels, rods, body shells, spoilers, numbers, and batching.

Primary paint selection affects a constrained secondary paint region. The signature livery colors, number, wheel treatment, and defining body panels remain fixed so the reference design is recognizable on every screen and in multiplayer.

## Selection and multiplayer

The catalog contains only the six approved entries. Garage cards, bots, saved selection, lobby snapshots, remote racers, and respawns continue to use the catalog ID. The selection UI reports six vehicles and renders freshly generated cards from the real Three.js models.

## Validation

Automated tests assert the exact six-entry catalog, the absence of `coupe`, four wheels for every car, two wheels and a lean pivot for the motorcycle, distinct finite model geometry, signature metadata, and successful completion of every track. Browser checks select the new vehicle IDs and verify multiplayer synchronization. Visual captures confirm the six garage cards use the actual model silhouettes.

