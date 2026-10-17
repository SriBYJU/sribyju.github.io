# Added-feature audit — October 16, 2026

## Standard and scope

Treat each behavior as unverified until a reproduction or test supports it. A passing interface test does not prove the quality of generated advice. This pass covers Ask Scholark, Activities Lab, Essay Studio, passage edits, and their College Chances connections. It does not redesign or audit the whole website.

## Reproduced defects and corrections

| Defect | Correction and regression evidence |
| --- | --- |
| Numbered activities with contribution bullets became extra cards and lost their titles. | Preserve nested bullets, indentation and blank boundaries; retain distinct flat lists. Live import and parser regressions. |
| Two different roles at the same organization merged. | Deduplicate only when both organization and role match. Live confirmation/reload regression. |
| Equivalent meal-service contributions scored differently for “served,” “prepared,” and “packing.” | Recognize ordinary action forms and work contributions. Preserve exclusions for plans, negations and observing others. Paired scoring tests. |
| Consumer requests beyond the original food/TV examples reached tutoring. | Add action-based booking, shopping, local-service and entertainment boundaries, including mixed requests. Test 29 outside-scope and 26 legitimate academic/application inputs. |
| Legitimate academic analysis was blocked by consumer words. | Preserve economics methods, film symbolism, weather concepts, employment descriptions and study-resource requests. Paired scope tests. |
| Product answers described the old essay scoring workflow. | Grounded product facts now explain the AI reader, separate rubric estimate, two options, Apply and Undo. Live chat regression. |
| Selected private text remained after an account switch. | Reset selected text with review, conversation and edit state. Live account-change regression. |
| General essay craft questions required an invented draft quote. | Permit an empty citation for general craft advice; retain citation requirements for draft-specific claims. Paired browser tests. |
| A stopped request's late error erased successful retry options. | Guard error and progress callbacks with the same request/draft checks as successful results. Live delayed-failure regressions. |
| Older activity rubric scores remained linked after the rubric changed. | Version saved portfolio scores and invalidate old links until Activities Lab regrades them. Seeded old-data browser migration regression. |
| Generic form persistence restored private unsent questions after account changes or reload. | Opt private AI composers out of generic persistence, remove their old shared keys, and keep the essay composer in temporary account-scoped memory. Live account/reload/send/clear tests. |
| Ask Scholark lacked the Enter-to-send behavior used by Essay Studio. | Enter sends; Shift+Enter remains a newline; composition events are not submitted. Live keyboard chat tests. |

## Verification evidence

- 190 Node tests passed in the local suite, including the new import, action, and scope regressions.
- Initial combined browser run: 44 passed, two privacy failures reproduced. Both failures were fixed; the focused final rerun passed all 12 cases.
- The separate AI regression/hardening run passed its 30 existing scenarios. Two new keyboard chat checks exposed the missing Enter behavior; both passed after the fix.
- Existing browser cases exercise score linking and invalidation, ten-card persistence, hostile text, numeric bounds, offline review, exact passage replacement, undo protection, mobile layout and unavailable-model recovery.
- Previous release baseline: 199 cross-browser scenarios and 176 Node tests passed in CI. Cloud baseline: 25 Firestore security assertions and eight emulator browser workflows passed. This pass does not change Firestore rules or cloud synchronization logic.
- The final activity/migration browser rerun passed all 13 cases. The separate Shift+Enter/composition check passed.
- New browser tests are included in all three desktop browser projects for future regression runs.

## Follow-up browser investigation

- A repeated Bulk paste click created two competing importers. The existing input and edited preview are now reused. The regression failed with two inputs before the fix and passed afterward.
- Linux WebKit failure traces showed controls moving during scrolling and focus. Activities and Essay workspace document scrolling is now immediate; homepage scrolling is unchanged. The focused WebKit rerun passed all 39 cases, including saved versions, short AI revisions, cancellation and account changes.
- One essay test installed a response fixture before the runtime finished loading, allowing runtime initialization to replace it. The test now waits for initialization before installing the fixture.
- A production twelve-route journey reached the final route at its aggregate 30-second deadline. Its overall budget is now 60 seconds; individual destination assertions retain their normal timeouts. All three live route/About tests passed afterward.
- Both CI runs preceding these final changes passed 249 of 250 browser cases. Their remaining failures were the WebKit saved-version interaction and the aggregate route deadline above. The subsequent b884e36 release passed all 253 browser cases in both regression CI and the production audit (runs 38949003560 and 38949003421).
- CI now retains browser traces and screenshots on failure. The local live-WebKit run was interrupted by an internet outage after 21 passes; it is not counted as a full pass.
- The full local Node suite still passes all 190 tests.

## Actual inference quality — concerns remain

The current Qwen2.5 1.5B reader produced an 80/100 estimate for a synthetic 528-word essay, but its passage notes were generic or attached to the wrong sentence. Those notes were rejected. Two focused prompt experiments did not establish consistently useful criticism; they were not promoted.

A cached Llama 3.2 3B comparison failed constrained JSON generation with a grammar-matcher error. A second unconstrained attempt failed to produce all five required rubric dimensions. Neither was promoted. Earlier Qwen 4B experiments also did not establish a quality improvement. Model size alone is not evidence of better feedback.

Therefore this audit does **not** establish parity with Brisk, a professional admissions reader, or a validated admissions scoring instrument. Exact quotations and format checks cannot prove semantic correctness. Students should review each proposed passage edit; no model edit is applied automatically. Activity scoring remains an English-oriented heuristic, not an admissions-outcome model or a multilingual assessment.

## Scope protection

No animation, cinematic markup, carousel, design palette or unrelated calculator behavior is changed. The only shared form-persistence change is an explicit opt-out attribute used by private AI text fields. Script URLs are refreshed so browsers receive the fixes.

## Account ownership and model-quality follow-up

- Reproduced private essay text remaining visible through the real authentication refresh. Working drafts now use an account-specific key; account changes reset the editor, review, selected passages, pending activity import, linked fields and chat. Explicitly saved essays are retained separately.
- Old shared form drafts are preserved under `scholark_legacy_unassigned_…` for recovery, without assigning an unknown owner's writing to the next account. Existing owned AI autosaves migrate only when no newer working draft exists. Deliberately cleared drafts stay empty on reload.
- A delayed autosave captures its owner and cannot write into a different account. Account changes cancel pending Ask requests and suppress their late answers. Legacy private question fields also opt out of generic persistence.
- Actual 36-prompt inference audit completed: 27 grounded local answers and nine generated answers. It exposed a false-premise chemistry endorsement, a repeated study-plan loop and an unsupported future SAT cutoff response. These are not counted as 36 model-generated successes.
- Added paired contradiction checks for the observed chemistry errors, sentence/phrase repetition rejection, modest prose-only repetition penalty, and an honest response for unverifiable admissions thresholds. Structured rubric JSON retains zero repetition penalty.
- A subsequent three-prompt actual-inference retest produced a correct chemistry answer (16.7 seconds), a complete non-looping biology study plan (78.1 seconds using the recovery model), and a grounded uncertainty answer for the future cutoff. The study plan remains verbose and slow. This small retest does not establish general semantic reliability.
- Current local Node suite: 194 passed. Chrome's six scope/chat regressions passed, including a delayed cross-account response and replacement of the captured incorrect chemistry output with supporting notes. Safari's expanded run passed 18 cases and exposed a test setup race in the nineteenth: the model replacement was installed before runtime initialization completed. Waiting for initialization fixed the fixture; that case then passed separately. All 19 focused behaviors now have passing Safari evidence.

Remaining work: improve actual essay critique specificity and generation latency, and expand real-inference evaluation beyond the cases above. These improvements are not established by mocked model-response UI tests. No model promotion or claim of admissions-expert parity is made.
