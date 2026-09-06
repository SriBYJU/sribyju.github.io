(() => {
  'use strict';
  if (window.__scholarkV58Installed) return;
  window.__scholarkV58Installed = true;

  const VERSION = '5.8.1';
  const q = (s, r = document) => r.querySelector(s);
  const qa = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const coarsePointer = matchMedia('(pointer: coarse)');

  function ensureStyles() {
    if (q('link[href*="scholark-v58.css"]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'scholark-v58.css';
    document.head.appendChild(link);
  }

  const canResetTop = () => !location.hash || location.hash === '#home';
  const resetTop = (force = false) => {
    if (!force && !canResetTop()) return;
    try { window.scrollTo(0, 0); } catch {}
    const scroller = document.scrollingElement || document.documentElement;
    if (scroller) scroller.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  };

  function installInitialTopReset() {
    try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch {}
    resetTop();
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => resetTop(), {once:true});
    addEventListener('load', () => {
      resetTop();
      requestAnimationFrame(() => {
        resetTop();
        requestAnimationFrame(() => resetTop());
      });
      setTimeout(() => resetTop(), 120);
      setTimeout(() => resetTop(), 420);
    }, {once:true});
    addEventListener('pageshow', () => resetTop(), {once:true});
  }

  function wrapHomeRouting() {
    const original = window.showPage;
    if (typeof original !== 'function' || original.__scholarkV58Wrapped) return false;
    function wrappedShowPage(page, ...args) {
      const result = original.call(this, page, ...args);
      if (page === 'home') {
        requestAnimationFrame(() => {
          resetTop(true);
          requestAnimationFrame(() => resetTop(true));
        });
      }
      return result;
    }
    wrappedShowPage.__scholarkV58Wrapped = true;
    wrappedShowPage.__scholarkV58Original = original;
    window.showPage = wrappedShowPage;
    return true;
  }

  function route(page, tab) {
    if (!page) return;
    if (window.ScholarkV5?.go) return window.ScholarkV5.go(page, tab);
    if (typeof window.showPage === 'function') window.showPage(page);
    if (tab) queueMicrotask(() => window.switchTab?.(tab));
  }

  const moves = [
    {num:'01', short:'Academic profile', title:'Build your academic profile', copy:'Calculate GPA, model weighted coursework, and turn target grades into a concrete plan.', cta:'Open GPA tools', page:'tools', tab:'gpa', glyph:'↗'},
    {num:'02', short:'College fit', title:'Find colleges that actually fit', copy:'Move from a giant list to useful comparisons across outcomes, cost, selectivity, and your priorities.', cta:'Explore colleges', page:'intelligence', glyph:'⌂'},
    {num:'03', short:'Essay strength', title:'Make the essay sharper', copy:'Use private, on-device feedback to find weak spots, revise with purpose, and keep your own voice.', cta:'Open Essay Coach', page:'essay', glyph:'✎'},
    {num:'04', short:'Test readiness', title:'Turn prep into progress', copy:'Jump into diagnostics, targeted practice, mastery plans, and full SAT/ACT simulations.', cta:'Start test prep', page:'prep', glyph:'◎'}
  ];

  function buildNextMoveBridge() {
    const tools = q('.sk6-tools-section');
    if (!tools || q('.sk11-next-move', tools)) return;
    const bridge = document.createElement('section');
    bridge.className = 'sk11-next-move';
    bridge.setAttribute('aria-label', 'Choose your next Scholark move');
    bridge.innerHTML = `
      <div class="sk11-gridwash" aria-hidden="true"></div>
      <div class="sk11-bridge-inner">
        <div class="sk11-bridge-copy">
          <small>Your next move · interactive</small>
          <h3>Don't hit a blank.<br><em>Pick a direction.</em></h3>
          <p>Choose what you want to improve next. The whole scene responds, then takes you straight to the right Scholark tool.</p>
          <div class="sk11-status" aria-live="polite">
            <span class="sk11-status-num">01</span>
            <div><strong>Build your academic profile</strong><p>Calculate GPA, model weighted coursework, and turn target grades into a concrete plan.</p></div>
            <button type="button" class="sk11-open">Open GPA tools <span aria-hidden="true">↗</span></button>
          </div>
        </div>
        <div class="sk11-orbit-shell" role="tablist" aria-label="Choose a goal">
          <div class="sk11-orbit-lines" aria-hidden="true"><i></i><i></i><i></i></div>
          <div class="sk11-core" aria-hidden="true"><span>S</span><small>Choose<br>your path</small></div>
          ${moves.map((m, i) => `<button type="button" class="sk11-move-node n${i}${i===0?' is-active':''}" data-move="${i}" role="tab" aria-selected="${i===0?'true':'false'}"><b>${m.num}</b><span>${m.glyph}</span><strong>${m.short}</strong></button>`).join('')}
          <span class="sk11-orbit-dot d1" aria-hidden="true"></span><span class="sk11-orbit-dot d2" aria-hidden="true"></span><span class="sk11-orbit-dot d3" aria-hidden="true"></span>
        </div>
      </div>`;
    tools.appendChild(bridge);

    const statusNum = q('.sk11-status-num', bridge);
    const statusTitle = q('.sk11-status strong', bridge);
    const statusCopy = q('.sk11-status p', bridge);
    const open = q('.sk11-open', bridge);
    const nodes = qa('.sk11-move-node', bridge);
    let active = 0;

    const select = (index, focus = false) => {
      active = (index + moves.length) % moves.length;
      const move = moves[active];
      nodes.forEach((node, i) => {
        const on = i === active;
        node.classList.toggle('is-active', on);
        node.setAttribute('aria-selected', on ? 'true' : 'false');
        node.tabIndex = on ? 0 : -1;
      });
      bridge.style.setProperty('--sk11-active', active);
      statusNum.textContent = move.num;
      statusTitle.textContent = move.title;
      statusCopy.textContent = move.copy;
      open.firstChild.nodeValue = move.cta + ' ';
      open.dataset.page = move.page;
      open.dataset.tab = move.tab || '';
      if (focus) nodes[active].focus();
    };

    nodes.forEach((node, i) => {
      node.addEventListener('click', () => select(i));
      node.addEventListener('keydown', event => {
        if (!['ArrowRight','ArrowDown','ArrowLeft','ArrowUp','Home','End'].includes(event.key)) return;
        event.preventDefault();
        if (event.key === 'Home') return select(0, true);
        if (event.key === 'End') return select(moves.length - 1, true);
        select(active + (event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1), true);
      });
    });
    open.addEventListener('click', () => route(open.dataset.page, open.dataset.tab || undefined));
    select(0);

    if (!reduceMotion.matches && !coarsePointer.matches) {
      bridge.addEventListener('pointermove', event => {
        const r = bridge.getBoundingClientRect();
        const x = clamp((event.clientX-r.left)/Math.max(1,r.width));
        const y = clamp((event.clientY-r.top)/Math.max(1,r.height));
        bridge.style.setProperty('--sk11-mx', ((x-.5)*2).toFixed(3));
        bridge.style.setProperty('--sk11-my', ((y-.5)*2).toFixed(3));
      }, {passive:true});
      bridge.addEventListener('pointerleave', () => {
        bridge.style.setProperty('--sk11-mx','0');
        bridge.style.setProperty('--sk11-my','0');
      }, {passive:true});
    }

    if (reduceMotion.matches) bridge.classList.add('is-visible');
    else {
      const io = new IntersectionObserver(entries => entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        bridge.classList.add('is-visible');
        io.disconnect();
      }), {threshold:.16});
      io.observe(bridge);
    }
  }

  function boot() {
    ensureStyles();
    const root = q('.sk6-experience');
    if (!root) return setTimeout(boot, 45);
    if (root.dataset.sk11Ready) return;
    root.dataset.sk11Ready = '1';
    document.body.classList.add('scholark-v58');
    document.documentElement.dataset.scholarkUi = VERSION;

    if (!wrapHomeRouting()) {
      let tries = 0;
      const waitForRouter = setInterval(() => {
        if (wrapHomeRouting() || tries++ > 80) clearInterval(waitForRouter);
      }, 50);
    }

    buildNextMoveBridge();
    requestAnimationFrame(() => requestAnimationFrame(() => resetTop()));
    setTimeout(() => resetTop(), 260);

    window.ScholarkV58 = {version:VERSION, resetTop, buildNextMoveBridge};
  }

  ensureStyles();
  installInitialTopReset();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
