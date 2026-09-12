# Scholark AI Regression Checklist

Branch: `scholark-ai-foundation`

Legend:

- **PASS — static/additive:** repository structure proves the old capability remains and the AI layer does not replace it.
- **PASS — automated:** executed in repository/unit/browser automation.
- **PASS — browser compatibility:** executed against the branch through real browser engines with WebGPU disabled/compatibility behavior.
- **PENDING — WebGPU:** requires an executed compatible-device model-weight load/inference scenario.
- **PENDING — production:** requires the deployed production build.

Implementation intent alone is never counted as execution evidence.

## Data-safety contract

| Check | Status | Notes |
| --- | --- | --- |
| No database reset | PASS — static/additive | No destructive database operation introduced. |
| No user-ID/auth migration | PASS — static/additive | Authentication mapping untouched. |
| No deletion of legacy localStorage | PASS — automated | New AI state is namespaced; browser health hashes legacy values before/after probes. |
| Existing essay storage preserved | PASS — static/additive | Legacy local/Firebase save/sync remains primary saved-essay path. |
| Existing SAT progress preserved | PASS — automated/static | Bridge is read-only toward native prep; CI enforces no native-store writes. |
| Existing AP progress preserved | PASS — automated/static | Bridge is read-only toward native AP state. |
| Existing planner/apps preserved | PASS — automated/static | Context adapter reads `gs_tasks_*` / `gs_apps_*` without writing them. |
| No destructive schema migration | PASS — static/additive | No Firestore migration added. |
| Existing accounts preserved | PASS — static/additive | No account mutation code added. |
| Browser legacy-state sentinel survives AI health | PASS — automated | Playwright plants/checks a `gs_*` sentinel; health also checks legacy snapshot equality. |

## Existing functionality contract

| Existing capability | Status | Regression strategy |
| --- | --- | --- |
| Home page | PASS — static/additive | `index.html` remains source; AI loads after normal render. |
| Navigation | PASS — static/additive | Existing navigation remains; Ask Scholark is additive. |
| GPA calculators | PASS — static/additive | Deterministic legacy calculations untouched. |
| Weighted GPA | PASS — static/additive | Untouched. |
| Grade-needed calculator | PASS — static/additive | Untouched. |
| College-chance estimator | PASS — static/additive | Untouched legacy tool. AI does not rewrite it. |
| Student-loan calculator | PASS — static/additive | Untouched. |
| SAT/ACT converter | PASS — static/additive | Untouched. |
| GPA Goal Tracker | PASS — static/additive | Untouched. |
| Essay Coach | PASS — automated/static | Legacy analyzer remains; AI enhancement is appended. |
| Saved essays | PASS — static/additive | Existing save/load/delete/sync preserved. |
| SAT/ACT prep | PASS — automated/static | Prep v2 assets/quality audit preserved. |
| AP Study Hub | PASS — automated/static | AP v2 assets/quality audit preserved. |
| College database/comparison | PASS — static/additive | Existing structured UI remains. |
| Scholarship tools | PASS — static/additive | Existing UI remains; AI only promotes verified structured rows. |
| Study planner | PASS — automated/static | Existing planner remains; AI planning is separate/read-only to legacy tasks. |
| Dashboard saved results | PASS — automated/static | Intelligence panel inserts above existing saved-results grid. |
| Profile | PASS — static/additive | No profile mutation. |
| Dark mode | PASS — static/additive | AI CSS uses existing tokens. |
| Mobile navigation / cinematic | PASS — automated branch WebKit gate when latest run is green | Dedicated iPhone-like stress workflow remains active. |
| Community Q&A | PASS — static/additive | No replacement. |
| Existing SEO metadata | PASS — static/additive | Main document/routes remain intact. |
| Existing legal/privacy pages | PASS — static/additive | No removal. |

## New AI behavior

| AI capability | Status | Notes |
| --- | --- | --- |
| Device capability detection | PASS — automated | Algorithm + runtime health. |
| Local runtime abstraction | PASS — automated/static | Pinned WebLLM runtime abstraction. |
| Exact runtime browser import | PASS — automated when latest E2E run is green | `preflightRuntime()` imports WebLLM 0.2.82 without model weights. |
| Model repository/source availability | PASS — automated when latest CI is green | npm + three configured model repositories checked. |
| Real WebGPU model-weight inference | PENDING — WebGPU | Not inferred from bundle/source checks. |
| Primary/smaller model sequence | PASS — static/additive | high → standard → low → deterministic path implemented. |
| Deterministic compatibility fallback | PASS — browser compatibility | Specialists exercised with WebGPU unavailable. |
| No required paid model API | PASS — automated/static | Paid-provider endpoint strings prohibited in AI runtime suite. |
| Ask Scholark routing | PASS — automated/browser | Intent + dialog smoke coverage. |
| AI Tutor | PASS — browser compatibility | Useful deterministic fallback exercised. WebGPU quality run pending. |
| Essay Admissions Reader | PASS — browser compatibility | 13-category deterministic fallback exercised. WebGPU quality run pending. |
| Essay autosave | PASS — implementation | Additive local draft protection. |
| Essay follow-up | PASS — implementation | Current evaluation/excerpt context. |
| Essay version comparison | PASS — automated | Delta logic covered. |
| Shared mastery model | PASS — automated | Evidence behavior covered. |
| SAT evidence bridge | PASS — automated/static | Separate mastery namespace; native store protected. |
| AP evidence bridge | PASS — automated/static | Separate mastery namespace; native store protected. |
| Adaptive-practice recommendation | PASS — automated | Mastery-to-next-practice logic covered. |
| Adaptive-practice session engine | PASS — browser compatibility | Real browser session creation/answer grading executed. |
| Objective practice grading | PASS — browser compatibility | Known-answer item self-grade is tested. |
| Open-ended mastery protection | PASS — browser compatibility | Retrieval prompts are `gradable:false`; no auto mastery. |
| Adaptive-practice UI | PASS — browser compatibility | Desktop/mobile dialog smoke paths. |
| AI Study Planner | PASS — browser compatibility | Deterministic browser plan exercised. |
| SAT Coach | PASS — browser compatibility | Recorded-evidence diagnosis exercised. |
| AP Coach | PASS — browser compatibility | Recorded-evidence diagnosis exercised. |
| College AI | PASS — browser compatibility | Supplied-row grounding exercised. |
| Scholarship AI | PASS — browser compatibility | Supplied-row grounding exercised. |
| Intelligence dashboard | PASS — implementation/static | Additive panel + mastery map. |
| Conversation clear/new session | PASS — implementation | Only AI session state clears. |
| Cancel generation | PASS — implementation | Local-engine interrupt where supported. |
| Runtime health self-test | PASS — browser compatibility | Module/routing/state-safety probes run in page. |
| Reduced-motion support | PASS — implementation | AI CSS includes reduced-motion handling. |
| Keyboard dialog containment | PASS — browser compatibility | Dialog focus smoke paths + focus-loop implementation. |
| Frontend secret scan | PASS — automated when latest run is green | Scanner distinguishes real key shapes from Scholark `sk-*` IDs. |

## Automated workflows

### Scholark regression audit

For relevant PR/push changes it executes:

- JS syntax checks for legacy/AI modules and browser specs;
- repository unit tests;
- Scholark AI algorithm tests;
- SAT market-quality audit;
- AP market-quality audit;
- preservation of key page/AP/SAT assets;
- no accidental paywall copy;
- additive loader contract;
- no paid-provider runtime endpoints;
- legacy essay analyzer preservation;
- bridge/context no native-store writes;
- no unsourced legacy acceptance-rate exposure through the AI context adapter;
- adaptive-practice isolation and non-grading rule;
- runtime health legacy snapshot contract;
- required docs/spec files;
- pinned WebLLM/model source resolution;
- Chromium/Firefox/WebKit desktop browser E2E;
- Chromium/WebKit mobile smoke E2E.

### Mobile WebKit stability

Dedicated iPhone-like WebKit audit enforces:

- mobile loader path;
- lightweight/mobile runtime;
- no eager AP/Test Prep engines;
- no desktop cinematic scene graph;
- opening composition/layout;
- bounded mobile cinematic DOM budget around the verified production baseline;
- sticky scroll behavior/progress;
- bounded logo transform;
- no horizontal overflow;
- four repeated stress-scroll passes per device;
- no relevant page errors.

The workflow preserves diagnostic logs as artifacts even when it fails.

### Secret scan

Frontend source is scanned for private-key blocks and known token/secret shapes. Firebase web configuration is intentionally not treated as a private secret; access must be enforced through Firebase rules/backend controls.

## Branch browser matrix vs production matrix

The branch browser suite gives real compatibility evidence before merge, but it is not equivalent to a post-deploy production audit.

| Environment | Current evidence |
| --- | --- |
| Desktop Chromium branch | Automated E2E configured/executed by regression gate |
| Desktop Firefox branch | Automated E2E configured/executed by regression gate |
| Desktop WebKit branch | Automated E2E configured/executed by regression gate |
| Mobile Chromium branch | Automated smoke configured/executed |
| Mobile WebKit branch | Automated smoke + dedicated iPhone stress audit configured/executed |
| Production GitHub Pages AI build | PENDING — production until merged/deployed |
| Real compatible-device WebGPU inference | PENDING — WebGPU |

## Mandatory deployed checks still pending

Until the AI branch is in production, these remain **PENDING — production**:

- production authentication login/logout;
- existing-account saved-data smoke with non-destructive records;
- live model runtime/weight download/cache behavior;
- live Admissions Reader generative run where WebGPU is available;
- live compatibility fallback;
- live SAT/AP → mastery → adaptive-practice loop;
- live planner adaptation;
- live College/Scholarship grounded flows;
- production console/network audit;
- production broken-link/assets scan;
- production accessibility/keyboard smoke;
- production page-load/performance review;
- live responsive check of key widths/layouts;
- SEO/canonical/sitemap/robots verification;
- GitHub Pages deployment status/build verification.

## Completion rule

A `PENDING` label becomes `PASS` only after the exact applicable environment has executed it. Branch E2E can prove branch browser behavior; it cannot be relabeled as a production pass before deployment.
