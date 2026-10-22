# UT Campus Loop Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace UT Grand Prix with the supplied UT Austin street circuit and its recognizable campus landmarks.

**Architecture:** Update the existing `ut-campus-grand-prix` data entry rather than adding a parallel track. Keep the shared centerline, road building, physics, HUD, multiplayer, and course selection systems intact, while refreshing its control points, landmarks, zones, scenery, obstacles, and course-world decoration.

**Tech Stack:** JavaScript, Three.js, Node test runner, Vite.

---

### Task 1: Lock the supplied route into testable track data

**Files:**
- Modify: `tests/tracks.test.js`
- Modify: `src/tracks.js`

**Step 1: Write the failing test**

Require `ut-campus-grand-prix` to contain the street-label landmark sequence Speedway, Dean Keeton, San Jacinto, 23rd Street, DKR Stadium, 21st Street, Guadalupe, 24th Street, University Avenue, and Inner Campus Drive. Assert that it has no vertical or flight ranges.

**Step 2: Run test to verify it fails**

Run: `node --test tests/tracks.test.js`

Expected: FAIL because the current track follows the obsolete PCL-to-Jester route.

**Step 3: Write minimal implementation**

Replace campus control points and landmarks with the closed loop from the approved reference. Set a consistent wide road width, remove vertical flight fields, and retain checkpoint, boost, item, and collision-compatible data.

**Step 4: Run test to verify it passes**

Run: `node --test tests/tracks.test.js`

Expected: PASS.

**Step 5: Commit**

```bash
git add src/tracks.js tests/tracks.test.js
git commit -m "feat: map UT Grand Prix to campus street loop"
```

### Task 2: Place landmarks and driveable boundaries

**Files:**
- Modify: `tests/course-geometry.test.js`
- Modify: `src/tracks.js`

**Step 1: Write the failing test**

Require structures for UT Tower, PCL, DKR Stadium, LBJ, McCombs, Gregory Gym, and Waller Creek. Assert that the start line and all checkpoints are within the playable floor boundary and that road width supports multiplayer karts.

**Step 2: Run test to verify it fails**

Run: `node --test tests/course-geometry.test.js`

Expected: FAIL because the replacement structures and bounds are absent.

**Step 3: Write minimal implementation**

Add location-appropriate decorative structures and safe collision obstacles. Expand the outdoor floor boundary to contain the whole route and preserve soft rails.

**Step 4: Run test to verify it passes**

Run: `node --test tests/course-geometry.test.js`

Expected: PASS.

**Step 5: Commit**

```bash
git add src/tracks.js tests/course-geometry.test.js
git commit -m "feat: add UT loop landmarks and boundaries"
```

### Task 3: Render the recognizable toy-scale campus

**Files:**
- Modify: `src/course-world.js`
- Test: `tests/tracks.test.js`

**Step 1: Write the failing test**

Add coverage for the route-specific landmark data consumed by the course world.

**Step 2: Run test to verify it fails**

Run: `node --test tests/tracks.test.js`

Expected: FAIL until the required structured landmark data is supplied.

**Step 3: Write minimal implementation**

Update campus scenery to render the new landmark arrangement, street signs, Waller Creek, sidewalks, trees, and campus road character. Retain performance-friendly primitives and no Jester flight decoration.

**Step 4: Run test to verify it passes**

Run: `node --test tests/tracks.test.js`

Expected: PASS.

**Step 5: Commit**

```bash
git add src/course-world.js tests/tracks.test.js
git commit -m "feat: render UT campus street circuit"
```

### Task 4: Run full regression and build verification

**Files:**
- Test: `tests/*.test.js`
- Test: `scripts/browser-check.mjs`

**Step 1: Run focused route tests**

Run: `node --test tests/tracks.test.js tests/course-geometry.test.js`

Expected: PASS.

**Step 2: Run complete test suite**

Run: `node --test --test-reporter=dot tests/*.test.js`

Expected: all tests PASS.

**Step 3: Build production assets**

Run: `npm run build`

Expected: successful Vite production build.

**Step 4: Run browser regression**

Run: `npm run dev -- --host 127.0.0.1`, then `TEST_URL=http://127.0.0.1:5173 node scripts/browser-check.mjs`.

Expected: course selection, local driving, and multiplayer regression complete without console errors.

**Step 5: Commit**

```bash
git add src/tracks.js src/course-world.js tests/tracks.test.js tests/course-geometry.test.js
git commit -m "test: verify UT campus loop"
```

