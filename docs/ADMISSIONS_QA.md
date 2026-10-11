# Admissions and local AI verification

## Recorded results (October 10–11, 2026)

- 116 Node tests passed: activity ordering and hostile inputs, 39 essay rules with positive/negative fixtures, 12 synthetic calibration samples, edit anchoring, revision word deltas, planning-model monotonicity/bounds, AI routing/arithmetic, and existing AP/prep integrity tests.
- 28 AI browser and hardening checks passed in Chrome: product knowledge, scope, evidence validation, safe rendering, cancellation, concurrency, persistence, model bundle import, and cinematic-before-AI startup.
- Five admissions browser checks passed and cover anonymous grading/refinement/version restoration, linked scores, staleness, hostile HTML, offline grading, numeric limits, mobile dark-mode comment controls, and legacy GPA/loan calculations.
- 25 Firestore emulator checks passed, including ten activities with five saved versions in one batch, field limits, grade stamps, private mentor tokens, cross-account rejection, feedback throttling, public exact-link access, collection-list denial, and revocation.
- An isolated browser/emulator flow verified save, restore in another browser, cross-device link revocation, and deletion without resurrection. No production student records were used.
- Activities Lighthouse accessibility: 96/100. Essay Coach: 97/100. Remaining contrast findings include existing site controls; these are not a blanket WCAG certification.
- Mobile-sized Chrome and WebKit activity flows were exercised. WebKit is a Safari-engine check, not a physical iPhone test. Firefox launch availability is tracked separately from application failures.

## Real model review

36 varied chat scenarios were run through the actual application, plus follow-up science questions, three synthetic essay drafts, and activity refinement. They included greetings, arithmetic, product facts, off-topic requests, education, admissions uncertainty, and authorship boundaries. Deterministic routes were identified as such; those answers are not counted as successful model inference.

The review found and corrected misleading residual explanations, irrelevant study-progress context, inappropriate thinking controls, unsupported essay praise, invented essay settings, malformed refinement responses, and over-restrictive refinement validation. The final source-grounded residual, enzyme, and photosynthesis answers were correct in the follow-up run. The optional activity refiner produced a local-generative result that passed provenance and length checks. Unsafe or unusable results retain the offline fallback.

In the final three-draft reader run, one generated critique passed; two were rejected and returned labeled rubric feedback. This is a safety fallback, not evidence that those two drafts received usable generative reviews.

Small browser models can still make factual, grammatical, or contextual errors. These checks do not establish parity with Brisk, an actual admissions officer, or a calibrated admission-probability model. Essays receive deterministic craft scores; the optional reader simulation is separate.

## Repeatable commands

From `scripts/`, run `node --test *.test.js`. From the repository root, `node scripts/test-admissions.mjs` runs the focused admissions engine suite.

Serve the repository on port 4173. Install the project's Playwright test dependency and browsers, then run `cd scripts && npx playwright test admissions-browser.spec.mjs --config=playwright.config.mjs`. The configured desktop projects include these tests.

For security tests, install Firebase CLI, `@firebase/rules-unit-testing`, and `firebase` in a separate test directory and provide Java 21. Set `SCHOLARK_TEST_DEPS` to that directory's absolute `package.json` path. Run its Firebase CLI from the repository root:

```sh
firebase emulators:exec --only firestore --project demo-scholark-tests \
  --config scripts/firebase.admissions-test.json \
  'node scripts/admissions-firestore.mjs'
```

Use the same command with `node scripts/admissions-cloud-browser.mjs` for the browser integration flow. It also needs Playwright available to `scripts/`; `SCHOLARK_CHROME_PATH` optionally selects an installed Chrome executable. The test uses a demo Firebase project, grants localhost access only in its isolated browser, and blocks production Firestore requests.

The opt-in live model runner and model-cache controls are documented in `scripts/AI_QUALITY_REVIEW.md`.

## Scope and remaining checks

- Diff review: existing cinematic, carousel, scroll handlers, keyframes, and transitions are unchanged. The new profile card follows the entire carousel. New styling is scoped to admissions components; the existing AI stylesheet has targeted visibility, source-display, and readability fixes.
- Existing mobile header: resizing a desktop session to 390px while Essay Coach is selected can put the Menu button about 20px beyond the viewport. The new essay editor/comments fit; the protected existing navigation styling was not redesigned to address this separate issue.
- Manual follow-up: physical iOS/Android model downloads, low-memory devices, long offline sessions, multiple real signed-in devices, and human review of diverse essays and activity descriptions.
- Deployment gate: confirm GitHub Pages and Firestore-rules workflows succeed, then verify the public page loads the new boot module and AI build.
