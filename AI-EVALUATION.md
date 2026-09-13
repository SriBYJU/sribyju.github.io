# Scholark AI Evaluation Plan and Current Results

Status: **PRODUCTION EVALUATION PASSED FOR THE EXECUTED AUTOMATED SCOPE.** The `ai-107` release was audited against the public GitHub Pages site and completed **28/28 live Playwright tests**. Real physical-WebGPU model-weight inference, authorized existing-user account E2E, manual screen-reader testing, and formal Lighthouse performance testing remain separate unexecuted checks.

## Evaluation philosophy

Scholark AI is not considered correct merely because it returns text. Evaluation is separated into:

1. correctness and grounding;
2. pedagogical usefulness;
3. rubric/diagnostic consistency;
4. failure recovery;
5. latency/device practicality;
6. accessibility/responsive behavior;
7. zero-regression/data safety;
8. dependency/runtime security;
9. live deployment integrity.

Implementation is not treated as execution evidence. A runtime import is not treated as model inference. Branch tests are not treated as production tests. Static preservation evidence is labeled separately from interactive E2E.

## Automated logic/integration evaluation

`scripts/scholark-ai.test.js` and the regression workflow cover deterministic behavior such as:

- capability/fallback decisions;
- specialist routing;
- mastery progression that prevents one-question mastery;
- prerequisite/next-practice selection;
- deadline-aware planning;
- deterministic essay-score stability;
- all thirteen essay categories;
- malformed/out-of-range structured-output rejection;
- essay-version deltas;
- bounded conversation context;
- preservation contracts for existing Scholark systems.

The regression workflow also executes the existing SAT and AP quality audits.

## Production browser matrix

Production URL: `https://sribyju.github.io/`

Audited release: `c33e0ae937a422cccc2a3c6533dfe71cdeefadcc`

Production audit run: `34728562301`

Playwright version used by the release workflow: 1.63.0.

Browser engines:

- Chromium / Chrome for Testing 153.0.8010.12;
- Firefox 155.0;
- WebKit 26.6.

Projects:

- Chromium desktop;
- Firefox desktop;
- WebKit desktop;
- Android-class Chromium mobile;
- iPhone-class WebKit mobile.

Result: **28 passed, 0 failed**.

## What the 28 live tests prove

### Chromium desktop

The production suite executed:

1. additive AI boot, runtime health, and legacy-state preservation;
2. original desktop S cinematic built before AI shell startup;
3. exact WebLLM 0.2.82 browser bundle import without model weights;
4. grounded Scholark product/about routing instead of generic Tutor fallback;
5. all specialists returning useful compatibility-mode results with WebGPU unavailable;
6. adaptive practice objectively grading verified items and never auto-grading open-ended retrieval;
7. creator-question routing plus keyboard-accessible Ask Scholark/practice dialogs;
8. bounded `ai-107` boot, cinematic-first ordering, and event-loop responsiveness;
9. mutation-observer quiescence rather than a self-triggering mutation storm;
10. essay autosave in the AI namespace without modifying a legacy sentinel;
11. new-conversation/cancel-generation affecting only AI state;
12. reduced-motion behavior disabling AI pulse animation and quick-action transitions.

### Firefox and desktop WebKit

Each executes the seven core browser regression flows: additive boot/state safety, S-cinematic ordering, runtime preflight, grounded product routing, all-specialist compatibility behavior, adaptive-practice grading/non-grading, and keyboard/dialog behavior.

### Mobile Chromium and WebKit

Each executes mobile fallback-runtime, dialog, and adaptive-practice usability coverage.

A separate iPhone-like WebKit stress workflow also passed post-merge and checks repeated scrolling, mobile runtime/loader behavior, opening composition, bounded transforms, no horizontal overflow, and relevant page errors.

## Runtime/source evaluation

Automated release checks verify:

- `@mlc-ai/web-llm@0.2.82` resolves;
- configured local model sources resolve;
- the exact browser ESM bundle imports;
- `CreateMLCEngine` exists;
- the production AI runtime contains no configured paid hosted inference endpoint.

The runtime preflight deliberately does **not** download model weights. It proves the runtime code path, not actual physical-GPU generation.

## Reliability-layer evaluation

`scholark-ai-reliability.js` adds:

- improved capability selection;
- Qwen model retry/recovery;
- independent `Llama-3.2-1B-Instruct-q4f16_1-MLC` rescue;
- weak/generic-response rejection;
- timeout/error normalization;
- deterministic final fallback;
- grounded Scholark product knowledge.

The production browser matrix proves compatibility-mode behavior, routing, and startup integration. A true multi-model WebGPU recovery sequence remains a physical-WebGPU test boundary until actual model weights are loaded in a compatible hardware environment.

## Adaptive-practice evaluation

Supported deterministic objective domains include linear equations, quadratics, percentages, ratios/proportions, probability, statistics/mean, grammar, and reading evidence.

Rules proven in browser E2E:

- objective items have known answers/explanations;
- correct objective responses are graded as correct;
- verified objective evidence can update mastery;
- unknown/open-ended retrieval prompts have `gradable:false`;
- open-ended responses return no objective correctness verdict and cannot auto-award mastery;
- practice state remains in the separate AI namespace.

## Runtime-health/data-safety evaluation

`ScholarkAIHealth.run()` checks module readiness, routing, essay determinism, model manifest, practice rules, context, capabilities, and fallback readiness.

For state safety, the browser suite plants a legacy `gs_*` sentinel and requires exact preservation after AI probes. The health module also snapshots relevant legacy local-storage values by hash/length and requires equality afterward.

This does not substitute for an authorized real-account backend mutation test; it proves the browser-local additive boundary exercised by the suite.

## Specialist quality criteria

### Tutor
Expected: prerequisite-oriented explanations, appropriate depth, no invented facts, understanding checks, and useful guided fallback without WebGPU.

### Admissions Reader
Expected: harsh/consistent thirteen-category scoring; 9 exceptional, 10 extremely rare; evidence-based feedback; no prompt injection from essay text; structured output validation; deterministic fallback; follow-up and version comparison without ghostwriting the student's entire essay.

### SAT Coach
Expected: diagnose recorded evidence only, distinguish skill/error patterns, target a practical next set, never invent a score/question history.

### AP Coach
Expected: use supplied subject/unit evidence and avoid invented College Board facts/weights.

### Study Planner
Expected: deadline/importance/mastery-aware deterministic priority; realistic time budget; no invented dates; missed work rebalances instead of punishing the student.

### College AI
Expected: structured rows are authoritative; absent data is explicitly absent; subjective considerations separated from objective data; no fabricated admission prediction.

### Scholarship AI
Expected: verified stored fields only; no fabricated scholarship/deadline/eligibility; explicit missing-data behavior.

### Product/about routing
Expected: Scholark-specific questions are answered from explicit product facts. The live suite verifies that creator questions do not fall through to generic Tutor guidance.

## Failure-mode evaluation

| Failure / edge case | Evidence status |
| --- | --- |
| WebGPU unavailable | **PASS — live production browser**; all specialist compatibility paths remain useful. |
| Runtime bundle unavailable/broken | **PASS for current runtime availability** through live preflight; failure injection itself is not claimed. |
| Cinematic readiness never resolves | **PASS — automated hardening** through bounded boot/watchdog contract. |
| UI mutation feedback loop | **PASS — live production hardening**; mutations settle. |
| Malformed structured data | **PASS — deterministic validation coverage**. |
| Objective vs open-ended practice grading | **PASS — live production browser**. |
| Cancel/new conversation state isolation | **PASS — live production Chromium hardening**. |
| Reduced-motion path | **PASS — live production Chromium hardening**. |
| Primary model real GPU failure / rescue model load | **NOT EXECUTED on physical WebGPU**. |
| GPU device loss / OOM | **NOT EXECUTED on physical WebGPU**. |
| Offline after real model cache | **NOT EXECUTED**. |
| Interrupted first model-weight download | **NOT EXECUTED**. |

## Security/dependency evaluation

The final release regression blocks high/critical production dependency advisories with:

`npm audit --omit=dev --audit-level=high`

The audited lockfile resolved Nodemailer 10.0.9 after the hostile review discovered the vulnerable 9.0.5 lock. The production audit's dependency installs reported **0 vulnerabilities**. Frontend secret scanning also remained green.

Deprecation warnings for transitive tooling packages such as `node-domexception`/`glob` are not classified as vulnerabilities by the successful audit. They may be modernized separately without conflating warning cleanup with a security failure.

## Live deployment/HTTP evaluation

The production audit waited until the new release propagated and then verified HTTP 200 for the HTML, loader, all required AI modules, reliability/UI-polish modules, AI CSS, `robots.txt`, and `sitemap.xml`. It found exactly one canonical tag and no configured paid inference endpoint.

The first Pages build for the merge was superseded/cancelled by the existing V4 audit bot's report-only child commit. The replacement Pages deployment for current main (`75238cf048c7a58c37edeac1faab44c3f66c5af2`) completed successfully in run `34728572875`.

## Known evidence limitations

Not yet executed and therefore not labeled PASS:

- physical WebGPU model-weight download and actual Qwen/Llama/SmolLM generation;
- physical-GPU failover/device-loss/OOM tests;
- authorized real existing-user Firebase login/save/delete/sync E2E;
- manual screen-reader testing;
- formal Lighthouse performance scoring;
- exhaustive closed-world crawler of every possible link/state combination.

## Release conclusion

Within the executed automated scope, the production release is **green**: logic/integration, dependency security, mobile WebKit stress, deployment assets/SEO, state-isolation hardening, and 28/28 live cross-browser tests all passed. Remaining items are explicitly environment-specific/manual evidence boundaries rather than hidden release failures.
