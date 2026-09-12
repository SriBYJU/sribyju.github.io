import { test, expect } from '@playwright/test';

const BASE = process.env.SCHOLARK_BASE_URL || 'http://127.0.0.1:4173';

async function waitForAI(page) {
  await page.waitForFunction(() => !!(
    window.ScholarkAI &&
    window.ScholarkAIAgents &&
    window.ScholarkAIContext &&
    window.ScholarkAIReliability &&
    window.ScholarkAIPractice &&
    window.ScholarkAIHealth &&
    window.ScholarkAIUI &&
    window.ScholarkAIPracticeUI
  ), null, { timeout: 25000 });
}

test.describe('Scholark AI local-first browser regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        Object.defineProperty(Navigator.prototype, 'gpu', { configurable: true, get: () => undefined });
      } catch (_) {}
    });
  });

  test('loads additively, keeps legacy state unchanged, and passes runtime health checks', async ({ page }) => {
    const aiConsoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && /scholark ai/i.test(msg.text())) aiConsoleErrors.push(msg.text());
    });

    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await waitForAI(page);

    await page.evaluate(() => {
      localStorage.setItem('gs_ci_sentinel', JSON.stringify({ keep: true, value: 'unchanged' }));
    });

    const report = await page.evaluate(() => window.ScholarkAIHealth.run());
    expect(report.pass, JSON.stringify(report.failed)).toBe(true);
    expect(report.failed).toEqual([]);

    const legacy = await page.evaluate(() => localStorage.getItem('gs_ci_sentinel'));
    expect(legacy).toBe(JSON.stringify({ keep: true, value: 'unchanged' }));
    expect(aiConsoleErrors).toEqual([]);
  });

  test('desktop S cinematic is built before the AI shell starts', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await waitForAI(page);

    const state = await page.evaluate(async () => {
      await window.ScholarkV3?.cinematicReady;
      const loader = window.ScholarkFeatureLoader?.state || {};
      return {
        portal: !!document.querySelector('.sk6-portal-object'),
        logoFace: !!document.querySelector('.sk6-logo-face'),
        experience: !!document.querySelector('.sk6-experience'),
        cinematicReadyAt: Number(loader.cinematicReadyAt || 0),
        aiBootStartedAt: Number(loader.aiBootStartedAt || 0),
        aiReadyAt: Number(loader.aiReadyAt || 0)
      };
    });

    expect(state.experience).toBe(true);
    expect(state.portal).toBe(true);
    expect(state.logoFace).toBe(true);
    expect(state.cinematicReadyAt).toBeGreaterThan(0);
    expect(state.aiBootStartedAt).toBeGreaterThanOrEqual(state.cinematicReadyAt);
    expect(state.aiReadyAt).toBeGreaterThanOrEqual(state.aiBootStartedAt);
  });

  test('the pinned WebLLM browser bundle imports without downloading model weights', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await waitForAI(page);

    const preflight = await page.evaluate(() => window.ScholarkAI.preflightRuntime());
    expect(preflight.webllmVersion).toBe('0.2.82');
    expect(preflight.runtimeSource).toContain('@mlc-ai/web-llm@0.2.82');
    expect(preflight.runtimeImport, JSON.stringify(preflight.error || {})).toBe('ok');
    expect(preflight.modelManifest.map(row => row.id)).toEqual([
      'Qwen3-1.7B-q4f16_1-MLC',
      'Qwen3-0.6B-q4f16_1-MLC',
      'SmolLM2-360M-Instruct-q4f32_1-MLC'
    ]);

    const reliability = await page.evaluate(() => ({
      rescue: window.ScholarkAIReliability.rescueModel.id,
      standardSequence: window.ScholarkAIReliability.sequenceFor({ modelTier: 'standard', saveData: false }, 'standard')
    }));
    expect(reliability.rescue).toBe('Llama-3.2-1B-Instruct-q4f16_1-MLC');
    expect(reliability.standardSequence).toEqual(['standard', 'rescue', 'low']);
  });

  test('Scholark product questions use grounded product knowledge instead of generic tutoring fallback', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await waitForAI(page);

    const result = await page.evaluate(() => window.ScholarkAIAgents.ask('Who made Scholark?'));
    expect(result.route.agent).toBe('knowledge');
    expect(result.generationKind).toBe('grounded-product-knowledge');
    expect(result.answer).toContain('Shriyan Avadhanula');
    expect(result.answer).toContain('student-built');
    expect(result.answer).not.toMatch(/break the task into three pieces|practice or course resource/i);
  });

  test('all specialists return useful compatibility-mode results with WebGPU unavailable', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await waitForAI(page);

    const results = await page.evaluate(async () => {
      const Agents = window.ScholarkAIAgents;
      const essayText = `The robotics cart stopped three inches before the line. I had assumed the sensor was broken, but the loose cable was my mistake. I rewired it, tested it again, and wrote down what changed. That small failure taught me to separate what I expected from what the data actually showed. Now, when a project goes wrong, I start by checking the evidence instead of defending my first guess. I still like building quickly, but I have learned that careful revision is part of building well.`;

      const tutor = await Agents.tutor.run('Explain quadratics simply and give me a check-for-understanding question.', { level: 'quick' });
      const essay = await Agents.essay.evaluate(essayText, 'Describe an experience that changed how you think.', { saveVersion: false });
      const planner = await Agents.planner.run({
        dailyMinutes: 60,
        days: 3,
        tasks: [
          { id: 'math', title: 'Math review', subject: 'Math', deadline: new Date(Date.now() + 86400000).toISOString(), importance: 90, mastery: 45, minutes: 35 },
          { id: 'history', title: 'History notes', subject: 'History', deadline: new Date(Date.now() + 4 * 86400000).toISOString(), importance: 60, mastery: 70, minutes: 25 }
        ]
      });
      const sat = await Agents.sat.run([
        { skill: 'Linear equations', correct: false, difficulty: 0.6, confidence: 0.5, errorType: 'concept_gap' },
        { skill: 'Linear equations', correct: true, difficulty: 0.5, confidence: 0.7 }
      ], {});
      const ap = await Agents.ap.run([
        { skill: 'AP Biology: Cell communication', correct: false, difficulty: 0.6, confidence: 0.5, errorType: 'concept_gap' },
        { skill: 'AP Biology: Cell communication', correct: true, difficulty: 0.5, confidence: 0.7 }
      ], {});
      const college = await Agents.college.run('Compare Alpha University and Beta College', {
        colleges: [
          { name: 'Alpha University', state: 'VA', programs: ['Data Science'], notes: 'Research option' },
          { name: 'Beta College', state: 'NC', programs: ['Economics'], notes: 'Small campus' }
        ]
      });
      const scholarship = await Agents.scholarship.run('Which stored scholarship has the earlier deadline?', {
        scholarships: [
          { name: 'Scholarship One', deadline: '2026-09-15', eligibility: ['Senior'], award: '$1,000' },
          { name: 'Scholarship Two', deadline: '2026-10-01', eligibility: ['Senior'], award: '$2,000' }
        ]
      });
      return {
        tutor: { mode: tutor.mode, answer: tutor.answer },
        essay: { mode: essay.mode, evaluation: essay.evaluation },
        planner: { mode: planner.mode, plan: planner.plan, answer: planner.answer },
        sat: { mode: sat.mode, answer: sat.answer, recommendation: sat.recommendation },
        ap: { mode: ap.mode, answer: ap.answer, recommendation: ap.recommendation },
        college: { mode: college.mode, answer: college.answer, rows: college.groundedRows },
        scholarship: { mode: scholarship.mode, answer: scholarship.answer, rows: scholarship.groundedRows }
      };
    });

    expect(results.tutor.mode).toBe('deterministic-fallback');
    expect(results.tutor.answer.length).toBeGreaterThan(40);
    expect(results.essay.mode).toBe('deterministic-fallback');
    expect(Object.keys(results.essay.evaluation.scores)).toHaveLength(13);
    expect(results.essay.evaluation.overall).toBeGreaterThanOrEqual(1);
    expect(results.essay.evaluation.overall).toBeLessThanOrEqual(10);
    expect(results.planner.plan.length).toBe(3);
    expect(results.planner.plan[0].blocks.length).toBeGreaterThan(0);
    expect(results.sat.recommendation).toBeTruthy();
    expect(results.ap.recommendation).toBeTruthy();
    expect(results.college.rows.length).toBe(2);
    expect(results.scholarship.rows.length).toBe(2);
  });

  test('adaptive practice grades verified items and never auto-grades open-ended retrieval', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await waitForAI(page);

    const outcome = await page.evaluate(() => {
      const P = window.ScholarkAIPractice;
      const session = P.createSession('linear equations', { count: 3, difficulty: 'mixed' });
      const first = session.questions[0];
      const graded = P.submit(session.id, first.id, first.answer, { confidence: 0.8 });
      const retrieval = P.makeQuestion('photosynthesis', 'mixed', 'ci-open');
      const retrievalGrade = P.grade(retrieval, 'Plants convert light energy into chemical energy.');
      return {
        count: session.questions.length,
        gradedCorrect: graded.correct,
        masteryScore: graded.mastery.score,
        retrievalGradable: retrieval.gradable,
        retrievalCorrect: retrievalGrade.correct
      };
    });

    expect(outcome.count).toBe(3);
    expect(outcome.gradedCorrect).toBe(true);
    expect(outcome.masteryScore).toBeGreaterThan(0);
    expect(outcome.retrievalGradable).toBe(false);
    expect(outcome.retrievalCorrect).toBeNull();
  });

  test('Ask Scholark routes creator questions correctly and adaptive-practice dialogs stay keyboard-accessible', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await waitForAI(page);

    await expect(page.locator('#sk-ai-launch')).toBeVisible();
    await page.locator('#sk-ai-launch').click();
    await expect(page.locator('#sk-ai-dialog')).toBeVisible();
    await expect(page.locator('#sk-ai-input')).toBeFocused();

    await page.locator('#sk-ai-input').fill('Who made Scholark?');
    await page.locator('#sk-ai-form').evaluate(form => form.requestSubmit());
    const assistant = page.locator('#sk-ai-transcript .sk-ai-message.assistant').last();
    await expect(assistant).toContainText('Shriyan Avadhanula', { timeout: 10000 });
    await expect(assistant).not.toContainText('Break the task into three pieces');

    await page.locator('#sk-ai-practice-launch').click();
    await expect(page.locator('#sk-practice-dialog')).toBeVisible();
    await expect(page.locator('#sk-practice-skill')).toBeFocused();
    await page.locator('#sk-practice-skill').fill('probability');
    await page.locator('#sk-practice-start').click();
    await expect(page.locator('#sk-practice-stage')).toBeVisible();
    await expect(page.locator('#sk-practice-stage h3')).toContainText(/probability|bag|chosen|mean|solve|find|what/i);
  });
});
