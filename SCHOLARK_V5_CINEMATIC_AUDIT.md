# Scholark V5 Cinematic — Current Audit

Branch: `scholark-v5-cinematic`
Status: **Draft / visual QA required before merge**

## Scope completed
- Rebuilt the homepage as a progressive V5 layer without replacing the legacy Scholark tools.
- Preserved the cream / burnt-orange visual identity and existing Scholark mark.
- Added a persisted brand source of truth at `docs/brand-guidelines.md`.
- Added a persisted V5 design system at `design-system/scholark/MASTER.md`.
- Added one primary pinned scrollytelling hero with a scroll-controlled camera dive.
- Broke the Scholark mark into independently animatable plate / paper-S / spark layers.
- Added procedural cloud layers, line-art campus scenery, light contours, and floating UI depth objects.
- Added pointer depth, card tilt, scroll parallax and reveal choreography.
- Added a stats strip, connected-journey section, college decision scene, live tool grid and closing CTA.
- Replaced homepage emoji-style V5 icons with inline SVG UI icons.
- Kept V5 cards wired to existing live Scholark tools rather than mock pages.
- Added mobile and reduced-motion fallbacks.

## UI UX Pro Max rules applied
- One dominant pinned storytelling section rather than repeated pinning.
- Transform / opacity animation instead of width / height / margin animation.
- Decorative-only parallax; body copy and controls stay stable.
- Layer count constrained rather than creating a large number of independent scroll effects.
- Scroll work is batched through `requestAnimationFrame` with passive listeners.
- Complex pointer effects are skipped on coarse pointers.
- `prefers-reduced-motion` renders the final readable state without the camera choreography.
- Buttons use native semantics and visible `:focus-visible` states.
- Primary CTA targets meet the 44px+ touch requirement.
- Responsive simplification removes decorative layers before they compete with content.

## Static verification completed
- V5 JavaScript passed syntax validation with Node before publication to the branch.
- V5 CSS parsed without stylesheet parser errors before publication to the branch.
- V4 data-layer loader is present and waits for the V4 workspace before loading `scholark-v5.js`.
- Branch is based directly on current `main` and does not modify the legacy calculator / AP / SAT logic files in this pass.

## Required live QA before merge
- Desktop visual pass at 1440px and 1024px.
- Tablet pass at 768px.
- Mobile pass at 375px / narrow browser widths.
- Confirm first-paint hero composition with production Google Fonts loaded.
- Scrub the complete logo camera sequence both slowly and rapidly.
- Verify no sticky / viewport-height issues in Safari iOS.
- Verify tool-card routes after V3/V4 wrappers initialize.
- Keyboard-only navigation and focus order.
- Reduced-motion browser test.
- Dark-theme interaction with the V5 homepage.
- Performance trace on a mid-tier mobile device.

## Merge rule
Do not merge to `main` until the live visual pass confirms that the motion feels cinematic without interfering with navigation, reading, or mobile scrolling.
