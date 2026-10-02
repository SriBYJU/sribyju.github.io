import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const html = readFileSync(resolve('..', 'index.html'), 'utf8');
const prepApp = readFileSync(resolve('..', 'prep-v2-app.js'), 'utf8');
const reviewFixtures = JSON.parse(readFileSync(resolve('..', 'scholark-review-fixtures.json'), 'utf8'));
const reviewApp = readFileSync(resolve('..', 'scholark-reviews.js'), 'utf8');

test('all inline scripts parse after the prep-engine replacement', () => {
  const scripts = [...html.matchAll(/<script((?![^>]*\bsrc=)[^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(match => {
      const type = match[1].match(/\btype=["']([^"']+)["']/i)?.[1]?.toLowerCase();
      return !type || type === 'text/javascript' || type === 'application/javascript';
    })
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
  assert.match(html, /const publicPages = \['home', 'features', 'about', 'reviews'\]/);
  assert.ok(!html.includes("showPage('prep');ScholarkPrep.init()"), 'prep launchers must not initialize behind a rejected sign-in gate');
});

test('prep state recovery does not hide empty catch blocks', () => {
  assert.doesNotMatch(prepApp, /catch\s*(?:\([^)]*\))?\s*\{\s*\}/, 'silent catch blocks make recovery failures impossible to diagnose');
});


test('reviews are public to read but account-gated to submit', () => {
  assert.match(html, /id="page-reviews"/);
  assert.match(html, /data-open-review-composer/);
  assert.match(reviewApp, /Sign in to leave a Scholark review/);
  assert.doesNotMatch(html, /id="review-name"/);
  assert.match(html, /exact review dates are not displayed/);
});

test('review preview fixtures are sanitized and month-only', () => {
  assert.equal(reviewFixtures.previewOnly, true);
  assert.ok(Array.isArray(reviewFixtures.reviews));
  assert.ok(reviewFixtures.reviews.length > 0);
  for (const review of reviewFixtures.reviews) {
    assert.deepEqual(Object.keys(review).sort(), ['body', 'createdMonth', 'displayName', 'rating']);
    assert.match(review.createdMonth, /^[0-9]{4}-(0[1-9]|1[0-2])$/);
    assert.ok(Number.isInteger(review.rating) && review.rating >= 1 && review.rating <= 5);
  }
});
