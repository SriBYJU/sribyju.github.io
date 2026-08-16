# SAT/ACT release benchmark

Reviewed: 2026-08-15

This is an engineering benchmark, not an independent effectiveness study. The local `98.13/100` release-gate result measures the checked criteria in `prep-quality-audit.js`; it does not mean Scholark has been externally proven to outperform another platform or to raise an official score by a particular amount.

## Public Acely comparison

Acely's public SAT and pricing pages currently advertise adaptive study plans, diagnostics, score predictions, progress and pacing reports, an AI tutor, 9,000 SAT questions, 30 SAT practice tests, 20 ACT practice tests, answer elimination, bookmarks, Desmos, and paid score-improvement terms:

- https://acely.com/sat-prep
- https://acely.com/pricing?format=all
- https://acely.com/score-improvement-guarantee

| Capability | Scholark release | Honest comparison |
| --- | --- | --- |
| Personalized plan | Goal, test date, mastery, recency, confidence, and pacing drive prioritized work | Comparable core workflow; no claim of matching Acely's private algorithm |
| Diagnostics and reassessment | Short adaptive diagnostics, official-size simulations, fresh reassessment prompts, and an interactive score-history range | Comparable workflow; Scholark ranges are explicitly independent and non-official |
| Adaptive SAT simulation | Performance-routed second modules with official-size/timed structure | Covers the central digital-SAT behavior |
| ACT simulation | Enhanced core timing plus optional Science, with aligned English, Reading, and experiment sets | Covers current public ACT structure |
| Practice depth | 5,963 original validated SAT/ACT questions; 15 ACT Reading forms, 26 ACT English forms, and 130 Science experiment sets | Below Acely's advertised 14,000 combined questions and 50 tests; Scholark prioritizes audited original generation and free access |
| Review tools | Explanations, mistake replay, answer elimination, flags, scratch notes, confidence checks, keyboard shortcuts, and a question map | Strong feature coverage; no paid AI tutor |
| Calculator learning | SAT-style graphing workspace, Desmos course material, and a direct official Desmos link | Useful no-key alternative; not the embedded proprietary Desmos testing component |
| Analytics | Topic mastery, error types, pacing, confidence calibration, item metrics, progress ranges, goal gaps, and review scheduling | Comparable breadth with added metacognitive signals |
| Cost and privacy | Free to signed-in users; no browser AI key | Clear differentiator; no score-improvement guarantee |

## Five focused differentiators

1. Confidence calibration identifies confident mistakes instead of tracking accuracy alone.
2. Misconception Replay serves a fresh transfer question after a saved error.
3. Evidence ranges show score uncertainty instead of presenting a false-precision prediction.
4. A deterministic verifier recomputes every eligible generated math answer before release.
5. Item quarantine can remove weak questions from selection after enough aggregate, privacy-safe evidence.

## Remaining evidence gap

Without teachers, paid reviewers, or a recruited test group, the closest defensible release standard is official-public blueprint alignment, deterministic answer verification, automated cue/ambiguity audits, realistic browser simulations, and uncertainty-aware scoring priors. Operational SAT/ACT item parameters and equating algorithms are private, so official Bluebook and ACT practice should remain the final calibration check for a student.
