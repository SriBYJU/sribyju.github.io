# Scholark V5.6 QA — Observatory / interaction pass

## New systems to verify

### 1. Observatory carousel
- Loads between College Fit and the live Tools grid.
- Four stages: Plan, Prepare, Improve, Achieve.
- Prev / Next / Pause controls work with mouse, keyboard, and touch.
- Left/Right arrow keys change slides while the stage is focused.
- Automatic rotation pauses on hover, focus, hidden tab, offscreen state, explicit Pause, and `prefers-reduced-motion`.
- Each CTA opens the correct live Scholark destination.
- Slide changes do not move keyboard focus.

### 2. Split-word headline reveal
- Only the short Observatory headline uses the complex split-word treatment.
- Final readable text is preserved via an `aria-label`.
- Reduced motion renders the completed headline immediately.

### 3. Immersive skip path
- `Skip cinematic` is visible and keyboard operable.
- It jumps directly to the first proof/content area.
- Touch target remains at least 44px.

### 4. Scroll-reactive atmosphere
- Existing cloud atmosphere responds subtly to scroll direction / velocity.
- Fast scrolling creates a short portal bloom, not a persistent flash.
- No layout-affecting properties are animated.
- Mobile disables the speed bloom and wind skew.

### 5. Brand consistency
- Cream / burnt-orange identity remains unchanged in light mode.
- Dark mode remains black + burnt orange.
- V5.6 uses semantic brand variables layered over the existing Scholark tokens rather than introducing a new palette.

## Required viewport checks
- 1440 × 900 desktop
- 1024 × 768 landscape tablet
- 768 × 1024 tablet
- 430 × 932 large phone
- 390 × 844 iPhone-class phone
- 375 × 667 compact phone

## Required behavioral checks
- Cold load: no legacy hero flash.
- No horizontal overflow at any viewport.
- Observatory controls remain reachable at 200% zoom.
- Dark mode: no white/cream flash during slide changes.
- Reduced motion: no auto-rotation, no spinning orbits, no word motion, no wind bloom.
- Forced colors: decorative observatory world is removed and controls remain visible.
- Hidden tab: carousel timer stops.
- Focus inside Observatory: carousel timer stops.
- Hover inside Observatory: carousel timer stops.
- All tool destinations still open after V5.6 loads.

## Performance guardrails
- No new third-party runtime dependency.
- One small requestAnimationFrame loop handles the V5.6 wind response.
- Continuous decorative movement is transform / opacity based.
- Observatory is not pinned, avoiding a second major pinned scrollytelling section.
- `content-visibility` is retained for below-the-fold work.

## Merge gate
Keep the PR draft until the live GitHub Pages build is visually checked on desktop and real iPhone/Safari against the supplied reference video. The target is not simply “many animations”; it is smooth spatial continuity with no dropped-scroll feel.
