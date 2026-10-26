import { test, expect } from '@playwright/test';

const BASE = process.env.SCHOLARK_BASE_URL || 'http://127.0.0.1:4173';

async function waitForAI(page) {
  await page.waitForFunction(() => !!(
    window.ScholarkAI &&
    window.ScholarkAILearning &&
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
      'Qwen3-4B-q4f16_1-MLC',
      'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
      'Qwen3-0.6B-q4f32_1-MLC',
      'SmolLM2-360M-Instruct-q4f32_1-MLC'
    ]);

    const reliability = await page.evaluate(() => ({
      rescue: window.ScholarkAIReliability.rescueModel.id,
      readerSequence: window.ScholarkAIReliability.sequenceFor({ modelTier: 'standard' }, 'reader'),
      standardSequence: window.ScholarkAIReliability.sequenceFor({ modelTier: 'standard', saveData: false }, 'standard')
    }));
    expect(reliability.rescue).toBe('Llama-3.2-1B-Instruct-q4f16_1-MLC');
    expect(reliability.readerSequence).toEqual(['reader']);
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
    for (const input of ['who made u', 'Who created you?', 'who are you', 'scholark']) {
      const followUp = await page.evaluate(question => window.ScholarkAIAgents.ask(question), input);
      expect(followUp.route.agent, input).toBe('knowledge');
      expect(followUp.answer, input).toContain('Shriyan Avadhanula');
    }
    await page.evaluate(() => window.ScholarkAIUI.open());
    for (const input of ['who made u', 'scholark']) {
      await page.locator('#sk-ai-input').fill(input);
      await page.locator('#sk-ai-form').evaluate(form => form.requestSubmit());
      const reply = page.locator('#sk-ai-transcript .sk-ai-message.assistant').last();
      await expect(reply).toContainText('Shriyan Avadhanula');
      await expect(reply).not.toContainText('AP Computer Science');
    }
  });

  test('non-education requests redirect while academic questions remain available', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await waitForAI(page);
    const result = await page.evaluate(async () => {
      const Agents = window.ScholarkAIAgents;
      const rejected = await Promise.all([
        Agents.ask('What is your favorite Netflix show?'),
        Agents.ask('Recommend a good Netflix show'),
        Agents.ask('What should I watch tonight?')
      ]);
      return {
        rejected: rejected.map(item => ({ route: item.route.agent, answer: item.answer })),
        academic: [
          window.ScholarkAIAlgorithms.routeIntent('Explain a movie scene for my English class').agent,
          window.ScholarkAIAlgorithms.routeIntent('Help with AP Computer Science Principles').agent,
          window.ScholarkAIAlgorithms.routeIntent('What is 6 + 7?').agent
        ]
      };
    });
    for (const item of result.rejected) {
      expect(item.route).toBe('out-of-scope');
      expect(item.answer).toContain('outside Scholark');
      expect(item.answer).not.toMatch(/Netflix|show recommendation/i);
    }
    expect(result.academic).toEqual(['tutor', 'ap', 'tutor']);
    await page.evaluate(() => window.ScholarkAIUI.open());
    await page.locator('#sk-ai-input').fill('Recommend a good Netflix show');
    await page.locator('#sk-ai-form').evaluate(form => form.requestSubmit());
    const reply = page.locator('#sk-ai-transcript .sk-ai-message.assistant').last();
    await expect(reply).toContainText('outside Scholark');
    await expect(reply.locator('small')).toHaveText('Scholark assistant');
  });

  test('twenty-three distinct student scenarios reach the intended scope and specialist', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await waitForAI(page);
    const cases = [
      ['hey', 'greeting'], ['hello', 'greeting'],
      ['who made u', 'knowledge'], ['who created you', 'knowledge'],
      ['who are you', 'knowledge'], ['scholark', 'knowledge'],
      ['what is scholark?', 'knowledge'],
      ['Recommend a good Netflix show', 'out-of-scope'],
      ['What is your favorite Netflix show?', 'out-of-scope'],
      ['What should I watch tonight?', 'out-of-scope'],
      ['What should I cook?', 'out-of-scope'],
      ['Recommend a video game', 'out-of-scope'],
      ['How does photosynthesis work?', 'tutor'],
      ['What is 6 + 7?', 'tutor'], ['Explain fractions', 'tutor'],
      ['Help with AP Biology', 'ap'], ['How is my AP progress?', 'ap'],
      ['How is my SAT progress?', 'sat'], ['Make a study plan', 'planner'],
      ['Help with my essay', 'essay'], ['Compare colleges', 'college'],
      ['Find scholarships', 'scholarship'],
      ['Analyze a movie scene for my English class', 'tutor']
    ];
    const actual = await page.evaluate(inputs => inputs.map(input => window.ScholarkAIAlgorithms.routeIntent(input).agent), cases.map(item => item[0]));
    expect(actual).toEqual(cases.map(item => item[1]));
  });

  test('forty-plus varied product, scope, and academic phrasings route without invented product claims', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await waitForAI(page);
    const cases = [
      ['what are the different types of AIs in this Scholark?', 'knowledge'],
      ['What AI agents does ScholarK have?', 'knowledge'],
      ['List the AI tools in this app', 'knowledge'],
      ['Which assistants are in this chat?', 'knowledge'],
      ['How does Scholar K AI work?', 'knowledge'],
      ['What models power your chat?', 'knowledge'],
      ['Are you machine learning or deep learning?', 'knowledge'],
      ['Does Scholark use computer vision?', 'knowledge'],
      ['Can this chat see photos?', 'knowledge'],
      ['Does your AI have a camera?', 'knowledge'],
      ['Where does Scholark AI run?', 'knowledge'],
      ['Is Scholark AI on a server?', 'knowledge'],
      ['What does the backend do in Scholark?', 'knowledge'],
      ['How does your essay grader work?', 'knowledge'],
      ['How does Scholark score my activities?', 'knowledge'],
      ['Can Scholark help me prepare for the ACT?', 'knowledge'],
      ['What is the admissions reader AI?', 'knowledge'],
      ['Who made this app?', 'knowledge'],
      ['What can Scholark do?', 'knowledge'],
      ["What's McDonald's most popular order?", 'out-of-scope'],
      ['What is in a Big Mac?', 'out-of-scope'],
      ['Recommend a Starbucks drink', 'out-of-scope'],
      ['Where should I get pizza tonight?', 'out-of-scope'],
      ['Which restaurant is best?', 'out-of-scope'],
      ['What is the best burger?', 'out-of-scope'],
      ['What should I eat for dinner?', 'out-of-scope'],
      ['Suggest a recipe for tonight', 'out-of-scope'],
      ['What is the weather tomorrow?', 'out-of-scope'],
      ['Where should I travel for vacation?', 'out-of-scope'],
      ['Which movie should I watch?', 'out-of-scope'],
      ['What is your favorite song?', 'out-of-scope'],
      ['What was the sports score?', 'out-of-scope'],
      ["Research McDonald's most popular order", 'out-of-scope'],
      ['Analyze McDonald\'s marketing for my economics class', 'tutor'],
      ['Use a burger price in a math word problem', 'tutor'],
      ['Analyze a movie for history class', 'tutor'],
      ['Can you recommend a Netflix show for my college essay?', 'out-of-scope'],
      ["Find the nearest McDonald's to me", 'out-of-scope'],
      ['Find the nearest McDonald’s to my college.', 'out-of-scope'],
      ['What is the nearest McDonalds to my college?', 'out-of-scope'],
      ["For a college class, what is McDonald's most popular order?", 'out-of-scope'],
      ['I have a school project. Recommend a Netflix show.', 'out-of-scope'],
      ['Analyze the themes in a Netflix show for my media studies class.', 'tutor'],
      ['How can I get you to write my essay for me?', 'authorship-boundary'],
      ['Please revise my college essay into a better essay.', 'authorship-boundary'],
      ['Can your AI explain photosynthesis?', 'tutor'],
      ['Can Scholark AI help me with SAT math?', 'sat'],
      ['Explain photosynthesis', 'tutor'],
      ['What is 6 + 7?', 'tutor'],
      ['Help with AP biology', 'ap'],
      ['Help me prepare for the SAT', 'sat'],
      ['Compare colleges', 'college'],
      ['Find scholarships', 'scholarship'],
      ['Write my college admissions essay for me', 'authorship-boundary']
    ];
    const actual = await page.evaluate(inputs => inputs.map(input => window.ScholarkAIAlgorithms.routeIntent(input).agent), cases.map(item => item[0]));
    expect(actual).toEqual(cases.map(item => item[1]));

    const groundedCases = cases.filter(([, agent]) => agent === 'knowledge' || agent === 'out-of-scope');
    const groundedAnswers = await page.evaluate(async inputs => Promise.all(inputs.map(input => window.ScholarkAIAgents.ask(input))), groundedCases.map(([input]) => input));
    expect(groundedAnswers).toHaveLength(groundedCases.length);
    groundedAnswers.forEach((answer, index) => {
      expect(answer.route.agent, groundedCases[index][0]).toBe(groundedCases[index][1]);
      expect(answer.answer.trim(), groundedCases[index][0]).not.toBe('');
      expect(answer.mode, groundedCases[index][0]).toBe('grounded-local');
      if (answer.route.agent === 'out-of-scope') expect(answer.answer).toContain('outside Scholark');
    });

    const answers = await page.evaluate(async () => {
      const ask = window.ScholarkAIAgents.ask;
      return Promise.all([
        'what are the different types of AIs in this Scholark?',
        'Does Scholark use computer vision?',
        "What's McDonald's most popular order?",
        'Write my college admissions essay for me'
      ].map(async input => ({ input, ...(await ask(input)) })));
    });
    expect(answers[0].answer).toMatch(/tutor|admissions essay reader/i);
    expect(answers[0].answer).toMatch(/task-specific instructions|small language models/i);
    expect(answers[0].answer).not.toMatch(/image recognition specialist|camera vision specialist/i);
    expect(answers[1].answer).toMatch(/does not analyze camera/i);
    expect(answers[2].answer).toMatch(/outside Scholark/i);
    expect(answers[2].answer).not.toMatch(/Big Mac/i);
    expect(answers[3].answer).toMatch(/cannot write an admissions essay/i);
    const productAndBoard = await page.evaluate(async () => Promise.all([
      window.ScholarkAIAgents.ask('How does Scholark score my activities?'),
      window.ScholarkAIAgents.ask('What is College Board?')
    ]));
    expect(productAndBoard[0].answer).toContain('composite reference profiles');
    expect(productAndBoard[1].answer).toContain('SAT and AP programs');

    await page.evaluate(() => window.ScholarkAIUI.open());
    for (const [input, expected] of [
      ['what are the different types of AIs in this Scholark?', /study tutor|admissions essay reader/i],
      ["What's McDonald's most popular order?", /outside Scholark/i]
    ]) {
      await page.locator('#sk-ai-input').fill(input);
      await page.locator('#sk-ai-form').evaluate(form => form.requestSubmit());
      await expect(page.locator('#sk-ai-transcript .sk-ai-message.assistant').last()).toContainText(expected);
    }
  });

  test('foundational answers avoid observed science, writing, and SAT hallucinations', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await waitForAI(page);
    const answers = await page.evaluate(async () => {
      const ask = window.ScholarkAIAgents.ask;
      return Promise.all([
        'How does photosynthesis work?', 'What does DNA do?',
        'What is the difference between a metaphor and a simile?',
        'How do I write a thesis statement?',
        'Explain subject-verb agreement for the SAT.',
        'How can I improve my college essay?',
        'Why did World War I start?',
        'Why is 1/2 + 1/4 equal to 3/4?'
      ].map(async input => ({ input, ...(await ask(input)) })));
    });
    expect(answers).toHaveLength(8);
    expect(answers.every(item => item.generationKind === 'verified-learning')).toBe(true);
    expect(answers[0].answer).toContain('6 CO₂ + 6 H₂O');
    expect(answers[1].answer).toContain('RNA');
    expect(answers[6].answer).toContain('Germany fought with Austria-Hungary');
    expect(answers[7].answer).toContain('2/4 + 1/4 = 3/4');
    expect(answers[2].answer).toContain('classroom was a beehive');
    expect(answers[2].answer).toContain('classroom was like a beehive');
    expect(answers[3].answer).not.toMatch(/study conducted in 2023|according to a study/i);
    expect(answers[4].answer).toContain('The students write');
    expect(answers[5].answer).toContain('college personal statement');
  });

  test('one AP answer never becomes a false mastery diagnosis', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await waitForAI(page);
    const result = await page.evaluate(async () => {
      const originalState = window.ScholarkAP?.getState;
      const originalGenerate = window.ScholarkAI.generate;
      window.ScholarkAP = window.ScholarkAP || {};
      window.ScholarkAP.getState = () => ({ subjects: {
        'ap-computer-science-principles': { responses: [{ unitIndex: 0, correct: true, confidence: 2 }] }
      } });
      window.ScholarkAI.generate = () => { throw new Error('A single response must not trigger model inference'); };
      try { return await window.ScholarkAIAgents.ask('How is my AP progress?'); }
      finally {
        window.ScholarkAP.getState = originalState;
        window.ScholarkAI.generate = originalGenerate;
      }
    });
    expect(result.mode).toBe('grounded-local');
    expect(result.answer).toContain('too little evidence to judge mastery');
    expect(result.answer).not.toMatch(/high level of mastery|mastered the concept/i);
    const scoreClaim = await page.evaluate(() => window.ScholarkAIAgents.ask('I got 18/18 in AP CSP. Does that mean I mastered the whole unit?'));
    expect(scoreClaim.answer).toContain('AP Computer Science Principles');
    expect(scoreClaim.answer).toContain('does not establish mastery');
    expect(scoreClaim.answer).not.toContain('Advanced Placement Chemistry');
    const falsePremise = await page.evaluate(() => window.ScholarkAIAgents.ask('My teacher says a residual is a useful linear model. Is that true?'));
    expect(falsePremise.answer).toMatch(/^No\./);
    expect(falsePremise.answer).toContain('observed value minus');
  });

  test('specialists reject off-target model prose and use verified source data', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await waitForAI(page);
    const answers = await page.evaluate(async () => {
      const AI = window.ScholarkAI;
      const Agents = window.ScholarkAIAgents;
      const original = AI.generate;
      AI.generate = async (_messages, options) => ({
        mode: 'local-generative', tier: 'standard', text: {
          sat: 'Concept gap. Do prerequisite_review.',
          ap: 'concept_gap and prerequisite_review.',
          planner: 'Math review for 30 minutes. **dayOffset**=0. **Priority**: 20.',
          college: "Scholark's current dataset does not include it.",
          scholarship: 'Scholarship One needs a transcript and recommendation.'
        }[options.agent] || 'generic answer'
      });
      try {
        const practice = [
          { skill: 'Linear equations', correct: false, errorType: 'concept_gap' },
          { skill: 'Linear equations', correct: false, errorType: 'concept_gap' },
          { skill: 'Linear equations', correct: true }
        ];
        const sat = await Agents.sat.run(practice, {});
        const ap = await Agents.ap.run(practice.map(row => ({ ...row, skill: 'AP Biology: Cell communication' })), {});
        const planner = await Agents.planner.run({ dailyMinutes: 45, days: 2, tasks: [
          { id: 'math', title: 'Math review', deadline: new Date(Date.now() + 86400000).toISOString(), minutes: 30 }
        ] });
        const college = await Agents.college.run('Compare Alpha University and Beta College', { colleges: [
          { name: 'Alpha University', state: 'VA', programs: ['Data Science'] },
          { name: 'Beta College', state: 'NC', programs: ['Economics'] }
        ] });
        const scholarship = await Agents.scholarship.run('Which has the earlier deadline?', { scholarships: [
          { name: 'Scholarship One', deadline: '2026-09-15' },
          { name: 'Scholarship Two', deadline: '2026-10-01' }
        ] });
        return { sat, ap, planner, college, scholarship };
      } finally { AI.generate = original; }
    });
    expect(answers.sat.answer).toContain('Linear equations');
    expect(answers.ap.answer).toContain('AP Biology: Cell communication');
    expect(answers.sat.answer + answers.ap.answer).not.toMatch(/concept_gap|prerequisite_review/);
    expect(answers.planner.answer.match(/Math review/g)).toHaveLength(1);
    expect(answers.planner.mode).toBe('grounded-local');
    expect(answers.planner.answer).not.toMatch(/dayOffset|Priority/);
    expect(answers.college.answer).toContain('Alpha University');
    expect(answers.college.answer).toContain('Beta College');
    expect(answers.scholarship.answer).toContain('Scholarship One has the earlier stored deadline');
    expect(answers.scholarship.answer).not.toContain('transcript');
    const clarification = await page.evaluate(() => window.ScholarkAIAgents.ask('Compare colleges'));
    expect(clarification.answer).toContain('Name two colleges');
  });

  test('essay evaluation uses a demanding admissions reader prompt with local rubric scores', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await waitForAI(page);
    const review = await page.evaluate(async () => {
      const AI = window.ScholarkAI;
      const original = AI.generateStructured;
      let prompt = '';
      AI.generateStructured = async messages => {
        prompt = messages[0].content;
        return {
          mode: 'local-generative', tier: 'standard',
          value: {
            strongest_element: '“The robotics cart stopped” is a concrete opening that puts you in a specific moment.',
            biggest_weakness: 'The ending summarizes the lesson without showing a later choice.',
            reader_thought: 'The cable repair is memorable; the reflection needs a more specific consequence.',
            improvements: ['Show a later test.', 'Replace the general closing claim.', 'Connect the revision to the prompt.']
          }
        };
      };
      try {
        const essay = 'The robotics cart stopped three inches before the line. I had assumed the sensor was broken, but the loose cable was my mistake. I rewired it, tested it again, and wrote down what changed. That small failure taught me to separate what I expected from what the data actually showed. Now, when a project goes wrong, I start by checking the evidence instead of defending my first guess. I still like building quickly, but I have learned that careful revision is part of building well.';
        const result = await window.ScholarkAIAgents.essay.evaluate(essay, 'Describe an experience that changed how you think.', { saveVersion: false });
        return { prompt, result };
      } finally { AI.generateStructured = original; }
    });
    expect(review.prompt).toMatch(/demanding college admissions essay reader simulation/i);
    expect(review.prompt).toMatch(/specific scenes|reflection|prompt fit|clichés/i);
    expect(review.prompt).toContain('quote 3-7 consecutive words actually in the draft');
    expect(review.result.mode).toBe('local-generative');
    expect(review.result.evaluation.overall).toBeGreaterThanOrEqual(1);
    expect(Object.keys(review.result.evaluation.scores)).toHaveLength(13);
    expect(review.result.evaluation.biggest_weakness).toBe('The ending summarizes the lesson without showing a later choice.');
  });

  test('essay reader rejects generic or invented model notes and keeps evidence-based rubric review', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await waitForAI(page);
    const review = await page.evaluate(async () => {
      const AI = window.ScholarkAI;
      const original = AI.generateStructured;
      AI.generateStructured = async () => ({
        mode: 'local-generative', tier: 'standard',
        value: {
          strongest_element: 'reflection and growth', biggest_weakness: 'clichés',
          reader_thought: 'The phrase "I was born to lead" is memorable.',
          improvements: ['Add detail.', 'Improve the voice.', 'Make it clearer.']
        }
      });
      try {
        const essay = 'The robotics cart stopped three inches before the line. I had assumed the sensor was broken, but the loose cable was my mistake. I rewired it, tested it again, and wrote down what changed. That small failure taught me to separate what I expected from what the data actually showed. Now, when a project goes wrong, I start by checking the evidence instead of defending my first guess. I still like building quickly, but I have learned that careful revision is part of building well.';
        const result = await window.ScholarkAIAgents.essay.evaluate(essay, '', { saveVersion: false });
        AI.generateStructured = async () => ({
          mode: 'local-generative', tier: 'standard',
          value: {
            strongest_element: '“The robotics cart stopped” makes an opening.',
            biggest_weakness: 'I need to improve my ability to reflect on my mistakes.',
            reader_thought: 'This shows growth.',
            improvements: ['I should be more reflective.', 'I can include examples.', 'I need to improve my writing.']
          }
        });
        const applicantVoice = await window.ScholarkAIAgents.essay.evaluate(essay, '', { saveVersion: false });
        return { mode: result.mode, reason: result.reason, notes: result.evaluation, applicantVoice: applicantVoice.mode };
      } finally { AI.generateStructured = original; }
    });
    expect(review.mode).toBe('deterministic-fallback');
    expect(review.reason).toBe('ungrounded-essay-feedback');
    expect(review.notes.strongest_element).toContain('robotics cart');
    expect(review.notes.reader_thought).not.toContain('I was born to lead');
    expect(review.applicantVoice).toBe('deterministic-fallback');
  });

  test('essay follow-up keeps student authorship', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await waitForAI(page);
    const review = await page.evaluate(() => window.ScholarkAIAgents.essay.followUp('Rewrite my opening paragraph for me'));
    expect(review.generationKind).toBe('authorship-guidance');
    expect(review.answer).toMatch(/cannot write application prose/i);
    const short = await page.evaluate(() => window.ScholarkAIAgents.essay.followUp('Please polish this sentence: I was really very nervous.'));
    expect(short.generationKind).toBe('short-wording-coach');
    expect(short.answer).toContain('I was nervous.');
    const missing = await page.evaluate(() => window.ScholarkAIAgents.ask('Can you rephrase this sentence from my essay?'));
    expect(missing.answer).toContain('Share one exact sentence');
    const entire = await page.evaluate(() => window.ScholarkAIAgents.ask('Can you rewrite every sentence in my essay?'));
    expect(entire.generationKind).toBe('authorship-guidance');
  });

  test('tutor calculates directly and grounds matching concepts in inspectable course notes', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await waitForAI(page);
    const result = await page.evaluate(async () => {
      const original = window.ScholarkAI.generate;
      let calls = 0, prompt = '';
      window.ScholarkAI.generate = async messages => {
        calls++; prompt = messages[0].content;
        return { mode: 'local-generative', tier: 'standard', text: 'Random assignment supports causal conclusions; random sampling supports generalization to a population.' };
      };
      try {
        const math = await window.ScholarkAIAgents.ask('What is (12 + 8) / 4?');
        const fractions = await window.ScholarkAIAgents.ask('Explain 7/12 + 1/8 with each step checked.');
        const callsAfterMath = calls;
        const concept = await window.ScholarkAIAgents.ask('Explain random assignment and random sampling');
        return { math, fractions, callsAfterMath, concept, prompt };
      } finally { window.ScholarkAI.generate = original; }
    });
    expect(result.callsAfterMath).toBe(0);
    expect(result.math.answer).toContain('= 5');
    expect(result.fractions.answer).toContain('17/24');
    expect(result.fractions.answer).not.toContain('= 0.83');
    expect(result.concept.sources).toHaveLength(2);
    const assignment = result.concept.sources.find(note => note.name === 'random assignment');
    expect(assignment.text).toMatch(/causal/);
    expect(result.prompt).toContain(assignment.text);
    expect(result.prompt).toContain('Random sampling supports generalization');
    expect(result.prompt).not.toContain('Creative Development');
  });

  test('structured generation constrains JSON, preserves source during repair, and uses model-specific controls', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await waitForAI(page);
    const result = await page.evaluate(async () => {
      const AI = window.ScholarkAI;
      const requests = [];
      AI.detectDevice = () => ({ generative: true, modelTier: 'standard', wasm: false });
      AI.state.modelId = 'Llama-3.2-1B-Instruct-q4f16_1-MLC';
      AI.loadModel = async () => ({ chat: { completions: { create: async request => {
        requests.push(request);
        return { choices: [{ message: { content: requests.length === 1 ? 'This is not valid JSON.' : '{"note":"The original source remains available."}' } }] };
      } } } });
      const schema = { type: 'object', properties: { note: { type: 'string' } }, required: ['note'] };
      const structured = await AI.generateStructured([
        { role: 'system', content: 'Review the provided draft.' },
        { role: 'user', content: 'Original essay: repairing the robotics cart taught me to check the cable.' }
      ], { agent: 'essay', schema, maxTokens:850, validate: value => ({ valid: typeof value?.note === 'string', errors:['A note string is required.'] }) });
      AI.state.modelId = 'Qwen3-0.6B-q4f32_1-MLC';
      await AI.generate([{ role: 'user', content: 'Explain robotics.' }]);
      return { structured, requests };
    });
    expect(result.structured.mode).toBe('local-generative');
    expect(result.structured.repaired).toBe(true);
    expect(result.requests[0].response_format.type).toBe('json_object');
    expect(JSON.parse(result.requests[0].response_format.schema).required).toEqual(['note']);
    expect(result.requests[0].extra_body).toBeUndefined();
    expect(result.requests[1].messages.some(message => message.content.includes('Original essay: repairing the robotics cart'))).toBe(true);
    expect(result.requests[1].messages.at(-1).content).toContain('A note string is required.');
    expect(result.requests[1].max_tokens).toBe(850);
    expect(result.requests[2].extra_body).toEqual({ enable_thinking: false });
  });

  test('the shared local runtime serializes requests and drops cancelled queued work', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await waitForAI(page);
    const result = await page.evaluate(async () => {
      const AI = window.ScholarkAI;
      let started, finish, count = 0, active = 0, maximum = 0;
      const firstStarted = new Promise(resolve => { started = resolve; });
      AI.detectDevice = () => ({ generative: true, modelTier: 'standard', wasm: false });
      AI.loadModel = async () => ({ chat: { completions: { create: async () => {
        count++; active++; maximum = Math.max(maximum, active);
        if (count === 1) { started(); await new Promise(resolve => { finish = resolve; }); }
        active--;
        return { choices: [{ message: { content: count === 1 ? 'The stale answer should be discarded.' : 'The new answer is ready.' } }] };
      } } } });
      const ask = text => AI.generate([{ role: 'user', content: text }]).catch(error => ({ error: error.message }));
      const first = ask('First question');
      await firstStarted;
      const staleQueued = ask('Old queued question');
      AI.cancelGeneration();
      const fresh = ask('New question');
      finish();
      return { results: await Promise.all([first, staleQueued, fresh]), count, maximum };
    });
    expect(result.count).toBe(2);
    expect(result.maximum).toBe(1);
    expect(result.results[0].error).toBe('generation-cancelled');
    expect(result.results[1].error).toBe('generation-cancelled');
    expect(result.results[2].text).toBe('The new answer is ready.');
  });

  test('new conversation cancels an outstanding reply and prevents stale text from appearing', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await waitForAI(page);
    await page.evaluate(() => {
      window.ScholarkAIAgents.ask = (_input, context) => new Promise(resolve => {
        window.__pendingChatSignal = context.signal;
        window.__finishPendingChat = () => resolve({ mode: 'local-generative', answer: 'Stale reply from the old conversation.' });
      });
      window.ScholarkAIUI.open();
    });
    await page.locator('#sk-ai-input').fill('Explain osmosis');
    await page.locator('#sk-ai-form').evaluate(form => form.requestSubmit());
    await page.waitForFunction(() => !!window.__finishPendingChat);
    await page.locator('.sk-ai-new').click();
    expect(await page.evaluate(() => window.__pendingChatSignal.aborted)).toBe(true);
    await page.evaluate(() => window.__finishPendingChat());
    await expect(page.locator('#sk-ai-transcript')).toContainText('Fresh conversation');
    await expect(page.locator('#sk-ai-transcript')).not.toContainText('Stale reply');
    await expect(page.locator('.sk-ai-send')).toBeEnabled();
    await expect(page.locator('#sk-ai-progress')).toBeHidden();
  });

  test('casual chat does not include unrelated AP mastery or active page in tutor prompt', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await waitForAI(page);
    await page.evaluate(() => {
      window.ScholarkAIAgents.mastery.update('AP Computer Science Principles: Unit 1 - Creative Development', { correct: true });
      document.querySelector('.page.active')?.classList.remove('active');
      document.querySelector('#page-ap')?.classList.add('active');
      window.__capturedTutorMessages = [];
      window.ScholarkAI.generate = async messages => {
        window.__capturedTutorMessages.push(messages);
        return { mode: 'local-generative', tier: 'standard', text: 'Volcanoes form when magma rises to the surface.' };
      };
    });
    await page.evaluate(() => window.ScholarkAIUI.open());
    await page.locator('#sk-ai-input').fill('hey');
    await page.locator('#sk-ai-form').evaluate(form => form.requestSubmit());
    await expect(page.locator('#sk-ai-transcript .sk-ai-message.assistant').last()).toContainText('Scholark’s study assistant');
    expect(await page.evaluate(() => window.__capturedTutorMessages.length)).toBe(0);
    await page.locator('#sk-ai-input').fill('How do volcanoes form?');
    await page.locator('#sk-ai-form').evaluate(form => form.requestSubmit());
    await expect(page.locator('#sk-ai-transcript .sk-ai-message.assistant').last()).toContainText('Volcanoes form');
    const messages = await page.evaluate(() => window.__capturedTutorMessages[0]);
    expect(JSON.stringify(messages)).not.toMatch(/Creative Development|AP course|mastery_anon|"mastery":/i);
    await page.locator('#sk-ai-input').fill('Help me understand my AP Computer Science Principles code');
    await page.locator('#sk-ai-form').evaluate(form => form.requestSubmit());
    await expect(page.locator('#sk-ai-transcript .sk-ai-message.assistant').last()).toContainText('Volcanoes form');
    const apMessages = await page.evaluate(() => window.__capturedTutorMessages[1]);
    expect(JSON.stringify(apMessages)).toContain('Help me understand my AP Computer Science Principles code');
    expect(JSON.stringify(apMessages)).not.toContain('Creative Development');
    await page.locator('#sk-ai-input').fill('explain that');
    await page.locator('#sk-ai-form').evaluate(form => form.requestSubmit());
    await expect(page.locator('#sk-ai-transcript .sk-ai-message.assistant').last()).toContainText('Volcanoes form');
    const followUp = await page.evaluate(() => window.__capturedTutorMessages[2]);
    expect(followUp.at(-3).content).toBe('Help me understand my AP Computer Science Principles code');
    expect(followUp.at(-1).content).toBe('explain that');
    await page.locator('#sk-ai-dialog .sk-ai-new').click();
    await page.locator('#sk-ai-input').fill('explain that');
    await page.locator('#sk-ai-form').evaluate(form => form.requestSubmit());
    await expect(page.locator('#sk-ai-transcript .sk-ai-message.assistant').last()).toContainText('Volcanoes form');
    expect(await page.evaluate(() => window.__capturedTutorMessages[3])).toHaveLength(2);
  });

  test('assistant replies render lists and emphasis without exposing HTML', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await waitForAI(page);
    await page.evaluate(() => {
      window.__formatExecuted = false;
      window.ScholarkAIAgents.ask = async () => ({
        mode: 'local-generative', tier: 'standard', route: { agent: 'tutor' },
        sources: [{ name: 'Energy', subject: 'Chemistry', text: 'Breaking bonds requires energy.', url: 'https://openstax.org/books/chemistry-2e/pages/7-5-strengths-of-ionic-and-covalent-bonds', sourceLabel: 'OpenStax Chemistry 2e' }, { name: 'Untrusted link', text: '<img src=x>', url: 'javascript:alert(1)' }],
        answer: 'To solve 6 + 7:\n\n1. **Add the numbers**: 6 + 7 = 13.\n2. **Result**: 13.\n\nSo, the answer is 13.\n\n$ \\frac{1}{2} + \\frac{1}{4} = \\frac{3}{4} $. A scholarship award is $20.\n\n$$\n\\frac{2}{4} + \\frac{1}{4} = \\frac{3}{4}\n$$\n\n<img src=x onerror="window.__formatExecuted=true">'
      });
    });
    await page.evaluate(() => window.ScholarkAIUI.open());
    await page.locator('#sk-ai-input').fill('What is 6 + 7?');
    await page.locator('#sk-ai-form').evaluate(form => form.requestSubmit());
    const reply = page.locator('#sk-ai-transcript .sk-ai-message.assistant > div').last();
    await expect(reply.locator('ol li')).toHaveCount(2);
    await expect(reply.locator('strong').first()).toHaveText('Add the numbers');
    await expect(reply).toContainText('So, the answer is 13.');
    await expect(reply).not.toContainText('**');
    await expect(reply).toContainText('1/2 + 1/4 = 3/4');
    await expect(reply).toContainText('$20');
    await expect(reply).not.toContainText('\\frac');
    await expect(reply).not.toContainText('$$');
    await expect(reply.locator('img')).toHaveCount(0);
    expect(await page.evaluate(() => window.__formatExecuted)).toBe(false);
    await expect(page.locator('.sk-ai-sources a')).toHaveCount(1);
    await expect(page.locator('.sk-ai-sources a')).toHaveAttribute('href', /https:\/\/openstax.org\//);
    await expect(page.locator('.sk-ai-sources img')).toHaveCount(0);
  });

  test('local answer quality rejects incorrect worked fraction examples', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await waitForAI(page);
    const checks = await page.evaluate(() => {
      const question = [{ role: 'user', content: 'Can you explain SAT fractions?' }];
      const weak = window.ScholarkAIReliability.isWeakAnswer;
      return {
        incorrect: weak('For example, 2/3 + 1/3 = 2/9.', question),
        incorrectWhole: weak('For example, 1/2 + 1/2 = 2.', question),
        incorrectProse: weak('If you have a fraction 2/3, you can add it to 1/3 to get 2/9.', question),
        inventedAcronym: weak('SAT (Solving and Analyzing Test) fractions use common denominators.', question),
        correct: weak('For example, 2/3 + 1/3 = 1.', question)
      };
    });
    expect(checks).toEqual({ incorrect: true, incorrectWhole: true, incorrectProse: true, inventedAcronym: true, correct: false });
  });

  test('all specialists retain useful guided results when local inference is unavailable', async ({ page }) => {
    await page.addInitScript(() => { Object.defineProperty(window, 'WebAssembly', { configurable: true, value: undefined }); });
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

test.describe('Admissions reader button integration', () => {
  const draft = 'The blue bottle rattled against the kettle. I opened the calendar and called the pharmacist. I was nervous. I realized that my assumptions had kept me from listening. Now I ask first.';
  async function openEssay(page) {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => ScholarkAdmissions.open('essay'));
    await page.locator('#essay-textarea').fill(draft);
    await page.locator('#feedback-btn').click();
    await expect(page.locator('#sk-ai-overall b')).toHaveText(/\d\.\d/);
  }
  test('workspace button fills the expanded rubric without a model and clears stale results', async ({ page }) => {
    await page.route(/huggingface|mlc\.ai/, route => route.abort());
    await openEssay(page);
    await expect(page.locator('#sk-ai-score-matrix .sk-ai-score-row')).toHaveCount(13);
    await expect(page.locator('#sk-ai-essay-status')).toContainText('Local rubric complete');
    await expect(page.locator('#sk-ai-essay-insights')).toContainText('blue bottle');
    await page.locator('#essay-textarea').fill('Short draft.');
    await expect(page.locator('#sk-ai-overall b')).toHaveText('—');
    await expect(page.locator('#sk-ai-essay-follow')).toBeHidden();
    await page.locator('#feedback-btn').click();
    await expect(page.locator('#sk-ai-essay-status')).toContainText('at least 100 characters');
    await page.locator('#essay-textarea').fill(draft);
    await page.locator('#feedback-btn').click();
    await expect(page.locator('#sk-ai-overall b')).toHaveText(/\d\.\d/);
    await page.locator('#essay-prompt').selectOption({ index: 1 });
    await expect(page.locator('#sk-ai-overall b')).toHaveText('—');
  });
  test('reader failure preserves rubric and late results cannot replace an edited draft', async ({ page }) => {
    await openEssay(page);
    await page.evaluate(() => {
      const original = ScholarkAIAgents.essay.evaluate;
      window.__readerOriginal = original;
      ScholarkAIAgents.essay.evaluate = (text, prompt, options) => options?.rubricOnly
        ? original(text, prompt, options)
        : Promise.reject(new Error('test model unavailable'));
    });
    await page.locator('#sk-ai-essay-enhance').click();
    await expect(page.locator('#sk-ai-essay-status')).toContainText('complete local rubric remains');
    await expect(page.locator('#sk-ai-overall b')).toHaveText(/\d\.\d/);
    await expect(page.locator('#sk-ai-essay-enhance')).toBeEnabled();
    await page.evaluate(() => {
      ScholarkAIAgents.essay.evaluate = (text, prompt, options) => options?.rubricOnly
        ? window.__readerOriginal(text, prompt, options)
        : new Promise(resolve => { window.__releaseOldReview = async () => resolve(await window.__readerOriginal(text, prompt, { rubricOnly: true, saveVersion: false })); });
    });
    await page.locator('#sk-ai-essay-enhance').click();
    await expect(page.locator('#sk-ai-essay-enhance')).toBeDisabled();
    await page.locator('#essay-textarea').fill('A completely changed draft.');
    await page.evaluate(() => window.__releaseOldReview());
    await expect(page.locator('#sk-ai-overall b')).toHaveText('—');
    await expect(page.locator('#sk-ai-essay-status')).toContainText('Draft or prompt changed');
    await expect(page.locator('#sk-ai-essay-insights')).toBeEmpty();
    await expect(page.locator('#sk-ai-essay-detail')).toHaveAttribute('aria-busy', 'false');
  });
});

test('essay reader JSON stays validated without grammar constraints or smaller-model fallback',async({page})=>{
 await page.goto(BASE,{waitUntil:'domcontentloaded'});await waitForAI(page);
 const result=await page.evaluate(async()=>{
  const AI=ScholarkAI,requests=[],tiers=[];
  AI.detectDevice=()=>({generative:true,modelTier:'standard',wasm:false});
  AI.state.modelId='Qwen3-4B-q4f16_1-MLC';
  AI.loadModel=async tier=>{tiers.push(tier);return{chat:{completions:{create:async request=>{requests.push(request);return{choices:[{message:{content:requests.length===1?'{"note":"invented"}':'{"note":"grounded in draft"}'}}]};}}}};};
  const output=await AI.generateStructured([{role:'system',content:'Return JSON with a note about the draft.'},{role:'user',content:'My draft is about listening at the library.'}],{modelTier:'reader',schemaMode:'prompt',schema:{type:'object'},validate:v=>({valid:v?.note==='grounded in draft',errors:['Only grounded evidence is allowed.']}),fallback:null});
  return{output,requests,tiers};
 });
 expect(result.output.mode).toBe('local-generative');expect(result.output.repaired).toBe(true);
 expect(result.tiers).toEqual(['reader','reader']);expect(result.requests.every(r=>!r.response_format)).toBe(true);
 expect(result.requests[1].messages.at(-1).content).toContain('Only grounded evidence');
 expect(result.requests[0].extra_body).toEqual({enable_thinking:false});
});
