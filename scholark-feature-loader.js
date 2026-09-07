(() => {
  'use strict';
  if (window.__scholarkFeatureLoaderInstalled) return;
  window.__scholarkFeatureLoaderInstalled = true;

  const BUILD='5160';
  const pending=new Map();
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

  const suites={
    prep:{files:['prep-v2-data.js','prep-v2-app.js'],ready:()=>!!window.ScholarkPrep,init:()=>window.ScholarkPrep?.init?.()},
    ap:{files:['ap-v2-data.js','ap-v2-app.js'],ready:()=>typeof window.initAPHub==='function',init:()=>window.initAPHub?.()}
  };

  function ensure(name){
    const suite=suites[name];
    if(!suite) return Promise.resolve(false);
    if(suite.ready()) return Promise.resolve(true);
    if(pending.has(name)) return pending.get(name);
    const promise=suite.files.reduce((p,file)=>p.then(()=>load(file)),Promise.resolve())
      .then(()=>{suite.init();return true;})
      .catch(err=>{console.error(`ScholarK ${name} lazy loader failed:`,err);window.showToast?.('That study module could not load. Please check your connection and try again.','error');throw err;})
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
      // Preserve the normal authentication gate. Do not download a large study engine for a visitor
      // who cannot enter the feature page yet.
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

  // The main inline app defines showPage before this deferred script runs. Retry briefly in case
  // another enhancement replaces it during the same boot turn.
  if(!installShowPageHook()){
    let tries=0;
    const timer=setInterval(()=>{tries++;if(installShowPageHook()||tries>80)clearInterval(timer);},25);
  }
  queueMicrotask(installShowPageHook);
  setTimeout(installShowPageHook,300);
  setTimeout(installShowPageHook,1200);

  window.ScholarkFeatureLoader={version:'1.0.0',ensure,installShowPageHook};
})();
