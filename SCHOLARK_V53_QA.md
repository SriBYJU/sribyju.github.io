# Scholark V5.3 — cinematic polish / performance QA

Branch: `scholark-v5-cinematic`

## Changes in this pass
- Added the `10K+ students monthly` proof point to the cinematic orbit and proof strip.
- Reworked dark mode so the cinematic world uses a black + burnt-orange visual system instead of the light-scene palette.
- Added a deeper 10-layer Scholark S extrusion, a fourth portal ring, core glow, sun rays, dust field, extra floating tool layer, and a denser mid-scene composition.
- Replaced the green mid-scene with a Scholark-orange motion field to keep brand continuity.
- Added fast route-wipe transitions for spatial continuity without blocking navigation.
- Changed the legacy V3/V4 loader chain so V5.3 CSS/JS starts loading immediately rather than waiting for the V4 workspace first.
- Added a cinematic preflight class / critical style to hide the legacy homepage while the new scene mounts, reducing the old-UI flash.
- Reworked dynamic navigation so College Intelligence / Career Outcomes wait for their V4 pages instead of throwing an unavailable-state message.
- Changed `Features` navigation into an in-page scroll to the real tools section rather than routing to a non-existent page.
- Added mobile-specific content sizing, safe-area handling, fewer expensive decorative layers, and 48px primary touch targets.

## Scroll / performance work
- Cached cloud, orbit, through-copy, path, and fit-scene nodes instead of querying them on every frame.
- Replaced frame-rate-dependent lerp behavior with time-based exponential smoothing.
- Removed per-frame dynamic blur from cloud layers.
- Replaced margin-based cloud drift with compositor-friendly independent `translate` animation.
- Added `contain` / `content-visibility` to isolate below-the-fold work.
- Pauses continuous decorative animation when the document is hidden.
- Keeps one primary sticky scrollytelling sequence rather than pinning multiple sections.
- Uses transform / opacity for the scroll choreography and keeps body copy out of parallax.

## Static verification
- `scholark-v53.js` passes `node --check`.
- rewritten `scholark-v3.js` passes `node --check`.
- updated `scholark-v4-data.js` passes `node --check`.
- `scholark-v53.css` has balanced rule braces.
- V5.3 navigation only uses real pages or waits for V4 dynamic pages before opening them.

## UI UX Pro Max guidance applied
The pass explicitly follows the skill's complex scrollytelling / performance guidance: deterministic sticky height, scrub-like continuous motion, transform/opacity animation, decorative-only parallax, limited pointer-magnetic effects, cached high-frequency work, mobile simplification, reduced-motion support, 44px+ targets, and dark-mode pairing.

## Connected design reference
The existing Canva design `Scholark V5 Motion Concept` was re-opened as a connected visual reference during this pass so the code stays aligned with the established Scholark art direction.

## Remaining live checks before calling this 9.6+
- Cold-load check on production to confirm the legacy-home flash is gone under real network conditions.
- Safari iPhone scroll test for sticky / dynamic viewport behavior.
- Chrome Android / iOS Safari check for the entire S fly-through at slow and fast scroll speeds.
- Live dark-mode pass through all cinematic stages.
- Confirm V4 dynamic pages appear before the 2.6s navigation fallback on a slow network.
- Performance trace on a mid-tier phone with CPU throttling.
