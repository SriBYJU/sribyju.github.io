# Scholark Zero-Cost AI Architecture

Status: **Implemented and browser-tested on `scholark-ai-foundation`; production deployment/live audit and a real WebGPU model-weight inference run remain release checks, not claimed passes.**

## Goal

Scholark's baseline AI experience must remain useful without a paid per-token provider, student API key, credit card, trial balance, or inference quota. Browser-local inference is an enhancement layer above deterministic academic logic that remains available when a local model cannot run.

## Baseline inference path

```text
Student action
  -> specialist router / task adapter
  -> deterministic context + grounded product data
  -> device capability manager
  -> strongest practical local model
  -> smaller local model if loading/inference fails
  -> task-specific deterministic fallback
  -> useful result instead of a dead-end "AI unavailable" state
```

No baseline code calls OpenAI, Anthropic, Gemini, Groq, Together, Fireworks, Replicate, or another metered LLM provider.

## Runtime

The generative runtime is `@mlc-ai/web-llm` pinned to **0.2.82** and loaded lazily from an ESM CDN. Model weights are loaded only when a student actively requests a generative feature and their browser/device is eligible for a WebGPU path.

The runtime is intentionally pinned instead of tracking `latest`. WebLLM issue #844 documents a regression introduced after 0.2.82 in which some low-end integrated GPUs can hit disposed-object/GPU-device failures; the report identifies 0.2.82 as unaffected for the tested Qwen3 configurations. The runtime remains abstracted behind `ScholarkAI.generate()` / `generateStructured()` so it can be replaced without rewriting specialist agents.

Reference: https://github.com/mlc-ai/web-llm/issues/844

Scholark also avoids depending on WebLLM grammar-mode structured generation. Structured specialist output uses ordinary local generation, JSON extraction, schema/range validation, one repair attempt, then a deterministic fallback. This keeps malformed JSON from becoming a dead-end.

## Runtime preflight

`ScholarkAI.preflightRuntime()` imports the exact pinned browser bundle and verifies that `CreateMLCEngine` is present **without downloading model weights**. The automated browser suite calls this preflight so a broken CDN/runtime bundle is detected separately from GPU/model-loading failure.

This is deliberately different from claiming a successful WebGPU model inference. CI validates the bundle, manifests, source repositories, no-WebGPU fallbacks, and product flows. A true model-weight download + inference run requires a compatible WebGPU environment and is recorded separately when executed.

## Model manifest

| Tier | Model ID | Purpose | Approximate class | License |
| --- | --- | --- | --- | --- |
| High | `Qwen3-1.7B-q4f16_1-MLC` | Stronger desktop/local generation | ~1.7B parameter class | Apache-2.0 family |
| Standard | `Qwen3-0.6B-q4f16_1-MLC` | Balanced local generation | ~0.6B parameter class | Apache-2.0 family |
| Low | `SmolLM2-360M-Instruct-q4f32_1-MLC` | Constrained WebGPU fallback | 360M parameter class | Apache-2.0 family |

License/model references:

- Qwen3-1.7B: https://huggingface.co/Qwen/Qwen3-1.7B
- Qwen3-0.6B: https://huggingface.co/Qwen/Qwen3-0.6B
- SmolLM2-360M-Instruct: https://huggingface.co/HuggingFaceTB/SmolLM2-360M-Instruct
- WebLLM: https://github.com/mlc-ai/web-llm

The regression workflow verifies that the pinned npm runtime version and all three model repositories resolve. Future model replacements must repeat license, availability, and browser-compatibility review before entering the manifest.

## Capability tiers

`scholark-ai-core.js` evaluates practical browser signals including WebGPU availability, WASM availability, device memory when exposed, logical CPU count, coarse/mobile pointer behavior, and reduced-data preference.

- **High:** stronger local model when WebGPU and hardware signals are strong.
- **Standard:** balanced local model.
- **Low:** smallest generative model when WebGPU exists but the device is constrained.
- **Compatibility:** no full generative model required; guided/task-specific/deterministic logic remains useful.

Scholark changes execution paths automatically rather than telling a student their device is inadequate.

## Reliability ladder

1. Preferred local WebGPU model.
2. Smaller WebGPU model.
3. Browser-local deterministic/task-specific academic logic when a practical full-model path is unavailable or fails.
4. Existing Scholark engines stay independently available: original essay rubric, SAT/AP engines, GPA/calculator tools, planner, college/scholarship interfaces, saved data, and account flows.

Fallback behavior is not misrepresented as model-generated AI. The UI distinguishes on-device generative capability from compatibility/guided behavior.

## Adaptive practice remains free without a model

`scholark-ai-practice.js` generates and grades deterministic practice for supported domains such as linear equations, quadratics, percentages, ratios, probability, statistics, grammar, and reading evidence. It adapts count/difficulty from the shared mastery model without calling a paid service.

For unknown/open-ended topics, Scholark creates retrieval-practice prompts but marks them `gradable:false`; those responses never auto-inflate mastery. A local Tutor may explain them if available, while the practice engine itself remains functional without a model.

## Runtime health / data-safety checks

`scholark-ai-health.js` runs browser self-checks for module readiness, routing, deterministic essay stability, practice grading rules, context availability, model manifest completeness, capability detection, and fallback availability.

Before behavioral probes it hashes/records length metadata for legacy `gs_*`/Firebase localStorage entries; afterward it verifies those values are unchanged. Health data is written only to the AI namespace. This gives the release suite a concrete guard against an additive AI check accidentally mutating legacy student state.

## Why no paid server fallback

A paid cloud fallback would make reliability depend on billing and make operating cost scale with student token usage. That violates the product requirement. A local model failure therefore routes downward toward smaller/local/deterministic systems rather than outward toward a metered provider.

## Cost model

| Component | Baseline AI inference cost to Scholark | Notes |
| --- | ---: | --- |
| WebLLM inference | $0 per token | Compute occurs on the student's device. |
| Deterministic mastery/planning/rubric/practice logic | $0 per token | Browser JavaScript. |
| SAT/AP evidence bridge | $0 per token | Reads existing application state; no AI-provider call. |
| Runtime health checks | $0 per token | Browser-local diagnostics. |
| Local AI conversation/practice state | $0 per token | Bounded local storage. |
| Existing GitHub Pages hosting | Existing project infrastructure | Normal bandwidth/platform limits still apply. |
| Runtime/model downloads | No per-token inference fee | CDN/model-host bandwidth and user download/cache storage still exist. |
| Existing Firebase sync | Existing project infrastructure | Existing quotas/costs are separate from model inference. |

"Zero-cost AI" means the baseline architecture does not create a proportional paid inference bill as student token usage rises. It does **not** mean that third-party hosting/CDN/bandwidth is unlimited or costless forever.

## First-use network behavior

Local generative AI is not falsely described as offline from first launch. A device that has never loaded the runtime/model needs network access for those assets. Once cached, supported local capabilities may continue without continuous network access depending on browser/runtime cache behavior. Deterministic fallbacks do not require a model download.

## Caching and loading

- The AI orchestration shell loads after normal Scholark rendering/idle time.
- Model weights do **not** load on first paint or merely because the AI shell exists.
- Only one model is kept active at a time.
- Model loading exposes progress events.
- Failure unloads/cleans the active model before trying a lower tier.
- Conversation context is bounded.
- Runtime preflight imports code only; it does not force a multi-hundred-MB/GB model download in CI.

## Data and privacy

Prompts intended for the local model are processed by the browser-local runtime. Operational telemetry records only runtime/health information such as failures, fallbacks, counts, and timing-oriented diagnostics; it intentionally does not put essay/prompt content into diagnostic history.

Essay version history stores evaluation summaries and a content hash rather than raw essay copies. A separate local autosave protects the working draft. Existing signed-in essay/Firebase behavior remains unchanged.

Legacy planner, application, SAT, and AP data are read through adapters. The adapters do not rewrite their native stores.

## Optional external keys

BYOK/external-provider mode is **not implemented**. It is intentionally omitted until there is a secure design that does not expose secrets in client code and does not weaken the free local baseline.

## Automated proof currently available

The branch regression suite exercises:

- JavaScript/unit/integration contracts;
- existing SAT/AP audits;
- no paid-provider endpoints in the AI runtime;
- pinned runtime/model source availability;
- actual browser import of the pinned WebLLM bundle;
- no-WebGPU deterministic behavior for every specialist;
- adaptive practice grading/non-grading rules;
- runtime health and legacy-state sentinel;
- desktop Chromium/Firefox/WebKit and mobile Chromium/WebKit smoke paths.

A successful compatible-device WebGPU model-weight download/inference and the final deployed production audit are intentionally recorded separately; implementation alone is not accepted as proof of those checks.

## Scaling conclusion

More students increase static asset delivery and normal application usage, but do not automatically create a per-token LLM invoice for Scholark. That is the central sustainability property of this architecture.
