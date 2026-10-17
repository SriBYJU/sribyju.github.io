# AP, AI, and added-feature end-to-end audit

Date: October 17, 2026. Standard: unverified until supported by a reproduction or test. Scope: AP, local AI, Activities Lab, Essay Studio, College Chances changes, approved admissions extras, and the navigation/About changes from this project. The rest of the website was not comprehensively audited.

## Findings fixed

| Area | Reproduced failure or unsafe behavior | Correction |
| --- | --- | --- |
| AP practice | Replay mistakes with no recorded mistakes produced an empty session. | Start a usable adaptive set. |
| AP timer | Returning through section navigation did not restart a paused sprint. | Resume correctly; persist remaining time; finish restored expired sessions. |
| AP saved sessions | Invalid question IDs and malformed maps left practice unusable. | Normalize or discard invalid sessions and offer usable practice. |
| AP keyboard | Hidden AP sections could still consume number/arrow keys. | Limit shortcuts to visible AP practice and exclude editing/modifier contexts. |
| AP task generation | Timestamp bit shifting could produce an invalid concept index. Reopening a refreshed task mismatched the saved draft and prompt. | Safe integer selection; persist the prompt seed with the draft. |
| AP grading evidence | Rechecking an identical task inflated recorded evidence. Empty teachbacks were recorded. | Deduplicate identical task submissions and reject empty teachbacks. |
| AP task content | Several tasks requested absent passages/data/documents. | Supply original bounded passages/data where feasible; explicitly label DBQ work as planning without a document packet and direct full practice to official resources. |
| Tutor retrieval | Generic words such as “test” and “answer” retrieved unrelated Statistics or Spanish notes. New crash-course concepts were not searched. | Include expanded lessons; exclude generic task wording from distinctive topic matches. |
| AI scope | TV-series requests slipped through; economics questions using Big Mac prices were blocked. | Paired consumer-versus-academic routing corrections. |
| AI output | Planner exposed internal day offsets/priority fields; algebra output echoed instructions after solving. | Reject those outputs and use grounded planning or model recovery. |
| Essay chat | Whitespace/common-word “quotes” could satisfy the evidence requirement. | Require a unique exact 3–80 word passage for draft-specific claims; retain general writing advice without invented quotes. |
| Activities persistence | Malformed stored activities/version entries or a null root could crash the workspace. | Normalize damaged records while preserving valid entries. |
| Activities → Chances | Editing activity evidence left an old linked score available. | Mark the portfolio for regrading and clear stale linked estimates. |
| Chances | Old results stayed visible after input edits, invalid submissions, clearing a score, or account changes. | Hide stale results and distinguish manual inputs from linked scores. Preserve another account's own saved history. |
| Sharing/feedback | Awaited cloud operations could use a newly selected account or update its local state. | Capture the initiating owner and target before waiting; suppress cross-account completion and preserve the original share token for revocation. |

## Evidence and coverage

- **201 Node checks passed.** Includes parser/scoring, quote validation, tutoring retrieval, scope, AP content and supporting regressions.
- **Chrome rerun: 70/70 passed.** Admissions, extras, passage revisions, essay account state, Ask/specialist AI behavior, model recovery, and navigation/About.
- **Chrome additional suite: 43/43 passed.** Imports, activity behavior, new extras, Essay Studio, AI cancellation/hardening and fallback UI. Some scenarios overlap the 70-case run; these are executions, not unique test counts.
- **WebKit: 53/53 passed.** AP crash courses and workflows, extras, essay state, and scope/chat. Mobile-width cases are included.
- **AP workflow Chrome pass: 7/7.** One scenario opens and regenerates all **70 task types across 23 courses**. This verifies interaction, not official-exam equivalence or every possible answer's correctness.
- **Cloud emulator: eight workflows passed:** save; saved-essay stamp/load/delete; share; restore in another browser; receive additions; respect deletions; revoke from another browser; delete without restoration.
- **Final extras confirmation: 15/15 passed**, followed by a passing account-switch-during-deletion regression. A pending deletion can no longer disable the next account’s saving.
- **25 database-rule assertions passed**, including cross-user access denial, exact-link public access, listing restrictions, revocation, invalid records and feedback throttling.
- Browser sharing-race tests use controlled SDK latency. They are distinct from the emulator's real SDK/database checks and do not establish real production authentication-provider availability.

Initial runs preserved genuine failed assertions for stale results. Parallel runners also collided over a shared trace folder, and the old local HTTP/1.0 server dropped script connections. Those infrastructure failures were separated from product findings; unique output directories and a stable local server enabled clean reruns. The previous release's CI tutoring failure was an outdated wording assertion, now checked against the actual retrieved note.

## Actual local-model behavior

The [36-request baseline](audit-evidence/2026-10-17/real-ai-baseline.jsonl) returned **27 grounded answers and nine generated answers**. This is not 36 successful model generations. Five targeted follow-ups and a final algebra request are preserved in [recheck evidence](audit-evidence/2026-10-17/real-ai-recheck.jsonl) and [final algebra evidence](audit-evidence/2026-10-17/real-ai-algebra-final.jsonl).

The final algebra run correctly solved x=7 with no unrelated course source and no instruction echo, using recovery inference in about 28 seconds. The biology-study reply became relevant but took about 97 seconds and remained verbose. Planner internals were replaced by a concise grounded plan. Entertainment redirected while the economics example was allowed.

**Quality is not fully proven.** The local models still vary in relevance, depth, latency, and instruction-following. The final algebra answer did not explicitly perform the requested substitution check. Evidence validation prevents some unsupported output but cannot prove every statement correct. This audit does not establish Brisk parity, professional admissions judgment, or reliable grading of every essay.

## Product limits retained honestly

AP Task Studio/teachbacks check structural completeness, not factual correctness. DBQ planning is not a complete document-based exam. Essay and activity scores are independent educational rubrics; College Chances remains an uncalibrated planning model. No admitted-student dataset or admissions probability is fabricated. Optional hosted AI is not required or claimed as tested.

The cinematic/homepage animation code and its layout were not changed. Only scoped functionality, asset versions, regression tests, and audit evidence were modified.
