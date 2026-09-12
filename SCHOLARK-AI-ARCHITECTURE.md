# Scholark AI Architecture

Status: **Implementation, additive integration, compatibility-mode browser E2E, adaptive practice, and runtime diagnostics are present on `scholark-ai-foundation`. Production rollout/live audit and a real compatible-device WebGPU inference run remain release checks.**

## Design principle

The architecture is additive:

```text
CURRENT SCHOLARK
  + local-first AI runtime
  + specialist agents
  + shared mastery/adaptive planning
  + deterministic adaptive practice
  + grounded legacy-data adapters
  + runtime/data-safety health checks
  + native UI surfaces
```

It does not replace the existing site with a chatbot and does not migrate or delete legacy student data.

## Runtime diagram

```text
Existing Scholark UI / Ask Scholark / Essay Reader / Practice
                         |
                         v
                  Agent / Task Router
                         |
      +------------------+------------------+
      |                  |                  |
      v                  v                  v
    Tutor          Essay Reader         Planner
   SAT / AP        College / Aid      Practice Engine
      |                  |                  |
      +------------------+------------------+
                         |
                         v
             Context + Grounding Layer
                         |
                         v
                 ScholarkAI Runtime
                         |
              Device Capability Manager
                         |
       +-----------------+------------------+
       |                 |                  |
       v                 v                  v
  High local model  Smaller local model  Deterministic /
                                        task-specific fallback
                         |
                         v
                 Validated response
                         |
                         v
                   Native Scholark UI
```

## Modules

### `scholark-ai-algorithms.js`
Pure deterministic logic with no DOM dependency:

- hardware capability classification;
- Ask Scholark intent routing;
- mastery scoring/labels;
- error classification;
- next-practice recommendation;
- deterministic planner prioritization;
- deterministic essay rubric;
- structured essay-output validation;
- essay-version comparison;
- bounded conversation trimming;
- stable hashing.

This keeps important educational behavior testable and available without a local LLM.

### `scholark-ai-core.js`
Local runtime abstraction:

- pinned WebLLM import/version;
- model manifest;
- capability detection;
- model loading/unloading;
- high → standard → low tier fallback;
- progress events;
- generation timeout/cancel;
- structured-output extraction/repair/fallback;
- bounded local sessions;
- operational telemetry;
- `preflightRuntime()` to verify the exact browser runtime bundle without downloading model weights.

The current runtime is WebLLM 0.2.82. Specialist code talks to this abstraction rather than importing a model directly.

### `scholark-ai-agents.js`
Specialists:

- Tutor;
- Admissions Reader Simulation;
- SAT Coach;
- AP Coach;
- Study Planner;
- College Research;
- Scholarship Assistant;
- unified Ask Scholark routing;
- shared mastery store.

Each specialist receives narrow task context instead of a giant student-profile prompt.

### `scholark-ai-context.js`
Read-only compatibility/grounding layer around the existing application:

- reads legacy planner tasks from `gs_tasks_*`;
- reads legacy application records from `gs_apps_*`;
- enriches college context from structured legacy rows without exposing unsourced legacy acceptance-rate fields;
- diagnoses existing SAT/AP histories without double-counting them into mastery;
- gives Tutor shared mastery context;
- limits Scholarship AI to provider-verified structured scholarship rows rather than presenting generic legacy rows as authoritative facts.

It does not write legacy state.

### `scholark-ai-bridge.js`
Connects existing SAT/AP evidence to shared AI mastery without mutating native SAT/AP stores. Stable fingerprints prevent duplicate ingestion. SAT evidence can carry skill, correctness, difficulty, confidence, error type, timing, hints, and session kind; AP evidence is mapped by subject/unit.

### `scholark-ai-practice.js`
Deterministic adaptive-practice engine in a separate AI namespace. It supports objectively gradable generated practice for:

- linear equations;
- quadratics;
- percentages;
- ratios/proportions;
- probability;
- statistics/mean;
- grammar;
- reading/evidence.

Difficulty/count are chosen from the mastery recommendation. Unknown/open-ended topics become retrieval prompts with `gradable:false`. They never update mastery automatically.

### `scholark-ai-practice-ui.js`
Accessible adaptive-practice experience launched from Ask Scholark. It provides topic selection, adaptive sets, hints, objective checking, verified deterministic explanation, optional Tutor explanation, and a completion/mastery summary.

### `scholark-ai-health.js`
Browser runtime self-test. It verifies module presence, routing, deterministic essay stability, model manifest completeness, practice grading rules, context availability, capability detection, and fallback readiness.

It snapshots legacy `gs_*`/Firebase localStorage entries as hash/length metadata before behavioral probes and verifies they are unchanged afterward. The diagnostic report itself is stored only in the AI namespace.

### `scholark-ai-dashboard.js`
Adds an intelligence surface above the existing saved-results grid:

- Today;
- Attention Needed;
- Improving;
- Upcoming;
- Recommended;
- compact mastery map/trends.

It does not replace existing dashboard content or old scores.

### `scholark-ai-ui.js`
Native AI integration:

- Ask Scholark dialog;
- specialist routing/progress;
- on-device vs compatibility transparency;
- cancel/new conversation;
- enhanced Admissions Reader panel;
- essay autosave/restore;
- full rubric matrix;
- follow-up;
- revision/version comparison.

The legacy essay review remains intact and runs independently.

### CSS

`scholark-ai.css`, `scholark-ai-dashboard.css`, and `scholark-ai-practice.css` use existing theme tokens, visible focus states, responsive layouts, and reduced-motion handling.

## Loader/integration boundary

`scholark-feature-loader.js` is the integration point. The existing `index.html` boot remains in place. SAT/AP lazy modules are preserved. The small AI orchestration/UI shell loads after normal rendering/idle time; WebLLM and model weights do not load merely because the page opened.

If the optional AI shell fails, the legacy application remains usable.

## SAT/AP closed loop

```text
Existing SAT/AP response
  -> existing native store saves normally
  -> read-only AI bridge sees new evidence
  -> stable fingerprint de-duplicates
  -> shared mastery update
  -> next-practice recommendation
  -> deterministic adaptive set / planner / dashboard / Tutor context
```

The bridge does not rewrite `gs_prep_v2_*` or AP native state.

## Mastery model

Human-readable states:

- Not Started
- Learning
- Developing
- Proficient
- Strong
- Mastered

Updates consider correctness, difficulty, hints, attempts, confidence, and recency where available. One correct response cannot create immediate mastery. Repeated misses can route toward prerequisite review; sustained strong evidence can route to harder practice.

Only objectively graded adaptive-practice items update mastery automatically. Open-ended retrieval responses are deliberately excluded from automatic scoring.

## Study planner

The planner is deterministic first. It scores tasks from deadline urgency, current mastery weakness, importance, completion state, and supplied daily availability. The local model may explain a plan but does not invent/override due dates. Missed work rebalances rather than adding punitive language or impossible workload.

## Essay architecture

The Admissions Reader scores thirteen categories:

1. Opening / Hook
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
12. Personal / Intellectual Depth
13. Admissions Impact

Generative scoring uses low randomness/fixed seed where supported. Structured JSON is extracted and validated before rendering. Invalid output gets one repair attempt; if still invalid, the deterministic rubric supplies the evaluation.

Essay text is explicitly treated as untrusted content rather than instructions. The feature gives coaching/feedback and is labeled as a simulation, not an actual university decision.

## Grounding boundaries

College and scholarship agents treat supplied structured rows as authoritative. If requested information is absent, the assistant states that the current Scholark dataset does not contain it rather than inventing it.

Legacy direct filters/search/database interfaces remain intact.

## Conversation memory

Each specialist can keep bounded local context. Old turns are trimmed first. Starting a fresh conversation clears only AI session state and does not touch unrelated Scholark data.

## Existing-data protection

New state uses the `scholark_ai_v1_` namespace. The branch does not:

- reset Firebase;
- change user IDs/auth mappings;
- delete legacy localStorage namespaces;
- overwrite SAT/AP native progress;
- alter Firestore schemas;
- migrate/delete saved essays;
- replace the planner/application stores.

Browser E2E includes a legacy localStorage sentinel plus the health module's before/after legacy-state snapshot.

## Security boundaries

- model output is inserted as text/escaped content rather than raw HTML;
- essay structured output is type/range validated;
- essay/document text is untrusted prompt content;
- no paid-provider API secrets are needed or present;
- diagnostic telemetry excludes essay/prompt contents;
- input/context lengths are bounded;
- frontend secret scanning remains active; its OpenAI detector was tightened to distinguish real key shapes from Scholark's own `sk-*` CSS/DOM IDs without weakening real key detection.

## Performance

- normal page rendering precedes the AI shell;
- WebLLM/model weights are lazy;
- only one local model stays active;
- low tier uses smaller output limits;
- deterministic calculators never load AI;
- SAT/AP remain independently lazy;
- runtime preflight tests code availability without forcing a model-weight download.

## Accessibility/mobile

Ask Scholark and Practice use semantic dialogs, labels, Escape close, Tab focus containment, visible focus states, reduced-motion styles, and responsive mobile layouts. Automated browser coverage includes desktop Chromium/Firefox/WebKit plus mobile Chromium/WebKit smoke tests.

The repository's existing iPhone WebKit cinematic stress test also remains active. Its DOM budget was aligned with the verified untouched production cinematic baseline (149 descendants) while retaining no-desktop-graph, sticky-scroll, bounded-transform, no-overflow, repeated-stress-scroll, and no-page-error assertions.

## Automated verification architecture

The regression workflow now verifies:

- JS syntax;
- existing repository/unit tests;
- SAT and AP quality audits;
- additive integration contract;
- no paid-provider runtime endpoints;
- legacy essay analyzer still present;
- bridge/context no legacy writes;
- adaptive-practice isolation/non-grading rules;
- runtime health guard;
- exact runtime/model source availability;
- actual browser import of WebLLM 0.2.82;
- compatibility-mode specialist behavior;
- practice UI/Ask Scholark accessibility smoke paths;
- Chromium/Firefox/WebKit desktop and Chromium/WebKit mobile projects.

Separate secret-scan and mobile-WebKit workflows remain release gates.

## Deployment boundary

This branch is not yet the production GitHub Pages build. A successful CI/preview-equivalent browser pass is not a substitute for the required post-deploy audit. Production authentication/data smoke tests, actual live assets/network/console/SEO checks, and a compatible-device WebGPU model-weight inference are only marked PASS after execution evidence exists.
