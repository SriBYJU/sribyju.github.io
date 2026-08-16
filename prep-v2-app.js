(function () {
  'use strict';

  const data = window.ScholarkPrepData;
  if (!data) {
    console.error('Scholark Prep could not start because its content library did not load.');
    return;
  }

  const STORAGE_PREFIX = 'gs_prep_v2_';
  const LEGACY_KEY = 'gs_prep_state';
  const letters = ['A','B','C','D'];
  let state;
  let session = null;
  let timerId = null;
  let graph = { minX:-10, maxX:10, minY:-10, maxY:10, expression:'x^2', dragging:false, lastX:0, lastY:0 };
  const strategyCourses = {
    desmos: {
      title:'The Complete Desmos Strategy Course',
      subtitle:'An independent, unofficial digital SAT Math course: learn the setup, see it visually, then solve a targeted problem yourself.',
      lessons:[
        ['Equations as intersections','Turn “left side = right side” into two graphs and read the intersection.','3*x+7','sat-math-linear-one',['Enter each side as its own expression.','Zoom to the relevant window.','Read the x-coordinate of the intersection and verify it in the original equation.']],
        ['Systems without elimination','Graph both equations; their shared point solves both at once.','2*x+3','sat-math-systems',['Rewrite each equation as y = an expression when possible.','Graph both lines.','Select the intersection and match both coordinates to the question.']],
        ['Quadratic roots and factors','Graph the quadratic and use x-intercepts to locate real solutions.','x^2-7*x+10','sat-math-nonlinear-equations',['Enter the expression as y.','Find where the curve crosses y = 0.','Use the requested root, sum, or product—do not automatically choose the first intercept.']],
        ['Vertex and maximum/minimum','Use the turning point to read a quadratic’s maximum or minimum.','-(x-4)^2+9','sat-math-nonlinear-functions',['Graph the function.','Locate the highest or lowest point.','Interpret both coordinates in the context and respect the stated domain.']],
        ['Tables for function values','Use a table when the question asks for several inputs or a pattern.','2*(1.08)^x','sat-math-nonlinear-functions',['Enter the function.','Generate integer x-values in a table.','Use the row matching the requested input and keep rounding until the final step.']],
        ['Exponential models','Graph growth or decay and solve threshold questions with an intersection.','80*(1.06)^x','sat-math-nonlinear-functions',['Convert the percent rate to a multiplier.','Graph the model and the target value.','Use the intersection’s x-value and apply context-appropriate rounding.']],
        ['Regression from data','Place paired data in a table, select an appropriate model, and interpret its parameters.','1.5*x+2','sat-math-two-data',['Enter x- and y-values in adjacent columns.','Choose linear, quadratic, or exponential only when the pattern supports it.','Treat a model as an estimate and avoid unjustified extrapolation.']],
        ['Inequalities and feasible regions','Graph boundary expressions and use shading to test which points satisfy the conditions.','2*x-3','sat-math-inequalities',['Graph each boundary.','Use a test point to identify the correct side.','For a system, use only the overlapping region.']],
        ['Transformations and parameters','Connect changes inside and outside a function to visible shifts and stretches.','(x-3)^2+2','sat-math-nonlinear-functions',['Start from the parent function.','Change one parameter at a time.','Describe the feature that moved instead of relying only on appearance.']],
        ['Circles in standard form','Read the center and radius, then graph to check the geometry.','sqrt(25-(x-2)^2)-3','sat-math-circles',['Rewrite as (x − h)² + (y − k)² = r².','Read (h, k) and r before graphing.','Use distance or tangent facts when the question asks beyond the picture.']],
        ['Statistics and lists','Use lists to check summaries, but know what the statistic means.','(3+5+7+9+11)/5','sat-math-one-data',['Enter the data carefully.','Compute the requested statistic, not every available statistic.','Predict the direction of change before recalculating after a value is added or removed.']],
        ['When not to use Desmos','Mental math or a short symbolic step is often faster than building a graph.','12/3+5','sat-math-ratios',['Estimate the work required by hand.','Use the calculator when it reduces error or reveals structure.','Always translate the calculator result back into the question’s units and constraints.']]
      ]
    },
    english: {
      title:'English Rules That Actually Transfer',
      subtitle:'Reusable SAT Reading and Writing and ACT English decisions—not isolated tricks that work on only one sentence.',
      lessons:[
        ['Clause boundaries','Separate complete thoughts from dependent clauses before choosing punctuation.','sat-rw-boundaries',['Underline each subject-verb core.','Use a period, semicolon, or comma plus coordinating conjunction between independent clauses.','Do not join complete sentences with a comma alone.']],
        ['Colons and dashes','Use a colon only after a complete clause; use a dash for emphasis or an interruption.','act-eng-punctuation',['Read everything before the punctuation.','Confirm the left side can stand alone.','Check whether the right side explains, lists, or emphasizes.']],
        ['Modifiers that point clearly','Place an introductory description next to the person or thing it describes.','sat-rw-form',['Identify who performs the opening action.','Put that noun immediately after the comma.','Reject choices that make an object perform an impossible action.']],
        ['Agreement without distractions','Ignore intervening phrases and match the verb or pronoun to its true antecedent.','act-eng-usage',['Find the head noun.','Temporarily remove prepositional and interrupting phrases.','Check number and person.']],
        ['Verb time relationships','Use surrounding events to choose a tense, especially when one past event happened earlier.','act-eng-usage',['Build a quick timeline.','Use past perfect only to mark the earlier of two past actions.','Keep tense shifts only when the time changes.']],
        ['Concision and precision','Choose the shortest option that preserves exact meaning, grammar, and tone.','act-eng-language',['Eliminate repetition.','Prefer a precise verb over a vague phrase.','Do not choose brevity if it changes meaning.']],
        ['Transitions by relationship','Name the relationship before looking at transition words.','sat-rw-transitions',['Summarize the idea before and after the blank.','Label the relationship: contrast, result, example, addition, or sequence.','Select the word that encodes that relationship exactly.']],
        ['Rhetorical synthesis','Use only notes that accomplish the stated goal.','sat-rw-synthesis',['Circle the task verb: introduce, emphasize, compare, or explain.','Ignore accurate notes that do not serve that goal.','Check that the sentence does not invent a relationship.']],
        ['Central idea versus topic','A central idea states what the text says about its subject.','sat-rw-central',['Summarize the text in one sentence.','Include the main finding and any important limitation.','Reject choices that are too broad, too narrow, or absolute.']],
        ['Evidence and inference','Choose the smallest claim the evidence proves.','sat-rw-inference',['Locate the exact supporting detail.','Separate a reasonable inference from a possible story.','Be suspicious of always, never, only, and proves.']],
        ['Purpose and structure','Describe what a portion does in the author’s reasoning.','sat-rw-structure',['Paraphrase the surrounding argument.','Use a function verb such as illustrates, qualifies, contrasts, or introduces.','Do not merely repeat the portion’s subject.']],
        ['Words in context','Replace the word with each option and preserve the local meaning and tone.','sat-rw-words',['Read the complete sentence.','Predict a simple synonym before viewing choices.','Reject a familiar dictionary meaning that does not fit this use.']]
      ]
    }
  };

  function defaultState() {
    return {
      version: data.version, test: 'sat', view: 'dashboard', xp: 0, streak: 0,
      lastActiveDate: null, responses: [], mastery: {}, bookmarks: [],
      diagnostic: { sat:null, act:null },
      plan: { sat:{goal:1350, baseline:'', minutes:30, days:5, targetDate:''}, act:{goal:30, baseline:'', minutes:30, days:5, targetDate:''} },
      settings: { practiceLength:10 }, updatedAt: new Date().toISOString()
    };
  }

  function storageKey() {
    return STORAGE_PREFIX + (window.currentUser?.uid || 'guest');
  }
  function sessionStorageKey() { return `${storageKey()}_active_session`; }

  function safeParse(value) {
    try { const parsed = JSON.parse(value); return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null; }
    catch (error) { console.warn('Ignoring invalid Scholark Prep data:', error); return null; }
  }

  function mergeState(base, incoming) {
    if (!incoming) return base;
    const merged = Object.assign(base, incoming);
    merged.plan = {
      sat:Object.assign({},base.plan.sat,incoming.plan?.sat||{}),
      act:Object.assign({},base.plan.act,incoming.plan?.act||{})
    };
    merged.diagnostic = Object.assign(base.diagnostic, incoming.diagnostic || {});
    merged.settings = Object.assign(base.settings, incoming.settings || {});
    merged.mastery = incoming.mastery && typeof incoming.mastery === 'object' ? incoming.mastery : {};
    merged.responses = Array.isArray(incoming.responses) ? incoming.responses.slice(-2000) : [];
    merged.bookmarks = Array.isArray(incoming.bookmarks) ? [...new Set(incoming.bookmarks)] : [];
    return merged;
  }

  function loadState() {
    const fresh = defaultState();
    let saved = null;
    try { saved = safeParse(localStorage.getItem(storageKey())); }
    catch (error) { console.warn('Could not read Scholark Prep progress:', error); }
    state = mergeState(fresh, saved);
    if (!saved) migrateLegacyProgress();
    ensureMasteryRows();
  }

  function migrateLegacyProgress() {
    let legacy = null;
    try { legacy = safeParse(localStorage.getItem(LEGACY_KEY)); } catch (error) { console.warn('Could not read legacy prep progress:', error); }
    if (!legacy) return;
    state.xp = Number.isFinite(Number(legacy.xp)) ? Number(legacy.xp) : 0;
    state.streak = Number.isFinite(Number(legacy.streak)) ? Number(legacy.streak) : 0;
    state.legacySummary = { correct:Number(legacy.correct)||0, total:Number(legacy.total)||0 };
    saveState(false);
  }

  function ensureMasteryRows() {
    Object.values(data.topics).flat().forEach(topic => {
      const row = state.mastery[topic.id];
      if (!row || typeof row !== 'object') state.mastery[topic.id] = { score:50, attempts:0, correct:0, confidence:0, lastSeen:null, trend:0, retentionLevel:0, nextReviewAt:null };
      else Object.assign(row,{retentionLevel:Number(row.retentionLevel)||0,nextReviewAt:row.nextReviewAt||null});
    });
  }

  function saveState(syncCloud = true) {
    state.updatedAt = new Date().toISOString();
    try { localStorage.setItem(storageKey(), JSON.stringify(state)); }
    catch (error) {
      console.error('Could not save Scholark Prep progress:', error);
      if (typeof showToast === 'function') showToast('Practice progress could not be saved in this browser.', 'error');
      return false;
    }
    if (syncCloud) scheduleCloudSync();
    return true;
  }

  let cloudTimer = null;
  function scheduleCloudSync() {
    if (!window.currentUser?.uid || !window._dbSaveSyncState) return;
    clearTimeout(cloudTimer);
    cloudTimer = setTimeout(async () => {
      try {
        await window._dbSaveSyncState(window.currentUser.uid, 'test-prep', [{id:'prep-v2', state, updatedAt:state.updatedAt}]);
      } catch (error) {
        console.error('Test prep cloud sync failed:', error);
        if (typeof showToast === 'function') showToast('Cloud sync failed. Your test-prep progress is still saved on this device.', 'error');
      }
    }, 800);
  }

  async function loadCloudState() {
    if (!window.currentUser?.uid || !window._dbGetSyncState) return;
    try {
      const remote = await window._dbGetSyncState(window.currentUser.uid, 'test-prep');
      const remoteState = Array.isArray(remote) ? remote.find(item => item?.id === 'prep-v2')?.state : null;
      if (!remoteState) { scheduleCloudSync(); return; }
      const localTime = Date.parse(state.updatedAt || 0) || 0;
      const remoteTime = Date.parse(remoteState.updatedAt || 0) || 0;
      if (remoteTime > localTime) {
        state = mergeState(defaultState(), remoteState);
        ensureMasteryRows();
        saveState(false);
        render();
      } else scheduleCloudSync();
    } catch (error) {
      console.error('Could not load test prep cloud progress:', error);
      if (typeof showToast === 'function') showToast('Cloud progress could not be loaded. This device’s saved progress is available.', 'error');
    }
  }

  function init() {
    stopTimer();
    loadState();
    session = restoreSession();
    updateChrome();
    render();
    if(session&&(session.timeLimit||session.segments?.length))startTimer();
    loadCloudState();
  }

  function saveSessionSnapshot() {
    if(!session)return;
    const snapshot=Object.assign({},session,{questions:session.questions.map(q=>q.id),savedAt:new Date().toISOString()});
    try{localStorage.setItem(sessionStorageKey(),JSON.stringify(snapshot));}
    catch(error){console.warn('Could not save the active test session:',error);}
  }
  function restoreSession() {
    let snapshot=null;
    try{snapshot=safeParse(localStorage.getItem(sessionStorageKey()));}catch(error){console.warn('Could not read the active test session:',error);}
    if(!snapshot||!Array.isArray(snapshot.questions)||Date.now()-(Date.parse(snapshot.savedAt)||0)>86400000)return null;
    const lookup=new Map(data.questions.map(q=>[q.id,q]));
    const questions=snapshot.questions.map(id=>lookup.get(id));
    if(questions.some(q=>!q)){
      try{localStorage.removeItem(sessionStorageKey());}
      catch(error){console.warn('Could not clear an outdated test session:',error);}
      return null;
    }
    snapshot.questions=questions;
    snapshot.answers=Array.isArray(snapshot.answers)?snapshot.answers:new Array(questions.length).fill(null);
    snapshot.confidence=Array.isArray(snapshot.confidence)?snapshot.confidence:new Array(questions.length).fill(null);
    snapshot.hintsUsed=Array.isArray(snapshot.hintsUsed)?snapshot.hintsUsed:new Array(questions.length).fill(0);
    snapshot.flags=Array.isArray(snapshot.flags)?snapshot.flags:[];
    snapshot.approaches=Array.isArray(snapshot.approaches)?snapshot.approaches:new Array(questions.length).fill(null);
    snapshot.skipped=Array.isArray(snapshot.skipped)?snapshot.skipped:[];
    snapshot.revisited=Array.isArray(snapshot.revisited)?snapshot.revisited:[];
    snapshot.questionStartedAt=Date.now();
    return snapshot;
  }
  function clearSessionSnapshot(){try{localStorage.removeItem(sessionStorageKey());}catch(error){console.warn('Could not clear the completed test session:',error);}}

  function setTest(test) {
    if (!data.topics[test] || (session && !confirm('Leave the current session and switch tests?'))) return;
    if(session)clearSessionSnapshot();
    session = null;
    stopTimer();
    state.test = test;
    state.view = 'dashboard';
    saveState();
    updateChrome();
    render();
  }

  function showView(view) {
    if (session && view !== 'practice' && !confirm('Leave the current session? Your completed answers are already saved.')) return;
    if(session&&view!=='practice')clearSessionSnapshot();
    session = null;
    stopTimer();
    state.view = view;
    saveState(false);
    updateChrome();
    render();
  }

  function updateChrome() {
    document.querySelectorAll('.prep-v2-test').forEach(button => button.classList.toggle('active', button.id === `prep-test-${state.test}`));
    document.querySelectorAll('[data-prep-view]').forEach(button => button.classList.toggle('active', button.dataset.prepView === state.view));
  }

  function app() { return document.getElementById('prep-app'); }
  function esc(value) { return String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char])); }
  function topic(id) { return data.topicById[id]; }
  function testQuestions() { return data.questions.filter(question => question.exam === state.test); }
  function mastery(id) { return state.mastery[id] || {score:50,attempts:0,correct:0,confidence:0,trend:0}; }
  function effectiveMastery(id) {
    const row=mastery(id);
    if(!row.lastSeen)return row.score;
    const days=Math.max(0,(Date.now()-Date.parse(row.lastSeen))/86400000);
    const decay=Math.min(18,Math.max(0,days-2)*.65);
    return Math.max(5,Math.round((row.score-decay)*10)/10);
  }
  function reviewIsDue(id){const row=mastery(id);return !!row.nextReviewAt&&Date.parse(row.nextReviewAt)<=Date.now();}
  function masteryLabel(score) { return score >= 80 ? 'Mastered' : score >= 65 ? 'Ready' : score >= 45 ? 'Developing' : 'Priority'; }
  function masteryClass(score) { return score >= 65 ? 'good' : score < 45 ? 'focus' : ''; }
  function avgMastery(test = state.test) {
    const rows = data.topics[test].map(item => mastery(item.id));
    return rows.length ? Math.round(data.topics[test].reduce((sum,item) => sum + effectiveMastery(item.id), 0) / rows.length) : 50;
  }
  function accuracy() {
    if (!state.responses.length) return 0;
    return Math.round(state.responses.filter(row => row.correct).length / state.responses.length * 100);
  }
  function practiceRange() {
    const attempts = state.responses.filter(row => row.exam === state.test).length;
    if (attempts < 20) return 'More data needed';
    const score = avgMastery();
    if (state.test === 'sat') {
      const midpoint = Math.round((400 + score * 12) / 10) * 10;
      return `${Math.max(400,midpoint-70)}–${Math.min(1600,midpoint+70)}`;
    }
    const midpoint = Math.round(1 + score * .35);
    return `${Math.max(1,midpoint-2)}–${Math.min(36,midpoint+2)}`;
  }

  function render() {
    updateChrome();
    if (!app()) return;
    if (session) return renderSession();
    const views = {dashboard:renderDashboard, diagnostic:renderDiagnostic, practice:renderPracticeSetup, learn:renderLearn, tests:renderTests, calculator:renderCalculator};
    (views[state.view] || renderDashboard)();
  }

  function weakestTopics(limit, test = state.test) {
    return data.topics[test].slice().sort((a,b) => {
      const ma = mastery(a.id), mb = mastery(b.id);
      const aScore = effectiveMastery(a.id) + Math.min(ma.attempts,5) * 1.5 - (reviewIsDue(a.id)?18:0);
      const bScore = effectiveMastery(b.id) + Math.min(mb.attempts,5) * 1.5 - (reviewIsDue(b.id)?18:0);
      return aScore - bScore;
    }).slice(0, limit);
  }

  function planItems() {
    const weak = weakestTopics(7);
    const minutes = Number(state.plan[state.test].minutes) || 30;
    return weak.map((item,index) => ({
      day:index+1, topic:item,
      task:index === 0 ? 'Focused lesson + guided drill' : index % 3 === 0 ? 'Mixed review + mistake notebook' : 'Adaptive skill drill',
      minutes:Math.max(10, Math.round((minutes - (index % 2) * 5) / 5) * 5)
    }));
  }

  function renderDashboard() {
    const plan = state.plan[state.test];
    const diag = state.diagnostic[state.test];
    const items = planItems();
    const testResponses=state.responses.filter(row=>row.exam===state.test);
    const mistakes=testResponses.filter(row=>!row.correct);
    const confidentMistakes=mistakes.filter(row=>row.confidence==='high').length;
    const rushedMistakes=mistakes.filter(row=>row.errorType==='rushed decision').length;
    const timed=testResponses.filter(row=>Number.isFinite(row.timeMs)&&row.timeMs>0);
    const averageSeconds=timed.length?Math.round(timed.reduce((sum,row)=>sum+row.timeMs,0)/timed.length/1000):0;
    const confidenceRows=testResponses.filter(row=>row.confidence);
    const confidenceAligned=confidenceRows.length>=5?Math.max(0,Math.round(100-(confidenceRows.reduce((sum,row)=>{const prediction={low:.3,medium:.6,high:.85}[row.confidence],outcome=row.correct?1:0;return sum+Math.pow(prediction-outcome,2);},0)/confidenceRows.length)/.25*100)):null;
    const reviewsDue=data.topics[state.test].filter(item=>reviewIsDue(item.id)).length;
    const rows = weakestTopics(6).map(item => {
      const m = mastery(item.id);
      return `<div class="prep-v2-mastery-row"><span>${esc(item.name)}</span><div class="prep-v2-progress"><span style="width:${m.score}%"></span></div><strong>${Math.round(m.score)}%</strong></div>`;
    }).join('');
    app().innerHTML = `<div class="prep-v2-grid">
      <section class="prep-v2-card"><div class="prep-v2-kicker">Current readiness</div><div class="prep-v2-metric">${avgMastery()}%</div><p>Average topic mastery—not an official score.</p></section>
      <section class="prep-v2-card"><div class="prep-v2-kicker">Practice range</div><div class="prep-v2-metric">${practiceRange()}</div><p>${state.test === 'sat' ? 'SAT-style range' : 'ACT-style range'} after enough practice evidence.</p></section>
      <section class="prep-v2-card"><div class="prep-v2-kicker">Momentum</div><div class="prep-v2-metric">${state.streak} day${state.streak === 1 ? '' : 's'}</div><p>${state.xp} XP · ${accuracy()}% lifetime accuracy · ${reviewsDue} memory review${reviewsDue===1?'':'s'} due</p></section>
      <section class="prep-v2-card wide">
        <div class="prep-v2-kicker">Your next seven study days</div><h2>${diag ? 'Plan built from your diagnostic and recent work' : 'Start with a diagnostic for a calibrated plan'}</h2>
        <p>Scholark prioritizes weak skills, then schedules spaced review so improvement sticks.</p>
        ${items.map(item => `<div class="prep-v2-plan-day"><div class="prep-v2-day-num">${item.day}</div><div><strong>${esc(item.topic.name)}</strong><div class="prep-v2-muted">${item.task} · ${item.minutes} min</div></div><button class="prep-v2-secondary" onclick="ScholarkPrep.startSkill('${item.topic.id}')">Start</button></div>`).join('')}
      </section>
      <section class="prep-v2-card">
        <div class="prep-v2-kicker">Plan settings</div><h3>${data.blueprints[state.test].label} goal</h3>
        <div class="prep-v2-field"><label for="prep-baseline">Most recent score (optional)</label><input id="prep-baseline" type="number" min="${state.test === 'sat' ? 400 : 1}" max="${state.test === 'sat' ? 1600 : 36}" step="${state.test === 'sat' ? 10 : 1}" value="${esc(plan.baseline)}" placeholder="Use a practice or official score"></div>
        <div class="prep-v2-field" style="margin-top:10px"><label for="prep-goal">Goal score</label><input id="prep-goal" type="number" min="${state.test === 'sat' ? 400 : 1}" max="${state.test === 'sat' ? 1600 : 36}" step="${state.test === 'sat' ? 10 : 1}" value="${plan.goal}"></div>
        <div class="prep-v2-field" style="margin-top:10px"><label for="prep-minutes">Minutes per study day</label><input id="prep-minutes" type="number" min="10" max="180" step="5" value="${plan.minutes}"></div>
        <div class="prep-v2-field" style="margin-top:10px"><label for="prep-days">Study days per week</label><input id="prep-days" type="number" min="2" max="7" step="1" value="${plan.days||5}"></div>
        <div class="prep-v2-field" style="margin-top:10px"><label for="prep-date">Test date (optional)</label><input id="prep-date" type="date" value="${esc(plan.targetDate)}"></div>
        <div class="prep-v2-actions"><button class="prep-v2-primary" onclick="ScholarkPrep.savePlan()">Update plan</button><button class="prep-v2-secondary" onclick="ScholarkPrep.openPlanStudio()">Compare scenarios</button></div>
      </section>
      <section class="prep-v2-card full"><div class="prep-v2-kicker">Goal Gap Map</div><h2>The smallest skill set between you and your goal</h2><p>These priorities combine mastery, confidence, recency, and practice evidence. They are directional—not a promise of exact score points.</p><div class="prep-v2-mastery-list">${rows}</div></section>
      <section class="prep-v2-card"><div class="prep-v2-kicker">Mistake DNA</div><div class="prep-v2-metric">${mistakes.length}</div><p>${confidentMistakes} confident misconception${confidentMistakes===1?'':'s'} · ${rushedMistakes} rushed decision${rushedMistakes===1?'':'s'}</p><div class="prep-v2-actions"><button class="prep-v2-secondary" onclick="ScholarkPrep.startMistakes()">Open targeted retries</button></div></section>
      <section class="prep-v2-card"><div class="prep-v2-kicker">Confidence calibration</div><div class="prep-v2-metric">${confidenceAligned===null?'—':confidenceAligned+'%'}</div><p>${confidenceRows.length>=5?'A probability-calibration score showing whether confidence matches results.':`Rate confidence on ${5-confidenceRows.length} more practice question${5-confidenceRows.length===1?'':'s'} to unlock this signal.`}</p></section>
      <section class="prep-v2-card"><div class="prep-v2-kicker">Pacing Coach</div><div class="prep-v2-metric">${averageSeconds?averageSeconds+'s':'—'}</div><p>${averageSeconds?'Average response time; section-specific checkpoints appear in timed work.':'Complete a practice set to establish a pacing baseline.'}</p></section>
      <section class="prep-v2-card"><div class="prep-v2-kicker">Mastery Memory Engine</div><div class="prep-v2-metric">${reviewsDue}</div><p>Reviews due now on a 1, 3, 7, 14, then 30-day retention cycle.</p><div class="prep-v2-actions"><button class="prep-v2-secondary" onclick="ScholarkPrep.startMemoryReview()">Start memory review</button></div></section>
    </div>`;
  }

  function savePlan() {
    const goal = Number(document.getElementById('prep-goal')?.value);
    const baselineRaw=document.getElementById('prep-baseline')?.value?.trim()||'';
    const baseline=baselineRaw===''?'':Number(baselineRaw);
    const minutes = Number(document.getElementById('prep-minutes')?.value);
    const days = Number(document.getElementById('prep-days')?.value);
    const limits = state.test === 'sat' ? [400,1600] : [1,36];
    if (!Number.isFinite(goal) || goal < limits[0] || goal > limits[1] || (baseline!==''&&(!Number.isFinite(baseline)||baseline<limits[0]||baseline>limits[1])) || !Number.isFinite(minutes) || minutes < 10 || minutes > 180 || !Number.isFinite(days) || days<2 || days>7) {
      return typeof showToast === 'function' && showToast('Enter valid baseline and goal scores, 10–180 study minutes, and 2–7 study days.', 'error');
    }
    state.plan[state.test] = {goal, baseline, minutes, days, targetDate:document.getElementById('prep-date')?.value || ''};
    saveState();
    if (typeof showToast === 'function') showToast('Your personalized plan was updated.', 'success');
    renderDashboard();
  }

  function openPlanStudio() {
    const plan=state.plan[state.test], target=plan.targetDate?new Date(`${plan.targetDate}T12:00:00`):null;
    const weeks=target&&target>Date.now()?Math.max(1,Math.ceil((target-Date.now())/604800000)):12;
    const scoreGap=plan.baseline!==''?Math.max(0,Number(plan.goal)-Number(plan.baseline)):null;
    const scenarios=[
      {name:'Sustainable',days:Math.max(3,(plan.days||5)-1),minutes:Math.max(20,plan.minutes-10),note:'Lower daily load with a longer recovery margin.'},
      {name:'Balanced',days:plan.days||5,minutes:plan.minutes,note:'Your current plan, balancing new work and retention checks.'},
      {name:'Intensive',days:Math.min(7,(plan.days||5)+1),minutes:Math.min(90,plan.minutes+15),note:'More weekly capacity; best only if the schedule is sustainable.'}
    ];
    app().innerHTML=`<section class="prep-v2-card full"><button class="prep-v2-secondary" onclick="ScholarkPrep.showView('dashboard')">← Back to plan</button><div class="prep-v2-kicker" style="margin-top:18px">What-If Plan Studio</div><h2>Compare the workload before changing your real plan</h2><p>Based on ${weeks} week${weeks===1?'':'s'} until ${plan.targetDate?new Date(`${plan.targetDate}T12:00:00`).toLocaleDateString():'a 12-week planning horizon'}${scoreGap===null?'':` and a ${scoreGap}-point goal gap`}. Capacity estimates describe study opportunities, not guaranteed score gains.</p><div class="prep-v2-grid" style="margin-top:18px">${scenarios.map((scenario,index)=>{const sessions=weeks*scenario.days,totalHours=Math.round(sessions*scenario.minutes/60);return `<article class="prep-v2-card"><span class="prep-v2-chip ${index===1?'good':''}">${index===1?'Current':'Alternative'}</span><h3>${scenario.name}</h3><div class="prep-v2-metric">${totalHours}h</div><p>${scenario.days} days/week · ${scenario.minutes} min/day · approximately ${sessions} focused sessions</p><p style="margin-top:8px">${scenario.note}</p><div class="prep-v2-actions"><button class="prep-v2-secondary" onclick="ScholarkPrep.applyPlanScenario(${scenario.days},${scenario.minutes})">Use this workload</button></div></article>`;}).join('')}</div><div class="prep-v2-callout"><strong>Decision rule:</strong> choose the most demanding schedule you can repeat consistently. Scholark will automatically spend that capacity on goal-gap topics and memory reviews.</div></section>`;
  }
  function applyPlanScenario(days,minutes){state.plan[state.test].days=days;state.plan[state.test].minutes=minutes;saveState();if(typeof showToast==='function')showToast('The selected workload is now part of your plan.','success');renderDashboard();}

  function renderDiagnostic() {
    const result = state.diagnostic[state.test];
    const count = state.test === 'sat' ? 24 : 27;
    if (!result) {
      app().innerHTML = `<section class="prep-v2-card full prep-v2-setup"><div class="prep-v2-kicker">Adaptive starting point</div><h2>${data.blueprints[state.test].label} diagnostic</h2><p>This ${count}-question diagnostic samples every major section, reroutes upcoming difficulty after each response, and turns the evidence into a topic-level study plan. It is intentionally shorter than a full test and does not produce an official score.</p><div class="prep-v2-callout"><strong>Best result:</strong> work without outside help, use the calculator only where you would on test day, and choose “I’m not sure” mentally instead of guessing from explanations—answers stay hidden until the end.</div><div class="prep-v2-actions"><button class="prep-v2-primary" onclick="ScholarkPrep.startDiagnostic()">Start ${count}-question diagnostic</button><button class="prep-v2-secondary" onclick="ScholarkPrep.showView('learn')">Review topics first</button></div></section>`;
      return;
    }
    const weakest = result.weakest.map(id => `<span class="prep-v2-chip focus">${esc(topic(id)?.name || id)}</span>`).join('');
    app().innerHTML = `<div class="prep-v2-grid"><section class="prep-v2-card"><div class="prep-v2-kicker">Last diagnostic</div><div class="prep-v2-metric">${result.correct}/${result.total}</div><p>${new Date(result.completedAt).toLocaleDateString()} · ${result.accuracy}% accuracy</p></section><section class="prep-v2-card wide"><div class="prep-v2-kicker">Your first priorities</div><h2>Start where improvement is most available</h2><div style="margin-top:12px">${weakest}</div><div class="prep-v2-actions"><button class="prep-v2-primary" onclick="ScholarkPrep.startAdaptive()">Start adaptive practice</button><button class="prep-v2-secondary" onclick="ScholarkPrep.startDiagnostic()">Retake diagnostic</button></div></section></div>`;
  }

  function renderPracticeSetup() {
    const topics = data.topics[state.test];
    const domains = [...new Set(topics.map(item => item.domain))];
    app().innerHTML = `<div class="prep-v2-grid">
      <section class="prep-v2-card wide prep-v2-setup"><div class="prep-v2-kicker">Personalized practice</div><h2>Build a focused session</h2><p>Adaptive mode mixes priority skills, spaced review, and an appropriate challenge level. You can also target one domain or topic.</p>
      <div class="prep-v2-form-grid"><div class="prep-v2-field"><label for="prep-scope">Practice focus</label><select id="prep-scope"><option value="adaptive">Adaptive recommendation</option><option value="mixed">Mixed ${data.blueprints[state.test].label}</option>${domains.map(domain => `<optgroup label="${esc(domain)}"><option value="domain:${esc(domain)}">All ${esc(domain)}</option>${topics.filter(item => item.domain === domain).map(item => `<option value="skill:${item.id}">${esc(item.name)}</option>`).join('')}</optgroup>`).join('')}</select></div><div class="prep-v2-field"><label for="prep-length">Questions</label><select id="prep-length"><option>5</option><option selected>10</option><option>15</option><option>20</option><option>30</option></select></div></div>
      <div class="prep-v2-actions"><button class="prep-v2-primary" onclick="ScholarkPrep.startPractice()">Start focused practice</button><button class="prep-v2-secondary" onclick="ScholarkPrep.startAdaptive()">Quick adaptive set</button></div></section>
      <section class="prep-v2-card"><div class="prep-v2-kicker">Misconception Replay Lab</div><div class="prep-v2-metric">${state.responses.filter(row => !row.correct && row.exam === state.test).length}</div><p>Retry saved misses or transfer the same reasoning skill to fresh questions.</p><div class="prep-v2-actions"><button class="prep-v2-secondary" onclick="ScholarkPrep.startMistakes()">Retry exact misses</button><button class="prep-v2-primary" onclick="ScholarkPrep.startMisconceptionReplay()">Replay with fresh items</button></div></section>
      <section class="prep-v2-card full"><div class="prep-v2-kicker">Test-Day Decision Simulator</div><h2>Practice choices that scores depend on</h2><p>Run a short timed set that measures when you solve, skip, return, use the calculator, work manually, or eliminate choices. The report separates content knowledge from decision quality.</p><div class="prep-v2-actions"><button class="prep-v2-primary" onclick="ScholarkPrep.startDecisionSimulator()">Start decision simulation</button></div></section>
    </div>`;
  }

  function renderLearn() {
    const domains = [...new Set(data.topics[state.test].map(item => item.domain))];
    const desmosCard = state.test === 'sat' ? `<button class="prep-v2-domain" onclick="ScholarkPrep.openCourse('desmos')"><span class="prep-v2-chip good">12 visual lessons</span><h3>The Complete Desmos Strategy Course</h3><p>Interactive, unofficial digital SAT Math walkthroughs with a targeted problem after every strategy.</p></button>` : '';
    app().innerHTML = `<div class="prep-v2-callout"><strong>Topic Academy:</strong> learn the tested idea, study a worked strategy, then launch a drill that updates the same mastery profile used by your plan.</div><section style="margin:22px 0"><h2 style="font-family:var(--font-display);margin-bottom:10px">Strategy courses</h2><div class="prep-v2-domain-grid">${desmosCard}<button class="prep-v2-domain" onclick="ScholarkPrep.openCourse('english')"><span class="prep-v2-chip good">12 rule systems</span><h3>English Rules That Actually Transfer</h3><p>Grammar, rhetoric, evidence, and inference decisions followed by targeted practice.</p></button></div></section>${domains.map(domain => `<section style="margin:22px 0"><h2 style="font-family:var(--font-display);margin-bottom:10px">${esc(domain)}</h2><div class="prep-v2-domain-grid">${data.topics[state.test].filter(item => item.domain === domain).map(item => { const m=mastery(item.id); return `<button class="prep-v2-domain" onclick="ScholarkPrep.openLesson('${item.id}')"><span class="prep-v2-chip ${masteryClass(m.score)}">${masteryLabel(m.score)} · ${Math.round(m.score)}%</span><h3>${esc(item.name)}</h3><p>${esc(item.lesson)}</p><div class="prep-v2-progress"><span style="width:${m.score}%"></span></div></button>`; }).join('')}</div></section>`).join('')}`;
  }

  function openCourse(courseId) {
    const course=strategyCourses[courseId]; if(!course)return;
    app().innerHTML=`<section class="prep-v2-card full"><button class="prep-v2-secondary" onclick="ScholarkPrep.showView('learn')">← Topic Academy</button><div class="prep-v2-kicker" style="margin-top:18px">Structured strategy course</div><h2>${esc(course.title)}</h2><p>${esc(course.subtitle)}</p>${courseId==='desmos'?'<div class="prep-v2-callout">Desmos is a trademark of Desmos Studio PBC. This independent course is not sponsored or approved by Desmos or College Board.</div>':''}<div class="prep-v2-domain-grid" style="margin-top:18px">${course.lessons.map((lesson,index)=>`<button class="prep-v2-domain" onclick="ScholarkPrep.openCourseLesson('${courseId}',${index})"><span class="prep-v2-chip">Lesson ${index+1}</span><h3>${esc(lesson[0])}</h3><p>${esc(lesson[1])}</p></button>`).join('')}</div></section>`;
  }

  function openCourseLesson(courseId,index) {
    const course=strategyCourses[courseId], lesson=course?.lessons[index]; if(!lesson)return;
    const isDesmos=courseId==='desmos', skillId=isDesmos?lesson[3]:lesson[2], steps=isDesmos?lesson[4]:lesson[3];
    app().innerHTML=`<section class="prep-v2-card full prep-v2-setup"><button class="prep-v2-secondary" onclick="ScholarkPrep.openCourse('${courseId}')">← ${esc(course.title)}</button><div class="prep-v2-kicker" style="margin-top:18px">Lesson ${index+1} of ${course.lessons.length}</div><h2>${esc(lesson[0])}</h2><p style="font-size:15px">${esc(lesson[1])}</p>${isDesmos?`<div class="prep-v2-graph-panel" style="margin-top:18px"><div class="prep-v2-kicker">Interactive visual</div><p class="prep-v2-muted">Example expression: <code>${esc(lesson[2])}</code>. Drag and zoom the graph, then open the calculator to change it.</p><canvas id="prep-graph" width="900" height="420" aria-label="Interactive graph for this lesson"></canvas><div class="prep-v2-graph-controls"><button class="prep-v2-secondary" onclick="ScholarkPrep.graphZoom(.75)">Zoom in</button><button class="prep-v2-secondary" onclick="ScholarkPrep.graphZoom(1.35)">Zoom out</button><button class="prep-v2-secondary" onclick="ScholarkPrep.renderCalculator()">Open full calculator</button><button class="prep-v2-secondary" onclick="ScholarkPrep.openDesmos()">Try in Desmos ↗</button><span id="prep-graph-coords" class="prep-v2-muted">Drag to pan</span></div></div>`:''}<h3 style="margin-top:20px">Repeatable method</h3><ol style="padding-left:20px;color:var(--ink2);line-height:1.8">${steps.map(step=>`<li>${esc(step)}</li>`).join('')}</ol><div class="prep-v2-callout"><strong>Your turn:</strong> solve a fresh question using the method before reading its explanation.</div><div class="prep-v2-actions"><button class="prep-v2-primary" onclick="ScholarkPrep.startSkill('${skillId}')">Start lesson practice</button><button class="prep-v2-secondary" onclick="ScholarkPrep.openCourseLesson('${courseId}',${Math.min(index+1,course.lessons.length-1)})">Next lesson →</button></div></section>`;
    if(isDesmos){graph.expression=lesson[2];graphReset();bindGraph();}
  }

  function openLesson(id) {
    const item = topic(id); if (!item) return;
    const examples = data.questions.filter(question => question.skill === id).slice(0,2);
    app().innerHTML = `<section class="prep-v2-card full prep-v2-setup"><button class="prep-v2-secondary" onclick="ScholarkPrep.showView('learn')">← Topic Academy</button><div class="prep-v2-kicker" style="margin-top:18px">${esc(item.section)} · ${esc(item.domain)}</div><h2>${esc(item.name)}</h2><p style="font-size:15px">${esc(item.lesson)}</p><div class="prep-v2-callout"><strong>Best strategy</strong>${esc(item.strategy)}</div><h3 style="margin-top:20px">What mastery looks like</h3><p>You can recognize the underlying relationship, choose an efficient method, explain why the correct answer works, and avoid the most common distractor without relying on memorized wording.</p>${examples.length ? `<h3 style="margin-top:20px">Preview examples</h3>${examples.map(example => `<div style="padding:13px 0;border-bottom:1px solid var(--border)"><strong>${esc(example.stem)}</strong><div class="prep-v2-muted">Difficulty ${example.difficulty}/4 · full explanation appears after answering</div></div>`).join('')}` : '<p class="prep-v2-muted" style="margin-top:16px">New drills for this topic are in content review.</p>'}<div class="prep-v2-actions"><button class="prep-v2-primary" onclick="ScholarkPrep.startSkill('${id}')">Practice this topic</button></div></section>`;
  }

  function renderTests() {
    const blueprint = data.blueprints[state.test];
    const available = testQuestions().length;
    const sat = state.test === 'sat';
    const sectionCards=(sat?[['Reading and Writing','54 questions · 64 minutes · two routed modules'],['Math','44 questions · 70 minutes · two routed modules']]:[['English','50 questions · 35 minutes'],['Math','45 questions · 50 minutes'],['Reading','36 questions · 40 minutes']]).map(([section,note])=>`<article class="prep-v2-card"><div class="prep-v2-kicker">Timed section</div><h3>${esc(section)}</h3><p>${esc(note)}</p><div class="prep-v2-actions"><button class="prep-v2-secondary" onclick="ScholarkPrep.startSectionTest('${section}')">Start section</button></div></article>`).join('');
    app().innerHTML = `<div class="prep-v2-grid"><section class="prep-v2-card wide"><div class="prep-v2-kicker">Realistic test-day mode</div><h2>${blueprint.label} full simulation</h2><p>${esc(blueprint.note)}</p><div class="prep-v2-callout">Answers and explanations remain hidden until the end. You can navigate within the current section or module, flag questions, and resume after an accidental refresh. Scholark approximates official structure, timing, and ${sat?'SAT module routing':'ACT’s linear section order'}; it is not official scoring software.</div><div class="prep-v2-actions"><button class="prep-v2-primary" onclick="ScholarkPrep.startFullTest()">Start full ${blueprint.label}</button><button class="prep-v2-secondary" onclick="ScholarkPrep.openOfficialPractice()">Official practice resources ↗</button></div></section><section class="prep-v2-card"><div class="prep-v2-kicker">Original practice library</div><div class="prep-v2-metric">${available}</div><p>Validated ${blueprint.label} question variants currently available in Scholark.</p></section><section class="prep-v2-card full"><div class="prep-v2-kicker">Section simulations</div><h2>Train one official-length section at a time</h2><div class="prep-v2-grid" style="margin-top:14px">${sectionCards}</div></section>${!sat ? `<section class="prep-v2-card full"><div class="prep-v2-kicker">Optional ACT section</div><h3>Science · 40 questions · 40 minutes</h3><p>Science is separate from the enhanced ACT core composite. Start it as an optional section.</p><div class="prep-v2-actions"><button class="prep-v2-secondary" onclick="ScholarkPrep.startScienceTest()">Start ACT Science</button></div></section>` : ''}</div>`;
  }

  function openOfficialPractice() {
    const url = state.test === 'sat' ? 'https://satsuite.collegeboard.org/practice' : 'https://www.act.org/content/act/en/products-and-services/the-act/test-preparation/free-act-test-prep.html';
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function balancedSelection(count, kind) {
    const pool = testQuestions();
    const selected = [];
    const used = new Set();
    const groups = kind === 'diagnostic' ? data.topics[state.test].map(item => item.id) : [...new Set(pool.map(question => question.domain))];
    groups.forEach(group => {
      const candidates = pool.filter(question => !used.has(question.id) && (kind === 'diagnostic' ? question.skill === group : question.domain === group));
      if (!candidates.length || selected.length >= count) return;
      const candidate = candidates.sort((a,b) => Math.abs(a.difficulty - targetDifficulty(a.skill)) - Math.abs(b.difficulty - targetDifficulty(b.skill)))[0];
      selected.push(candidate); used.add(candidate.id);
    });
    adaptivePool(pool.filter(question => !used.has(question.id))).slice(0, Math.max(0,count-selected.length)).forEach(question => selected.push(question));
    return selected.slice(0,count);
  }

  function targetDifficulty(skill) { return Math.max(1, Math.min(4, Math.round(mastery(skill).score / 25))); }
  function adaptivePool(pool) {
    return pool.slice().sort((a,b) => {
      const ma=mastery(a.skill), mb=mastery(b.skill);
      const scoreA=(100-effectiveMastery(a.skill))+(ma.attempts===0?22:0)+(reviewIsDue(a.skill)?28:0)-Math.abs(a.difficulty-targetDifficulty(a.skill))*7-(ma.lastSeen?Math.max(0,14-(Date.now()-Date.parse(ma.lastSeen))/86400000):0);
      const scoreB=(100-effectiveMastery(b.skill))+(mb.attempts===0?22:0)+(reviewIsDue(b.skill)?28:0)-Math.abs(b.difficulty-targetDifficulty(b.skill))*7-(mb.lastSeen?Math.max(0,14-(Date.now()-Date.parse(mb.lastSeen))/86400000):0);
      return scoreB-scoreA || a.id.localeCompare(b.id);
    });
  }

  function startDiagnostic() { startSession('diagnostic', balancedSelection(state.test === 'sat' ? 24 : 27, 'diagnostic'), {feedback:false}); }
  function startAdaptive() { startSession('practice', adaptivePool(testQuestions()).slice(0,10), {feedback:true, label:'Adaptive practice'}); }
  function startMemoryReview() {
    const dueSkills=data.topics[state.test].filter(item=>reviewIsDue(item.id)).map(item=>item.id),selected=[];
    for(const skill of dueSkills){const question=adaptivePool(testQuestions().filter(item=>item.skill===skill&&!selected.some(chosen=>chosen.id===item.id)))[0];if(question)selected.push(question);if(selected.length>=12)break;}
    if(!selected.length){if(typeof showToast==='function')showToast('No scheduled memory reviews are due yet. Your next reviews will appear automatically.','success');return;}
    startSession('practice',selected,{feedback:true,label:'Mastery Memory Review'});
  }
  function startSkill(id) {
    const pool = adaptivePool(testQuestions().filter(question => question.skill === id));
    if (!pool.length) { if (typeof showToast === 'function') showToast('This topic’s drill is still in content review.', 'error'); return; }
    startSession('practice', pool.slice(0,Math.min(10,pool.length)), {feedback:true,label:topic(id).name});
  }
  function startPractice() {
    const scope = document.getElementById('prep-scope')?.value || 'adaptive';
    const count = Number(document.getElementById('prep-length')?.value) || 10;
    let pool = testQuestions();
    if (scope.startsWith('skill:')) pool = pool.filter(question => question.skill === scope.slice(6));
    else if (scope.startsWith('domain:')) pool = pool.filter(question => question.domain === scope.slice(7));
    if (scope === 'adaptive') pool = adaptivePool(pool); else pool = shuffle(pool);
    startSession('practice', pool.slice(0,count), {feedback:true,label:scope === 'adaptive' ? 'Adaptive practice' : 'Focused practice'});
  }
  function startMistakes() {
    const missedIds = [...new Set(state.responses.filter(row => row.exam === state.test && !row.correct).map(row => row.questionId))];
    const pool = missedIds.map(id => data.questions.find(question => question.id === id)).filter(Boolean);
    if (!pool.length) { if (typeof showToast === 'function') showToast('No saved mistakes for this test yet.', 'success'); return; }
    startSession('practice', adaptivePool(pool).slice(0,20), {feedback:true,label:'Mistake review'});
  }
  function startMisconceptionReplay() {
    const recentMisses=state.responses.filter(row=>row.exam===state.test&&!row.correct).slice().reverse();
    const selected=[], replaySources=[], usedQuestions=new Set(), usedMisses=new Set();
    for(const miss of recentMisses){
      if(selected.length>=12||usedMisses.has(miss.questionId))continue;
      usedMisses.add(miss.questionId);
      const candidates=testQuestions().filter(question=>question.skill===miss.skill&&question.id!==miss.questionId&&!usedQuestions.has(question.id));
      candidates.sort((a,b)=>Math.abs(a.difficulty-(Number(miss.difficulty)||2))-Math.abs(b.difficulty-(Number(miss.difficulty)||2))||a.id.localeCompare(b.id));
      const fresh=candidates[0];
      if(!fresh)continue;
      usedQuestions.add(fresh.id);
      selected.push(fresh);
      replaySources.push({questionId:miss.questionId,errorType:miss.errorType||'unclassified miss',skill:miss.skill,at:miss.at||null});
    }
    if(!selected.length){if(typeof showToast==='function')showToast('Answer a few practice questions first so Scholark can build a fresh misconception replay.','error');return;}
    startSession('replay',selected,{feedback:true,label:'Misconception Replay Lab',replaySources});
  }
  function startDecisionSimulator() {
    const questions=balancedSelection(12,'decision');
    const minutes=state.test==='sat'?15:11;
    startSession('decision',questions,{feedback:false,label:'Test-Day Decision Simulator',timeLimit:minutes*60});
  }
  function startFullTest() {
    if (state.test === 'sat') {
      const formSeed=Date.now();
      const rw=buildModule(testQuestions().filter(q=>q.section==='Reading and Writing'),54,`sat-rw-${formSeed}`);
      const math=buildModule(testQuestions().filter(q=>q.section==='Math'),44,`sat-math-${formSeed}`);
      const selected=[...rw,...math];
      startSession('exam',selected,{feedback:false,label:'Full Digital SAT',segments:[
        {label:'Reading and Writing · Module 1',start:0,end:26,timeLimit:32*60,route:'mixed'},
        {label:'Reading and Writing · Module 2',start:27,end:53,timeLimit:32*60,route:'pending'},
        {label:'Math · Module 1',start:54,end:75,timeLimit:35*60,route:'mixed'},
        {label:'Math · Module 2',start:76,end:97,timeLimit:35*60,route:'pending'}
      ]});
      return;
    }
    const requirements={English:50,Math:45,Reading:36};
    const short=Object.entries(requirements).filter(([section,count])=>testQuestions().filter(q=>q.section===section).length<count);
    if(short.length){
      if(typeof showToast==='function')showToast(`ACT full-test content review is still expanding: ${short.map(([section])=>section).join(', ')} needs more nonrepeating items.`, 'error');
      return;
    }
    const selected=[];
    const formSeed=Date.now();
    Object.entries(requirements).forEach(([section,count])=>selected.push(...(section==='Reading'?buildActReadingSection(`act-${section}-${formSeed}`):buildModule(testQuestions().filter(q=>q.section===section),count,`act-${section}-${formSeed}`))));
    startSession('exam',selected,{feedback:false,label:'Full ACT',segments:[
      {label:'English',start:0,end:49,timeLimit:35*60,route:'linear'},
      {label:'Math',start:50,end:94,timeLimit:50*60,route:'linear'},
      {label:'Reading',start:95,end:130,timeLimit:40*60,route:'linear'}
    ]});
  }
  function startSectionTest(section) {
    const pool=testQuestions().filter(question=>question.section===section),seed=`${state.test}-${section}-${Date.now()}`;
    if(state.test==='sat'){
      const count=section==='Reading and Writing'?54:section==='Math'?44:0,moduleSize=count/2,timeLimit=section==='Reading and Writing'?32*60:35*60;
      if(!count||pool.length<count){if(typeof showToast==='function')showToast('That SAT section is not available.','error');return;}
      startSession('exam',buildModule(pool,count,seed),{feedback:false,label:`SAT ${section} Section`,segments:[
        {label:`${section} · Module 1`,start:0,end:moduleSize-1,timeLimit,route:'mixed'},
        {label:`${section} · Module 2`,start:moduleSize,end:count-1,timeLimit,route:'pending'}
      ]});
      return;
    }
    const configs={English:[50,35],Math:[45,50],Reading:[36,40]},config=configs[section];
    if(!config||pool.length<config[0]){if(typeof showToast==='function')showToast('That ACT section is not available.','error');return;}
    const questions=section==='Reading'?buildActReadingSection(seed):buildModule(pool,config[0],seed);
    startSession('exam',questions,{feedback:false,label:`ACT ${section} Section`,segments:[{label:section,start:0,end:config[0]-1,timeLimit:config[1]*60,route:'linear'}]});
  }
  function startScienceTest() {
    const pool = testQuestions().filter(q=>q.section==='Science');
    if(pool.length<40){if(typeof showToast==='function')showToast('ACT Science needs more nonrepeating reviewed items before a full section can start.','error');return;}
    startSession('exam', buildModule(pool,40,`act-science-${Date.now()}`), {feedback:false,label:'ACT Science',segments:[{label:'Optional Science',start:0,end:39,timeLimit:40*60,route:'linear'}]});
  }
  function buildModule(pool,count,seed,preference='mixed',excluded=new Set()) {
    const available=shuffle(pool.filter(q=>!excluded.has(q.id)),seed);
    const target=preference==='hard'?[4,3,4,3,2]:preference==='easier'?[1,2,2,1,3]:[2,3,1,4];
    const selected=[];
    target.forEach(difficulty=>{
      if(selected.length>=count)return;
      const index=available.findIndex(q=>q.difficulty===difficulty);
      if(index>=0)selected.push(available.splice(index,1)[0]);
    });
    available.sort((a,b)=>Math.abs(a.difficulty-target[selected.length%target.length])-Math.abs(b.difficulty-target[selected.length%target.length]));
    selected.push(...available.slice(0,Math.max(0,count-selected.length)));
    return selected.slice(0,count);
  }
  function buildActReadingSection(seed) {
    const grouped=testQuestions().filter(question=>question.section==='Reading'&&question.passageSet&&question.readingForm).reduce((map,question)=>{
      map[question.readingForm]??={};
      map[question.readingForm][question.passageSet]??=[];
      map[question.readingForm][question.passageSet].push(question);
      return map;
    },{});
    const completeForms=Object.entries(grouped).filter(([,sets])=>Object.values(sets).length===4&&Object.values(sets).every(rows=>rows.length===9));
    if(!completeForms.length)return buildModule(testQuestions().filter(question=>question.section==='Reading'),36,seed);
    const [form,sets]=shuffle(completeForms,seed)[0];
    const genreOrder=['Literary Narrative','Humanities','Social Science','Natural Science'];
    return Object.values(sets).sort((a,b)=>{
      const rank=rows=>{const genre=rows[0]?.passageGenre||'';const index=genreOrder.findIndex(label=>genre.startsWith(label));return index<0?99:index;};
      return rank(a)-rank(b)||a[0].passageSet.localeCompare(b[0].passageSet);
    }).flat().map(question=>Object.assign({},question,{readingForm:form}));
  }
  function shuffle(values,seed=Date.now()) {
    const result=values.slice(); let n=typeof seed==='number'?seed:String(seed).split('').reduce((s,c)=>s+c.charCodeAt(0),0);
    for(let i=result.length-1;i>0;i--){n=(n*1664525+1013904223)>>>0;const j=n%(i+1);[result[i],result[j]]=[result[j],result[i]];} return result;
  }

  function startSession(kind, questions, options) {
    if (!questions.length) { if (typeof showToast === 'function') showToast('No validated questions are available for that selection yet.', 'error'); return; }
    session={kind,questions,current:0,answers:new Array(questions.length).fill(null),confidence:new Array(questions.length).fill(null),hintsUsed:new Array(questions.length).fill(0),flags:[],startedAt:Date.now(),questionStartedAt:Date.now(),feedback:!!options.feedback,label:options.label||kind,timeLimit:options.timeLimit||null,segments:options.segments||null,segmentIndex:0,segmentStartedAt:Date.now(),finished:false,replaySources:options.replaySources||null,approaches:new Array(questions.length).fill(null),skipped:[],revisited:[]};
    state.view='practice'; updateChrome();
    saveSessionSnapshot();
    if(session.timeLimit) startTimer();
    renderSession();
  }

  function currentSegment() {
    if(!session?.segments?.length)return null;
    return session.segments[Math.max(0,Math.min(session.segmentIndex,session.segments.length-1))];
  }
  function segmentBounds() {
    const segment=currentSegment();
    return segment?{start:segment.start,end:segment.end}:{start:0,end:session.questions.length-1};
  }
  function remainingSegmentSeconds() {
    const segment=currentSegment();
    const limit=segment?.timeLimit||session?.timeLimit;
    if(!limit)return null;
    return Math.max(0,limit-Math.floor((Date.now()-(segment?session.segmentStartedAt:session.startedAt))/1000));
  }

  function pacingCoachMarkup(bounds, remaining) {
    if(remaining===null)return '';
    const segment=currentSegment(),limit=segment?.timeLimit||session.timeLimit,total=bounds.end-bounds.start+1;
    const answered=session.answers.slice(bounds.start,bounds.end+1).filter(value=>value!==null).length;
    const elapsed=Math.max(0,limit-remaining),targetPer=limit/total,targetElapsed=answered*targetPer,delta=Math.round(elapsed-targetElapsed);
    const tolerance=Math.max(25,Math.round(targetPer*.6));
    const status=answered===0&&elapsed<tolerance?'Establishing pace':delta>tolerance?'Behind checkpoint':delta<-tolerance?'Ahead of checkpoint':'On checkpoint';
    const guidance=delta>tolerance?'Use flag-and-return when a setup is not clear after one focused attempt.':delta<-tolerance?'Use the cushion to verify units, evidence, and the exact question asked.':'Keep the same decision rhythm; do not rush just because the timer is visible.';
    return `<div class="prep-v2-sidebox"><h4>Pacing Coach</h4><span class="prep-v2-chip ${delta>tolerance?'focus':'good'}">${status}</span><p>${answered} answered · target about ${formatTime(Math.round(targetPer))} per question.</p><p>${esc(guidance)}</p></div>`;
  }

  function guidedHint(question, level) {
    const currentTopic=topic(question.skill);
    if(level===1)return currentTopic?.strategy||'Translate the question into one precise task before evaluating the choices.';
    if(question.section==='Math')return 'Write the relationship with units, estimate the result, then test the most plausible choices or graph the two sides. Keep restrictions from the original problem.';
    if(question.section==='Science')return 'Read the axes, units, and condition labels first. Limit the conclusion to the tested range and change only the variable named in the procedure.';
    if(question.section==='English'||question.domain==='Standard English Conventions')return 'Identify the sentence core and the logical relationship around the blank. Eliminate choices that create a fragment, splice, agreement error, or redundant meaning.';
    return 'Return to the smallest phrase or detail that proves the claim. Eliminate choices that are broader, more absolute, or merely possible.';
  }

  function renderSession() {
    const q=session.questions[session.current], answer=session.answers[session.current], revealed=session.feedback&&answer!==null;
    const currentTopic=topic(q.skill);
    const elapsed=remainingSegmentSeconds(), bounds=segmentBounds(), segment=currentSegment();
    const replaySource=session.kind==='replay'?session.replaySources?.[session.current]:null;
    const decisionControls=session.kind==='decision'&&answer===null?`<div class="prep-v2-callout"><strong>Choose your approach before solving:</strong><div class="prep-v2-actions">${['manual','calculator','elimination'].map(method=>`<button class="prep-v2-secondary ${session.approaches[session.current]===method?'active':''}" onclick="ScholarkPrep.setApproach('${method}')">${method==='manual'?'Work manually':method==='calculator'?'Use calculator':'Eliminate choices'}</button>`).join('')}<button class="prep-v2-secondary" onclick="ScholarkPrep.skipQuestion()">Skip strategically →</button></div><span class="prep-v2-muted">Skipping is recorded as a decision, not an incorrect answer. Return before time expires to recover it.</span></div>`:'';
    const hintCount=session.hintsUsed?.[session.current]||0;
    const hintPanel=session.feedback&&answer===null?`<div class="prep-v2-callout"><strong>Guided Hint Ladder</strong>${Array.from({length:hintCount},(_,index)=>`<p style="margin-top:7px"><strong>Hint ${index+1}:</strong> ${esc(guidedHint(q,index+1))}</p>`).join('')}<div class="prep-v2-actions"><button class="prep-v2-secondary" onclick="ScholarkPrep.showHint()" ${hintCount>=2?'disabled':''}>${hintCount===0?'Show first hint':hintCount===1?'Show deeper hint':'Hints used'}</button></div></div>`:'';
    app().innerHTML=`<div class="prep-v2-toolbar"><div><strong>${esc(segment?.label||session.label)}</strong><div class="prep-v2-muted">${esc(q.section)} · Question ${session.current-bounds.start+1} of ${bounds.end-bounds.start+1}${segment?' in this module/section':''}</div></div><div style="display:flex;align-items:center;gap:10px">${elapsed!==null?`<span class="prep-v2-timer" id="prep-session-timer">${formatTime(elapsed)}</span>`:''}<button class="prep-v2-secondary" onclick="ScholarkPrep.finishSession(true)">End session</button></div></div>
      <div class="prep-v2-question-shell"><main class="prep-v2-question"><div class="prep-v2-qmeta"><span class="prep-v2-chip">${esc(q.exam.toUpperCase())}</span><span class="prep-v2-chip">${esc(currentTopic?.name||q.skill)}</span><span class="prep-v2-chip">Difficulty ${q.difficulty}/4</span>${q.calculator?'<span class="prep-v2-chip good">Calculator permitted</span>':''}${session.skipped.includes(session.current)?'<span class="prep-v2-chip focus">Returned skip</span>':''}</div>${replaySource?`<div class="prep-v2-callout"><strong>Fresh transfer check:</strong> this is a different question targeting the same skill as a saved <em>${esc(replaySource.errorType)}</em>.</div>`:''}${q.passage?`<div class="prep-v2-passage">${esc(q.passage)}</div>`:''}<div class="prep-v2-stem">${esc(q.stem)}</div>${decisionControls}${session.kind!=='exam'&&session.kind!=='decision'?`<div class="prep-v2-muted" style="margin-bottom:9px">Before answering, how confident are you? ${['low','medium','high'].map(level=>`<button class="prep-v2-chip ${session.confidence[session.current]===level?'good':''}" onclick="ScholarkPrep.setConfidence('${level}')" ${answer!==null?'disabled':''}>${level[0].toUpperCase()+level.slice(1)}</button>`).join('')}</div>`:''}${hintPanel}<div class="prep-v2-options">${q.options.map((option,index)=>{let cls=answer===index?' selected':'';if(revealed&&index===q.answer)cls+=' correct';if(revealed&&answer===index&&index!==q.answer)cls+=' wrong';return `<button class="prep-v2-option${cls}" ${answer!==null?'disabled':''} onclick="ScholarkPrep.answer(${index})"><span class="prep-v2-letter">${letters[index]}</span><span>${esc(option)}</span></button>`;}).join('')}</div>${revealed?`<div class="prep-v2-explanation"><strong>${answer===q.answer?'Correct':'Not quite'} · ${esc(currentTopic?.name||'Explanation')}</strong>${esc(q.explanation)}<div style="margin-top:7px"><strong>Strategy:</strong> ${esc(currentTopic?.strategy||'Verify the relationship asked for before selecting a choice.')}</div></div>`:''}<div class="prep-v2-toolbar"><button class="prep-v2-secondary" onclick="ScholarkPrep.previous()" ${session.current===bounds.start?'disabled':''}>← Previous</button><div><button class="prep-v2-secondary" onclick="ScholarkPrep.toggleFlag()">${session.flags.includes(session.current)?'★ Flagged':'☆ Flag'}</button> <button class="prep-v2-primary" onclick="ScholarkPrep.next()">${session.current===bounds.end?(segment&&session.segmentIndex<session.segments.length-1?'End module / section':'Finish'):'Next →'}</button></div></div></main>
      <aside class="prep-v2-side"><div class="prep-v2-sidebox"><h4>Question map</h4><div class="prep-v2-map">${session.questions.slice(bounds.start,bounds.end+1).map((item,offset)=>{const index=bounds.start+offset;return `<button class="${index===session.current?'current ':''}${session.answers[index]!==null?'done ':''}${session.flags.includes(index)?'flagged':''}" onclick="ScholarkPrep.goTo(${index})">${offset+1}</button>`;}).join('')}</div></div>${pacingCoachMarkup(bounds,elapsed)}<div class="prep-v2-sidebox"><h4>${esc(currentTopic?.name||'Current skill')}</h4><p>${esc(currentTopic?.lesson||'Use the information given to choose the best-supported answer.')}</p>${q.calculator?'<div class="prep-v2-actions"><button class="prep-v2-secondary" onclick="ScholarkPrep.openCalculatorDuringSession()">Open calculator</button></div>':''}</div><div class="prep-v2-sidebox"><h4>Saved automatically</h4><p>Answers and mastery updates are stored after each response. Signed-in progress also syncs to your account.</p></div></aside></div>`;
  }

  function answer(index) {
    if (!session || session.answers[session.current]!==null) return;
    if(session.kind==='decision'&&!session.approaches[session.current]){if(typeof showToast==='function')showToast('Choose manual work, calculator, or elimination before answering.','error');return;}
    const q=session.questions[session.current];
    session.answers[session.current]=index;
    const isCorrect=index===q.answer;
    recordResponse(q,isCorrect,index);
    if(session.kind==='diagnostic')adaptDiagnosticNext();
    saveSessionSnapshot();
    renderSession();
  }
  function setConfidence(level){if(!session||session.answers[session.current]!==null||!['low','medium','high'].includes(level))return;session.confidence[session.current]=level;saveSessionSnapshot();renderSession();}
  function showHint(){if(!session||!session.feedback||session.answers[session.current]!==null)return;session.hintsUsed[session.current]=Math.min(2,(session.hintsUsed[session.current]||0)+1);saveSessionSnapshot();renderSession();}
  function adaptDiagnosticNext(){
    const nextIndex=session.current+1;
    if(nextIndex>=session.questions.length||session.answers[nextIndex]!==null)return;
    const planned=session.questions[nextIndex],used=new Set(session.questions.map(question=>question.id));
    const candidates=testQuestions().filter(question=>question.skill===planned.skill&&!used.has(question.id));
    candidates.sort((a,b)=>Math.abs(a.difficulty-targetDifficulty(a.skill))-Math.abs(b.difficulty-targetDifficulty(b.skill))||a.id.localeCompare(b.id));
    if(candidates[0])session.questions[nextIndex]=candidates[0];
  }
  function setApproach(method){if(!session||session.kind!=='decision'||session.answers[session.current]!==null||!['manual','calculator','elimination'].includes(method))return;session.approaches[session.current]=method;saveSessionSnapshot();renderSession();}
  function markRevisit(index){if(session?.kind==='decision'&&session.skipped.includes(index)&&!session.revisited.includes(index))session.revisited.push(index);}
  function skipQuestion(){
    if(!session||session.kind!=='decision'||session.answers[session.current]!==null)return;
    const current=session.current,bounds=segmentBounds();
    if(!session.skipped.includes(current))session.skipped.push(current);
    if(!session.flags.includes(current))session.flags.push(current);
    let target=-1;
    for(let step=1;step<=bounds.end-bounds.start+1;step++){const candidate=bounds.start+((current-bounds.start+step)%(bounds.end-bounds.start+1));if(session.answers[candidate]===null&&!session.skipped.includes(candidate)){target=candidate;break;}}
    if(target<0){
      const returnable=session.skipped.find(index=>index>=bounds.start&&index<=bounds.end&&session.answers[index]===null&&index!==current);
      if(returnable!==undefined){target=returnable;markRevisit(target);}
    }
    if(target<0){if(typeof showToast==='function')showToast('Every remaining question has been skipped once. Use the question map to return and finish them.','success');saveSessionSnapshot();renderSession();return;}
    session.current=target;session.questionStartedAt=Date.now();saveSessionSnapshot();renderSession();
  }
  function recordResponse(q,correct,selected) {
    const now=new Date().toISOString(), row=mastery(q.skill), before=row.score;
    const gain=correct ? 7+q.difficulty*2 : -(7+(5-q.difficulty)*2);
    row.score=Math.max(5,Math.min(95,Math.round((row.score+gain)*10)/10));
    row.attempts+=1; if(correct) row.correct+=1; row.confidence=Math.min(100,Math.round(row.attempts/12*100)); row.lastSeen=now; row.trend=Math.round((row.score-before)*10)/10;
    row.retentionLevel=correct?Math.min(5,(Number(row.retentionLevel)||0)+1):0;
    const retentionDays=correct?([1,3,7,14,30][Math.max(0,row.retentionLevel-1)]||30):1;
    row.nextReviewAt=new Date(Date.now()+retentionDays*86400000).toISOString();
    const timeMs=Date.now()-session.questionStartedAt, confidence=session.confidence?.[session.current]||null;
    const errorType=correct?null:confidence==='high'?'confident misconception':timeMs<9000?'rushed decision':q.section==='Math'?'setup or calculation':'evidence or distractor';
    const hintsUsed=session.hintsUsed?.[session.current]||0;
    state.responses.push({questionId:q.id,exam:q.exam,skill:q.skill,difficulty:q.difficulty,correct,selected,answer:q.answer,confidence,errorType,at:now,timeMs,hintsUsed,sessionKind:session.kind,approach:session.approaches?.[session.current]||null,skipped:session.skipped?.includes(session.current)||false,revisited:session.revisited?.includes(session.current)||false});
    state.responses=state.responses.slice(-2000); state.xp+=correct?Math.max(4,10+q.difficulty*3-hintsUsed*4):2; updateStreak(); saveState();
  }
  function updateStreak() {
    const today=new Date().toISOString().slice(0,10); if(state.lastActiveDate===today)return;
    const prior=state.lastActiveDate?new Date(`${state.lastActiveDate}T12:00:00`):null; const now=new Date(`${today}T12:00:00`); const days=prior?Math.round((now-prior)/86400000):999;
    state.streak=days===1?state.streak+1:1; state.lastActiveDate=today;
  }
  function previous(){if(!session)return;const bounds=segmentBounds();if(session.current>bounds.start){session.current--;markRevisit(session.current);session.questionStartedAt=Date.now();saveSessionSnapshot();renderSession();}}
  function next(){if(!session)return;const bounds=segmentBounds();if(session.current>=bounds.end){advanceSegment(false);return;}session.current++;markRevisit(session.current);session.questionStartedAt=Date.now();saveSessionSnapshot();renderSession();}
  function goTo(index){if(!session)return;const bounds=segmentBounds();if(index>=bounds.start&&index<=bounds.end){session.current=index;markRevisit(index);session.questionStartedAt=Date.now();saveSessionSnapshot();renderSession();}}
  function advanceSegment(fromTimer) {
    if(!session)return;
    const completed=currentSegment();
    if(!fromTimer&&completed){
      const unanswered=session.answers.slice(completed.start,completed.end+1).filter(answer=>answer===null).length;
      if(unanswered&&!confirm(`Submit ${completed.label} with ${unanswered} unanswered question${unanswered===1?'':'s'}? You cannot return after advancing.`))return;
    }
    if(!session.segments||session.segmentIndex>=session.segments.length-1){finishSession(false);return;}
    const nextSegment=session.segments[session.segmentIndex+1];
    if(nextSegment.route==='pending')routeAdaptiveModule(completed,nextSegment);
    session.segmentIndex++;
    session.current=nextSegment.start;
    session.segmentStartedAt=Date.now();
    session.questionStartedAt=Date.now();
    saveSessionSnapshot();
    if(typeof showToast==='function')showToast(`${completed.label} ${fromTimer?'time ended':'submitted'}. ${nextSegment.label} is ready.`,fromTimer?'error':'success');
    renderSession();
  }
  function routeAdaptiveModule(completed,nextSegment) {
    const answered=[];
    for(let i=completed.start;i<=completed.end;i++)if(session.answers[i]!==null)answered.push(i);
    const correct=answered.filter(i=>session.answers[i]===session.questions[i].answer).length;
    const rate=answered.length?correct/answered.length:0;
    const preference=rate>=.6?'hard':'easier';
    const section=session.questions[completed.start].section;
    const excluded=new Set(session.questions.filter((q,index)=>index<nextSegment.start||index>nextSegment.end).map(q=>q.id));
    const replacement=buildModule(testQuestions().filter(q=>q.section===section),nextSegment.end-nextSegment.start+1,`${section}-${preference}-${Date.now()}`,preference,excluded);
    replacement.forEach((question,offset)=>{session.questions[nextSegment.start+offset]=question;session.answers[nextSegment.start+offset]=null;});
    nextSegment.route=preference;
  }
  function toggleFlag(){if(!session)return;const i=session.flags.indexOf(session.current);if(i>=0)session.flags.splice(i,1);else session.flags.push(session.current);saveSessionSnapshot();renderSession();}

  function finishSession(confirmEarly) {
    if(!session)return;
    const unanswered=session.answers.filter(answer=>answer===null).length;
    if(confirmEarly&&unanswered&& !confirm(`End now with ${unanswered} unanswered question${unanswered===1?'':'s'}?`))return;
    stopTimer(); const finished=session; session=null; clearSessionSnapshot();
    const answered=finished.answers.filter(answer=>answer!==null).length;
    const correct=finished.questions.reduce((sum,q,index)=>sum+(finished.answers[index]===q.answer?1:0),0);
    const accuracyValue=answered?Math.round(correct/answered*100):0;
    if(finished.kind==='diagnostic') state.diagnostic[state.test]={completedAt:new Date().toISOString(),correct,total:finished.questions.length,answered,accuracy:accuracyValue,weakest:weakestTopics(5).map(item=>item.id)};
    saveState();
    const breakdown={}; finished.questions.forEach((q,index)=>{const key=q.domain;breakdown[key]??={total:0,correct:0};breakdown[key].total++;if(finished.answers[index]===q.answer)breakdown[key].correct++;});
    if(finished.kind==='decision'){
      const skipped=finished.skipped.length,recovered=finished.skipped.filter(index=>finished.answers[index]!==null).length;
      const decisionResponses=state.responses.filter(row=>row.sessionKind==='decision'&&finished.questions.some(q=>q.id===row.questionId)&&Date.parse(row.at)>=finished.startedAt);
      const averageSeconds=decisionResponses.length?Math.round(decisionResponses.reduce((sum,row)=>sum+(Number(row.timeMs)||0),0)/decisionResponses.length/1000):0;
      const deliberate=decisionResponses.filter(row=>row.approach).length;
      const quality=Math.round(((answered?correct/answered:0)*60+(skipped?recovered/skipped:1)*25+(decisionResponses.length?deliberate/decisionResponses.length:0)*15));
      app().innerHTML=`<section class="prep-v2-card full prep-v2-setup"><div class="prep-v2-kicker">Decision simulation complete</div><h2>Content knowledge and test-day choices, separated</h2><div class="prep-v2-grid" style="margin-top:18px"><div class="prep-v2-card"><div class="prep-v2-metric">${quality}%</div><p>Decision quality index</p></div><div class="prep-v2-card"><div class="prep-v2-metric">${recovered}/${skipped}</div><p>Strategic skips recovered</p></div><div class="prep-v2-card"><div class="prep-v2-metric">${averageSeconds}s</div><p>Average answered-question time</p></div></div><div class="prep-v2-callout"><strong>How to read this:</strong> the index combines answered accuracy (60%), recovery of deliberate skips (25%), and whether you named a solving approach (15%). It is a coaching metric, not an official test score.</div><h3 style="margin-top:22px">Approach review</h3>${['manual','calculator','elimination'].map(method=>{const rows=decisionResponses.filter(row=>row.approach===method),right=rows.filter(row=>row.correct).length;return `<div class="prep-v2-mastery-row"><span>${method==='manual'?'Manual work':method==='calculator'?'Calculator':'Choice elimination'}</span><div class="prep-v2-progress"><span style="width:${rows.length?Math.round(right/rows.length*100):0}%"></span></div><strong>${right}/${rows.length}</strong></div>`;}).join('')}<div class="prep-v2-actions"><button class="prep-v2-primary" onclick="ScholarkPrep.startDecisionSimulator()">Run another sprint</button><button class="prep-v2-secondary" onclick="ScholarkPrep.showView('dashboard')">View updated plan</button></div></section>`;
      return;
    }
    if(finished.kind==='replay'){
      const recovered=finished.questions.filter((q,index)=>finished.answers[index]===q.answer).length;
      app().innerHTML=`<section class="prep-v2-card full prep-v2-setup"><div class="prep-v2-kicker">Misconception replay complete</div><h2>${recovered}/${finished.questions.length} fresh transfer checks recovered</h2><p>This result uses different questions from the original misses, so it measures whether the underlying skill transferred—not whether an answer was memorized.</p><h3 style="margin-top:22px">Transfer by error pattern</h3>${Object.entries(finished.replaySources.reduce((groups,source,index)=>{const key=source.errorType||'unclassified miss';groups[key]??={total:0,correct:0};groups[key].total++;if(finished.answers[index]===finished.questions[index].answer)groups[key].correct++;return groups;},{})).map(([label,row])=>`<div class="prep-v2-mastery-row"><span>${esc(label)}</span><div class="prep-v2-progress"><span style="width:${Math.round(row.correct/row.total*100)}%"></span></div><strong>${row.correct}/${row.total}</strong></div>`).join('')}<div class="prep-v2-actions"><button class="prep-v2-primary" onclick="ScholarkPrep.startMisconceptionReplay()">Build another fresh replay</button><button class="prep-v2-secondary" onclick="ScholarkPrep.showView('dashboard')">View updated plan</button></div></section>`;
      return;
    }
    const completedRows=state.responses.filter(row=>Date.parse(row.at)>=finished.startedAt&&finished.questions.some(question=>question.id===row.questionId));
    const averageTime=completedRows.length?Math.round(completedRows.reduce((sum,row)=>sum+(Number(row.timeMs)||0),0)/completedRows.length/1000):0;
    const skillTimes={};completedRows.forEach(row=>{skillTimes[row.skill]??={total:0,count:0};skillTimes[row.skill].total+=Number(row.timeMs)||0;skillTimes[row.skill].count++;});
    const slowest=Object.entries(skillTimes).sort((a,b)=>b[1].total/b[1].count-a[1].total/a[1].count)[0];
    const hintTotal=completedRows.reduce((sum,row)=>sum+(Number(row.hintsUsed)||0),0);
    const pacingReport=completedRows.length?`<div class="prep-v2-callout"><strong>Session behavior:</strong> ${averageTime}s average per answered question${slowest?` · slowest recurring skill: ${esc(topic(slowest[0])?.name||slowest[0])} (${Math.round(slowest[1].total/slowest[1].count/1000)}s average)`:''} · ${hintTotal} guided hint${hintTotal===1?'':'s'} used.</div>`:'';
    app().innerHTML=`<section class="prep-v2-card full prep-v2-setup"><div class="prep-v2-kicker">Session complete</div><h2>${esc(finished.label)}</h2><div class="prep-v2-grid" style="margin-top:18px"><div class="prep-v2-card"><div class="prep-v2-metric">${correct}/${finished.questions.length}</div><p>Correct</p></div><div class="prep-v2-card"><div class="prep-v2-metric">${accuracyValue}%</div><p>Answered accuracy</p></div><div class="prep-v2-card"><div class="prep-v2-metric">${finished.flags.length}</div><p>Flagged</p></div></div>${pacingReport}<h3 style="margin-top:22px">Domain breakdown</h3>${Object.entries(breakdown).map(([domain,row])=>`<div class="prep-v2-mastery-row"><span>${esc(domain)}</span><div class="prep-v2-progress"><span style="width:${Math.round(row.correct/row.total*100)}%"></span></div><strong>${row.correct}/${row.total}</strong></div>`).join('')}<div class="prep-v2-actions"><button class="prep-v2-primary" onclick="ScholarkPrep.showView('dashboard')">View updated plan</button><button class="prep-v2-secondary" onclick="ScholarkPrep.startAdaptive()">Practice priorities</button></div></section>`;
  }
  function startTimer(){stopTimer();timerId=setInterval(()=>{if(!session||(session.timeLimit==null&&!session.segments?.length))return stopTimer();const left=remainingSegmentSeconds();const el=document.getElementById('prep-session-timer');if(el&&left!==null)el.textContent=formatTime(left);if(left!==null&&left<=0)advanceSegment(true);},1000);}
  function stopTimer(){if(timerId){clearInterval(timerId);timerId=null;}}
  function formatTime(seconds){return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;}

  function renderCalculator() {
    app().innerHTML=`${session?'<div class="prep-v2-actions" style="margin:0 0 12px"><button class="prep-v2-primary" onclick="ScholarkPrep.returnToSession()">← Return to current question</button><span class="prep-v2-muted">Your timer continues while the calculator is open.</span></div>':''}<div class="prep-v2-callout"><strong>Scholark Graphing Calculator</strong> Designed for digital SAT-style practice. It is not College Board- or ACT-approved, and it does not replace checking each test’s calculator policy.</div><div class="prep-v2-calc"><section class="prep-v2-calc-panel"><input id="prep-calc-expression" class="prep-v2-calc-display" value="${esc(graph.expression)}" aria-label="Calculator expression" oninput="ScholarkPrep.calcPreview()" onkeydown="if(event.key==='Enter')ScholarkPrep.calcPreview()"><div id="prep-calc-result" class="prep-v2-calc-result">—</div><div class="prep-v2-keypad">${['7','8','9','(',')','4','5','6','+','−','1','2','3','×','÷','0','.','x','^','√','sin(','cos(','tan(','log(','ln(','π','e','⌫','Clear'].map(key=>`<button onclick="ScholarkPrep.calcKey('${key.replace(/'/g,"\\'")}')">${key}</button>`).join('')}</div><div class="prep-v2-actions"><button class="prep-v2-primary" onclick="ScholarkPrep.plotExpression()">Graph expression</button><button class="prep-v2-secondary" onclick="ScholarkPrep.findRoots()">Find visible roots</button></div><div id="prep-calc-table" class="prep-v2-muted" style="margin-top:12px"></div><div class="prep-v2-actions"><button class="prep-v2-secondary" onclick="ScholarkPrep.openDesmos()">Open Desmos Calculator ↗</button></div><p class="prep-v2-muted" style="margin-top:8px">Desmos opens on its own website in a new tab. Scholark does not embed or claim affiliation with Desmos.</p></section><section class="prep-v2-graph-panel"><canvas id="prep-graph" width="900" height="520" aria-label="Graph of the entered function"></canvas><div class="prep-v2-graph-controls"><button class="prep-v2-secondary" onclick="ScholarkPrep.graphZoom(.75)">Zoom in</button><button class="prep-v2-secondary" onclick="ScholarkPrep.graphZoom(1.35)">Zoom out</button><button class="prep-v2-secondary" onclick="ScholarkPrep.graphReset()">Reset view</button><span id="prep-graph-coords" class="prep-v2-muted">Drag to pan · scroll to zoom</span></div></section></div>`;
    bindGraph(); calcPreview(); drawGraph();
  }
  function normalizeExpression(raw) {
    const input=String(raw||'').trim().replace(/π/g,'pi').replace(/√/g,'sqrt').replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-').replace(/\^/g,'**');
    if(!input||input.length>180)throw new Error('Enter a shorter expression.');
    const identifiers=input.match(/[A-Za-z_]+/g)||[]; const allowed=new Set(['x','pi','e','sin','cos','tan','asin','acos','atan','sqrt','abs','log','ln','exp','floor','ceil','round','min','max']);
    if(identifiers.some(name=>!allowed.has(name))||!/^[0-9A-Za-z_+\-*/().,\s]*$/.test(input))throw new Error('Use numbers, x, standard operators, and the listed functions only.');
    return input;
  }
  function compileExpression(raw) {
    const normalized=normalizeExpression(raw).replace(/\bln\b/g,'_ln').replace(/\blog\b/g,'_log10').replace(/\bpi\b/g,'PI');
    return new Function('x',`"use strict";const {sin,cos,tan,asin,acos,atan,sqrt,abs,log,log10,exp,floor,ceil,round,min,max,PI,E}=Math;const e=E,_ln=log,_log10=log10;return (${normalized});`);
  }
  function calcPreview() {
    const input=document.getElementById('prep-calc-expression'), output=document.getElementById('prep-calc-result'); if(!input||!output)return;
    graph.expression=input.value;
    try { const value=compileExpression(input.value)(0); output.textContent=Number.isFinite(value)?Number(value.toPrecision(12)):'Undefined at x = 0'; output.style.color='var(--ink)'; }
    catch(error){output.textContent=error.message||'Invalid expression';output.style.color='var(--red)';}
  }
  function calcKey(key) {
    const input=document.getElementById('prep-calc-expression');if(!input)return;
    const map={'−':'-','×':'*','÷':'/','√':'sqrt(','π':'pi'};
    if(key==='Clear')input.value='';else if(key==='⌫')input.value=input.value.slice(0,-1);else input.value+=map[key]||key;calcPreview();input.focus();
  }
  function plotExpression(){const input=document.getElementById('prep-calc-expression');if(!input)return;try{compileExpression(input.value);graph.expression=input.value;drawGraph();renderTable();}catch(error){if(typeof showToast==='function')showToast(error.message,'error');}}
  function bindGraph(){const canvas=document.getElementById('prep-graph');if(!canvas)return;canvas.addEventListener('wheel',event=>{event.preventDefault();graphZoom(event.deltaY>0?1.18:.85);},{passive:false});canvas.addEventListener('pointerdown',event=>{graph.dragging=true;graph.lastX=event.offsetX;graph.lastY=event.offsetY;canvas.setPointerCapture(event.pointerId);});canvas.addEventListener('pointerup',()=>graph.dragging=false);canvas.addEventListener('pointermove',event=>{const rect=canvas.getBoundingClientRect(),x=graph.minX+event.offsetX/rect.width*(graph.maxX-graph.minX),y=graph.maxY-event.offsetY/rect.height*(graph.maxY-graph.minY);const coords=document.getElementById('prep-graph-coords');if(coords)coords.textContent=`x ${x.toFixed(2)} · y ${y.toFixed(2)}`;if(!graph.dragging)return;const dx=(event.offsetX-graph.lastX)/rect.width*(graph.maxX-graph.minX),dy=(event.offsetY-graph.lastY)/rect.height*(graph.maxY-graph.minY);graph.minX-=dx;graph.maxX-=dx;graph.minY+=dy;graph.maxY+=dy;graph.lastX=event.offsetX;graph.lastY=event.offsetY;drawGraph();});}
  function drawGraph(){const canvas=document.getElementById('prep-graph');if(!canvas)return;const rect=canvas.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);canvas.width=Math.max(600,Math.round(rect.width*dpr));canvas.height=Math.max(360,Math.round(rect.height*dpr));const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);const toX=x=>(x-graph.minX)/(graph.maxX-graph.minX)*w,toY=y=>(graph.maxY-y)/(graph.maxY-graph.minY)*h;ctx.strokeStyle='#e5e7eb';ctx.lineWidth=1;const step=niceStep((graph.maxX-graph.minX)/10);ctx.font=`${11*dpr}px sans-serif`;ctx.fillStyle='#64748b';for(let x=Math.ceil(graph.minX/step)*step;x<=graph.maxX;x+=step){const px=toX(x);ctx.beginPath();ctx.moveTo(px,0);ctx.lineTo(px,h);ctx.stroke();if(Math.abs(x)>step/10)ctx.fillText(Number(x.toFixed(4)),px+3,Math.min(h-4,Math.max(12*dpr,toY(0)-4)));}for(let y=Math.ceil(graph.minY/step)*step;y<=graph.maxY;y+=step){const py=toY(y);ctx.beginPath();ctx.moveTo(0,py);ctx.lineTo(w,py);ctx.stroke();if(Math.abs(y)>step/10)ctx.fillText(Number(y.toFixed(4)),Math.min(w-35,Math.max(3,toX(0)+4)),py-3);}ctx.strokeStyle='#334155';ctx.lineWidth=1.5*dpr;ctx.beginPath();ctx.moveTo(0,toY(0));ctx.lineTo(w,toY(0));ctx.moveTo(toX(0),0);ctx.lineTo(toX(0),h);ctx.stroke();let fn;try{fn=compileExpression(graph.expression);}catch{return;}ctx.strokeStyle='#c8622a';ctx.lineWidth=2.4*dpr;ctx.beginPath();let drawing=false,lastY=null;for(let px=0;px<=w;px++){const x=graph.minX+px/w*(graph.maxX-graph.minX),y=fn(x),py=toY(y);if(!Number.isFinite(y)||py<-h*2||py>h*3||(lastY!==null&&Math.abs(py-lastY)>h*.8)){drawing=false;lastY=py;continue;}if(!drawing){ctx.moveTo(px,py);drawing=true;}else ctx.lineTo(px,py);lastY=py;}ctx.stroke();}
  function niceStep(raw){const power=Math.pow(10,Math.floor(Math.log10(raw||1))),value=raw/power;return (value<2?1:value<5?2:5)*power;}
  function graphZoom(factor){const cx=(graph.minX+graph.maxX)/2,cy=(graph.minY+graph.maxY)/2,hx=(graph.maxX-graph.minX)*factor/2,hy=(graph.maxY-graph.minY)*factor/2;graph.minX=cx-hx;graph.maxX=cx+hx;graph.minY=cy-hy;graph.maxY=cy+hy;drawGraph();}
  function graphReset(){graph.minX=-10;graph.maxX=10;graph.minY=-10;graph.maxY=10;drawGraph();}
  function renderTable(){const el=document.getElementById('prep-calc-table');if(!el)return;try{const fn=compileExpression(graph.expression);el.innerHTML='<strong>Value table</strong><br>'+[-3,-2,-1,0,1,2,3].map(x=>`x=${x}: y=${Number.isFinite(fn(x))?Number(fn(x).toPrecision(7)):'undefined'}`).join(' · ');}catch(error){el.textContent=error.message;}}
  function findRoots(){const el=document.getElementById('prep-calc-table');if(!el)return;try{const fn=compileExpression(graph.expression),roots=[];let lastX=graph.minX,lastY=fn(lastX);for(let i=1;i<=2000;i++){const x=graph.minX+(graph.maxX-graph.minX)*i/2000,y=fn(x);if(Number.isFinite(y)&&Math.abs(y)<1e-5)roots.push(x);else if(Number.isFinite(y)&&Number.isFinite(lastY)&&y*lastY<0){let a=lastX,b=x;for(let j=0;j<35;j++){const m=(a+b)/2;if(fn(a)*fn(m)<=0)b=m;else a=m;}roots.push((a+b)/2);}lastX=x;lastY=y;}const unique=roots.filter((root,index)=>index===0||Math.abs(root-roots[index-1])>.01);el.innerHTML=`<strong>Visible roots:</strong> ${unique.length?unique.map(root=>Number(root.toFixed(6))).join(', '):'none found in the current x-range'}`;}catch(error){el.textContent=error.message;}}
  function openDesmos(){window.open('https://www.desmos.com/calculator','_blank','noopener,noreferrer');}
  function openCalculatorDuringSession(){if(!session)return;renderCalculator();}
  function returnToSession(){if(session)renderSession();}

  const API={init,setTest,showView,savePlan,openPlanStudio,applyPlanScenario,startDiagnostic,startAdaptive,startMemoryReview,startSkill,startPractice,startMistakes,startMisconceptionReplay,startDecisionSimulator,openLesson,openCourse,openCourseLesson,startFullTest,startSectionTest,startScienceTest,openOfficialPractice,answer,setConfidence,showHint,setApproach,skipQuestion,previous,next,goTo,toggleFlag,finishSession,renderCalculator,calcPreview,calcKey,plotExpression,findRoots,graphZoom,graphReset,openDesmos,openCalculatorDuringSession,returnToSession};
  window.ScholarkPrep=API;
  window.initPrep=init;
  window.setPrepSubject=function(){};
  window.setPrepDifficulty=function(){};
  window.selectPrepAnswer=answer;
  window.nextPrepQuestion=next;
})();
