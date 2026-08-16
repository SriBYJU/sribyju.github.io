---
name: testing-scholark
description: Test Scholark app end-to-end. Covers local server setup, free authenticated access, SAT/ACT Prep, cloud/local persistence, and responsive UI verification.
---

# Testing Scholark

## Local Server Setup

1. Start a local server from the repository root:
   ```bash
   python -m http.server 8080
   ```
2. Verify that `http://localhost:8080/index.html` returns `200`.
3. Use `http://localhost:8080/scripts/prep-browser-harness.html` for SAT/ACT browser QA without a network account. The harness runs the production prep engine with a local test identity.
4. Run the repository checks from `scripts/` with `npm ci`, `npm test`, and `npm run prep:market-release`.

## Auth Testing

- Do not place test passwords or private credentials in this file, test output, browser JavaScript, or commits.
- Auth state comes from Firebase Authentication; the `onAuthStateChanged` handler updates `window.currentUser`.
- Signed-in users should have access to every existing feature. There are no Pro, trial, subscription, payment, or locked-feature gates.
- Sign-in remains required where a feature needs a user identity for saving or syncing.
- Verify email/password and at least one federated provider in a staging-safe session when credentials are available.
- After sign-in, the navigation should show the account display name instead of "Sign In" and saving should target that user's UID.

## Free-Access Verification

- Search visible UI and source for obsolete Pro, upgrade, trial, subscription, payment, locked-feature, and Stripe checkout messaging.
- Confirm a signed-in non-admin account can open the essay coach, admissions counselor, college quiz, SAT/ACT full forms, study planner, and college application tools.
- Confirm signed-out users receive an understandable sign-in request only for identity-dependent saving/syncing.

## SAT/ACT Prep Testing

- **Question bank**: 7,444 original items — 3,200 SAT and 4,244 ACT.
- **Registered forms**: 30 reproducible SAT forms and 20 reproducible ACT forms.
- Verify diagnostic, targeted practice, Learn courses, Test Center, calculator, result review, mistake replay, and progress graph.
- Confirm every question has three tutoring hints, a solution path, and feedback for all four choices.
- Confirm registered form IDs and seeds are stable, SAT module routing is reproducible, and abandoning a form does not count as completion.
- Confirm a completed full SAT form shows at most a 20-point headline stability band; ACT shows at most 2 points. Broader model uncertainty and the non-official-score disclosure must remain visible.
- Test answer choice, elimination, flagging, scratchpad, previous/next, question map, and keyboard shortcuts (`1`–`4`, arrows, `F`).
- Prep state is versioned in `localStorage` under the `gs_prep_v2_` prefix; use a new localhost origin or a fresh browser profile for a clean browser run rather than deleting user data.

## Essay Save/Load Testing

- Test flow: write essay → save → verify saved list → load → edit → save → permanently delete → verify it is gone locally and from Firestore.
- Verify legacy local essay IDs migrate safely to the Firestore document ID without duplicating or losing content.
- Force a Firestore failure and verify the UI reports the cloud-sync error, retains the safe local copy where supported, and never shows a false successful-cloud-save message.
- Repeat cloud/local fallback checks for study-planner tasks, college applications, and calculator result saving/deletion.

## Common Gotchas

- Native `confirm()` appears when ending an active timed form. In automated browser tests, handle the dialog explicitly; do not click the button blindly.
- Firestore offline or permission errors must be surfaced clearly. A local fallback is acceptable only when the feature explicitly supports it.
- Test corrupted and legacy `localStorage` payloads; parsing must fall back safely without erasing valid data.
- Test at desktop width and at a phone viewport such as 390×844. Verify no horizontal overflow and that the timer, answers, navigation, question map, lessons, charts, and source disclosures remain usable.
- Check browser console warnings/errors, duplicate IDs, accessible button names, focus/keyboard behavior, and `aria-live` status messaging.

## Secrets

No private secrets are required for the local prep harness or automated test suite. Never expose GitHub tokens, Firebase service-account keys, Gmail credentials, or AI API keys in client code or test output.
