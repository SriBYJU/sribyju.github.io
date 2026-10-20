# Live adversarial audit — October 18–19, 2026

## Method

Drove the published site through visible buttons, fields and dialogs. Used a separate browser session, then a user-supplied test-account sign-in for AP. No invented authentication, mocked AI, injected application state, or calls to application internals were used for the live findings. Read the displayed DOM for results. Local regression checks are listed separately. This is a bounded audit, not proof that every possible input works.

## Live findings and repairs

- Thirty chat prompts: normal greetings, product identity, arithmetic, entertainment requests, academic context, staged authorship requests, fabricated credentials, admissions certainty and follow-ups. [Original replies](audit-evidence/2026-10-19/live-chat-baseline.jsonl).
- Valid inflation-example wording was rejected. Expanded academic-exercise routing while retaining consumer-request redirects.
- SAT/ACT comparison was incorrect and truncated. Added a source-linked comparison using College Board and ACT guidance verified during this audit.
- Admissions-certainty and essay-capability replies rambled. Added bounded guidance for these intent families, truthful-credential coaching, brainstorming, and college-cost comparisons. Tightened checks against repeated long sentences and visibly cut-off prose. These responses are labeled grounded guidance, not model generation.
- Ten College Chances input cases covered empty/negative/out-of-range inputs, fractional essay scores, zeros, perfect inputs and normal inputs. Also exercised edit invalidation, double-clicking and a narrow viewport. The visible validation checks behaved as expected.
- Narrowing the desktop workspace to 390px placed the mobile Menu button beyond the viewport (439px document width). Fixed the base navigation breakpoint so it does not depend on a mobile-only stylesheet loaded at startup. Local browser recheck: 390px document width, no overflowing elements.
- Activities: imported 12 entries through preview, confirmed ten selected cards, retained excluded entries before confirmation, and graded the resulting portfolio.
- Essay: empty and short drafts, repeated text, HTML-shaped input, visible passage comments and revision choices, and actual on-device grading. HTML remained text. A passage without enough facts asked a revision question rather than inventing an edit.
- Signed-in AP: fresh courses showed 0%; one reviewed topic produced 25% unit / 5% course review coverage without scored-practice inflation. Empty teach-back did not complete; mistake replay with no recorded mistakes opened a usable set. Tested option elimination, early finish, task draft/check interactions, and reload navigation.
- AP selected answers remained selected when crossed out. Eliminating the selected choice now clears it; selecting a crossed-out choice restores it. An empty scored set now shows no accuracy value instead of 0%.
- AP reload returned a signed-in student to Home. Preserve the AP startup destination until authentication restores, without overriding a later navigation click.

## Verification and limits

- 39 AI and index integration checks passed before final AP/UI edits; targeted AP browser regressions: 7/7 passed, including new elimination and empty-score checks.
- The actual on-device essay run returned a grade but no passage comments passed grounding validation. The interface disclosed that limitation. This remains an AI-quality limitation; it is not counted as successful detailed essay feedback.
- Some CPU answers remain shallow, and one brainstorming request reached generic guided help in the baseline. No claim of cloud-model parity or professional admissions accuracy.
- Deployment and live retest results are recorded after publishing the repairs.


## Published verification — October 20

Repair commit `4a55e1b` deployed successfully. All associated CI workflows passed, including the broad regression and production-AI audits, the AI reliability gate, mobile WebKit stability, and frontend secret scanning.

Live retesting confirmed AP deep-link restoration with the signed-in test account, clearing a selected answer when eliminated, restoring it when selected again, and no accuracy percentage for an unsubmitted set. Unit notes survived reload; a resumed exam timer counted down. The mobile College Chances recheck measured 390px document width at a 390px viewport. All ten focused chat retests produced the intended bounded responses; [recorded replies](audit-evidence/2026-10-19/live-chat-retest.jsonl).

The retest exposed literal Markdown source links in chat. The follow-up renders labeled HTTP(S) links using DOM nodes, rejects unsafe schemes and credential-bearing URLs, and keeps text escaped. Its browser regression passed. This presentation fix does not change model quality.


## Additional essay investigation — October 20

Live source links were verified as usable College Board and ACT anchors after deployment `5589b63`. A separate untouched live browser flow verified rule-based passage preview, replacement of only the selected sentence, and Undo restoring the exact original draft. This does not establish the quality of generated AI alternatives.

Two real model reviews on a synthetic tutoring essay produced grades but no valid passage notes. A subsequent diagnostic run logged the model output without replacing its result: notes copied general reference-pattern language about committees, and grading explanations referred to nonexistent paragraphs. Removed reference-pattern prose from the note-generation context, stopped propagating grading explanations into that context, clarified sentence indexes, and added rejection of nonexistent paragraph claims. Model loading failures now have a distinct message from invalid generated grades.

The first local real-model recheck still produced an invented grammar issue, which the existing grounding check rejected. These prompt changes are not proof of reliable admissions-level feedback. Focused essay checks: 33 passed. Generated feedback quality remains under investigation; no claim of professional reader equivalence.

A second local inference experiment with explicit output instructions also failed to produce truthful passage feedback. That additional prompt change was discarded. The retained changes improve input separation and rejection/disclosure, not demonstrated model intelligence. The test model was Qwen2.5-1.5B-Instruct-q4f16_1-MLC. Further model evaluation is required before calling AI passage feedback reliable.
