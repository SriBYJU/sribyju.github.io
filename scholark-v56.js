(() => {
  'use strict';
  if (window.__scholarkV56Installed) return;
  window.__scholarkV56Installed = true;

  const VERSION = '5.6.0';
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const coarsePointer = matchMedia('(pointer: coarse)');
  const q = (s, r = document) => r.querySelector(s);
  const qa = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));

  const slides = [
    {
      key:'plan', eyebrow:'01 / PLAN', title:'See the whole path.', body:'Start with GPA, goals, and a realistic picture of where you stand.',
      stat:'GPA + goals', route:['tools','gpa'], action:'Open GPA tools',
      chips:['GPA','Weighted GPA','Goals']
    },
    {
      key:'prepare', eyebrow:'02 / PREPARE', title:'Build your shortlist.', body:'Turn preferences, public data, and tradeoffs into a college list you understand.',
      stat:'200+ universities', route:['intelligence'], action:'Explore colleges',
      chips:['College chances','Compare','College Intelligence']
    },
    {
      key:'improve', eyebrow:'03 / IMPROVE', title:'Practice with purpose.', body:'Move from diagnostics to focused SAT, ACT, AP, and essay work without leaving the system.',
      stat:'7,444 questions', route:['prep'], action:'Start practicing',
      chips:['SAT / ACT','AP Studio','Essay Coach']
    },
    {
      key:'achieve', eyebrow:'04 / ACHIEVE', title:'Make the next move.', body:'Connect academics, admissions, and career exploration so the next decision has context.',
      stat:'One connected journey', route:['careers'], action:'Explore outcomes',
      chips:['Admissions Guide','Careers','College Match']
    }
  ];

  function ensureStyles() {
    if (q('link[href*="scholark-v56.css"]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'scholark-v56.css';
    document.head.appendChild(link);
  }

  const markSvg = () => `<svg class="sk9-mark-svg" viewBox="0 0 100 100" aria-hidden="true">
    <path d="M20 23C31 13 54 12 73 20L80 23 72 38 65 35C51 30 36 31 32 37c-3 5 1 8 9 10l24 7c16 5 21 15 16 25-7 14-31 21-56 13L14 88l8-16 11 4c14 5 28 3 32-4 2-4-2-7-9-9L32 56C13 51 9 32 20 23Z" fill="currentColor"/>
    <path d="M75 14l3.2 7.2L86 24.5l-7.8 3.2L75 35l-3.2-7.3-7.8-3.2 7.8-3.3L75 14Z" fill="currentColor"/>
  </svg>`;

  function addSkipIntro(root) {
    const story = q('.sk6-story', root);
    const target = q('.sk6-proof-shell', root);
    if (!story || !target || q('.sk9-skip', story)) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sk9-skip';
    btn.textContent = 'Skip cinematic';
    btn.addEventListener('click', () => target.scrollIntoView({behavior:reduceMotion.matches?'auto':'smooth', block:'start'}));
    story.appendChild(btn);
  }

  function addSpeedBloom(root) {
    const sticky = q('.sk6-sticky', root);
    if (!sticky || q('.sk9-speed-bloom', sticky)) return;
    const bloom = document.createElement('div');
    bloom.className = 'sk9-speed-bloom';
    bloom.setAttribute('aria-hidden','true');
    bloom.innerHTML = '<i></i><b></b><em></em>';
    sticky.appendChild(bloom);
  }

  function buildObservatory(root) {
    const tools = q('.sk6-tools-section', root);
    if (!tools || q('.sk9-observatory', root)) return null;
    const section = document.createElement('section');
    section.className = 'sk9-observatory';
    section.setAttribute('aria-label','Scholark journey observatory');
    section.innerHTML = `
      <div class="sk9-observatory-atmosphere" aria-hidden="true">
        <span class="sk9-orbit-line a"></span><span class="sk9-orbit-line b"></span><span class="sk9-orbit-line c"></span>
        <span class="sk9-paper p1"></span><span class="sk9-paper p2"></span><span class="sk9-paper p3"></span><span class="sk9-paper p4"></span>
        <span class="sk9-star s1"></span><span class="sk9-star s2"></span><span class="sk9-star s3"></span><span class="sk9-star s4"></span>
      </div>
      <div class="sk9-observatory-inner">
        <header class="sk9-observatory-head">
          <small>Interactive Scholark system</small>
          <h2>Your whole journey,<br><em>in one orbit.</em></h2>
          <p>Explore how planning, practice, research, and outcomes connect — then jump directly into the part you need.</p>
        </header>
        <div class="sk9-stage" tabindex="0" aria-roledescription="carousel" aria-label="Scholark journey stages">
          <div class="sk9-stage-world" aria-hidden="true">
            <div class="sk9-core"><span class="sk9-core-halo"></span>${markSvg()}<b>Scholark</b></div>
            ${slides.map((s,i)=>`<span class="sk9-world-node n${i+1}" data-world-node="${i}"><i></i><b>${s.key}</b></span>`).join('')}
            <svg class="sk9-connections" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M50 50 L17 22 M50 50 L83 23 M50 50 L18 78 M50 50 L82 77"/>
            </svg>
          </div>
          <div class="sk9-panel-wrap">
            <article class="sk9-panel" aria-live="polite" aria-atomic="true">
              <div class="sk9-panel-kicker"></div>
              <h3></h3>
              <p></p>
              <div class="sk9-panel-stat"></div>
              <div class="sk9-chip-row"></div>
              <button type="button" class="sk9-panel-cta"></button>
            </article>
            <div class="sk9-panel-shadow" aria-hidden="true"></div>
          </div>
        </div>
        <div class="sk9-controls" role="group" aria-label="Journey carousel controls">
          <button type="button" class="sk9-control prev" aria-label="Previous journey stage">←</button>
          <div class="sk9-dots" role="tablist" aria-label="Journey stages">
            ${slides.map((s,i)=>`<button type="button" role="tab" aria-label="${s.key}" aria-selected="${i===0?'true':'false'}" data-slide="${i}"><i></i></button>`).join('')}
          </div>
          <button type="button" class="sk9-control pause" aria-label="Pause automatic rotation" aria-pressed="false"><span>Pause</span></button>
          <button type="button" class="sk9-control next" aria-label="Next journey stage">→</button>
        </div>
        <p class="sk9-carousel-status sr-only" aria-live="polite"></p>
      </div>`;
    tools.before(section);
    return section;
  }

  function splitHeadline(el) {
    if (!el || el.dataset.sk9Split) return;
    el.dataset.sk9Split = '1';
    const label = el.textContent.replace(/\s+/g,' ').trim();
    el.setAttribute('aria-label', label);
    const nodes = [...el.childNodes];
    let idx = 0;
    nodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) return frag.appendChild(document.createTextNode(part));
          const span = document.createElement('span');
          span.className = 'sk9-word';
          span.setAttribute('aria-hidden','true');
          span.style.setProperty('--wi', idx++);
          span.textContent = part;
          frag.appendChild(span);
        });
        node.replaceWith(frag);
      } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'EM') {
        splitHeadline(node);
      }
    });
  }

  function installSplitReveal(section) {
    const h = q('.sk9-observatory-head h2', section);
    splitHeadline(h);
    if (reduceMotion.matches) return h?.classList.add('sk9-words-in');
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      h?.classList.add('sk9-words-in');
      io.disconnect();
    }, {threshold:.32});
    if (h) io.observe(h);
  }

  function installCarousel(section) {
    if (!section) return;
    const stage = q('.sk9-stage', section);
    const panel = q('.sk9-panel', section);
    const kicker = q('.sk9-panel-kicker', panel);
    const title = q('h3', panel);
    const body = q('p', panel);
    const stat = q('.sk9-panel-stat', panel);
    const chips = q('.sk9-chip-row', panel);
    const cta = q('.sk9-panel-cta', panel);
    const dots = qa('[data-slide]', section);
    const nodes = qa('[data-world-node]', section);
    const pauseBtn = q('.sk9-control.pause', section);
    const status = q('.sk9-carousel-status', section);
    let index = 0, timer = 0, paused = false, onscreen = true, hovered = false, focused = false;

    const stop = () => { if (timer) clearInterval(timer); timer = 0; };
    const start = () => {
      stop();
      if (reduceMotion.matches || paused || hovered || focused || document.hidden || !onscreen) return;
      timer = setInterval(() => show((index + 1) % slides.length, true), 5800);
    };

    function show(next, announce = false) {
      index = (next + slides.length) % slides.length;
      const s = slides[index];
      section.dataset.active = s.key;
      panel.classList.remove('sk9-swap');
      void panel.offsetWidth;
      kicker.textContent = s.eyebrow;
      title.textContent = s.title;
      body.textContent = s.body;
      stat.textContent = s.stat;
      chips.innerHTML = s.chips.map(c=>`<span>${c}</span>`).join('');
      cta.textContent = `${s.action}  ↗`;
      cta.onclick = () => window.ScholarkV5?.go?.(s.route[0], s.route[1]);
      panel.classList.add('sk9-swap');
      dots.forEach((d,i) => {
        d.setAttribute('aria-selected', i===index?'true':'false');
        d.tabIndex = i===index?0:-1;
      });
      nodes.forEach((n,i)=>n.classList.toggle('active',i===index));
      if (announce && status) status.textContent = `${s.key}, slide ${index+1} of ${slides.length}`;
      start();
    }

    q('.sk9-control.prev', section)?.addEventListener('click',()=>show(index-1,true));
    q('.sk9-control.next', section)?.addEventListener('click',()=>show(index+1,true));
    dots.forEach(d=>d.addEventListener('click',()=>show(+d.dataset.slide,true)));
    pauseBtn?.addEventListener('click',()=>{
      paused = !paused;
      pauseBtn.setAttribute('aria-pressed', String(paused));
      q('span', pauseBtn).textContent = paused ? 'Play' : 'Pause';
      pauseBtn.setAttribute('aria-label', paused?'Resume automatic rotation':'Pause automatic rotation');
      start();
    });
    stage?.addEventListener('keydown',e=>{
      if(e.key==='ArrowLeft'){ e.preventDefault(); show(index-1,true); }
      if(e.key==='ArrowRight'){ e.preventDefault(); show(index+1,true); }
    });
    section.addEventListener('pointerenter',()=>{hovered=true;stop();});
    section.addEventListener('pointerleave',()=>{hovered=false;start();});
    section.addEventListener('focusin',()=>{focused=true;stop();});
    section.addEventListener('focusout',e=>{if(!section.contains(e.relatedTarget)){focused=false;start();}});
    document.addEventListener('visibilitychange',start);
    reduceMotion.addEventListener?.('change',start);
    const io = new IntersectionObserver(([entry])=>{onscreen=entry.isIntersecting;start();},{threshold:.15});
    io.observe(section);
    show(0,false);
  }

  function installStagePointer(section) {
    if (!section || reduceMotion.matches || coarsePointer.matches) return;
    const stage = q('.sk9-stage', section);
    if (!stage) return;
    stage.addEventListener('pointermove', e => {
      const r = stage.getBoundingClientRect();
      const x = clamp((e.clientX-r.left)/r.width);
      const y = clamp((e.clientY-r.top)/r.height);
      stage.style.setProperty('--mx', ((x-.5)*2).toFixed(3));
      stage.style.setProperty('--my', ((y-.5)*2).toFixed(3));
      stage.style.setProperty('--spot-x', `${(x*100).toFixed(1)}%`);
      stage.style.setProperty('--spot-y', `${(y*100).toFixed(1)}%`);
    }, {passive:true});
    stage.addEventListener('pointerleave',()=>{
      stage.style.setProperty('--mx','0');
      stage.style.setProperty('--my','0');
    });
  }

  function installWindReactivity(root) {
    if (!root) return;
    let raf=0,lastY=scrollY,lastT=performance.now(),wind=0;
    const tick=(ts)=>{
      raf=0;
      const dt=Math.max(16,Math.min(80,ts-lastT));
      const dy=scrollY-lastY;
      const velocity=clamp(dy/(dt*1.2),-1,1);
      wind += (velocity-wind)*.22;
      if(Math.abs(velocity)<.015) wind*=.88;
      const speed = Math.abs(wind);
      root.style.setProperty('--sk9-wind',wind.toFixed(4));
      root.style.setProperty('--sk9-speed',speed.toFixed(4));
      root.style.setProperty('--sk9-wind-x',`${(wind*18).toFixed(2)}px`);
      root.style.setProperty('--sk9-wind-x-near',`${(wind*-30).toFixed(2)}px`);
      root.style.setProperty('--sk9-wind-tilt',`${(wind*.35).toFixed(3)}deg`);
      root.style.setProperty('--sk9-speed-opacity',(speed*.68).toFixed(3));
      root.style.setProperty('--sk9-speed-blur',`${(speed*28).toFixed(2)}px`);
      root.style.setProperty('--sk9-speed-glow',(speed*.34).toFixed(3));
      root.style.setProperty('--sk9-bloom-scale',(.75+speed*1.2).toFixed(3));
      lastY=scrollY;lastT=ts;
      if(Math.abs(wind)>.008) request();
    };
    const request=()=>{if(!raf)raf=requestAnimationFrame(tick);};
    addEventListener('scroll',request,{passive:true});
    request();
  }

  function boot() {
    ensureStyles();
    const root = q('.sk6-experience');
    if (!root) return setTimeout(boot, 40);
    if (root.dataset.sk9Ready) return;
    root.dataset.sk9Ready = '1';
    document.documentElement.dataset.scholarkUi = VERSION;
    document.body.classList.add('scholark-v56');

    addSkipIntro(root);
    addSpeedBloom(root);
    const observatory = buildObservatory(root);
    installSplitReveal(observatory);
    installCarousel(observatory);
    installStagePointer(observatory);
    installWindReactivity(root);

    window.ScholarkV56 = {version:VERSION};
  }

  ensureStyles();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
