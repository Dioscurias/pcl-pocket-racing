# Miniature Scale and Color Pass

**Goal:** Make the karts read as much smaller toys and replace the muted library palette with a richer arcade palette.

**Approach:** Apply one exported 0.65 vehicle scale at the root model so every selectable body, wheel, driver, flame, label, and shield scales consistently. Reduce the authoritative collision radius to match. Retune the chase camera to frame the smaller vehicle while preserving sight distance. Increase environmental color through warmer wood, burnt orange track boundaries, teal shortcuts, saturated book spines, gold boosts, brighter item boxes, warm lighting, and stronger tone mapping.

**Verification:** Assert the vehicle scale and collision radius in unit tests, run the full suite and production build, then capture and visually inspect desktop gameplay before deployment.
