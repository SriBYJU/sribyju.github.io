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
  let essayRun = 0;
  let evaluatedEssay = null;
  let essayProgressCleanup = null;
  let activeRequest = null;
  let lastChatExchange = null;

  function ensureStyles() {
    if (q('link[href*="scholark-ai.css"]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'scholark-ai.css?revision=20261013';
    document.head.appendChild(link);
  }

  function capabilityLabel() {
    const cap = AI.state.capability || AI.detectDevice();
    if (cap.generative) return `Private on-device AI · ${cap.tier} mode`;
    if (cap.wasm) return 'Private on-device AI · CPU mode';
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
        <div class="sk-ai-welcome"><strong>What do you need help with?</strong><span>Your first AI reply may take a few minutes while a model downloads to this device. Later replies use the cached model. Guided help is a last resort when local AI cannot provide a usable answer.</span></div>
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
    q('.sk-ai-stop', overlay).addEventListener('click', () => {
      if (!activeRequest) return;
      activeRequest.cancelled = true;
      activeRequest.controller.abort();
      AI.cancelGeneration();
      setBusy(false);
      addMessage('assistant', 'Stopped. You can ask again whenever you’re ready.', 'Local AI');
    });
    q('.sk-ai-new', overlay).addEventListener('click', () => {
      if (activeRequest && !activeRequest.cancelled) {
        activeRequest.cancelled = true;
        activeRequest.controller.abort();
        AI.cancelGeneration();
      }
      setBusy(false);
      AI.sessions.clearAll();
      lastChatExchange = null;
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

  function appendInlineFormatting(parent, value) {
    const source = window.ScholarkAILearning.readableMath(value);
    const pattern = /\*\*([^*\n]+)\*\*|__([^_\n]+)__|`([^`\n]+)`|\*([^*\n]+)\*/g;
    let cursor = 0;
    for (const match of source.matchAll(pattern)) {
      parent.append(document.createTextNode(source.slice(cursor, match.index)));
      const element = document.createElement(match[3] ? 'code' : match[4] ? 'em' : 'strong');
      element.textContent = match[1] || match[2] || match[3] || match[4];
      parent.append(element);
      cursor = match.index + match[0].length;
    }
    parent.append(document.createTextNode(source.slice(cursor)));
  }

  function renderAssistantMessage(container, content) {
    let paragraph = null;
    let list = null;
    for (const line of String(content ?? '').split(/\r?\n/)) {
      if (/^\s*(?:\$\$|\\\[|\\\])\s*$/.test(line)) { paragraph = null; list = null; continue; }
      if (!line.trim()) { paragraph = null; list = null; continue; }
      const numbered = line.match(/^\s*\d+[.)]\s+(.+)$/);
      const bulleted = line.match(/^\s*[-*•]\s+(.+)$/);
      if (numbered || bulleted) {
        const tag = numbered ? 'ol' : 'ul';
        if (!list || list.tagName.toLowerCase() !== tag) {
          list = document.createElement(tag);
          container.append(list);
        }
        const item = document.createElement('li');
        appendInlineFormatting(item, (numbered || bulleted)[1]);
        list.append(item);
        paragraph = null;
        continue;
      }
      list = null;
      if (!paragraph) {
        paragraph = document.createElement('p');
        container.append(paragraph);
      } else paragraph.append(document.createElement('br'));
      appendInlineFormatting(paragraph, line);
    }
  }

  function addMessage(role, content, meta = '', sources = []) {
    const list = q('#sk-ai-transcript');
    if (!list) return;
    const item = document.createElement('div');
    item.className = `sk-ai-message ${role}`;
    const bubble = document.createElement('div');
    if (role === 'assistant') renderAssistantMessage(bubble, content);
    else bubble.textContent = String(content ?? '');
    item.append(bubble);
    if (role === 'assistant' && sources.length) {
      const details = document.createElement('details');
      details.className = 'sk-ai-sources';
      const summary = document.createElement('summary');
      summary.textContent = 'Learning notes used';
      details.append(summary);
      for (const source of sources.slice(0, 3)) {
        const note = document.createElement('p');
        note.textContent = `${source.name} · ${source.subject}: ${source.text}`;
        details.append(note);
        try {
          const url = new URL(source.url);
          if (url.protocol === 'https:' && ['apstudents.collegeboard.org', 'openstax.org'].includes(url.hostname)) {
            const link = document.createElement('a');
            link.href = url.href; link.target = '_blank'; link.rel = 'noopener noreferrer';
            link.textContent = source.sourceLabel || 'Source'; details.append(link);
          }
        } catch (_) {}
      }
      item.append(details);
    }
    if (meta) {
      const label = document.createElement('small');
      label.textContent = meta;
      item.append(label);
    }
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
    if (activeRequest && !activeRequest.cancelled) return;
    const input = q('#sk-ai-input');
    const text = input?.value.trim();
    if (!text) return;
    input.value = '';
    addMessage('user', text);
    setBusy(true, 'Routing to the right specialist…');
    const request = { cancelled: false, controller: new AbortController() };
    activeRequest = request;
    const stopProgress = AI.on('model-progress', event => {
      if (request.cancelled) return;
      const percentage = Number.isFinite(event.progress) ? ` ${Math.round(event.progress * 100)}%` : '';
      setBusy(true, `${event.text || 'Preparing local AI…'}${percentage}`);
    });
    try {
      const context = collectLightContext(text);
      context.signal = request.controller.signal;
      const result = await Agents.ask(text, context);
      if (request.cancelled) return;
      const answer = result.answer || result.value?.text || result.evaluation?.verdict || summarizeStructuredResult(result);
      if (answer) lastChatExchange = { question: text, answer: String(answer).slice(0, 1800) };
      const mode = result.mode === 'local-generative'
        ? `On-device ${result.route?.agent || 'AI'} · ${result.tier || 'local'} model`
        : result.mode === 'grounded-local' ? (result.generationKind === 'grounded-product-knowledge' ? 'Stored Scholark facts' : result.generationKind === 'verified-course-notes' ? 'Verified learning notes' : 'Scholark assistant')
          : result.value?.kind === 'course-notes' ? 'Saved learning notes · model response unavailable'
            : 'Guided help · model response unavailable';
      addMessage('assistant', answer || 'Scholark completed the request using the available local tools.', mode, result.sources || []);
    } catch (error) {
      if (request.cancelled) return;
      console.error('[Scholark AI UI] request failed', error);
      addMessage('assistant', 'The local AI could not finish this request. Check your connection and available device storage, then send it again.', 'Local AI error');
    } finally {
      stopProgress();
      if (activeRequest === request) {
        activeRequest = null;
        setBusy(false);
        input?.focus();
      }
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
    // Only an explicit conversational follow-up carries the immediately preceding exchange.
    // The active page and unrelated progress never enter general tutor chat.
    const followUp = /^(?:and|also|what about|why|how about|what do you mean|explain (?:that|this|it)|can you explain (?:that|this|it)|tell me more|go deeper)\b/i.test(text);
    return followUp && lastChatExchange ? { previousExchange: lastChatExchange } : {};
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
        <div><span class="sk-ai-kicker">Admissions Reader Simulation</span><h3>Evidence-based essay feedback</h3><p>This separate reader rubric uses a 10-point scale. Use the Essay Coach’s 100-point writing score above in College Chances. Both are local estimates, not university grades or admissions predictions. The on-device reader adds notes tied to your draft when available. It coaches your revisions and does not write your essay. The review draws on published <a href="https://admissions.yale.edu/essays" target="_blank" rel="noopener noreferrer">Yale</a> and <a href="https://admission.universityofcalifornia.edu/how-to-apply/applying-as-a-first-year/personal-insight-questions.html" target="_blank" rel="noopener noreferrer">UC</a> essay guidance.</p></div>
        <div class="sk-ai-overall" id="sk-ai-overall"><b>—</b><span>/ 10</span></div>
      </div>
      <div class="sk-ai-essay-status" id="sk-ai-essay-status">Run Rubric Feedback to generate the expanded review.</div>
      <button type="button" id="sk-ai-essay-enhance">Add on-device reader notes</button>
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
      textarea.addEventListener('input', () => { scheduleEssayAutosave(); invalidateEssayReview(); }, { passive: true });
      q('#essay-prompt')?.addEventListener('change', invalidateEssayReview);
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

    const enhance = q('#sk-ai-essay-enhance');
    if (enhance && !enhance.dataset.ready) {
      enhance.dataset.ready = '1';
      enhance.addEventListener('click', () => runExpandedEssayEvaluation(q('#essay-textarea')?.value.trim() || '', { enhance: true }));
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

  function invalidateEssayReview() {
    essayRun++;
    essayProgressCleanup?.();
    essayProgressCleanup = null;
    lastEssayEvaluation = null;
    evaluatedEssay = null;
    const section = q('#sk-ai-essay-detail');
    if (!section) return;
    section.setAttribute('aria-busy', 'false');
    q('#sk-ai-overall b', section).textContent = '—';
    for (const id of ['sk-ai-score-matrix', 'sk-ai-essay-insights', 'sk-ai-version-compare', 'sk-ai-essay-answer']) q('#' + id, section).replaceChildren();
    q('#sk-ai-essay-follow', section).hidden = true;
    q('#sk-ai-essay-enhance', section).disabled = false;
    const status = q('#sk-ai-essay-status', section);
    status.className = 'sk-ai-essay-status';
    status.textContent = 'Draft or prompt changed. Run Rubric Feedback to review this version.';
  }

  async function runExpandedEssayEvaluation(text, options = {}) {
    installEssayEnhancement();
    const section = q('#sk-ai-essay-detail');
    if (!section) return;
    invalidateEssayReview();
    const run = ++essayRun;
    const prompt = currentEssayPrompt();
    const current = () => run === essayRun && text === (q('#essay-textarea')?.value.trim() || '') && prompt === currentEssayPrompt();
    const status = q('#sk-ai-essay-status', section);
    if (text.length < 100) {
      status.textContent = 'Write at least 100 characters, then click Run Rubric Feedback. Short fragments do not provide enough evidence for a review.';
      return;
    }
    scheduleEssayAutosave(true);
    section.setAttribute('aria-busy', 'true');
    try {
      const baseline = await Agents.essay.evaluate(text, prompt, { rubricOnly: true, saveVersion: true });
      if (!current()) return;
      lastEssayEvaluation = baseline.evaluation;
      evaluatedEssay = { text, prompt };
      renderEssayEvaluation(baseline);
      if (!options.enhance) return baseline;
      q('#sk-ai-essay-enhance', section).disabled = true;
      status.className = 'sk-ai-essay-status loading';
      status.textContent = 'Rubric complete below. Preparing optional on-device reader notes; first use may download a model.';
      essayProgressCleanup = AI.on('model-progress', event => {
        if (!current()) return;
        const pct = Number.isFinite(event.progress) ? ` ${Math.round(event.progress * 100)}%` : '';
        status.textContent = `Rubric complete below. ${event.text || 'Preparing local model'}${pct}`;
      });
      const result = await Agents.essay.evaluate(text, prompt, { saveVersion: false });
      if (!current()) return;
      lastEssayEvaluation = result.evaluation;
      renderEssayEvaluation(result);
      return result;
    } catch (error) {
      if (!current()) return;
      console.error('[Scholark AI] expanded essay evaluation failed', error);
      status.className = 'sk-ai-essay-status error';
      status.textContent = lastEssayEvaluation
        ? 'The on-device notes could not finish. Your complete local rubric remains below. Retry Add on-device reader notes when ready.'
        : 'The expanded review could not finish. Your draft and passage comments are safe. Click Run Rubric Feedback to retry.';
    } finally {
      if (current()) {
        essayProgressCleanup?.();
        essayProgressCleanup = null;
        section.setAttribute('aria-busy', 'false');
        q('#sk-ai-essay-enhance', section).disabled = false;
      }
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
    const mode = result.reason === 'rubric-only' ? 'Local rubric complete · Add on-device reader notes for an optional AI review' : result.mode === 'local-generative' ? `Rubric scores + on-device AI reader notes · ${result.tier} model` : ['ungrounded-essay-feedback', 'invalid-structured-output'].includes(result.reason) ? 'Local rubric review · AI notes did not pass review checks' : 'Local rubric review · AI model unavailable';
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
    if (!question || !lastEssayEvaluation || !output || !evaluatedEssay) return;
    const run = essayRun;
    const draft = evaluatedEssay;
    const ask = q('#sk-ai-essay-ask');
    ask.disabled = true;
    output.textContent = 'Reviewing this question against the current rubric…';
    try {
      const result = await Agents.essay.followUp(question, {
        evaluation: lastEssayEvaluation,
        essay: draft.text
      });
      if (run !== essayRun) return;
      output.textContent = result.answer || 'No additional feedback was produced.';
    } catch (error) {
      if (run === essayRun) output.textContent = 'The follow-up could not run. The current rubric scores remain available above.';
    } finally {
      ask.disabled = false;
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

    window.ScholarkAIUI = { version: VERSION, open: openDialog, close: closeDialog, enhanceEssay: installEssayEnhancement, reviewEssay: () => runExpandedEssayEvaluation(q('#essay-textarea')?.value.trim() || '') };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
