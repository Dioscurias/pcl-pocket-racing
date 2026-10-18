# PCL Pocket Racing Arcade Overhaul Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Turn the existing PCL racer into a fuller original arcade kart game with stronger drifting, items, hazards, multiplayer synchronization, richer feedback, and a cleaner Manta lineup.

**Architecture:** Extend the deterministic host-authoritative simulation with drift tiers and library-themed items. Serialize the resulting state through the existing snapshots, render new race objects in Three.js, and expose concise status through the existing HUD. Remove Turtle Pond from the separate Manta data source and deployment infrastructure.

**Tech Stack:** Three.js, Vite, PeerJS/WebRTC, Node test runner, Playwright.

---

### Task 1: Archive Turtle Pond
- Verify GitHub visibility and archive state.
- Delete the Turtle Pond Vercel project.
- Keep local source unchanged.

### Task 2: Test arcade driving and items
- Add failing simulation tests for three drift tiers, pickups, item activation, hazards, shields, and serializable multiplayer state.
- Run the focused tests and confirm expected failures.

### Task 3: Implement authoritative arcade systems
- Add item box positions to `src/track-layout.js`.
- Extend sanitized input and player/world state in `src/simulation.js`.
- Implement deterministic pickup selection, item activation, traps, homing carts, shields, impacts, expiry, and drift tiers.
- Run all unit tests.

### Task 4: Render and communicate the systems
- Render item boxes, traps, projectiles, and shields in `src/scene.js`.
- Add an item slot, drift-tier feedback, control hint, event messages, and item input in `src/interface.js`, `src/main.js`, and `src/style.css`.
- Expand audio feedback in `src/audio.js`.
- Run build and browser verification.

### Task 5: Update Manta and publish
- Remove Turtle Pond from the Manta project data and tests.
- Update PCL copy and image only with verified content.
- Commit and push both repositories.
- Deploy PCL Pocket Racing and Manta to their existing Vercel projects.
- Verify both production pages.
