# Reference cars implementation plan

Goal: Replace the simple karts with five playable reference-inspired miniature sports cars, preserving PCL, controls, physics and HUD.

Architecture: A shared five-car catalog validates host-authoritative player selections. A separate Three.js vehicle builder creates curved bodywork, exposed suspension, treaded wheels and sports-car variants. Merge static geometry by material; keep steering pivots and rolling wheels separate.

1. Add regression coverage for selected car persistence through snapshots/rematches and invalid guest choices.
2. Add catalog, simulation defaults and validation; default paint is blue, other racers retain distinct shared colors.
3. Build three open-wheel variants, one roadster and one coupe from the supplied image. No external dependencies or image-based billboards.
4. Add a persisted vehicle selector and send choices when hosting/joining. Preserve selections on rematch. Populate bots with different cars.
5. Integrate wheel roll and steering with existing animation and ghost rendering.
6. Verify model geometry/materials, production build, all gameplay tests and two-browser shared car/color state. Inspect screenshots of all five models.
7. Copy scoped files back to the existing game, commit, push and deploy its existing Vercel project.
