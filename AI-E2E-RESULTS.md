# Scholark AI E2E Results

Current status: **LIVE PRODUCTION E2E PASSED.**

Production URL: `https://sribyju.github.io/`

Audited product release: `c33e0ae937a422cccc2a3c6533dfe71cdeefadcc`

Current `main` immediately after release automation: `75238cf048c7a58c37edeac1faab44c3f66c5af2` (a direct child that only updates the existing ScholarK V4 audit report).

## Authoritative release evidence

| Evidence | Result |
| --- | --- |
| Production AI audit run | `34728562301` — **SUCCESS** |
| Production audit job | `103647038631` — **SUCCESS** |
| Post-merge regression | `34728562296` — **SUCCESS** |
| Post-merge mobile WebKit stability | `34728562277` — **SUCCESS** |
| ScholarK V4 audit | `34728562303` — **SUCCESS** |
| Replacement Pages deployment for current main | `34728572875` — **SUCCESS** |
| Live Playwright result | **28 passed, 0 failed** |

The first Pages run for `c33e0ae...` was superseded/cancelled when the existing V4 audit bot immediately produced the report-only child commit. The replacement Pages deployment for that child succeeded. Separately, the production AI audit did not rely on the Pages badge alone: it polled the public site until the exact `ai-107`/reliability/SEO release was visible and only then ran browser tests.

## Production HTTP/network/SEO evidence

The live audit detected the release on attempt 9 and verified HTTP 200 for:

- `index.html`;
- `scholark-feature-loader.js`;
- `scholark-ai-algorithms.js`;
- `scholark-ai-core.js`;
- `scholark-ai-agents.js`;
- `scholark-ai-context.js`;
- `scholark-ai-reliability.js`;
- `scholark-ai-bridge.js`;
- `scholark-ai-dashboard.js`;
- `scholark-ai-ui.js`;
- `scholark-ai-ui-polish.js`;
- `scholark-ai-practice.js`;
- `scholark-ai-practice-ui.js`;
- `scholark-ai-health.js`;
- `scholark-ai.css`;
- `scholark-ai-dashboard.css`;
- `scholark-ai-practice.css`;
- `robots.txt`;
- `sitemap.xml`.

Additional live assertions:

- canonical tags: **1**;
- production URL: `https://sribyju.github.io/`;
- audited git SHA: `c33e0ae937a422cccc2a3c6533dfe71cdeefadcc`;
- configured paid inference endpoints found: **0**;
- production HTTP/network/SEO/reliability audit: **PASS**.

## Live browser engines

The production workflow used Playwright 1.63.0 with:

- Chromium / Chrome for Testing 153.0.8010.12;
- Firefox 155.0;
- WebKit 26.6.

`SCHOLARK_BASE_URL` and `SCHOLARK_PRODUCTION_URL` were both set to the public production URL, so this was not a localhost/preview run.

## 28 live production tests

### Chromium desktop — 12 tests

1. AI loads additively, runtime health passes, and legacy state remains unchanged.
2. Desktop S cinematic is built before the AI shell starts.
3. Pinned WebLLM 0.2.82 browser bundle imports without downloading model weights.
4. Scholark product questions use grounded product knowledge instead of generic tutoring fallback.
5. All specialists return useful compatibility-mode results with WebGPU unavailable.
6. Adaptive practice grades verified objective items and never auto-grades open-ended retrieval.
7. Ask Scholark routes creator questions correctly and practice dialogs stay keyboard-accessible.
8. `ai-107` boot is bounded, cinematic-first, and event-loop responsive.
9. AI UI polish settles after mutations instead of creating a mutation storm.
10. Essay autosave persists in the AI namespace without modifying legacy state.
11. New conversation and cancel-generation affect only AI state.
12. Reduced-motion preference disables AI pulse animation and quick-action transitions.

### Firefox desktop — 7 tests

13. Additive load / state preservation / runtime health.
14. S cinematic before AI shell.
15. Pinned WebLLM runtime preflight.
16. Grounded Scholark product knowledge.
17. All specialist compatibility-mode paths.
18. Adaptive practice objective/non-objective grading rules.
19. Creator routing and keyboard-accessible dialogs.

### WebKit desktop — 7 tests

20. Additive load / state preservation / runtime health.
21. S cinematic before AI shell.
22. Pinned WebLLM runtime preflight.
23. Grounded Scholark product knowledge.
24. All specialist compatibility-mode paths.
25. Adaptive practice objective/non-objective grading rules.
26. Creator routing and keyboard-accessible dialogs.

### Mobile — 2 tests

27. Android-class Chromium: mobile fallback runtime, dialogs, and adaptive practice remain usable.
28. iPhone-class WebKit: mobile fallback runtime, dialogs, and adaptive practice remain usable.

Result: **28 passed in approximately 2 minutes**.

## What “all specialists” covers

The live compatibility test exercises useful results for the production specialist system, including:

- Tutor;
- thirteen-category Admissions Reader;
- Study Planner;
- SAT Coach;
- AP Coach;
- College AI;
- Scholarship AI;
- Ask Scholark routing/mastery-connected behavior.

The production code also exports essay follow-up/history/version comparison and planner/SAT/AP adaptation/ingestion APIs.

## Reliability recovery added in `ai-107`

The recovery layer adds:

- stronger device capability selection;
- Qwen local model retries;
- independent `Llama-3.2-1B-Instruct-q4f16_1-MLC` rescue;
- weak-response detection/retry;
- deterministic fallback as final path;
- grounded product facts, including the correct Scholark creator response;
- bounded cinematic wait plus independent AI boot watchdog;
- idempotent/frame-coalesced UI mutation work.

The live E2E proves the integration, compatibility behavior, product routing, bounded boot, and mutation fix. It does **not** imply that CI physically downloaded and generated with every local model.

## Adaptive-practice E2E

Browser tests create a supported objective session, submit a known correct answer, and require objective grading/mastery behavior. They separately create an unknown/open-ended retrieval prompt and require:

- `gradable === false`;
- no objective correctness result;
- no automatic mastery increase.

This prevents unverified free-response text from becoming progress evidence.

## State-safety E2E

The production suite requires `ScholarkAIHealth.run()` to pass and uses legacy local-storage sentinels to detect unintended mutations.

Hardening tests additionally prove:

- essay autosave writes to AI state rather than the planted legacy sentinel;
- clearing a conversation clears only AI session state;
- generation cancellation does not wipe unrelated Scholark data;
- UI mutation observation reaches quiescence.

This is browser-local state evidence, not a claim that a real authenticated Firebase account was mutated during CI.

## Cinematic/mobile evidence

The original S cinematic remains outside the AI replacement boundary. Production browser tests prove desktop cinematic construction occurs before AI attachment.

A separate post-merge iPhone-like WebKit stress workflow (`34728562277`) also passed. It retains repeated stress scrolling, mobile runtime/loader checks, opening composition, bounded transforms, no horizontal overflow, and relevant page-error checks.

## Dependency/security evidence

The hostile release review discovered that the email tooling lock still contained vulnerable Nodemailer 9.0.5. The release upgraded the manifest to the 10.x line and the audited lock resolved **Nodemailer 10.0.9**.

Permanent gates now include:

- frontend secret scan;
- `npm audit --omit=dev --audit-level=high` in the Scholark regression;
- explicit patched Nodemailer verification;
- dependency audit before weekly email sends.

During the production audit, `npm ci` reported **0 vulnerabilities**, and the temporary Playwright install audit also reported **0 vulnerabilities**.

Transitive deprecation warnings are not counted as security vulnerabilities when npm audit reports zero; they can be modernized separately without weakening release evidence.

## Production artifact

The production audit preserved evidence as:

- artifact name: `scholark-production-ai-audit-c33e0ae937a422cccc2a3c6533dfe71cdeefadcc`;
- artifact ID: `10308421825`;
- files: 28;
- size: 225217 bytes;
- SHA-256: `9b3772fc866ecf26c668c5cb6f9b75f08e90b92084b16c9a8ac2c455733ed610`;
- workflow retention: 14 days.

## Explicit non-passes / evidence boundaries

The following remain **NOT EXECUTED** and must not be inferred from the green production suite:

| Check | Status |
| --- | --- |
| Real compatible-device WebGPU weight download + actual generation | NOT EXECUTED — physical hardware |
| Real Qwen -> Llama rescue after injected GPU/model failure | NOT EXECUTED — physical hardware |
| GPU device-loss / OOM recovery | NOT EXECUTED — physical hardware |
| Offline-after-cache with downloaded model weights | NOT EXECUTED |
| Interrupted first model download | NOT EXECUTED |
| Authorized real existing-user Firebase login/save/delete/sync journey | NOT EXECUTED — account credentials |
| Manual screen-reader pass | NOT EXECUTED — manual |
| Formal Lighthouse performance audit | NOT EXECUTED |
| Exhaustive crawler of all dynamic links/states | NOT EXECUTED |

## Final E2E conclusion

The production release itself is no longer “branch-only” or “pending production.” The public site has been release-detected, HTTP/SEO/runtime-audited, dependency-audited, and exercised through **28/28 live browser tests** plus the separate post-merge iPhone WebKit stress gate.

The remaining non-passes are narrower hardware/account/manual/performance evidence boundaries and are intentionally recorded rather than hidden behind the overall green release.
