# Driving Polish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make every course stable and forgiving, add a distinct motorcycle and Apex Formula, brighten the environments, and add persistent procedural music controls.

**Architecture:** Extend the current data-driven vehicle catalog, deterministic simulation, procedural Three.js renderer, and Web Audio class. Preserve routes, networking messages, and UI structure. Each behavior change starts with a regression test.

**Tech Stack:** JavaScript, Three.js, Web Audio API, Node test runner, Playwright, Vite.

---

### Task 1: Vehicle catalog and handling profiles

**Files:** Modify `tests/vehicle-selection.test.js`, `tests/vehicles.test.js`, `src/car-catalog.js`, `src/simulation.js`, `src/vehicles.js`, `src/interface.js`, and vehicle preview assets.

1. Write tests requiring Apex Formula and Motorcycle and forbidding the old IDs and names.
2. Run the focused tests and confirm they fail.
3. Add catalog stats and normalization migration, then add the procedural models and motorcycle animation pivots.
4. Run focused and full tests.

### Task 2: Stable arcade simulation

**Files:** Modify `tests/simulation.test.js`, `tests/tracks.test.js`, `src/simulation.js`, `src/main.js`, and `src/scene.js`.

1. Add tests for speed-dependent steering, motorcycle response, swept obstacle collision, tangent-preserving wall impacts, smooth ground following, edge containment, and player recovery.
2. Confirm each new test fails for the missing behavior.
3. Implement handling-profile movement, swept substeps, surface snapping, soft track rails, and recovery timers.
4. Keep client prediction aligned with the authoritative profile logic.
5. Run focused and full tests.

### Task 3: Track safety and colorful rendering

**Files:** Modify `tests/course-geometry.test.js`, `tests/tracks.test.js`, `src/tracks.js`, `src/course-world.js`, `src/scene.js`, and CSS as needed.

1. Add assertions that routes have safe widths, continuous height changes, and containment metadata.
2. Confirm the assertions fail where metadata is absent.
3. Add soft rails, widen narrow driveable corridors, smooth route heights, and update the shared palette, markings, curbs, clouds, banners, lighting, and rounded props.
4. Verify every AI vehicle completes every course without a reset.

### Task 4: Procedural music and persistent controls

**Files:** Create `tests/audio.test.js`; modify `src/audio.js`, `src/interface.js`, `src/main.js`, and menu/pause CSS.

1. Add pure-state tests for persisted audio preferences and menu/race intensity selection.
2. Confirm they fail.
3. Add synthesized menu/race sequencers, final-lap/high-speed intensity, persistent mute, and master volume.
4. Wire the controls without violating autoplay requirements.

### Task 5: Assets and end-to-end verification

**Files:** Modify `scripts/browser-check.mjs`, `scripts/car-preview.mjs`, `README.md`; update `public/karts/*.png`.

1. Update browser assertions for the new catalog and audio controls.
2. Generate the new vehicle previews from the real procedural models.
3. Run all unit tests and the production build.
4. Exercise every vehicle-track combination in deterministic simulation and run the browser test on desktop and mobile.
5. Inspect screenshots, check the console, and commit the verified result.
