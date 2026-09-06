(() => {
  'use strict';
  if (window.__scholarkV5Installed) return;
  window.__scholarkV5Installed = true;

  const VERSION = '5.1.0';
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const coarsePointer = matchMedia('(pointer: coarse)');
  const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = t => 1 - Math.pow(1 - clamp(t), 3);
  const easeInOut = t => {
    t = clamp(t);
    return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };
  const q = (s, r = document) => r.querySelector(s);
  const qa = (s, r = document) => [...r.querySelectorAll(s)];

  const icon = (name, cls = '') => {
    const paths = {
      chart: '<path d="M4 19V9"/><path d="M10 19V5"/><path d="M16 19v-7"/><path d="M22 19H2"/>',
      star: '<path d="m12 2 2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8L3.5 8.2l5.9-.9L12 2Z"/>',
      school: '<path d="M3 10h18"/><path d="M5 10v8"/><path d="M9 10v8"/><path d="M15 10v8"/><path d="M19 10v8"/><path d="M2 21h20"/><path d="m12 3 9 5H3l9-5Z"/>',
      pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
      target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M22 12h-3M12 22v-3M2 12h3"/>',
      test: '<path d="M8 2h8l3 3v17H5V2h3Z"/><path d="M16 2v4h4"/><path d="M8 11h8M8 15h5"/>',
      book: '<path d="M3 5.5A2.5 2.5 0 0 1 5.5 3H11v16H5.5A2.5 2.5 0 0 0 3 21.5Z"/><path d="M21 5.5A2.5 2.5 0 0 0 18.5 3H13v16h5.5a2.5 2.5 0 0 1 2.5 2.5Z"/>',
      compare: '<path d="M7 7h14l-3-3M21 7l-3 3"/><path d="M17 17H3l3-3M3 17l3 3"/>',
      search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
      career: '<path d="M3 7h18v13H3Z"/><path d="M8 7V4h8v3"/><path d="M3 12h18"/><path d="M10 12v2h4v-2"/>',
      puzzle: '<path d="M19 13V7h-6a2 2 0 1 0-4 0H3v6a2 2 0 1 1 0 4v4h6a2 2 0 1 1 4 0h6v-4a2 2 0 1 0 0-4Z"/>',
      compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5Z"/>',
      arrow: '<path d="M5 19 19 5"/><path d="M9 5h10v10"/>',
      mouse: '<rect x="7" y="2" width="10" height="20" rx="5"/><path d="M12 6v4"/>',
      spark: '<path d="m12 2 1.6 5.4L19 9l-5.4 1.6L12 16l-1.6-5.4L5 9l5.4-1.6Z"/><path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7Z"/>'
    };
    return `<svg class="sk5-icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.spark}</svg>`;
  };

  function loadStyles() {
    if (!q('link[href="scholark-v5.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'scholark-v5.css';
      document.head.appendChild(link);
    }
    document.body.classList.add('scholark-v5');
    document.documentElement.dataset.scholarkUi = VERSION;
  }

  function go(page, tab) {
    if (typeof window.showPage === 'function') window.showPage(page);
    setTimeout(() => {
      try {
        if (page === 'prep') window.ScholarkPrep?.init?.();
        if (page === 'ap') window.initAPHub?.();
        if (page === 'counselor') window.initCounselor?.();
        if (tab) window.switchTab?.(tab);
      } catch (err) {
        console.warn('Scholark route enhancer:', err);
      }
    }, 0);
  }

  const tools = [
    {i:'01', icon:'chart', title:'GPA Calculator', desc:'Semester and cumulative GPA with instant feedback.', action:()=>go('tools','gpa'), cls:'feature large'},
    {i:'02', icon:'star', title:'Weighted GPA', desc:'AP, IB and Honors weighting on a 5.0 scale.', action:()=>go('tools','weighted')},
    {i:'03', icon:'school', title:'College Chances', desc:'Compare your profile with a 200+ university dataset.', action:()=>go('tools','chances'), cls:'dark tall'},
    {i:'04', icon:'pen', title:'Essay Rubric Coach', desc:'Private, on-device feedback designed around revision.', action:()=>go('essay'), cls:'accent'},
    {i:'05', icon:'target', title:'GPA Goal Tracker', desc:'Model the grades and scenarios needed for your target.', action:()=>go('goals')},
    {i:'06', icon:'test', title:'SAT / ACT Prep', desc:'Diagnostics, mastery plans, practice and full simulations.', action:()=>go('prep'), cls:'feature large'},
    {i:'07', icon:'book', title:'AP Study Studio', desc:'Adaptive practice, task labs and unit courses across AP subjects.', action:()=>go('ap')},
    {i:'08', icon:'compare', title:'College Compare', desc:'Side-by-side tradeoffs with visual comparison tools.', action:()=>go('compare')},
    {i:'09', icon:'search', title:'College Intelligence', desc:'Cost, outcomes, selectivity and source-first research.', action:()=>go('intelligence'), cls:'dark large'},
    {i:'10', icon:'career', title:'Career Outcomes', desc:'BLS-backed pathways, pay, growth, skills and major connections.', action:()=>go('careers')},
    {i:'11', icon:'puzzle', title:'College Match Quiz', desc:'Turn preferences into a starting shortlist.', action:()=>go('quiz')},
    {i:'12', icon:'compass', title:'Admissions Guide', desc:'Curated guidance for strategy, aid, essays and interviews.', action:()=>go('counselor')}
  ];

  const cloud = (n, x, y, s, depth) => `<span class="sk5-cloud sk5-cloud-${n}" style="--x:${x}%;--y:${y}%;--s:${s};--depth:${depth}" aria-hidden="true"><i></i></span>`;

  const campusSvg = `
    <svg class="sk5-campus" viewBox="0 0 540 390" aria-hidden="true">
      <g fill="none" stroke="currentColor" stroke-width="1.2" vector-effect="non-scaling-stroke">
        <path d="M38 340h464M84 340V210h372v130M128 210v-38h284v38M178 172v-38h184v38M231 134v-47h78v47M260 87V49h20v38M246 49h48M270 28v21"/>
        <path d="M92 220h356M92 250h356M92 282h356M92 314h356" opacity=".55"/>
        <path d="M119 220v120M161 220v120M203 220v120M245 220v120M287 220v120M329 220v120M371 220v120M413 220v120" opacity=".48"/>
        <path d="m58 340 26-44 26 44m344 0 26-44 26 44"/>
        <circle cx="270" cy="107" r="20"/><path d="M270 93v15l10 7"/>
      </g>
    </svg>`;

  function brandMark() {
    return `
      <div class="sk5-brand-object" aria-hidden="true">
        <svg class="sk5-mark-svg" viewBox="0 0 64 64">
          <defs>
            <linearGradient id="sk5-field" x1="8" y1="7" x2="57" y2="58" gradientUnits="userSpaceOnUse"><stop stop-color="#E28A55"/><stop offset=".46" stop-color="#C8622A"/><stop offset="1" stop-color="#963C19"/></linearGradient>
            <linearGradient id="sk5-paper" x1="18" y1="14" x2="45" y2="50" gradientUnits="userSpaceOnUse"><stop stop-color="#FFFDF8"/><stop offset="1" stop-color="#F4E5D7"/></linearGradient>
          </defs>
          <g class="sk5-mark-plate"><rect x="3" y="3" width="58" height="58" rx="17" fill="url(#sk5-field)"/><rect x="4" y="4" width="56" height="56" rx="16" fill="none" stroke="#FFF8EE" stroke-opacity=".22"/></g>
          <g class="sk5-mark-s">
            <path d="M18.2 18.9C23.6 14.4 32.9 12.8 41.3 15.1L47.4 16.8L43.4 23.7L38.6 22.5C32.3 20.9 25.7 21.2 23.1 23.6C21.6 25 22.4 26.9 25.3 27.7L38.7 31.1C45.1 32.8 47.6 37.1 45.4 41.7C42.6 47.4 32.4 51.1 21.4 47.8L15.7 46.1L19.6 39.1L24.7 40.7C31 42.6 37.3 41.4 39.1 38.9C40.1 37.4 39 36 36.4 35.3L23 31.8C15.4 29.8 13.3 23 18.2 18.9Z" fill="url(#sk5-paper)"/>
            <path d="M18.2 18.9C24.7 18.1 29.1 19.3 32.5 22.1C28.4 21.2 24.8 21.7 23.1 23.6C21.6 25 22.4 26.9 25.3 27.7L29.4 28.7C24.4 28.4 19.5 26.9 16.4 23.5C16.6 21.7 17.2 20.2 18.2 18.9Z" fill="#fff" fill-opacity=".72"/>
            <path d="M39.1 38.9C37.3 41.4 31 42.6 24.7 40.7L19.6 39.1L15.7 46.1L21.4 47.8C30.1 50.4 38.3 48.7 42.8 44.9C37.9 45.7 32.1 45 27.7 42.9C33.1 44 37.5 42.4 39.1 38.9Z" fill="#E9CFB8" fill-opacity=".75"/>
            <path d="M39.4 14.7L49.7 14.2L44 23.9L41.9 19.4L39.4 14.7Z" fill="#FFFDF8"/>
          </g>
          <g class="sk5-mark-star"><path d="M49.5 8.8L51 12.2L54.5 13.7L51 15.2L49.5 18.6L48 15.2L44.5 13.7L48 12.2L49.5 8.8Z" fill="#FFD48E"/><circle cx="49.5" cy="13.7" r="1.15" fill="#FFFDF8"/></g>
        </svg>
        <span class="sk5-mark-glint"></span>
      </div>`;
  }

  function toolPreview(t, n) {
    const variant = n % 3;
    if (variant === 0) return `<div class="sk5-mini-ui" aria-hidden="true"><span></span><span></span><span></span><b></b></div>`;
    if (variant === 1) return `<div class="sk5-mini-rings" aria-hidden="true"><i></i><i></i><i></i></div>`;
    return `<div class="sk5-mini-bars" aria-hidden="true"><i style="--h:42%"></i><i style="--h:68%"></i><i style="--h:54%"></i><i style="--h:86%"></i><i style="--h:73%"></i></div>`;
  }

  function buildHome() {
    const home = q('#page-home');
    if (!home || q('.sk5-experience', home)) return;
    home.classList.add('sk5-home');

    const root = document.createElement('div');
    root.className = 'sk5-experience';
    root.innerHTML = `
      <div class="sk5-grain" aria-hidden="true"></div>
      <section class="sk5-journey" aria-label="Scholark introduction">
        <div class="sk5-sticky">
          <div class="sk5-sky" aria-hidden="true">
            <span class="sk5-sun"></span>
            ${cloud(1, 10, 23, 1.2, .15)}${cloud(2, 76, 18, .86, .1)}${cloud(3, 62, 63, 1.45, .25)}${cloud(4, 24, 72, .72, .32)}${cloud(5, 88, 76, .64, .4)}
            ${campusSvg}
            <span class="sk5-contour sk5-contour-a"></span><span class="sk5-contour sk5-contour-b"></span>
          </div>

          <div class="sk5-floating-ui sk5-float-left" aria-hidden="true"><span></span><span></span><span></span></div>
          <div class="sk5-floating-ui sk5-float-right" aria-hidden="true"><span></span><span></span></div>

          <div class="sk5-brand-stage">${brandMark()}</div>

          <div class="sk5-hero-copy sk5-hero-copy-left">
            <div class="sk5-eyebrow">Plan · Prepare · Improve · Achieve</div>
            <h1>A brighter<br><em>path forward.</em></h1>
            <p>Free, student-built tools for the college journey — designed to help you calculate, prepare, compare and improve without losing your flow.</p>
            <div class="sk5-hero-actions">
              <button class="sk5-btn primary" type="button" data-start>Explore tools ${icon('arrow')}</button>
              <button class="sk5-btn secondary" type="button" data-features>See everything</button>
            </div>
          </div>

          <div class="sk5-hero-copy sk5-hero-copy-right">
            <div class="sk5-vertical-note">Student-built<br>Practical<br>Accessible</div>
            <p>One recognizable Scholark system for GPA, applications, essays, test prep and college research.</p>
          </div>

          <div class="sk5-dive-copy" aria-hidden="true">
            <span>Think it.</span><span>Plan it.</span><span><em>Do it.</em></span>
          </div>

          <div class="sk5-scroll-cue" aria-hidden="true">${icon('mouse')}<span>Scroll to explore</span></div>
          <div class="sk5-progress"><i></i><span>01 / 05</span></div>
        </div>
      </section>

      <section class="sk5-stats-shell" aria-label="Scholark platform highlights">
        <div class="sk5-stats-panel sk5-reveal">
          <article><span>${icon('book')}</span><strong>23</strong><small>AP subjects</small></article>
          <article><span>${icon('chart')}</span><strong>200+</strong><small>universities tracked</small></article>
          <article><span>${icon('test')}</span><strong>Full</strong><small>SAT / ACT practice</small></article>
          <article><span>${icon('pen')}</span><strong>Private</strong><small>on-device essay feedback</small></article>
          <article><span>${icon('target')}</span><strong>$0</strong><small>core toolkit</small></article>
        </div>
      </section>

      <section class="sk5-manifesto">
        <div class="sk5-manifesto-grid">
          <div class="sk5-reveal">
            <div class="sk5-section-label">02 / Built around the whole journey</div>
            <h2>More than a calculator.<br><em>A connected support system.</em></h2>
          </div>
          <div class="sk5-manifesto-copy sk5-reveal" data-delay="1">
            <p>Start with a GPA calculation. Move into admissions planning. Draft an essay. Practice a test. Compare schools. Come back tomorrow and keep going.</p>
            <p class="sk5-small-note">The goal is not more tabs. It is less friction between deciding what to do and actually doing it.</p>
          </div>
        </div>
        <div class="sk5-journey-cards">
          <button type="button" class="sk5-journey-card sk5-reveal" data-route="tools" data-tab="gpa">${icon('chart')}<span>Calculate</span><small>GPA & weighted GPA</small>${icon('arrow','arr')}</button>
          <button type="button" class="sk5-journey-card sk5-reveal" data-route="intelligence" data-delay="1">${icon('school')}<span>Explore</span><small>Admissions & colleges</small>${icon('arrow','arr')}</button>
          <button type="button" class="sk5-journey-card sk5-reveal" data-route="essay" data-delay="2">${icon('pen')}<span>Refine</span><small>Essay support</small>${icon('arrow','arr')}</button>
          <button type="button" class="sk5-journey-card sk5-reveal" data-route="prep" data-delay="3">${icon('test')}<span>Practice</span><small>Test prep & study</small>${icon('arrow','arr')}</button>
        </div>
      </section>

      <section class="sk5-fit-scene">
        <div class="sk5-fit-sky" aria-hidden="true">${cloud(6, 8, 12, 1, .1)}${cloud(7, 72, 74, 1.25, .2)}${campusSvg}</div>
        <div class="sk5-fit-grid">
          <div class="sk5-fit-copy sk5-reveal">
            <div class="sk5-section-label">03 / Opportunities ahead</div>
            <h2>Find your<br><em>perfect fit.</em></h2>
            <p>Use data as a decision aid, not a verdict. Compare schools, costs, outcomes and your own priorities in one place.</p>
            <button class="sk5-btn light" type="button" data-intelligence>Explore college intelligence ${icon('arrow')}</button>
          </div>
          <div class="sk5-search-card sk5-reveal" data-delay="1">
            <div class="sk5-search-bar">${icon('search')}<span>Search universities…</span></div>
            <div class="sk5-result-row"><i>VA</i><span>University of Virginia</span><b>compare</b></div>
            <div class="sk5-result-row"><i>VT</i><span>Virginia Tech</span><b>compare</b></div>
            <div class="sk5-result-row"><i>PU</i><span>Purdue University</span><b>compare</b></div>
            <div class="sk5-result-row"><i>UF</i><span>University of Florida</span><b>compare</b></div>
            <div class="sk5-search-foot">200+ institutions in the current Scholark dataset</div>
          </div>
          <blockquote class="sk5-fit-quote sk5-reveal" data-delay="2">“A useful college tool should help you see the tradeoffs — then get out of the way so you can decide.”<span>Scholark design principle</span></blockquote>
        </div>
      </section>

      <section class="sk5-tool-universe">
        <div class="sk5-tool-head">
          <div class="sk5-reveal"><div class="sk5-section-label">04 / Real tools · real progress</div><h2>Everything you need.<br><em>Nothing you do not.</em></h2></div>
          <p class="sk5-reveal" data-delay="1">Open any card and it takes you directly into the live Scholark tool — no fake demo layer.</p>
        </div>
        <div class="sk5-tool-grid">
          ${tools.map((t,n)=>`<button type="button" class="sk5-tool-card ${t.cls || ''} sk5-reveal" data-tool="${n}" data-delay="${n%4}">
            <div class="sk5-tool-top"><span class="sk5-tool-index">${t.i} / 12</span>${icon(t.icon)}</div>
            ${toolPreview(t,n)}
            <div class="sk5-tool-copy"><h3>${t.title}</h3><p>${t.desc}</p></div>
            <span class="sk5-tool-arrow">${icon('arrow')}</span>
          </button>`).join('')}
        </div>
      </section>

      <section class="sk5-final">
        <div class="sk5-final-orbit" aria-hidden="true"></div>
        <div class="sk5-final-inner">
          <div class="sk5-section-label sk5-reveal">05 / Scholark</div>
          <h2 class="sk5-reveal">Same curiosity.<br><em>Brighter opportunities.</em></h2>
          <p class="sk5-reveal" data-delay="1">Independent educational project. Not a company or employer. Built by Shriyan Avadhanula, Founder.</p>
          <div class="sk5-final-actions sk5-reveal" data-delay="2"><button class="sk5-btn primary" type="button" data-start>Start with GPA ${icon('arrow')}</button><button class="sk5-btn secondary" type="button" data-features>View all features</button></div>
        </div>
      </section>`;

    home.prepend(root);

    qa('[data-tool]', root).forEach(card => card.addEventListener('click', () => tools[+card.dataset.tool]?.action()));
    qa('[data-route]', root).forEach(card => card.addEventListener('click', () => go(card.dataset.route, card.dataset.tab || undefined)));
    qa('[data-start]', root).forEach(btn => btn.addEventListener('click', () => go('tools','gpa')));
    qa('[data-features]', root).forEach(btn => btn.addEventListener('click', () => go('features')));
    q('[data-intelligence]', root)?.addEventListener('click', () => go('intelligence'));
  }

  let journey, sticky, raf = 0;
  let pointerX = .5, pointerY = .5, smoothX = .5, smoothY = .5;

  function updateMotion() {
    raf = 0;
    if (!journey || !sticky) return;

    const rect = journey.getBoundingClientRect();
    const max = Math.max(1, journey.offsetHeight - innerHeight);
    const p = clamp(-rect.top / max);
    const detach = easeInOut(clamp((p - .10) / .20));
    const dive = easeInOut(clamp((p - .28) / .38));
    const afterDive = easeOut(clamp((p - .60) / .20));

    smoothX = lerp(smoothX, pointerX, .08);
    smoothY = lerp(smoothY, pointerY, .08);

    const brandScale = lerp(1, 12.5, dive);
    const brandY = lerp(0, 6, dive);
    const brandX = lerp(0, -5.5, dive);
    const opacity = 1 - easeOut(clamp((p - .64) / .16));

    sticky.style.setProperty('--sk5-p', p.toFixed(4));
    sticky.style.setProperty('--sk5-detach', detach.toFixed(4));
    sticky.style.setProperty('--sk5-dive', dive.toFixed(4));
    sticky.style.setProperty('--sk5-brand-scale', brandScale.toFixed(3));
    sticky.style.setProperty('--sk5-brand-x', brandX.toFixed(2) + 'vw');
    sticky.style.setProperty('--sk5-brand-y', brandY.toFixed(2) + 'vh');
    sticky.style.setProperty('--sk5-brand-opacity', opacity.toFixed(3));
    sticky.style.setProperty('--sk5-copy-opacity', (1 - easeOut(clamp((p - .08) / .20))).toFixed(3));
    sticky.style.setProperty('--sk5-copy-shift', lerp(0, -30, detach).toFixed(1) + 'px');
    sticky.style.setProperty('--sk5-dive-copy-opacity', (easeOut(clamp((p - .47) / .15)) * (1 - easeOut(clamp((p - .78) / .14)))).toFixed(3));
    sticky.style.setProperty('--sk5-sky-wash', afterDive.toFixed(3));
    sticky.style.setProperty('--sk5-scroll-cue-opacity', (1 - easeOut(clamp(p / .08))).toFixed(3));
    sticky.style.setProperty('--sk5-progress', (p * 100).toFixed(2) + '%');
    sticky.style.setProperty('--sk5-pointer-x', ((smoothX - .5) * 2).toFixed(3));
    sticky.style.setProperty('--sk5-pointer-y', ((smoothY - .5) * 2).toFixed(3));

    qa('.sk5-cloud', sticky).forEach((el, i) => {
      const depth = +(el.style.getPropertyValue('--depth') || .2);
      el.style.setProperty('--scroll-y', (p * depth * -150).toFixed(1) + 'px');
      el.style.setProperty('--scroll-x', (p * (i % 2 ? 1 : -1) * depth * 36).toFixed(1) + 'px');
    });

    document.body.classList.toggle('sk5-scrolled', scrollY > 32);

    const fit = q('.sk5-fit-scene');
    if (fit) {
      const fr = fit.getBoundingClientRect();
      const fp = clamp((innerHeight - fr.top) / (innerHeight + fr.height));
      fit.style.setProperty('--sk5-fit-progress', fp.toFixed(3));
    }
  }

  function requestMotion() {
    if (!raf) raf = requestAnimationFrame(updateMotion);
  }

  function installReveal() {
    const els = qa('.sk5-reveal');
    if (reduceMotion.matches) {
      els.forEach(el => el.classList.add('sk5-visible'));
      return;
    }
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('sk5-visible');
        io.unobserve(entry.target);
      });
    }, {threshold:.12, rootMargin:'0px 0px -8%'});
    els.forEach(el => io.observe(el));
  }

  function installPointer() {
    if (reduceMotion.matches || coarsePointer.matches) return;
    const onMove = e => {
      pointerX = e.clientX / innerWidth;
      pointerY = e.clientY / innerHeight;
      qa('.sk5-tool-card:hover').forEach(card => {
        const r = card.getBoundingClientRect();
        const x = clamp((e.clientX - r.left) / r.width, 0, 1) - .5;
        const y = clamp((e.clientY - r.top) / r.height, 0, 1) - .5;
        card.style.setProperty('--tilt-x', (-y * 4.5).toFixed(2) + 'deg');
        card.style.setProperty('--tilt-y', (x * 6).toFixed(2) + 'deg');
        card.style.setProperty('--spot-x', ((x + .5) * 100).toFixed(1) + '%');
        card.style.setProperty('--spot-y', ((y + .5) * 100).toFixed(1) + '%');
      });
      requestMotion();
    };
    const onOut = e => {
      const card = e.target.closest?.('.sk5-tool-card');
      if (!card) return;
      card.style.setProperty('--tilt-x','0deg');
      card.style.setProperty('--tilt-y','0deg');
    };
    document.addEventListener('pointermove', onMove, {passive:true});
    document.addEventListener('pointerout', onOut, {passive:true});
  }

  function installReducedMotionSync() {
    const sync = () => {
      document.documentElement.classList.toggle('sk5-reduce-motion', reduceMotion.matches);
      requestMotion();
    };
    reduceMotion.addEventListener?.('change', sync);
    sync();
  }

  function syncPageState() {
    const home = q('#page-home');
    document.body.classList.toggle('sk5-home-active', !!home?.classList.contains('active'));
    requestMotion();
  }

  function hookNavigation() {
    if (typeof window.showPage !== 'function' || window.showPage.__sk5) return;
    const original = window.showPage;
    const wrapped = function(...args) {
      const out = original.apply(this, args);
      queueMicrotask(syncPageState);
      return out;
    };
    wrapped.__sk5 = true;
    window.showPage = wrapped;
  }

  function boot() {
    loadStyles();
    buildHome();
    journey = q('.sk5-journey');
    sticky = q('.sk5-sticky');
    installReveal();
    installPointer();
    installReducedMotionSync();
    hookNavigation();
    syncPageState();
    addEventListener('scroll', requestMotion, {passive:true});
    addEventListener('resize', requestMotion, {passive:true});
    updateMotion();
    window.ScholarkV5 = {version:VERSION, refresh:updateMotion};
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
