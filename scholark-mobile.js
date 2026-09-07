(() => {
  'use strict';
  if (window.__scholarkMobileInstalled) return;
  window.__scholarkMobileInstalled = true;

  const mobile=matchMedia('(max-width:760px), (pointer:coarse)');
  if(!mobile.matches) return;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
  const q=(s,r=document)=>r.querySelector(s);
  const dynamicPages=new Set(['intelligence','careers','methodology']);

  const markSvg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="skm-field" x1="10" y1="8" x2="54" y2="58" gradientUnits="userSpaceOnUse"><stop stop-color="#E28A55"/><stop offset=".46" stop-color="#C8622A"/><stop offset="1" stop-color="#963C19"/></linearGradient>
      <linearGradient id="skm-paper" x1="18" y1="14" x2="45" y2="50" gradientUnits="userSpaceOnUse"><stop stop-color="#FFFDF8"/><stop offset="1" stop-color="#F4E5D7"/></linearGradient>
    </defs>
    <rect x="3" y="3" width="58" height="58" rx="17" fill="url(#skm-field)"/>
    <rect x="4" y="4" width="56" height="56" rx="16" fill="none" stroke="#FFF8EE" stroke-opacity=".24"/>
    <path d="M18.2 18.9C23.6 14.4 32.9 12.8 41.3 15.1L47.4 16.8L43.4 23.7L38.6 22.5C32.3 20.9 25.7 21.2 23.1 23.6C21.6 25 22.4 26.9 25.3 27.7L38.7 31.1C45.1 32.8 47.6 37.1 45.4 41.7C42.6 47.4 32.4 51.1 21.4 47.8L15.7 46.1L19.6 39.1L24.7 40.7C31 42.6 37.3 41.4 39.1 38.9C40.1 37.4 39 36 36.4 35.3L23 31.8C15.4 29.8 13.3 23 18.2 18.9Z" fill="url(#skm-paper)"/>
    <path d="M18.2 18.9C24.7 18.1 29.1 19.3 32.5 22.1C28.4 21.2 24.8 21.7 23.1 23.6C21.6 25 22.4 26.9 25.3 27.7L29.4 28.7C24.4 28.4 19.5 26.9 16.4 23.5C16.6 21.7 17.2 20.2 18.2 18.9Z" fill="#FFFFFF" fill-opacity=".74"/>
    <path d="M39.1 38.9C37.3 41.4 31 42.6 24.7 40.7L19.6 39.1L15.7 46.1L21.4 47.8C30.1 50.4 38.3 48.7 42.8 44.9C37.9 45.7 32.1 45 27.7 42.9C33.1 44 37.5 42.4 39.1 38.9Z" fill="#E9CFB8" fill-opacity=".78"/>
    <path d="M39.4 14.7L49.7 14.2L44 23.9L41.9 19.4L39.4 14.7Z" fill="#FFFDF8"/>
    <path d="M49.5 8.8L51 12.2L54.5 13.7L51 15.2L49.5 18.6L48 15.2L44.5 13.7L48 12.2L49.5 8.8Z" fill="#FFD48E"/>
    <circle cx="49.5" cy="13.7" r="1.15" fill="#FFFDF8"/>
  </svg>`;

  const tools=[
    ['01','GPA Calculator','Semester and cumulative GPA with instant feedback.','tools','gpa'],
    ['02','Weighted GPA','AP, IB and Honors weighting.','tools','weighted'],
    ['03','College Chances','Compare your profile with Scholark’s university dataset.','tools','chances'],
    ['04','Essay Rubric Coach','Private, on-device revision feedback.','essay',''],
    ['05','GPA Goal Tracker','Model the grades needed for your target.','goals',''],
    ['06','SAT / ACT Prep','Diagnostics, practice and full simulations.','prep',''],
    ['07','AP Study Studio','Adaptive practice across AP subjects.','ap',''],
    ['08','College Compare','Side-by-side college tradeoffs.','compare',''],
    ['09','College Intelligence','Cost, outcomes, selectivity and research.','intelligence',''],
    ['10','Career Outcomes','Career pathways, pay, growth and skills.','careers',''],
    ['11','College Match Quiz','Turn preferences into a starting shortlist.','quiz',''],
    ['12','Admissions Guide','Strategy, aid, essays and interviews.','counselor','']
  ];

  function go(page,tab){
    if(page==='features'){
      q('.skm-tools')?.scrollIntoView({behavior:reduce.matches?'auto':'smooth',block:'start'});
      return;
    }
    if(dynamicPages.has(page)) window.ScholarkV3?.ensureV4?.().catch?.(()=>{});
    const attempt=(n=0)=>{
      if(typeof window.showPage==='function'&&document.getElementById('page-'+page)){
        window.showPage(page);
        queueMicrotask(()=>{ if(tab) window.switchTab?.(tab); });
        return;
      }
      if(n<90) return setTimeout(()=>attempt(n+1),40);
      window.showToast?.('That section is still loading. Please try again in a moment.','info');
    };
    attempt();
  }

  function build(){
    const home=q('#page-home');
    if(!home) return false;
    if(q('.skm-experience',home)) return true;
    home.classList.add('skm-home');
    document.body.classList.add('scholark-mobile-cinematic');
    document.documentElement.dataset.scholarkMobile='cinematic-2';

    const root=document.createElement('main');
    root.className='skm-experience';
    root.innerHTML=`
      <section class="skm-story" aria-label="ScholarK interactive introduction">
        <div class="skm-stage">
          <div class="skm-atmos" aria-hidden="true"><span class="skm-ribbon a"></span><span class="skm-ribbon b"></span><span class="skm-ribbon c"></span><span class="skm-depth-panel one"></span><span class="skm-depth-panel two"></span></div>
          <div class="skm-hero">
            <div class="skm-eyebrow">Plan · Prepare · Improve · Achieve</div>
            <h1>A brighter <em>path forward.</em></h1>
            <p>Free, student-built college planning and academic support — all in one ScholarK system.</p>
            <div class="skm-actions"><button class="skm-btn primary" type="button" data-skm-go="tools" data-skm-tab="gpa">Explore tools ↗</button><button class="skm-btn secondary" type="button" data-skm-go="features">See everything</button></div>
          </div>
          <div class="skm-mark">${markSvg}</div>
          <div class="skm-mark-shadow" aria-hidden="true"></div>
          <div class="skm-chapter" aria-hidden="true">01 · Plan</div>
          <div class="skm-rail" aria-hidden="true"><span class="skm-rail-track"></span><span class="skm-rail-fill"></span><i></i><i></i><i></i><i></i></div>
          <div class="skm-exit"><small>04 / Achieve</small><strong>Your next step <em>is already here.</em></strong></div>
          <div class="skm-scroll" aria-hidden="true">Scroll to enter ↓</div>
        </div>
      </section>
      <section class="skm-proof" aria-label="ScholarK highlights"><div class="skm-proof-grid">
        <article><strong>10K+</strong><span>students monthly</span></article><article><strong>23</strong><span>AP subjects</span></article><article><strong>200+</strong><span>universities</span></article><article><strong>$0</strong><span>core toolkit</span></article>
      </div></section>
      <section class="skm-section skm-journey"><div class="skm-head"><small>Everything you need</small><h2>Built for the <em>whole journey.</em></h2><p>Plan academics, research colleges, improve essays and prepare for exams without scattering the work across different apps.</p></div><div class="skm-grid">
        <button class="skm-card" type="button" data-skm-go="tools" data-skm-tab="gpa"><b>01 · Academic profile</b><h3>Know where you stand.</h3><p>GPA, weighted GPA and academic planning.</p></button>
        <button class="skm-card" type="button" data-skm-go="compare"><b>02 · College fit</b><h3>Compare what matters.</h3><p>Build a clearer shortlist around your priorities.</p></button>
        <button class="skm-card" type="button" data-skm-go="essay"><b>03 · Essay strength</b><h3>Draft. Review. Refine.</h3><p>Private tools designed around revision.</p></button>
        <button class="skm-card" type="button" data-skm-go="prep"><b>04 · Test readiness</b><h3>Practice with structure.</h3><p>Diagnostics, mastery and full simulations.</p></button>
      </div></section>
      <section class="skm-section skm-tools"><div class="skm-head"><small>Real tools · real progress</small><h2>Everything moves <em>with you.</em></h2><p>Open a tool, do the work, and return to the same ScholarK system.</p></div><div class="skm-grid">${tools.map(t=>`<button class="skm-card" type="button" data-skm-go="${t[3]}"${t[4]?` data-skm-tab="${t[4]}"`:''}><b>${t[0]} / 12</b><h3>${t[1]}</h3><p>${t[2]}</p></button>`).join('')}</div></section>
      <section class="skm-final"><small>ScholarK</small><h2>Same curiosity.<br><em>Brighter opportunities.</em></h2><p>Independent, student-built, non-commercial educational project · not an incorporated company, business, or employer · not revenue-generating.</p><div class="skm-actions"><button class="skm-btn primary" type="button" data-skm-go="tools" data-skm-tab="gpa">Start with GPA ↗</button><button class="skm-btn secondary" type="button" data-skm-go="features">View all features</button></div></section>`;
    home.prepend(root);
    root.querySelectorAll('[data-skm-go]').forEach(btn=>btn.addEventListener('click',()=>go(btn.dataset.skmGo,btn.dataset.skmTab||'')));
    document.documentElement.classList.remove('scholark-cinematic-loading');
    document.documentElement.classList.add('scholark-cinematic-ready');
    return true;
  }

  let story,stage,hero,mark,shadow,exit,cue,chapter,start=0,range=1,raf=0;

  function placeMark(){
    if(!stage||!hero||!mark||!shadow) return;
    const sr=stage.getBoundingClientRect();
    const hr=hero.getBoundingClientRect();
    const size=mark.offsetWidth;
    const heroBottom=hr.bottom-sr.top;
    const minCenter=heroBottom+6+size/2;
    const preferred=stage.clientHeight*(innerHeight<650?.57:.525);
    const maxCenter=stage.clientHeight-size/2-28;
    const center=Math.max(size/2+22,Math.min(maxCenter,Math.max(preferred,minCenter)));
    mark.style.top=`${center.toFixed(1)}px`;
    shadow.style.top=`${Math.min(stage.clientHeight-18,center+size*.56).toFixed(1)}px`;
  }

  function measure(){
    if(!story||!stage) return;
    start=scrollY+story.getBoundingClientRect().top;
    range=Math.max(1,story.offsetHeight-stage.offsetHeight);
    placeMark();
  }

  function render(){
    raf=0;
    if(!story||!stage||reduce.matches) return;
    const p=clamp((scrollY-start)/range);
    const heroFade=clamp(1-p/.27);
    const dive=clamp((p-.10)/.60);
    const exitIn=clamp((p-.70)/.20);
    const logoFade=1-clamp((p-.70)/.16);
    const scale=1+dive*2.35;
    const y=-dive*46;
    const rot=(p-.35)*2.4;
    const ribbon=(p-.5)*30;

    hero.style.opacity=heroFade.toFixed(3);
    hero.style.transform=`translate3d(0,${(-22*(1-heroFade)).toFixed(1)}px,0)`;
    mark.style.opacity=logoFade.toFixed(3);
    mark.style.transform=`translate3d(-50%,calc(-50% + ${y.toFixed(1)}px),0) rotate(${rot.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
    shadow.style.opacity=(.12*(1-dive*.76)).toFixed(3);
    shadow.style.transform=`translate3d(-50%,${(-dive*22).toFixed(1)}px,0) scale(${(1+dive*.62).toFixed(3)})`;
    exit.style.opacity=exitIn.toFixed(3);
    exit.style.transform=`translate3d(0,${(18*(1-exitIn)).toFixed(1)}px,0)`;
    cue.style.opacity=(1-clamp(p/.12)).toFixed(3);

    stage.style.setProperty('--skm-bg-y',`${(-p*9).toFixed(1)}px`);
    stage.style.setProperty('--skm-horizon-y',`${(p*18).toFixed(1)}px`);
    stage.style.setProperty('--skm-ribbon-x',`${ribbon.toFixed(1)}px`);
    stage.style.setProperty('--skm-ribbon-x-neg',`${(-ribbon).toFixed(1)}px`);
    stage.style.setProperty('--skm-rail-h',`${(p*100).toFixed(1)}%`);

    const idx=Math.min(3,Math.floor(p*4));
    const labels=['01 · Plan','02 · Prepare','03 · Improve','04 · Achieve'];
    if(chapter&&chapter.textContent!==labels[idx]) chapter.textContent=labels[idx];
    window.__scholarkMobileProgress=p;
  }
  function request(){if(!raf) raf=requestAnimationFrame(render)}

  function boot(attempt=0){
    if(!build()){
      if(attempt<80) setTimeout(()=>boot(attempt+1),25);
      return;
    }
    story=q('.skm-story');stage=q('.skm-stage');hero=q('.skm-hero');mark=q('.skm-mark');shadow=q('.skm-mark-shadow');exit=q('.skm-exit');cue=q('.skm-scroll');chapter=q('.skm-chapter');
    if(!story||!stage||!hero||!mark||!exit) return;
    measure();
    if(!reduce.matches){
      addEventListener('scroll',request,{passive:true});
      addEventListener('resize',()=>{measure();request()},{passive:true});
      addEventListener('orientationchange',()=>setTimeout(()=>{measure();request()},160),{passive:true});
      if(document.fonts?.ready) document.fonts.ready.then(()=>{measure();request()}).catch(()=>{});
      request();
    }
    window.ScholarkMobile={version:'1.1.0',refresh:request,measure,get progress(){return clamp((scrollY-start)/range)}};
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>boot(),{once:true}); else boot();
})();
