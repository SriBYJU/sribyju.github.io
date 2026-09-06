# Scholark V5.6.1 — scroll stability fix

## Reported symptoms
- V5.6 appeared unchanged on the live site after merge.
- During a longer homepage scroll, the page could appear to reload or snap back toward the top.

## Root causes addressed
1. **Late enhancement loading:** V5.4 → V5.5 → V5.6 were chained through timer-based loaders inside `scholark-v4-data.js`. A user could begin scrolling before later sections were mounted.
2. **Cache visibility:** enhancement files used stable URLs, so a cached loader could keep an older visual stack alive after a deploy.
3. **Safari layout correction risk:** `content-visibility:auto` + guessed `contain-intrinsic-size` values were used on several large interactive sections. When the real section height became known, Safari/WebKit could correct the scroll anchor.
4. **Root overflow mutation:** the shared-element transition temporarily changed `html` to `overflow:hidden`, which can reset scroll position in Safari.
5. **Touch click synthesis:** a touch scroll ending over a routed card could still generate a synthetic click in some WebKit cases, causing `showPage()` to run; the legacy router intentionally scrolls to `0,0` on navigation.
6. **Redundant same-page routing:** any accidental `showPage('home')` while already on the homepage would invoke the legacy router's `window.scrollTo(0,0)`.

## V5.6.1 changes
- deterministic, versioned V5.3 → V5.4 → V5.5 → V5.6 → V5.6.1 bootstrap
- versioned CSS preloading so the Observatory and new motion layer are immediately visible after deploy
- timer-based V5.4/V5.5/V5.6 loader IIFEs are bypassed by the bootstrap
- new `scholark-v561.css` removes `content-visibility:auto` from the interactive homepage sections and relaxes layout containment around the tall sticky story
- shared transition no longer changes the root vertical scrolling mode
- routed cards/stage controls explicitly preserve vertical pan gestures
- new gesture guard suppresses only clicks synthesized from an actual drag/scroll gesture
- `showPage()` becomes idempotent for the already-active page so a redundant home route cannot snap the user to the top
- structural late-mutation guard protects the current viewport if a future enhancement unexpectedly inserts a major section after the user is already deep in the page

## Regression gates before merge
- cold load: no legacy UI flash and Observatory appears on first full scroll
- no scroll jump at hero exit, proof strip, Journey, College Fit, Observatory, Tools, or Final
- desktop wheel/trackpad: no route activation without click
- iPhone/Safari vertical swipes over Journey/Tool cards do not open a route
- intentional taps/clicks on cards still open the correct destination
- repeated `showPage('home')` while home is active does not move scroll position
- route transitions still work without locking root scroll
- dark mode, reduced motion, and 390px layout remain usable
