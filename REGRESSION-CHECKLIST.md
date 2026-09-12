# Scholark AI Regression Checklist

Branch: `scholark-ai-foundation`

Legend:

- **PASS — static/additive:** repository structure confirms the old capability remains present and the AI layer does not replace it.
- **PASS — automated:** covered by repository automated checks.
- **PENDING — live:** must be verified on the deployed production build before final completion.

This checklist deliberately does not mark production/browser checks as passed before deployment.

## Data-safety contract

| Check | Status | Notes |
| --- | --- | --- |
| No database reset | PASS — static/additive | No destructive database operation introduced. |
| No user-ID/auth migration | PASS — static/additive | Authentication mapping is untouched. |
| No deletion of legacy localStorage | PASS — static/additive | New AI state uses `scholark_ai_v1_` namespace. |
| Existing essay storage preserved | PASS — static/additive | Legacy local/Firebase save/sync remains the primary saved-essay path. |
| Existing SAT progress preserved | PASS — static/additive | AI bridge only reads `gs_prep_v2_*`; it does not overwrite it. |
| Existing AP progress preserved | PASS — static/additive | AI bridge only reads `gs_ap_v2_*`; it does not overwrite it. |
| No destructive schema migration | PASS — static/additive | Foundation adds no Firestore schema migration. |
| Existing accounts preserved | PASS — static/additive | No account mutation code added. |

## Existing functionality contract

| Existing capability | Status | Regression strategy |
| --- | --- | --- |
| Home page | PASS — static/additive | `index.html` remains the source page; AI loads after normal render. |
| Navigation | PASS — static/additive | Existing nav remains; Ask Scholark is an added button. |
| GPA calculators | PASS — static/additive | No AI replacement; calculations remain deterministic. |
| Weighted GPA | PASS — static/additive | Legacy tool untouched. |
| Grade-needed calculator | PASS — static/additive | Legacy tool untouched. |
| College-chance estimator | PASS — static/additive | Legacy tool untouched. |
| Student-loan calculator | PASS — static/additive | Legacy tool untouched. |
| SAT/ACT converter | PASS — static/additive | Legacy tool untouched. |
| GPA Goal Tracker | PASS — static/additive | Legacy deterministic math untouched. |
| Essay Coach | PASS — static/additive | Legacy rubric runs first; expanded reader is appended afterward. |
| Saved essays | PASS — static/additive | Existing save/load/delete/sync functions preserved. |
| SAT/ACT prep | PASS — static/additive | Existing prep v2 module preserved and remains lazy-loaded. |
| AP Study Hub | PASS — static/additive | Existing AP v2 module preserved and remains lazy-loaded. |
| College comparison/database | PASS — static/additive | Structured UI remains; AI is another interface. |
| Scholarship tools | PASS — static/additive | Existing functionality remains; AI assistant requires known rows. |
| Study planner | PASS — static/additive | Existing planner remains. AI planner state is separate. |
| Dashboard saved results | PASS — static/additive | Intelligence panel inserts above, not instead of, the existing grid. |
| Profile | PASS — static/additive | No profile mutation. |
| Dark mode | PASS — static/additive | AI CSS uses existing theme tokens. |
| Mobile navigation | PENDING — live | Requires deployed-device/viewport audit. |
| Community Q&A | PASS — static/additive | No replacement. |
| Existing SEO metadata | PASS — static/additive | Main document metadata/routes are not converted to client-only AI pages. |
| Existing legal/privacy pages | PASS — static/additive | No removal. |

## New AI behavior

| AI capability | Status | Notes |
| --- | --- | --- |
| Device capability detection | PASS — automated | Covered by algorithm tests. |
| Local runtime abstraction | PASS — static/additive | Lazy WebLLM runtime with swappable manifest. |
| Primary/smaller model sequence | PASS — static/additive | Tier sequence implemented. |
| Deterministic compatibility fallback | PASS — automated/static | Core algorithms + agent fallbacks. |
| No required paid model API | PASS — automated/static | CI scans for major paid-provider endpoint strings in core. |
| Ask Scholark routing | PASS — automated | Intent routing tests. |
| AI Tutor | PASS — implementation | Browser/model quality verification pending. |
| Essay Admissions Reader | PASS — implementation | Structured rubric/fallback implemented; browser model quality pending. |
| Essay autosave | PASS — implementation | Local autosave/restore added without removing saved essays. |
| Essay follow-up | PASS — implementation | Uses current evaluation and excerpt. |
| Essay version comparison | PASS — automated | Delta logic is covered. |
| Shared mastery model | PASS — automated | Mastery update behavior covered. |
| SAT evidence bridge | PASS — implementation | Read-only source bridge with duplicate fingerprints. |
| AP evidence bridge | PASS — implementation | Read-only source bridge with duplicate fingerprints. |
| Adaptive-practice recommendation | PASS — automated | Persistent misses route to prerequisite review. |
| AI Study Planner | PASS — automated | Deadline prioritization and budget constraints covered. |
| SAT Coach | PASS — implementation | Uses actual recorded evidence; live flow pending. |
| AP Coach | PASS — implementation | Uses actual subject/unit evidence; live flow pending. |
| College AI | PASS — implementation | Grounded only in supplied rows; live data adapter quality pending. |
| Scholarship AI | PASS — implementation | Grounded only in supplied rows; live data adapter quality pending. |
| Intelligence dashboard | PASS — implementation | Additive panel + mastery map. |
| Conversation clear/new session | PASS — implementation | Clears only AI session state. |
| Cancel generation | PASS — implementation | Runtime calls local-engine interrupt when supported. |
| Reduced-motion support | PASS — implementation | AI CSS respects `prefers-reduced-motion`. |
| Keyboard dialog containment | PASS — implementation | Tab focus loop + Escape close. |

## Automated regression workflow

The GitHub workflow now runs for relevant pull requests and pushes instead of only when the workflow file itself changes.

Automated checks include:

- JavaScript syntax for legacy and AI modules;
- repository Node tests;
- Scholark AI algorithm tests;
- SAT market-quality audit;
- AP market-quality audit;
- preservation of key main-page/AP/SAT assets;
- absence of accidental paywall copy;
- additive AI-loader contract;
- absence of configured paid AI endpoint strings in the core runtime;
- continued presence of the legacy essay analyzer.

## Mandatory deployed checks still pending

These are **not passed yet** and must remain pending until the branch is merged/deployed and tested on the actual production site:

- production authentication login/logout;
- production saved-user data smoke test with existing records;
- production model download and cache behavior;
- production Essay Reader generative run;
- production fallback with WebGPU disabled;
- production SAT/AP-to-mastery closed loop;
- production planner adaptation;
- production College/Scholarship grounded flows;
- production console audit;
- production network audit;
- production broken-link scan;
- production accessibility scan/manual keyboard check;
- production page-load/performance audit;
- iOS browser behavior;
- Android browser behavior;
- Firefox compatibility behavior;
- Safari compatibility behavior;
- 320/375/390/430/tablet/laptop/1440/ultrawide responsive pass;
- SEO/canonical/sitemap/robots verification after deploy.

## Completion rule

Do not replace a `PENDING — live` label with `PASS` based on implementation intent. It must be supported by execution against the deployed environment.
