(() => {
  'use strict';
  if (window.__scholarkAIDashboardInstalled) return;
  window.__scholarkAIDashboardInstalled = true;

  const AI = window.ScholarkAI;
  const Agents = window.ScholarkAIAgents;
  if (!AI || !Agents) return;

  const q = (s, r = document) => r.querySelector(s);
  const esc = value => String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const uid = () => window.currentUser?.uid || window._gsUser?.uid || 'local';
  const VERSION = '1.0.0';

  function ensureStyles() {
    if (q('link[href*="scholark-ai-dashboard.css"]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'scholark-ai-dashboard.css';
    document.head.appendChild(link);
  }

  function trendKey() { return `mastery_trends_${uid()}`; }

  function patchMasteryTracking() {
    const mastery = Agents.mastery;
    if (!mastery?.update || mastery.update.__scholarkTrendTracking) return;
    const original = mastery.update;
    const wrapped = function(skill, evidence) {
      const before = mastery.get(skill);
      const result = original.call(this, skill, evidence);
      const history = AI.storage.read(trendKey(), []);
      const item = {
        skill: String(skill || 'Unknown'),
        before: Number(before?.score || 0),
        after: Number(result?.score || 0),
        delta: Number(result?.delta || 0),
        correct: !!evidence?.correct,
        at: Date.now(),
        source: evidence?.source || 'scholark'
      };
      AI.storage.write(trendKey(), [...(Array.isArray(history) ? history : []), item].slice(-250));
      return result;
    };
    wrapped.__scholarkTrendTracking = true;
    wrapped.__original = original;
    mastery.update = wrapped;
  }

  function activeMastery() {
    return Object.entries(Agents.mastery.all())
      .map(([skill, data]) => ({ skill, ...data }))
      .filter(row => Number(row.attempts || 0) > 0)
      .sort((a, b) => Number(a.score || 0) - Number(b.score || 0));
  }

  function plannerSnapshot() {
    return Agents.planner.current?.() || null;
  }

  function nearestUpcoming(snapshot) {
    const tasks = (snapshot?.input?.tasks || []).filter(task => !task.completed && (task.date || task.examDate || task.deadline));
    if (!tasks.length) return null;
    return tasks.map(task => ({ ...task, _date: new Date(task.date || task.examDate || task.deadline).getTime() }))
      .filter(task => Number.isFinite(task._date))
      .sort((a, b) => a._date - b._date)[0] || null;
  }

  function daysText(task) {
    if (!task) return 'No dated academic item is currently stored in the AI planner.';
    const time = task.date || task.examDate || task.deadline;
    const days = Math.max(0, Math.ceil((new Date(time).getTime() - Date.now()) / 86400000));
    const label = task.title || task.topic || task.subject || 'Upcoming item';
    return days === 0 ? `${label} is due today.` : days === 1 ? `${label} is due tomorrow.` : `${label} is in ${days} days.`;
  }

  function latestImprovement() {
    const history = AI.storage.read(trendKey(), []);
    return (Array.isArray(history) ? history : []).slice().reverse().find(item => Number(item.delta) > 0.2) || null;
  }

  function recommendationFor(row) {
    if (!row) return null;
    return Agents.mastery.recommendations().find(x => x.skill === row.skill)?.recommendation || null;
  }

  function intelligenceData() {
    const mastery = activeMastery();
    const weak = mastery[0] || null;
    const strong = mastery.slice().sort((a, b) => Number(b.score || 0) - Number(a.score || 0))[0] || null;
    const trend = latestImprovement();
    const planner = plannerSnapshot();
    const today = planner?.plan?.[0]?.blocks?.[0] || null;
    const upcoming = nearestUpcoming(planner);
    const rec = recommendationFor(weak);

    return {
      mastery,
      today: today ? {
        title: today.title || 'Study priority',
        detail: `${today.minutes || 0} min · ${today.reason || 'Highest current planner priority.'}`
      } : weak ? {
        title: `Review ${weak.skill}`,
        detail: `Current mastery: ${Math.round(weak.score || 0)}%. A short targeted set would create the clearest next signal.`
      } : {
        title: 'Build your learning profile',
        detail: 'Complete SAT or AP practice, or use the Tutor, to start personalized recommendations.'
      },
      attention: weak ? {
        title: weak.skill,
        detail: `${weak.label || 'Learning'} · ${Math.round(weak.score || 0)}% mastery across ${weak.attempts || 0} recorded attempts.`
      } : {
        title: 'No weak skill identified yet',
        detail: 'Scholark waits for actual practice evidence instead of guessing.'
      },
      improving: trend ? {
        title: trend.skill,
        detail: `Most recent evidence moved mastery ${trend.delta > 0 ? '+' : ''}${Number(trend.delta).toFixed(1)} points.`
      } : strong ? {
        title: strong.skill,
        detail: `Currently your strongest recorded skill at ${Math.round(strong.score || 0)}% mastery.`
      } : {
        title: 'No trend yet',
        detail: 'Improvement appears after repeated practice so one lucky answer is not treated as mastery.'
      },
      upcoming: {
        title: upcoming?.title || upcoming?.topic || upcoming?.subject || 'No upcoming item',
        detail: daysText(upcoming)
      },
      recommended: rec ? {
        title: rec.action.replaceAll('_', ' '),
        detail: `${rec.count} ${rec.difficulty} items · ${rec.reason}`
      } : {
        title: 'Use Ask Scholark',
        detail: 'Ask for an explanation, a study priority, or help interpreting your current progress.'
      }
    };
  }

  function card(label, value, tone = '') {
    return `<article class="sk-ai-dash-card ${tone}"><span>${esc(label)}</span><strong>${esc(value.title)}</strong><p>${esc(value.detail)}</p></article>`;
  }

  function masteryHTML(rows) {
    if (!rows.length) return '<div class="sk-ai-dash-empty">No mastery evidence yet. Scholark will populate this from real SAT/AP practice and supported AI learning flows.</div>';
    return rows.slice(0, 6).map(row => {
      const score = Math.max(0, Math.min(100, Number(row.score || 0)));
      return `<div class="sk-ai-mastery-row"><div><strong>${esc(row.skill)}</strong><span>${esc(row.label || 'Learning')}</span></div><div class="sk-ai-mastery-track" aria-label="${esc(row.skill)} ${Math.round(score)} percent mastery"><i style="--mastery:${score}"></i></div><b>${Math.round(score)}%</b></div>`;
    }).join('');
  }

  function panelHTML(data) {
    return `<section class="sk-ai-dashboard" id="sk-ai-dashboard" aria-labelledby="sk-ai-dashboard-title">
      <div class="sk-ai-dashboard-head">
        <div><span class="sk-ai-kicker">Academic intelligence</span><h2 id="sk-ai-dashboard-title">What should I do next?</h2><p>Recommendations use your Scholark activity and stay separate from existing saved-result data.</p></div>
        <button type="button" data-sk-ai-open>Ask Scholark</button>
      </div>
      <div class="sk-ai-dash-grid">
        ${card('Today', data.today, 'today')}
        ${card('Attention needed', data.attention, 'attention')}
        ${card('Improving', data.improving, 'improving')}
        ${card('Upcoming', data.upcoming, 'upcoming')}
        ${card('Recommended', data.recommended, 'recommended')}
      </div>
      <div class="sk-ai-mastery-box">
        <div class="sk-ai-mastery-head"><div><strong>Mastery map</strong><span>Built from repeated evidence, not one question.</span></div><button type="button" data-sk-planner>Open Study Planner</button></div>
        <div class="sk-ai-mastery-list">${masteryHTML(data.mastery)}</div>
      </div>
    </section>`;
  }

  function renderDashboard() {
    const content = q('#dash-content');
    const saved = q('#dash-saved-list');
    if (!content || !saved) return false;
    const old = q('#sk-ai-dashboard');
    const wrapper = document.createElement('div');
    wrapper.innerHTML = panelHTML(intelligenceData());
    const panel = wrapper.firstElementChild;
    if (old) old.replaceWith(panel); else saved.parentNode.insertBefore(panel, saved);

    q('[data-sk-ai-open]', panel)?.addEventListener('click', () => window.ScholarkAIUI?.open?.());
    q('[data-sk-planner]', panel)?.addEventListener('click', () => window.showPage?.('planner'));
    return true;
  }

  function wrapShowPage() {
    if (typeof window.showPage !== 'function' || window.showPage.__scholarkAIDashboard) return false;
    const original = window.showPage;
    const wrapped = function(name, ...args) {
      const result = original.call(this, name, ...args);
      if (name === 'dashboard') setTimeout(renderDashboard, 0);
      return result;
    };
    wrapped.__scholarkAIDashboard = true;
    wrapped.__original = original;
    window.showPage = wrapped;
    return true;
  }

  function installFocusTrap() {
    document.addEventListener('keydown', event => {
      const overlay = q('#sk-ai-dialog');
      if (!overlay || overlay.hidden || event.key !== 'Tab') return;
      const items = [...overlay.querySelectorAll('button:not([disabled]):not([hidden]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')]
        .filter(el => !el.hidden && el.getClientRects().length);
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
  }

  function boot() {
    ensureStyles();
    patchMasteryTracking();
    wrapShowPage();
    installFocusTrap();
    renderDashboard();
    document.addEventListener('scholark:mastery-updated', renderDashboard);
    setTimeout(wrapShowPage, 250);
    setTimeout(renderDashboard, 800);
    window.ScholarkAIDashboard = { version: VERSION, render: renderDashboard, data: intelligenceData };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
