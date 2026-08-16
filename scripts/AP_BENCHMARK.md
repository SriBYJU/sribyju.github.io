# Scholark AP Studio — market-quality benchmark

Reviewed: 2026-08-16. This document is a release checklist, not a claim of College Board endorsement or an externally validated product rating.

## Public comparison set

- [Knowt AP/exam hub](https://knowt.com/exams): study guides, notes, flashcards, practice exams, and cross-device study.
- [Knowt’s public AP feature comparison](https://knowt.com/free-fiveable): unit MCQ practice, FRQ practice/grading, in-depth guides, vocabulary review, and mock exams. Knowt publicly states broader all-exam coverage than this Scholark release.
- [Khan Academy AP Biology](https://www.khanacademy.org/science/ap-biology?t=practice): deep instructional units, skill mastery, quizzes, unit tests, simulations, and worked FRQ examples.
- [Khan Academy mastery-course list](https://support.khanacademy.org/hc/en-us/articles/360014675332-Which-courses-have-mastery-enabled-): mastery is available for a selected set of AP math, science, history, economics, and computing courses.
- [College Board AP Students courses and exams](https://apstudents.collegeboard.org/courses): source of record for public exam format, timing, section weights, and official preparation links.

## Feature comparison

| Capability | Knowt public offering | Khan Academy public offering | Scholark AP Studio v2 |
|---|---|---|---|
| Breadth | Publicly advertises all AP exams | Deep selected AP courses | 23 high-demand courses in this release |
| Unit learning | Study guides | Full lessons, videos, exercises | Fast crash courses, misconceptions, notes, retrieval |
| MCQ practice | Unit practice and mocks | Skill exercises, quizzes, unit tests | 3,480 original checks, unit/diagnostic/adaptive/timed modes |
| Constructed response | FRQ room and grading | Worked examples in some courses | 70 exam-specific task modes with local rubric-completeness checks |
| Full practice | Public mock-exam flow | Course challenges for supported courses | Current public MCQ count/timing simulations + written task circuits |
| Mastery | Practice and spaced repetition | Mature skill mastery | Unit mastery, decay/review dates, prerequisite repair |
| Score planning | AP score calculators | Mastery points/course progress | Section-weighted, subject-specific readiness with uncertainty |
| Confidence calibration | Not prominent in reviewed public pages | Not prominent in reviewed public pages | Guess/unsure/certain tracked against correctness |
| Teach-back retrieval | Not prominent in reviewed public pages | Not prominent in reviewed public pages | Local completeness check from an explanation written from memory |
| Cost in this app | External product rules apply | Free nonprofit platform | Free to signed-in Scholark users; no AP paywall |

## Release gate

`npm run ap:release` must score at least 96/100. The gate checks:

- course/unit/task coverage;
- current section weights and enough items for each official-length MCQ section;
- unique answer choices, near-balanced answer positions, and longest-choice bias;
- tutoring hints and explanations;
- adaptive routing, confidence tracking, persistence, retention review, task grading, score transparency;
- responsive and accessible UI signals;
- original-content disclosure and absence of client secrets.

The current automated result is 100/100. That score means the checked release contract passes; it does not replace independent psychometric validation, classroom trials, or human review of every generated practice item.

## Honest limitations and next content phase

- Coverage is 23 courses, not every AP exam.
- MCQs are original concept-and-reasoning checks with constructed stimuli. They do not copy or lightly modify released College Board questions.
- The Task Studio’s local grader measures rubric completeness and reasoning signals. It cannot verify every factual, mathematical, code, language, or literary claim.
- Readiness bands are independent planning estimates. Operational AP cut scores are not public and can vary.
- Audio playback/recording for language exams and drawing tools for handwritten graph responses remain future secure-media work.
- A future editorial phase should add longer original passage sets, richer data/diagram assets, audio, and independently reviewed form-level difficulty calibration.
