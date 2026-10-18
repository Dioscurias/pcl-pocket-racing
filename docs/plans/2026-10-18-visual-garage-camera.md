# Visual Garage and Closer Camera

**Goal:** Make car and paint selection immediately visible and bring the gameplay camera closer to the kart.

**Design:** Keep the accessible native car select as the state source, but present five large car cards, eight paint swatches, and a dedicated Three.js preview using the actual in-game vehicle builder. The preview rotates slowly and updates immediately. Store model and paint locally, include both in multiplayer join messages, validate paint against the shared palette, and preserve it in authoritative snapshots. Duplicate paint choices are allowed because names and position markers remain distinct.

The physical kart remains at 65% scale. Only chase-camera distance, height, look point, and field of view change so the kart reads larger on screen without losing its toy scale relative to shelves and furniture.

**Verification:** Add simulation tests for selected paint validation and snapshot persistence, run all unit tests and the production build, extend browser testing to select a visible card and swatch, then visually inspect gameplay framing.
