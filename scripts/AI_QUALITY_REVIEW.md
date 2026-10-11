# Scholark local AI quality review

## What this release changes

- Explicit arithmetic is evaluated by a bounded parser, without executing user text.
- Relevant concepts from Scholark's course notes are retrieved for the current question. Textbook-backed notes cover observed science misconceptions. The chat exposes the actual notes and source links.
- Accurate cautionary notes are labeled as accuracy reminders, rather than presented to a small model as false misconceptions to refute.
- Product facts, educational scope, authorship boundaries, and missing student data are handled before generation.
- Essay feedback requests a constrained JSON structure. A quoted passage is checked against the draft, and rejected output is retried with the original source still present.
- Model-specific controls are applied only to the model family that supports them. The WebLLM Qwen thinking control previously injected thinking delimiters into unrelated models' prompts.
- Shared inference is serialized. Stop and New conversation invalidate unfinished requests and prevent stale answers from repopulating cleared history.
- Mathematical formatting preserves currency. Rendered text and source links use safe DOM construction.

## Quality evidence and limits

The browser regression suite checks routing, UI, cancellation, evidence rejection, and fallback behavior using controlled model responses. It does **not** certify model factual accuracy. The separate `scholark-ai-live-quality.mjs` runner exercises 36 varied prompts through the real application with on-device inference enabled and writes every answer for review.

Raw-model comparisons included Qwen3 0.6B, 1.7B and 4B; Llama 3.2 3B; and Qwen2.5 1.5B and 3B. Larger models still made confident mistakes about plant mass, chemical bonds, scope, or admissions uncertainty. Model size alone is not a release gate. The Qwen2.5 3B evaluation produced more useful draft feedback in one trial, but it was not adopted: its research-only license does not establish permission for general product use.

The supported-device essay reader uses the Apache-2.0 Qwen2.5 1.5B model with a separate evidence-quote field; its quote is checked against the submitted draft. Chat retains the smaller default and source-backed tools.

The local rubric scores are stable heuristic estimates. They are not validated admissions probabilities, an actual admissions officer's grade, or evidence that Scholark matches Brisk's performance. Source retrieval is limited to the supplied notes; the chat does not browse the web. Its checks catch tested failure patterns, not every possible hallucination.

## Research informing the design

- [Brisk student tools](https://www.briskteaching.com/solutions/students): grounding in learning materials, guided learning, and writing feedback. These informed the source notes and coaching flow; no equivalent product efficacy is claimed.
- [Yale essay guidance](https://admissions.yale.edu/essays) and [Yale's essay discussion](https://admissions.yale.edu/posts/2020-06-15-episode-4-essays-what-works): student voice and meaningful reflection.
- [UC personal insight guidance](https://admission.universityofcalifornia.edu/how-to-apply/applying-as-a-first-year/personal-insight-questions.html): personal examples and the applicant's own writing.
- [OpenStax plant nutrition](https://openstax.org/books/biology-2e/pages/31-1-nutritional-requirements-of-plants), [bond energy](https://openstax.org/books/chemistry-2e/pages/7-5-strengths-of-ionic-and-covalent-bonds), and [enzymes](https://openstax.org/books/biology-2e/pages/6-5-enzymes): source-backed learning notes.
- [Pinned WebLLM chat implementation](https://github.com/mlc-ai/web-llm/blob/v0.2.82/src/llm_chat.ts): JSON grammar and thinking-control behavior.

## Repeat the checks

From `scripts/`, run `node --test *.test.js` and the existing Playwright configuration. For real inference, serve the repository and run:

```sh
SCHOLARK_REAL_AI=1 node scholark-ai-live-quality.mjs
```

The live runner can download model weights. Set `SCHOLARK_CHROME_PATH` to an installed Chrome executable if needed, `SCHOLARK_AI_PROFILE` to a dedicated persistent test profile, and `SCHOLARK_AI_REPORT` for the output JSONL path. Review response relevance and factual content; a nonempty answer is not a quality pass.
