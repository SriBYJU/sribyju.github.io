# Scholark AI E2E Results

Branch: `scholark-ai-foundation`

Current status: **BRANCH BROWSER E2E EXISTS AND HAS PASSED ON AN EARLIER AI HEAD; FINAL LATEST-HEAD GATE IS RE-RUN AFTER EACH CHANGE. THIS IS NOT YET A PRODUCTION E2E PASS.**

The branch has not yet been merged/deployed to the production GitHub Pages environment. This file distinguishes executed branch-browser evidence from production evidence and from true WebGPU model-weight inference.

## Executed branch automation

A complete earlier AI-specific regression run (`34700277708`, head `0f3f8a7ca04cb4177b7907bea0a31f11286dd659`) completed successfully and included syntax checks, repository tests, SAT/AP audits, the additive integration contract, runtime/model-source checks, and Playwright browser E2E. Later changes add adaptive practice, runtime health, mobile diagnostics, and exact runtime-bundle preflight, so the **latest head must independently pass before release**.

## Current automated logic/integration coverage

The branch contains automated coverage for:

- capability-tier selection;
- compatibility fallback when WebGPU is absent;
- specialist routing;
- mastery progression;
- prerequisite/next-practice selection;
- deadline-aware planner prioritization;
- stable deterministic essay scoring;
- all 13 essay categories;
- structured-output validation;
- essay version comparison;
- bounded conversation context;
- adaptive practice generation/grading;
- open-ended retrieval non-grading;
- browser runtime health;
- legacy localStorage state preservation sentinel.

The regression workflow additionally runs existing SAT/AP quality audits and static integration/data-safety contracts.

## Cross-browser branch E2E matrix

The Playwright suite is configured against the branch/static build as follows:

| Flow | Chromium desktop | Firefox desktop | WebKit desktop | Android-class Chromium | iPhone-class WebKit |
| --- | --- | --- | --- | --- | --- |
| AI shell boot | automated | automated | automated | automated smoke | automated smoke |
| Runtime health | automated | automated | automated | automated | automated |
| Legacy-state sentinel | automated | automated | automated | health coverage | health coverage |
| Exact WebLLM 0.2.82 bundle import | automated | automated | automated | not forced | not forced |
| Tutor compatibility fallback | automated | automated | automated | Ask Scholark smoke | Ask Scholark smoke |
| Essay 13-category fallback | automated | automated | automated | via runtime fallback architecture | via runtime fallback architecture |
| Planner compatibility result | automated | automated | automated | runtime smoke | runtime smoke |
| SAT/AP compatibility diagnosis | automated | automated | automated | runtime smoke | runtime smoke |
| College/Scholarship grounded rows | automated | automated | automated | runtime smoke | runtime smoke |
| Adaptive practice objective grading | automated | automated | automated | UI smoke | UI smoke |
| Retrieval prompt cannot auto-grade | automated | automated | automated | engine rule loaded | engine rule loaded |
| Ask Scholark focus/dialog path | automated | automated | automated | automated | automated |
| Practice dialog path | automated | automated | automated | automated | automated |

The desktop projects force `navigator.gpu` unavailable for specialist-flow tests so compatibility behavior is exercised intentionally rather than depending on CI GPU support.

## Runtime/model-source evidence

CI verifies:

- npm resolves `@mlc-ai/web-llm@0.2.82`;
- the configured Qwen3 1.7B, Qwen3 0.6B, and SmolLM2 360M MLC repositories resolve;
- a browser can import the exact pinned ESM runtime bundle;
- the imported module exposes `CreateMLCEngine`;
- the manifest contains the expected three model IDs.

This runtime preflight **does not download model weights** and is not recorded as successful WebGPU inference.

## Adaptive-practice E2E

Browser tests create an adaptive session for a supported objective skill, submit the known correct answer, and require:

- an objectively graded response;
- `correct === true`;
- a mastery update;
- session persistence in the separate AI namespace.

A separate unknown/open-ended topic creates a retrieval prompt and requires:

- `gradable === false`;
- grader returns `correct === null`;
- no automatic mastery award.

This prevents a language-model-like free response from becoming unverified progress evidence.

## Runtime-health/data-safety E2E

The browser suite calls `ScholarkAIHealth.run()` and requires `report.pass === true`. It also plants a legacy `gs_ci_sentinel` localStorage value before the health check and confirms the exact value remains afterward.

The health module itself snapshots legacy `gs_*`/Firebase localStorage values by hash + length before behavioral probes and requires equality afterward.

## Existing Scholark preservation findings

- `index.html` remains the source application and is not replaced by the AI branch.
- SAT/AP modules remain separate/lazy.
- original Essay Coach local rubric remains present.
- AI expands essay feedback instead of deleting the old analyzer.
- existing saved-essay/Firebase paths remain unchanged.
- intelligence dashboard inserts above the saved-results grid.
- SAT/AP evidence goes into separate AI mastery and does not write native prep/AP stores.
- planner/application context adapters are read-only toward their legacy stores.
- college AI does not surface the legacy unsourced `rate` field.
- adaptive practice uses separate AI storage.

## Zero-paid-provider finding

The baseline AI runtime contains no configured paid OpenAI/Anthropic/Gemini/Together/Fireworks/Groq/Replicate inference endpoint. Local WebGPU inference is the generative path; deterministic logic is the compatibility path.

## Failure E2E

### WebGPU disabled

Executed in desktop branch E2E.

Expected/required behavior:

- legacy Scholark survives;
- all tested specialists return useful deterministic/guided results;
- Essay Reader produces a valid 13-category result;
- no dead-end "AI unavailable" screen is required.

Status: **PASS — branch browser compatibility** when the applicable latest regression run is green.

### Pinned runtime import unavailable/broken

`preflightRuntime()` exposes the difference between a failed runtime import and lack of WebGPU. CI requires the exact bundle import to succeed.

Status: **automated branch check**; latest-head result required for release.

### Primary model load failure / smaller-tier chain

Implementation unloads/cleans failed engines and iterates lower tiers before deterministic fallback.

Status: **implementation covered; real WebGPU model-load failure injection remains PENDING — WebGPU**.

### Malformed model JSON

Parser/validator logic rejects malformed/out-of-range structures, attempts one repair, then falls back deterministically.

Status: **PASS — deterministic parser/validator coverage; real local-model malformed-output injection remains PENDING — WebGPU**.

### Offline transition after cache

Expected:

- deterministic tools continue;
- saved draft remains local;
- cached local runtime/model may continue where browser/runtime caching allows;
- no student work disappears.

Status: **PENDING executed offline-after-cache scenario**.

### Low-memory/device loss

Expected: catch failure, attempt smaller tier where practical, then deterministic fallback while preserving the UI/input.

Status: **PENDING — WebGPU/device-loss execution**.

## Mobile WebKit stress evidence

The repository's pre-existing iPhone-like WebKit stability workflow was retained and expanded so AI asset changes trigger it. During branch work it exposed a stale DOM budget: `.skm-experience` had 149 descendants even though the AI branch had not changed `index.html`, `scholark-mobile.js`, or `scholark-mobile.css`.

The guard was updated to a tight `<170` ceiling around the verified untouched production baseline. Functional assertions remain stricter than the node count itself:

- mobile runtime/loader active;
- no eager SAT/AP engines;
- no desktop cinematic graph;
- opening composition intact;
- no horizontal overflow;
- correct sticky-scroll progress;
- bounded S/logo transform;
- repeated forward/reverse stress-scroll passes on iPhone 13 and iPhone SE profiles;
- no relevant WebKit page errors.

Workflow diagnostics/server logs are now preserved as artifacts on every run.

## Accessibility evidence

Implemented and automated smoke coverage includes:

- dialog role/modal labeling;
- labeled inputs;
- Escape close;
- Tab focus containment implementation;
- focus restoration;
- visible focus styling;
- responsive mobile modal fit;
- reduced-motion CSS;
- text labels in addition to mastery visuals.

Still required for production sign-off:

- deployed full keyboard traversal;
- screen-reader smoke on production;
- automated accessibility scan against production;
- contrast verification in deployed light/dark themes;
- real mobile keyboard behavior with production assets.

## Production audit record

Production URL: `https://sribyju.github.io/`

Production AI branch deployed: **No — not at the time of this record.**

| Production check | Status |
| --- | --- |
| GitHub Pages AI deployment | PENDING |
| Authentication login/logout | PENDING |
| Existing saved-user-data smoke | PENDING |
| Production console audit | PENDING |
| Production network/assets audit | PENDING |
| Broken-link scan | PENDING |
| SEO/canonical/sitemap/robots | PENDING |
| Performance/page-load review | PENDING |
| Live compatibility fallback | PENDING |
| Live SAT/AP → mastery → practice loop | PENDING |
| Live grounded College/Scholarship flows | PENDING |
| Real compatible-device WebGPU weight download/inference | PENDING |
| Live AI quality pass | PENDING |

## Rule for updating this document

Only record PASS after the exact flow/environment was executed. Branch browser evidence is labeled as branch evidence. Runtime import is not called inference. Implementation is not called execution. Production is not called passed until the deployed GitHub Pages build is actually audited.
