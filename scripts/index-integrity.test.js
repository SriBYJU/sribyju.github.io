import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const html = readFileSync(resolve('..', 'index.html'), 'utf8');
const prepApp = readFileSync(resolve('..', 'prep-v2-app.js'), 'utf8');

test('all inline scripts parse after the prep-engine replacement', () => {
  const scripts = [...html.matchAll(/<script((?![^>]*\bsrc=)[^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(match => !/\btype=["']module["']/i.test(match[1]))
    .map(match => match[2]);
  assert.ok(scripts.length > 0);
  scripts.forEach((source, index) => assert.doesNotThrow(() => new Function(source), `inline script ${index + 1} has invalid syntax`));
});

test('static page markup has unique ids', () => {
  const markup = html.replace(/<script[\s\S]*?<\/script>/gi, '');
  const ids = [...markup.matchAll(/\bid=["']([^"']+)["']/g)].map(match => match[1]);
  const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  assert.deepEqual(duplicates, []);
});

test('retired prep engine is absent and authenticated launchers are guarded', () => {
  for (const retired of ['PREP_QUESTIONS','SAT_EXAM_QUESTIONS','ACT_EXAM_QUESTIONS','function startExam(']) {
    assert.ok(!html.includes(retired), `${retired} should have been removed`);
  }
  assert.match(html, /const publicPages = \['home', 'features', 'about'\]/);
  assert.ok(!html.includes("showPage('prep');ScholarkPrep.init()"), 'prep launchers must not initialize behind a rejected sign-in gate');
});

test('prep state recovery does not hide empty catch blocks', () => {
  assert.doesNotMatch(prepApp, /catch\s*(?:\([^)]*\))?\s*\{\s*\}/, 'silent catch blocks make recovery failures impossible to diagnose');
});
