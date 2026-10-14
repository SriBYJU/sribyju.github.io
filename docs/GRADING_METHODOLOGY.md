# How Scholark grades activities and essays

These are educational heuristics. They are not official university grades, trained admissions predictions, or rankings of a person’s worth. No admitted-student dataset was used to estimate admission outcomes.

## Activities

The rubric weighs reported impact (30), external validation/selectivity (25), initiative (20), sustained engagement (15), and evidence specificity (10). Context is recorded without an automatic point bonus. Missing time information is reported separately from contribution quality. The weights are Scholark design choices, not measured admissions preferences.

Scores indicate described evidence: Tier 1 85–100; Tier 2 65–84; Tier 3 40–64; Tier 4 15–39. Insufficient detail produces a request for evidence. A prestigious employer name alone earns no bonus. Actual contribution, external adoption, research tasks, responsibility and outcomes matter. Shadowing is distinguished from doing research, sponsorship from athletic recruitment, and provisional filing from a granted patent. Awards need level and identifying detail. Planned or explicitly negated roles are excluded where the language parser recognizes them. Free-text parsing remains imperfect and cannot verify truth.

Paid work and caregiving receive credit for responsibility and sustained commitment without requiring prestige or a competition award. Context never guarantees an admission advantage. Opportunity context does not automatically increase a score.

References are **editorial composites**, systematically generated from category ladders and domains. BM25 retrieves textually similar examples; it does not compare a student with real accepted applicants. A 1,204-entry library is broad coverage, not 1,204 independent sources of admissions evidence. Named opportunities have linked official sources; the score mapping itself is Scholark’s judgment.

Portfolio scores require at least three described activities. The three strongest described contributions receive weights 50%, 30%, and 20%. Additional hobbies do not dilute this summary. Shape labels describe category concentration, not admissions desirability. This summary is an explicit heuristic, not a calibrated comparison with admitted applicants. Bulk import preserves full supplied evidence in notes, proposes descriptions within 150 characters, and lets the writer review selection before adding up to ten cards.

## Essay Coach

Essay Studio adds a separate model-generated review: purpose 20%, insight 25%, personal evidence 25%, voice 20%, and clarity 10%. Five 0–4 judgments produce a score out of 100. The model selects numbered draft passages; the application inserts the exact original words. Invalid output produces an explicit retry message, never a rule score labeled as AI. Each accepted review offers passage feedback, an essay-only side conversation, and on-demand two-option edits with individual Apply and Undo controls. Editing the draft or prompt invalidates the review. See [AI reader research](ESSAY_AI_RESEARCH.md) for evidence and limitations.

The following describes the separate offline rule checker.

39 local rules flag craft patterns and quote exact student passages. They include seven strength checks. Comments are hypotheses for the writer to inspect; passive voice, a familiar topic, short paragraphs, or an abstract opening are not automatically bad writing.

Four subscores produce the overall writing score: Impact 30%, Voice 25%, Structure 25%, Clarity 20%. The implementation uses concrete-word cues, reflection markers, paragraph structure, repeated language, and mechanics. Very short drafts and drafts built mostly from repeated sentences are capped; 90+ requires additional evidence. The 12 synthetic calibration drafts check relative ordering, not agreement with real admissions officers. English-language pattern lists are limited, especially for unconventional or multilingual writing.

The engine never produces whole-essay replacement prose. It offers techniques, questions, and red grammar / blue editorial annotations anchored to exact text. When the draft supplies enough detail, a passage action offers two short alternatives for the student to compare, apply individually, or dismiss. An undo action cannot overwrite subsequent manual edits. A passage is limited to 80 words / 600 characters and must be shorter than the whole draft. If two grounded edits cannot be produced, the coach asks for a true detail instead of inventing one.

Optional on-device alternatives are checked for length, unsupported vocabulary, numbers, qualifications, and action ordering. Rejected model output retains the labeled local options. These checks reduce fabrication but cannot prove semantic equivalence: students must review the meaning and voice of every suggestion.

Prompt-specific review covers all seven current Common App prompts, including gratitude for prompt 4, plus supplemental essay types. It links to seven published Johns Hopkins essays and Yale guidance using original, short craft summaries; it does not copy essays or claim those essays caused admission. Prompt mappings are editorial, not assertions about which application prompt the published author chose. Quoted draft matches are labeled possible evidence, not automatic proof of depth.

Run Rubric Feedback populates the expanded reader immediately without a model download. Add on-device reader notes is optional. The reader's separate 13-dimension rubric uses a 10-point scale; College Chances can take the current 100-point AI review or the explicitly labeled offline score, with the grading method recorded. Neither scale is validated against admissions officers. Editing the draft or prompt invalidates the expanded review, and late model responses cannot replace feedback for a newer draft.

## College Chances

The stored overall acceptance rate anchors log-odds. Bounded academic, rank, activity, essay, and rigor adjustments create a planning range. At rates ≤10%, the model cap is 25%; other selectivity bands have documented caps of 55%, 80%, 95%, and 98% in `chances-model.js`. These caps are conservative modeling choices, not empirical confidence bounds.

Missing test, GPA, activity, or essay inputs widen the range. Where school-specific test ranges are absent, the model uses an explicitly disclosed broad band assumption. Invalid acceptance rates and inverted school SAT percentile ranges are rejected. At a cap, the displayed range retains at least a small width to avoid implying certainty. ACT is approximated for this heuristic, not presented as an official concordance. No automatic ED, legacy, residency, or major multiplier is applied without school-specific evidence. Competitive majors receive a caution.

Improvement examples are sensitivity calculations inside the model. They do not establish that improving a score causes a specific change in real admission odds. Recommendations, interviews, institutional needs, application context, and many other factors are unknown. Consult a counselor and keep a balanced college list.

## Public guidance informing the design

- [Common App activity-field guidance](https://www.commonapp.org/files/FY-Apply-College-Activities-Section-Common-App.pdf): concise descriptions and separate responsibility/time fields. Limits are enforced conservatively with browser-compatible string lengths.
- [Johns Hopkins review criteria](https://apply.jhu.edu/how-to-apply/what-we-look-for/): contribution, initiative, academic character, and context across school, work, and family.
- [Johns Hopkins Essays That Worked](https://apply.jhu.edu/college-planning-guide/essays-that-worked/): everyday experiences can reveal perspective; no published essays are copied into Scholark.
- [Yale essay guidance](https://admissions.yale.edu/essays): the applicant’s own voice and meaningful experience.

Rubrics: activities-2.0, reader-ai-1.0, essay-rules-1.1, planning-odds-2.0. Reference library v1. Methodology updated October 14, 2026.
