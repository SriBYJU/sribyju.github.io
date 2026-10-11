# Activity reference library v1

`admissions/library_v1.json` contains 1,204 editorial composite references: 25 categories × 8 domains × 6 ordered rungs, plus four named opportunity references. The categories include paid work and caregiving. Those ladders describe increasing responsibility and sustained outcomes; they do not require competition prestige.

This library contains no real student records and no admission outcomes. Tiers and scores are explicit heuristic anchors, not measured university preferences. Source notes distinguish official program identity from Scholark’s own score mapping. The employer gazetteer confirms organization identity only, not a claimed internship, an acceptance rate, or an admissions advantage.

Regenerate: `node scripts/build-activity-library.mjs`.
Validate and calibrate: `node scripts/test-admissions.mjs`.

To extend: add a category/domain or a carefully ordered ladder in the generator. Named opportunities require an official source, dated review, and `verified: true`; exclude unverified opportunities. Keep stable IDs. Add positive, negative, and neighboring-rung tests, regenerate, and increment the version when changing score interpretation. Never label composites as profiles of admitted students.
