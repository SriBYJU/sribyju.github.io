(() => {
  'use strict';
  if (window.__scholarkMobileInstalled) return;
  window.__scholarkMobileInstalled = true;

  const mobile=matchMedia('(max-width:760px), (pointer:coarse)');
  if(!mobile.matches) return;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
  const q=(s,r=document)=>r.querySelector(s);

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
    const attempt=(n=0)=>{
      if(typeof window.showPage==='function'&&document.getElementById('page-'+page)){
        window.showPage(page);
        queueMicrotask(()=>{ if(tab) window.switchTab?.(tab); });
        return;
      }
      if(n<70) return setTimeout(()=>attempt(n+1),40);
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
    document.documentElement.dataset.scholarkMobile='cinematic-1';

    const root=document.createElement('main');
    root.className='skm-experience';
    root.innerHTML=`
      <section class="skm-story" aria-label="ScholarK interactive introduction">
        <div class="skm-stage">
          <div class="skm-hero">
            <div class="skm-eyebrow">Plan · Prepare · Improve · Achieve</div>
            <h1>A brighter <em>path forward.</em></h1>
            <p>Free, student-built college planning and academic support — all in one ScholarK system.</p>
            <div class="skm-actions"><button class="skm-btn primary" type="button" data-skm-go="tools" data-skm-tab="gpa">Explore tools ↗</button><button class="skm-btn secondary" type="button" data-skm-go="features">See everything</button></div>
          </div>
          <div class="skm-mark"><img src="scholark-mark.svg" alt="" aria-hidden="true"></div>
          <div class="skm-mark-shadow" aria-hidden="true"></div>
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

  let story,stage,hero,mark,shadow,exit,cue,start=0,range=1,raf=0;

  function measure(){
    if(!story||!stage) return;
    start=scrollY+story.getBoundingClientRect().top;
    range=Math.max(1,story.offsetHeight-stage.offsetHeight);
  }

  function render(){
    raf=0;
    if(!story||!stage||reduce.matches) return;
    const p=clamp((scrollY-start)/range);
    const heroFade=clamp(1-p/.29);
    const dive=clamp((p-.10)/.58);
    const exitIn=clamp((p-.72)/.20);
    const logoFade=1-clamp((p-.69)/.17);
    const scale=1+dive*2.05;
    const y=-dive*42;

    hero.style.opacity=heroFade.toFixed(3);
    hero.style.transform=`translate3d(0,${(-18*(1-heroFade)).toFixed(1)}px,0)`;
    mark.style.opacity=logoFade.toFixed(3);
    mark.style.transform=`translate3d(-50%,calc(-50% + ${y.toFixed(1)}px),0) scale(${scale.toFixed(3)})`;
    shadow.style.opacity=(.13*(1-dive*.72)).toFixed(3);
    shadow.style.transform=`translate3d(-50%,${(-dive*20).toFixed(1)}px,0) scale(${(1+dive*.55).toFixed(3)})`;
    exit.style.opacity=exitIn.toFixed(3);
    exit.style.transform=`translate3d(0,${(16*(1-exitIn)).toFixed(1)}px,0)`;
    cue.style.opacity=(1-clamp(p/.12)).toFixed(3);
    stage.style.setProperty('--skm-p',p.toFixed(3));
  }
  function request(){if(!raf) raf=requestAnimationFrame(render)}

  function boot(attempt=0){
    if(!build()){
      if(attempt<80) setTimeout(()=>boot(attempt+1),25);
      return;
    }
    story=q('.skm-story');stage=q('.skm-stage');hero=q('.skm-hero');mark=q('.skm-mark');shadow=q('.skm-mark-shadow');exit=q('.skm-exit');cue=q('.skm-scroll');
    if(!story||!stage||!hero||!mark||!exit) return;
    measure();
    if(!reduce.matches){
      addEventListener('scroll',request,{passive:true});
      addEventListener('resize',()=>{measure();request()},{passive:true});
      addEventListener('orientationchange',()=>setTimeout(()=>{measure();request()},140),{passive:true});
      request();
    }
    window.ScholarkMobile={version:'1.0.0',refresh:request,measure,get progress(){return clamp((scrollY-start)/range)}};
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>boot(),{once:true}); else boot();
})();
