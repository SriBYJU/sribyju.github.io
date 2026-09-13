# Scholark AI Regression Checklist

Release status: **PRODUCTION-AUDITED**

Audited product release: `c33e0ae937a422cccc2a3c6533dfe71cdeefadcc`

Current main after the existing V4 audit bot's report-only child commit: `75238cf048c7a58c37edeac1faab44c3f66c5af2`

Legend:

- **PASS — live production:** executed against `https://sribyju.github.io/`.
- **PASS — automated:** executed in CI/browser/unit automation.
- **PASS — static/additive:** repository comparison proves the existing capability was preserved; not claimed as a full interactive user journey.
- **NOT EXECUTED — hardware:** needs physical WebGPU/model-weight execution.
- **NOT EXECUTED — account:** needs authorized real test-account credentials/data.
- **NOT EXECUTED — manual:** requires a manual/human evaluation environment.

Implementation intent alone is not execution evidence.

## Release/deployment contract

| Check | Status | Evidence |
| --- | --- | --- |
| Product release merged | PASS — automated | PR #43 merged as `c33e0ae...`. |
| GitHub Pages current-main deployment | PASS — production | Replacement Pages run `34728572875` succeeded for audit-only child `75238cf...`. |
| Production release detection | PASS — live production | Live audit detected `ai-107`/SEO/reliability release after propagation. |
| Required AI assets | PASS — live production | Loader, algorithms, core, agents, context, reliability, bridge, dashboard, UI, UI polish, practice, health and CSS all returned 200. |
| `robots.txt` | PASS — live production | HTTP 200 and release contract verified. |
| `sitemap.xml` | PASS — live production | HTTP 200 and release contract verified. |
| Canonical tag | PASS — live production | Exactly one canonical tag. |
| No configured paid inference endpoint | PASS — live production | Production runtime scan clear. |
| Live cross-browser suite | PASS — live production | 28/28 passed. |

## Data-safety contract

| Check | Status | Notes |
| --- | --- | --- |
| No database reset introduced | PASS — static/additive | No destructive DB operation added by AI release. |
| No user-ID/auth migration | PASS — static/additive | Authentication mapping untouched. |
| No deletion of legacy localStorage | PASS — live production | Health + browser sentinel prove tested legacy values survive AI probes. |
| Existing essay storage preserved | PASS — static/additive | Legacy local/Firebase paths remain; AI autosave is additive. |
| Existing SAT progress preserved | PASS — automated/static | Bridge cannot write native prep keys. |
| Existing AP progress preserved | PASS — automated/static | Bridge cannot write native AP keys. |
| Existing planner/apps preserved | PASS — automated/static | Context reads `gs_tasks_*` / `gs_apps_*` without writing them. |
| No destructive Firestore migration | PASS — static/additive | None added. |
| Existing accounts preserved by release code | PASS — static/additive | No account mutation/migration added. |
| Real existing-account save/delete/sync E2E | NOT EXECUTED — account | No authorized test credentials were used. |
| AI autosave isolated from legacy state | PASS — live production | Chromium hardening test. |
| New conversation/cancel clears only AI state | PASS — live production | Chromium hardening test. |

## Existing functionality preservation

| Existing capability | Status | Regression strategy |
| --- | --- | --- |
| Home/navigation | PASS — static/additive | Existing document/nav retained; AI is additive. |
| GPA calculators | PASS — static/additive | Existing deterministic code untouched. |
| Weighted GPA / grade-needed | PASS — static/additive | Existing deterministic code untouched. |
| College-chance estimator | PASS — static/additive | Legacy tool remains independent. |
| Student-loan calculator | PASS — static/additive | Existing implementation retained. |
| SAT/ACT converter | PASS — static/additive | Existing implementation retained. |
| GPA Goal Tracker | PASS — static/additive | Existing implementation retained. |
| Legacy Essay Coach | PASS — automated/static | Legacy analyzer presence enforced by regression contract. |
| Saved essays | PASS — static/additive | Existing save/load/sync paths not rewritten. |
| SAT/ACT prep | PASS — automated/static | Prep assets + SAT quality audit green. |
| AP Study Hub | PASS — automated/static | AP assets + AP quality audit green. |
| College comparison/database | PASS — static/additive | Existing structured UI retained. |
| Scholarship tools | PASS — static/additive | Existing UI retained. |
| Study planner | PASS — automated/static | Existing store retained; AI context read-only. |
| Dashboard saved results | PASS — automated/static | AI panel inserts above existing grid. |
| Profile/dark mode/community/legal pages | PASS — static/additive | No replacement/removal by AI release. |
| Desktop S cinematic before AI | PASS — live production | Chromium/Firefox/WebKit core suite verifies ordering. |
| Mobile cinematic/stability | PASS — automated | Post-merge dedicated WebKit run `34728562277` succeeded. |

## AI capability contract

| AI capability | Status | Notes |
| --- | --- | --- |
| Device capability detection | PASS — automated/live integration | Health + startup tests. |
| Local runtime abstraction | PASS — automated | WebLLM 0.2.82 pinned. |
| Exact runtime browser import | PASS — live production | `preflightRuntime()` imports bundle without weights. |
| Model/source availability | PASS — automated | Release workflow checks configured sources. |
| Physical WebGPU model-weight inference | NOT EXECUTED — hardware | Runtime import is not inference. |
| Qwen retry/recovery architecture | PASS — automated/static | Reliability layer installed and integrated. |
| Independent Llama rescue model | PASS — automated/static | `Llama-3.2-1B-Instruct-q4f16_1-MLC` configured. Physical inference still hardware-bound. |
| Deterministic compatibility fallback | PASS — live production | All specialists exercised with WebGPU unavailable. |
| No required paid model API | PASS — live production | Deployed runtime endpoint scan clear. |
| Ask Scholark routing | PASS — live production | Routing/dialog and creator-question path executed. |
| Grounded Scholark product/about answers | PASS — live production | Creator question tested. |
| Tutor | PASS — live production compatibility | Useful fallback path executed. |
| Essay Admissions Reader | PASS — live production compatibility | Thirteen-category path executed. |
| Essay autosave | PASS — live production | Namespaced persistence test executed. |
| Essay follow-up API | PASS — automated/static | Export/integration present; full generative physical-GPU quality remains hardware-bound. |
| Essay version comparison | PASS — automated | Deterministic delta logic covered. |
| Shared mastery | PASS — automated | Evidence behavior covered. |
| SAT/AP evidence bridges | PASS — automated/static | Separate namespace; native stores protected. |
| Adaptive recommendation | PASS — automated | Mastery-to-next-practice logic. |
| Adaptive session engine | PASS — live production | Session creation/grading executed. |
| Objective practice grading | PASS — live production | Known-answer grading executed. |
| Open-ended mastery protection | PASS — live production | `gradable:false`; no auto mastery. |
| Adaptive-practice UI | PASS — live production | Dialog/mobile smoke paths. |
| Study Planner | PASS — live production compatibility | Deterministic plan path executed. |
| SAT Coach | PASS — live production compatibility | Recorded-evidence diagnosis executed. |
| AP Coach | PASS — live production compatibility | Recorded-evidence diagnosis executed. |
| College AI | PASS — live production compatibility | Supplied-row grounding executed. |
| Scholarship AI | PASS — live production compatibility | Supplied-row grounding executed. |
| Runtime health | PASS — live production | Browser health report required. |
| Event-loop responsiveness / bounded AI boot | PASS — live production | `ai-107` hardening test. |
| UI mutation quiescence | PASS — live production | Mutation storm regression test. |
| Reduced motion | PASS — live production | Chromium hardening test. |
| Keyboard dialog containment | PASS — live production | Ask/practice dialog path executed across desktop engines. |
| Manual screen-reader evaluation | NOT EXECUTED — manual | Automation is not a screen-reader pass. |

## Security/dependency contract

| Check | Status | Notes |
| --- | --- | --- |
| Frontend secret scan | PASS — automated | Post-merge gate green. |
| High/critical production npm advisory gate | PASS — automated | `npm audit --omit=dev --audit-level=high`. |
| Nodemailer vulnerable 9.x removed | PASS — automated | Audited lock resolves 10.0.9. |
| Production-audit npm install | PASS — automated | 0 vulnerabilities reported. |
| Weekly email blocks on high advisory | PASS — static/CI contract | Audit step runs before send action. |

## Browser matrix

| Environment | Status |
| --- | --- |
| Chromium desktop production | PASS — live production |
| Firefox desktop production | PASS — live production |
| WebKit desktop production | PASS — live production |
| Android-class Chromium production | PASS — live production |
| iPhone-class WebKit production | PASS — live production |
| Dedicated iPhone WebKit stress workflow | PASS — automated post-merge |
| Physical WebGPU model inference | NOT EXECUTED — hardware |

## Live production audit details

Production audit run `34728562301` executed against the public URL and passed:

- release propagation detection;
- HTTP/network/SEO/reliability contract;
- required assets 200;
- canonical count 1;
- no paid inference endpoint;
- Chromium/Firefox/WebKit desktop;
- Android-class Chromium mobile;
- iPhone-class WebKit mobile;
- 28/28 total Playwright tests.

Post-merge regression run `34728562296`, mobile WebKit run `34728562277`, and V4 audit run `34728562303` also succeeded.

## Checks deliberately still open

These are not hidden failures; they require environments not used by the automated release suite:

- real Qwen/Llama/SmolLM weight download + generation on physical WebGPU;
- injected physical-GPU loss/OOM and real multi-model failover;
- offline-after-cache with real model weights;
- authorized real existing-user Firebase login/save/delete/sync journey;
- manual screen-reader pass;
- formal Lighthouse/performance scoring;
- exhaustive crawler of every possible dynamic link/state combination.

## Completion rule

A check becomes PASS only when the stated environment actually executes it. Production browser evidence can prove production browser behavior; it does not retroactively prove physical-GPU generation, real-account mutation safety, or manual accessibility/performance work.
