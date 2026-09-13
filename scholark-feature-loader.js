(() => {
  'use strict';
  if (window.__scholarkFeatureLoaderInstalled) return;
  window.__scholarkFeatureLoaderInstalled = true;

  const BUILD='ai-107';
  const pending=new Map();
  const loaderState={cinematicReadyAt:0,cinematicReadyReason:'pending',aiBootScheduledAt:0,aiBootStartedAt:0,aiReadyAt:0,aiBootError:null};
  const loaded=src=>[...document.scripts].some(s=>s.src&&s.src.includes(src));
  const load=src=>{
    if(loaded(src)) return Promise.resolve();
    return new Promise((resolve,reject)=>{
      const s=document.createElement('script');
      s.src=`${src}?build=${BUILD}`;
      s.defer=true;
      s.addEventListener('load',resolve,{once:true});
      s.addEventListener('error',()=>reject(new Error(`Could not load ${src}`)),{once:true});
      document.head.appendChild(s);
    });
  };

  const notify=name=>{
    try{document.dispatchEvent(new CustomEvent(`scholark:${name}-loaded`));}catch(_){ }
  };

  const suites={
    prep:{files:['prep-v2-data.js','prep-v2-app.js'],ready:()=>!!window.ScholarkPrep,init:()=>{window.ScholarkPrep?.init?.();notify('prep');}},
    ap:{files:['ap-v2-data.js','ap-v2-app.js'],ready:()=>typeof window.initAPHub==='function',init:()=>{window.initAPHub?.();notify('ap');}},
    ai:{
      files:[
        'scholark-ai-algorithms.js','scholark-ai-core.js','scholark-ai-agents.js',
        'scholark-ai-dashboard.js','scholark-ai-bridge.js','scholark-ai-context.js','scholark-ai-reliability.js','scholark-ai-ui.js','scholark-ai-ui-polish.js',
        'scholark-ai-practice.js','scholark-ai-practice-ui.js','scholark-ai-health.js'
      ],
      ready:()=>!!window.ScholarkAIAgents&&!!window.ScholarkAIDashboard&&!!window.ScholarkAIBridge&&!!window.ScholarkAIContext&&!!window.ScholarkAIReliability&&!!window.ScholarkAIUI&&!!window.ScholarkAIUIPolish&&!!window.ScholarkAIPractice&&!!window.ScholarkAIPracticeUI&&!!window.ScholarkAIHealth,
      init:()=>{window.ScholarkAIUI?.enhanceEssay?.();window.ScholarkAIUIPolish?.refresh?.();loaderState.aiReadyAt=performance.now();notify('ai');}
    }
  };

  function ensure(name){
    const suite=suites[name];
    if(!suite) return Promise.resolve(false);
    if(suite.ready()) return Promise.resolve(true);
    if(pending.has(name)) return pending.get(name);
    const promise=suite.files.reduce((p,file)=>p.then(()=>load(file)),Promise.resolve())
      .then(()=>{suite.init();return true;})
      .catch(err=>{
        console.error(`ScholarK ${name} lazy loader failed:`,err);
        if(name!=='ai') window.showToast?.('That study module could not load. Please check your connection and try again.','error');
        throw err;
      })
      .finally(()=>pending.delete(name));
    pending.set(name,promise);
    return promise;
  }

  function installShowPageHook(){
    if(typeof window.showPage!=='function'||window.showPage.__scholarkLazyFeatures) return false;
    const original=window.showPage;
    const wrapped=function(name,...args){
      const suite=suites[name];
      if(!suite||suite.ready()) return original.call(this,name,...args);
      if(!window.currentUser) return original.call(this,name,...args);
      const result=original.call(this,name,...args);
      if(result===false) return false;
      ensure(name).catch(()=>{});
      return true;
    };
    wrapped.__scholarkLazyFeatures=true;
    wrapped.__original=original;
    window.showPage=wrapped;
    return true;
  }

  if(!installShowPageHook()){
    let tries=0;
    const timer=setInterval(()=>{tries++;if(installShowPageHook()||tries>80)clearInterval(timer);},25);
  }
  queueMicrotask(installShowPageHook);
  setTimeout(installShowPageHook,300);
  setTimeout(installShowPageHook,1200);

  let aiBootPromise=null;
  const bootAI=()=>{
    if(aiBootPromise) return aiBootPromise;
    loaderState.aiBootStartedAt=performance.now();
    aiBootPromise=ensure('ai')
      .catch(err=>{
        loaderState.aiBootError={name:err?.name||'Error',message:String(err?.message||err||'unknown').slice(0,300)};
        console.warn('[Scholark AI] optional shell did not load',err);
        throw err;
      });
    return aiBootPromise;
  };

  function afterCinematicReady(options={}){
    const maxWaitMs=Math.max(1500,Number(options.maxWaitMs)||7000);
    return new Promise(resolve=>{
      let settled=false;
      let probeTimer=0;
      let watchedPromise=null;
      const finish=reason=>{
        if(settled)return;
        settled=true;
        clearTimeout(hardTimer);
        if(probeTimer)clearTimeout(probeTimer);
        loaderState.cinematicReadyAt=performance.now();
        loaderState.cinematicReadyReason=reason;
        // Preserve the original S/cinematic's ownership of startup: two full paints occur before AI work.
        requestAnimationFrame(()=>requestAnimationFrame(resolve));
      };
      const hardTimer=setTimeout(()=>finish('bounded-timeout'),maxWaitMs);
      const probe=()=>{
        if(settled)return;
        const cinematic=window.ScholarkV3?.cinematicReady;
        if(cinematic&&typeof cinematic.then==='function'&&cinematic!==watchedPromise){
          watchedPromise=cinematic;
          // Never let a stalled cinematic promise permanently block the optional AI shell.
          Promise.resolve(cinematic).then(()=>finish('cinematic-promise'),()=>finish('cinematic-rejected'));
        }
        if(document.documentElement.classList.contains('scholark-cinematic-ready')){
          finish('ready-class');
          return;
        }
        probeTimer=setTimeout(probe,40);
      };
      probe();
    });
  }

  function scheduleAIBoot(){
    if(loaderState.aiBootScheduledAt)return;
    loaderState.aiBootScheduledAt=performance.now();
    let started=false;
    let idleId=null;
    const start=()=>{
      if(started)return;
      started=true;
      clearTimeout(watchdog);
      if(idleId!==null&&'cancelIdleCallback' in window){try{cancelIdleCallback(idleId);}catch(_){ }}
      bootAI().catch(()=>{});
    };
    // requestIdleCallback is an optimization, not a correctness dependency. The watchdog guarantees boot.
    const watchdog=setTimeout(start,1200);
    if('requestIdleCallback' in window) idleId=requestIdleCallback(start,{timeout:700});
    else setTimeout(start,350);
  }

  // The original Scholark S/cinematic experience owns startup. AI remains additive, but neither a
  // stalled cinematic promise nor a browser idle-callback quirk can block it forever.
  afterCinematicReady().then(scheduleAIBoot,scheduleAIBoot);

  window.ScholarkFeatureLoader={version:'1.4.0',build:BUILD,ensure,installShowPageHook,afterCinematicReady,scheduleAIBoot,state:loaderState};
})();
