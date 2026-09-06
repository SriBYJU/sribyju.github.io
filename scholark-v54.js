(() => {
  'use strict';
  if (window.__scholarkV54Installed) return;
  window.__scholarkV54Installed = true;

  const VERSION = '5.4.0';
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

  function ensureStyles() {
    if (!q('link[href*="scholark-v54.css"]')) {
      const l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = 'scholark-v54.css';
      document.head.appendChild(l);
    }
  }

  const ambientCloud = (cls, x, y, s, speed, drift, depth) => `
    <span class="sk7-cloud ${cls}" style="--cx:${x}%;--cy:${y}%;--cs:${s};--speed:${speed}s;--drift:${drift}px;--depth:${depth}px" aria-hidden="true">
      <i></i><b></b><em></em>
    </span>`;

  function makeAtmosphere(section, type, clouds) {
    if (!section || q(`.sk7-atmosphere[data-scene="${type}"]`, section)) return null;
    const layer = document.createElement('div');
    layer.className = 'sk7-atmosphere';
    layer.dataset.scene = type;
    layer.setAttribute('aria-hidden', 'true');
    layer.innerHTML = clouds.join('');
    section.prepend(layer);
    return layer;
  }

  function cloneCampusInto(section) {
    if (!section || q('.sk7-campus-ghost', section)) return;
    const source = q('.sk6-campus');
    if (!source) return;
    const ghost = document.createElement('div');
    ghost.className = 'sk7-campus-ghost';
    const clone = source.cloneNode(true);
    clone.classList.add('sk7-campus-svg');
    qa('path,circle', clone).forEach(node => node.setAttribute('pathLength', '1'));
    ghost.appendChild(clone);
    section.prepend(ghost);
  }

  function addJourneyPath(section) {
    if (!section || q('.sk7-journey-thread', section)) return;
    const path = document.createElement('div');
    path.className = 'sk7-journey-thread';
    path.setAttribute('aria-hidden', 'true');
    path.innerHTML = `<svg viewBox="0 0 1200 260" preserveAspectRatio="none"><path d="M30 190 C180 20 300 230 465 112 S735 44 875 142 S1040 230 1170 68" pathLength="1"/><circle cx="190" cy="79" r="5"/><circle cx="462" cy="114" r="5"/><circle cx="870" cy="141" r="5"/><circle cx="1100" cy="92" r="5"/></svg>`;
    section.appendChild(path);
  }

  function addToolsConstellation(section) {
    if (!section || q('.sk7-constellation', section)) return;
    const c = document.createElement('div');
    c.className = 'sk7-constellation';
    c.setAttribute('aria-hidden', 'true');
    c.innerHTML = `<i class="n1"></i><i class="n2"></i><i class="n3"></i><i class="n4"></i><i class="n5"></i><i class="n6"></i><b class="r1"></b><b class="r2"></b>`;
    section.prepend(c);
  }

  function addFitAtmosphere(fit) {
    if (!fit || q('.sk7-fit-veil', fit)) return;
    const veil = document.createElement('div');
    veil.className = 'sk7-fit-veil';
    veil.setAttribute('aria-hidden', 'true');
    veil.innerHTML = `<span class="sk7-fit-sweep"></span><span class="sk7-fit-orbit o1"></span><span class="sk7-fit-orbit o2"></span>`;
    fit.appendChild(veil);
  }

  function addHeroDepth() {
    const sticky = q('.sk6-sticky');
    if (!sticky || q('.sk7-hero-depth', sticky)) return;
    const depth = document.createElement('div');
    depth.className = 'sk7-hero-depth';
    depth.setAttribute('aria-hidden', 'true');
    depth.innerHTML = `
      <span class="sk7-cross-cloud far"><i></i><b></b><em></em></span>
      <span class="sk7-cross-cloud near"><i></i><b></b><em></em></span>
      <span class="sk7-lens-orbit a"></span><span class="sk7-lens-orbit b"></span>`;
    sticky.appendChild(depth);
  }

  function addCursorLight(root) {
    if (!root || q('.sk7-cursor-light', root)) return;
    const light = document.createElement('div');
    light.className = 'sk7-cursor-light';
    light.setAttribute('aria-hidden', 'true');
    root.appendChild(light);
  }

  function animateStats() {
    const panel = q('.sk6-proof-panel');
    if (!panel || panel.dataset.sk7Counted) return;
    const items = [...panel.querySelectorAll('strong')];
    const targets = [10000, 23, 3480, 7444, 50, 47];
    if (items.length < targets.length) return;
    const io = new IntersectionObserver(entries => {
      if (!entries.some(e => e.isIntersecting)) return;
      io.disconnect();
      panel.dataset.sk7Counted = '1';
      if (reduceMotion.matches) return;
      const start = performance.now();
      const duration = 900;
      const tick = now => {
        const t = clamp((now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        targets.forEach((target, i) => {
          const value = Math.round(target * eased);
          items[i].textContent = i === 0 ? `${Math.round(value / 1000)}K+` : value.toLocaleString();
        });
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: .35 });
    io.observe(panel);
  }

  let root, journey, fit, tools, final, sticky;
  let raf = 0, px = .5, py = .5, spx = .5, spy = .5;

  function apply() {
    raf = 0;
    if (!root) return;
    const jp = sectionProgress(journey);
    const fp = sectionProgress(fit);
    const tp = sectionProgress(tools);
    const lp = sectionProgress(final);
    spx = lerp(spx, px, .09);
    spy = lerp(spy, py, .09);
    root.style.setProperty('--sk7-px', ((spx - .5) * 2).toFixed(3));
    root.style.setProperty('--sk7-py', ((spy - .5) * 2).toFixed(3));
    journey?.style.setProperty('--sk7-p', jp.toFixed(4));
    fit?.style.setProperty('--sk7-p', fp.toFixed(4));
    tools?.style.setProperty('--sk7-p', tp.toFixed(4));
    final?.style.setProperty('--sk7-p', lp.toFixed(4));
    if (sticky) sticky.style.setProperty('--sk7-hero-p', (window.ScholarkV5?.refresh ? 1 : 0).toString());
  }

  function request() { if (!raf) raf = requestAnimationFrame(apply); }

  function installPointer() {
    if (reduceMotion.matches || coarsePointer.matches) return;
    addEventListener('pointermove', e => {
      px = e.clientX / innerWidth;
      py = e.clientY / innerHeight;
      root.style.setProperty('--sk7-cursor-x', `${e.clientX}px`);
      root.style.setProperty('--sk7-cursor-y', `${e.clientY}px`);
      request();
    }, { passive: true });
  }

  function installCardDepth() {
    if (reduceMotion.matches || coarsePointer.matches) return;
    qa('.sk6-tool-card,.sk6-path-card').forEach(card => {
      card.addEventListener('pointerenter', () => card.classList.add('sk7-live'));
      card.addEventListener('pointerleave', () => card.classList.remove('sk7-live'));
    });
  }

  function boot() {
    ensureStyles();
    root = q('.sk6-experience');
    if (!root) return setTimeout(boot, 40);
    if (root.dataset.sk7Ready) return;
    root.dataset.sk7Ready = '1';
    document.documentElement.dataset.scholarkUi = VERSION;
    document.body.classList.add('scholark-v54');

    sticky = q('.sk6-sticky', root);
    journey = q('.sk6-journey-section', root);
    fit = q('.sk6-fit-scene', root);
    tools = q('.sk6-tools-section', root);
    final = q('.sk6-final', root);

    addHeroDepth();
    cloneCampusInto(journey);
    addJourneyPath(journey);
    addToolsConstellation(tools);
    addFitAtmosphere(fit);
    addCursorLight(root);

    makeAtmosphere(journey, 'journey', [
      ambientCloud('c1', 8, 18, 1.15, 26, 90, -60), ambientCloud('c2', 82, 12, .82, 31, -75, -120),
      ambientCloud('c3', 66, 72, 1.35, 38, 105, -20), ambientCloud('c4', 23, 82, .72, 34, -62, -90)
    ]);
    makeAtmosphere(tools, 'tools', [
      ambientCloud('c1', 10, 14, .95, 33, 80, -80), ambientCloud('c2', 87, 22, 1.2, 42, -110, -30),
      ambientCloud('c3', 58, 64, .72, 28, 70, -130), ambientCloud('c4', 26, 76, 1.28, 46, -95, -20),
      ambientCloud('c5', 76, 88, .66, 36, 52, -100)
    ]);
    makeAtmosphere(final, 'final', [
      ambientCloud('c1', 15, 25, 1.0, 36, 70, -70), ambientCloud('c2', 81, 18, .78, 42, -58, -100),
      ambientCloud('c3', 70, 78, 1.25, 48, 84, -40)
    ]);

    animateStats();
    installPointer();
    installCardDepth();
    addEventListener('scroll', request, { passive: true });
    addEventListener('resize', request, { passive: true });
    reduceMotion.addEventListener?.('change', request);
    request();
    window.ScholarkV54 = { version: VERSION, refresh: request };
  }

  ensureStyles();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
