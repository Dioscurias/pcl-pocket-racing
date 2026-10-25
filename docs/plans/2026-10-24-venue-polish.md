# Venue Polish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve item-box readability, enclose the UT map as a race venue, refine the sky, and correct vehicle and wheel proportions without changing gameplay.

**Architecture:** Keep the existing Three.js scene graph and simulation contracts. Add small exported rendering specifications that tests can verify, then construct richer meshes from those specifications inside the existing course, environment, and vehicle modules.

**Tech Stack:** JavaScript, Three.js, Node test runner, Vite, Playwright browser inspection.

---

### Task 1: Visual specifications

**Files:**
- Modify: `tests/environment-assets.test.js`
- Modify: `tests/course-geometry.test.js`
- Modify: `tests/vehicles.test.js`

1. Add tests for soft multi-puff clouds, named layered item boxes, campus perimeter segments, vehicle target lengths, and wheel radii.
2. Run the focused tests and confirm they fail because the new specifications do not exist.

### Task 2: Sky and race venue

**Files:**
- Modify: `src/environment-assets.js`
- Modify: `src/course-world.js`

1. Replace stroke clouds with radial-gradient cloud clusters.
2. Add a non-colliding race-venue perimeter around the campus floor.
3. Build the layered item box while preserving its group identity and animation path.
4. Run the focused tests until they pass.

### Task 3: Vehicle proportions and wheels

**Files:**
- Modify: `src/car-catalog.js`
- Modify: `src/vehicles.js`

1. Put visual target dimensions and wheel layouts in one consistent specification.
2. Normalize every GLB using the target dimensions.
3. Use each measured wheel radius for mesh rotation.
4. Run vehicle tests until they pass.

### Task 4: Browser and production verification

**Files:**
- Modify only if browser inspection finds a rendering defect.

1. Run `npm test` and expect all tests to pass.
2. Run `npm run build` and expect a successful Vite production build.
3. Inspect the menu and UT Grand Prix with all four vehicles in Chromium.
4. Commit, merge to `main`, push, deploy to Vercel, and verify the production alias.
