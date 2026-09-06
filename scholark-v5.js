(() => {
  'use strict';
  if (window.__scholarkV5Installed) return;
  window.__scholarkV5Installed = true;
  const VERSION = '5.0.0';
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
  const lerp=(a,b,t)=>a+(b-a)*t;
  const ease=t=>1-Math.pow(1-clamp(t),3);
  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>[...r.querySelectorAll(s)];

  function loadStyles(){
    if(!q('link[href="scholark-v5.css"]')){
      const l=document.createElement('link'); l.rel='stylesheet'; l.href='scholark-v5.css'; document.head.appendChild(l);
    }
    document.body.classList.add('scholark-v5');
    document.documentElement.dataset.scholarkUi='5.0.0';
  }

  function go(page,tab){
    if(typeof window.showPage==='function') window.showPage(page);
    if(tab) setTimeout(()=>{ try{ window.switchTab?.(tab); }catch{} },0);
  }

  const tools=[
    {i:'01',icon:'📊',title:'GPA Calculator',desc:'Semester and cumulative GPA with instant feedback.',action:()=>go('tools','gpa'),cls:'large',visual:true},
    {i:'02',icon:'⭐',title:'Weighted GPA',desc:'AP, IB, Honors and dual-enrollment weighting on a 5.0 scale.',action:()=>go('tools','wgpa')},
    {i:'03',icon:'🏫',title:'College Chances',desc:'Pressure-test your profile against a 200+ university dataset.',action:()=>go('tools','chances'),cls:'dark tall',visual:true},
    {i:'04',icon:'✍️',title:'Essay Rubric Coach',desc:'Private, on-device feedback that keeps your draft yours.',action:()=>go('essay'),cls:'accent'},
    {i:'05',icon:'🎯',title:'GPA Goal Tracker',desc:'Turn a target into the exact grades and scenarios you need.',action:()=>go('goals')},
    {i:'06',icon:'📝',title:'SAT / ACT Prep',desc:'Diagnostics, mastery, adaptive plans, practice and full tests.',action:()=>go('prep'),cls:'large',visual:true},
    {i:'07',icon:'📚',title:'AP Study Studio',desc:'Adaptive practice, task labs and unit courses across AP subjects.',action:()=>go('ap')},
    {i:'08',icon:'⚖️',title:'College Compare',desc:'Side-by-side tradeoffs with visual comparison tools.',action:()=>go('compare')},
    {i:'09',icon:'🔬',title:'College Intelligence',desc:'Public-data decision workspace for cost, outcomes and selectivity.',action:()=>go('intelligence'),cls:'dark large',visual:true},
    {i:'10',icon:'🧠',title:'Career Outcomes',desc:'BLS-backed pathways, pay, growth, skills and major connections.',action:()=>go('careers')},
    {i:'11',icon:'🧩',title:'College Quiz',desc:'Translate your preferences into a college-fit starting point.',action:()=>go('quiz')},
    {i:'12',icon:'🧭',title:'Admissions Guide',desc:'Private, curated guidance for strategy, aid, essays and interviews.',action:()=>go('counselor')}
  ];

  function visualBars(seed){
    const vals=[[40,78,55,88,70,94],[82,56,92,68,78,48],[32,50,74,60,90,82]][seed%3];
    return `<div class="sk5-card-visual"><div class="sk5-mini-chart">${vals.map(v=>`<i style="--h:${v}%"></i>`).join('')}</div></div>`;
  }

  function buildHome(){
    const home=q('#page-home'); if(!home || q('.sk5-experience',home)) return;
    home.classList.add('sk5-home');
    const root=document.createElement('div'); root.className='sk5-experience';
    root.innerHTML=`
      <div class="sk5-film-grain" aria-hidden="true"></div>
      <section class="sk5-logo-journey" aria-label="Scholark introduction">
        <div class="sk5-sticky">
          <div class="sk5-orbit" aria-hidden="true"></div>
          <div class="sk5-logo-stage" aria-hidden="true">
            <div class="sk5-logo-stack">
              ${[26,22,18,14,10,6].map(d=>`<img class="sk5-logo-depth" src="scholark-mark.svg" alt="" style="--d:${d}px">`).join('')}
              <img class="sk5-logo-face" src="scholark-mark.svg" alt="">
              <span class="sk5-logo-glint"></span>
            </div>
          </div>
          <div class="sk5-intro-copy">
            <div class="sk5-intro-kicker">Free college planning, rebuilt around students</div>
            <div class="sk5-wordmark">
              <h1>Scholar<em>k</em></h1>
              <p>One student-built workspace for grades, applications, essays, test prep, college research and what comes next.</p>
            </div>
          </div>
          <div class="sk5-dive-copy">
            <div class="sk5-dive-copy-inner">
              <div class="line">Your whole college journey.</div>
              <div class="line"><em>One place.</em></div>
              <div class="sub">Scroll through the Scholark mark and the toolkit opens around you — from the first GPA calculation to a real college decision.</div>
            </div>
          </div>
          <div class="sk5-scroll-cue"><span>Scroll to enter</span><div class="sk5-scroll-arrow"></div></div>
          <div class="sk5-progress-rail"><span></span></div>
        </div>
      </section>

      <section class="sk5-manifesto">
        <div class="sk5-manifesto-top">
          <div class="sk5-reveal">
            <div class="sk5-section-index">02 / Why Scholark</div>
            <h2>Think it.<br><em>Plan it.</em><br>Make it real.</h2>
          </div>
          <div class="sk5-manifesto-side sk5-reveal" data-delay="1">
            <p><strong>No paywall on the core toolkit.</strong> No need to stitch together ten tabs, five spreadsheets and three study apps. Scholark connects the work students are already doing into one fast, privacy-conscious workspace.</p>
          </div>
        </div>
        <div class="sk5-metric-ribbon" aria-hidden="true"><div class="sk5-ribbon-track">
          <span><b>10,000+</b> students monthly</span><span><b>200+</b> universities tracked</span><span><b>23</b> AP subjects</span><span><b>100%</b> free core toolkit</span><span><b>ON-DEVICE</b> essay feedback</span>
          <span><b>10,000+</b> students monthly</span><span><b>200+</b> universities tracked</span><span><b>23</b> AP subjects</span><span><b>100%</b> free core toolkit</span><span><b>ON-DEVICE</b> essay feedback</span>
        </div></div>
      </section>

      <section class="sk5-tool-universe">
        <div class="sk5-tool-head">
          <div class="sk5-reveal"><div class="sk5-section-index">03 / The toolkit</div><h2>Everything moves <em>with you.</em></h2></div>
          <p class="sk5-reveal" data-delay="1">Every card below is live. Open a tool, do the work, and come back without losing the flow.</p>
        </div>
        <div class="sk5-tool-grid">
          ${tools.map((t,n)=>`<article class="sk5-tool-card ${t.cls||''} sk5-reveal" data-tool="${n}" data-delay="${n%4}">
            ${t.visual?visualBars(n):''}<div><div class="sk5-tool-card-index">${t.i} / 12</div><div class="sk5-tool-card-icon">${t.icon}</div></div>
            <div><h3>${t.title}</h3><p>${t.desc}</p></div><div class="sk5-tool-card-arrow">↗</div>
          </article>`).join('')}
        </div>
      </section>

      <section class="sk5-proof-scene">
        <img class="sk5-proof-mark" src="scholark-mark.svg" alt="" aria-hidden="true">
        <div class="sk5-proof-inner">
          <div class="sk5-section-index sk5-reveal">04 / Start anywhere</div>
          <h2 class="sk5-proof-line sk5-reveal">Less switching.<br>More <em>moving forward.</em></h2>
          <div class="sk5-proof-stats">
            <div class="sk5-proof-stat sk5-reveal"><strong>10K+</strong><span>monthly students</span></div>
            <div class="sk5-proof-stat sk5-reveal" data-delay="1"><strong>200+</strong><span>universities in dataset</span></div>
            <div class="sk5-proof-stat sk5-reveal" data-delay="2"><strong>23</strong><span>AP subjects</span></div>
            <div class="sk5-proof-stat sk5-reveal" data-delay="3"><strong>$0</strong><span>core toolkit price</span></div>
          </div>
          <div class="sk5-final-row sk5-reveal">
            <p class="sk5-final-copy">Built by a student for the decisions students actually have to make — with calculators, preparation, planning and research in one recognizable Scholark system.</p>
            <div class="sk5-final-actions"><button class="sk5-cta primary" data-start>Open the toolkit →</button><button class="sk5-cta secondary" data-features>See every feature</button></div>
          </div>
        </div>
      </section>`;
    home.prepend(root);
    qa('[data-tool]',root).forEach(card=>card.addEventListener('click',()=>tools[+card.dataset.tool]?.action()));
    q('[data-start]',root)?.addEventListener('click',()=>go('tools','gpa'));
    q('[data-features]',root)?.addEventListener('click',()=>go('features'));
  }

  let journey=null, sticky=null, ribbon=null, raf=0;
  function updateMotion(){
    raf=0;
    if(!journey || !sticky) return;
    const rect=journey.getBoundingClientRect();
    const max=Math.max(1,journey.offsetHeight-innerHeight);
    const p=clamp(-rect.top/max);
    const dive=ease(clamp((p-.18)/.62));
    const intro=1-ease(clamp((p-.04)/.18));
    const diveCopy=ease(clamp((p-.48)/.20))*(1-ease(clamp((p-.82)/.15))*.25);
    const scale=lerp(1,9.8,dive);
    const rx=lerp(0,18,dive);
    const ry=lerp(0,-23,dive);
    const rz=lerp(0,-10,dive);
    const x=lerp(0,-12,dive);
    const y=lerp(0,10,dive);
    const logoOpacity=1-ease(clamp((p-.72)/.22));
    sticky.style.setProperty('--sk5-progress',(p*100).toFixed(2)+'%');
    sticky.style.setProperty('--sk5-logo-scale',scale.toFixed(3));
    sticky.style.setProperty('--sk5-logo-rx',rx.toFixed(2)+'deg');
    sticky.style.setProperty('--sk5-logo-ry',ry.toFixed(2)+'deg');
    sticky.style.setProperty('--sk5-logo-rz',rz.toFixed(2)+'deg');
    sticky.style.setProperty('--sk5-logo-x',x.toFixed(2)+'vw');
    sticky.style.setProperty('--sk5-logo-y',y.toFixed(2)+'vh');
    sticky.style.setProperty('--sk5-logo-opacity',logoOpacity.toFixed(3));
    sticky.style.setProperty('--sk5-intro-opacity',intro.toFixed(3));
    sticky.style.setProperty('--sk5-intro-y',lerp(0,-32,1-intro).toFixed(1)+'px');
    sticky.style.setProperty('--sk5-dive-opacity',diveCopy.toFixed(3));
    sticky.style.setProperty('--sk5-dive-scale',lerp(.94,1,diveCopy).toFixed(3));
    sticky.style.setProperty('--sk5-scroll-cue',(1-ease(clamp(p/.10))).toFixed(3));
    sticky.style.setProperty('--sk5-orbit',(p*210).toFixed(2)+'deg');
    sticky.style.setProperty('--sk5-orbit-opacity',(1-ease(clamp((p-.63)/.20))).toFixed(3));
    sticky.style.setProperty('--sk5-glint',lerp(-70,85,p).toFixed(1)+'%');
    document.body.classList.toggle('sk5-scrolled',scrollY>36);
    if(ribbon){
      const rr=ribbon.getBoundingClientRect();
      const rp=clamp((innerHeight-rr.top)/(innerHeight+rr.height));
      ribbon.style.setProperty('--sk5-ribbon-x',lerp(0,-28,rp)+'vw');
    }
  }
  function requestMotion(){ if(!raf) raf=requestAnimationFrame(updateMotion); }

  function installReveal(){
    if(reduceMotion){qa('.sk5-reveal').forEach(x=>x.classList.add('sk5-visible'));return}
    const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('sk5-visible');io.unobserve(e.target)}}),{threshold:.12,rootMargin:'0px 0px -8%'});
    qa('.sk5-reveal').forEach(x=>io.observe(x));
  }

  function installPointer(){
    if(reduceMotion || matchMedia('(pointer:coarse)').matches) return;
    document.addEventListener('pointermove',e=>{
      const x=e.clientX/innerWidth, y=e.clientY/innerHeight;
      sticky?.style.setProperty('--sk5-pointer-x',(x*100).toFixed(1)+'%');
      sticky?.style.setProperty('--sk5-pointer-y',(y*100).toFixed(1)+'%');
      qa('.sk5-tool-card:hover').forEach(card=>{
        const r=card.getBoundingClientRect(); const cx=(e.clientX-r.left)/r.width-.5, cy=(e.clientY-r.top)/r.height-.5;
        card.style.setProperty('--sk5-card-rx',(-cy*5).toFixed(2)+'deg');card.style.setProperty('--sk5-card-ry',(cx*7).toFixed(2)+'deg');
      });
    },{passive:true});
    document.addEventListener('pointerout',e=>{const card=e.target.closest?.('.sk5-tool-card');if(card){card.style.setProperty('--sk5-card-rx','0deg');card.style.setProperty('--sk5-card-ry','0deg')}});
  }

  function syncPageState(){
    const home=q('#page-home');
    document.body.classList.toggle('sk5-home-active',!!home?.classList.contains('active'));
    requestMotion();
  }
  function hookNavigation(){
    if(typeof window.showPage!=='function' || window.showPage.__sk5) return;
    const original=window.showPage;
    const wrapped=function(...args){const out=original.apply(this,args);queueMicrotask(syncPageState);return out};
    wrapped.__sk5=true;window.showPage=wrapped;
  }

  function boot(){
    loadStyles();buildHome();
    journey=q('.sk5-logo-journey');sticky=q('.sk5-sticky');ribbon=q('.sk5-metric-ribbon');
    installReveal();installPointer();hookNavigation();syncPageState();
    addEventListener('scroll',requestMotion,{passive:true});addEventListener('resize',requestMotion,{passive:true});
    updateMotion();
    window.ScholarkV5={version:VERSION,refresh:updateMotion};
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
