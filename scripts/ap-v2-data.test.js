import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadData() {
  const source = readFileSync(resolve('..', 'ap-v2-data.js'), 'utf8');
  const sandbox = {};
  new Function('window', source)(sandbox);
  return sandbox.ScholarkAPData;
}

const data = loadData();
const app = readFileSync(resolve('..', 'ap-v2-app.js'), 'utf8');
const css = readFileSync(resolve('..', 'ap-v2.css'), 'utf8');
const html = readFileSync(resolve('..', 'index.html'), 'utf8');

test('AP v2 registers 23 complete, uniquely identified course workspaces', () => {
  assert.equal(data.subjects.length, 23);
  assert.equal(new Set(data.subjects.map(subject => subject.id)).size, 23);
  assert.equal(Object.keys(data.subjectMap).length, 23);
  for (const subject of data.subjects) {
    assert.ok(subject.units.length >= 3, `${subject.id} needs a real unit map`);
    assert.ok(subject.tasks.length >= 2, `${subject.id} needs exam-specific task modes`);
    assert.ok(subject.resources.some(resource => resource.url === subject.assessmentUrl));
    assert.match(subject.assessmentUrl, /^https:\/\/apstudents\.collegeboard\.org\/courses\//);
  }
});

test('2027 public blueprints replace known legacy counts and generic task types', () => {
  const expected = {
    apcsa:[42,4], apcalcab:[42,6], apcalcbc:[42,6], apstats:[42,4], apphys1:[42,4],
    appsych:[75,2], apush:[55,5], apworld:[55,5], apeuro:[55,5], apspan:[55,3],
    apprecalc:[42,4], apmicro:[60,3], apphyscmech:[42,4], apcompgov:[55,4]
  };
  for (const [id, values] of Object.entries(expected)) {
    assert.equal(data.subjectMap[id].exam.mcq.count, values[0], `${id} MCQ count`);
    assert.equal(data.subjectMap[id].exam.written.count, values[1], `${id} written count`);
  }
  assert.deepEqual(data.subjectMap.appsych.tasks.map(task => task.name), ['Article Analysis Question (AAQ)', 'Evidence-Based Question (EBQ)']);
  for (const id of ['apush','apworld','apeuro']) assert.deepEqual(data.subjectMap[id].tasks.map(task => task.id), ['history-saq','history-dbq','history-leq']);
});

test('every official-length MCQ simulation has enough original registered questions', () => {
  assert.ok(data.questionCount >= 3400);
  for (const subject of data.subjects) {
    assert.ok(subject.questions.length >= subject.exam.mcq.count, `${subject.id} bank is shorter than its official MCQ section`);
    assert.equal(new Set(subject.questions.map(question => question.id)).size, subject.questions.length, `${subject.id} IDs`);
  }
});

test('question records are complete and avoid legacy placeholder FRQs', () => {
  const questions = data.subjects.flatMap(subject => subject.questions);
  const answerCounts = [0,0,0,0];
  for (const question of questions) {
    assert.ok(question.stem.length >= 24, question.id);
    assert.equal(question.options.length, 4, question.id);
    assert.equal(new Set(question.options).size, 4, `${question.id} has duplicate answer choices`);
    assert.ok(Number.isInteger(question.answer) && question.answer >= 0 && question.answer <= 3, question.id);
    assert.ok(question.explanation.length >= 80, question.id);
    assert.equal(question.hints.length, 3, question.id);
    assert.ok(question.unit && question.topic && question.skill, question.id);
    assert.doesNotMatch(question.stem, /Analyze a key concept|Compare and contrast two major themes|Evaluate the impact of a major development/i);
    answerCounts[question.answer]++;
  }
  const total = questions.length;
  answerCounts.forEach(count => assert.ok(count / total > .20 && count / total < .30, `answer-position distribution ${answerCounts}`));
});

test('correct answers do not exhibit a longest-choice giveaway', () => {
  const questions = data.subjects.flatMap(subject => subject.questions);
  let uniquelyLongestCorrect = 0;
  for (const question of questions) {
    const lengths = question.options.map(option => option.length);
    const max = Math.max(...lengths);
    if (lengths[question.answer] === max && lengths.filter(length => length === max).length === 1) uniquelyLongestCorrect++;
  }
  assert.ok(uniquelyLongestCorrect / questions.length < .45, `longest-choice rate ${(uniquelyLongestCorrect / questions.length).toFixed(3)}`);
});

test('subject-specific readiness bands and weights are valid planning inputs', () => {
  for (const subject of data.subjects) {
    assert.equal(subject.scoreBands.length, 5);
    assert.ok(subject.scoreBands.every((value, index, values) => index === 0 || value > values[index - 1]));
    assert.equal(subject.exam.mcq.weight + subject.exam.written.weight, 100);
    assert.ok(subject.exam.mcq.minutes > 0 && subject.exam.written.minutes > 0);
  }
  assert.ok(new Set(data.subjects.map(subject => subject.scoreBands.slice(1).join(','))).size >= 5, 'one global score mapping must not return');
});

test('AP app implements persistence, local fallback, cloud sync, and differentiated studios', () => {
  for (const signal of ['gs_ap_v2_', '_dbSaveSyncState', 'Adaptive Practice', 'Task Studio', 'Pattern Lab', 'Score Studio', 'Teach-Back Forge', 'Confidence before feedback', 'Question map']) assert.ok(app.includes(signal), signal);
  assert.doesNotMatch(app, /catch\s*(?:\([^)]*\))?\s*\{\s*\}/, 'silent catches are prohibited');
  assert.doesNotMatch(app, /api\.openai\.com|api\.anthropic\.com|sk-[a-z0-9]{12}|stripe\.com\/v1/i, 'AP client must not contain AI/payment endpoints or secrets');
  assert.match(app, /Cloud sync failed\. Your AP progress is still saved on this device\./);
});

test('AP UI is loaded after the legacy inline layer and includes responsive/accessibility support', () => {
  assert.ok(html.indexOf('ap-v2-data.js') > html.lastIndexOf('</script>', html.indexOf('ap-v2-data.js') - 1));
  assert.ok(html.indexOf('ap-v2-app.js') > html.indexOf('ap-v2-data.js'));
  assert.match(html, /<link rel="stylesheet" href="ap-v2\.css">/);
  assert.match(css, /@media\(max-width:650px\)/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(app, /aria-live="polite"/);
  assert.match(app, /aria-label="Search AP courses"/);
  assert.match(app, /handleKey/);
});
