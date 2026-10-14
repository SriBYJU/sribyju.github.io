# AI essay reader: evidence and limits

## What this reader evaluates

The on-device model grades five original coaching dimensions: purpose and structure (20%), reflection and insight (25%), personal evidence (25%), voice and perspective (20%), and clarity and control (10%). Each dimension receives an integer 0–4 assessment. The application calculates the weighted total out of 100; it does not accept a model's self-reported total.

The descriptors distinguish missing evidence, emerging assertions, developing support, strong execution and exceptional integration. Every dimension must include an exact, unique passage from the draft and a distinct explanation. At least three different passages must substantiate the complete review. These checks verify quotation and format; they do not prove that the model's literary judgment is correct.

This is a Scholark coaching rubric. It is not a published university admissions score, an admissions probability or a validated replacement for a counselor. Prestige, trauma, costly opportunities and ornate vocabulary are explicitly excluded as proxies for writing quality.

## Research used

- [AAC&U Written Communication VALUE Rubric, reproduced by DePaul University](https://resources.depaul.edu/teaching-commons/teaching-guides/feedback-grading/rubrics/Documents/aacu-value-rubrics/WrittenCommunication.pdf): a respected public framework for examining purpose, development and readability with observable performance levels. Its own framing describes institutional learning assessment rather than grading. Scholark uses original wording and weights; it does not reproduce the rubric or present its admissions adaptation as validated by AAC&U.
- [Yale essay guidance](https://admissions.yale.edu/essays): meaningful perspective and the student's voice inform the voice criterion and the requirement that the writer choose changes.
- [Yale admissions officers, Essays: What Works](https://admissions.yale.edu/posts/2020-06-15-episode-4-essays-what-works): the essay helps readers understand a person; no perfect topic or single narrative formula exists. The model should ask what the actual draft reveals rather than demand a dramatic opening, achievement or resolution.
- [UC personal insight guidance](https://admission.universityofcalifornia.edu/how-to-apply/applying-as-a-first-year/personal-insight-questions.html): concrete personal examples and a clear account of the applicant's actions inform the evidence criterion. UC does not separately evaluate grammar or sentence structure, although unclear language can distract. Scholark therefore limits the clarity weight and avoids treating dialect or background as a writing deficit. UC's own questions differ from Common App prompts; this is general guidance, not a claim that the prompts are interchangeable.
- [Johns Hopkins Essays That Worked](https://apply.jhu.edu/college-planning-guide/essays-that-worked/): selected published essays and admissions commentary inform short original craft summaries in `admissions/essay-content.js`. Prompt-specific source links travel with every review. These examples illustrate possibilities, not an objective ranking of the best essays or proof that an essay caused admission. No full sample essay is copied into model context.

## Model workflow

`admissions/essay-ai.js` provides a UMD module for both the browser and Node tests.

1. Check the full draft is 60–750 words and at most 6,000 characters. Never silently truncate a scored draft.
2. Request five criterion judgments using numbered draft passages. The model selects passage indexes; the application supplies the original words. Validate every span, score range, criterion identity and explanation before calculating a grade.
3. Make a separate short request for passage critiques. Each note names an exact span, explains a specific effect and gives an editing goal. Any quoted wording in a critique must exist in the draft and refer to the targeted passage. If this request fails, retain the accepted grade with an explicit warning that passage notes were not accepted.
4. On demand, request two alternatives for a selected passage. The student previews both and chooses whether to apply one. The module does not mutate text.
5. Where improvement requires an unstated fact, the model must ask a factual question rather than fabricate a scene. A question is a valid outcome, not a purported rewrite.

Staging keeps each output small enough for the current local model's context window. Essay text and quoted context are treated as data, never as instructions to the model. No draft is sent to a cloud grading service by this module.

## Revision protections

Passages must be unique exact draft spans of 3–80 words and shorter than the entire draft. The UI is responsible for rejecting results after a draft or owner changes and applying only the previewed span. The module also checks supplied offsets.

Two options must be distinct, substantively connected to the passage, and bounded in length. Validation rejects added numbers, unsupported capitalized names, new strong achievement claims, removed negation or uncertainty, markup, placeholders and instruction payloads. Revision content words must come from the selected passage; connecting words and ordinary inflections of supplied words may be added. This permits tightening and clause restructuring while rejecting newly invented physical actions. It deliberately limits expansive paraphrase.

These are conservative checks, not a semantic fact verifier. They cannot guarantee every replacement preserves meaning. Preview and writer approval remain necessary; the UI should never auto-apply the model's choices. An invalid model response yields no AI score or replacement, with an explicit retry message. Offline rule scores remain separately labeled.

## Verification

From `scripts/`, `node --test essay-ai.test.js` covers valid low/high scores, recomputed totals, invalid and duplicate dimensions, short and oversized drafts, unknown prompts, invented/ambiguous evidence, full-draft replacement, stale offsets, two distinct edits, fabricated numbers/names/achievements, negation and uncertainty, factual questions, prompt/markup payloads, unavailable models, staged review success, rejected output, partial comment failure and runtime errors. Browser integration and real-model quality checks must be reported separately; mocked tests do not demonstrate literary quality or a calibrated admissions score.

## October 14 live-model findings

A 528-word synthetic library essay was evaluated with the real Qwen2.5 1.5B runtime. It returned five valid criterion scores (80/100). Earlier comments and edits contained wrong-passage quotations and an invented physical action. These cases became validation regressions. Model-selected passage indexes now supply exact text, critiques cannot quote nonexistent or mismatched passages, and edits cannot introduce new content words/actions. An accepted quotation is evidence of text anchoring, not proof that the critique is sound.

Qwen3 4B was evaluated separately. It encountered constrained-output runtime failures; unconstrained retries produced inconsistent scores and weak synonym substitutions. It was not promoted to the production model. A larger model alone did not establish better feedback.

When notes or edits fail validation, the UI reports the failure and leaves the writing intact. Students can also select a short passage for an explicitly labeled editing exercise. Local model critiques and scores remain imperfect; this evaluation does not establish parity with Brisk or professional admissions counseling.

The final focused-passage live check produced two accepted edits of the opening sentence: one removed the explicit emotion label, and the other changed clause order using the same action. Both were validated before display. This verifies one actual generation path; it is not evidence that every suggestion is good.
