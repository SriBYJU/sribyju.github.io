import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../scholark-ai-algorithms.js', import.meta.url), 'utf8');
const context = { console, Date, Math, JSON, Set, Map, Number, String, Array, Object, RegExp, globalThis: null };
context.globalThis = context;
vm.createContext(context);
vm.runInContext(source, context, { filename: 'scholark-ai-algorithms.js' });
const A = context.ScholarkAIAlgorithms;

test('capability ladder never requires generative AI without WebGPU', () => {
  assert.equal(A.detectCapability({ webgpu: false, wasm: true }).generative, false);
  assert.equal(A.detectCapability({ webgpu: false, wasm: true }).tier, 'compatibility');
  assert.equal(A.detectCapability({ webgpu: true, deviceMemory: 16, hardwareConcurrency: 12, mobile: false }).tier, 'high');
});

test('intent router selects specialist domains', () => {
  assert.equal(A.routeIntent('Grade my Common App essay and tell me if the hook is cliché').agent, 'essay');
  assert.equal(A.routeIntent('Why am I missing SAT advanced math questions?').agent, 'sat');
  assert.equal(A.routeIntent('Compare these universities for data science').agent, 'college');
  assert.equal(A.routeIntent('Which scholarship deadlines matter first?').agent, 'scholarship');
});

test('mastery responds to repeated evidence without one-question mastery', () => {
  const first = A.updateMastery(0, { correct: true, difficulty: 0.5, attempts: 1 });
  assert.ok(first.score < 50);
  const miss = A.updateMastery(first.score, { correct: false, difficulty: 0.5, errorType: 'concept_gap' });
  assert.ok(miss.score < first.score);
});

test('adaptive practice sends persistent misses toward prerequisite review', () => {
  const rec = A.recommendNextPractice({ accuracy: 0.35, mastery: 28, recurringErrors: 3, daysSincePractice: 1 });
  assert.equal(rec.action, 'prerequisite_review');
  assert.equal(rec.difficulty, 'easier');
});

test('study planner prioritizes imminent exams over distant equal-mastery work', () => {
  const tomorrow = new Date(Date.now() + 86400000).toISOString();
  const later = new Date(Date.now() + 20 * 86400000).toISOString();
  const plan = A.buildStudyPlan({ dailyMinutes: 60, days: 1, tasks: [
    { id: 'near', title: 'Near exam', examDate: tomorrow, mastery: 60, importance: 70, minutes: 30 },
    { id: 'far', title: 'Far exam', examDate: later, mastery: 60, importance: 70, minutes: 30 }
  ] });
  assert.equal(plan[0].blocks[0].taskId, 'near');
  assert.ok(plan[0].totalMinutes <= 60);
});

test('essay baseline is stable and exposes the full demanding rubric', () => {
  const essay = `The gym clock read 6:14 when I noticed my hands were shaking.\n\nI had practiced the presentation for weeks, but when my name was called, I forgot the first line. I looked at my brother in the back row and admitted, "I lost it." The room laughed with me instead of at me.\n\nAfterward I realized I had spent more energy rehearsing confidence than understanding why I was afraid to be seen learning in public. I began asking questions earlier, even when they sounded unfinished.\n\nNow I still prepare carefully, but I leave room to be corrected. That change matters more to me than the presentation itself.`;
  const a = A.scoreEssayDeterministic(essay);
  const b = A.scoreEssayDeterministic(essay);
  assert.equal(a.overall, b.overall);
  assert.deepEqual(Object.keys(a.scores).sort(), Array.from(A.ESSAY_CATEGORIES).sort());
  assert.ok(a.overall >= 1 && a.overall <= 10);
  assert.equal(A.validateEssayEvaluation({ overall: a.overall, scores: a.scores }).valid, true);
});

test('malformed essay scores are rejected before UI rendering', () => {
  const value = { overall: 9, scores: Object.fromEntries(Array.from(A.ESSAY_CATEGORIES).map(k => [k, 7])) };
  value.scores.voice = 99;
  assert.equal(A.validateEssayEvaluation(value).valid, false);
});

test('essay version comparison reports category deltas', () => {
  const a = { overall: 6, scores: Object.fromEntries(Array.from(A.ESSAY_CATEGORIES).map(k => [k, 6])) };
  const b = { overall: 7, scores: Object.fromEntries(Array.from(A.ESSAY_CATEGORIES).map(k => [k, k === 'specificity' ? 8 : 6])) };
  const c = A.compareEssayEvaluations(a, b);
  assert.equal(c.overallDelta, 1);
  assert.equal(c.improved[0].category, 'specificity');
});

test('conversation trimming preserves the most recent turns', () => {
  const messages = [
    { role: 'user', content: 'a'.repeat(50) },
    { role: 'assistant', content: 'b'.repeat(50) },
    { role: 'user', content: 'latest' }
  ];
  const trimmed = A.trimContext(messages, 60);
  assert.equal(trimmed.at(-1).content, 'latest');
  assert.ok(trimmed.reduce((n, x) => n + x.content.length, 0) <= 60);
});
