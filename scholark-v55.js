(() => {
  'use strict';
  if (window.__scholarkV55Installed) return;
  window.__scholarkV55Installed = true;

  const VERSION = '5.5.0';
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const coarsePointer = matchMedia('(pointer: coarse)');
  const q = (s, r = document) => r.querySelector(s);
  const qa = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smoothstep = t => { t = clamp(t); return t * t * (3 - 2 * t); };
  const sectionProgress = el => {
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    return smoothstep((innerHeight - r.top) / Math.max(1, innerHeight + r.height));
  };

  const TOOL_ROUTES = [
    ['tools','gpa'],['tools','weighted'],['tools','chances'],['essay'],['goals'],['prep'],
    ['ap'],['compare'],['intelligence'],['careers'],['quiz'],['counselor']
  ];
  const STAGES = [
    { label:'PLAN', at:.075 }, { label:'PREPARE', at:.33 }, { label:'IMPROVE', at:.56 }, { label:'ACHIEVE', at:.86 }
  ];

  function ensureStyles() {
    if (q('link[href*="scholark-v55.css"]')) return;
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'scholark-v55.css';
    document.head.appendChild(l);
  }

  function addHeroNetwork(sticky) {
    if (!sticky || q('.sk8-hero-network', sticky)) return;
    const net = document.createElement('div');
    net.className = 'sk8-hero-network';
    net.setAttribute('aria-hidden', 'true');
    net.innerHTML = `<svg viewBox="0 0 100 100" preserveAspectRatio="none">
      <g class="sk8-network-lines">
        <path d="M50 50L13 29"/><path d="M50 50L87 32"/><path d="M50 50L16 75"/><path d="M50 50L84 78"/><path d="M50 50L68 18"/>
      </g>
      <g class="sk8-network-nodes">
        <circle cx="13" cy="29" r=".55"/><circle cx="87" cy="32" r=".55"/><circle cx="16" cy="75" r=".55"/><circle cx="84" cy="78" r=".55"/><circle cx="68" cy="18" r=".55"/>
      </g>
    </svg>`;
    sticky.appendChild(net);
  }

  function addCampusDepth(journey) {
    const ghost = q('.sk7-campus-ghost', journey);
    if (!journey || !ghost || q('.sk8-campus-depth', journey)) return;
    const depth = document.createElement('div');
    depth.className = 'sk8-campus-depth';
    depth.setAttribute('aria-hidden', 'true');
    const clone = q('.sk7-campus-svg', ghost)?.cloneNode(true);
    if (clone) {
      clone.classList.add('sk8-campus-depth-svg');
      depth.appendChild(clone);
      journey.insertBefore(depth, ghost);
    }
  }

  function addCampusLights(host, count = 16, variant = '') {
    if (!host || q(`.sk8-campus-lights${variant ? '.' + variant : ''}`, host)) return;
    const lights = document.createElement('div');
    lights.className = `sk8-campus-lights ${variant}`.trim();
    lights.setAttribute('aria-hidden', 'true');
    lights.innerHTML = Array.from({ length: count }, (_, i) => {
      const col = i % 6, row = Math.floor(i / 6);
      const x = 25 + col * 9.7 + (row % 2) * 2.2;
      const y = 48 + row * 10.8 + (i % 3) * 1.4;
      const start = .18 + (i % 8) * .045;
      return `<i style="--lx:${x}%;--ly:${y}%;--ls:${start.toFixed(3)}"></i>`;
    }).join('');
    host.appendChild(lights);
  }

  function addJourneyBeacon(journey) {
    const thread = q('.sk7-journey-thread', journey);
    const svg = q('svg', thread);
    const path = q('path', svg);
    if (!thread || !svg || !path || q('.sk8-journey-beacon', svg)) return null;
    const ns = 'http://www.w3.org/2000/svg';
    const g = document.createElementNS(ns, 'g');
    g.setAttribute('class', 'sk8-journey-beacon');
    g.setAttribute('aria-hidden', 'true');
    const halo = document.createElementNS(ns, 'circle');
    halo.setAttribute('r', '10');
    halo.setAttribute('class', 'sk8-beacon-halo');
    const core = document.createElementNS(ns, 'circle');
    core.setAttribute('r', '4.5');
    core.setAttribute('class', 'sk8-beacon-core');
    const star = document.createElementNS(ns, 'path');
    star.setAttribute('d', 'M0-8 2.2-2.2 8 0 2.2 2.2 0 8 -2.2 2.2 -8 0 -2.2-2.2Z');
    star.setAttribute('class', 'sk8-beacon-star');
    g.append(halo, core, star);
    svg.appendChild(g);
    let length = 0;
    try { length = path.getTotalLength(); } catch {}
    return { path, beacon:g, length };
  }

  function addFinalMark(final) {
    if (!final || q('.sk8-final-mark', final)) return;
    const mark = document.createElement('div');
    mark.className = 'sk8-final-mark';
    mark.setAttribute('aria-hidden', 'true');
    mark.innerHTML = `<span class="sk8-final-ring a"></span><span class="sk8-final-ring b"></span>
      <svg viewBox="0 0 100 100"><path d="M20 23C31 13 54 12 73 20L80 23 72 38 65 35C51 30 36 31 32 37c-3 5 1 8 9 10l24 7c16 5 21 15 16 25-7 14-31 21-56 13L14 88l8-16 11 4c14 5 28 3 32-4 2-4-2-7-9-9L32 56C13 51 9 32 20 23Z" fill="currentColor"/><path d="M75 14l3.2 7.2L86 24.5l-7.8 3.2L75 35l-3.2-7.3-7.8-3.2 7.8-3.3L75 14Z" fill="currentColor"/></svg>`;
    final.prepend(mark);
  }

  function addToolSignals(root) {
    qa('.sk6-tool-card,.sk6-path-card', root).forEach((card, i) => {
      if (q('.sk8-card-signal', card)) return;
      const signal = document.createElement('span');
      signal.className = 'sk8-card-signal';
      signal.setAttribute('aria-hidden', 'true');
      signal.innerHTML = '<i></i><i></i><i></i><b></b>';
      card.appendChild(signal);
      card.style.setProperty('--sk8-card-index', String(i));
    });
  }

  function routeFor(card) {
    if (card.classList.contains('sk6-tool-card')) {
      const route = TOOL_ROUTES[Number(card.dataset.tool)];
      return route ? { page:route[0], tab:route[1] } : null;
    }
    if (card.classList.contains('sk6-path-card')) {
      return card.dataset.route ? { page:card.dataset.route, tab:card.dataset.tab || undefined } : null;
    }
    return null;
  }

  function sharedTransition(card, route) {
    if (reduceMotion.matches || coarsePointer.matches || !route || !window.ScholarkV5?.go) {
      window.ScholarkV5?.go?.(route?.page, route?.tab);
      return;
    }
    const r = card.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return window.ScholarkV5.go(route.page, route.tab);
    const cs = getComputedStyle(card);
    const ghost = document.createElement('div');
    ghost.className = 'sk8-shared-ghost';
    ghost.style.setProperty('--gx', `${r.left}px`);
    ghost.style.setProperty('--gy', `${r.top}px`);
    ghost.style.setProperty('--gsx', (r.width / innerWidth).toFixed(5));
    ghost.style.setProperty('--gsy', (r.height / innerHeight).toFixed(5));
    ghost.style.setProperty('--ghost-bg', cs.background || cs.backgroundColor);
    ghost.style.setProperty('--ghost-color', cs.color);
    const title = q('h3', card)?.textContent?.trim() || 'Scholark';
    const iconNode = q('.sk6-icon', card)?.cloneNode(true);
    ghost.innerHTML = `<div class="sk8-shared-inner"><span class="sk8-shared-kicker">Opening Scholark</span><strong></strong><span class="sk8-shared-line"></span></div>`;
    q('strong', ghost).textContent = title;
    if (iconNode) q('.sk8-shared-inner', ghost).prepend(iconNode);
    document.body.appendChild(ghost);
    document.documentElement.classList.add('sk8-shared-transition');
    requestAnimationFrame(() => ghost.classList.add('go'));
    setTimeout(() => {
      window.ScholarkV5.go(route.page, route.tab);
      ghost.classList.add('finish');
    }, 205);
    setTimeout(() => {
      ghost.remove();
      document.documentElement.classList.remove('sk8-shared-transition');
    }, 620);
  }

  function installSharedTransitions(root) {
    root.addEventListener('click', e => {
      const card = e.target.closest?.('.sk6-tool-card,.sk6-path-card');
      if (!card || !root.contains(card) || e.defaultPrevented) return;
      const route = routeFor(card);
      if (!route || !window.ScholarkV5?.go) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      sharedTransition(card, route);
    }, true);
  }

  function installStageNavigator(story, sticky) {
    const index = q('.sk6-stage-index', sticky);
    if (!story || !index || index.dataset.sk8Ready) return [];
    index.dataset.sk8Ready = '1';
    const old = qa('span', index);
    const buttons = STAGES.map((stage, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sk8-stage-btn';
      btn.dataset.stage = String(i);
      btn.innerHTML = `<i></i><span>${stage.label}</span>`;
      btn.setAttribute('aria-label', `Jump to ${stage.label.toLowerCase()} scene`);
      btn.addEventListener('click', () => {
        const top = story.getBoundingClientRect().top + scrollY;
        const max = Math.max(1, story.offsetHeight - innerHeight);
        scrollTo({ top: top + max * stage.at, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      });
      return btn;
    });
    old.forEach(el => el.remove());
    buttons.forEach(btn => index.appendChild(btn));
    return buttons;
  }

  let root, story, sticky, journey, fit, tools, final;
  let stageButtons = [], beaconState = null;
  let raf = 0, lastY = scrollY, lastTs = performance.now(), wind = 0;

  function heroProgress() {
    if (!story) return 0;
    const r = story.getBoundingClientRect();
    return clamp(-r.top / Math.max(1, story.offsetHeight - innerHeight));
  }

  function updateStage(p) {
    let active = 0;
    if (p >= .72) active = 3;
    else if (p >= .49) active = 2;
    else if (p >= .25) active = 1;
    stageButtons.forEach((btn, i) => {
      const on = i === active;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-current', on ? 'step' : 'false');
    });
  }

  function updateBeacon(progress) {
    if (!beaconState?.length) return;
    let point;
    try { point = beaconState.path.getPointAtLength(beaconState.length * clamp(progress)); } catch { return; }
    beaconState.beacon.setAttribute('transform', `translate(${point.x.toFixed(2)} ${point.y.toFixed(2)})`);
    beaconState.beacon.style.opacity = String(clamp(progress * 2.2));
  }

  function apply(ts = performance.now()) {
    raf = 0;
    if (!root) return;
    const dt = Math.min(.08, Math.max(.008, (ts - lastTs) / 1000));
    const y = scrollY;
    const velocity = clamp((y - lastY) / Math.max(1, dt * 1100), -1, 1);
    wind = lerp(wind, velocity, Math.abs(velocity) > .02 ? .32 : .12);
    if (Math.abs(velocity) < .01) wind = lerp(wind, 0, .18);
    const speed = clamp(Math.abs(wind));
    const hp = heroProgress();
    const jp = sectionProgress(journey);
    const fp = sectionProgress(fit);
    const tp = sectionProgress(tools);
    const lp = sectionProgress(final);

    root.style.setProperty('--sk8-wind', wind.toFixed(4));
    root.style.setProperty('--sk8-speed', speed.toFixed(4));
    root.style.setProperty('--sk8-hero-p', hp.toFixed(4));
    journey?.style.setProperty('--sk8-p', jp.toFixed(4));
    fit?.style.setProperty('--sk8-p', fp.toFixed(4));
    tools?.style.setProperty('--sk8-p', tp.toFixed(4));
    final?.style.setProperty('--sk8-p', lp.toFixed(4));
    updateStage(hp);
    updateBeacon(jp);

    lastY = y;
    lastTs = ts;
    if (Math.abs(wind) > .006) request();
  }

  function request() { if (!raf) raf = requestAnimationFrame(apply); }

  function boot() {
    ensureStyles();
    root = q('.sk6-experience');
    if (!root) return setTimeout(boot, 40);
    if (root.dataset.sk8Ready) return;
    root.dataset.sk8Ready = '1';
    document.documentElement.dataset.scholarkUi = VERSION;
    document.body.classList.add('scholark-v55');

    story = q('.sk6-story', root);
    sticky = q('.sk6-sticky', root);
    journey = q('.sk6-journey-section', root);
    fit = q('.sk6-fit-scene', root);
    tools = q('.sk6-tools-section', root);
    final = q('.sk6-final', root);

    addHeroNetwork(sticky);
    addCampusDepth(journey);
    addCampusLights(q('.sk7-campus-ghost', journey), 18, 'journey-lights');
    addCampusLights(q('.sk6-fit-bg', fit), 14, 'fit-lights');
    beaconState = addJourneyBeacon(journey);
    addFinalMark(final);
    addToolSignals(root);
    stageButtons = installStageNavigator(story, sticky);
    installSharedTransitions(root);

    addEventListener('scroll', request, { passive:true });
    addEventListener('resize', request, { passive:true });
    addEventListener('orientationchange', () => setTimeout(request, 100), { passive:true });
    reduceMotion.addEventListener?.('change', request);
    request();
    window.ScholarkV55 = { version:VERSION, refresh:request };
  }

  ensureStyles();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();
