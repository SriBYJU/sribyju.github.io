# Scholark V5.5 QA — Legendary Interaction Pass

## Purpose
V5.5 is an additive interaction layer over the merged V5.4 cinematic build. It should make Scholark feel more spatial, connected, and premium without reintroducing scroll jank or breaking mobile usability.

## New interaction systems to verify
- Hero tool-network lines remain subtle and never compete with copy.
- Chapter navigator correctly jumps to Plan / Prepare / Improve / Achieve on desktop.
- Chapter navigator active state follows story scroll progress.
- Journey beacon travels smoothly along the orange path.
- Journey campus keeps the V5.4 line-draw reveal while the second depth plane remains subtle.
- Campus window lights appear as atmosphere rather than flashing UI.
- College Fit glass stack responds to hover without affecting layout.
- Tool and journey cards preserve existing tilt while adding restrained hover signals and art lift.
- Clicking a journey/tool card uses the shared-element expansion, then opens the correct destination once.
- Shared transition does not double-fire the older orange route wipe.
- Final giant Scholark mark remains background atmosphere and does not reduce text contrast.

## Desktop matrix
Test at 1440x900 and 1280x800:
- [ ] no horizontal overflow
- [ ] no stuck shared-transition overlay
- [ ] no duplicated route navigation
- [ ] card hover remains stable during fast pointer movement
- [ ] story chapter buttons remain keyboard focusable
- [ ] campus/path motion remains smooth during rapid scroll direction changes
- [ ] dark mode remains black + burnt orange

## Mobile matrix
Test at 390x844 and 375x812 in Safari/iOS-style viewport:
- [ ] no horizontal overflow
- [ ] chapter navigator hidden
- [ ] shared-element overlay disabled
- [ ] journey beacon hidden
- [ ] reduced campus-light count
- [ ] card scale effects disabled
- [ ] core scrolling remains native and uninterrupted
- [ ] safe-area behavior from V5.3/V5.4 remains intact

## Accessibility / motion
- [ ] prefers-reduced-motion disables looping V5.5 animations and shared transitions
- [ ] forced colors preserves actionable controls and hides decorative layers
- [ ] stage buttons expose visible focus rings and aria-current
- [ ] decorative campus/network/final-mark layers stay out of the accessibility tree

## Performance guardrails
- V5.5 does not replace the V5.3 scroll controller.
- Continuous JavaScript work is limited to one requestAnimationFrame batch.
- New route animation is transform + opacity based using a FLIP-style full-screen overlay.
- No new third-party runtime dependency is required.
- Decorative animation pauses with the existing hidden-tab pause state where applicable.
