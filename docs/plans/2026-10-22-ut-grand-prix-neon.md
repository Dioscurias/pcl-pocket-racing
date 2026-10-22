# UT Grand Prix Daylight Neon Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Turn UT Grand Prix into a vivid daylight arcade circuit with neon track accents and recognizable race furniture while preserving gameplay.

**Architecture:** Add campus-only visual metadata and deterministic decoration placement to the existing track/course modules. Render the new surface layers and furniture with shared Three.js materials, then switch the existing renderer to a campus-specific neutral lighting profile. No physics or race-state APIs change.

**Tech Stack:** JavaScript, Three.js, Vite, Node test runner

---

### Task 1: Lock decoration safety in tests

**Files:**
- Modify: `tests/course-geometry.test.js`
- Modify: `src/course-world.js`

**Step 1: Write the failing test**

Import `campusRaceDecor` and assert that the campus course produces at least 24 decorations, each farther than half the track width plus the safety margin and at least eight units from every item box.

**Step 2: Run test to verify it fails**

Run: `node --test tests/course-geometry.test.js`

Expected: FAIL because `campusRaceDecor` is not exported.

**Step 3: Write minimal implementation**

Generate deterministic decoration records from sampled track distances. Place them on alternating sides using the centerline heading and reject samples near nonadjacent road sections or item boxes.

**Step 4: Run test to verify it passes**

Run: `node --test tests/course-geometry.test.js`

Expected: PASS.

### Task 2: Render the circuit surface and race furniture

**Files:**
- Modify: `src/course-world.js`
- Modify: `src/tracks.js`

**Step 1: Add the daylight-neon campus palette**

Set the campus sky, fog, asphalt, grass, curb, boost, cyan, magenta, yellow, and building colors in the UT track definition.

**Step 2: Layer the track surface**

Render a slightly wider cyan underlay beneath the campus asphalt, retain flat red-white curbs, add start-grid marks, and replace boost pads with emissive cyan/yellow materials.

**Step 3: Add race furniture**

Render low guardrails, alternating chevron boards, flags, tire stacks, and sponsor-free banners from `campusRaceDecor`. Keep every object outside the tested clearance.

**Step 4: Strengthen the start gantry**

Add light clusters, side towers, checkered details, and vivid UT Grand Prix signage using the existing `start` group.

### Task 3: Apply the campus lighting profile

**Files:**
- Modify: `src/scene.js`

**Step 1: Retain references to scene lights**

Store the existing hemisphere and directional lights on `LibraryScene`.

**Step 2: Switch lighting with the selected course**

Use neutral tone mapping, lower exposure, stronger warm sunlight, vivid sky fill, distant fog, and restrained bloom for UT Grand Prix. Restore the current indoor profile for other tracks.

### Task 4: Validate the finished pass

**Files:**
- Test: `tests/course-geometry.test.js`
- Test: `tests/simulation.test.js`

**Step 1: Run focused geometry tests**

Run: `node --test tests/course-geometry.test.js`

Expected: PASS.

**Step 2: Run all tests**

Run: `npm test`

Expected: 55 or more tests pass with zero failures.

**Step 3: Build production assets**

Run: `npm run build`

Expected: Vite production build succeeds.

**Step 4: Commit**

Stage only the design, implementation, and test files, then commit with `feat: restyle UT Grand Prix as neon circuit`.
