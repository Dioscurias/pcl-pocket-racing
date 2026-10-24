# All Maps Fidelity and Audio Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Apply the existing PBR environment quality to every course and add an original high-energy 140 BPM procedural race soundtrack while keeping all courses and gameplay systems intact.

**Architecture:** Reuse the existing environment material loader and reflection map for all tracks. Add material-selection helpers in the course renderer so indoor geometry uses shared PBR surfaces without changing collision data. Replace the frame-triggered melody with a deterministic Web Audio step sequencer driven by an exported music profile.

**Tech Stack:** Three.js, Web Audio API, Node test runner, Vite, Playwright browser regression.

---

### Task 1: Specify shared fidelity and soundtrack behavior

**Files:**
- Modify: `tests/environment-assets.test.js`
- Modify: `tests/audio.test.js`

1. Add a failing assertion that every published environment style maps to PBR surfaces.
2. Add a failing assertion for the 140 BPM race profile, half-time snare, and final-lap subdivision.
3. Run the focused tests and confirm failure.

### Task 2: Extend PBR rendering to all courses

**Files:**
- Modify: `src/environment-assets.js`
- Modify: `src/course-world.js`
- Modify: `src/scene.js`

1. Add shared course material roles using the existing KTX2 families.
2. Apply PBR surfaces to indoor floors, roads, walls, shelves, counters, ramps, and major furniture.
3. Add framed glass, trim, supports, railings, and fixture detail using existing geometry helpers.
4. Load the reflection environment and material library for every track.
5. Tune indoor tone mapping, sun, hemisphere light, fog, and bloom without changing gameplay data.
6. Run focused rendering tests.

### Task 3: Build the original procedural race score

**Files:**
- Modify: `src/audio.js`
- Modify: `tests/audio.test.js`

1. Export a deterministic race music profile at 140 BPM.
2. Add kick, snare, hat, sub-bass, and filtered synth voices using Web Audio oscillators and generated noise.
3. Schedule sixteenth-note steps independently of frame rate.
4. Add final-lap hat and synth intensity while preserving mute, volume, engine sound, and autoplay handling.
5. Run audio tests.

### Task 4: Verify and publish

**Files:**
- Modify only if a regression requires a targeted fix.

1. Run `npm test` and expect all tests to pass.
2. Run `npm run build` and expect a successful Vite build.
3. Run the browser regression on all selectable courses and inspect screenshots.
4. Commit, merge to `main`, push GitHub, deploy with `vercel --prod --yes`, and verify the production URL.
