(() => {
  'use strict';
  if (window.__scholarkV59Installed) return;
  window.__scholarkV59Installed = true;

  const VERSION = '5.9.1';
  const q = (s, r = document) => r.querySelector(s);
  const qa = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const coarsePointer = matchMedia('(pointer: coarse)');

  function ensureStyles() {
    if (q('link[href*="scholark-v59.css"]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'scholark-v59.css';
    document.head.appendChild(link);
  }

  function route(page, tab) {
    if (!page) return false;
    if (window.ScholarkV5?.go) return window.ScholarkV5.go(page, tab);
    if (typeof window.showPage !== 'function') return false;
    const result = window.showPage(page);
    if (tab) queueMicrotask(() => window.switchTab?.(tab));
    return result !== false;
  }

  function disableMonetization() {
    document.body.classList.add('scholark-noncommercial');
    window.SCHOLARK_AD_SLOTS = {};
    const remove = () => {
      qa('ins.adsbygoogle').forEach(el => el.remove());
      qa('[data-ad-placement],.ad-banner,.ad-reserve').forEach(el => {
        el.classList.remove('ad-loaded');
        el.removeAttribute('data-ad-placement');
        el.setAttribute('aria-hidden','true');
      });
      qa('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]').forEach(s => s.remove());
    };
    remove();
    const observer = new MutationObserver(remove);
    observer.observe(document.documentElement,{subtree:true,childList:true});
    window.addEventListener('pagehide',()=>observer.disconnect(),{once:true});
  }

  function disclosureHTML(extraClass='') {
    return `<div class="sk12-project-status ${extraClass}">
      <div class="sk12-status-mark" aria-hidden="true">S</div>
      <div><strong>Independent educational project — not a company</strong>
      <p>Scholark is an independent, student-built, non-commercial educational project. It is not an incorporated company, business, employer, or revenue-generating operation, and it does not sell paid access or services. The platform exists to provide free educational planning and academic-support tools for students. <a href="terms.html">Terms</a> · <a href="privacy.html">Privacy</a> · <a href="security.html">Security</a></p></div>
    </div>`;
  }

  function installProjectDisclosures() {
    const finalCopy = q('.sk6-final-inner > p');
    if (finalCopy) {
      finalCopy.classList.add('sk12-final-status');
      finalCopy.textContent = 'Independent, student-built educational project · Not an incorporated company or employer · Not revenue-generating · Free for educational use.';
    }

    const about = q('#page-about');
    if (about && !q('.sk12-project-status', about)) {
      const firstSection = q('.about-section', about) || about.firstElementChild;
      const wrapper = document.createElement('div');
      wrapper.innerHTML = disclosureHTML('compact');
      const status = wrapper.firstElementChild;
      if (firstSection?.parentNode) firstSection.parentNode.insertBefore(status, firstSection);
      else about.prepend(status);
    }

    qa('footer').forEach(footer => {
      if (q('.sk12-project-status.footer-status', footer)) return;
      const wrap = document.createElement('div');
      wrap.innerHTML = disclosureHTML('footer-status');
      const status = wrap.firstElementChild;
      const bottom = q('.footer-bottom', footer);
      if (bottom) footer.insertBefore(status,bottom); else footer.appendChild(status);
    });
  }

  const nodes = [
    {n:'01',title:'Plan',sub:'GPA + goals'},
    {n:'02',title:'Research',sub:'Colleges + careers'},
    {n:'03',title:'Prepare',sub:'SAT + AP'},
    {n:'04',title:'Apply',sub:'Essays + decisions'}
  ];

  function pathScene() {
    return `<div class="sk12-path-scene" aria-hidden="true">
      <span class="sk12-cloud c1"></span><span class="sk12-cloud c2"></span>
      <div class="sk12-path-line"></div>
      ${nodes.map((x,i)=>`<div class="sk12-path-node n${i+1}"><b>${x.n}</b><strong>${x.title}</strong><span>${x.sub}</span></div>`).join('')}
      <div class="sk12-campus-horizon"></div>
    </div>`;
  }

  function makeBridge({tone='',eyebrow,title,emphasis,copy,actions}) {
    const section = document.createElement('section');
    section.className = `sk12-continuity${tone?' '+tone:''}`;
    section.innerHTML = `<div class="sk12-continuity-inner">
      <div class="sk12-continuity-copy">
        <small>${eyebrow}</small>
        <h3>${title}<br><em>${emphasis}</em></h3>
        <p>${copy}</p>
        <div class="sk12-mini-actions">${actions.map(a=>`<button type="button" data-page="${a.page}"${a.tab?` data-tab="${a.tab}"`:''}>${a.label}</button>`).join('')}</div>
      </div>${pathScene()}</div>`;
    qa('[data-page]',section).forEach(btn=>btn.addEventListener('click',()=>route(btn.dataset.page,btn.dataset.tab||undefined)));
    return section;
  }

  function installContinuityScenes() {
    const journey = q('.sk6-journey-section');
    const fit = q('.sk6-fit-scene');
    const tools = q('.sk6-tools-section');
    if (journey && fit && !q('.sk12-continuity[data-sk12="journey-fit"]')) {
      const bridge = makeBridge({
        eyebrow:'From plan to possibility',
        title:'Turn ambition into',
        emphasis:'a clearer next step.',
        copy:'Your academic plan, college research, test preparation, and writing should feel like one connected path — not four disconnected websites.',
        actions:[
          {label:'Set a GPA goal',page:'goals'},
          {label:'Compare colleges',page:'compare'},
          {label:'Plan applications',page:'apps'}
        ]
      });
      bridge.dataset.sk12='journey-fit';
      fit.parentNode.insertBefore(bridge,fit);
    }
    if (fit && tools && !q('.sk12-continuity[data-sk12="fit-tools"]')) {
      const bridge = makeBridge({
        tone:'deep',
        eyebrow:'One workspace, many decisions',
        title:'Research it. Practice it.',
        emphasis:'Then do the work.',
        copy:'The cinematic layer always hands you back to a real Scholark tool. Motion supports the workflow; it never replaces it.',
        actions:[
          {label:'Open SAT prep',page:'prep'},
          {label:'Open AP study',page:'ap'},
          {label:'Open Essay Coach',page:'essay'}
        ]
      });
      bridge.dataset.sk12='fit-tools';
      tools.parentNode.insertBefore(bridge,tools);
    }
  }

  let raf = 0;
  function applyMotion() {
    raf = 0;
    qa('.sk12-continuity').forEach(section => {
      const r = section.getBoundingClientRect();
      const p = clamp((innerHeight-r.top)/Math.max(1,innerHeight+r.height));
      section.style.setProperty('--sk12-p',p.toFixed(4));
    });
  }
  function requestMotion(){if(!raf)raf=requestAnimationFrame(applyMotion)}

  function installPointerDepth() {
    if (reduceMotion.matches || coarsePointer.matches) return;
    qa('.sk12-continuity').forEach(section => {
      section.addEventListener('pointermove',event=>{
        const r=section.getBoundingClientRect();
        const x=clamp((event.clientX-r.left)/Math.max(1,r.width));
        const y=clamp((event.clientY-r.top)/Math.max(1,r.height));
        section.style.setProperty('--sk12-px',((x-.5)*2).toFixed(3));
        section.style.setProperty('--sk12-py',((y-.5)*2).toFixed(3));
      },{passive:true});
      section.addEventListener('pointerleave',()=>{
        section.style.setProperty('--sk12-px','0');
        section.style.setProperty('--sk12-py','0');
      },{passive:true});
    });
  }

  function runAudit() {
    const root = q('.sk6-experience');
    const sections = root ? [...root.children].filter(el=>el.tagName==='SECTION') : [];
    const largeGaps=[];
    for(let i=1;i<sections.length;i++){
      const a=sections[i-1].getBoundingClientRect(),b=sections[i].getBoundingClientRect();
      const gap=Math.round(b.top-a.bottom);
      if(gap>180)largeGaps.push({after:sections[i-1].className,before:sections[i].className,gap});
    }
    const report={
      version:VERSION,
      projectDisclosureCount:qa('.sk12-project-status').length,
      finalDisclosure:!!q('.sk12-final-status'),
      adScripts:qa('script[src*="googlesyndication.com/pagead/js/adsbygoogle.js"]').length,
      adNodes:qa('ins.adsbygoogle').length,
      continuityScenes:qa('.sk12-continuity').length,
      largeGaps,
      reducedMotion:reduceMotion.matches,
      checkedAt:new Date().toISOString()
    };
    window.ScholarkV59Audit=report;
    if(report.adScripts||report.adNodes||largeGaps.length)console.warn('[Scholark V5.9] audit warnings',report);
    else console.info('[Scholark V5.9] audit PASS',report);
    return report;
  }

  function boot() {
    ensureStyles();
    const root=q('.sk6-experience');
    if(!root)return setTimeout(boot,45);
    if(root.dataset.sk12Ready)return;
    root.dataset.sk12Ready='1';
    document.body.classList.add('scholark-v59');
    document.documentElement.dataset.scholarkUi=VERSION;

    disableMonetization();
    installProjectDisclosures();
    installContinuityScenes();
    installPointerDepth();
    addEventListener('scroll',requestMotion,{passive:true});
    addEventListener('resize',requestMotion,{passive:true});
    applyMotion();
    setTimeout(runAudit,500);

    window.ScholarkV59={version:VERSION,audit:runAudit,route};
  }

  ensureStyles();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();