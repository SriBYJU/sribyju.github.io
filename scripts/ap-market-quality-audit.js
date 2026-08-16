import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const release = process.argv.includes('--release');
const source = readFileSync(resolve('..', 'ap-v2-data.js'), 'utf8');
const app = readFileSync(resolve('..', 'ap-v2-app.js'), 'utf8');
const css = readFileSync(resolve('..', 'ap-v2.css'), 'utf8');
const sandbox = {};
new Function('window', source)(sandbox);
const data = sandbox.ScholarkAPData;
const allQuestions = data.subjects.flatMap(subject => subject.questions);

const checks = [];
function check(area, points, condition, detail) { checks.push({ area, points, earned: condition ? points : 0, condition, detail }); }

check('Curriculum coverage', 8, data.subjects.length >= 23, `${data.subjects.length} AP courses`);
check('Curriculum coverage', 6, data.subjects.every(subject => subject.units.length >= 3), 'unit maps for every course');
check('Exam fidelity', 8, data.subjects.every(subject => subject.exam.mcq.weight + subject.exam.written.weight === 100), 'section weights total 100%');
check('Exam fidelity', 8, data.subjects.every(subject => subject.questions.length >= subject.exam.mcq.count), 'official-length MCQ capacity');
check('Exam fidelity', 6, data.subjectMap.appsych.tasks.some(task => task.id === 'psych-ebq') && data.subjectMap.apush.tasks.some(task => task.id === 'history-dbq') && data.subjectMap.apspan.tasks.some(task => task.id === 'span-project'), 'course-specific task models');
check('Practice quality', 8, allQuestions.length >= 3400, `${allQuestions.length.toLocaleString()} original checks`);
check('Practice quality', 6, allQuestions.every(question => question.options.length === 4 && new Set(question.options).size === 4 && question.hints.length === 3 && question.explanation.length >= 80), 'complete tutoring records with unique choices');
const positionCounts = [0,1,2,3].map(position => allQuestions.filter(question => question.answer === position).length / allQuestions.length);
check('Practice quality', 5, positionCounts.every(rate => rate > .20 && rate < .30), `answer positions ${positionCounts.map(rate => (rate * 100).toFixed(1) + '%').join(', ')}`);
const longestRate = allQuestions.filter(question => { const lengths=question.options.map(option=>option.length); const max=Math.max(...lengths); return lengths[question.answer]===max && lengths.filter(length=>length===max).length===1; }).length / allQuestions.length;
check('Practice quality', 5, longestRate < .45, `unique-longest correct ${(longestRate * 100).toFixed(1)}%`);
check('Adaptive product', 6, /adaptiveSort|nextReviewAt|weakestUnits/.test(app), 'weakness + retention routing');
check('Adaptive product', 5, /confidenceTotal|Confidence before feedback|confident/i.test(app), 'confidence calibration');
check('Adaptive product', 5, /currentSession|scratch|flags|Question map/.test(app), 'resumable sessions and learner tools');
check('Constructed response', 6, /gradeTask|rubric-completeness|taskAttempts/.test(app), 'deterministic task rubric studio');
check('Constructed response', 4, /Teach-Back Forge|checkTeachback/.test(app), 'retrieval teach-back lab');
check('Score evidence', 6, /mcq\.weight|written\.weight|scoreBands|Operational cut scores are not published/.test(source + app), 'weighted subject-specific transparent estimate');
check('UI and access', 4, /@media\(max-width:650px\)|prefers-reduced-motion/.test(css), 'phone and reduced-motion layouts');
check('UI and access', 4, /aria-live|aria-label|handleKey/.test(app), 'live status, accessible labels, keyboard controls');
check('Trust and safety', 5, /No released question text is copied|Independent practice-readiness estimate/.test(source) && !/sk-[a-z0-9]{12}|PRIVATE KEY|apiKey\s*[:=]\s*["'][^"']+["']/i.test(source + app), 'original-content and no-secret contract');

const earned = checks.reduce((sum, item) => sum + item.earned, 0);
const possible = checks.reduce((sum, item) => sum + item.points, 0);
const score = earned / possible * 100;
console.log(`Scholark AP market-quality audit: ${score.toFixed(2)}/100`);
for (const item of checks) console.log(`${item.condition ? 'PASS' : 'FAIL'} [${item.area}] ${item.earned}/${item.points} — ${item.detail}`);
if (release && score < 96) {
  console.error(`Release blocked: ${score.toFixed(2)} is below the 96.00 gate.`);
  process.exitCode = 1;
}
