# AP crash-course and progress audit — October 17, 2026

## Changes

- Expanded all 145 review units across 23 courses to 599 combined concept entries. Each unit has additional teaching, misconception notes, an original worked example, and an independent retrieval check.
- Added topic checklists, saved unit notes and retrieval drafts, topic links, previous/next navigation, and responsive lesson columns.
- Untouched courses begin at 0%. Reviewed topics, distinct questions submitted, and answer accuracy are separate measures. Opening a lesson or revealing an answer earns no credit.
- Readiness no longer copies MCQ performance into missing written evidence or gives an untouched student an estimated exam score.
- Normalized legacy empty 50% rows and obsolete unit rows; preserved genuine recorded attempts. Protected AP state and delayed cloud operations across account changes.
- Aligned Statistics review groups to the revised five-unit 2027 outline. Prior Statistics notes/progress remain available as a download instead of being assigned to different topics.
- Corrected AP U.S. History period grouping and an incorrect differentiability explanation. Broadened the grouped BC foundations with shared AB review material.
- Fixed AP navigation calling its initializer before the lazy-loaded scripts exist.

## Verification

- All 196 Node tests pass, including content coverage, unit alignment, complete question records, and AI/essay/activity regression checks.
- Chrome: 11/11 AP browser scenarios passed, plus a successful rerun of the full-site scenario after stabilizing its account fixture.
- WebKit (Safari engine): 11/11 AP browser scenarios passed.
- Browser scenarios cover pristine and legacy state, every course's first lesson, checklist reversal and reload, notes, retrieval, additional-topic teachback, next/previous navigation, repeated submissions, incorrect-answer accuracy, Statistics migration/download, account switching with a late cloud result, damaged saved records, a 360px layout, and the full website AP entry point.
- Content validation covers every unit, not just the first lessons opened in the browser.
- Desktop and phone screenshots inspected. AP structural release checks pass.
- The full-site navigation test uses a stable simulated account and stubbed cloud storage; it does not verify real Firebase sign-in. An initial WebKit failure exposed a race between the fixture and Firebase's signed-out callback; the fixture was corrected without changing authentication behavior.

## Curriculum references and limits

Course outlines: [Statistics](https://apstudents.collegeboard.org/courses/ap-statistics), [CSP](https://apstudents.collegeboard.org/courses/ap-computer-science-principles), [Biology](https://apstudents.collegeboard.org/courses/ap-biology), [U.S. History](https://apstudents.collegeboard.org/courses/ap-united-states-history), [U.S. Government](https://apstudents.collegeboard.org/courses/ap-united-states-government-and-politics), [Psychology](https://apstudents.collegeboard.org/courses/ap-psychology), [Precalculus](https://apstudents.collegeboard.org/courses/ap-precalculus), [Macroeconomics](https://apstudents.collegeboard.org/courses/ap-macroeconomics), and [Microeconomics](https://apstudents.collegeboard.org/courses/ap-microeconomics).

These are focused review lessons, not exhaustive courses or official College Board material. Self-marked review is not demonstrated mastery. Task rubric checks and readiness bands remain independent practice tools, not validated AP score predictions. This audit does not establish cloud-model-equivalent quality for the site's local AI. Local Firefox could not launch because of a browser profile error; Firefox checks remain in CI.
