# Vehicle Wheel Rigs Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make every supplied GLB vehicle visibly react to driving by adding true wheel spin, steering, and motorcycle-specific articulation.

**Architecture:** The existing GLBs contain a static combined mesh, so `src/vehicles.js` will build a small rig around each supplied body using per-vehicle wheel anchors. The renderer will drive the rig from the existing simulation state, leaving movement physics and imported body materials unchanged.

**Tech Stack:** Three.js, GLTFLoader, Node test runner, Vite.

---

### Task 1: Specify wheel-rig anchors and behavior

**Files:**
- Modify: `src/car-catalog.js`
- Modify: `tests/vehicles.test.js`

**Step 1: Write the failing test**

Add a test that requires every catalog vehicle to declare four wheel anchors, front-wheel indices, radius, and an articulation profile. Require the motorcycle profile to declare a front-fork pivot and rear suspension response.

**Step 2: Run test to verify it fails**

Run: `node --test tests/vehicles.test.js`

Expected: FAIL because the current catalog has no wheel-rig definitions.

**Step 3: Write minimal implementation**

Add `wheelRig` metadata to each supplied design. Keep this data strictly visual: local wheel positions, wheel radius, front wheel indices, and whether the model is a motorcycle.

**Step 4: Run test to verify it passes**

Run: `node --test tests/vehicles.test.js`

Expected: PASS.

**Step 5: Commit**

```bash
git add src/car-catalog.js tests/vehicles.test.js
git commit -m "test: define vehicle wheel rigs"
```

### Task 2: Build visible wheel and steering assemblies around supplied bodies

**Files:**
- Modify: `src/vehicles.js`
- Modify: `tests/vehicles.test.js`

**Step 1: Write the failing test**

Add a test that calls `buildVehicle` for each catalog entry and requires four wheels, two steering pivots, wheel spin pivots, and motorcycle fork/rear-suspension nodes when applicable.

**Step 2: Run test to verify it fails**

Run: `node --test tests/vehicles.test.js`

Expected: FAIL because `buildVehicle` currently returns empty `wheels` and `front` collections.

**Step 3: Write minimal implementation**

Create detailed toy-scale tire, rim, hub, and brake-disc geometry at the catalog anchors. Place it over the static baked wheels to preserve the supplied body design. Attach front wheels to steering pivots, attach rear wheels to stable spin pivots, and add a dedicated fork and rear-suspension hierarchy for the motorcycle.

**Step 4: Run test to verify it passes**

Run: `node --test tests/vehicles.test.js`

Expected: PASS.

**Step 5: Commit**

```bash
git add src/vehicles.js tests/vehicles.test.js
git commit -m "feat: add animated vehicle wheel rigs"
```

### Task 3: Drive wheel rigs from racing state

**Files:**
- Modify: `src/scene.js`
- Modify: `tests/vehicles.test.js`

**Step 1: Write the failing test**

Extract or expose a small visual update helper and test that forward velocity rotates every wheel, steering input turns only front pivots, and motorcycle lean drives its chassis and fork assembly.

**Step 2: Run test to verify it fails**

Run: `node --test tests/vehicles.test.js`

Expected: FAIL because no wheel rig receives visual state updates.

**Step 3: Write minimal implementation**

Update the scene renderer to apply speed-based wheel rotation, smooth steering, small suspension response from speed and ground state, and motorcycle fork/lean/rear-travel animation. Preserve the existing exhaust and drift effects.

**Step 4: Run test to verify it passes**

Run: `node --test tests/vehicles.test.js`

Expected: PASS.

**Step 5: Commit**

```bash
git add src/scene.js tests/vehicles.test.js
git commit -m "feat: animate wheel rigs during races"
```

### Task 4: Verify imported models in the running game

**Files:**
- Test: `tests/vehicles.test.js`
- Test: `scripts/browser-check.mjs`

**Step 1: Run focused tests**

Run: `node --test tests/vehicles.test.js`

Expected: PASS.

**Step 2: Run complete tests**

Run: `node --test --test-reporter=dot tests/*.test.js`

Expected: all tests PASS.

**Step 3: Build production assets**

Run: `npm run build`

Expected: successful Vite production build.

**Step 4: Run browser regression**

Run: `npm run dev -- --host 127.0.0.1` in one terminal, then `TEST_URL=http://127.0.0.1:5173 node scripts/browser-check.mjs` in another.

Expected: the game starts, each vehicle selection loads, and existing driving and multiplayer checks pass without console errors.

**Step 5: Commit**

```bash
git add tests/vehicles.test.js src/vehicles.js src/scene.js src/car-catalog.js
git commit -m "test: verify vehicle wheel reactions"
```
