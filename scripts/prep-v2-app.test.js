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
let keydownHandler = null;
globalThis.document = {
  querySelectorAll() { return []; },
  getElementById(id) { return id === 'prep-app' ? prepApp : null; },
  addEventListener(type,handler) { if(type === 'keydown') keydownHandler = handler; }
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
    'toggleEliminate','updateNote','selectScorePoint','getPracticeEstimate',
    'renderCalculator','returnToSession','openFormLibrary','openCourse','openCourseLesson'
  ];
  for (const method of required) assert.equal(typeof window.ScholarkPrep[method], 'function', `${method} is missing`);
});

test('registered forms are reproducible and preserve their stable identity', () => {
  const api = window.ScholarkPrep;
  values.clear();
  api.init();
  for (const [exam,formId] of [['sat','sat-form-01'],['act','act-form-01']]) {
    api.setTest(exam);
    api.startFullTest(formId);
    let snapshot = JSON.parse(localStorage.getItem('gs_prep_v2_guest_active_session'));
    const firstRun = [...snapshot.questions];
    assert.equal(snapshot.formId, formId);
    api.finishSession(false);
    api.startFullTest(formId);
    snapshot = JSON.parse(localStorage.getItem('gs_prep_v2_guest_active_session'));
    assert.deepEqual(snapshot.questions, firstRun, `${formId} must assemble reproducibly`);
    api.finishSession(false);
  }
  const saved = JSON.parse(localStorage.getItem('gs_prep_v2_guest'));
  assert.deepEqual(saved.completedForms, {sat:[],act:[]}, 'an unanswered form must not be marked complete');
});

test('registered form seeds produce distinct assembled forms', () => {
  const api = window.ScholarkPrep;
  values.clear();
  api.init();
  api.setTest('sat');
  const signatures = new Set();
  for (let number = 1; number <= 10; number += 1) {
    api.startFullTest(`sat-form-${String(number).padStart(2,'0')}`);
    const snapshot = JSON.parse(localStorage.getItem('gs_prep_v2_guest_active_session'));
    signatures.add(snapshot.questions.join('|'));
    api.finishSession(false);
  }
  assert.equal(signatures.size, 10, 'the first ten registered SAT forms must not collide');
});

test('test center, public benchmarks, and pattern course render with source context', () => {
  const api = window.ScholarkPrep;
  values.clear();
  api.init();
  api.setTest('sat');
  api.showView('tests');
  assert.match(prepApp.innerHTML, /Realistic test-day mode/);
  assert.match(prepApp.innerHTML, /30 reproducible practice forms/);
  api.openFormLibrary();
  assert.match(prepApp.innerHTML, /SAT Practice Form 01/);
  assert.match(prepApp.innerHTML, /SAT Practice Form 30/);
  api.showView('dashboard');
  assert.ok(prepApp.innerHTML.includes(window.ScholarkPrepData.questions.length.toLocaleString()));
  assert.match(prepApp.innerHTML, /total original SAT \+ ACT questions/);
  assert.match(prepApp.innerHTML, /Public-data perspective/);
  assert.match(prepApp.innerHTML, /official aggregate publications/);
  assert.match(prepApp.innerHTML, /do not establish that Scholark caused/);
  assert.match(prepApp.innerHTML, /College Board/);
  api.openCourse('patterns');
  assert.match(prepApp.innerHTML, /Pattern Recognition Playbook/);
  assert.match(prepApp.innerHTML, /Period–semicolon equivalence/);
  assert.match(prepApp.innerHTML, /Purdue OWL/);
  api.openCourseLesson('patterns',0);
  assert.match(prepApp.innerHTML, /Your turn/);
  assert.match(prepApp.innerHTML, /independent clauses/i);
});

test('only a completed registered form unlocks a narrow score stability band', () => {
  const api = window.ScholarkPrep;
  const bank = new Map(window.ScholarkPrepData.questions.map(question => [question.id,question]));
  values.clear();
  api.init();
  api.setTest('sat');
  api.startFullTest('sat-form-01');
  for (let segmentNumber = 0; segmentNumber < 4; segmentNumber += 1) {
    let snapshot = JSON.parse(localStorage.getItem('gs_prep_v2_guest_active_session'));
    const segment = snapshot.segments[snapshot.segmentIndex];
    for (let index = segment.start; index <= segment.end; index += 1) {
      api.goTo(index);
      snapshot = JSON.parse(localStorage.getItem('gs_prep_v2_guest_active_session'));
      api.answer(bank.get(snapshot.questions[index]).answer);
    }
    api.goTo(segment.end);
    api.next();
  }
  const saved = JSON.parse(localStorage.getItem('gs_prep_v2_guest'));
  assert.deepEqual(saved.completedForms.sat, ['sat-form-01']);
  assert.equal(saved.scoreHistory.sat.at(-1).kind, 'full-test');
  const estimate = api.getPracticeEstimate('sat');
  assert.equal(estimate.stable, true);
  assert.ok(estimate.high - estimate.low <= 20);
  assert.match(prepApp.innerHTML, /Scholark stability band/);
  assert.match(prepApp.innerHTML, /Broader 80% model interval/);
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
  const fullEnglish = snapshot.questions.slice(0,50).map(id => questionById.get(id));
  assert.equal(new Set(fullEnglish.map(question => question.englishForm)).size, 1);
  assert.equal(new Set(fullEnglish.map(question => question.englishPassageSet)).size, 5);
  assert.ok([...Object.values(Object.groupBy(fullEnglish, question => question.englishPassageSet))].every(rows => rows.length === 10));
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
  const science = snapshot.questions.map(id => questionById.get(id));
  assert.equal(new Set(science.map(question => question.stimulusGroup)).size, 5);
  assert.ok([...Object.values(Object.groupBy(science, question => question.stimulusGroup))].every(rows => rows.length === 8));
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

test('practice estimates use accumulated evidence and item metrics stay privacy-safe', () => {
  const api = window.ScholarkPrep;
  api.setTest('sat');
  while (api.getPracticeEstimate('sat').attempts < 20) {
    api.startAdaptive();
    let snapshot = JSON.parse(localStorage.getItem('gs_prep_v2_guest_active_session'));
    const bank = new Map(window.ScholarkPrepData.questions.map(question => [question.id, question]));
    for (let index = 0; index < snapshot.questions.length; index += 1) {
      api.goTo(index);
      const question = bank.get(snapshot.questions[index]);
      api.setConfidence(index % 3 === 0 ? 'high' : 'medium');
      api.answer(index % 4 === 0 ? (question.answer + 1) % 4 : question.answer);
    }
    api.finishSession(false);
  }

  const estimate = api.getPracticeEstimate('sat');
  assert.ok(estimate.low >= 400 && estimate.high <= 1600);
  assert.ok(estimate.low <= estimate.midpoint && estimate.midpoint <= estimate.high);
  assert.match(estimate.method, /Independent 3PL-style estimate/);
  assert.match(estimate.method, /not official scoring/);

  const saved = JSON.parse(localStorage.getItem('gs_prep_v2_guest'));
  const metrics = Object.values(saved.itemMetrics);
  assert.ok(metrics.length >= 20);
  for (const metric of metrics) {
    assert.equal(metric.version, 'public-prior-v1');
    assert.ok(metric.attempts >= 1);
    assert.equal(metric.optionCounts.length, 4);
    assert.ok(!('email' in metric));
    assert.ok(!('uid' in metric));
    assert.ok(!('name' in metric));
  }
  api.showView('dashboard');
  assert.match(prepApp.innerHTML, /Decision Profile Map/);
  assert.match(prepApp.innerHTML, /Fast \+ accurate/);
  assert.match(prepApp.innerHTML, /your own .*second median/);
});

test('diagnostics create score-history checkpoints and render an interactive progress chart', () => {
  const api = window.ScholarkPrep;
  api.setTest('sat');
  api.startDiagnostic();
  let snapshot = JSON.parse(localStorage.getItem('gs_prep_v2_guest_active_session'));
  const bank = new Map(window.ScholarkPrepData.questions.map(question => [question.id, question]));
  for (let index = 0; index < snapshot.questions.length; index += 1) {
    api.goTo(index);
    api.answer(index % 5 === 0 ? (bank.get(snapshot.questions[index]).answer + 1) % 4 : bank.get(snapshot.questions[index]).answer);
    snapshot = JSON.parse(localStorage.getItem('gs_prep_v2_guest_active_session'));
  }
  api.finishSession(false);
  const saved = JSON.parse(localStorage.getItem('gs_prep_v2_guest'));
  assert.ok(saved.scoreHistory.sat.length >= 1);
  const latest = saved.scoreHistory.sat.at(-1);
  assert.equal(latest.kind, 'diagnostic');
  assert.ok(latest.low >= 400 && latest.high <= 1600);
  api.showView('dashboard');
  assert.match(prepApp.innerHTML, /score progress/i);
  assert.match(prepApp.innerHTML, /prep-v2-score-chart/);
  assert.match(prepApp.innerHTML, /not an official score/);
});

test('choice elimination, scratch notes, and keyboard answers survive session snapshots', () => {
  const api = window.ScholarkPrep;
  api.startAdaptive();
  api.toggleEliminate(2);
  api.updateNote('Check units before choosing.');
  let snapshot = JSON.parse(localStorage.getItem('gs_prep_v2_guest_active_session'));
  assert.deepEqual(snapshot.eliminated[0], [2]);
  assert.equal(snapshot.notes[0], 'Check units before choosing.');
  assert.equal(snapshot.contentVersion, window.ScholarkPrepData.version);
  assert.equal(typeof keydownHandler, 'function');
  keydownHandler({key:'1',defaultPrevented:false,ctrlKey:false,metaKey:false,altKey:false,target:{tagName:'BODY'},preventDefault(){}});
  snapshot = JSON.parse(localStorage.getItem('gs_prep_v2_guest_active_session'));
  assert.notEqual(snapshot.answers[0], null);
  api.finishSession(false);
});
