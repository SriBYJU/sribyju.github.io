(() => {
  'use strict';
  if (window.__scholarkAIContextInstalled) return;
  window.__scholarkAIContextInstalled = true;

  const AI = window.ScholarkAI;
  const Agents = window.ScholarkAIAgents;
  const A = window.ScholarkAIAlgorithms;
  if (!AI || !Agents || !A) return;

  const VERSION = '1.0.0';
  const originalAsk = Agents.ask;

  function identity() {
    return window.currentUser?.uid || window._gsUser?.uid || 'anon';
  }

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw == null) return fallback;
      const value = JSON.parse(raw);
      return value ?? fallback;
    } catch (_) {
      return fallback;
    }
  }

  function readArray(key) {
    const value = readJSON(key, []);
    return Array.isArray(value) ? value : [];
  }

  function priorityNumber(value) {
    const p = String(value || '').toLowerCase();
    if (p === 'high' || p === 'urgent') return 90;
    if (p === 'medium' || p === 'normal') return 65;
    if (p === 'low') return 40;
    const n = Number(value);
    return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 60;
  }

  function plannerTasks() {
    const raw = readArray(`gs_tasks_${identity()}`);
    return raw.filter(task => task && !task.deleted).map(task => ({
      id: task.id,
      title: task.title || 'Study task',
      subject: task.class || task.subject || '',
      topic: task.title || '',
      deadline: task.due || task.deadline || '',
      importance: priorityNumber(task.priority),
      completed: !!(task.done || task.completed),
      type: task.type || '',
      minutes: Number(task.minutes || 35),
      source: 'existing-scholark-planner'
    }));
  }

  function plannerInput() {
    const existingAI = Agents.planner.current?.();
    if (existingAI?.input?.tasks?.length) return existingAI.input;
    return {
      tasks: plannerTasks(),
      dailyMinutes: Number(AI.storage.read(`planner_daily_minutes_${identity()}`, 75)) || 75,
      days: 7,
      maxBlockMinutes: 45,
      goals: ['Prioritize upcoming deadlines and weak skills without exceeding realistic daily study time.'],
      source: 'existing-scholark-planner'
    };
  }

  function applications() {
    return readArray(`gs_apps_${identity()}`).filter(item => item && !item.deleted).map(item => ({
      name: item.school || item.name || '',
      application_type: item.type || '',
      application_deadline: item.deadline || '',
      application_status: item.status || '',
      notes: item.notes || '',
      source: 'existing-scholark-application-tracker'
    })).filter(item => item.name);
  }

  function universityRows() {
    let base = [];
    try {
      if (typeof UNIVERSITIES !== 'undefined' && Array.isArray(UNIVERSITIES)) {
        base = UNIVERSITIES.map(item => ({
          name: item.name,
          state: item.state || '',
          selectivity_tier: item.tier || '',
          // Legacy acceptance-rate values are intentionally not exposed to the AI layer because
          // they do not carry a source date and may become stale.
          data_scope: 'name/state/selectivity label from existing Scholark database'
        }));
      }
    } catch (_) {}

    const merged = new Map();
    base.forEach(row => merged.set(String(row.name).toLowerCase(), row));
    applications().forEach(app => {
      const key = app.name.toLowerCase();
      merged.set(key, { ...(merged.get(key) || { name: app.name }), ...app });
    });
    return [...merged.values()];
  }

  // Only provider-verified static records are surfaced to the AI assistant. The existing Scholarship
  // Finder remains untouched and can continue displaying its legacy dataset; the AI layer is more
  // conservative so it does not turn unsourced legacy rows into confident factual claims.
  const VERIFIED_SCHOLARSHIPS = Object.freeze([
    {
      name: 'The Gates Scholarship',
      award: 'Last-dollar funding for full cost of attendance not already covered by other financial aid and the Student Aid Index',
      eligibility: ['High school senior','Pell-eligible','U.S. citizen or permanent resident','Minimum cumulative weighted GPA 3.3/4.0 or equivalent','Plans full-time enrollment in a four-year degree program at an accredited U.S. not-for-profit public or private college/university'],
      deadline: '2026-09-15',
      cycle: '2026-2027',
      source: 'https://www.thegatesscholarship.org/scholarship/',
      verified_on: '2026-09-12'
    },
    {
      name: 'Coca-Cola Scholars Program Scholarship',
      award: '$20,000 college scholarship; 150 scholars selected nationally',
      eligibility: ['Graduating during the 2026-2027 school year','Minimum 3.0 GPA','Plans to attend an accredited U.S. college or university'],
      deadline: '2026-09-30T17:00:00-04:00',
      cycle: '2026-2027',
      source: 'https://www.coca-colascholarsfoundation.org/share-the-coke-scholars-application/',
      verified_on: '2026-09-12'
    }
  ]);

  function scholarshipRows() {
    return VERIFIED_SCHOLARSHIPS.map(row => ({ ...row }));
  }

  function satRawResponses() {
    const key = `gs_prep_v2_${window.currentUser?.uid || 'guest'}`;
    const state = readJSON(key, null);
    return Array.isArray(state?.responses) ? state.responses.slice(-250) : [];
  }

  function normalizeSAT(row) {
    const text = String(row.errorType || '').toLowerCase();
    let errorType = 'unknown';
    if (/rush/.test(text)) errorType = 'rushed';
    else if (/calculation|arithmetic/.test(text)) errorType = 'arithmetic';
    else if (/setup|concept|misconception/.test(text)) errorType = 'concept_gap';
    else if (/evidence|distractor/.test(text)) errorType = 'evidence';
    return {
      skill: row.skill || row.domain || 'SAT: Uncategorized',
      correct: !!row.correct,
      difficulty: Math.max(0, Math.min(1, Number(row.difficulty ?? .5) / (Number(row.difficulty) > 1 ? 3 : 1))),
      confidence: row.confidence === 'high' ? .9 : row.confidence === 'low' ? .3 : .55,
      hints: Number(row.hintsUsed || 0),
      attempts: 1,
      errorType: row.correct ? null : errorType,
      note: row.errorType || '',
      at: row.at || null,
      source: 'existing-scholark-sat-history'
    };
  }

  function satEvidence() {
    return satRawResponses().map(normalizeSAT);
  }

  function apState() {
    if (window.ScholarkAP?.getState) {
      try { return window.ScholarkAP.getState(); } catch (_) {}
    }
    const clean = String(window.currentUser?.uid || 'guest').replace(/[^a-zA-Z0-9_-]/g, '_');
    return readJSON(`gs_ap_v2_${clean}`, null);
  }

  function apMeta(subjectId) {
    const data = window.ScholarkAPData;
    return data?.subjectMap?.[subjectId] || data?.subjects?.find?.(s => s.id === subjectId) || null;
  }

  function apEvidence() {
    const state = apState();
    const subjects = state?.subjects && typeof state.subjects === 'object' ? state.subjects : {};
    const rows = [];
    Object.entries(subjects).forEach(([subjectId, subjectState]) => {
      const meta = apMeta(subjectId);
      const subjectName = meta?.name || meta?.short || subjectId || 'AP';
      (Array.isArray(subjectState?.responses) ? subjectState.responses.slice(-250) : []).forEach(row => {
        const unit = meta?.units?.[Number(row.unitIndex)];
        const unitName = unit?.name || unit?.title || unit?.label || `Unit ${Number(row.unitIndex) + 1}`;
        rows.push({
          skill: `${subjectName}: ${unitName}`,
          correct: !!row.correct,
          difficulty: .55,
          confidence: Number.isFinite(Number(row.confidence)) ? Math.max(0, Math.min(1, Number(row.confidence) / 3)) : .55,
          hints: 0,
          attempts: 1,
          errorType: row.correct ? null : 'concept_gap',
          note: row.correct ? '' : 'AP unit response missed',
          at: row.at || null,
          source: 'existing-scholark-ap-history'
        });
      });
    });
    return rows;
  }

  function fallbackDiagnostic(kind, analysis, recommendation) {
    if (!analysis.length) return `Complete some ${kind === 'sat' ? 'SAT' : 'AP'} practice first. Scholark will use your actual recorded results rather than inventing a diagnosis.`;
    const weak = analysis[0];
    const pct = Math.round(weak.accuracy * 100);
    const error = weak.dominantError ? ` Your most common recorded error type there is ${weak.dominantError.replaceAll('_',' ')}.` : '';
    const next = recommendation ? ` Next: ${recommendation.count} ${recommendation.difficulty} questions using ${recommendation.action.replaceAll('_',' ')}.` : '';
    return `Your current bottleneck is ${weak.skill}: ${pct}% correct across ${weak.attempts} recorded attempts.${error}${next}`;
  }

  async function diagnoseExisting(kind, rows, context = {}) {
    const analysis = Agents.utils.aggregatePractice(rows);
    const weak = analysis[0] || null;
    const recommendation = weak ? A.recommendNextPractice({
      accuracy: weak.accuracy,
      mastery: Agents.mastery.get(weak.skill).score,
      recurringErrors: Math.max(0, ...Object.values(weak.errors || {}).map(Number)),
      daysSincePractice: 0
    }) : null;
    const prompt = kind === 'ap' ? Agents.prompts.ap : Agents.prompts.sat;
    const fallbackText = fallbackDiagnostic(kind, analysis, recommendation);
    const result = await AI.generate([
      { role: 'system', content: prompt },
      { role: 'user', content: `This history is already stored in Scholark and has already contributed to mastery. Diagnose it without pretending there are additional attempts.\n\nCONTEXT:\n${JSON.stringify(context).slice(0,2800)}\n\nRECORDED ANALYSIS:\n${JSON.stringify(analysis).slice(0,6500)}\n\nDETERMINISTIC NEXT STEP:\n${JSON.stringify(recommendation).slice(0,1400)}` }
    ], {
      agent: kind,
      temperature: .12,
      maxTokens: 430,
      fallback: () => ({ text: fallbackText })
    });
    return {
      ...result,
      analysis,
      weakest: weak,
      recommendation,
      answer: result.mode === 'local-generative' ? result.text : result.value?.text || fallbackText
    };
  }

  function enrichedContext(input, context = {}) {
    const route = A.routeIntent(input).agent;
    if (route === 'planner') return { ...context, ...plannerInput(), planner: plannerInput() };
    if (route === 'college') return { ...context, colleges: universityRows(), applications: applications() };
    if (route === 'scholarship') return { ...context, scholarships: scholarshipRows() };
    if (route === 'tutor') return { ...context, mastery: Agents.mastery.all() };
    return context;
  }

  async function ask(input, context = {}) {
    const route = A.routeIntent(input);
    if (route.agent === 'sat') return { route, ...(await diagnoseExisting('sat', satEvidence(), context)) };
    if (route.agent === 'ap') return { route, ...(await diagnoseExisting('ap', apEvidence(), context)) };
    return originalAsk(input, enrichedContext(input, context));
  }

  Agents.ask = ask;

  window.ScholarkAIContext = {
    version: VERSION,
    ask,
    plannerTasks,
    plannerInput,
    applications,
    colleges: universityRows,
    scholarships: scholarshipRows,
    satEvidence,
    apEvidence,
    snapshot() {
      return {
        plannerTasks: plannerTasks().length,
        applications: applications().length,
        colleges: universityRows().length,
        verifiedScholarships: scholarshipRows().length,
        satResponses: satEvidence().length,
        apResponses: apEvidence().length,
        masterySkills: Object.keys(Agents.mastery.all()).length
      };
    }
  };
})();
