(() => {
  'use strict';
  const VERSION='3.3.3';
  const BUILD='5150';
  const MOBILE=matchMedia('(max-width:760px), (pointer:coarse)').matches;
  const STORE_PREFIX='scholark:v3:';
  const EXCLUDED_PAGES=new Set(['ap','prep','sat']);
  const DYNAMIC_PAGES=new Set(['intelligence','careers','methodology']);
  const isSafeStorage=(()=>{try{const k=STORE_PREFIX+'probe';localStorage.setItem(k,'1');localStorage.removeItem(k);return true}catch{return false}})();
  const safeGet=k=>{if(!isSafeStorage)return null;try{return localStorage.getItem(STORE_PREFIX+k)}catch{return null}};
  const safeSet=(k,v)=>{if(!isSafeStorage)return;try{return localStorage.setItem(STORE_PREFIX+k,v)}catch{}};
  const pageName=el=>(el?.id||'').replace(/^page-/,'');
  const activePage=()=>pageName(document.querySelector('.page.active'))||'home';
  const visible=el=>!!el&&!el.hidden&&getComputedStyle(el).display!=='none'&&getComputedStyle(el).visibility!=='hidden';
  const toast=(msg,type='info')=>typeof window.showToast==='function'?window.showToast(msg,type):console[type==='error'?'error':'log'](msg);

  document.documentElement.classList.add('scholark-cinematic-loading');
  if(!document.getElementById('scholark-cinematic-critical')){
    const s=document.createElement('style');s.id='scholark-cinematic-critical';s.textContent='html.scholark-cinematic-loading #page-home>.hero,html.scholark-cinematic-loading #page-home>.trust-bar,html.scholark-cinematic-loading #page-home>.sk3-resume,html.scholark-cinematic-loading #page-home>.sk4-command-center{visibility:hidden!important}html.scholark-cinematic-loading #page-home{min-height:100dvh;background:#faf9f6}';(document.head||document.documentElement).appendChild(s);
  }

  const ensureStylesheet=file=>{
    if(document.querySelector(`link[href*="${file}"]`))return;
    const l=document.createElement('link');l.rel='stylesheet';l.href=`${file}?build=${BUILD}`;(document.head||document.documentElement).appendChild(l);
  };
  const styleFiles=MOBILE
    ? ['scholark-mobile.css']
    : ['scholark-v53.css','scholark-v54.css','scholark-v55.css','scholark-v57.css','scholark-v58.css','scholark-v59.css','scholark-gapfill.css','scholark-v510.css','scholark-v512.css'];
  styleFiles.forEach(ensureStylesheet);

  const loadScript=src=>new Promise((resolve,reject)=>{
    const existing=[...document.scripts].find(s=>s.src&&s.src.includes(src.split('?')[0]));
    if(existing){if(existing.dataset.loaded==='true'||existing.readyState==='complete')return resolve();existing.addEventListener('load',resolve,{once:true});existing.addEventListener('error',reject,{once:true});return;}
    const s=document.createElement('script');s.src=src;s.defer=true;s.addEventListener('load',()=>{s.dataset.loaded='true';resolve();},{once:true});s.addEventListener('error',()=>reject(new Error(`Could not load ${src}`)),{once:true});(document.head||document.documentElement).appendChild(s);
  });

  window.__scholarkV54LoaderInstalled=true;
  window.__scholarkV55LoaderInstalled=true;
  window.__scholarkV56LoaderInstalled=true;
  window.__scholarkV57LoaderInstalled=true;
  window.__scholarkV58LoaderInstalled=true;
  window.__scholarkV59LoaderInstalled=true;

  const desktopCinematic=()=>loadScript(`scholark-v53.js?build=${BUILD}`)
    .then(()=>loadScript(`scholark-v54.js?build=${BUILD}`))
    .then(()=>loadScript(`scholark-v55.js?build=${BUILD}`))
    .then(()=>loadScript(`scholark-v57.js?build=${BUILD}`))
    .then(()=>loadScript(`scholark-v58.js?build=${BUILD}`))
    .then(()=>loadScript(`scholark-v59.js?build=${BUILD}`))
    .then(()=>loadScript(`scholark-v510.js?build=${BUILD}`));

  const mobileCinematic=()=>loadScript(`scholark-mobile.js?build=${BUILD}`);

  const cinematicReady=(MOBILE?mobileCinematic():desktopCinematic())
    .catch(err=>{console.error('Scholark cinematic loader failed:',err);document.documentElement.classList.remove('scholark-cinematic-loading');});

  let v4Promise=null;
  function ensureV4(){
    if(window.ScholarkV4)return Promise.resolve(window.ScholarkV4);
    if(v4Promise)return v4Promise;
    v4Promise=loadScript(`scholark-v4-data.js?build=${BUILD}`)
      .then(()=>loadScript(`scholark-v4.js?build=${BUILD}`))
      .then(()=>window.ScholarkV4||true)
      .catch(err=>{v4Promise=null;console.error('Scholark V4 loader failed:',err);throw err;});
    return v4Promise;
  }

  function markReady(){document.body?.classList.add('scholark-v3');document.documentElement.dataset.scholarkBaseUi=VERSION;}
  function hardenButtons(){
    document.querySelectorAll('button:not([type])').forEach(btn=>btn.type='button');
    document.querySelectorAll('a[target="_blank"]').forEach(a=>{const rel=new Set((a.rel||'').split(/\s+/).filter(Boolean));rel.add('noopener');rel.add('noreferrer');a.rel=[...rel].join(' ');});
    document.querySelectorAll('[onclick]:not(button):not(a):not(input)').forEach(el=>{if(!el.hasAttribute('role'))el.setAttribute('role','button');if(!el.hasAttribute('tabindex'))el.tabIndex=0;if(el.dataset.sk3Keybound)return;el.dataset.sk3Keybound='1';el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();el.click();}});});
  }
  function hardenModals(){document.querySelectorAll('.modal-overlay').forEach(overlay=>{overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');const title=overlay.querySelector('.modal-title,[id$="title"],h2,h3');if(title){if(!title.id)title.id='sk3-modal-title-'+Math.random().toString(36).slice(2,8);overlay.setAttribute('aria-labelledby',title.id);}});}
  function inputKey(el){const pg=pageName(el.closest('.page'))||'global';const tab=el.closest('.tool-panel')?.id||'main';const id=el.id||el.name;return id?`field:${pg}:${tab}:${id}`:null;}
  function shouldPersist(el){if(!(el instanceof HTMLInputElement||el instanceof HTMLSelectElement||el instanceof HTMLTextAreaElement))return false;if(el.type==='password'||el.type==='email'||el.type==='file'||el.type==='hidden')return false;if(el.closest('#authModal,.auth-modal,.essay-editor-wrap,.counselor-msgs'))return false;if(/search|query/i.test(el.id||'')&&!/school|college|university/i.test(el.id||''))return false;return !!inputKey(el);}
  function restoreFields(root=document){root.querySelectorAll('input,select,textarea').forEach(el=>{if(!shouldPersist(el)||el.dataset.sk3Restored)return;el.dataset.sk3Restored='1';const raw=safeGet(inputKey(el));if(raw===null)return;let parsed;try{parsed=JSON.parse(raw)}catch{return}if(el.type==='checkbox'||el.type==='radio')el.checked=!!parsed;else if([...el.options||[]].length&&![...el.options].some(o=>o.value===String(parsed)))return;else el.value=String(parsed);});}
  function installPersistence(){restoreFields();document.addEventListener('input',e=>{const el=e.target;if(shouldPersist(el))safeSet(inputKey(el),JSON.stringify(el.type==='checkbox'||el.type==='radio'?el.checked:el.value));},true);document.addEventListener('change',e=>{const el=e.target;if(shouldPersist(el))safeSet(inputKey(el),JSON.stringify(el.type==='checkbox'||el.type==='radio'?el.checked:el.value));},true);}
  function friendlyPageName(name){const labels={tools:'Calculators',essay:'Essay Coach',dashboard:'Dashboard',profile:'Profile',planner:'Study Planner',apps:'Application Tracker',scholarships:'Scholarships',quiz:'College Match Quiz',community:'Community',counselor:'Admissions Guide',compare:'College Compare',progress:'Progress',intelligence:'College Intelligence',careers:'Career Outcomes'};return labels[name]||String(name||'').replace(/[-_]/g,' ').replace(/\b\w/g,c=>c.toUpperCase());}
  function saveLastPage(name){if(name&&name!=='home'&&!EXCLUDED_PAGES.has(name))safeSet('last-page',name);}
  function installResume(){const name=safeGet('last-page');const home=document.getElementById('page-home');if(!name||!home||!document.getElementById('page-'+name)||home.querySelector('.sk3-resume'))return;const wrap=document.createElement('div');wrap.className='sk3-resume';wrap.innerHTML=`<div class="sk3-resume-inner"><div class="sk3-resume-copy"><div class="sk3-resume-kicker">Pick up where you left off</div><div class="sk3-resume-title">${friendlyPageName(name)}</div></div><button class="sk3-resume-btn" type="button">Continue →</button></div>`;wrap.querySelector('button').addEventListener('click',()=>window.showPage?.(name));const hero=document.querySelector('#page-home>.hero');if(hero)hero.insertAdjacentElement('afterend',wrap);else home.prepend(wrap);}

  function scrollFeatures(){const target=document.querySelector('.skm-tools,.sk6-tools-section,.features-grid,#page-home [data-section="features"]');if(target){target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});return true}return false;}
  function waitForDynamic(name,original,args){
    const started=performance.now();
    ensureV4().catch(()=>{});
    const retry=()=>{const target=document.getElementById('page-'+name);if(target){try{return original.call(window,name,...args)}catch(err){console.error('showPage failed:',err);return false}}if(performance.now()-started<5000)return setTimeout(retry,40);toast('That section is still loading. Please try again in a moment.','info');};
    retry();return true;
  }
  function installNavigationGuards(){
    if(typeof window.showPage==='function'&&!window.showPage.__sk3){const original=window.showPage;const wrapped=function(name,...args){if(name==='features')return scrollFeatures();const target=document.getElementById('page-'+name);if(!target){if(DYNAMIC_PAGES.has(name))return waitForDynamic(name,original,args);toast('That section is still loading. Please try again in a moment.','info');return false;}let result;try{return result=original.call(this,name,...args),result!==false&&(saveLastPage(name),(()=>{try{history.replaceState(null,'','#'+encodeURIComponent(name))}catch{}})(),queueMicrotask(()=>{restoreFields(target);hardenButtons();hardenModals();})),result}catch(err){console.error('showPage failed:',err);toast('That section could not open. Your work is still safe.','error');return false}};wrapped.__sk3=true;window.showPage=wrapped;}
    if(typeof window.switchTab==='function'&&!window.switchTab.__sk3){const original=window.switchTab;const wrapped=function(tab,btn,...rest){if(!document.getElementById('tab-'+tab)){toast('That calculator is still loading.','info');return false}try{const out=original.call(this,tab,btn,...rest);safeSet('last-tool-tab',tab);queueMicrotask(()=>restoreFields(document.getElementById('tab-'+tab)));return out}catch(err){console.error('switchTab failed:',err);toast('That calculator could not open.','error');return false}};wrapped.__sk3=true;window.switchTab=wrapped;}
  }
  function restoreRoute(){
    const raw=decodeURIComponent(location.hash.replace(/^#/,''));
    if(!raw||raw==='home'||EXCLUDED_PAGES.has(raw))return;
    if(DYNAMIC_PAGES.has(raw)&&!document.getElementById('page-'+raw)){
      ensureV4().then(()=>{if(typeof window.showPage==='function'&&document.getElementById('page-'+raw))window.showPage(raw);}).catch(()=>{});
      return;
    }
    if(document.getElementById('page-'+raw)&&typeof window.showPage==='function')window.showPage(raw);
  }
  function installKeyboard(){document.addEventListener('keydown',e=>{if(e.key==='Escape'){const modal=document.querySelector('.modal-overlay.open');if(modal&&typeof window.closeAuth==='function')window.closeAuth();document.querySelector('.profile-dropdown.open')?.classList.remove('open');if(typeof window.closeMobileNav==='function')window.closeMobileNav();}if(e.key==='/'&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName||'')){const search=[...document.querySelectorAll('input[type=search],input[placeholder*="Search" i]')].find(visible);if(search){e.preventDefault();search.focus();}}});}
  function installMutationRepair(){let queued=false;const observer=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;hardenButtons();hardenModals();restoreFields();});});observer.observe(document.body,{subtree:true,childList:true});}
  function patchKnownEdgeCases(){if(typeof window.calcGoalProjection==='function'&&!window.calcGoalProjection.__sk3){const original=window.calcGoalProjection;const wrapped=function(...args){try{return original.apply(this,args)}catch(err){console.error('Goal projection failed:',err);toast('Projection could not be calculated from those values.','error');return false}};wrapped.__sk3=true;window.calcGoalProjection=wrapped;}if(typeof window.deleteSavedItem==='function'&&!window.deleteSavedItem.__sk3){const original=window.deleteSavedItem;const wrapped=function(id,...args){if(!id){toast('That saved result could not be identified.','error');return false}return original.call(this,id,...args)};wrapped.__sk3=true;window.deleteSavedItem=wrapped;}}
  function installRuntimeGuard(){window.addEventListener('unhandledrejection',e=>console.error('Unhandled Scholark promise rejection:',e.reason));window.addEventListener('error',e=>{if(e.error)console.error('Scholark runtime error:',e.error);});}
  function boot(){markReady();hardenButtons();hardenModals();installPersistence();installNavigationGuards();patchKnownEdgeCases();installKeyboard();installResume();installRuntimeGuard();installMutationRepair();requestAnimationFrame(restoreRoute);window.ScholarkV3={version:VERSION,build:BUILD,mobile:MOBILE,restoreFields,activePage,ensureV4,cinematicReady};}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();