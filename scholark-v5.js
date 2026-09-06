(() => {
  'use strict';
  if (window.__scholarkV52Installed) return;
  window.__scholarkV52Installed = true;

  const VERSION = '5.2.0';
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const coarsePointer = matchMedia('(pointer: coarse)');
  const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smoothstep = t => { t = clamp(t); return t * t * (3 - 2 * t); };
  const q = (s, r = document) => r.querySelector(s);
  const qa = (s, r = document) => [...r.querySelectorAll(s)];
  const range = (p, start, end) => smoothstep((p - start) / Math.max(.0001, end - start));
  const between = (p, a, b, fade = .055) => range(p, a, a + fade) * (1 - range(p, b - fade, b));

  const ICONS = {
    chart: '<path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/>',
    star: '<path d="m12 2 2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8L3.5 8.2l5.9-.9L12 2Z"/>',
    school: '<path d="M3 10h18M5 10v8M9 10v8M15 10v8M19 10v8M2 21h20m-10-18 9 5H3l9-5Z"/>',
    pen: '<path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M22 12h-3M12 22v-3M2 12h3"/>',
    test: '<path d="M8 2h8l3 3v17H5V2h3Z"/><path d="M16 2v4h4M8 11h8M8 15h5"/>',
    book: '<path d="M3 5.5A2.5 2.5 0 0 1 5.5 3H11v16H5.5A2.5 2.5 0 0 0 3 21.5Z"/><path d="M21 5.5A2.5 2.5 0 0 0 18.5 3H13v16h5.5a2.5 2.5 0 0 1 2.5 2.5Z"/>',
    compare: '<path d="M7 7h14l-3-3m3 3-3 3M17 17H3l3-3m-3 3 3 3"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    career: '<path d="M3 7h18v13H3ZM8 7V4h8v3M3 12h18m-11 0v2h4v-2"/>',
    puzzle: '<path d="M19 13V7h-6a2 2 0 1 0-4 0H3v6a2 2 0 1 1 0 4v4h6a2 2 0 1 1 4 0h6v-4a2 2 0 1 0 0-4Z"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5Z"/>',
    arrow: '<path d="M5 19 19 5M9 5h10v10"/>',
    mouse: '<rect x="7" y="2" width="10" height="20" rx="5"/><path d="M12 6v4"/>',
    spark: '<path d="m12 2 1.6 5.4L19 9l-5.4 1.6L12 16l-1.6-5.4L5 9l5.4-1.6Z"/>'
  };
  const icon = (name, cls = '') => `<svg class="sk6-icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.spark}</svg>`;

  function loadStyles() {
    if (!q('link[href="scholark-v5.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'scholark-v5.css';
      document.head.appendChild(link);
    }
    document.body.classList.add('scholark-v5', 'scholark-v52');
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
      } catch (err) { console.warn('Scholark route enhancer:', err); }
    }, 0);
  }

  const tools = [
    {i:'01', icon:'chart', title:'GPA Calculator', desc:'Semester and cumulative GPA with instant feedback.', action:()=>go('tools','gpa'), cls:'feature wide'},
    {i:'02', icon:'star', title:'Weighted GPA', desc:'AP, IB and Honors weighting on a 5.0 scale.', action:()=>go('tools','weighted')},
    {i:'03', icon:'school', title:'College Chances', desc:'Compare your profile with a 200+ university dataset.', action:()=>go('tools','chances'), cls:'dark tall'},
    {i:'04', icon:'pen', title:'Essay Rubric Coach', desc:'Private, on-device feedback designed around revision.', action:()=>go('essay'), cls:'accent'},
    {i:'05', icon:'target', title:'GPA Goal Tracker', desc:'Model the grades and scenarios needed for your target.', action:()=>go('goals')},
    {i:'06', icon:'test', title:'SAT / ACT Prep', desc:'Diagnostics, mastery plans, practice and full simulations.', action:()=>go('prep'), cls:'feature wide'},
    {i:'07', icon:'book', title:'AP Study Studio', desc:'Adaptive practice, task labs and unit courses across AP subjects.', action:()=>go('ap')},
    {i:'08', icon:'compare', title:'College Compare', desc:'Side-by-side tradeoffs with visual comparison tools.', action:()=>go('compare')},
    {i:'09', icon:'search', title:'College Intelligence', desc:'Cost, outcomes, selectivity and source-first research.', action:()=>go('intelligence'), cls:'dark wide'},
    {i:'10', icon:'career', title:'Career Outcomes', desc:'BLS-backed pathways, pay, growth, skills and major connections.', action:()=>go('careers')},
    {i:'11', icon:'puzzle', title:'College Match Quiz', desc:'Turn preferences into a starting shortlist.', action:()=>go('quiz')},
    {i:'12', icon:'compass', title:'Admissions Guide', desc:'Curated guidance for strategy, aid, essays and interviews.', action:()=>go('counselor')}
  ];

  const cloud = (n, x, y, s, z, drift) => `<span class="sk6-cloud sk6-cloud-${n}" style="--x:${x}%;--y:${y}%;--s:${s};--z:${z}px;--drift:${drift}px" aria-hidden="true"><i></i><b></b></span>`;
  const portalLayer = n => `<svg class="sk6-logo-layer sk6-logo-layer-${n}" viewBox="0 0 100 100" aria-hidden="true"><path d="M20 23C31 13 54 12 73 20L80 23 72 38 65 35C51 30 36 31 32 37c-3 5 1 8 9 10l24 7c16 5 21 15 16 25-7 14-31 21-56 13L14 88l8-16 11 4c14 5 28 3 32-4 2-4-2-7-9-9L32 56C13 51 9 32 20 23Z" fill="currentColor"/></svg>`;

  const campusSvg = `
    <svg class="sk6-campus" viewBox="0 0 700 470" aria-hidden="true">
      <g class="sk6-campus-back" fill="none" stroke="currentColor" stroke-width="1.15" vector-effect="non-scaling-stroke">
        <path d="M28 418h644M88 418V268h524v150M130 268v-42h438v42M195 226v-48h308v48M278 178v-58h144v58M330 120V66h40v54M312 66h76M350 35v31"/>
        <path d="M104 296h492M104 332h492M104 369h492M104 402h492" opacity=".42"/>
        <path d="M145 268v150M205 268v150M265 268v150M325 268v150M385 268v150M445 268v150M505 268v150M565 268v150" opacity=".42"/>
      </g>
      <g class="sk6-campus-front" fill="none" stroke="currentColor" stroke-width="1.5" vector-effect="non-scaling-stroke">
        <path d="M330 120V66h40v54M312 66h76M350 35v31"/>
        <circle cx="350" cy="148" r="27"/><path d="M350 130v20l13 8"/>
        <path d="m66 418 34-62 36 62m429 0 34-62 36 62"/>
      </g>
    </svg>`;

  function brandPortal() {
    const layers = Array.from({length:8}, (_, i) => portalLayer(i + 1)).join('');
    return `<div class="sk6-portal-object" aria-hidden="true">
      <div class="sk6-portal-plate"></div>
      <div class="sk6-logo-depth">${layers}</div>
      <svg class="sk6-logo-face" viewBox="0 0 100 100" aria-hidden="true">
        <defs><linearGradient id="sk6paper" x1="20" y1="18" x2="78" y2="89"><stop stop-color="#fffdf8"/><stop offset="1" stop-color="#efd7c3"/></linearGradient></defs>
        <path d="M20 23C31 13 54 12 73 20L80 23 72 38 65 35C51 30 36 31 32 37c-3 5 1 8 9 10l24 7c16 5 21 15 16 25-7 14-31 21-56 13L14 88l8-16 11 4c14 5 28 3 32-4 2-4-2-7-9-9L32 56C13 51 9 32 20 23Z" fill="url(#sk6paper)"/>
        <path d="M75 14l3.2 7.2L86 24.5l-7.8 3.2L75 35l-3.2-7.3-7.8-3.2 7.8-3.3L75 14Z" fill="#ffd38d"/>
        <circle cx="75" cy="24.5" r="1.8" fill="#fffdf8"/>
      </svg>
      <div class="sk6-portal-ring sk6-ring-a"></div><div class="sk6-portal-ring sk6-ring-b"></div><div class="sk6-portal-ring sk6-ring-c"></div>
      <span class="sk6-glint"></span>
    </div>`;
  }

  function floatingCard(kind, cls, title, sub) {
    return `<div class="sk6-float-card ${cls}" aria-hidden="true"><div class="sk6-float-icon">${icon(kind)}</div><div><strong>${title}</strong><span>${sub}</span></div><i></i></div>`;
  }

  function buildHome() {
    const home = q('#page-home');
    if (!home || q('.sk6-experience', home)) return;
    home.classList.add('sk5-home', 'sk6-home');

    const root = document.createElement('div');
    root.className = 'sk6-experience';
    root.innerHTML = `
      <div class="sk6-grain" aria-hidden="true"></div>
      <section class="sk6-story" aria-label="Scholark interactive introduction">
        <div class="sk6-sticky">
          <div class="sk6-world" aria-hidden="true">
            <div class="sk6-sky-layer sk6-z-far"><span class="sk6-sun"></span>
              ${cloud(1,12,19,1.35,-480,-28)}${cloud(2,78,18,.9,-430,22)}${cloud(3,63,57,1.7,-330,-18)}${cloud(4,23,69,.82,-260,20)}${cloud(5,91,72,.72,-210,-26)}${cloud(6,48,9,.62,-520,18)}
            </div>
            <div class="sk6-hills sk6-z-mid"><i></i><b></b></div>
            <div class="sk6-campus-wrap sk6-z-mid">${campusSvg}</div>
            <div class="sk6-book-stack sk6-books-left sk6-z-near"><i></i><i></i><i></i><i></i></div>
            <div class="sk6-book-stack sk6-books-right sk6-z-near"><i></i><i></i><i></i></div>
            <div class="sk6-leaf sk6-leaf-a sk6-z-near"></div><div class="sk6-leaf sk6-leaf-b sk6-z-near"></div>
          </div>

          <div class="sk6-float-field">
            ${floatingCard('chart','sk6-fc-a','GPA','Calculate')}
            ${floatingCard('school','sk6-fc-b','Admissions','Compare')}
            ${floatingCard('pen','sk6-fc-c','Essays','Refine')}
            ${floatingCard('test','sk6-fc-d','Test prep','Practice')}
          </div>

          <div class="sk6-portal-stage">${brandPortal()}</div>

          <div class="sk6-hero-copy">
            <div class="sk6-eyebrow">Plan · Prepare · Improve · Achieve</div>
            <h1>A brighter<br><em>path forward.</em></h1>
            <p>Free, student-built college planning and academic support — all in one Scholark system.</p>
            <div class="sk6-actions"><button type="button" class="sk6-btn primary" data-start>Explore tools ${icon('arrow')}</button><button type="button" class="sk6-btn glass" data-features>See everything</button></div>
          </div>
          <div class="sk6-hero-note">Built by a student.<br>For students.</div>

          <div class="sk6-through-copy sk6-through-a"><small>01 / PLAN</small><strong>Start with where<br>you are.</strong></div>
          <div class="sk6-through-copy sk6-through-b"><small>02 / PREPARE</small><strong>Turn uncertainty<br>into a plan.</strong></div>
          <div class="sk6-through-copy sk6-through-c"><small>03 / IMPROVE</small><strong>Practice. Compare.<br>Keep moving.</strong></div>

          <div class="sk6-wave-scene" aria-hidden="true">
            <svg viewBox="0 0 1200 360"><path class="sk6-wave-shadow" d="M-40 228C110 70 235 304 370 164S610 58 752 205s220 132 488-52"/><path class="sk6-wave-main" d="M-40 228C110 70 235 304 370 164S610 58 752 205s220 132 488-52"/></svg>
            <span class="sk6-wave-dot d1">${icon('chart')}</span><span class="sk6-wave-dot d2">${icon('school')}</span><span class="sk6-wave-dot d3">${icon('pen')}</span><span class="sk6-wave-dot d4">${icon('test')}</span>
          </div>

          <div class="sk6-orbit-scene" aria-hidden="true">
            <div class="sk6-orbit-core">Scholark<span>one connected journey</span></div>
            <div class="sk6-orbit o1"><b>23</b><span>AP subjects</span></div>
            <div class="sk6-orbit o2"><b>200+</b><span>universities</span></div>
            <div class="sk6-orbit o3"><b>$0</b><span>core toolkit</span></div>
            <div class="sk6-orbit o4"><b>Private</b><span>essay feedback</span></div>
          </div>

          <div class="sk6-exit-copy"><small>04 / ACHIEVE</small><strong>Your next step<br><em>is already here.</em></strong></div>
          <div class="sk6-scroll-cue" aria-hidden="true">${icon('mouse')}<span>Scroll to enter</span></div>
          <div class="sk6-progress"><i></i><span>01 — 05</span></div>
        </div>
      </section>

      <section class="sk6-proof-shell" aria-label="Scholark highlights">
        <div class="sk6-proof-panel sk6-reveal">
          <article>${icon('book')}<strong>23</strong><span>AP subjects</span></article>
          <article>${icon('chart')}<strong>3,480</strong><span>AP practice checks</span></article>
          <article>${icon('test')}<strong>7,444</strong><span>SAT + ACT questions</span></article>
          <article>${icon('compare')}<strong>50</strong><span>full simulations</span></article>
          <article>${icon('target')}<strong>47</strong><span>SAT/ACT taxonomy topics</span></article>
        </div>
      </section>

      <section class="sk6-journey-section">
        <div class="sk6-section-head sk6-reveal"><div><small>Everything you need</small><h2>Built for the <em>whole journey.</em></h2></div><p>From GPA calculations to college research, Scholark keeps the work connected instead of scattering it across tabs and apps.</p></div>
        <div class="sk6-path-grid">
          <button type="button" class="sk6-path-card sk6-reveal" data-route="tools" data-tab="gpa">${icon('chart')}<b>01</b><h3>GPA & Weighted GPA</h3><p>Calculate, track, and plan academic progress.</p><span>${icon('arrow')}</span></button>
          <button type="button" class="sk6-path-card sk6-reveal" data-delay="1" data-route="intelligence">${icon('school')}<b>02</b><h3>Admissions Planning</h3><p>Explore, compare, and make informed decisions.</p><span>${icon('arrow')}</span></button>
          <button type="button" class="sk6-path-card sk6-reveal" data-delay="2" data-route="essay">${icon('pen')}<b>03</b><h3>Essay Support</h3><p>Brainstorm, draft, refine, and review privately.</p><span>${icon('arrow')}</span></button>
          <button type="button" class="sk6-path-card sk6-reveal" data-delay="3" data-route="prep">${icon('book')}<b>04</b><h3>Test Prep & Study</h3><p>Practice, review, and improve with structure.</p><span>${icon('arrow')}</span></button>
        </div>
      </section>

      <section class="sk6-fit-scene">
        <div class="sk6-fit-bg" aria-hidden="true"><span class="sk6-fit-sun"></span>${campusSvg}${cloud(9,17,18,1.2,-20,20)}${cloud(10,74,70,1.5,-10,-24)}</div>
        <div class="sk6-fit-inner">
          <div class="sk6-fit-copy sk6-reveal"><small>Opportunities ahead</small><h2>Find your<br><em>perfect fit.</em></h2><p>Compare your priorities with 200+ universities and use public data as a decision aid, not a verdict.</p><button type="button" class="sk6-btn primary" data-intelligence>Explore college intelligence ${icon('arrow')}</button></div>
          <div class="sk6-fit-stack sk6-reveal" data-delay="1">
            <div class="sk6-search-glass"><div class="sk6-searchbar">${icon('search')}<span>Search universities…</span></div><div class="sk6-row"><i>VA</i><span>University of Virginia</span><b>compare</b></div><div class="sk6-row"><i>VT</i><span>Virginia Tech</span><b>compare</b></div><div class="sk6-row"><i>PU</i><span>Purdue University</span><b>compare</b></div><div class="sk6-row"><i>UF</i><span>University of Florida</span><b>compare</b></div><footer>200+ institutions in Scholark</footer></div>
            <div class="sk6-mini-card m1">Cost <strong>Compare</strong></div><div class="sk6-mini-card m2">Outcomes <strong>Explore</strong></div>
          </div>
        </div>
      </section>

      <section class="sk6-tools-section">
        <div class="sk6-section-head sk6-reveal"><div><small>Real tools · real progress</small><h2>Everything moves<br><em>with you.</em></h2></div><p>Every card is live. Open a tool, do the work, and come back without losing the flow.</p></div>
        <div class="sk6-tools-grid">${tools.map((t,n)=>`<button type="button" class="sk6-tool-card ${t.cls || ''} sk6-reveal" data-tool="${n}" data-delay="${n%4}"><div class="sk6-tool-top"><span>${t.i} / 12</span>${icon(t.icon)}</div><div class="sk6-tool-art"><i></i><i></i><i></i></div><div class="sk6-tool-copy"><h3>${t.title}</h3><p>${t.desc}</p></div><b class="sk6-tool-arrow">${icon('arrow')}</b></button>`).join('')}</div>
      </section>

      <section class="sk6-final">
        <div class="sk6-final-halo" aria-hidden="true"></div>
        <div class="sk6-final-inner"><small class="sk6-reveal">Scholark</small><h2 class="sk6-reveal">Same curiosity.<br><em>Brighter opportunities.</em></h2><p class="sk6-reveal" data-delay="1">Independent educational project · Not a company or employer · Built by Shriyan Avadhanula, Founder.</p><div class="sk6-actions sk6-reveal" data-delay="2"><button type="button" class="sk6-btn primary" data-start>Start with GPA ${icon('arrow')}</button><button type="button" class="sk6-btn glass" data-features>View all features</button></div></div>
      </section>`;

    home.prepend(root);
    qa('[data-tool]', root).forEach(card => card.addEventListener('click', () => tools[+card.dataset.tool]?.action()));
    qa('[data-route]', root).forEach(card => card.addEventListener('click', () => go(card.dataset.route, card.dataset.tab || undefined)));
    qa('[data-start]', root).forEach(btn => btn.addEventListener('click', () => go('tools','gpa')));
    qa('[data-features]', root).forEach(btn => btn.addEventListener('click', () => go('features')));
    q('[data-intelligence]', root)?.addEventListener('click', () => go('intelligence'));
  }

  let story, sticky, raf = 0, scrollTarget = 0, scrollSmooth = 0;
  let pointerX = .5, pointerY = .5, smoothX = .5, smoothY = .5;

  function applyStory(p) {
    if (!sticky) return;
    const mobile = innerWidth <= 760;
    const introOut = range(p, .08, .22);
    const approach = range(p, .08, .28);
    const portalDive = range(p, .22, .43);
    const through = range(p, .36, .50);
    const waveIn = between(p, .41, .64, .06);
    const orbitIn = between(p, .61, .82, .055);
    const exitIn = range(p, .80, .93);

    smoothX = lerp(smoothX, pointerX, .09);
    smoothY = lerp(smoothY, pointerY, .09);
    const px = (smoothX - .5) * 2;
    const py = (smoothY - .5) * 2;

    const portalScale = mobile ? lerp(.92, 10.5, portalDive) : lerp(1, 18, portalDive);
    const portalRotY = lerp(-2, -21, approach) + lerp(0, 14, through);
    const portalRotX = lerp(0, 11, approach);
    const worldZ = mobile ? lerp(0, 380, approach) : lerp(0, 720, approach);
    const worldY = lerp(0, 70, approach);

    sticky.style.setProperty('--sk6-p', p.toFixed(4));
    sticky.style.setProperty('--sk6-px', px.toFixed(3));
    sticky.style.setProperty('--sk6-py', py.toFixed(3));
    sticky.style.setProperty('--sk6-intro', (1 - introOut).toFixed(3));
    sticky.style.setProperty('--sk6-approach', approach.toFixed(3));
    sticky.style.setProperty('--sk6-dive', portalDive.toFixed(3));
    sticky.style.setProperty('--sk6-through', through.toFixed(3));
    sticky.style.setProperty('--sk6-portal-scale', portalScale.toFixed(3));
    sticky.style.setProperty('--sk6-portal-rx', portalRotX.toFixed(2) + 'deg');
    sticky.style.setProperty('--sk6-portal-ry', portalRotY.toFixed(2) + 'deg');
    sticky.style.setProperty('--sk6-portal-x', lerp(0, mobile ? -1 : -4, approach).toFixed(2) + 'vw');
    sticky.style.setProperty('--sk6-portal-y', lerp(0, mobile ? 7 : 3, approach).toFixed(2) + 'vh');
    sticky.style.setProperty('--sk6-portal-opacity', (1 - range(p,.43,.51)).toFixed(3));
    sticky.style.setProperty('--sk6-world-z', worldZ.toFixed(1) + 'px');
    sticky.style.setProperty('--sk6-world-y', worldY.toFixed(1) + 'px');
    sticky.style.setProperty('--sk6-wave-opacity', waveIn.toFixed(3));
    sticky.style.setProperty('--sk6-orbit-opacity', orbitIn.toFixed(3));
    sticky.style.setProperty('--sk6-exit-opacity', exitIn.toFixed(3));
    sticky.style.setProperty('--sk6-progress', (p * 100).toFixed(2) + '%');
    sticky.style.setProperty('--sk6-scroll-cue', (1 - range(p,0,.06)).toFixed(3));
    sticky.style.setProperty('--sk6-bg-shift', range(p,.36,.55).toFixed(3));

    qa('.sk6-through-copy', sticky).forEach((el, i) => {
      const starts = [.39,.49,.56], ends = [.49,.59,.66];
      el.style.setProperty('--scene-alpha', between(p, starts[i], ends[i], .035).toFixed(3));
      el.style.setProperty('--scene-y', lerp(26,-18,range(p,starts[i],ends[i])).toFixed(1)+'px');
    });

    qa('.sk6-cloud', sticky).forEach((el, i) => {
      const z = +(el.style.getPropertyValue('--z').replace('px','') || -250);
      const depth = clamp((560 + z) / 650, .08, 1);
      const pass = portalDive * depth;
      el.style.setProperty('--sx', ((i % 2 ? 1 : -1) * pass * (mobile ? 36 : 110)).toFixed(1) + 'px');
      el.style.setProperty('--sy', (pass * (mobile ? -36 : -120) * (i%3===0 ? -1 : 1)).toFixed(1) + 'px');
      el.style.setProperty('--zoom', (1 + pass * (mobile ? .28 : .8)).toFixed(3));
      el.style.setProperty('--blur', (pass * (mobile ? 1.2 : 3.2)).toFixed(2) + 'px');
    });

    const path = q('.sk6-wave-main', sticky);
    if (path) path.style.strokeDashoffset = String(1350 * (1 - range(p,.43,.60)));

    qa('.sk6-orbit', sticky).forEach((el, i) => {
      const phase = p * 210 + i * 82;
      el.style.setProperty('--oa', phase.toFixed(2) + 'deg');
      el.style.setProperty('--oz', lerp(-120, 140, (Math.sin((phase*Math.PI)/180)+1)/2).toFixed(1)+'px');
    });
  }

  function updateMotion() {
    raf = 0;
    if (!story || !sticky) return;
    const rect = story.getBoundingClientRect();
    const max = Math.max(1, story.offsetHeight - innerHeight);
    scrollTarget = clamp(-rect.top / max);
    scrollSmooth = reduceMotion.matches ? scrollTarget : lerp(scrollSmooth, scrollTarget, .16);
    applyStory(scrollSmooth);
    document.body.classList.toggle('sk5-scrolled', scrollY > 28);

    const fit = q('.sk6-fit-scene');
    if (fit) {
      const fr = fit.getBoundingClientRect();
      const fp = clamp((innerHeight - fr.top)/(innerHeight + fr.height));
      fit.style.setProperty('--fit-p', fp.toFixed(3));
    }
    if (Math.abs(scrollTarget - scrollSmooth) > .0006) requestMotion();
  }

  function requestMotion() { if (!raf) raf = requestAnimationFrame(updateMotion); }

  function installReveal() {
    const els = qa('.sk6-reveal');
    if (reduceMotion.matches) { els.forEach(el => el.classList.add('is-visible')); return; }
    const io = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      io.unobserve(entry.target);
    }), {threshold:.12, rootMargin:'0px 0px -8%'});
    els.forEach(el => io.observe(el));
  }

  function installPointer() {
    if (reduceMotion.matches || coarsePointer.matches) return;
    const onMove = e => {
      pointerX = e.clientX / innerWidth;
      pointerY = e.clientY / innerHeight;
      qa('.sk6-tool-card:hover,.sk6-path-card:hover').forEach(card => {
        const r = card.getBoundingClientRect();
        const x = clamp((e.clientX-r.left)/r.width,0,1)-.5;
        const y = clamp((e.clientY-r.top)/r.height,0,1)-.5;
        card.style.setProperty('--tilt-x',(-y*5.5).toFixed(2)+'deg');
        card.style.setProperty('--tilt-y',(x*7).toFixed(2)+'deg');
        card.style.setProperty('--spot-x',((x+.5)*100).toFixed(1)+'%');
        card.style.setProperty('--spot-y',((y+.5)*100).toFixed(1)+'%');
      });
      requestMotion();
    };
    const reset = e => {
      const card = e.target.closest?.('.sk6-tool-card,.sk6-path-card');
      if (!card) return;
      card.style.setProperty('--tilt-x','0deg');
      card.style.setProperty('--tilt-y','0deg');
    };
    addEventListener('pointermove', onMove, {passive:true});
    document.addEventListener('pointerout', reset, {passive:true});
  }

  function installReducedMotionSync() {
    const sync = () => { document.documentElement.classList.toggle('sk6-reduce-motion', reduceMotion.matches); requestMotion(); };
    reduceMotion.addEventListener?.('change', sync); sync();
  }

  function syncPageState() {
    const home = q('#page-home');
    document.body.classList.toggle('sk5-home-active', !!home?.classList.contains('active'));
    requestMotion();
  }

  function hookNavigation() {
    if (typeof window.showPage !== 'function' || window.showPage.__sk6) return;
    const original = window.showPage;
    const wrapped = function(...args) { const out = original.apply(this,args); queueMicrotask(syncPageState); return out; };
    wrapped.__sk6 = true; window.showPage = wrapped;
  }

  function boot() {
    loadStyles(); buildHome();
    story = q('.sk6-story'); sticky = q('.sk6-sticky');
    installReveal(); installPointer(); installReducedMotionSync(); hookNavigation(); syncPageState();
    addEventListener('scroll', requestMotion, {passive:true});
    addEventListener('resize', requestMotion, {passive:true});
    addEventListener('orientationchange', () => setTimeout(requestMotion,120), {passive:true});
    updateMotion();
    window.ScholarkV5 = {version:VERSION, refresh:updateMotion};
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();