# Admissions workspace v2

## Loading and modules

The small `admissions/boot.js` entry point loads the workspace only when Activities Lab, Essay Coach, or College Chances is requested. The homepage profile placeholder is a separate section after the complete press carousel. No cinematic or scroll implementation is modified.

- `activity-engine.js`: bounded inputs, Unicode-safe truncation, line/bullet import, signal extraction, BM25, activity rubric, portfolio aggregation, factual offline compression, refinement validation.
- `library_v1.json`: 1,204 versioned editorial reference composites; loaded only for Activities Lab. `gazetteer.json` records official sources and distinctions.
- `essay-content.js`: 39 independently editable craft-comment templates.
- `essay-engine.js`: character-offset analysis, source quotes, four writing subscores, overall 0–100 score, hash, and edit re-anchoring.
- `chances-model.js`: versioned configuration, log-odds adjustments, bounds, missing-input ranges, input validation, and sensitivity examples.
- `workspace.js`: safe DOM rendering, local persistence, account sync, description versions, score links, comments, exports, mentor sharing, and profile extras.
- `admissions.css`: styles scoped to new components. Existing theme variables are reused.

## Data flow

Text → deterministic signals → rubric / exact passage comments → student review → optional save / score link.

AI activity refinement is optional and uses the existing browser model runtime. Length, number provenance, role/organization preservation, and vocabulary checks reject unsupported suggestions. Failing inference returns the offline compressor. This is a conservative check, not a proof that arbitrary model prose is true. Users must verify meaning before applying.

Essay scores are deterministic. The separate local AI admissions-reader simulation does not set these scores. Existing saved essays remain readable; new saves add an optional `scoreStamp` field. Revision snapshots store hashes, scores, word-count changes, and comment counts, not extra copies of essay text. Local hashed word-frequency counts track words added and removed; reordering alone is not counted as new writing.

## Storage

Local key: `scholark_admissions_v2_<uid or anon>`. Anonymous and account data are separate; a user does not silently inherit another account’s local data. Local storage can fail; the UI reports that and offers export.

Private Firestore documents:

| Path under `users/{uid}` | Contents |
| --- | --- |
| `activities/{id}` | Bounded card fields, optional context, up to 5 previous descriptions, last rubric score/version, timestamp |
| `profile/portfolio` | Score, shape, ordered activity IDs, library version, timestamp, private mentor-link token |
| `profile/essayScore` | Score, four subscores, rubric version, essay hash, prompt, grading time |
| `profile/gradingFeedback` | Rating, optional 500-character note, rubric version, server timestamp |
| `essays/{id}` | Existing saved essay plus optional score stamp and revision score history |

Autosave is debounced and account writes are batched. Deletion tombstones prevent an offline deletion from being silently restored during later sync. Cloud errors retain the local copy and are reported.

Mentor links use `admissionsShares/{128-bit random token}`. Only exact-document reads are allowed; collection listing is denied. Owners can create, update, or revoke their own links. Shared data excludes essays, rough notes, and context chips. Anyone holding a live link can read its activity list; this is disclosed when sharing.

Rules explicitly exclude the new paths from the legacy wildcard so validation cannot be bypassed. Feedback updates are limited to one per minute at the rules layer.

## Free operation and privacy

No hosted LLM endpoint or secret is shipped. Gemini’s current API terms exclude apps likely accessed by under-18s, so the proposed hosted Gemini path was replaced with optional on-device refinement. No external model service receives student text. Download hosts still receive ordinary network metadata when weights are fetched.

No service worker, global cache policy, analytics, or unrelated tool implementation is changed. Offline grading works once the feature scripts have loaded; a first-ever load without a network cannot download those scripts or models.

## Verification

From the repository: `node scripts/test-admissions.mjs`.

Browser flows: `cd scripts && npx playwright test admissions-browser.spec.mjs` with the site served locally and the appropriate browser installed. Real-model quality evaluation is opt-in (`SCHOLARK_REAL_AI=1`) and reports actual answers for review; it is not an accuracy certification.
