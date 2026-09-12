# Scholark Zero-Cost AI Architecture

Status: **Implemented on `scholark-ai-foundation`; production deployment and live audit are not yet claimed.**

## Goal

Scholark's baseline AI experience must remain usable without a paid per-token provider, student API key, credit card, trial balance, or inference quota. The architecture therefore treats browser-local inference as an enhancement layer and deterministic academic logic as a guaranteed final fallback.

## Baseline inference path

```text
Student action
  -> Scholark specialist router
  -> device capability manager
  -> strongest practical local model
  -> smaller local model if loading/inference fails
  -> task-specific/deterministic academic fallback
  -> useful result instead of a dead-end "AI unavailable" state
```

No baseline code calls OpenAI, Anthropic, Gemini, Groq, Together, Fireworks, Replicate, or another metered LLM provider.

## Runtime

The generative runtime is `@mlc-ai/web-llm` pinned to **0.2.82** and loaded lazily from an ESM CDN only after a student requests a generative capability. Model weights are also loaded only on demand and are cached by the browser/runtime where supported.

The runtime is intentionally pinned instead of tracking `latest`. WebLLM issue #844 documents a regression introduced in 0.2.83 in which low-end integrated GPUs can hit disposed-object/GPU-device failures; the same report states that 0.2.82 is unaffected. The runtime remains abstracted behind `ScholarkAI.generate()` / `generateStructured()` so it can be replaced without rewriting the specialist agents.

Reference: https://github.com/mlc-ai/web-llm/issues/844

## Model manifest

| Tier | Model ID | Purpose | Approximate class | License |
| --- | --- | --- | --- | --- |
| High | `Qwen3-1.7B-q4f16_1-MLC` | Stronger desktop/local generation | ~1.7B parameter class | Apache-2.0 family |
| Standard | `Qwen3-0.6B-q4f16_1-MLC` | Balanced local generation | ~0.6B parameter class | Apache-2.0 family |
| Low | `SmolLM2-360M-Instruct-q4f32_1-MLC` | Constrained WebGPU fallback | 360M parameter class | Apache-2.0 family |

License references:

- Qwen3-1.7B: https://huggingface.co/Qwen/Qwen3-1.7B
- Qwen3-0.6B: https://huggingface.co/Qwen/Qwen3-0.6B
- SmolLM2-360M-Instruct: https://huggingface.co/HuggingFaceTB/SmolLM2-360M-Instruct
- WebLLM package: https://github.com/mlc-ai/web-llm

Future model replacements must repeat license and browser-compatibility review before being added to the manifest.

## Capability tiers

`scholark-ai-core.js` evaluates practical browser signals including WebGPU availability, WASM availability, device memory when exposed, logical CPU count, coarse/mobile pointer behavior, and reduced-data preference.

- **High:** stronger local model when WebGPU and hardware signals are strong.
- **Standard:** balanced local model.
- **Low:** smallest generative model when WebGPU exists but the device is constrained.
- **Compatibility:** no full generative model required; use guided/task-specific/deterministic logic.

Scholark does not tell students that their device is "not powerful enough." It changes execution paths automatically.

## Reliability ladder

1. Preferred local WebGPU model.
2. Smaller WebGPU model.
3. Browser-local deterministic/task-specific academic logic when a practical full-model path is unavailable or repeatedly fails.
4. Existing Scholark engines remain available independently of the AI shell, including the original essay rubric, SAT/AP engines, GPA tools, search/filter tools, planner, and other legacy features.

The current foundation does not pretend that a deterministic fallback is generative AI. Fallback responses are labeled as guided/compatibility behavior in the UI.

## Why no paid server fallback

A paid cloud fallback would make "reliability" dependent on a billing account and would make operating cost scale with student usage. That violates the product requirement. A local model failure therefore routes downward toward smaller/local/deterministic systems rather than outward toward a metered provider.

## Cost model

| Component | Baseline AI inference cost to Scholark | Notes |
| --- | ---: | --- |
| WebLLM inference | $0 per token | Compute occurs on the student's device. |
| Deterministic mastery/planning/rubric logic | $0 per token | Runs as JavaScript in the browser. |
| SAT/AP evidence bridge | $0 per token | Reads existing local application state; does not call an AI provider. |
| Local AI conversation state | $0 per token | Stored locally in bounded form. |
| Existing GitHub Pages hosting | Existing project infrastructure | Not an AI-token service. Normal bandwidth/platform limits still apply. |
| Existing Firebase sync | Existing project infrastructure | The AI foundation does not introduce a paid inference dependency. Existing Firebase quotas/costs are separate from model inference. |

"Zero-cost AI" means the baseline architecture does not create a proportional paid inference bill as student token usage rises. It does **not** mean that every third-party hosting/CDN service on the internet is guaranteed to have unlimited free bandwidth forever.

## First-use network behavior

Local generative AI is not falsely described as permanently offline from first launch. On a device that has never loaded the runtime/model, the browser needs network access to download those assets. Once cached, supported local capabilities may continue without continuous network access. Deterministic fallback functionality does not require a model download.

## Caching and loading

- The AI orchestration shell loads only after normal Scholark rendering/idle time.
- Model weights do **not** load on first page paint.
- Only one model is kept active at a time.
- Model loading exposes progress events to the UI.
- Failure unloads the model engine before attempting a lower tier.
- Conversation context is bounded to avoid uncontrolled memory growth.

## Data and privacy

Generated prompts are passed to the local runtime in the browser. The AI telemetry layer records only operational information such as runtime errors, fallback events, and counts; it intentionally does not store essay text or prompt content in diagnostic history.

Essay version history stores evaluation summaries and a content hash, not the raw essay. A separate local autosave protects the working draft. Existing signed-in essay/Firebase behavior remains unchanged.

## Optional external keys

BYOK/external-provider mode is **not implemented** in the foundation. It is intentionally omitted until there is a secure design that does not expose secrets in client code and does not weaken the free local baseline.

## Scaling conclusion

Increasing the number of students increases static asset delivery and normal application usage, but it does not automatically create a per-token LLM invoice for Scholark. That is the central sustainability property of this architecture.
