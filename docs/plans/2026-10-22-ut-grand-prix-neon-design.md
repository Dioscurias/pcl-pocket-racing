# UT Grand Prix Daylight Neon Design

## Direction

UT Grand Prix keeps its bright daytime setting and recognizable campus layout, but reads immediately as a finished arcade circuit. The visual hierarchy is deep charcoal asphalt, vivid red and white curbs, electric cyan edge lighting, hot magenta and yellow race accents, saturated UT orange architecture, rich green grass, and a clean blue sky.

## Track language

The asphalt receives a narrow luminous edge layer beneath the road surface. Existing curbs stay flat and alternating. Boost pads become emissive cyan and yellow elements. The start line gets a stronger gantry, lights, flags, and grid markings. Repeated guardrails, chevron boards, flags, barriers, and spectator structures sit beyond the safe drivable width and item-box clearance.

## Environment

Campus landmarks keep their current forms and positions. Materials become darker or more saturated to increase separation between the road, grass, water, buildings, and props. Lighting uses neutral tone mapping, stronger warm sunlight, cooler sky fill, reduced haze, and selective bloom on emissive race elements.

## Constraints

- Do not change physics, controls, checkpoints, lap logic, or the authored track centerline.
- Keep all solid-looking decoration outside the racing surface and away from item boxes.
- Reuse the current Three.js geometry and locally bundled Kenney assets.
- Keep the visual pass efficient through shared materials and instanced or repeated simple geometry.
- Preserve the other three courses.

## Verification

Geometry tests verify that generated race furniture remains outside the track clearance and item-box radius. The full simulation suite must remain green, the production build must succeed, and the UT course must render without console errors.
