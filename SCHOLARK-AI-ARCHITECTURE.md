# Scholark AI Architecture

Status: **Foundation implemented on `scholark-ai-foundation`; production rollout requires merge/deployment plus live audit.**

## Design principle

The architecture is additive:

```text
CURRENT SCHOLARK
  + local-first AI runtime
  + specialist agents
  + shared mastery/adaptive planning
  + grounded retrieval adapters
  + native UI surfaces
```

It is explicitly not a replacement of the existing site with a chatbot.

## Runtime diagram

```text
Existing Scholark UI / Ask Scholark / Essay Coach
                         |
                         v
                  Agent Router
                         |
        +----------------+----------------+
        |                |                |
        v                v                v
      Tutor         Essay Reader      Planner
      SAT/AP        College           Scholarship
        |                |                |
        +----------------+----------------+
                         |
                         v
                 Context Manager
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

## Files

### `scholark-ai-algorithms.js`
Pure deterministic logic with no DOM dependency. It contains:

- hardware capability classification;
- Ask Scholark intent routing;
- mastery scoring and labels;
- error classification;
- adaptive-practice selection;
- deterministic planner prioritization;
- full deterministic essay-rubric baseline;
- structured essay-output validation;
- essay-version comparison;
- bounded conversation trimming;
- stable hashing.

Keeping this logic pure makes it unit-testable and ensures core educational behavior still exists without a local LLM.

### `scholark-ai-core.js`
Local runtime abstraction. It owns:

- model manifest;
- WebLLM import/version pin;
- model loading/unloading;
- tier fallback;
- model progress events;
- generation timeout;
- cancellation;
- structured-output parsing/repair;
- bounded local session memory;
- operational telemetry without student-content logging.

Specialist code calls the runtime abstraction rather than importing a particular model directly.

### `scholark-ai-agents.js`
Specialist layer. It centralizes prompts and task behavior for:

- Tutor;
- AI Admissions Reader Simulation;
- SAT Coach;
- AP Coach;
- Study Planner;
- College Research;
- Scholarship Assistant;
- Ask Scholark routing.

Each specialist receives task-specific context rather than one huge profile prompt.

### `scholark-ai-dashboard.js`
Adds a signed-in intelligence surface above the existing dashboard results grid. It does not replace existing dashboard content. It renders:

- Today;
- Attention Needed;
- Improving;
- Upcoming;
- Recommended;
- compact mastery map.

It also records mastery deltas in a separate AI trend store and adds keyboard focus containment for the Ask Scholark dialog.

### `scholark-ai-bridge.js`
Connects existing SAT/AP evidence into the shared AI mastery model without mutating native SAT/AP state.

SAT evidence includes existing fields such as skill, difficulty, correctness, confidence, error type, response time, hints, and session type. AP evidence is mapped by subject and unit. Fingerprints prevent duplicate ingestion.

### `scholark-ai-ui.js`
Native UI integration:

- Ask Scholark command dialog;
- specialist routing status;
- on-device vs guided-fallback transparency;
- enhanced Essay Admissions Reader panel;
- essay autosave/restore;
- full category matrix;
- follow-up questions;
- version comparison.

The legacy essay review runs first and remains available as the final compatibility fallback.

### `scholark-ai.css` / `scholark-ai-dashboard.css`
Responsive, reduced-motion-aware styling that uses Scholark's existing tokens and visual identity.

## Data flow: SAT/AP closed loop

```text
Existing SAT/AP answer
  -> existing SAT/AP state saves normally
  -> read-only AI bridge notices new evidence
  -> duplicate fingerprint check
  -> shared mastery update
  -> adaptive practice recommendation
  -> dashboard / planner / Tutor context
```

The bridge does not rewrite `gs_prep_v2_*` or `gs_ap_v2_*` state.

## Mastery model

The shared AI layer uses six human-readable states:

- Not Started
- Learning
- Developing
- Proficient
- Strong
- Mastered

A mastery update considers correctness, difficulty, hints, attempts, confidence, and recency where available. A single correct response cannot immediately produce mastery. Repeated misses can route toward prerequisite review, while high mastery/high accuracy can route toward harder practice.

This is intentionally deterministic and debuggable.

## Study planner

The planner is deterministic first. It scores tasks using deadline urgency, current mastery weakness, importance, and completion state. The local model may explain the plan, but it does not invent or override dates.

The planner supports rebalance events such as completed or missed tasks. A missed task raises priority modestly rather than adding punitive language or unrealistic workload.

## Essay architecture

The Essay Admissions Reader uses thirteen scored categories:

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

The generative reader uses low randomness and a fixed seed when supported. Structured JSON is validated before rendering. Malformed output gets one local repair attempt; if validation still fails, the deterministic rubric supplies the evaluation.

Essay text is wrapped as content and the system prompt explicitly instructs the model not to obey instructions inside the essay. The feature coaches rather than replacing the entire essay.

## Grounding boundaries

College and scholarship agents accept explicit structured rows as their authoritative source. If a requested fact is absent, they say the current Scholark dataset does not include it instead of inventing data.

The direct filter/search interfaces remain intact; natural-language assistance is an additional interface.

## Conversation memory

Each specialist can keep bounded local session context. Context is trimmed from the oldest turns first to stay within resource constraints. Students can start a fresh conversation from the UI, which clears AI session memory without touching unrelated Scholark data.

## Existing data protection

The foundation adds new local keys under the `scholark_ai_v1_` namespace. It does not:

- reset Firebase;
- change user IDs;
- delete localStorage namespaces used by legacy tools;
- overwrite SAT/AP native mastery;
- alter existing Firestore schemas;
- migrate or delete saved essays;
- change authentication mappings.

Existing essay save/sync continues through the legacy code path.

## Security boundaries

- Model output is escaped before chat rendering.
- Essay structured output is type/range validated.
- Essay content is explicitly treated as untrusted content, not prompt instructions.
- The AI layer does not render raw model HTML.
- No provider API keys are present in the client.
- Diagnostic telemetry excludes prompt/essay content.
- Inputs are length-bounded to reduce memory/freezing risk.

## Performance

- AI shell loads after initial rendering/idle time.
- Model runtime/model weights are lazy.
- One model is active at a time.
- Smaller output limits are used on the low tier.
- Existing calculators remain deterministic and do not load AI.
- SAT/AP modules remain independently lazy-loaded.

## Accessibility and mobile

The AI dialog includes semantic dialog markup, labels, keyboard close behavior, a Tab focus loop, visible focus styling, reduced-motion support, and responsive bottom-sheet behavior on small screens. The essay matrix and dashboard collapse to single-column layouts on narrow phones.

## Feature discovery

Ask Scholark offers concise specialist shortcuts without turning the entire application into chat. Existing calculators, tables, filters, dashboard, test-prep engines, and structured pages remain direct interfaces.

## Deployment boundary

The implementation is currently isolated on `scholark-ai-foundation`. This document does **not** claim that production has passed the mandatory live audit. Production verification can only be recorded after the branch is merged/deployed and the actual GitHub Pages build is navigated in browser environments.
