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

## Actual inference quality — concerns remain

The current Qwen2.5 1.5B reader produced an 80/100 estimate for a synthetic 528-word essay, but its passage notes were generic or attached to the wrong sentence. Those notes were rejected. Two focused prompt experiments did not establish consistently useful criticism; they were not promoted.

A cached Llama 3.2 3B comparison failed constrained JSON generation with a grammar-matcher error. It was not promoted. Earlier Qwen 4B experiments also did not establish a quality improvement. Model size alone is not evidence of better feedback.

Therefore this audit does **not** establish parity with Brisk, a professional admissions reader, or a validated admissions scoring instrument. Exact quotations and format checks cannot prove semantic correctness. Students should review each proposed passage edit; no model edit is applied automatically. Activity scoring remains an English-oriented heuristic, not an admissions-outcome model or a multilingual assessment.

## Scope protection

No animation, cinematic markup, carousel, design palette or unrelated calculator behavior is changed. The only shared form-persistence change is an explicit opt-out attribute used by private AI text fields. Script URLs are refreshed so browsers receive the fixes.
