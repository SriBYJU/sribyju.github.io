(function (root) {
  'use strict';

  const data = root.ScholarkAPData;
  if (!data) { console.error('Scholark AP Studio could not start because its curriculum data did not load.'); return; }

  const STORAGE_PREFIX = 'gs_ap_v2_';
  const letters = ['A', 'B', 'C', 'D'];
  const views = ['overview', 'adaptive', 'units', 'patterns', 'tasks', 'exam', 'score', 'resources'];
  let state = null;
  let subject = null;
  let view = 'overview';
  let session = null;
  let timerId = null;
  let cloudTimer = null;
  let keyboardBound = false;
  let hubFilter = { search: '', category: 'All' };
  let taskDraft = null;

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>'"]/g, function (char) { return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' })[char]; });
  }

  function safeParse(raw) {
    try { const parsed = JSON.parse(raw); return parsed && typeof parsed === 'object' ? parsed : null; }
    catch (error) { console.warn('Ignored damaged AP progress data:', error); return null; }
  }

  function storageKey() {
    const identity = root.currentUser && root.currentUser.uid ? root.currentUser.uid : 'guest';
    return STORAGE_PREFIX + String(identity).replace(/[^a-zA-Z0-9_-]/g, '_');
  }

  function defaultSubjectState(s) {
    const mastery = {};
    s.units.forEach(function (u, i) { mastery[i] = { score: 50, attempts: 0, correct: 0, confidenceTotal: 0, confidenceCount: 0, nextReviewAt: null, lastSeen: null }; });
    return { target: 5, examDate: '', mastery, responses: [], taskAttempts: [], scoreHistory: [], bookmarks: [], notes: {}, currentSession: null, teachbacks: [], updatedAt: null };
  }

  function defaultState() {
    return { version: data.version, updatedAt: null, activeSubject: null, subjects: {}, preferences: { reducedMotion: false } };
  }

  function ensureSubject(id) {
    if (!state.subjects[id] || typeof state.subjects[id] !== 'object') state.subjects[id] = defaultSubjectState(data.subjectMap[id]);
    const current = state.subjects[id];
    const fresh = defaultSubjectState(data.subjectMap[id]);
    current.mastery = current.mastery && typeof current.mastery === 'object' ? current.mastery : fresh.mastery;
    Object.keys(fresh.mastery).forEach(function (key) {
      if (!current.mastery[key]) current.mastery[key] = fresh.mastery[key];
      else current.mastery[key] = Object.assign({}, fresh.mastery[key], current.mastery[key]);
    });
    current.responses = Array.isArray(current.responses) ? current.responses.slice(-2500) : [];
    current.taskAttempts = Array.isArray(current.taskAttempts) ? current.taskAttempts.slice(-300) : [];
    current.scoreHistory = Array.isArray(current.scoreHistory) ? current.scoreHistory.slice(-100) : [];
    current.bookmarks = Array.isArray(current.bookmarks) ? Array.from(new Set(current.bookmarks)) : [];
    current.notes = current.notes && typeof current.notes === 'object' ? current.notes : {};
    current.teachbacks = Array.isArray(current.teachbacks) ? current.teachbacks.slice(-200) : [];
    return current;
  }

  function loadState() {
    const saved = safeParse(localStorage.getItem(storageKey()));
    state = Object.assign(defaultState(), saved || {});
    state.subjects = state.subjects && typeof state.subjects === 'object' ? state.subjects : {};
    data.subjects.forEach(function (s) { ensureSubject(s.id); });
  }

  function saveState(syncCloud) {
    state.version = data.version;
    state.updatedAt = new Date().toISOString();
    if (subject) ensureSubject(subject.id).updatedAt = state.updatedAt;
    try { localStorage.setItem(storageKey(), JSON.stringify(state)); }
    catch (error) {
      console.error('AP progress could not be saved locally:', error);
      toast('Progress could not be saved in this browser.', 'error');
      return false;
    }
    if (syncCloud !== false) scheduleCloudSync();
    return true;
  }

  function scheduleCloudSync() {
    if (!root.currentUser || !root.currentUser.uid || !root._dbSaveSyncState) return;
    clearTimeout(cloudTimer);
    cloudTimer = setTimeout(async function () {
      try {
        await root._dbSaveSyncState(root.currentUser.uid, 'ap-study', [{ id: 'ap-v2', state, updatedAt: state.updatedAt }]);
      } catch (error) {
        console.error('AP cloud sync failed:', error);
        toast('Cloud sync failed. Your AP progress is still saved on this device.', 'error');
      }
    }, 900);
  }

  async function loadCloudState() {
    if (!root.currentUser || !root.currentUser.uid || !root._dbGetSyncState) return;
    try {
      const remote = await root._dbGetSyncState(root.currentUser.uid, 'ap-study');
      const remoteState = Array.isArray(remote) ? (remote.find(function (x) { return x && x.id === 'ap-v2'; }) || {}).state : null;
      if (!remoteState) { scheduleCloudSync(); return; }
      if ((Date.parse(remoteState.updatedAt || 0) || 0) > (Date.parse(state.updatedAt || 0) || 0)) {
        const local = state;
        state = Object.assign(defaultState(), remoteState);
        state.subjects = Object.assign({}, local.subjects || {}, remoteState.subjects || {});
        data.subjects.forEach(function (s) { ensureSubject(s.id); });
        saveState(false);
        render();
      } else scheduleCloudSync();
    } catch (error) {
      console.error('AP cloud progress could not be loaded:', error);
      toast('Cloud progress could not be loaded. This device’s AP progress is available.', 'error');
    }
  }

  function toast(message, type) {
    if (typeof root.showToast === 'function') root.showToast(message, type || 'info');
    else {
      const live = document.getElementById('ap2-live');
      if (live) live.textContent = message;
    }
  }

  function rootNode() { return document.getElementById('page-ap'); }
  function subjectState() { return ensureSubject(subject.id); }
  function masteryAverage(s) {
    const rows = Object.values(ensureSubject(s.id).mastery);
    return Math.round(rows.reduce(function (sum, row) { return sum + Number(row.score || 0); }, 0) / Math.max(1, rows.length));
  }
  function dueCount(s) {
    const now = Date.now();
    return Object.values(ensureSubject(s.id).mastery).filter(function (row) { return row.nextReviewAt && Date.parse(row.nextReviewAt) <= now; }).length;
  }

  function init() {
    stopTimer();
    loadState();
    subject = state.activeSubject ? data.subjectMap[state.activeSubject] : null;
    if (subject) session = restoreSession(subjectState().currentSession);
    bind();
    render();
    loadCloudState();
  }

  function bind() {
    const page = rootNode();
    if (!page || page.dataset.ap2Bound) return;
    page.dataset.ap2Bound = 'true';
    page.addEventListener('click', handleClick);
    page.addEventListener('input', handleInput);
    page.addEventListener('change', handleChange);
    if (!keyboardBound) { document.addEventListener('keydown', handleKey); keyboardBound = true; }
  }

  function handleClick(event) {
    const button = event.target.closest('[data-ap-action]');
    if (!button) return;
    const action = button.dataset.apAction;
    const id = button.dataset.id;
    if (action === 'category') { hubFilter.category = id; renderHub(); }
    else if (action === 'open-subject') openSubject(id);
    else if (action === 'hub') backToHub();
    else if (action === 'view') { view = id; stopTimerIfNoSession(); renderSubject(); }
    else if (action === 'start') startSession(button.dataset.kind, button.dataset.unit == null ? null : Number(button.dataset.unit));
    else if (action === 'session-option') selectOption(Number(id));
    else if (action === 'eliminate') toggleEliminate(Number(id));
    else if (action === 'confidence') setConfidence(Number(id));
    else if (action === 'submit-answer') submitAnswer();
    else if (action === 'next-question') nextQuestion();
    else if (action === 'previous-question') previousQuestion();
    else if (action === 'jump-question') jumpQuestion(Number(id));
    else if (action === 'flag') toggleFlag();
    else if (action === 'finish-session') finishSession();
    else if (action === 'resume-session') { view = 'adaptive'; renderSubject(); startTimer(); }
    else if (action === 'discard-session') discardSession();
    else if (action === 'open-unit') { view = 'units'; renderSubject(Number(id)); }
    else if (action === 'task-open') openTask(id);
    else if (action === 'task-grade') gradeTask();
    else if (action === 'task-new') openTask(id, true);
    else if (action === 'copy-cram') copyCram();
    else if (action === 'print') window.print();
    else if (action === 'teachback') openTeachback(Number(id), Number(button.dataset.concept));
    else if (action === 'teachback-check') checkTeachback(Number(button.dataset.unit), Number(button.dataset.concept));
    else if (action === 'bookmark') toggleBookmark(id);
  }

  function handleInput(event) {
    if (event.target.id === 'ap2-search') { hubFilter.search = event.target.value.toLowerCase(); renderHubGrid(); }
    else if (event.target.id === 'ap2-scratch' && session) { session.scratch[session.idx] = event.target.value; persistSession(); }
    else if (event.target.id === 'ap2-task-answer' && taskDraft) { taskDraft.answer = event.target.value; subjectState().notes['task-draft-' + taskDraft.task.id] = taskDraft.answer; saveState(); }
    else if (event.target.matches('[data-ap-note]') && subject) { subjectState().notes[event.target.dataset.apNote] = event.target.value; saveState(); }
  }

  function handleChange(event) {
    if (event.target.id === 'ap2-target' && subject) { subjectState().target = Number(event.target.value); saveState(); renderSubject(); }
    else if (event.target.id === 'ap2-exam-date' && subject) { subjectState().examDate = event.target.value; saveState(); renderSubject(); }
  }

  function handleKey(event) {
    if (!subject || !session || view !== 'adaptive' || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) return;
    if (/^[1-4]$/.test(event.key)) { event.preventDefault(); selectOption(Number(event.key) - 1); }
    else if (event.key === 'ArrowRight') { event.preventDefault(); nextQuestion(); }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); previousQuestion(); }
    else if (event.key.toLowerCase() === 'f') { event.preventDefault(); toggleFlag(); }
  }

  function render() {
    if (!rootNode()) return;
    if (subject) renderSubject(); else renderHub();
  }

  function renderHub() {
    stopTimer();
    const categories = ['All'].concat(Array.from(new Set(data.subjects.map(function (s) { return s.category; }))));
    rootNode().innerHTML = '<aside class="ad-reserve ad-reserve-leaderboard" data-ad-placement="ap-leaderboard" aria-label="Advertisement"><span class="ad-reserve-label">Advertisement</span></aside>' +
      '<main class="ap2-shell" style="--ap-accent:#7457d7;--ap-accent2:#3c7adf"><section class="ap2-hub-hero">' +
      '<div class="ap2-kicker">Scholark AP Command Center · 2027 formats</div><h1>One study system. ' + data.subjects.length + ' different AP realities.</h1>' +
      '<p class="ap2-lede">Open your course for adaptive practice, unit crash courses, pattern recognition, exam-specific task coaching, timed forms, and an evidence-weighted score studio. Every course follows its own current public exam blueprint.</p>' +
      '<div class="ap2-proof"><article><strong>' + data.subjects.length + '</strong><span>complete AP workspaces</span></article><article><strong>' + data.questionCount.toLocaleString() + '</strong><span>original concept checks</span></article><article><strong>' + data.taskCount + '</strong><span>exam-specific task modes</span></article><article><strong>0</strong><span>paywalls or copied questions</span></article></div></section>' +
      '<section class="ap2-hub-controls"><label class="ap2-search">⌕<input id="ap2-search" aria-label="Search AP courses" placeholder="Search courses…" value="' + esc(hubFilter.search) + '"></label><div class="ap2-chipbar" aria-label="Filter by category">' + categories.map(function (c) { return '<button class="' + (hubFilter.category === c ? 'active' : '') + '" data-ap-action="category" data-id="' + esc(c) + '">' + esc(c) + '</button>'; }).join('') + '</div></section>' +
      '<div id="ap2-hub-grid"></div><div class="ap2-source-note"><strong>Independent and transparent.</strong> Exam formats and section weights link to current College Board public pages. Questions and lessons are original Scholark materials. AP® and Advanced Placement® are registered trademarks of the College Board, which does not endorse this product.</div><div id="ap2-live" class="ap2-live" aria-live="polite"></div></main>';
    renderHubGrid();
  }

  function renderHubGrid() {
    const node = document.getElementById('ap2-hub-grid'); if (!node) return;
    const filtered = data.subjects.filter(function (s) { return (hubFilter.category === 'All' || s.category === hubFilter.category) && (!hubFilter.search || (s.name + ' ' + s.short).toLowerCase().includes(hubFilter.search)); });
    const categories = Array.from(new Set(filtered.map(function (s) { return s.category; })));
    node.innerHTML = categories.map(function (category) {
      const list = filtered.filter(function (s) { return s.category === category; });
      return '<section class="ap2-category"><div class="ap2-category-head"><h2>' + esc(category) + '</h2><span>' + list.length + ' course' + (list.length === 1 ? '' : 's') + '</span></div><div class="ap2-course-grid">' + list.map(function (s) {
        const mastery = masteryAverage(s); const due = dueCount(s); const attempted = Object.values(ensureSubject(s.id).mastery).some(function (row) { return row.attempts > 0; });
        return '<button class="ap2-course" data-ap-action="open-subject" data-id="' + s.id + '"><span class="ap2-course-icon" style="background:' + s.color + '">' + s.emoji + '</span><span><h3>' + esc(s.name) + '</h3><small>' + s.questions.length + ' checks · ' + s.tasks.length + ' task modes' + (due ? ' · ' + due + ' review due' : '') + '</small></span><span class="ap2-ring" style="--p:' + (attempted ? mastery : 0) + '"><span>' + (attempted ? mastery : 'NEW') + '</span></span></button>';
      }).join('') + '</div></section>';
    }).join('') || '<div class="ap2-empty">No AP courses match that search.</div>';
  }

  function openSubject(id) {
    subject = data.subjectMap[id]; if (!subject) return;
    state.activeSubject = id; ensureSubject(id); session = restoreSession(subjectState().currentSession); view = 'overview'; taskDraft = null; saveState(); renderSubject(); window.scrollTo(0, 0);
  }

  function backToHub() { stopTimer(); subject = null; session = null; taskDraft = null; state.activeSubject = null; saveState(); renderHub(); window.scrollTo(0, 0); }

  function renderSubject(unitFocus) {
    if (!subject) return renderHub();
    const ss = subjectState(); const avg = masteryAverage(subject); const estimate = estimateScore();
    rootNode().innerHTML = '<aside class="ad-reserve ad-reserve-leaderboard" data-ad-placement="ap-subject-leaderboard" aria-label="Advertisement"><span class="ad-reserve-label">Advertisement</span></aside><main class="ap2-shell" style="--ap-accent:#7457d7;--ap-accent2:#3c7adf">' +
      '<button class="ap2-back" data-ap-action="hub">← All AP courses</button><section class="ap2-subject-hero"><div class="ap2-subject-top"><div class="ap2-subject-title"><span style="background:' + subject.color + '">' + subject.emoji + '</span><div><div class="ap2-kicker">Adaptive workspace · current public format</div><h1>' + esc(subject.name) + '</h1><p>' + esc(subject.exam.mode) + ' · ' + formatMinutes(subject.exam.duration) + ' total</p></div></div><div class="ap2-target"><label for="ap2-target">Target score</label><select id="ap2-target">' + [3,4,5].map(function (n) { return '<option value="' + n + '"' + (ss.target === n ? ' selected' : '') + '>' + n + ' / 5</option>'; }).join('') + '</select></div></div>' +
      '<div class="ap2-format-strip"><article><strong>' + subject.exam.mcq.count + '</strong><span>MCQ · ' + subject.exam.mcq.weight + '%</span></article><article><strong>' + subject.exam.written.count + '</strong><span>written tasks · ' + subject.exam.written.weight + '%</span></article><article><strong>' + (estimate.evidence ? estimate.score + '/5' : '3/5') + '</strong><span>' + (estimate.evidence ? 'practice readiness' : 'provisional baseline') + '</span></article><article><strong>' + (estimate.evidence ? avg + '%' : 'New') + '</strong><span>unit mastery</span></article></div></section>' +
      '<nav class="ap2-nav" aria-label="' + esc(subject.short) + ' study sections">' + views.map(function (name) { const labels = {overview:'Command Center',adaptive:'Adaptive Practice',units:'Unit Courses',patterns:'Pattern Lab',tasks:'Task Studio',exam:'Exam Lab',score:'Score Studio',resources:'Resources'}; return '<button class="' + (view === name ? 'active' : '') + '" data-ap-action="view" data-id="' + name + '">' + labels[name] + '</button>'; }).join('') + '</nav><div id="ap2-workspace" class="ap2-workspace"></div><div id="ap2-live" class="ap2-live" aria-live="polite"></div></main>';
    const workspace = document.getElementById('ap2-workspace');
    if (view === 'overview') workspace.innerHTML = renderOverview();
    else if (view === 'adaptive') workspace.innerHTML = renderAdaptive();
    else if (view === 'units') workspace.innerHTML = renderUnits(unitFocus);
    else if (view === 'patterns') workspace.innerHTML = renderPatterns();
    else if (view === 'tasks') workspace.innerHTML = renderTasks();
    else if (view === 'exam') workspace.innerHTML = renderExam();
    else if (view === 'score') workspace.innerHTML = renderScore();
    else workspace.innerHTML = renderResources();
  }

  function renderOverview() {
    const ss = subjectState(); const due = dueCount(subject); const weakest = weakestUnits(3); const estimate = estimateScore(); const days = daysUntilExam(ss.examDate);
    return '<div class="ap2-grid"><section class="ap2-card wide accent"><div class="ap2-kicker">Today’s adaptive route</div><h2>' + (due ? due + ' retention reviews are ready' : 'Your next best move is ready') + '</h2><p>' + (weakest[0] ? 'Start with ' + esc(subject.units[weakest[0].index].name) + ', then interleave a neighboring unit to make the skill transferable.' : 'Complete a diagnostic to build your knowledge map.') + '</p><div class="ap2-actions"><button class="ap2-primary" data-ap-action="start" data-kind="adaptive">Start adaptive set</button><button class="ap2-secondary" data-ap-action="start" data-kind="diagnostic">Run 20-question diagnostic</button></div></section>' +
      '<section class="ap2-card"><div class="ap2-kicker">Score signal</div><div class="ap2-score-gauge"><div class="ap2-score-circle" style="--p:' + estimate.composite + '"><strong>' + estimate.score + '</strong></div><div><h3>' + (estimate.evidence ? 'Practice readiness' : 'Provisional readiness baseline') + '</h3><p>' + estimate.band + '</p><small>' + estimate.evidence + ' scored evidence points</small></div></div></section>' +
      '<section class="ap2-card"><div class="ap2-kicker">Exam clock</div><h2>' + (days == null ? 'Set your date' : days + ' days') + '</h2><p>' + esc(subject.exam.note) + '</p><label class="ap2-mini" for="ap2-exam-date">Your exam date</label><input id="ap2-exam-date" type="date" value="' + esc(ss.examDate) + '" style="width:100%;margin-top:6px;padding:9px;border:1px solid var(--border);border-radius:9px;background:var(--bg);color:var(--ink)"></section>' +
      '<section class="ap2-card wide dark"><div class="ap2-kicker">Seven differentiators, one workflow</div><h2>Built around what the exam actually asks you to do.</h2><div class="ap2-feature-grid">' + [
        ['Knowledge-Graph Repair','Weak skills route backward to prerequisites before they become repeated misses.'],['Task-Specific Rubric Studio',subject.tasks.map(function(t){return t.name;}).join(', ') + '—not a generic FRQ box.'],['Confidence Calibration','Track when you are right for the wrong reason or confidently wrong.'],['Retention Queue','Mastery decays into spaced reviews instead of disappearing after one correct answer.'],['Pattern Lab','Fast elimination rules tied to evidence, grammar, models, or source reasoning.'],['Score Evidence Studio','Current section weights combine MCQ and rubric evidence by course.'],['Teach-Back Forge','Explain a concept from memory and get a deterministic completeness check.']
      ].map(function (f) { return '<article class="ap2-feature"><strong>' + esc(f[0]) + '</strong><span>' + esc(f[1]) + '</span></article>'; }).join('') + '</div></section>' +
      '<section class="ap2-card full"><div class="ap2-kicker">Mastery map</div><h2>Every unit, visible</h2><div class="ap2-mastery-list">' + masteryRows() + '</div></section></div>';
  }

  function renderAdaptive() {
    if (!session) return '<div class="ap2-grid"><section class="ap2-card wide accent"><div class="ap2-kicker">Adaptive engine</div><h2>Practice the next skill—not question one again.</h2><p>The queue blends weakest units, overdue retention, recent misses, and one stronger transfer skill. Your place, flags, scratchpad, confidence, and answers persist.</p><div class="ap2-actions"><button class="ap2-primary" data-ap-action="start" data-kind="adaptive">Build my adaptive set</button><button class="ap2-secondary" data-ap-action="start" data-kind="mistakes">Replay mistakes</button></div></section><section class="ap2-card"><div class="ap2-stat">' + dueCount(subject) + '</div><h3>reviews due</h3><p>Spaced by demonstrated mastery.</p></section><section class="ap2-card full"><h2>Choose a unit directly</h2><div class="ap2-actions">' + subject.units.map(function (u,i){return '<button class="ap2-secondary" data-ap-action="start" data-kind="unit" data-unit="' + i + '">' + esc(u.name.replace(/^Unit \d+: /,'')) + '</button>';}).join('') + '</div></section></div>';
    return renderQuestionPlayer();
  }

  function restoreSession(raw) {
    if (!raw || !Array.isArray(raw.ids) || !raw.ids.length || !data.subjectMap[raw.subject]) return null;
    return Object.assign({ idx:0, answers:{}, submitted:{}, confidence:{}, flags:[], eliminated:{}, scratch:{}, seconds:0, startedAt:Date.now() }, raw);
  }

  function questionById(id) { return subject.questions.find(function (q) { return q.id === id; }); }

  function startSession(kind, unitIndex) {
    const ss = subjectState(); let pool = subject.questions.slice(); let count = 12; let timeLimit = 0;
    if (kind === 'unit') { pool = pool.filter(function (q) { return q.unitIndex === unitIndex; }); count = Math.min(16, pool.length); }
    else if (kind === 'diagnostic') { count = Math.min(20, pool.length); }
    else if (kind === 'sprint') { count = Math.min(10, pool.length); timeLimit = 12 * 60; }
    else if (kind === 'full') { count = Math.min(subject.exam.mcq.count, pool.length); timeLimit = subject.exam.mcq.minutes * 60; }
    else if (kind === 'mistakes') {
      const wrong = new Set(ss.responses.filter(function (r) { return !r.correct; }).slice(-120).map(function (r) { return r.questionId; }));
      pool = pool.filter(function (q) { return wrong.has(q.id); }); count = Math.min(15, pool.length);
      if (!pool.length) { toast('No saved mistakes yet—an adaptive set will build your review history.'); kind = 'adaptive'; pool = subject.questions.slice(); }
    }
    if (kind === 'adaptive') pool.sort(adaptiveSort);
    else { const shuffleSeed = Date.now(); pool.sort(function (a,b) { return data.helpers.hash(a.id + shuffleSeed) - data.helpers.hash(b.id + shuffleSeed); }); }
    const ids = pool.slice(0, count).map(function (q) { return q.id; });
    session = { subject:subject.id, kind, ids, idx:0, answers:{}, submitted:{}, confidence:{}, flags:[], eliminated:{}, scratch:{}, seconds:timeLimit, timeLimit, startedAt:Date.now() };
    ss.currentSession = session; view = 'adaptive'; saveState(); renderSubject(); startTimer();
  }

  function adaptiveSort(a,b) {
    const ss = subjectState(); const now = Date.now();
    function priority(q) {
      const row = ss.mastery[q.unitIndex]; const due = row.nextReviewAt && Date.parse(row.nextReviewAt) <= now ? 80 : 0;
      const missed = ss.responses.slice(-80).filter(function (r) { return r.questionId === q.id && !r.correct; }).length * 25;
      const seen = ss.responses.slice(-120).filter(function (r) { return r.questionId === q.id; }).length * 8;
      return due + missed + (100 - row.score) - seen + (data.helpers.hash(q.id) % 11);
    }
    return priority(b) - priority(a);
  }

  function renderQuestionPlayer() {
    const q = questionById(session.ids[session.idx]); if (!q) return '<div class="ap2-empty">This saved session no longer matches the current bank. Start a new set.</div>';
    const selected = session.answers[session.idx]; const submitted = !!session.submitted[session.idx]; const eliminated = session.eliminated[session.idx] || [];
    return '<div class="ap2-question-layout"><section class="ap2-question-card"><div class="ap2-qmeta"><span class="ap2-pill">' + esc(session.kind) + '</span><span class="ap2-pill">' + esc(q.unit) + '</span><span class="ap2-pill">' + esc(q.skill) + '</span><span class="ap2-status">Question ' + (session.idx + 1) + ' of ' + session.ids.length + '</span></div>' +
      (q.stimulus ? '<div class="ap2-stimulus">' + esc(q.stimulus) + '</div>' : '') + '<div class="ap2-stem">' + esc(q.stem) + '</div><div class="ap2-options">' + q.options.map(function (option, i) {
        let cls = 'ap2-option'; if (selected === i) cls += ' selected'; if (eliminated.includes(i)) cls += ' eliminated'; if (submitted && i === q.answer) cls += ' correct'; if (submitted && selected === i && i !== q.answer) cls += ' wrong';
        return '<div class="ap2-option-row"><button class="' + cls + '" data-ap-action="session-option" data-id="' + i + '" ' + (submitted ? 'disabled' : '') + '><span class="ap2-letter">' + letters[i] + '</span><span>' + esc(option) + '</span></button><button class="ap2-eliminate ' + (eliminated.includes(i) ? 'active' : '') + '" data-ap-action="eliminate" data-id="' + i + '" aria-label="Eliminate choice ' + letters[i] + '" ' + (submitted ? 'disabled' : '') + '>×</button></div>';
      }).join('') + '</div><div class="ap2-hints"><details><summary>Reveal tutoring hints one step at a time</summary><ol>' + q.hints.map(function(h){return '<li>' + esc(h) + '</li>';}).join('') + '</ol></details></div>' +
      (submitted ? '<div class="ap2-explanation"><strong>' + (selected === q.answer ? 'Correct.' : 'Repair the reasoning.') + '</strong> ' + esc(q.explanation) + '</div>' : '') +
      '<div class="ap2-actions"><button class="ap2-secondary" data-ap-action="previous-question" ' + (session.idx === 0 ? 'disabled' : '') + '>← Previous</button>' + (submitted ? '<button class="ap2-primary" data-ap-action="next-question">' + (session.idx === session.ids.length - 1 ? 'Finish set' : 'Next →') + '</button>' : '<button class="ap2-primary" data-ap-action="submit-answer" ' + (selected == null ? 'disabled' : '') + '>Check answer</button>') + '<button class="ap2-secondary" data-ap-action="flag">' + (session.flags.includes(session.idx) ? '⚑ Flagged' : '⚐ Flag') + '</button></div></section>' +
      '<aside class="ap2-side"><section class="ap2-sidebox"><h4>' + (session.timeLimit ? 'Time remaining' : 'Session progress') + '</h4><div id="ap2-timer" class="ap2-timer">' + (session.timeLimit ? clock(session.seconds) : Object.keys(session.submitted).length + ' / ' + session.ids.length) + '</div></section><section class="ap2-sidebox"><h4>Confidence before feedback</h4><div class="ap2-confidence">' + [1,2,3].map(function(n){return '<button class="' + (session.confidence[session.idx] === n ? 'active' : '') + '" data-ap-action="confidence" data-id="' + n + '" ' + (submitted ? 'disabled' : '') + '>' + ['Guess','Unsure','Certain'][n-1] + '</button>';}).join('') + '</div></section><section class="ap2-sidebox"><h4>Question map</h4><div class="ap2-map">' + session.ids.map(function(_,i){return '<button class="' + (i===session.idx?'current ':'') + (session.submitted[i]?'done ':'') + (session.flags.includes(i)?'flag':'') + '" data-ap-action="jump-question" data-id="' + i + '">' + (i+1) + '</button>';}).join('') + '</div></section><section class="ap2-sidebox"><h4>Scratchpad</h4><textarea id="ap2-scratch" rows="5" style="width:100%;resize:vertical;border:1px solid var(--border);border-radius:8px;padding:8px;background:var(--bg);color:var(--ink)">' + esc(session.scratch[session.idx] || '') + '</textarea></section><button class="ap2-secondary" data-ap-action="finish-session">End and score set</button></aside></div>';
  }

  function selectOption(i) { if (!session || session.submitted[session.idx]) return; session.answers[session.idx] = i; persistSession(); renderSubject(); }
  function toggleEliminate(i) { if (!session || session.submitted[session.idx]) return; const list = session.eliminated[session.idx] || []; session.eliminated[session.idx] = list.includes(i) ? list.filter(function(x){return x!==i;}) : list.concat(i); persistSession(); renderSubject(); }
  function setConfidence(n) { if (!session || session.submitted[session.idx]) return; session.confidence[session.idx] = n; persistSession(); renderSubject(); }
  function toggleFlag() { if (!session) return; session.flags = session.flags.includes(session.idx) ? session.flags.filter(function(x){return x!==session.idx;}) : session.flags.concat(session.idx); persistSession(); renderSubject(); }
  function jumpQuestion(i) { if (session && i >= 0 && i < session.ids.length) { session.idx = i; persistSession(); renderSubject(); } }
  function previousQuestion() { if (session && session.idx > 0) { session.idx--; persistSession(); renderSubject(); } }
  function nextQuestion() { if (!session) return; if (session.idx >= session.ids.length - 1) finishSession(); else { session.idx++; persistSession(); renderSubject(); } }

  function submitAnswer() {
    if (!session || session.answers[session.idx] == null || session.submitted[session.idx]) return;
    const q = questionById(session.ids[session.idx]); const correct = session.answers[session.idx] === q.answer; const confidence = session.confidence[session.idx] || 1; const ss = subjectState(); const row = ss.mastery[q.unitIndex];
    session.submitted[session.idx] = true;
    row.attempts += 1; if (correct) row.correct += 1; row.confidenceTotal += confidence; row.confidenceCount += 1; row.lastSeen = new Date().toISOString();
    const delta = correct ? (confidence === 3 ? 5 : 7) : (confidence === 3 ? -9 : -5); row.score = Math.max(5, Math.min(100, Math.round(row.score * .86 + (correct ? 100 : 0) * .14 + delta * .35)));
    const intervalDays = correct ? Math.max(1, Math.round((row.score / 100) * (confidence + 1) * 3)) : 1;
    row.nextReviewAt = new Date(Date.now() + intervalDays * 86400000).toISOString();
    ss.responses.push({ questionId:q.id, unitIndex:q.unitIndex, correct, answer:session.answers[session.idx], confidence, at:new Date().toISOString(), kind:session.kind });
    persistSession(); renderSubject();
  }

  function finishSession() {
    if (!session) return; stopTimer();
    const ss = subjectState(); const completed = Object.keys(session.submitted).length; const correct = session.ids.reduce(function(sum,id,i){const q=questionById(id);return sum + (session.submitted[i] && session.answers[i] === q.answer ? 1 : 0);},0); const pct = completed ? Math.round(correct/completed*100) : 0;
    if (completed) ss.scoreHistory.push({ at:new Date().toISOString(), kind:session.kind, correct, total:completed, percent:pct, estimate:estimateScore().score });
    ss.currentSession = null; const report = { correct, completed, total:session.ids.length, pct, flags:session.flags.length }; session = null; saveState();
    document.getElementById('ap2-workspace').innerHTML = '<section class="ap2-card full accent"><div class="ap2-kicker">Set complete</div><h2>' + report.correct + ' of ' + report.completed + ' scored correct</h2><div class="ap2-proof"><article><strong>' + report.pct + '%</strong><span>accuracy</span></article><article><strong>' + report.flags + '</strong><span>flagged</span></article><article><strong>' + dueCount(subject) + '</strong><span>reviews queued</span></article><article><strong>' + estimateScore().score + '/5</strong><span>readiness signal</span></article></div><p class="ap2-lede">Your unit map and retention dates were updated. Confident misses received the strongest repair priority.</p><div class="ap2-actions"><button class="ap2-primary" data-ap-action="start" data-kind="adaptive">Continue adaptive practice</button><button class="ap2-secondary" data-ap-action="view" data-id="score">Open Score Studio</button></div></section>';
  }

  function discardSession() { stopTimer(); subjectState().currentSession = null; session = null; saveState(); renderSubject(); }
  function persistSession() { if (!session) return; subjectState().currentSession = session; saveState(); }
  function startTimer() { stopTimer(); if (!session || !session.timeLimit || session.seconds <= 0) return; timerId = setInterval(function(){ if (!session) return stopTimer(); session.seconds--; const node=document.getElementById('ap2-timer'); if(node)node.textContent=clock(session.seconds); if(session.seconds<=0){stopTimer();finishSession();} else if(session.seconds%10===0)persistSession(); },1000); }
  function stopTimer(){if(timerId){clearInterval(timerId);timerId=null;}} function stopTimerIfNoSession(){if(view!=='adaptive')stopTimer();}

  function renderUnits(focus) {
    if (Number.isInteger(focus) && subject.units[focus]) return renderUnitLesson(focus);
    return '<section class="ap2-card full accent"><div class="ap2-kicker">Unit Crash Courses + Knowledge Graph</div><h2>Learn the anchor, expose the trap, retrieve it, then practice it.</h2><p>Each unit connects concepts to exam weight or course emphasis and routes weak performance to a prerequisite repair.</p><div class="ap2-actions"><button class="ap2-secondary" data-ap-action="copy-cram">Copy complete cram sheet</button><button class="ap2-secondary" data-ap-action="print">Print / save as PDF</button></div></section><div class="ap2-unit-grid" style="margin-top:14px">' + subject.units.map(function(u,i){const row=subjectState().mastery[i];return '<article class="ap2-unit"><div class="ap2-unit-head"><h3>' + esc(u.name) + '</h3><span>' + esc(u.weight) + '</span></div><div class="ap2-bar"><span style="width:' + row.score + '%"></span></div><p>' + u.concepts.map(function(c){return c.name;}).join(' · ') + '</p><div class="ap2-actions"><button class="ap2-primary" data-ap-action="open-unit" data-id="' + i + '">Open crash course</button><button class="ap2-secondary" data-ap-action="start" data-kind="unit" data-unit="' + i + '">Practice unit</button></div></article>';}).join('') + '</div>';
  }

  function renderUnitLesson(index) {
    const u = subject.units[index]; const prior = index > 0 ? subject.units[index-1] : null;
    return '<button class="ap2-back" data-ap-action="view" data-id="units">← All units</button><section class="ap2-card full accent"><div class="ap2-kicker">' + esc(u.weight) + ' of course emphasis</div><h2>' + esc(u.name) + '</h2><p>' + (prior ? 'Prerequisite bridge: retrieve ' + esc(prior.concepts[0].name) + ' before combining it with this unit.' : 'Foundation unit: build precise definitions before applying them to unfamiliar representations.') + '</p><div class="ap2-actions"><button class="ap2-primary" data-ap-action="start" data-kind="unit" data-unit="' + index + '">Start 16-question unit set</button></div></section><div class="ap2-grid" style="margin-top:14px"><section class="ap2-card wide"><h2>Rapid crash course</h2>' + u.concepts.map(function(c,ci){return '<article class="ap2-concept"><strong>' + esc(c.name) + '</strong><p>' + esc(c.teach) + '</p><p class="ap2-trap">Trap: ' + esc(c.trap) + '</p><div class="ap2-actions"><button class="ap2-secondary" data-ap-action="teachback" data-id="' + index + '" data-concept="' + ci + '">Teach it back</button></div></article>';}).join('') + '</section><aside class="ap2-card"><div class="ap2-kicker">Retrieval ladder</div><h3>Say it without notes</h3><ol style="padding-left:18px;font-size:12px;line-height:1.7;color:var(--ink2)"><li>Define the anchor in one sentence.</li><li>Name the common trap.</li><li>Create a new example or representation.</li><li>Explain what evidence would change the conclusion.</li></ol><textarea data-ap-note="unit-' + index + '" rows="7" placeholder="Your unit notes…" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:9px;background:var(--bg);color:var(--ink)">' + esc(subjectState().notes['unit-'+index] || '') + '</textarea></aside></div><div id="ap2-teachback-slot"></div>';
  }

  function openTeachback(unitIndex, conceptIndex) {
    const c=subject.units[unitIndex].concepts[conceptIndex]; const slot=document.getElementById('ap2-teachback-slot'); if(!slot)return;
    slot.innerHTML='<section class="ap2-card full ap2-teachback" style="margin-top:14px"><div class="ap2-kicker">Teach-Back Forge</div><h2>Explain ' + esc(c.name) + ' from memory</h2><p>Include a definition, a mechanism or relationship, and a boundary/example. The check is local and deterministic.</p><textarea id="ap2-teachback-answer" placeholder="Teach the idea as if your classmate missed the lesson…"></textarea><div class="ap2-actions"><button class="ap2-primary" data-ap-action="teachback-check" data-unit="' + unitIndex + '" data-concept="' + conceptIndex + '">Check completeness</button></div><div id="ap2-teachback-feedback" class="ap2-live"></div></section>'; slot.scrollIntoView({behavior:'smooth',block:'center'});
  }

  function checkTeachback(unitIndex, conceptIndex){const answer=(document.getElementById('ap2-teachback-answer')||{}).value||'';const c=subject.units[unitIndex].concepts[conceptIndex];const words=answer.match(/[A-Za-zÀ-ÿ0-9'’-]+/g)||[];const keywords=c.name.toLowerCase().split(/\s+/).concat(c.teach.toLowerCase().split(/\s+/).filter(function(x){return x.length>7;}).slice(0,5));const hits=keywords.filter(function(k){return answer.toLowerCase().includes(k.replace(/[^a-zà-ÿ]/g,''));}).length;const relation=/because|therefore|causes?|leads? to|depends|when|while|whereas|por que|porque|debido/i.test(answer);const example=/for example|such as|consider|suppose|example|por ejemplo/i.test(answer);const score=Math.min(100,Math.round((Math.min(words.length,80)/80)*35+Math.min(hits,5)/5*35+(relation?15:0)+(example?15:0)));subjectState().teachbacks.push({unitIndex,conceptIndex,score,at:new Date().toISOString()});saveState();document.getElementById('ap2-teachback-feedback').textContent='Completeness signal: '+score+'%. '+(score>=75?'Strong retrieval—now solve an unfamiliar application.':'Add a precise relationship, one boundary or trap, and a concrete example.');}

  function renderPatterns() {
    return '<section class="ap2-card full dark"><div class="ap2-kicker">Pattern Recognition Lab</div><h2>Shortcuts with a reason—not answer-choice superstition.</h2><p>Every pattern is tied to a defensible rule about evidence, source analysis, grammar, a model, representation, or algorithm. Use the move, then run the trap check.</p></section><div class="ap2-pattern-grid" style="margin-top:14px">' + subject.patterns.map(function(p,i){return '<article class="ap2-pattern"><span class="ap2-pill">Pattern ' + (i+1) + '</span><h3>' + esc(p[0]) + '</h3><p>' + esc(p[1]) + '</p><div class="ap2-callout"><strong>Trap check:</strong> ' + esc(p[2]) + '</div><button class="ap2-secondary" data-ap-action="start" data-kind="adaptive">Practice the reasoning</button></article>';}).join('') + '</div>';
  }

  function generatedTaskPrompt(t, refresh) {
    const seed=(refresh?Date.now():0)+data.helpers.hash(subject.id+t.id); const u=subject.units[seed%subject.units.length]; const c=u.concepts[(seed>>3)%u.concepts.length];
    const neighbor=subject.units[(seed+1)%subject.units.length].concepts[0];
    return { id:t.id+'-'+(seed%997), task:t, unit:u, concept:c, prompt:buildTaskPrompt(t,u,c,neighbor), answer:refresh ? '' : (subjectState().notes['task-draft-' + t.id] || ''), feedback:null };
  }

  function buildTaskPrompt(t,u,c,neighbor) {
    const context='Focus concept: '+c.name+'. '+c.teach;
    if (t.id === 'history-saq') return 'ORIGINAL SAQ PRACTICE — '+u.name+'\n\nSource A (constructed practice interpretation): “'+c.teach+'”\nSource B (constructed practice interpretation): “'+neighbor.teach+'”\n\n(a) Identify one historical development that supports Source A.\n(b) Explain one difference between the interpretations using specific evidence.\n(c) Explain one development beyond the sources that would qualify either interpretation.';
    if (t.id === 'history-dbq') return 'ORIGINAL DBQ PRACTICE PACKET — '+u.name+'\n\nEvaluate the extent to which developments associated with '+c.name+' transformed political, economic, or social relationships in the relevant course period.\n\nDocument 1: Constructed policy record emphasizing '+c.teach+'\nDocument 2: Constructed account from a group benefiting from the development.\nDocument 3: Constructed account from a group resisting or harmed by the development.\nDocument 4: Constructed quantitative trend showing change over time.\nDocument 5: Constructed political or institutional response connected to '+neighbor.name+'.\nDocument 6: Constructed later retrospective interpretation that qualifies the trend.\nDocument 7: Constructed cross-regional or cross-group comparison.\n\nThe document descriptions are original practice scaffolds, not historical quotations. Build a thesis, group documents by argument, source at least two, and add specific outside evidence.';
    if (t.id === 'history-leq') return 'ORIGINAL LEQ PRACTICE — '+u.name+'\n\nEvaluate the extent to which '+c.name+' caused, changed, or preserved a major historical pattern. Choose the reasoning process that best fits the claim, contextualize it, and support it with at least two pieces of specific historical evidence.';
    if (t.id === 'psych-aaq') return 'ORIGINAL AAQ RESEARCH BRIEF\n\nResearchers recruit 120 volunteers from one urban high school to study '+c.name+'. Students are randomly assigned to a comparison condition or a treatment designed around this principle: '+c.teach+' The researchers record a numerical outcome before and after the treatment and report a moderate difference between group means.\n\n(a) Identify the research method. (b) Give an operational definition of the dependent variable. (c) Interpret what random assignment permits. (d) Explain one limit on generalizability. (e) Apply '+neighbor.name+' to the result.';
    if (t.id === 'psych-ebq') return 'ORIGINAL EBQ EVIDENCE PACKET\n\nClaim prompt: Develop and justify an argument about how '+c.name+' influences behavior.\nStudy 1 summary: A randomized experiment reports a group difference consistent with '+c.teach+'\nStudy 2 summary: A longitudinal observational study finds the relationship is smaller after controlling for a contextual variable.\nStudy 3 summary: A cross-cultural survey connects the outcome to '+neighbor.name+'.\n\nUse evidence from at least two studies and explain each connection with psychological reasoning. These are constructed practice summaries, not published studies.';
    if (/gov-data|comp-data/.test(t.id)) return 'ORIGINAL QUANTITATIVE ANALYSIS\n\nA constructed dataset compares support for a policy before and after an institutional change: Group A 48% → 61%; Group B 52% → 54%; turnout 58% → 66%.\n\n(a) Identify one trend. (b) Describe the difference in change between groups. (c) Draw a conclusion connected to '+c.name+'. (d) Explain one limit of the data.';
    if (/gov-scotus/.test(t.id)) return 'ORIGINAL SCOTUS COMPARISON\n\nA state policy is challenged because it burdens a protected constitutional activity. The described lower court applies a standard connected to '+c.name+'.\n\nIdentify a relevant required Supreme Court case, explain the constitutional principle in that case, and compare how the principle would apply to this new scenario.';
    if (/gov-argument|comp-argument/.test(t.id)) return 'ORIGINAL ARGUMENT ESSAY\n\nDevelop an argument about whether '+c.name+' strengthens or weakens democratic accountability. Use at least two pieces of specific institutional, constitutional, or country evidence and address a reasonable qualification.';
    if (/comp-concept|comp-compare/.test(t.id)) return 'ORIGINAL COMPARATIVE ANALYSIS\n\nUsing two relevant course countries, compare how '+c.name+' shapes political participation, policy, or institutional power. Make a direct comparison, give specific evidence for each country, and explain a cause or consequence.';
    if (/stats-/.test(t.id)) return 'ORIGINAL STATISTICS INVESTIGATION\n\nA school studies '+c.name+' using a random sample of 180 students. A treatment comparison reports an estimated difference of 4.2 units with standard error 1.5.\n\nIdentify the population and parameter, evaluate design conditions, select and carry out an appropriate analysis, and interpret the conclusion in context. State any assumption the available information cannot verify.';
    if (/physics|physc/.test(t.id)) return 'ORIGINAL PHYSICS TASK\n\nA cart–sensor system is used to investigate '+c.name+'. The measured quantity changes from 2.0 units to 5.0 units over 3.0 seconds while a controllable system parameter is doubled.\n\n(a) Draw or describe the relevant representation. (b) Derive a relationship from a governing principle. (c) Predict the direction of change. (d) Design a procedure or calculation that tests the prediction, including uncertainty.';
    if (/bio-|chem-|env-/.test(t.id)) return 'ORIGINAL SCIENCE INVESTIGATION\n\nA controlled investigation tests '+c.name+'. Four treatment levels produce mean responses of 12, 18, 25, and 27 units; the comparison mean is 11 units.\n\n(a) State a defensible claim. (b) Use the data as evidence. (c) Explain the course mechanism. (d) Identify a control or source of uncertainty. (e) Predict and justify one follow-up result.';
    if (/calc|bc-|precalc/.test(t.id)) return 'ORIGINAL MATHEMATICAL MODEL\n\nA differentiable or modeled quantity follows the relationship described by '+c.name+': '+c.teach+' Values at three consecutive inputs are 4.0, 6.5, and 10.0.\n\nBuild an appropriate symbolic or graphical model, show the requested rate/accumulation reasoning, justify any theorem conditions, and interpret the result with units.';
    if (/macro|micro/.test(t.id)) return 'ORIGINAL ECONOMICS SCENARIO\n\nAn economy or market begins in equilibrium. A policy changes incentives in a way connected to '+c.name+'.\n\nDraw and label the relevant model, show every curve shift, state the short-run changes in price/output or firm behavior, and explain a secondary effect using '+neighbor.name+'.';
    if (/methods|class-design|arraylist|2d-array/.test(t.id)) return 'ORIGINAL JAVA DESIGN TASK\n\nImplement '+t.name+' for a program that models '+c.name+'. Your solution must satisfy this contract: process all valid inputs, preserve class invariants, handle an empty or boundary case, and return the requested result. Include code plus a short trace for one boundary test.';
    if (/create-/.test(t.id)) return 'ORIGINAL CREATE WRITTEN-RESPONSE PRACTICE\n\nA student program uses a list of observations and a procedure to model '+c.name+'. The procedure takes a parameter, traverses the list, uses selection, and returns a result.\n\n'+t.promptFrame+' Label every requested part and refer only to the described program evidence.';
    if (/lang-/.test(t.id)) return 'ORIGINAL AP LANGUAGE WRITING TASK\n\nA public debate asks whether institutions should prioritize efficiency over broad participation. Source A emphasizes measurable outcomes; Source B emphasizes unequal effects; Source C presents a constructed trend; Source D qualifies both positions.\n\n'+t.promptFrame+' Build a defensible line of reasoning and explain how each chosen piece of evidence advances it.';
    if (/lit-/.test(t.id)) return 'ORIGINAL AP LITERATURE WRITING TASK\n\nIn an original passage, a narrator returns to a once-familiar place and notices that ordinary objects now seem staged rather than lived in. Short sentences interrupt longer memories, and the final image repeats an image from the opening with one detail missing.\n\n'+t.promptFrame+' Analyze specific choices and connect them to an interpretation of the passage as a whole.';
    if (/span-/.test(t.id)) return 'TAREA ORIGINAL DE PRÁCTICA\n\nTema: cómo las comunidades equilibran la innovación con la identidad cultural. Una fuente escrita destaca beneficios económicos; una fuente de audio construida describe preocupaciones locales; una gráfica construida muestra cambios generacionales.\n\n'+t.promptFrame+' Presenta una respuesta organizada con evidencia cultural específica y conexiones claras.';
    return 'ORIGINAL '+t.name.toUpperCase()+' PRACTICE\n\n'+t.promptFrame+'\n\n'+context+'\n\nRespond to every requested part with specific course evidence, a visible line of reasoning, and any required calculations or representations.';
  }

  function renderTasks() {
    if (taskDraft) return renderTaskWorkspace();
    return '<section class="ap2-card full accent"><div class="ap2-kicker">Exam-Specific Task Studio</div><h2>' + subject.tasks.length + ' workflows built for ' + esc(subject.short) + '—not a generic FRQ textbox.</h2><p>Plan, draft, and receive an on-device rubric-completeness estimate. It never sends your response to an AI service and does not claim to verify factual correctness.</p></section><div class="ap2-task-grid" style="margin-top:14px">' + subject.tasks.map(function(t){return '<article class="ap2-task"><span class="ap2-pill">' + t.minutes + ' min · ' + t.points + ' pts</span><h3>' + esc(t.name) + '</h3><p>' + esc(t.promptFrame) + '</p><ul class="ap2-rubric">' + t.rubric.map(function(r,i){return '<li><span>'+(i+1)+'</span>'+esc(r)+'</li>';}).join('') + '</ul><button class="ap2-primary" data-ap-action="task-open" data-id="' + t.id + '">Open task studio</button></article>';}).join('') + '</div>';
  }

  function openTask(id, refresh) { const t=subject.tasks.find(function(x){return x.id===id;}); if(!t)return; if(refresh){subjectState().notes['task-draft-' + id]='';saveState();} taskDraft=generatedTaskPrompt(t,refresh); view='tasks'; renderSubject(); }

  function renderTaskWorkspace() {
    const t=taskDraft.task; return '<button class="ap2-back" data-ap-action="view" data-id="tasks" onclick="ScholarkAP.clearTask()">← All task types</button><section class="ap2-task-work"><article class="ap2-task"><div class="ap2-kicker">' + esc(t.name) + ' · ' + t.minutes + ' minute target</div><h2>Original practice prompt</h2><div class="ap2-stimulus" style="white-space:pre-line">' + esc(taskDraft.prompt) + '</div><textarea id="ap2-task-answer" placeholder="Draft your response here…">' + esc(taskDraft.answer) + '</textarea><div class="ap2-actions"><button class="ap2-primary" data-ap-action="task-grade">Run rubric check</button><button class="ap2-secondary" data-ap-action="task-new" data-id="' + t.id + '">New prompt</button></div>' + (taskDraft.feedback ? taskFeedbackHTML(taskDraft.feedback) : '') + '</article><aside class="ap2-task"><div class="ap2-kicker">Live rubric checklist</div><h3>Build the points deliberately</h3><ul class="ap2-rubric">' + t.rubric.map(function(r,i){return '<li><span>'+(i+1)+'</span>'+esc(r)+'</li>';}).join('') + '</ul><div class="ap2-callout">This local checker evaluates structure, explicit evidence signals, quantitative work, and task coverage. Compare factual accuracy and final scoring with official samples and scoring guidelines linked in Resources.</div></aside></section>';
  }

  function gradeTask() {
    const answer=(document.getElementById('ap2-task-answer')||{}).value||''; taskDraft.answer=answer; const words=answer.match(/[A-Za-zÀ-ÿ0-9'’-]+/g)||[]; if(words.length<25){toast('Write at least a few developed sentences before running the rubric check.','error');return;}
    const sentences=answer.split(/[.!?]+/).filter(function(x){return x.trim().length>8;}).length; const evidence=(answer.match(/because|therefore|for example|evidence|data|document|source|shows|demonstrates|according to|por ejemplo|según/gi)||[]).length; const labels=(answer.match(/\([a-z]\)|part\s+[a-z]|first|second|finally|however|whereas/gi)||[]).length; const quantitative=(answer.replace(/document\s+\d+/gi,'').match(/\d+(?:\.\d+)?%?|[=+−×÷]/g)||[]).length;
    const criteria=taskDraft.task.rubric.map(function(_,i){ if(i===0)return words.length>=55; if(i===1)return evidence>=2||quantitative>=2; if(i===2)return sentences>=4&&(/because|therefore|shows|demonstrates|porque/i.test(answer)); return labels>=2||words.length>=130; });
    const points=criteria.filter(Boolean).length; const score=Math.round(points/criteria.length*taskDraft.task.points); taskDraft.feedback={criteria,score,max:taskDraft.task.points,words:words.length,evidence,quantitative}; subjectState().taskAttempts.push({taskId:taskDraft.task.id,score,max:taskDraft.task.points,at:new Date().toISOString(),wordCount:words.length}); saveState(); renderSubject();
  }

  function taskFeedbackHTML(f){return '<div class="ap2-explanation"><h3>Rubric-completeness estimate: ' + f.score + ' / ' + f.max + '</h3><p>' + f.words + ' words · ' + f.evidence + ' evidence/reasoning signals · ' + f.quantitative + ' quantitative signals</p><ul class="ap2-rubric">' + taskDraft.task.rubric.map(function(r,i){return '<li class="' + (f.criteria[i]?'hit':'') + '"><span>' + (f.criteria[i]?'✓':'·') + '</span>' + esc(r) + '</li>';}).join('') + '</ul><small>Independent practice feedback, not an official AP score. Verify content against course materials and official scoring samples.</small></div>';}

  function renderExam() {
    const active=session; return '<div class="ap2-grid">' + (active ? '<section class="ap2-card full accent"><div class="ap2-kicker">Saved session</div><h2>' + esc(active.kind) + ' · question ' + (active.idx+1) + ' of ' + active.ids.length + '</h2><p>Your answers, flags, confidence, scratchpad, and remaining time are saved.</p><div class="ap2-actions"><button class="ap2-primary" data-ap-action="resume-session">Resume</button><button class="ap2-danger" data-ap-action="discard-session">Discard</button></div></section>' : '') +
      examCard('Diagnostic','20 questions','Build a baseline across every unit, then create a prerequisite repair route.','diagnostic') + examCard('Official-Blueprint MCQ Simulation',subject.exam.mcq.count+' questions · '+subject.exam.mcq.minutes+' minutes','Uses original Scholark concept-and-reasoning checks with the current public MCQ count and timing. Written tasks are trained separately in Task Studio.','full') + examCard('12-Minute Pacing Sprint','10 questions','Train decisions per minute with flags, confidence, elimination, and a question map.','sprint') +
      '<section class="ap2-card full"><div class="ap2-kicker">Current public blueprint</div><h2>' + esc(subject.exam.note) + '</h2><div class="ap2-proof"><article><strong>' + subject.exam.mcq.count + '</strong><span>MCQ in ' + subject.exam.mcq.minutes + ' min</span></article><article><strong>' + subject.exam.mcq.weight + '%</strong><span>MCQ weight</span></article><article><strong>' + subject.exam.written.count + '</strong><span>written tasks in ' + subject.exam.written.minutes + ' min</span></article><article><strong>' + subject.exam.written.weight + '%</strong><span>written weight</span></article></div><div class="ap2-actions"><a class="ap2-secondary" href="' + esc(subject.assessmentUrl) + '" target="_blank" rel="noopener">Verify official format ↗</a></div></section></div>';
  }
  function examCard(title,meta,body,kind){return '<section class="ap2-card"><span class="ap2-pill">'+esc(meta)+'</span><h2 style="margin-top:10px">'+esc(title)+'</h2><p>'+esc(body)+'</p><div class="ap2-actions"><button class="ap2-primary" data-ap-action="start" data-kind="'+kind+'">Start</button></div></section>';}

  function estimateScore() {
    const ss=subjectState(); const responses=ss.responses.slice(-300); const mcqCorrect=responses.filter(function(r){return r.correct;}).length; const mcqPct=responses.length?mcqCorrect/responses.length*100:masteryAverage(subject); const taskRows=ss.taskAttempts.slice(-20); const taskPct=taskRows.length?taskRows.reduce(function(sum,r){return sum+(r.score/r.max*100);},0)/taskRows.length:masteryAverage(subject); const composite=Math.round(mcqPct*subject.exam.mcq.weight/100+taskPct*subject.exam.written.weight/100); const thresholds=subject.scoreBands; let score=1; for(let i=1;i<=4;i++)if(composite>=thresholds[i])score=i+1; const evidence=responses.length+taskRows.length*3; const uncertainty=Math.max(4,Math.round(18-Math.min(14,Math.sqrt(evidence)*1.4))); return {score,composite,mcqPct:Math.round(mcqPct),taskPct:Math.round(taskPct),evidence,uncertainty,band:(Math.max(0,composite-uncertainty))+'–'+Math.min(100,composite+uncertainty)+' composite readiness'};
  }

  function renderScore() {
    const e=estimateScore();const ss=subjectState();const history=ss.scoreHistory.slice(-12);return '<div class="ap2-grid"><section class="ap2-card wide accent"><div class="ap2-kicker">Evidence-Weighted Score Studio</div><div class="ap2-score-gauge"><div class="ap2-score-circle" style="--p:'+e.composite+'"><strong>'+e.score+'</strong></div><div><h2>Current practice-readiness estimate</h2><p>'+e.composite+'% weighted composite · '+e.band+'</p><small>MCQ '+subject.exam.mcq.weight+'% + written '+subject.exam.written.weight+'%, using this course’s public blueprint</small></div></div></section><section class="ap2-card"><div class="ap2-kicker">Evidence balance</div><div class="ap2-stat">'+e.evidence+'</div><p>scored evidence points</p><div class="ap2-mastery-list"><div class="ap2-mastery"><span>MCQ evidence</span><div class="ap2-bar"><span style="width:'+e.mcqPct+'%"></span></div><b>'+e.mcqPct+'%</b></div><div class="ap2-mastery"><span>Task evidence</span><div class="ap2-bar"><span style="width:'+e.taskPct+'%"></span></div><b>'+e.taskPct+'%</b></div></div></section><section class="ap2-card full"><h2>Progress over completed sets</h2>'+scoreChart(history)+'</section><section class="ap2-card wide"><div class="ap2-kicker">Subject-specific readiness bands</div><h2>Why the same raw percent does not mean the same thing everywhere</h2><p>Scholark uses current section weights and a separate readiness map for each course. These bands are independent planning estimates—not hidden College Board conversion tables. Operational cut scores are not published and may vary by form.</p><div class="ap2-proof">'+[1,2,3,4].map(function(i){return '<article><strong>'+(i+1)+'</strong><span>from about '+subject.scoreBands[i]+'% composite</span></article>';}).join('')+'</div></section><section class="ap2-card"><h3>Next evidence upgrade</h3><p>'+(ss.taskAttempts.length<2?'Complete two '+esc(subject.tasks[0].name)+' rubric checks so written performance is not inferred from MCQ alone.':'Run an official-length MCQ simulation and one task from your weakest format.')+'</p><div class="ap2-actions"><button class="ap2-primary" data-ap-action="view" data-id="exam">Open Exam Lab</button></div></section></div>';
  }

  function scoreChart(points){if(!points.length)return '<div class="ap2-empty">Complete a practice set to start your progress graph.</div>';const width=760,height=230,pad=35;const coords=points.map(function(p,i){return {x:pad+(i/(Math.max(1,points.length-1)))*(width-pad*2),y:height-pad-(p.percent/100)*(height-pad*2),p};});return '<div class="ap2-chart-scroll"><svg class="ap2-score-chart" viewBox="0 0 '+width+' '+height+'" role="img" aria-label="Practice accuracy over time">'+[0,25,50,75,100].map(function(v){const y=height-pad-(v/100)*(height-pad*2);return '<line class="grid" x1="'+pad+'" y1="'+y+'" x2="'+(width-pad)+'" y2="'+y+'"></line><text x="5" y="'+(y+4)+'">'+v+'%</text>';}).join('')+'<polyline class="line" points="'+coords.map(function(c){return c.x+','+c.y;}).join(' ')+'"></polyline>'+coords.map(function(c,i){return '<circle class="point" cx="'+c.x+'" cy="'+c.y+'" r="5"><title>'+esc(c.p.kind)+' · '+c.p.percent+'%</title></circle><text x="'+(c.x-7)+'" y="'+(height-9)+'">'+(i+1)+'</text>';}).join('')+'</svg></div>';}

  function renderResources() {
    return '<section class="ap2-card full dark"><div class="ap2-kicker">Public-source launchpad</div><h2>Know what is official, what is independent, and where to verify.</h2><p>Scholark routes students to current assessment pages, Bluebook, AP Classroom/AP Daily, past FRQs and scoring information, plus clearly labeled external learning searches.</p></section><div class="ap2-resource-grid" style="margin-top:14px">'+subject.resources.map(function(r){return '<article class="ap2-resource"><span class="ap2-pill">'+esc(r.type)+'</span><h3>'+esc(r.name)+'</h3><a class="ap2-secondary" href="'+esc(r.url)+'" target="_blank" rel="noopener">Open resource ↗</a></article>';}).join('')+'</div><div class="ap2-source-note"><strong>Methodology.</strong> '+esc(data.methodology.examFormats)+' '+esc(data.methodology.questions)+' '+esc(data.methodology.scoring)+'<br><br>'+esc(data.methodology.trademarks)+'</div>';
  }

  function weakestUnits(count){return Object.entries(subjectState().mastery).map(function(entry){return {index:Number(entry[0]),score:Number(entry[1].score)||0};}).sort(function(a,b){return a.score-b.score;}).slice(0,count);}
  function masteryRows(){return subject.units.map(function(u,i){const row=subjectState().mastery[i];return '<div class="ap2-mastery"><span>'+esc(u.name)+'</span><div class="ap2-bar"><span style="width:'+row.score+'%"></span></div><b>'+row.score+'</b></div>';}).join('');}
  function daysUntilExam(value){if(!value)return null;const date=Date.parse(value+'T12:00:00');if(!date)return null;return Math.max(0,Math.ceil((date-Date.now())/86400000));}
  function formatMinutes(n){return Math.floor(n/60)+'h '+(n%60?String(n%60)+'m':'');}
  function clock(seconds){const n=Math.max(0,Number(seconds)||0);return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');}
  async function copyCram(){const text=subject.name+' — Scholark Cram Sheet\n\n'+subject.units.map(function(u){return u.name+' ('+u.weight+')\n'+u.concepts.map(function(c){return '• '+c.name+': '+c.teach+'\n  Trap: '+c.trap;}).join('\n');}).join('\n\n');try{await navigator.clipboard.writeText(text);toast('Cram sheet copied.');}catch(error){console.error('Copy failed:',error);toast('Could not access the clipboard. Use Print / save as PDF instead.','error');}}
  function toggleBookmark(id){const ss=subjectState();ss.bookmarks=ss.bookmarks.includes(id)?ss.bookmarks.filter(function(x){return x!==id;}):ss.bookmarks.concat(id);saveState();renderSubject();}

  root.ScholarkAP = { init, clearTask:function(){taskDraft=null;}, getState:function(){return state;}, estimateScore, startSession };
  root.initAPHub = init;
  root.apOpenSubject = openSubject;
  root.apBackToHub = backToHub;
})(window);
