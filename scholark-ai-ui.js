(() => {
  'use strict';
  if (window.__scholarkAIUIInstalled) return;
  window.__scholarkAIUIInstalled = true;

  const AI = window.ScholarkAI;
  const Agents = window.ScholarkAIAgents;
  if (!AI || !Agents) return;

  const q = (s, r = document) => r.querySelector(s);
  const qa = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = value => String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const VERSION = '1.0.0';
  let legacyEssayFeedback = null;
  let autosaveTimer = null;
  let lastEssayEvaluation = null;

  function ensureStyles() {
    if (q('link[href*="scholark-ai.css"]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'scholark-ai.css';
    document.head.appendChild(link);
  }

  function capabilityLabel() {
    const cap = AI.state.capability || AI.detectDevice();
    if (cap.generative) return `Private on-device AI · ${cap.tier} mode`;
    if (cap.wasm) return 'Compatibility mode · guided local tools';
    return 'Guided local tools';
  }

  function renderLauncher() {
    if (q('#sk-ai-launch')) return;
    const nav = q('.nav-links');
    if (!nav) return;
    const btn = document.createElement('button');
    btn.id = 'sk-ai-launch';
    btn.className = 'nav-link sk-ai-launch';
    btn.type = 'button';
    btn.textContent = 'Ask Scholark';
    btn.setAttribute('aria-haspopup', 'dialog');
    btn.addEventListener('click', openDialog);
    const feature = q('#nav-features', nav);
    nav.insertBefore(btn, feature || null);
  }

  function dialogHTML() {
    return `<div class="sk-ai-shell" role="dialog" aria-modal="true" aria-labelledby="sk-ai-title">
      <div class="sk-ai-head">
        <div>
          <span class="sk-ai-kicker">Scholark intelligence</span>
          <h2 id="sk-ai-title">Ask Scholark</h2>
          <p id="sk-ai-capability">${esc(capabilityLabel())}</p>
        </div>
        <button class="sk-ai-close" type="button" aria-label="Close Ask Scholark">×</button>
      </div>
      <div class="sk-ai-quick" aria-label="Suggested actions">
        <button type="button" data-sk-prompt="Explain a concept I'm struggling with." data-sk-mode="tutor"><b>Learn</b><span>Explain something</span></button>
        <button type="button" data-sk-action="essay"><b>Essay</b><span>Admissions reader</span></button>
        <button type="button" data-sk-prompt="What should I study next?" data-sk-mode="planner"><b>Plan</b><span>Prioritize my work</span></button>
        <button type="button" data-sk-action="sat"><b>SAT</b><span>Open diagnostics</span></button>
        <button type="button" data-sk-action="college"><b>College</b><span>Research from data</span></button>
      </div>
      <div class="sk-ai-transcript" id="sk-ai-transcript" aria-live="polite">
        <div class="sk-ai-welcome"><strong>What do you need help with?</strong><span>Requests are routed to a specialist. A local model is loaded only when useful; otherwise Scholark falls back to guided tools.</span></div>
      </div>
      <div class="sk-ai-progress" id="sk-ai-progress" hidden><span></span><div><b>Preparing your specialist</b><small id="sk-ai-progress-text">Checking this device…</small></div></div>
      <form class="sk-ai-composer" id="sk-ai-form">
        <label class="sr-only" for="sk-ai-input">Ask Scholark</label>
        <textarea id="sk-ai-input" rows="2" maxlength="4000" placeholder="Ask a question…"></textarea>
        <div class="sk-ai-composer-actions">
          <button type="button" class="sk-ai-new">New conversation</button>
          <div>
            <button type="button" class="sk-ai-stop" hidden>Stop</button>
            <button type="submit" class="sk-ai-send">Send</button>
          </div>
        </div>
      </form>
    </div>`;
  }

  function installDialog() {
    if (q('#sk-ai-dialog')) return;
    const overlay = document.createElement('div');
    overlay.id = 'sk-ai-dialog';
    overlay.className = 'sk-ai-dialog';
    overlay.hidden = true;
    overlay.innerHTML = dialogHTML();
    document.body.appendChild(overlay);

    q('.sk-ai-close', overlay).addEventListener('click', closeDialog);
    overlay.addEventListener('pointerdown', event => { if (event.target === overlay) closeDialog(); });
    q('#sk-ai-form', overlay).addEventListener('submit', event => { event.preventDefault(); submitAsk(); });
    q('.sk-ai-stop', overlay).addEventListener('click', () => AI.cancelGeneration());
    q('.sk-ai-new', overlay).addEventListener('click', () => {
      AI.sessions.clearAll();
      q('#sk-ai-transcript', overlay).innerHTML = '<div class="sk-ai-welcome"><strong>Fresh conversation</strong><span>Previous local AI conversation context was cleared.</span></div>';
      q('#sk-ai-input', overlay).value = '';
      q('#sk-ai-input', overlay).focus();
    });
    qa('[data-sk-prompt]', overlay).forEach(btn => btn.addEventListener('click', () => {
      q('#sk-ai-input', overlay).value = btn.dataset.skPrompt;
      q('#sk-ai-input', overlay).focus();
    }));
    qa('[data-sk-action]', overlay).forEach(btn => btn.addEventListener('click', () => routeShortcut(btn.dataset.skAction)));
  }

  function routeShortcut(action) {
    closeDialog();
    if (action === 'essay' && typeof window.showPage === 'function') { window.showPage('essay'); return; }
    if (action === 'sat' && typeof window.showPage === 'function') { window.showPage('prep'); return; }
    if (action === 'college' && typeof window.showPage === 'function') {
      if (q('#page-compare')) window.showPage('compare'); else if (q('#page-counselor')) window.showPage('counselor');
    }
  }

  function openDialog() {
    const overlay = q('#sk-ai-dialog');
    if (!overlay) return;
    overlay.hidden = false;
    document.body.classList.add('sk-ai-open');
    q('#sk-ai-capability', overlay).textContent = capabilityLabel();
    setTimeout(() => q('#sk-ai-input', overlay)?.focus(), 0);
  }

  function closeDialog() {
    const overlay = q('#sk-ai-dialog');
    if (!overlay) return;
    overlay.hidden = true;
    document.body.classList.remove('sk-ai-open');
    q('#sk-ai-launch')?.focus();
  }

  function addMessage(role, content, meta = '') {
    const list = q('#sk-ai-transcript');
    if (!list) return;
    const item = document.createElement('div');
    item.className = `sk-ai-message ${role}`;
    item.innerHTML = `<div>${esc(content).replace(/\n/g, '<br>')}</div>${meta ? `<small>${esc(meta)}</small>` : ''}`;
    list.appendChild(item);
    list.scrollTop = list.scrollHeight;
  }

  function setBusy(busy, text = '') {
    const overlay = q('#sk-ai-dialog');
    if (!overlay) return;
    const progress = q('#sk-ai-progress', overlay);
    const stop = q('.sk-ai-stop', overlay);
    const send = q('.sk-ai-send', overlay);
    progress.hidden = !busy;
    stop.hidden = !busy;
    send.disabled = busy;
    if (text) q('#sk-ai-progress-text', overlay).textContent = text;
  }

  async function submitAsk() {
    const input = q('#sk-ai-input');
    const text = input?.value.trim();
    if (!text) return;
    input.value = '';
    addMessage('user', text);
    setBusy(true, 'Routing to the right specialist…');
    try {
      const context = collectLightContext(text);
      const result = await Agents.ask(text, context);
      const answer = result.answer || result.value?.text || result.evaluation?.verdict || summarizeStructuredResult(result);
      const mode = result.mode === 'local-generative' ? `On-device ${result.route?.agent || 'AI'} · ${result.tier || 'local'}` : 'Guided fallback · no cloud AI';
      addMessage('assistant', answer || 'Scholark completed the request using the available local tools.', mode);
    } catch (error) {
      console.error('[Scholark AI UI] request failed', error);
      addMessage('assistant', 'That request could not be completed in the command view. Your existing Scholark tools and saved work are still available.', 'Recovery mode');
    } finally {
      setBusy(false);
      input?.focus();
    }
  }

  function collectLightContext(text) {
    const route = AI.algorithms.routeIntent(text).agent;
    if (route === 'essay') {
      return { essay: q('#essay-textarea')?.value || '', prompt: currentEssayPrompt() };
    }
    if (route === 'planner') {
      const current = Agents.planner.current();
      return current?.input || { tasks: [], dailyMinutes: 60 };
    }
    return {
      subject: inferSubjectFromPage(),
      mastery: Agents.mastery.all(),
      currentPage: qa('.page.active')[0]?.id || ''
    };
  }

  function inferSubjectFromPage() {
    const page = qa('.page.active')[0]?.id || '';
    if (page.includes('ap')) return 'AP course';
    if (page.includes('prep')) return 'SAT';
    return '';
  }

  function summarizeStructuredResult(result) {
    if (Array.isArray(result.plan)) {
      const first = result.plan[0]?.blocks?.[0];
      return first ? `Start with ${first.title} for ${first.minutes} minutes. ${first.reason || ''}` : 'No current study task needs urgent attention.';
    }
    return '';
  }

  function currentEssayPrompt() {
    const select = q('#essay-prompt');
    if (!select) return '';
    return select.selectedOptions?.[0]?.textContent || '';
  }

  function essayDetailHTML() {
    return `<section class="sk-ai-essay-detail" id="sk-ai-essay-detail" aria-live="polite">
      <div class="sk-ai-essay-title-row">
        <div><span class="sk-ai-kicker">AI Admissions Reader Simulation</span><h3>Demanding rubric review</h3><p>This is an AI simulation of an admissions-style reading, not an evaluation from any specific university.</p></div>
        <div class="sk-ai-overall" id="sk-ai-overall"><b>—</b><span>/ 10</span></div>
      </div>
      <div class="sk-ai-essay-status" id="sk-ai-essay-status">Run Rubric Feedback to generate the expanded review.</div>
      <div class="sk-ai-score-matrix" id="sk-ai-score-matrix"></div>
      <div class="sk-ai-essay-insights" id="sk-ai-essay-insights"></div>
      <div class="sk-ai-essay-follow" id="sk-ai-essay-follow" hidden>
        <label for="sk-ai-essay-question">Ask about this evaluation</label>
        <div><input id="sk-ai-essay-question" maxlength="1000" placeholder="What is keeping this from an 8?"/><button type="button" id="sk-ai-essay-ask">Ask</button></div>
        <div id="sk-ai-essay-answer" class="sk-ai-follow-answer"></div>
      </div>
      <div class="sk-ai-version-compare" id="sk-ai-version-compare"></div>
    </section>`;
  }

  function installEssayEnhancement() {
    const legacyPanel = q('#essay-ai-panel');
    if (!legacyPanel) return false;
    if (!q('#sk-ai-essay-detail')) legacyPanel.insertAdjacentHTML('afterend', essayDetailHTML());

    const textarea = q('#essay-textarea');
    if (textarea && !textarea.dataset.skAiAutosave) {
      textarea.dataset.skAiAutosave = '1';
      textarea.addEventListener('input', scheduleEssayAutosave, { passive: true });
      restoreEssayAutosave();
    }

    if (!legacyEssayFeedback && typeof window.getEssayFeedback === 'function' && !window.getEssayFeedback.__scholarkAIEnhanced) {
      legacyEssayFeedback = window.getEssayFeedback;
      const enhanced = async function() {
        const text = q('#essay-textarea')?.value.trim() || '';
        if (text.length < 100) return legacyEssayFeedback.apply(this, arguments);
        scheduleEssayAutosave(true);
        await legacyEssayFeedback.apply(this, arguments);
        return runExpandedEssayEvaluation(text);
      };
      enhanced.__scholarkAIEnhanced = true;
      enhanced.__legacy = legacyEssayFeedback;
      window.getEssayFeedback = enhanced;
    }

    const ask = q('#sk-ai-essay-ask');
    if (ask && !ask.dataset.ready) {
      ask.dataset.ready = '1';
      ask.addEventListener('click', runEssayFollowUp);
      q('#sk-ai-essay-question')?.addEventListener('keydown', event => {
        if (event.key === 'Enter') { event.preventDefault(); runEssayFollowUp(); }
      });
    }
    return true;
  }

  function essayAutosaveKey() {
    const user = window.currentUser?.uid || window._gsUser?.uid || 'local';
    return `essay_autosave_${user}`;
  }

  function scheduleEssayAutosave(immediate = false) {
    clearTimeout(autosaveTimer);
    const save = () => {
      const textarea = q('#essay-textarea');
      if (!textarea) return;
      AI.storage.write(essayAutosaveKey(), {
        text: textarea.value,
        prompt: q('#essay-prompt')?.value || '',
        updatedAt: Date.now()
      });
      const status = q('#sk-ai-essay-status');
      if (status && textarea.value.trim()) status.dataset.autosaved = 'true';
    };
    if (immediate) save(); else autosaveTimer = setTimeout(save, 650);
  }

  function restoreEssayAutosave() {
    const textarea = q('#essay-textarea');
    if (!textarea || textarea.value.trim()) return;
    const saved = AI.storage.read(essayAutosaveKey(), null);
    if (!saved?.text) return;
    textarea.value = saved.text;
    if (q('#essay-prompt') && saved.prompt) q('#essay-prompt').value = saved.prompt;
    window.onEssayInput?.();
    window.updatePromptHint?.();
  }

  async function runExpandedEssayEvaluation(text) {
    const section = q('#sk-ai-essay-detail');
    if (!section) return;
    const status = q('#sk-ai-essay-status', section);
    status.className = 'sk-ai-essay-status loading';
    status.textContent = AI.state.capability?.generative ? 'Preparing the private on-device admissions reader. First use may download and cache a local model…' : 'Running the expanded compatibility rubric…';
    section.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });

    const stopListening = AI.on('model-progress', event => {
      if (!status) return;
      const pct = Number.isFinite(event.progress) ? ` ${Math.round(event.progress * 100)}%` : '';
      status.textContent = `${event.text || 'Preparing local model'}${pct}`;
    });

    try {
      const result = await Agents.essay.evaluate(text, currentEssayPrompt(), { saveVersion: true });
      lastEssayEvaluation = result.evaluation;
      renderEssayEvaluation(result);
    } catch (error) {
      console.error('[Scholark AI] expanded essay evaluation failed', error);
      status.className = 'sk-ai-essay-status error';
      status.textContent = 'The expanded review could not finish. Your existing rubric feedback and draft are unchanged.';
    } finally {
      stopListening();
    }
  }

  const scoreLabels = {
    hook:'Opening / Hook',authenticity:'Authenticity',specificity:'Specificity',voice:'Voice',storytelling:'Storytelling',reflection:'Reflection',vulnerability:'Vulnerability',structure:'Structure',show_vs_tell:'Show vs Tell',memorability:'Memorability',cliche_risk:'Low Cliché Risk',depth:'Personal / Intellectual Depth',admissions_impact:'Admissions Impact'
  };

  function renderEssayEvaluation(result) {
    const e = result.evaluation;
    const section = q('#sk-ai-essay-detail');
    if (!e || !section) return;
    q('#sk-ai-overall b', section).textContent = Number(e.overall).toFixed(1);
    const mode = result.mode === 'local-generative' ? `On-device AI · ${result.tier} model` : 'Compatibility rubric · deterministic fallback';
    const status = q('#sk-ai-essay-status', section);
    status.className = 'sk-ai-essay-status ready';
    status.textContent = `${mode}. Draft stayed in the browser for this evaluation path.`;
    q('#sk-ai-score-matrix', section).innerHTML = Object.entries(scoreLabels).map(([key,label]) => {
      const value = Number(e.scores?.[key] || 0);
      return `<div class="sk-ai-score-row"><span>${esc(label)}</span><div><i style="--score:${Math.max(0,Math.min(10,value))}"></i></div><b>${value.toFixed(1)}</b></div>`;
    }).join('');
    q('#sk-ai-essay-insights', section).innerHTML = `
      <div class="sk-ai-insight"><span>Strongest element</span><p>${esc(e.strongest_element)}</p></div>
      <div class="sk-ai-insight"><span>Biggest weakness</span><p>${esc(e.biggest_weakness)}</p></div>
      <div class="sk-ai-insight wide"><span>What an admissions reader might think</span><p>${esc(e.reader_thought)}</p></div>
      <div class="sk-ai-insight"><span>Where attention drops</span><p>${esc(e.attention_drop)}</p></div>
      <div class="sk-ai-insight"><span>Most memorable idea</span><p>${esc(e.memorable_idea)}</p></div>
      <div class="sk-ai-insight"><span>Least effective section</span><p>${esc(e.least_effective_section)}</p></div>
      <div class="sk-ai-insight"><span>What is keeping this from an 8?</span><p>${esc(e.keeping_from_eight)}</p></div>
      <div class="sk-ai-insight wide"><span>Three highest-impact improvements</span><ol>${(e.improvements || []).map(x => `<li>${esc(x)}</li>`).join('')}</ol></div>
      <div class="sk-ai-insight wide verdict"><span>Final admissions-reader verdict</span><p>${esc(e.verdict)}</p></div>`;
    q('#sk-ai-essay-follow', section).hidden = false;
    renderVersionComparison();
  }

  async function runEssayFollowUp() {
    const input = q('#sk-ai-essay-question');
    const output = q('#sk-ai-essay-answer');
    const question = input?.value.trim();
    if (!question || !lastEssayEvaluation || !output) return;
    output.textContent = 'Reviewing this question against the current rubric…';
    try {
      const result = await Agents.essay.followUp(question, {
        evaluation: lastEssayEvaluation,
        essay: q('#essay-textarea')?.value || ''
      });
      output.textContent = result.answer || 'No additional feedback was produced.';
    } catch (error) {
      output.textContent = 'The follow-up could not run. The current rubric scores remain available above.';
    }
  }

  function renderVersionComparison() {
    const history = Agents.essay.history();
    const box = q('#sk-ai-version-compare');
    if (!box) return;
    if (history.length < 2) {
      box.innerHTML = '<p>Version comparison will appear after you evaluate a revised draft.</p>';
      return;
    }
    const comparison = Agents.essay.compare(history[1], history[0]);
    if (!comparison) return;
    const topUp = comparison.improved[0];
    const topDown = comparison.weakened[0];
    box.innerHTML = `<div><span>Latest revision</span><strong>${comparison.overallDelta >= 0 ? '+' : ''}${comparison.overallDelta.toFixed(1)} overall</strong></div>
      <p>${topUp ? `${esc(scoreLabels[topUp.category] || topUp.category)} improved ${topUp.before.toFixed(1)} → ${topUp.after.toFixed(1)}.` : 'No category improved materially.'}
      ${topDown ? ` ${esc(scoreLabels[topDown.category] || topDown.category)} decreased ${topDown.before.toFixed(1)} → ${topDown.after.toFixed(1)}.` : ''}</p>`;
  }

  function installRuntimeStatus() {
    AI.on('runtime-error', event => AI.telemetry.record('runtime-error', { name: event.error?.name, message: event.error?.message, tier: event.tier }));
    AI.on('fallback', event => AI.telemetry.record('fallback', { agent: event.agent, reason: event.reason }));
  }

  function wrapShowPage() {
    if (typeof window.showPage !== 'function' || window.showPage.__scholarkAIUI) return false;
    const original = window.showPage;
    const wrapped = function(name, ...args) {
      const result = original.call(this, name, ...args);
      if (name === 'essay') setTimeout(installEssayEnhancement, 0);
      return result;
    };
    wrapped.__scholarkAIUI = true;
    wrapped.__original = original;
    window.showPage = wrapped;
    return true;
  }

  function boot() {
    ensureStyles();
    renderLauncher();
    installDialog();
    installEssayEnhancement();
    wrapShowPage();
    installRuntimeStatus();

    if (!q('#sk-ai-launch') || !q('#sk-ai-dialog')) setTimeout(boot, 120);
    if (typeof window.showPage !== 'function') setTimeout(wrapShowPage, 120);

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !q('#sk-ai-dialog')?.hidden) closeDialog();
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k' && !/input|textarea|select/i.test(document.activeElement?.tagName || '')) {
        event.preventDefault();
        openDialog();
      }
    });

    window.ScholarkAIUI = { version: VERSION, open: openDialog, close: closeDialog, enhanceEssay: installEssayEnhancement };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
