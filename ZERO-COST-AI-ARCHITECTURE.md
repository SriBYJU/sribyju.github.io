# Scholark Zero-Cost AI Architecture

Status: **DEPLOYED AND LIVE-AUDITED.** The `ai-107` local-first AI release is live at `https://sribyju.github.io/`. The audited product release is `c33e0ae937a422cccc2a3c6533dfe71cdeefadcc`; current `main` may be a direct audit-report-only descendant created by the existing ScholarK V4 workflow.

## Goal

Scholark's baseline AI experience must remain useful without a paid per-token provider, student API key, credit card, trial balance, or hosted inference quota. Browser-local inference is an optional enhancement above deterministic academic systems that remain useful when WebGPU, model loading, or generation is unavailable.

```text
Student action
  -> task / specialist router
  -> grounded context + deterministic academic logic
  -> device capability manager
  -> preferred local Qwen model
  -> alternate local Qwen tier when appropriate
  -> independent Llama 3.2 rescue model when useful
  -> smaller local model where practical
  -> task-specific deterministic / guided fallback
  -> useful result, never a required paid-cloud fallback
```

The production audit scans the deployed AI runtime and found no configured OpenAI, Anthropic, Gemini, Groq, Together, Fireworks, Replicate, or other metered hosted inference endpoint.

## Browser runtime

The generative runtime is `@mlc-ai/web-llm` pinned to **0.2.82** and lazy-loaded from the browser. The version is intentionally pinned because later WebLLM releases have had reported low-end GPU regressions. Specialist code talks through the `ScholarkAI` abstraction rather than importing models directly.

`ScholarkAI.preflightRuntime()` imports the exact pinned browser bundle and verifies `CreateMLCEngine` without downloading model weights. This separates runtime/CDN verification from a real GPU model-weight inference test.

Structured generation does not depend on grammar-mode support. Scholark extracts JSON, validates schema/ranges, attempts bounded repair where appropriate, then uses deterministic output rather than crashing or exposing malformed model text.

## Local model manifest and recovery

Primary model tiers:

| Tier | Model ID | Role |
| --- | --- | --- |
| High | `Qwen3-1.7B-q4f16_1-MLC` | Stronger capable-device generation |
| Standard | `Qwen3-0.6B-q4f16_1-MLC` | Balanced/default local generation |
| Low | `SmolLM2-360M-Instruct-q4f32_1-MLC` | Constrained local fallback |

Independent rescue model:

- `Llama-3.2-1B-Instruct-q4f16_1-MLC`
- family: Llama 3.2
- purpose: a separate local recovery path when the preferred Qwen path fails or produces a weak/generic response.

`scholark-ai-reliability.js` adds the recovery layer on top of the core runtime. It can reject weak generic responses, unload failed engines, retry with another practical local tier, and eventually fall back deterministically. A capable mobile WebGPU device is not automatically demoted merely because it has a coarse pointer; practical memory/CPU/data-saving signals are considered instead.

The exact sequence depends on the requested/capability tier. For example, a high-tier request can attempt `high -> standard -> rescue -> low` before deterministic guidance.

## Capability tiers

Scholark considers WebGPU, WASM, device memory when exposed, logical CPU count, mobile/coarse input, and reduced-data preference.

- **High:** strong desktop-class WebGPU signals.
- **Standard:** balanced WebGPU path, including capable mobile devices.
- **Low:** constrained WebGPU path.
- **Compatibility:** no full local generative model required; deterministic/guided systems remain useful.

Students are not sent to an “AI unavailable” dead end merely because a local model cannot run.

## `ai-107` startup reliability

The AI shell is additive to the existing Scholark experience. The release loader now:

- gives the original Scholark S cinematic priority;
- waits only within a bounded safety window rather than awaiting cinematic readiness forever;
- gives the cinematic clean paint frames before AI attachment;
- has an independent AI boot watchdog so `requestIdleCallback` or cinematic readiness cannot permanently block startup;
- records the cinematic-ready reason for diagnostics;
- uses the `ai-107` cache-busting build so browsers do not reuse the prior broken loader.

A separate UI-polish mutation loop was also eliminated by making text updates idempotent and frame-coalesced.

## Deterministic free systems

The free fallback is not a single generic canned response. Task-specific systems remain available for:

- Tutor guidance;
- thirteen-category essay evaluation;
- study-plan prioritization;
- SAT/AP evidence diagnosis;
- college/scholarship grounded responses;
- mastery recommendations;
- adaptive practice generation and objective grading;
- product/about questions grounded in Scholark's own facts.

`scholark-ai-practice.js` deterministically generates and grades supported objective topics such as linear equations, quadratics, percentages, ratios, probability, statistics, grammar, and reading evidence. Unknown/open-ended topics are marked `gradable:false` and cannot inflate mastery automatically.

## Cost model

| Component | Baseline inference cost to Scholark | Notes |
| --- | ---: | --- |
| WebLLM local inference | $0 per token | Compute runs on the student's device. |
| Qwen / Llama / SmolLM local models | $0 per token | No hosted per-token inference bill. |
| Deterministic rubric/mastery/planner/practice logic | $0 per token | Browser JavaScript. |
| SAT/AP evidence bridge | $0 per token | Reads existing application evidence. |
| Runtime health checks | $0 per token | Browser-local diagnostics. |
| Local AI session/practice state | $0 per token | Namespaced local storage. |
| GitHub Pages / existing Firebase use | Existing project infrastructure | Subject to their normal quotas/limits; separate from model inference. |

“Zero-cost AI” means the baseline architecture does not create a proportional paid LLM inference bill as usage rises. It does not mean bandwidth, CDN hosting, Firebase, or every third-party service has unlimited resources forever.

## Loading and caching

- Normal Scholark rendering and the S cinematic are not replaced by AI boot.
- WebLLM/model weights do not load simply because the page opened.
- Models are lazy-loaded when a generative feature is requested and the device is eligible.
- Failed engines are cleaned up before recovery attempts.
- Conversation context and input lengths are bounded.
- Runtime preflight imports code only; it intentionally does not force a large model download in CI.

A first-time local-generative user still needs network access to obtain runtime/model assets. Cached behavior depends on browser/runtime caching. Deterministic compatibility behavior does not require a model-weight download.

## Privacy and state boundaries

AI state uses the `scholark_ai_v1_` namespace. Operational telemetry records runtime/health information, not raw student prompts or essay text. Essay version history stores evaluation metadata/content hashes, while draft autosave protects the working draft locally.

Legacy planner, application, SAT, and AP data are read through adapters. The AI bridge/context layer does not rewrite those native stores. `ScholarkAIHealth` snapshots legacy `gs_*` / Firebase-related local-storage entries by hash/length around behavioral probes and requires them to remain unchanged.

BYOK/external paid-provider mode is not part of the baseline architecture.

## Production evidence

Live production audit:

- URL: `https://sribyju.github.io/`
- audited release: `c33e0ae937a422cccc2a3c6533dfe71cdeefadcc`
- workflow run: `34728562301`
- release detection: live `ai-107`/SEO/reliability build detected after deployment propagation
- required AI/reliability/UI/CSS assets: HTTP 200
- `robots.txt`: HTTP 200
- `sitemap.xml`: HTTP 200
- canonical tags: exactly 1
- configured paid inference endpoints: none detected
- Playwright production E2E: **28/28 passed**
- engines: Chromium 153.0.8010.12, Firefox 155.0, WebKit 26.6
- production-audit dependency installation: **0 npm vulnerabilities reported**

The live matrix verifies additive boot, S-cinematic-before-AI ordering, runtime preflight, grounded product routing, all specialist compatibility flows, adaptive-practice grading rules, keyboard dialog paths, event-loop responsiveness, mutation quiescence, essay autosave isolation, AI-only conversation clearing/cancellation, reduced motion, and mobile compatibility.

## Evidence boundaries that remain open

The following are deliberately **not** claimed as completed by the automated production audit:

- a real Qwen/Llama/SmolLM model-weight download and successful generation on physical WebGPU hardware;
- injected physical-GPU device-loss / out-of-memory recovery;
- offline-after-cache behavior with real downloaded model weights;
- non-destructive E2E using an authorized real existing Firebase student account;
- manual screen-reader testing;
- a formal Lighthouse performance audit.

These limitations do not mean the features are missing; they mean the exact environments were not executed and therefore are not mislabeled as proof.

## Scaling conclusion

More students increase normal static asset delivery and application usage, but they do not automatically create a per-token LLM invoice for Scholark. That is the central sustainability property of the deployed architecture.
