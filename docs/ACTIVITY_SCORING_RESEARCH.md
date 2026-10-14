# Activity review: evidence and limits

Updated October 14, 2026. Rubric `activities-2.0`.

## Public evidence

- [Yale admissions officers on the activities section](https://admissions.yale.edu/posts/2021-07-08-episode-19-the-activities-section) describe commitment, contribution and context across work, family, sport and other activities. Their internal rating is shorthand for holistic review, not a published points formula for particular activities. Scholark does not reproduce or claim calibration to that rating.
- [Johns Hopkins review criteria](https://apply.jhu.edu/how-to-apply/what-we-look-for/) emphasize academic character, impact, initiative and the student's role in their communities.
- [Johns Hopkins activities guidance](https://apply.jhu.edu/hopkins-insider/how-to-build-a-strong-activities-list-for-your-college-application/) informs attention to responsibility and meaningful contribution rather than an impressive organization name alone.
- [Common App field guidance](https://www.commonapp.org/files/FY-Apply-College-Activities-Section-Common-App.pdf) supports concise descriptions with separate fields for role, organization and time.

No credible source above publishes an activity-to-admission conversion table. The numerical weights and thresholds are original product judgments, not a research-validated admissions scale. No private applicant records or fabricated admitted-student profiles are used.

## What changed

The earlier keyword rules missed substantive research evaluation, authored analysis, external adoption, invention and sustained sport. Bulk parsing could also treat broken table headings and separators as activities, losing evidence before scoring. The revised parser recognizes these formats, keeps the full source description in notes, and previews editable short titles and descriptions before importing.

The rubric allocates 30 points to contribution and impact, 25 to external validation, 20 to initiative, 15 to sustained engagement, and 10 to specificity. Contribution is evaluated from the supplied description and retained notes. Missing time data produces a follow-up question and a lower completeness measure, rather than assuming no engagement. Repeated evidence does not count as extra years. Opportunity context does not add an automatic bonus.

A named laboratory is not itself proof of original research; shadowing is different from hands-on contribution. A provisional patent filing is not a granted patent. Brand sponsorship is not proof of competitive ranking or athletic recruitment. These distinctions prevent polish and prestige from substituting for described work.

Portfolio feedback requires at least three described activities and summarizes the strongest three with weights 50%, 30%, and 20%. Additional hobbies and responsibilities do not dilute that summary. This is a transparent planning heuristic; a higher number does not establish higher admission odds. Per-activity uncertainty ranges are illustrative, not statistical confidence intervals.

## Verification and residual limits

Engine regressions cover meaningful contribution versus prestigious name alone, planned and negated claims, research versus shadowing, distinct patent claims, sponsorship, repeated duration evidence, broken tables, more than ten activities, preview preservation and portfolio dilution. Browser tests exercise the actual import controls, editable titles, 150-character limits, retained notes and safe rendering.

Free-text rules cannot verify truth or capture every meaningful contribution. Specific descriptions can still be misclassified. Scores are accompanied by dimension evidence, completeness and questions so a writer can inspect why a result occurred. Human counseling remains valuable for context and selection; no score should be used as a verdict on a student's worth.
