import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const values = new Map();
globalThis.localStorage = {
  getItem(key) { return values.has(key) ? values.get(key) : null; },
  setItem(key, value) { values.set(key, String(value)); },
  removeItem(key) { values.delete(key); }
};
const prepApp = { innerHTML:'' };
globalThis.document = {
  querySelectorAll() { return []; },
  getElementById(id) { return id === 'prep-app' ? prepApp : null; }
};
globalThis.confirm = () => true;
globalThis.window = {};
await import(pathToFileURL(resolve('..', 'prep-v2-data.js')).href);
await import(pathToFileURL(resolve('..', 'prep-v2-app.js')).href);

test('prep engine exposes the complete adaptive-session API', () => {
  const required = [
    'init','startDiagnostic','startAdaptive','startSkill','startPractice',
    'startMisconceptionReplay','startDecisionSimulator','startFullTest','startSectionTest',
    'startScienceTest','setConfidence','showHint','setApproach','skipQuestion',
    'renderCalculator','returnToSession'
  ];
  for (const method of required) assert.equal(typeof window.ScholarkPrep[method], 'function', `${method} is missing`);
});

test('decision simulation records strategy and powers a fresh misconception replay', () => {
  const api = window.ScholarkPrep;
  api.init();
  api.startDecisionSimulator();
  let snapshot = JSON.parse(localStorage.getItem('gs_prep_v2_guest_active_session'));
  assert.equal(snapshot.kind, 'decision');
  assert.equal(snapshot.questions.length, 12);
  assert.ok(snapshot.timeLimit > 0);

  const firstId = snapshot.questions[0];
  const first = window.ScholarkPrepData.questions.find(question => question.id === firstId);
  api.setApproach('manual');
  api.answer((first.answer + 1) % 4);
  snapshot = JSON.parse(localStorage.getItem('gs_prep_v2_guest_active_session'));
  assert.equal(snapshot.approaches[0], 'manual');
  assert.notEqual(snapshot.answers[0], null);
  api.finishSession(false);

  api.startMisconceptionReplay();
  snapshot = JSON.parse(localStorage.getItem('gs_prep_v2_guest_active_session'));
  assert.equal(snapshot.kind, 'replay');
  assert.ok(snapshot.questions.length >= 1);
  assert.notEqual(snapshot.questions[0], firstId, 'replay must use a fresh question, not the memorized miss');
  const replay = window.ScholarkPrepData.questions.find(question => question.id === snapshot.questions[0]);
  assert.equal(replay.skill, first.skill);
  api.showHint();
  snapshot = JSON.parse(localStorage.getItem('gs_prep_v2_guest_active_session'));
  assert.equal(snapshot.hintsUsed[0], 1);
  api.finishSession(false);
});

test('full simulations use official section sizes and timing structure', () => {
  const api = window.ScholarkPrep;
  api.setTest('sat');
  api.startFullTest();
  let snapshot = JSON.parse(localStorage.getItem('gs_prep_v2_guest_active_session'));
  assert.equal(snapshot.questions.length, 98);
  assert.deepEqual(snapshot.segments.map(segment => [segment.end - segment.start + 1, segment.timeLimit]), [[27,1920],[27,1920],[22,2100],[22,2100]]);
  api.finishSession(false);

  api.startSectionTest('Math');
  snapshot = JSON.parse(localStorage.getItem('gs_prep_v2_guest_active_session'));
  assert.equal(snapshot.questions.length, 44);
  assert.deepEqual(snapshot.segments.map(segment => [segment.end - segment.start + 1,segment.timeLimit]), [[22,2100],[22,2100]]);
  api.finishSession(false);

  api.setTest('act');
  api.startFullTest();
  snapshot = JSON.parse(localStorage.getItem('gs_prep_v2_guest_active_session'));
  assert.equal(snapshot.questions.length, 131);
  assert.deepEqual(snapshot.segments.map(segment => [segment.label,segment.end - segment.start + 1,segment.timeLimit]), [['English',50,2100],['Math',45,3000],['Reading',36,2400]]);
  const questionById = new Map(window.ScholarkPrepData.questions.map(question => [question.id, question]));
  const fullReading = snapshot.questions.slice(95).map(id => questionById.get(id));
  assert.equal(new Set(fullReading.map(question => question.readingForm)).size, 1);
  assert.equal(new Set(fullReading.map(question => question.passageSet)).size, 4);
  assert.ok([...Object.values(Object.groupBy(fullReading, question => question.passageSet))].every(rows => rows.length === 9));
  api.finishSession(false);

  api.startSectionTest('Reading');
  snapshot = JSON.parse(localStorage.getItem('gs_prep_v2_guest_active_session'));
  assert.equal(snapshot.questions.length, 36);
  assert.equal(snapshot.segments[0].timeLimit, 2400);
  const sectionReading = snapshot.questions.map(id => questionById.get(id));
  assert.equal(new Set(sectionReading.map(question => question.readingForm)).size, 1);
  assert.equal(new Set(sectionReading.map(question => question.passageSet)).size, 4);
  api.finishSession(false);

  api.startScienceTest();
  snapshot = JSON.parse(localStorage.getItem('gs_prep_v2_guest_active_session'));
  assert.equal(snapshot.questions.length, 40);
  assert.equal(snapshot.segments[0].timeLimit, 2400);
  api.finishSession(false);
});

test('SAT module two routes from module-one performance without repeating questions', () => {
  const api = window.ScholarkPrep;
  api.setTest('sat');
  api.startSectionTest('Reading and Writing');
  let snapshot = JSON.parse(localStorage.getItem('gs_prep_v2_guest_active_session'));
  const bank = new Map(window.ScholarkPrepData.questions.map(question => [question.id, question]));

  for (let index = 0; index < 27; index += 1) {
    api.goTo(index);
    api.answer(bank.get(snapshot.questions[index]).answer);
  }
  api.goTo(26);
  api.next();

  snapshot = JSON.parse(localStorage.getItem('gs_prep_v2_guest_active_session'));
  assert.equal(snapshot.segmentIndex, 1);
  assert.equal(snapshot.segments[1].route, 'hard');
  assert.equal(new Set(snapshot.questions).size, snapshot.questions.length);
  api.finishSession(false);
});
