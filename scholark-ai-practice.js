(() => {
  'use strict';
  if (window.__scholarkAIPracticeInstalled) return;
  window.__scholarkAIPracticeInstalled = true;

  const AI = window.ScholarkAI;
  const Agents = window.ScholarkAIAgents;
  const A = window.ScholarkAIAlgorithms;
  if (!AI || !Agents || !A) return;

  const VERSION = '1.0.0';
  const MAX_SESSIONS = 30;
  const escText = value => String(value ?? '').trim();

  function uid() {
    return window.currentUser?.uid || window._gsUser?.uid || 'local';
  }

  function key() { return `practice_sessions_${uid()}`; }

  function sessions() {
    const value = AI.storage.read(key(), []);
    return Array.isArray(value) ? value : [];
  }

  function saveSessions(value) {
    AI.storage.write(key(), (Array.isArray(value) ? value : []).slice(0, MAX_SESSIONS));
  }

  function seeded(seedText = '') {
    let h = 2166136261;
    const text = String(seedText);
    for (let i = 0; i < text.length; i += 1) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    let s = h >>> 0;
    return () => {
      s += 0x6D2B79F5;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const pick = (rng, list) => list[Math.floor(rng() * list.length) % list.length];
  const int = (rng, min, max) => min + Math.floor(rng() * (max - min + 1));
  const round = n => Math.round(n * 1000) / 1000;

  function normalizedSkill(skill) {
    return escText(skill || 'General study skill').replace(/\s+/g, ' ').slice(0, 160);
  }

  function detectDomain(skill = '') {
    const q = skill.toLowerCase();
    if (/linear|equation|algebra|slope|system/.test(q)) return 'linear';
    if (/quadratic|parabola|factor/.test(q)) return 'quadratic';
    if (/percent|percentage|discount|markup|tax/.test(q)) return 'percent';
    if (/ratio|proportion|rate|unit rate/.test(q)) return 'ratio';
    if (/probab|chance|odds/.test(q)) return 'probability';
    if (/mean|average|median|statistics|data/.test(q)) return 'statistics';
    if (/grammar|punctuation|comma|semicolon|sentence boundary|transition/.test(q)) return 'grammar';
    if (/evidence|reading|inference|main idea|passage|craft and structure/.test(q)) return 'reading';
    return 'retrieval';
  }

  function makeLinear(rng, difficulty, id, skill) {
    const scale = difficulty === 'harder' ? 12 : difficulty === 'easier' ? 6 : 9;
    let a = int(rng, 2, scale);
    let x = int(rng, -8, 12);
    if (x === 0) x = 4;
    let b = int(rng, -12, 14);
    let c = a * x + b;
    if (difficulty === 'harder') {
      const d = int(rng, 1, Math.max(1, a - 1));
      c = (a - d) * x + b;
      return {
        id, skill, domain: 'linear', gradable: true, difficulty,
        prompt: `Solve for x: ${a}x ${b >= 0 ? '+' : '−'} ${Math.abs(b)} = ${d}x ${c >= 0 ? '+' : '−'} ${Math.abs(c)}`,
        answer: String(x),
        explanation: `Move the x-terms to one side and constants to the other. The equation simplifies to ${a - d}x = ${(a - d) * x}, so x = ${x}.`
      };
    }
    return {
      id, skill, domain: 'linear', gradable: true, difficulty,
      prompt: `Solve for x: ${a}x ${b >= 0 ? '+' : '−'} ${Math.abs(b)} = ${c}`,
      answer: String(x),
      explanation: `Undo the constant first, then divide by ${a}. This gives ${a}x = ${a * x}, so x = ${x}.`
    };
  }

  function makeQuadratic(rng, difficulty, id, skill) {
    let r1 = int(rng, -7, 7);
    let r2 = int(rng, -7, 7);
    if (r1 === 0) r1 = 2;
    if (r2 === 0) r2 = -3;
    if (difficulty === 'easier') r2 = r1;
    const b = -(r1 + r2);
    const c = r1 * r2;
    const roots = [r1, r2].sort((a, b2) => a - b2);
    return {
      id, skill, domain: 'quadratic', gradable: true, difficulty,
      prompt: `Find all real solutions: x² ${b >= 0 ? '+' : '−'} ${Math.abs(b)}x ${c >= 0 ? '+' : '−'} ${Math.abs(c)} = 0. Enter answers separated by a comma.`,
      answer: roots.join(','),
      answerSet: roots.map(String),
      explanation: `Factor the quadratic as (x − ${r1})(x − ${r2}) = 0. Therefore the solutions are x = ${r1} and x = ${r2}.`
    };
  }

  function makePercent(rng, difficulty, id, skill) {
    const base = int(rng, 4, difficulty === 'harder' ? 40 : 20) * 5;
    const pct = pick(rng, difficulty === 'harder' ? [12, 15, 18, 22, 25, 30, 35] : [10, 20, 25, 40, 50]);
    const answer = round(base * pct / 100);
    return {
      id, skill, domain: 'percent', gradable: true, difficulty,
      prompt: `What is ${pct}% of ${base}?`,
      answer: String(answer),
      explanation: `Convert ${pct}% to ${pct / 100} and multiply by ${base}. The result is ${answer}.`
    };
  }

  function makeRatio(rng, difficulty, id, skill) {
    const a = int(rng, 2, 9);
    const b = int(rng, 2, 12);
    const scale = int(rng, 2, difficulty === 'harder' ? 9 : 6);
    const value = b * scale;
    const answer = a * scale;
    return {
      id, skill, domain: 'ratio', gradable: true, difficulty,
      prompt: `A ratio is ${a}:${b}. If the second quantity is ${value}, what is the first quantity?`,
      answer: String(answer),
      explanation: `${value} is ${scale} times ${b}, so multiply ${a} by the same scale factor: ${a} × ${scale} = ${answer}.`
    };
  }

  function makeProbability(rng, difficulty, id, skill) {
    const red = int(rng, 2, 8);
    const blue = int(rng, 2, 8);
    const green = difficulty === 'harder' ? int(rng, 1, 6) : 0;
    const total = red + blue + green;
    const target = pick(rng, green ? [['red', red], ['blue', blue], ['green', green]] : [['red', red], ['blue', blue]]);
    const g = gcd(target[1], total);
    return {
      id, skill, domain: 'probability', gradable: true, difficulty,
      prompt: `A bag has ${red} red, ${blue} blue${green ? `, and ${green} green` : ''} tokens. One token is chosen at random. What is P(${target[0]})? Enter a fraction or decimal.`,
      answer: String(round(target[1] / total)),
      accepted: [`${target[1] / g}/${total / g}`, String(round(target[1] / total))],
      explanation: `Probability = favorable outcomes ÷ total outcomes = ${target[1]}/${total} = ${target[1] / g}/${total / g}.`
    };
  }

  function makeStatistics(rng, difficulty, id, skill) {
    const count = difficulty === 'harder' ? 6 : 5;
    const values = Array.from({ length: count }, () => int(rng, 2, 20));
    const sum = values.reduce((s, n) => s + n, 0);
    const mean = round(sum / count);
    return {
      id, skill, domain: 'statistics', gradable: true, difficulty,
      prompt: `Find the mean of: ${values.join(', ')}.`,
      answer: String(mean),
      explanation: `Add the ${count} values to get ${sum}, then divide by ${count}. The mean is ${mean}.`
    };
  }

  const GRAMMAR_BANK = [
    {
      prompt: 'Choose the grammatically correct sentence.',
      choices: ['The list of tasks are on the desk.', 'The list of tasks is on the desk.', 'The list of tasks were on the desk.', 'The list of tasks be on the desk.'],
      answer: 'B',
      explanation: 'The subject is “list,” which is singular, so the verb should be “is.”'
    },
    {
      prompt: 'Choose the best punctuation: The experiment failed ___ however, the team learned why.',
      choices: [', however,', '; however,', ': however,', ' however,'],
      answer: 'B',
      explanation: 'Two independent clauses can be joined with a semicolon before a conjunctive adverb such as “however.”'
    },
    {
      prompt: 'Choose the sentence with the clearest modifier placement.',
      choices: ['Running down the hall, the backpack bounced on Maya’s shoulder.', 'Running down the hall, Maya felt her backpack bounce on her shoulder.', 'The backpack, running down the hall, bounced on Maya.', 'Maya’s backpack ran down the hall while bouncing.'],
      answer: 'B',
      explanation: 'The introductory modifier “Running down the hall” should logically describe Maya.'
    }
  ];

  function makeGrammar(rng, difficulty, id, skill) {
    const item = pick(rng, GRAMMAR_BANK);
    return { id, skill, domain: 'grammar', gradable: true, difficulty, ...item };
  }

  const READING_BANK = [
    {
      prompt: 'A passage states: “After three failed prototypes, Lina shortened the sensor cable and the signal stabilized.” Which claim is best supported?',
      choices: ['Lina disliked prototyping.', 'The cable length was related to the unstable signal.', 'The final device was commercially successful.', 'Three prototypes are always necessary.'],
      answer: 'B',
      explanation: 'The text directly connects shortening the cable with a stable signal; the other claims add information not stated.'
    },
    {
      prompt: 'A writer says a city library “stayed busy even after closing time because students gathered outside to use its Wi‑Fi.” What is the strongest inference?',
      choices: ['Students were avoiding books.', 'The library served a need beyond access to its physical collection.', 'The city had no other buildings.', 'The library should close earlier.'],
      answer: 'B',
      explanation: 'Students continued using a library-provided resource after the building closed, supporting the broader-service inference.'
    }
  ];

  function makeReading(rng, difficulty, id, skill) {
    const item = pick(rng, READING_BANK);
    return { id, skill, domain: 'reading', gradable: true, difficulty, ...item };
  }

  function makeRetrieval(rng, difficulty, id, skill) {
    const stems = [
      `Explain ${skill} in your own words, then give one example and one non-example.`,
      `Write the most important rule or relationship for ${skill}, then explain why it works.`,
      `Pretend you are teaching ${skill} to a classmate who missed the lesson. What prerequisite would you review first?`,
      `Create a two-step example involving ${skill}. State what makes the example valid before solving it.`
    ];
    return {
      id, skill, domain: 'retrieval', gradable: false, difficulty,
      prompt: pick(rng, stems),
      answer: '',
      explanation: 'This is a retrieval-practice prompt. Use Scholark Tutor to check your explanation or compare it with your course materials; it does not automatically raise mastery without objective evidence.'
    };
  }

  function gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) [a, b] = [b, a % b];
    return a || 1;
  }

  function makeQuestion(skill, difficulty = 'mixed', seedText = '') {
    const cleanSkill = normalizedSkill(skill);
    const rng = seeded(`${cleanSkill}|${difficulty}|${seedText}`);
    const id = `pq_${A.stableHash(`${cleanSkill}|${difficulty}|${seedText}`)}`;
    const domain = detectDomain(cleanSkill);
    const maker = {
      linear: makeLinear,
      quadratic: makeQuadratic,
      percent: makePercent,
      ratio: makeRatio,
      probability: makeProbability,
      statistics: makeStatistics,
      grammar: makeGrammar,
      reading: makeReading,
      retrieval: makeRetrieval
    }[domain] || makeRetrieval;
    return maker(rng, difficulty, id, cleanSkill);
  }

  function recommendationFor(skill) {
    const record = Agents.mastery.get(skill);
    const attempts = Number(record.attempts || 0);
    const recurringErrors = Math.max(0, ...Object.values(record.errorCounts || {}).map(Number));
    return A.recommendNextPractice({
      accuracy: attempts ? Number(record.correct || 0) / attempts : 0.5,
      mastery: Number(record.score || 0),
      recurringErrors,
      daysSincePractice: record.updatedAt ? Math.floor((Date.now() - record.updatedAt) / 86400000) : 999
    });
  }

  function createSession(skill, options = {}) {
    const cleanSkill = normalizedSkill(skill);
    const rec = recommendationFor(cleanSkill);
    const count = Math.max(3, Math.min(12, Number(options.count || rec.count || 6)));
    const difficulty = options.difficulty || rec.difficulty || 'mixed';
    const id = `ps_${Date.now()}_${A.stableHash(`${cleanSkill}|${Math.random()}`).slice(0, 7)}`;
    const questions = Array.from({ length: count }, (_, i) => makeQuestion(cleanSkill, difficulty, `${id}|${i}`));
    const session = {
      id,
      skill: cleanSkill,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      difficulty,
      recommendation: rec,
      index: 0,
      questions,
      responses: [],
      completed: false,
      source: 'scholark-adaptive-practice'
    };
    saveSessions([session, ...sessions().filter(s => s.id !== id)]);
    emitUpdate(session);
    return session;
  }

  function getSession(sessionId) {
    return sessions().find(s => s.id === sessionId) || null;
  }

  function normalizeAnswer(value) {
    return String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ').replace(/[−–—]/g, '-');
  }

  function parseNumber(value) {
    const raw = normalizeAnswer(value);
    if (/^-?\d+(?:\.\d+)?\s*\/\s*-?\d+(?:\.\d+)?$/.test(raw)) {
      const [a, b] = raw.split('/').map(Number);
      if (b) return a / b;
    }
    const n = Number(raw.replace(/,/g, ''));
    return Number.isFinite(n) ? n : null;
  }

  function grade(question, response) {
    if (!question?.gradable) return { gradable: false, correct: null, normalized: normalizeAnswer(response) };
    const actual = normalizeAnswer(response);
    const accepted = [question.answer, ...(question.accepted || []), ...(question.answerSet ? [question.answerSet.join(','), question.answerSet.join(', ')] : [])].map(normalizeAnswer);
    if (question.answerSet) {
      const parts = actual.split(/[,;]/).map(x => x.trim()).filter(Boolean).sort();
      const expected = question.answerSet.map(normalizeAnswer).sort();
      return { gradable: true, correct: parts.length === expected.length && parts.every((x, i) => x === expected[i]), normalized: actual };
    }
    if (question.choices) return { gradable: true, correct: actual === normalizeAnswer(question.answer), normalized: actual };
    const numericActual = parseNumber(actual);
    const numericExpected = parseNumber(question.answer);
    if (numericActual != null && numericExpected != null) {
      return { gradable: true, correct: Math.abs(numericActual - numericExpected) <= Math.max(1e-6, Math.abs(numericExpected) * 1e-4), normalized: actual };
    }
    return { gradable: true, correct: accepted.includes(actual), normalized: actual };
  }

  function submit(sessionId, questionId, response, meta = {}) {
    const all = sessions();
    const index = all.findIndex(s => s.id === sessionId);
    if (index < 0) throw new Error('practice-session-not-found');
    const session = typeof structuredClone === 'function' ? structuredClone(all[index]) : JSON.parse(JSON.stringify(all[index]));
    const question = session.questions.find(q => q.id === questionId);
    if (!question) throw new Error('practice-question-not-found');
    if (session.responses.some(r => r.questionId === questionId)) return session.responses.find(r => r.questionId === questionId);

    const judged = grade(question, response);
    const entry = {
      questionId,
      response: String(response ?? '').slice(0, 1200),
      correct: judged.correct,
      gradable: judged.gradable,
      at: Date.now(),
      confidence: Number.isFinite(Number(meta.confidence)) ? A.clamp(Number(meta.confidence), 0, 1) : 0.55,
      hintsUsed: Math.max(0, Number(meta.hintsUsed || 0)),
      errorType: meta.errorType || null
    };
    session.responses.push(entry);
    session.index = Math.min(session.questions.length, session.responses.length);
    session.completed = session.responses.length >= session.questions.length;
    session.updatedAt = Date.now();

    if (judged.gradable) {
      Agents.mastery.update(session.skill, {
        correct: !!judged.correct,
        difficulty: session.difficulty === 'harder' ? 0.85 : session.difficulty === 'easier' ? 0.35 : 0.6,
        confidence: entry.confidence,
        hints: entry.hintsUsed,
        attempts: 1,
        errorType: judged.correct ? null : (entry.errorType || 'concept_gap'),
        note: judged.correct ? '' : `Missed adaptive practice item in ${question.domain}`
      });
    }

    all[index] = session;
    saveSessions(all);
    emitUpdate(session);
    return { ...entry, explanation: question.explanation, correctAnswer: judged.gradable ? question.answer : null, mastery: Agents.mastery.get(session.skill) };
  }

  async function explainMistake(sessionId, questionId, response) {
    const session = getSession(sessionId);
    const question = session?.questions?.find(q => q.id === questionId);
    if (!session || !question) throw new Error('practice-question-not-found');
    const request = `Help me understand this practice question without just repeating the answer.\nQuestion: ${question.prompt}\nMy response: ${String(response ?? '').slice(0, 500)}\nVerified answer: ${question.answer || 'self-check'}\nVerified explanation: ${question.explanation}`;
    return Agents.tutor.run(request, {
      subject: question.domain,
      topic: session.skill,
      mastery: Agents.mastery.get(session.skill),
      level: 'standard'
    });
  }

  function nextWeakSkill() {
    const rows = Agents.mastery.recommendations();
    return rows[0]?.skill || null;
  }

  function history() { return sessions(); }
  function clearHistory() { AI.storage.remove(key()); }

  function emitUpdate(session) {
    try {
      document.dispatchEvent(new CustomEvent('scholark:practice-updated', { detail: { sessionId: session.id, skill: session.skill, completed: session.completed } }));
    } catch (_) {}
  }

  window.ScholarkAIPractice = {
    version: VERSION,
    detectDomain,
    makeQuestion,
    grade,
    createSession,
    getSession,
    submit,
    explainMistake,
    recommendationFor,
    nextWeakSkill,
    history,
    clearHistory
  };
})();
