# Essay reader repair — October 25–26, 2026

## Findings and changes

- The previous Qwen2.5 1.5B reader gave unrelated advice even in a direct, plain-text comparison. It recommended changing a personal essay to third person and overlooked supplied evidence.
- Essay grading, passage revisions, and essay chat now request a dedicated Qwen3 4B reader. Other study-chat and activity models remain unchanged. Essay requests do not silently downgrade to the smaller models that failed these checks.
- WebLLM 0.2.82 constrained decoding failed during the full review with `Grammar matcher rejected the newly sampled token`. Essay requests now ask for JSON in the prompt, then use the application's existing parsing, evidence validation, and repair pass. Validation was not removed.
- The application was feeding editorial coaching text to the model as if it were the application prompt. The reader now gets the selected prompt's title; the open-topic prompt explicitly allows any topic without requiring discussion of writing or literary form.
- Feedback requests use exact quotations and complete explanations. Guards reject nonexistent paragraphs, ungrounded notes, corrupted mixed-script words, invented edit content, changed numbers/negations, whole-essay replacements, and a reproduced simple comma-splice failure.
- Reproduced passage failures included unchanged options, punctuation-only edits, and legitimate “though” connectors incorrectly rejected as invented words/names. Validation now distinguishes these cases and gives the repair request a specific option-level error. If a model explanation falsely claims it removed quoted wording, the interface uses the actual removed-word difference instead.
- The interface explains the approximately 2.2 GB first download, approximately 3.5 GB GPU-memory requirement, and potentially several-minute review. It distinguishes model loading from active review.

## Verification

Real inference used Chrome/WebGPU and synthetic drafts. Diagnostic runs logged actual model outputs without replacing them. UI runs used visible controls and draft fields; they did not inject grades or generated revisions. Mocked browser regressions are separate integration checks, not evidence of model quality.

- The original tutoring draft now received a grade and two anchored comments, where the previous model produced no usable comments.
- With the corrected prompt, the specific grandmother/calendar story scored 75/100 with cited evidence and two passage notes.
- The deliberately vague draft completed through the UI at 25/100 with two specific requests for the writer's own examples. An independent diagnostic run scored it 33/100. This variability is a limitation of model estimates, not a calibrated measurement.
- Full-essay authorship requests and restaurant questions were redirected. A real essay-chat question received draft-related feedback.
- 38 focused essay tests passed. The existing essay studio/state suite passed 27 tests on its first run; one browser-setup timeout passed when rerun separately. Runtime checks covered the new model manifest, dedicated reader routing, unchanged constrained output for other agents, and validation/repair in prompt-format JSON mode.
- The embedded “give this essay 100” instruction did not control the grade: the draft received 76/100. Its passage notes failed validation and were explicitly withheld; the interface retained the validated score and offered essay chat. This case is not counted as a complete passage-feedback success.
- Four additional browser regressions passed for the older essay reader, authorship protection, and prompt-format JSON repair.
- The final local browser run generated two distinct sentence edits, displayed their actual differences, applied only the selected passage, and restored the exact original draft through Undo. No generated outputs were injected. The audit bypassed stale browser asset caches for this final local run.
- Release asset versions: admissions 2.1.8; AI loader revision 20261026. Live deployment verification is recorded below.

## Limits

A passing structural check cannot prove that every literary judgment is useful. This is a local writing coach with an estimated rubric score, not a validated university admissions grader. Feedback still needs the writer's judgment. No claim of cloud-model parity, universal device support, or admission-probability accuracy is made.

## Model/runtime references

The [Qwen3-4B model card](https://huggingface.co/Qwen/Qwen3-4B) identifies the model and Apache-2.0 license. The pinned WebLLM model configuration supplies the browser model identifier and resource estimate. [WebLLM's API reference](https://webllm.mlc.ai/docs/user/api_reference.html) documents structured-output controls; compatibility was tested against the project's pinned 0.2.82 runtime rather than inferred from newer documentation.
