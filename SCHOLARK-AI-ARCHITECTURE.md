# Scholark AI Architecture

Status: **DEPLOYED, ADDITIVE, AND LIVE-AUDITED.** Scholark's `ai-107` local-first AI layer is live at `https://sribyju.github.io/`. The production release audited end-to-end is `c33e0ae937a422cccc2a3c6533dfe71cdeefadcc`.

## Design principle

Scholark AI extends the existing application instead of replacing it:

```text
EXISTING SCHOLARK
  + local-first AI runtime
  + reliability / multi-model recovery layer
  + specialist agents
  + shared mastery and adaptive planning
  + deterministic adaptive practice
  + grounded read-only legacy-data adapters
  + runtime/data-safety health checks
  + native AI UI surfaces
  + hostile browser regression checks
```

Existing calculators, account flows, SAT/AP engines, essay storage, planner/application stores, dashboard content, navigation, and the original desktop/mobile cinematic remain independent product systems.

## Runtime flow

```text
Existing UI / Ask Scholark / Essay Reader / Practice
                         |
                         v
                  Agent / Task Router
                         |
      +------------------+-------------------+
      |                  |                   |
      v                  v                   v
    Tutor          Essay Reader          Planner
   SAT / AP        College / Aid       Practice Engine
      |                  |                   |
      +------------------+-------------------+
                         |
                         v
             Context + Grounding Layer
                         |
                         v
                 ScholarkAI Core
                         |
                 Capability Manager
                         |
                         v
               Reliability Layer
          Qwen tiers -> Llama rescue
                  -> small local
                  -> deterministic
                         |
                         v
                 Validated Response
                         |
                         v
                   Native Scholark UI
```

## Modules

### `scholark-ai-algorithms.js`
Pure deterministic logic used by agents and tests:

- capability classification;
- Ask Scholark routing;
- mastery scoring/labels;
- error classification;
- practice recommendation;
- planner prioritization;
- deterministic essay rubric;
- structured essay-output validation;
- essay-version comparison;
- bounded conversation trimming;
- stable hashing.

### `scholark-ai-core.js`
Local runtime abstraction:

- WebLLM 0.2.82 pinned runtime;
- Qwen/SmolLM model manifest;
- capability detection;
- lazy model loading/unloading;
- progress events;
- generation timeout/cancel;
- structured output extraction/validation/repair;
- deterministic fallback;
- bounded sessions and operational telemetry;
- `preflightRuntime()` for code-only runtime verification without model weights.

### `scholark-ai-reliability.js`
Production recovery layer added by the `ai-107` release:

- improves device-tier decisions, including capable mobile WebGPU devices;
- adds `Llama-3.2-1B-Instruct-q4f16_1-MLC` as an independent rescue model;
- sequences multiple local model attempts rather than relying on one engine;
- detects weak/generic responses and can retry before accepting them;
- normalizes failures/timeouts and cleans failed engines;
- preserves deterministic fallback as the final guaranteed path;
- adds grounded Scholark product knowledge, including correct creator/about/free/privacy routing.

Representative recovery sequences include `high -> standard -> rescue -> low` and `standard -> rescue -> low`, followed by deterministic/task-specific guidance when local generation is not practical.

### `scholark-ai-agents.js`
Specialists exported as executable product paths:

- Tutor;
- Admissions Reader Simulation;
- Study Planner;
- SAT Coach;
- AP Coach;
- College Research;
- Scholarship Assistant;
- unified Ask Scholark router;
- shared mastery store.

Essay APIs include evaluation, follow-up, history, and version comparison. Planner APIs include run/adapt/current. SAT/AP include run/ingest.

### `scholark-ai-context.js`
Read-only grounding/compatibility adapter:

- reads `gs_tasks_*` planner data;
- reads `gs_apps_*` application data;
- reads SAT/AP evidence without rewriting native progress;
- supplies shared mastery context;
- avoids exposing unsourced legacy acceptance-rate fields;
- constrains Scholarship AI to verified structured records.

### `scholark-ai-bridge.js`
Maps existing SAT/AP evidence into separate AI mastery using stable fingerprints to prevent duplicate ingestion. It does not write native prep/AP stores.

### `scholark-ai-practice.js`
Separate AI-namespace adaptive-practice engine. Supported deterministic objective domains include linear equations, quadratics, percentages, ratios, probability, statistics, grammar, and reading/evidence. Unknown/open-ended topics are `gradable:false` and cannot auto-award mastery.

### `scholark-ai-practice-ui.js`
Accessible practice dialog with topic selection, adaptive sets, hints, checking, explanations, and completion/mastery summaries.

### `scholark-ai-health.js`
Browser runtime self-test covering module readiness, routing, deterministic essay behavior, model manifest, practice grading rules, context, capabilities, fallback readiness, and legacy-state preservation. It snapshots legacy `gs_*`/Firebase-related local-storage values before behavioral probes and requires equality afterward.

### `scholark-ai-dashboard.js`
Adds intelligence above the existing saved-results grid: Today, Attention Needed, Improving, Upcoming, Recommended, and mastery/trend views. It does not replace old dashboard content.

### `scholark-ai-ui.js`
Native AI integration:

- Ask Scholark dialog;
- specialist routing/progress;
- local-generative vs compatibility transparency;
- cancellation/new conversation;
- enhanced Admissions Reader;
- essay autosave/restore;
- thirteen-category rubric;
- follow-up;
- revision/version comparison.

### `scholark-ai-ui-polish.js`
Production polish/interaction layer. A hostile audit found that an earlier observer could rewrite the same text on every mutation and trigger its own mutations. `ai-107` makes those updates idempotent and coalesces observer work to one animation frame. Production E2E explicitly checks that mutations settle rather than forming a storm.

## Loader and cinematic boundary

`scholark-feature-loader.js` is the additive integration boundary. The original Scholark boot and S cinematic remain first-class. `ai-107` fixes an important prior failure mode: AI no longer waits forever on a cinematic-ready promise.

The loader now:

1. lets the original cinematic initialize first;
2. bounds the cinematic readiness wait;
3. grants clean paint frames before AI attachment;
4. starts AI through an independent watchdog as well as idle scheduling;
5. records why cinematic readiness was accepted;
6. lazy-loads the AI shell without eager model weights.

A failure in the optional AI shell does not remove the legacy application.

## SAT/AP closed loop

```text
Existing SAT/AP response
  -> native store saves normally
  -> read-only AI bridge observes evidence
  -> stable fingerprint de-duplicates
  -> shared AI mastery update
  -> next-practice recommendation
  -> adaptive practice / planner / dashboard / Tutor context
```

Native SAT/AP state remains authoritative.

## Mastery model

Human-readable stages:

- Not Started
- Learning
- Developing
- Proficient
- Strong
- Mastered

Updates can consider correctness, difficulty, hints, attempts, confidence, recency, and recurring error patterns. A single correct response cannot create immediate mastery. Only objectively graded adaptive-practice evidence updates mastery automatically.

## Study planner

Planning is deterministic first. It prioritizes urgency, weakness, importance, completion state, and available study time. Local generation may explain a plan but does not invent deadlines. Missed work is rebalanced rather than punished with unrealistic workloads.

## Essay architecture

The Admissions Reader uses thirteen categories:

1. Hook
2. Authenticity
3. Specificity
4. Voice
5. Storytelling
6. Reflection
7. Vulnerability
8. Structure
9. Show vs Tell
10. Memorability
11. Low Cliché Risk
12. Depth
13. Admissions Impact

A 9/10 is defined as exceptional and 10/10 as extremely rare. Essay text is treated as untrusted quoted content, not instructions. Structured output is validated before rendering; invalid output is repaired or replaced by deterministic scoring. The feature is clearly a simulation/coaching tool rather than a university decision predictor.

## Grounding boundaries

College and scholarship specialists answer from supplied structured records. Missing facts are surfaced as missing instead of fabricated. Product/about questions are intercepted by the reliability layer and answered from explicit Scholark product facts rather than falling through to generic Tutor guidance.

## State and privacy boundary

New state is namespaced under `scholark_ai_v1_`. The AI release does not:

- reset Firebase;
- change user IDs/auth mappings;
- delete legacy localStorage namespaces;
- overwrite native SAT/AP progress;
- alter Firestore schemas;
- migrate/delete saved essays;
- replace planner/application stores.

Prompt/essay content is excluded from operational diagnostic history. Browser E2E plants a legacy sentinel and verifies it remains byte-stable after AI health/probes.

## Security

- AI/model text is rendered safely rather than trusted as raw HTML;
- structured output receives type/range validation;
- student essay/document text is prompt data, not system instruction;
- no paid-provider secret is needed by the baseline runtime;
- frontend secret scanning is an active release gate;
- production dependencies are blocked at high/critical advisory severity through `npm audit --omit=dev --audit-level=high`;
- weekly email sending performs the same production dependency audit before sending;
- Nodemailer was upgraded from the vulnerable 9.x lock to a patched 10.x release (10.0.9 in the audited lockfile).

## Performance characteristics

- existing render/cinematic precede AI attachment;
- AI runtime/model weights are lazy;
- calculators do not require AI;
- SAT/AP engines remain independently lazy;
- context and outputs are bounded;
- runtime preflight does not download weights;
- a boot watchdog prevents an idle/cinematic wait from permanently blocking AI.

A formal Lighthouse performance run has not yet been recorded and is not implied by these architecture properties.

## Accessibility and mobile

AI dialogs provide semantic dialog labeling, labeled inputs, Escape handling, focus containment/restoration, visible focus states, responsive layouts, and reduced-motion behavior. The live production matrix includes Chromium/Firefox/WebKit desktop plus Android-class Chromium and iPhone-class WebKit. A dedicated iPhone-like WebKit stress workflow additionally checks repeated scrolling, opening composition, bounded transforms, no horizontal overflow, and relevant page errors.

## Production verification

Audited production release: `c33e0ae937a422cccc2a3c6533dfe71cdeefadcc`

Key runs:

- live production AI audit: `34728562301` — success;
- post-merge regression audit: `34728562296` — success;
- post-merge mobile WebKit stability: `34728562277` — success;
- ScholarK V4 audit: `34728562303` — success;
- replacement Pages deployment for the audit-only current-main child: `34728572875` — success.

The live audit waited for deployment propagation, verified all required AI/reliability/UI/CSS/SEO assets at HTTP 200, found exactly one canonical tag and no configured paid inference endpoint, then ran **28/28 Playwright tests successfully against the public production URL**.

## Evidence not claimed

Still not marked as executed proof:

- real physical-WebGPU model-weight download + generation;
- hardware device-loss/OOM fault injection;
- offline-after-cache behavior with downloaded weights;
- real existing-user Firebase account E2E using authorized credentials;
- manual screen-reader pass;
- formal Lighthouse performance audit.

The production architecture is deployed and compatibility-mode/browser behavior is proven; those narrower environment-specific checks remain separate evidence boundaries.
