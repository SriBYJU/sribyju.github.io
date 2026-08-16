import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { auditPrepContent } from './prep-content-audit.js';

globalThis.window = {};
await import(pathToFileURL(resolve('..', 'prep-v2-data.js')).href);
const data = globalThis.window.ScholarkPrepData;

test('prep library has a valid unique schema', () => {
  assert.ok(data);
  const ids = new Set();
  const content = new Set();
  for (const question of data.questions) {
    assert.ok(question.id && !ids.has(question.id), `duplicate id: ${question.id}`);
    ids.add(question.id);
    assert.ok(data.topicById[question.skill], `unknown skill: ${question.skill}`);
    assert.equal(question.options.length, 4, `${question.id} must have four choices`);
    assert.equal(new Set(question.options).size, 4, `${question.id} has duplicate choices`);
    assert.ok(Number.isInteger(question.answer) && question.answer >= 0 && question.answer < 4, `${question.id} has an invalid answer`);
    assert.ok(question.explanation?.length >= 20, `${question.id} needs a substantive explanation`);
    const key = `${question.exam}|${question.passage || ''}|${question.stem}`.toLowerCase().replace(/\s+/g, ' ').trim();
    assert.ok(!content.has(key), `${question.id} duplicates visible content`);
    content.add(key);
  }
});

test('every official taxonomy topic has practice coverage', () => {
  for (const exam of ['sat', 'act']) {
    for (const topic of data.topics[exam]) {
      assert.ok(data.questions.some(question => question.exam === exam && question.skill === topic.id), `${exam} topic has no questions: ${topic.name}`);
    }
  }
});

test('every question carries a versioned public-prior calibration record', () => {
  assert.equal(data.calibrationVersion, 'public-prior-v1');
  for (const question of data.questions) {
    const calibration = question.calibration;
    assert.equal(calibration?.version, data.calibrationVersion, `${question.id} has the wrong calibration version`);
    assert.equal(calibration?.status, 'provisional', `${question.id} must begin as provisional`);
    assert.equal(calibration?.sampleSize, 0, `${question.id} must not claim observed responses`);
    assert.ok(calibration.difficulty >= -3 && calibration.difficulty <= 3, `${question.id} has an invalid difficulty prior`);
    assert.ok(calibration.discrimination > 0 && calibration.discrimination <= 2.5, `${question.id} has an invalid discrimination prior`);
    assert.ok(calibration.guessing >= 0 && calibration.guessing <= .35, `${question.id} has an invalid guessing prior`);
    assert.deepEqual(calibration.sourceIds, question.exam === 'sat'
      ? ['college-board-digital-sat-technical-manual-2024','college-board-digital-sat-content-domains']
      : ['act-enhanced-design-framework-2026','act-enhanced-score-interpretation-2025'], `${question.id} has incorrect source provenance`);
  }
});

test('content audit rejects no item and recomputes every eligible generated answer', () => {
  const report = auditPrepContent(data.questions, data.topicById);
  assert.equal(report.version, 'content-audit-v1');
  assert.deepEqual(report.errors, []);
  assert.ok(report.structuralFamilies >= 200);
  assert.ok(report.largestFamily <= 80);
  assert.ok(report.deterministicEligible >= 900);
  assert.equal(report.deterministicCoverage, 1);
});

test('nonrepeating full-test section minimums are available', () => {
  const minimums = {
    sat: {'Reading and Writing':54, Math:44},
    act: {English:50, Math:45, Reading:36, Science:40}
  };
  for (const [exam, sections] of Object.entries(minimums)) {
    for (const [section, count] of Object.entries(sections)) {
      const available = data.questions.filter(question => question.exam === exam && question.section === section).length;
      assert.ok(available >= count, `${exam} ${section} has ${available}; needs ${count}`);
    }
  }
});

test('core sections have at least two nonrepeating full-form pools', () => {
  const twoFormMinimums = {
    sat: {'Reading and Writing':108, Math:88},
    act: {English:100, Math:90, Reading:72, Science:80}
  };
  for (const [exam, sections] of Object.entries(twoFormMinimums)) {
    for (const [section, count] of Object.entries(sections)) {
      const available = data.questions.filter(question => question.exam === exam && question.section === section).length;
      assert.ok(available >= count, `${exam} ${section} needs ${count} items for two nonrepeating forms; found ${available}`);
    }
  }
});

test('ACT Reading includes fifteen passage-aligned enhanced-format forms', () => {
  const grouped = Object.groupBy(data.questions.filter(question => question.passageSet), question => question.readingForm);
  assert.equal(Object.keys(grouped).length, 15);
  for (const [form, questions] of Object.entries(grouped)) {
    assert.equal(questions.length, 36, `ACT Reading form ${form} must contain 36 questions`);
    const sets = Object.groupBy(questions, question => question.passageSet);
    assert.equal(Object.keys(sets).length, 4, `ACT Reading form ${form} must contain four passage sets`);
    for (const [set, rows] of Object.entries(sets)) {
      assert.equal(rows.length, 9, `${set} must contain nine linked questions`);
      assert.ok(rows[0].passage.trim().split(/\s+/).length >= 500, `${set} needs a sustained college-readiness passage`);
      assert.equal(new Set(rows.map(row => row.passage)).size, 1, `${set} questions must share one passage`);
    }
  }
});

test('SAT bank excludes clearly off-blueprint advanced topics', () => {
  const satText = data.questions.filter(question => question.exam === 'sat').map(question => `${question.stem} ${question.explanation}`).join(' ').toLowerCase();
  for (const banned of ['derivative', 'integral', 'determinant', 'matrix multiplication', 'limit as x']) {
    assert.ok(!satText.includes(banned), `SAT content contains off-blueprint term: ${banned}`);
  }
});

test('generated two-equation systems have a unique solution', () => {
  const systems = data.questions.filter(question => /-sys-/.test(question.id));
  assert.ok(systems.length > 0);
  for (const question of systems) {
    const match = question.stem.match(/x \+ y = (-?\d+) and (-?\d+)x \+ (-?\d+)y = (-?\d+)/);
    assert.ok(match, `${question.id} system could not be parsed`);
    const xCoefficient = Number(match[2]);
    const yCoefficient = Number(match[3]);
    assert.notEqual(xCoefficient, yCoefficient, `${question.id} has dependent equations and no unique x-value`);
  }
});

test('generated core math answers agree with their stated quantities', () => {
  const numeric = value => Number(String(value).replace(/[$,°]/g, ''));
  const close = (actual, expected, id) => assert.ok(Math.abs(actual - expected) < 1e-8, `${id}: expected ${expected}, found ${actual}`);
  for (const question of data.questions.filter(item => item.section === 'Math')) {
    const answer = question.options[question.answer];
    let match;
    if (/^(sat|act)-lin-\d+$/.test(question.id)) {
      match = question.stem.match(/(-?\d+)x \+ (-?\d+) = (-?\d+)/); close(numeric(answer), (Number(match[3])-Number(match[2]))/Number(match[1]), question.id);
    } else if (/^(sat|act)-fn-\d+$/.test(question.id)) {
      match = question.stem.match(/f\((-?\d+)\) = (-?\d+) and has a slope of (-?\d+)/); close(numeric(answer), Number(match[2])-Number(match[1])*Number(match[3]), question.id);
    } else if (/^(sat|act)-sys-\d+$/.test(question.id)) {
      match = question.stem.match(/x \+ y = (-?\d+) and (-?\d+)x \+ (-?\d+)y = (-?\d+)/); close(numeric(answer), (Number(match[4])-Number(match[3])*Number(match[1]))/(Number(match[2])-Number(match[3])), question.id);
    } else if (/^(sat|act)-quad-\d+$/.test(question.id)) {
      match = question.stem.match(/x² − (-?\d+)x \+ (-?\d+) = 0 is (-?\d+)/); close(numeric(answer), Number(match[1])-Number(match[3]), question.id);
    } else if (/^(sat|act)-ratio-\d+$/.test(question.id)) {
      match = question.stem.match(/(\d+) identical notebooks cost \$(\d+).*how much do (\d+) notebooks/); close(numeric(answer), Number(match[2])/Number(match[1])*Number(match[3]), question.id);
    } else if (/^(sat|act)-pct-\d+$/.test(question.id)) {
      match = question.stem.match(/increases from (\d+) by (\d+)%/); close(numeric(answer), Number(match[1])*(1+Number(match[2])/100), question.id);
    } else if (/^(sat|act)-data-\d+$/.test(question.id)) {
      match = question.stem.match(/data set is ([\d, ]+)\. If (\d+) is added/); const values=match[1].split(',').map(Number), before=values.reduce((a,b)=>a+b,0)/values.length, after=(values.reduce((a,b)=>a+b,0)+Number(match[2]))/(values.length+1); close(numeric(answer),after-before,question.id);
    } else if (/^(sat|act)-geo-\d+$/.test(question.id)) {
      match = question.stem.match(/area (\d+).*length (\d+)/); const width=Number(match[1])/Number(match[2]); close(numeric(answer),2*(width+Number(match[2])),question.id);
    } else if (/^(sat|act)-tri-\d+$/.test(question.id)) {
      match = question.stem.match(/legs (\d+) and (\d+)/); close(numeric(answer),Math.hypot(Number(match[1]),Number(match[2])),question.id);
    } else if (/^(sat|act)-circle-\d+$/.test(question.id)) {
      match = question.stem.match(/= (\d+)\. What is its radius/); close(numeric(answer),Math.sqrt(Number(match[1])),question.id);
    }
  }
});
