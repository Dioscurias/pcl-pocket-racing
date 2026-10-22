# Six Blueprint Vehicles Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the current vehicle collection with exactly six bespoke 3D models that closely follow the supplied visual blueprints.

**Architecture:** Keep the existing vehicle selection, physics, animation, and multiplayer contracts. Replace the shared generic body branches with six dedicated builders in `src/vehicles.js`, backed by shared primitive and material helpers. Keep signature liveries fixed and apply user paint only to secondary panels.

**Tech Stack:** JavaScript, Three.js procedural geometry, Node test runner, Playwright, Vite

---

### Task 1: Lock the six-vehicle catalog

**Files:**
- Modify: `tests/vehicles.test.js`
- Modify: `tests/vehicle-selection.test.js`
- Modify: `src/car-catalog.js`

**Step 1: Write failing tests**

Assert the exact IDs `apex`, `motorcycle`, `roadster`, `apex-formula`, `formula-x`, and `muscle-gt`, exact display names, and absence of `coupe`.

**Step 2: Verify RED**

Run: `node --test tests/vehicles.test.js tests/vehicle-selection.test.js`

Expected: FAIL because the current catalog still contains seven entries including `coupe`.

**Step 3: Implement the catalog**

Update the immutable catalog to the approved six entries and keep the existing handling profiles where possible.

**Step 4: Verify GREEN**

Run: `node --test tests/vehicles.test.js tests/vehicle-selection.test.js`

Expected: PASS.

### Task 2: Replace generic bodies with blueprint builders

**Files:**
- Modify: `tests/vehicles.test.js`
- Modify: `src/vehicles.js`

**Step 1: Write failing tests**

Require each catalog entry to expose a signature ID in `group.userData.blueprint`, the motorcycle to have two wheels, and every other model to have four wheels. Assert body bounds remain compatible with miniature track collision footprints.

**Step 2: Verify RED**

Run: `node --test tests/vehicles.test.js`

Expected: FAIL because current models have no blueprint signature and share generic body branches.

**Step 3: Implement dedicated builders**

Create one builder per approved design. Preserve `{group, body, paint, driver, front, wheels, exhaust, model}` and motorcycle `lean`. Add signature panels, fixed livery colors, cockpit treatment, wheel sizes, suspension, wings, and number decals using procedural geometry.

**Step 4: Verify GREEN**

Run: `node --test tests/vehicles.test.js`

Expected: PASS with six finite, distinct models.

### Task 3: Update selection and previews

**Files:**
- Modify: `src/interface.js`
- Modify: `src/arcade-menu.css`
- Modify: `src/garage-preview.js`
- Modify: `scripts/car-preview.mjs`
- Modify: `scripts/browser-check.mjs`
- Create: `public/karts/*.png` generated preview updates

**Step 1: Write failing browser assertions**

Assert six vehicle buttons exist, no `coupe` button exists, all six preview images load, and the approved vehicle IDs survive local and multiplayer selection.

**Step 2: Verify RED**

Run: `TEST_URL=http://127.0.0.1:5230 node scripts/browser-check.mjs`

Expected: FAIL because the UI currently has seven vehicles and browser checks still select `coupe`.

**Step 3: Implement UI and previews**

Update the count, use a balanced three-column layout, tune per-model garage framing, regenerate all preview PNGs from the real models, and replace browser selections with approved IDs.

**Step 4: Verify GREEN**

Run the browser check again and confirm it passes without console errors.

### Task 4: Verify physics and publish

**Files:**
- Modify: `GAME_SPEC.md`

**Step 1: Run all automated verification**

Run: `npm test`

Expected: all tests pass, including every vehicle on every track.

**Step 2: Build production assets**

Run: `npm run build`

Expected: Vite exits successfully.

**Step 3: Inspect captures**

Review every generated vehicle card and the main garage screenshot for silhouette fidelity and clipping.

**Step 4: Commit and publish**

Commit the implementation, push `main`, deploy with `vercel --prod --yes`, and run the browser suite against `https://pcl-pocket-racing.vercel.app`.

