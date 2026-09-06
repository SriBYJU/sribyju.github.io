(() => {
  'use strict';
  if (window.__scholarkV57Installed) return;
  window.__scholarkV57Installed = true;

  const VERSION = '5.7.0';
  const q = (s, r = document) => r.querySelector(s);
  const qa = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const coarsePointer = matchMedia('(pointer: coarse)');

  function ensureStyles() {
    if (q('link[href*="scholark-v57.css"]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'scholark-v57.css';
    document.head.appendChild(link);
  }

  function go(page, tab) {
    if (!page) return false;
    const pageEl = q('#page-' + page);
    if (!pageEl || typeof window.showPage !== 'function') {
      console.warn('[Scholark V5.7] route unavailable:', page);
      return false;
    }
    const result = window.showPage(page);
    queueMicrotask(() => {
      try {
        if (page === 'prep') window.ScholarkPrep?.init?.();
        if (page === 'ap') window.initAPHub?.();
        if (page === 'counselor') window.initCounselor?.();
        if (tab) window.switchTab?.(tab);
      } catch (error) {
        console.warn('[Scholark V5.7] route enhancer failed:', error);
      }
    });
    return result !== false;
  }

  function installFeatureRouting() {
    const selector = '#nav-features,#nav-features-cta,.nav-features-cta,[data-features]';
    document.addEventListener('click', event => {
      const trigger = event.target.closest?.(selector);
      if (!trigger) return;
      event.preventDefault();
      event.stopPropagation();
      go('features');
    }, true);

    const harden = () => {
      qa(selector).forEach(btn => {
        btn.style.pointerEvents = 'auto';
        btn.removeAttribute('aria-disabled');
        if (btn.tagName === 'BUTTON' && !btn.type) btn.type = 'button';
      });
    };
    harden();
    new MutationObserver(harden).observe(document.body, {subtree:true, childList:true});
  }

  const closingCampus = `
    <svg class="sk10-campus-svg" viewBox="0 0 900 420" aria-hidden="true">
      <g fill="none" stroke="currentColor" stroke-width="1.35" vector-effect="non-scaling-stroke">
        <path d="M40 370h820M112 370V236h676v134M160 236v-42h580v42M226 194v-44h448v44M340 150V86h220v64M430 86V28h40v58M408 28h84M450 5v23"/>
        <path d="M132 270h636M132 308h636M132 344h636" opacity=".48"/>
        <path d="M180 236v134M245 236v134M310 236v134M375 236v134M440 236v134M505 236v134M570 236v134M635 236v134M700 236v134" opacity=".38"/>
        <circle cx="450" cy="121" r="28"/><path d="M450 103v20l13 8"/>
      </g>
    </svg>`;

  const closeCard = (icon, title, copy, route, tab = '') => `
    <button type="button" class="sk10-close-card" data-close-route="${route}"${tab ? ` data-close-tab="${tab}"` : ''}>
      <span class="sk10-close-icon" aria-hidden="true">${icon}</span>
      <span><strong>${title}</strong><small>${copy}</small></span>
      <b aria-hidden="true">↗</b>
    </button>`;

  function buildClosingScene() {
    const final = q('.sk6-final');
    const finalInner = q('.sk6-final-inner', final);
    if (!final || !finalInner || q('.sk10-closing-stage', final)) return;

    final.classList.add('sk10-final-upgraded');
    final.setAttribute('aria-label', 'Scholark closing campus scene');

    const stage = document.createElement('div');
    stage.className = 'sk10-closing-stage';
    stage.innerHTML = `
      <div class="sk10-closing-sky" aria-hidden="true">
        <span class="sk10-close-sun"></span>
        <span class="sk10-close-cloud c1"><i></i><b></b></span>
        <span class="sk10-close-cloud c2"><i></i><b></b></span>
        <span class="sk10-close-cloud c3"><i></i><b></b></span>
        <div class="sk10-campus-back">${closingCampus}</div>
        <div class="sk10-campus-lights">${Array.from({length:24},(_,i)=>`<i style="--i:${i};--x:${24+(i%8)*7.6}%;--y:${55+Math.floor(i/8)*10.2}%"></i>`).join('')}</div>
        <span class="sk10-close-tree left"></span><span class="sk10-close-tree right"></span>
      </div>

      <div class="sk10-closing-content">
        <div class="sk10-closing-copy sk10-close-reveal">
          <small>A brighter tomorrow starts with a plan</small>
          <h3>Turn ambition into<br><em>a clear next step.</em></h3>
          <p>Plan academics, research colleges, strengthen essays, and prepare for exams without leaving the Scholark system.</p>
        </div>
        <div class="sk10-close-grid sk10-close-reveal">
          ${closeCard('▥','Track your GPA','See progress and plan ahead.','tools','gpa')}
          ${closeCard('⌂','Plan admissions','Research, compare, decide.','intelligence')}
          ${closeCard('✎','Get essay support','Draft, review, refine.','essay')}
          ${closeCard('↗','Prepare for exams','Practice with structure.','prep')}
        </div>
        <div class="sk10-close-desk" aria-hidden="true">
          <div class="sk10-books">
            <span>HIGHER GRADES</span><span>BIGGER DREAMS</span><span>BRIGHTER FUTURES</span><span>SCHOLARK ✦</span>
          </div>
          <div class="sk10-laptop"><span>S</span></div>
          <div class="sk10-mug">A<br>Brighter<br>You<br>Ahead</div>
        </div>
        <div class="sk10-brand-lockup sk10-close-reveal">
          <img src="scholark-mark.svg" alt="" aria-hidden="true">
          <div><strong>Scholark</strong><span>Free Student-Built College Planning Platform</span></div>
        </div>
      </div>`;

    final.insertBefore(stage, finalInner);
    qa('[data-close-route]', stage).forEach(btn => btn.addEventListener('click', () => go(btn.dataset.closeRoute, btn.dataset.closeTab || undefined)));
    installClosingMotion(final, stage);
  }

  function installClosingMotion(final, stage) {
    const revealEls = qa('.sk10-close-reveal', stage);
    if (reduceMotion.matches) revealEls.forEach(el => el.classList.add('is-visible'));
    else {
      const io = new IntersectionObserver(entries => entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }), {threshold:.18, rootMargin:'0px 0px -8%'});
      revealEls.forEach(el => io.observe(el));
    }

    let raf = 0;
    const apply = () => {
      raf = 0;
      const r = final.getBoundingClientRect();
      const p = clamp((innerHeight - r.top) / Math.max(1, innerHeight + r.height));
      final.style.setProperty('--sk10-final-p', p.toFixed(4));
    };
    const request = () => { if (!raf) raf = requestAnimationFrame(apply); };
    addEventListener('scroll', request, {passive:true});
    addEventListener('resize', request, {passive:true});
    apply();

    if (!reduceMotion.matches && !coarsePointer.matches) {
      stage.addEventListener('pointermove', e => {
        const r = stage.getBoundingClientRect();
        const x = clamp((e.clientX - r.left) / Math.max(1, r.width));
        const y = clamp((e.clientY - r.top) / Math.max(1, r.height));
        stage.style.setProperty('--sk10-px', ((x-.5)*2).toFixed(3));
        stage.style.setProperty('--sk10-py', ((y-.5)*2).toFixed(3));
      }, {passive:true});
      stage.addEventListener('pointerleave', () => {
        stage.style.setProperty('--sk10-px','0');
        stage.style.setProperty('--sk10-py','0');
      }, {passive:true});
    }
  }

  function hardenFooter() {
    qa('footer a, footer button').forEach(el => {
      if (el.tagName === 'A' && !el.hasAttribute('href') && !el.hasAttribute('role')) el.setAttribute('role','button');
      if (el.tagName === 'A' && !el.hasAttribute('href') && !el.hasAttribute('tabindex')) el.tabIndex = 0;
    });
  }

  function rgba(color) {
    const m = color.match(/rgba?\(([^)]+)\)/i);
    if (!m) return null;
    const p = m[1].split(',').map(v => Number(v.trim()));
    if (p.length < 3 || p.some((v,i)=>i<3 && !Number.isFinite(v))) return null;
    return {r:p[0], g:p[1], b:p[2], a:Number.isFinite(p[3]) ? p[3] : 1};
  }
  const lum = c => {
    const f = v => { v /= 255; return v <= .03928 ? v/12.92 : Math.pow((v+.055)/1.055,2.4); };
    return .2126*f(c.r)+.7152*f(c.g)+.0722*f(c.b);
  };
  const contrast = (a,b) => {
    const l1 = lum(a), l2 = lum(b);
    return (Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05);
  };
  function resolvedBg(el) {
    let node = el;
    while (node && node !== document.documentElement) {
      const c = rgba(getComputedStyle(node).backgroundColor);
      if (c && c.a > .88) return c;
      node = node.parentElement;
    }
    return document.documentElement.dataset.theme === 'dark' ? {r:13,g:10,b:8,a:1} : {r:250,g:249,b:246,a:1};
  }

  function runThemeAudit() {
    const selectors = [
      'footer h4','footer p','footer a','footer span','nav .nav-link','nav .nav-features-cta',
      '.sk6-path-card h3','.sk6-path-card p','.sk6-tool-card h3','.sk6-tool-card p',
      '.sk6-final h2','.sk6-final p','.sk10-close-card strong','.sk10-close-card small',
      '.card-title','.card-subtitle','.feature-overview-card','.profile-menu-item','.sk4-panel p'
    ];
    const failures = [];
    qa(selectors.join(',')).forEach(el => {
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) < .2) return;
      const fg = rgba(style.color), bg = resolvedBg(el);
      if (!fg || !bg) return;
      const size = parseFloat(style.fontSize) || 16;
      const weight = parseInt(style.fontWeight,10) || 400;
      const minimum = size >= 24 || (size >= 18.66 && weight >= 700) ? 3 : 4.5;
      const ratio = contrast(fg,bg);
      if (ratio + .05 < minimum) failures.push({selector:el.className || el.tagName, text:(el.textContent||'').trim().slice(0,50), ratio:+ratio.toFixed(2), minimum});
    });
    const report = {
      version: VERSION,
      theme: document.documentElement.dataset.theme || 'light',
      featuresPage: !!q('#page-features'),
      featuresButtons: qa('#nav-features,#nav-features-cta,.nav-features-cta,[data-features]').length,
      footerPresent: !!q('footer'),
      contrastFailures: failures,
      checkedAt: new Date().toISOString()
    };
    window.ScholarkV57Audit = report;
    if (failures.length) console.warn('[Scholark V5.7] contrast audit warnings', report);
    else console.info('[Scholark V5.7] theme audit PASS', report);
    return report;
  }

  function installThemeAudit() {
    let timer = 0;
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(runThemeAudit, 180);
    };
    new MutationObserver(schedule).observe(document.documentElement, {attributes:true, attributeFilter:['data-theme']});
    addEventListener('resize', schedule, {passive:true});
    setTimeout(schedule, 350);
  }

  function boot() {
    ensureStyles();
    const root = q('.sk6-experience');
    if (!root) return setTimeout(boot, 45);
    if (root.dataset.sk10Ready) return;
    root.dataset.sk10Ready = '1';
    document.body.classList.add('scholark-v57');
    document.documentElement.dataset.scholarkUi = VERSION;

    window.ScholarkV5 = Object.assign(window.ScholarkV5 || {}, {go, version:VERSION});
    installFeatureRouting();
    buildClosingScene();
    hardenFooter();
    installThemeAudit();

    window.ScholarkV57 = {version:VERSION, go, audit:runThemeAudit};
  }

  ensureStyles();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
