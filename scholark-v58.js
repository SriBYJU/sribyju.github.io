(() => {
  'use strict';
  if (window.__scholarkV58Installed) return;
  window.__scholarkV58Installed = true;

  const VERSION = '5.8.3';
  const q = (s, r = document) => r.querySelector(s);
  const qa = (s, r = document) => [...r.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const coarsePointer = matchMedia('(pointer: coarse)');

  function addStyle(href) {
    if (q(`link[href*="${href}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }

  function ensureStyles() {
    addStyle('scholark-v58.css');
    addStyle('scholark-gapfill.css');
  }

  /* Never auto-scroll during cinematic boot. Older versions did delayed scrollTo(0,0)
     after the user had already started moving through the page, which was especially
     disruptive on iOS. Explicit navigation remains responsible for its own scroll. */
  function installScrollStability() {
    try { if ('scrollRestoration' in history) history.scrollRestoration = 'auto'; } catch {}
    document.documentElement.dataset.skScrollStable = '1';
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

  function buildFlightdeck() {
    const tools = q('.sk6-tools-section');
    if (!tools || q('.sk13-flightdeck')) return;
    const deck = document.createElement('section');
    deck.className = 'sk13-flightdeck';
    deck.setAttribute('aria-label', 'ScholarK planning journey');
    deck.innerHTML = `
      <span class="sk13-cloud c1" aria-hidden="true"></span>
      <span class="sk13-cloud c2" aria-hidden="true"></span>
      <span class="sk13-cloud c3" aria-hidden="true"></span>
      <div class="sk13-flight-inner">
        <div class="sk13-flight-copy">
          <small>One student · one route · zero paywall</small>
          <h4>From “what now?”<br>to <em>what's next.</em></h4>
          <p>ScholarK turns the space between planning and applying into an actual route: understand where you stand, sharpen what matters, compare your options, and keep moving.</p>
          <div class="sk13-flight-tags" aria-label="ScholarK journey stages">
            <span>Academic profile</span><span>College fit</span><span>Essay strength</span><span>Test readiness</span>
          </div>
        </div>
        <div class="sk13-map" aria-label="Four-stage ScholarK route">
          <div class="sk13-route" aria-hidden="true"></div>
          <div class="sk13-center" aria-hidden="true"><b>S</b><small>ScholarK route</small></div>
          <div class="sk13-stop s1"><b>01 · KNOW</b><strong>Your academic profile</strong><span>GPA · goals · progress</span></div>
          <div class="sk13-stop s2"><b>02 · EXPLORE</b><strong>Your college fit</strong><span>compare · outcomes · cost</span></div>
          <div class="sk13-stop s3"><b>03 · BUILD</b><strong>Your strongest story</strong><span>essay · activities · direction</span></div>
          <div class="sk13-stop s4"><b>04 · MOVE</b><strong>Your next milestone</strong><span>prep · plan · apply</span></div>
          <div class="sk13-campus" aria-hidden="true"></div>
        </div>
      </div>`;
    tools.insertAdjacentElement('afterend', deck);
  }

  function buildNextMoveBridge() {
    const tools = q('.sk6-tools-section');
    if (!tools || q('.sk11-next-move', tools)) return;

    const bridge = document.createElement('section');
    bridge.className = 'sk11-next-move sk11-next-move-linear';
    bridge.setAttribute('aria-label', 'Choose your next ScholarK move');
    bridge.innerHTML = `
      <div class="sk11-gridwash" aria-hidden="true"></div>
      <div class="sk11-bridge-inner">
        <div class="sk11-bridge-copy">
          <small>Your next move · interactive</small>
          <h3>Don't hit a blank.<br><em>Pick a direction.</em></h3>
          <p>Choose what you want to improve next. The scene responds, then takes you straight to the right ScholarK tool.</p>
          <div class="sk11-status" aria-live="polite">
            <span class="sk11-status-num">01</span>
            <div><strong>Build your academic profile</strong><p>Calculate GPA, model weighted coursework, and turn target grades into a concrete plan.</p></div>
            <button type="button" class="sk11-open">Open GPA tools <span aria-hidden="true">↗</span></button>
          </div>
        </div>
        <div class="sk11-route-rail" role="tablist" aria-label="Choose a goal">
          ${moves.map((m, i) => `<button type="button" class="sk11-route-node${i===0?' is-active':''}" data-move="${i}" role="tab" aria-selected="${i===0?'true':'false'}"><span>${m.num}</span><b>${m.glyph}</b><strong>${m.short}</strong><small>${m.title}</small></button>`).join('')}
          <div class="sk11-route-beam" aria-hidden="true"></div>
        </div>
      </div>`;
    tools.appendChild(bridge);

    const statusNum = q('.sk11-status-num', bridge);
    const statusTitle = q('.sk11-status strong', bridge);
    const statusCopy = q('.sk11-status p', bridge);
    const open = q('.sk11-open', bridge);
    const nodes = qa('.sk11-route-node', bridge);
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

    if (reduceMotion.matches) bridge.classList.add('is-visible');
    else {
      const io = new IntersectionObserver(entries => entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        bridge.classList.add('is-visible');
        io.disconnect();
      }), {threshold:.05});
      io.observe(bridge);
    }
  }

  function boot() {
    ensureStyles();
    installScrollStability();
    const root = q('.sk6-experience');
    if (!root) return setTimeout(boot, 45);
    if (root.dataset.sk11Ready) return;
    root.dataset.sk11Ready = '1';
    document.body.classList.add('scholark-v58');
    if (coarsePointer.matches) document.body.classList.add('scholark-touch');
    document.documentElement.dataset.scholarkUi = VERSION;
    buildNextMoveBridge();
    buildFlightdeck();
    window.ScholarkV58 = {version:VERSION, buildNextMoveBridge, buildFlightdeck};
  }

  ensureStyles();
  installScrollStability();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
