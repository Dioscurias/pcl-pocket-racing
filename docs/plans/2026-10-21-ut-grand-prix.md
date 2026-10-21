# UT Grand Prix Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a fourth continuous course joining PCL Level 2, the UT Austin campus, and Jester Center.

**Architecture:** Define the complete route, zones, landmarks, obstacles, and flight sector in the shared track catalog. Add a dedicated campus environment builder that uses the same data for visible structures and collision geometry. Keep simulation, HUD, menu selection, multiplayer snapshots, and course previews on the existing interfaces.

**Tech Stack:** JavaScript, Three.js, Vite, Node test runner, Playwright

---

### Task 1: Course contract

**Files:**
- Modify: `tests/tracks.test.js`
- Modify: `src/tracks.js`

1. Add failing tests for the `ut-campus-grand-prix` catalog entry, zone order, landmarks, floor bounds, flight range, and a clean AI lap.
2. Run `npm test` and confirm the new tests fail because the course does not exist.
3. Add the course definition, safe checkpoints, boost pads, item boxes, shortcuts, obstacles, and campus metadata.
4. Run `npm test` and tune only the route until the catalog and AI lap tests pass.

### Task 2: Shared campus environment

**Files:**
- Modify: `tests/course-geometry.test.js`
- Modify: `src/course-world.js`

1. Add failing tests for outdoor road sections and required landmark data.
2. Run the focused test and confirm failure.
3. Add `campus()` and reusable building, lawn, tree, lamp, banner, and zone-sign builders.
4. Recreate PCL Level 2 rooms from the attached plan and add the Jester interior at the route's far end.
5. Use instancing or merged meshes for repeated details.
6. Run all tests.

### Task 3: Menu and course preview

**Files:**
- Modify: `src/interface.js`
- Modify: `src/arcade-menu.css`
- Create: `public/courses/ut-campus-grand-prix.jpg`

1. Add a browser assertion that four course cards render and the new card selects correctly.
2. Confirm the browser test fails.
3. Make the course grid handle four cards on desktop and horizontal or two-column layout on smaller screens.
4. Generate a real game-engine preview with the Tower and outdoor race line visible.
5. Confirm the menu fits at 1440 x 900 and 360 x 800.

### Task 4: Gameplay verification

**Files:**
- Modify: `scripts/browser-check.mjs`

1. Select UT Grand Prix and verify its scene and track ID.
2. Drive on the production-equivalent local build and verify movement, reset, HUD, minimap, and course selection.
3. Run `npm test`, `npm run build`, and the full browser test.
4. Inspect PCL, campus, Jester, desktop menu, and mobile menu screenshots.

### Task 5: Publish

1. Run `git diff --check` and inspect the final diff.
2. Commit the course and assets.
3. Push `main` to GitHub.
4. Deploy the linked Vercel production project.
5. Run the full browser test against `https://pcl-pocket-racing.vercel.app`.

