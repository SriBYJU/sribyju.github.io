(() => {
  'use strict';
  if (window.__scholarkAIPracticeUIInstalled) return;
  window.__scholarkAIPracticeUIInstalled = true;

  const Practice = window.ScholarkAIPractice;
  const Agents = window.ScholarkAIAgents;
  if (!Practice || !Agents) return;

  const q = (s, r = document) => r.querySelector(s);
  const esc = value => String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  let active = null;
  let activeQuestion = null;
  let hintsUsed = 0;
  let lastFocused = null;

  function ensureStyles() {
    if (q('link[href*="scholark-ai-practice.css"]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'scholark-ai-practice.css';
    document.head.appendChild(link);
  }

  function installLauncher() {
    const quick = q('#sk-ai-dialog .sk-ai-quick');
    if (!quick || q('#sk-ai-practice-launch', quick)) return false;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'sk-ai-practice-launch';
    btn.innerHTML = '<b>Practice</b><span>Adaptive next set</span>';
    btn.addEventListener('click', () => {
      window.ScholarkAIUI?.close?.();
      openDialog();
    });
    quick.appendChild(btn);
    return true;
  }

  function installDialog() {
    if (q('#sk-practice-dialog')) return;
    const overlay = document.createElement('div');
    overlay.id = 'sk-practice-dialog';
    overlay.className = 'sk-practice-dialog';
    overlay.hidden = true;
    overlay.innerHTML = `<section class="sk-practice-shell" role="dialog" aria-modal="true" aria-labelledby="sk-practice-title">
      <header>
        <div><span>Scholark adaptive practice</span><h2 id="sk-practice-title">Practice the next thing that matters</h2></div>
        <button type="button" class="sk-practice-close" aria-label="Close practice">×</button>
      </header>
      <div class="sk-practice-setup" id="sk-practice-setup">
        <label for="sk-practice-skill">Skill or topic</label>
        <div><input id="sk-practice-skill" maxlength="160" placeholder="e.g. linear equations, probability, grammar"><button type="button" id="sk-practice-start">Start adaptive set</button></div>
        <p id="sk-practice-suggestion"></p>
      </div>
      <div id="sk-practice-stage" class="sk-practice-stage" hidden></div>
      <footer><small>Mastery only changes from objectively gradable items. Open-ended retrieval prompts never auto-inflate your score.</small></footer>
    </section>`;
    document.body.appendChild(overlay);
    q('.sk-practice-close', overlay).addEventListener('click', closeDialog);
    overlay.addEventListener('pointerdown', event => { if (event.target === overlay) closeDialog(); });
    q('#sk-practice-start', overlay).addEventListener('click', start);
    q('#sk-practice-skill', overlay).addEventListener('keydown', event => {
      if (event.key === 'Enter') { event.preventDefault(); start(); }
    });
    overlay.addEventListener('keydown', trapKeys);
  }

  function suggestedSkill() {
    const weak = Practice.nextWeakSkill();
    return weak && weak !== 'unknown' ? weak : '';
  }

  function openDialog() {
    const overlay = q('#sk-practice-dialog');
    if (!overlay) return;
    lastFocused = document.activeElement;
    overlay.hidden = false;
    document.body.classList.add('sk-practice-open');
    const input = q('#sk-practice-skill', overlay);
    const suggestion = suggestedSkill();
    if (!input.value && suggestion) input.value = suggestion;
    q('#sk-practice-suggestion', overlay).textContent = suggestion ? `Based on your saved mastery, ${suggestion} is a strong next target.` : 'Choose any topic. Scholark will use a deterministic practice set where it can grade safely.';
    setTimeout(() => input.focus(), 0);
  }

  function closeDialog() {
    const overlay = q('#sk-practice-dialog');
    if (!overlay) return;
    overlay.hidden = true;
    document.body.classList.remove('sk-practice-open');
    lastFocused?.focus?.();
  }

  function trapKeys(event) {
    if (event.key === 'Escape') { closeDialog(); return; }
    if (event.key !== 'Tab') return;
    const root = q('#sk-practice-dialog .sk-practice-shell');
    const focusable = [...root.querySelectorAll('button,input,textarea,select,[tabindex]:not([tabindex="-1"])')].filter(el => !el.disabled && !el.hidden);
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  function start() {
    const input = q('#sk-practice-skill');
    const skill = input?.value.trim();
    if (!skill) { input?.focus(); return; }
    active = Practice.createSession(skill);
    activeQuestion = null;
    hintsUsed = 0;
    q('#sk-practice-setup').hidden = true;
    q('#sk-practice-stage').hidden = false;
    renderCurrent();
  }

  function renderCurrent() {
    const stage = q('#sk-practice-stage');
    if (!stage || !active) return;
    active = Practice.getSession(active.id) || active;
    if (active.completed || active.index >= active.questions.length) { renderSummary(); return; }
    const question = active.questions[active.index];
    activeQuestion = question;
    hintsUsed = 0;
    const choiceHTML = Array.isArray(question.choices) ? `<div class="sk-practice-choices">${question.choices.map((choice, i) => {
      const label = String.fromCharCode(65 + i);
      return `<label><input type="radio" name="sk-practice-answer" value="${label}"><span><b>${label}</b>${esc(choice)}</span></label>`;
    }).join('')}</div>` : `<label class="sk-practice-answer-label" for="sk-practice-answer">Your answer</label><input id="sk-practice-answer" class="sk-practice-answer" maxlength="1200" autocomplete="off">`;
    stage.innerHTML = `<div class="sk-practice-progress"><span>Question ${active.index + 1} of ${active.questions.length}</span><span>${esc(active.skill)} · ${esc(active.difficulty)}</span></div>
      <div class="sk-practice-card">
        <span class="sk-practice-domain">${esc(question.domain)}</span>
        <h3>${esc(question.prompt)}</h3>
        ${choiceHTML}
        <div class="sk-practice-actions"><button type="button" id="sk-practice-hint">Hint</button><button type="button" id="sk-practice-submit">Check answer</button></div>
        <div id="sk-practice-feedback" class="sk-practice-feedback" hidden></div>
      </div>`;
    q('#sk-practice-hint', stage).addEventListener('click', showHint);
    q('#sk-practice-submit', stage).addEventListener('click', submit);
    q('#sk-practice-answer', stage)?.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); submit(); } });
    (q('#sk-practice-answer', stage) || q('input[type="radio"]', stage))?.focus?.();
  }

  function selectedAnswer() {
    const checked = q('input[name="sk-practice-answer"]:checked');
    if (checked) return checked.value;
    return q('#sk-practice-answer')?.value.trim() || '';
  }

  function showHint() {
    const box = q('#sk-practice-feedback');
    if (!box || !activeQuestion) return;
    hintsUsed += 1;
    const explanation = activeQuestion.explanation || 'Break the problem into the smallest rule you know, then apply one step at a time.';
    const firstSentence = explanation.split(/(?<=[.!?])\s+/)[0] || explanation;
    box.hidden = false;
    box.className = 'sk-practice-feedback hint';
    box.textContent = `Hint: ${firstSentence}`;
  }

  function submit() {
    const answer = selectedAnswer();
    if (!answer) return;
    const result = Practice.submit(active.id, activeQuestion.id, answer, { hintsUsed, confidence: 0.6 });
    const box = q('#sk-practice-feedback');
    if (!box) return;
    box.hidden = false;
    if (result.gradable) {
      box.className = `sk-practice-feedback ${result.correct ? 'correct' : 'incorrect'}`;
      box.innerHTML = `<strong>${result.correct ? 'Correct' : 'Not yet'}</strong><p>${esc(result.explanation || '')}</p><small>Mastery: ${Number(result.mastery?.score || 0).toFixed(1)} · ${esc(result.mastery?.label || '')}</small>${!result.correct ? '<button type="button" id="sk-practice-explain">Explain my mistake</button>' : ''}<button type="button" id="sk-practice-next">Next</button>`;
    } else {
      box.className = 'sk-practice-feedback neutral';
      box.innerHTML = `<strong>Retrieval response saved</strong><p>${esc(result.explanation || '')}</p><small>This open-ended item does not automatically change mastery.</small><button type="button" id="sk-practice-explain">Check with Tutor</button><button type="button" id="sk-practice-next">Next</button>`;
    }
    q('#sk-practice-submit')?.setAttribute('disabled', 'disabled');
    q('#sk-practice-hint')?.setAttribute('disabled', 'disabled');
    q('#sk-practice-next')?.addEventListener('click', renderCurrent);
    q('#sk-practice-explain')?.addEventListener('click', () => explain(answer));
  }

  async function explain(answer) {
    const button = q('#sk-practice-explain');
    const box = q('#sk-practice-feedback');
    if (!button || !box) return;
    button.disabled = true;
    button.textContent = 'Tutor is checking…';
    try {
      const result = await Practice.explainMistake(active.id, activeQuestion.id, answer);
      const text = result.answer || result.value?.text || 'Use the verified explanation above and try a similar problem before moving on.';
      const p = document.createElement('p');
      p.className = 'sk-practice-tutor';
      p.textContent = text;
      box.appendChild(p);
    } catch (_) {
      button.textContent = 'Tutor unavailable — use verified explanation';
      return;
    }
    button.remove();
  }

  function renderSummary() {
    const stage = q('#sk-practice-stage');
    const latest = Practice.getSession(active.id) || active;
    const graded = latest.responses.filter(r => r.gradable);
    const correct = graded.filter(r => r.correct).length;
    const mastery = Agents.mastery.get(latest.skill);
    stage.innerHTML = `<div class="sk-practice-summary">
      <span>Set complete</span><h3>${esc(latest.skill)}</h3>
      <strong>${graded.length ? `${correct}/${graded.length} objectively graded` : 'Retrieval practice completed'}</strong>
      <p>Current mastery: ${Number(mastery.score || 0).toFixed(1)} · ${esc(mastery.label || 'Not Started')}</p>
      <div><button type="button" id="sk-practice-again">Practice again</button><button type="button" id="sk-practice-done">Done</button></div>
    </div>`;
    q('#sk-practice-again', stage).addEventListener('click', () => {
      active = Practice.createSession(latest.skill);
      renderCurrent();
    });
    q('#sk-practice-done', stage).addEventListener('click', () => {
      q('#sk-practice-setup').hidden = false;
      q('#sk-practice-stage').hidden = true;
      q('#sk-practice-skill').value = latest.skill;
      q('#sk-practice-skill').focus();
    });
  }

  function boot() {
    ensureStyles();
    installDialog();
    if (!installLauncher()) setTimeout(boot, 150);
    window.ScholarkAIPracticeUI = { version: '1.0.0', open: openDialog, close: closeDialog };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
