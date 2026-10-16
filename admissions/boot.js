(() => {
'use strict';if(window.ScholarkAdmissions)return;
let pending;const base='admissions/';const script=file=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=base+file+'?v=2.1.3';s.onload=resolve;s.onerror=()=>{s.remove();reject(new Error('The admissions tools could not load. Check your connection and retry.'));};document.head.append(s);});
function ensure(){if(window.ScholarkAdmissionsUI)return Promise.resolve(window.ScholarkAdmissionsUI);if(pending)return pending;const css=document.createElement('link');css.rel='stylesheet';css.href=base+'admissions.css?v=2.1.3';if(!document.querySelector('link[href*="admissions/admissions.css"]'))document.head.append(css);pending=(async()=>{for(const[f,key]of[['activity-engine.js','ScholarkActivities'],['essay-content.js','ScholarkEssayContent'],['essay-engine.js','ScholarkEssayCoach'],['essay-ai.js','ScholarkEssayAI'],['essay-studio.js','ScholarkEssayStudio'],['chances-model.js','ScholarkChances'],['workspace.js','ScholarkAdmissionsUI']])if(!window[key])await script(f);return window.ScholarkAdmissionsUI;})().catch(e=>{pending=null;throw e;});return pending;}
function handle(action){return ensure().then(action).catch(e=>{window.showToast?.(e.message,'error');const status=document.getElementById('sk-lab-status');if(status)status.textContent=e.message;});}
window.ScholarkAdmissions={ensure,open:name=>handle(ui=>ui.open(name)),initEssay:()=>handle(ui=>ui.initEssay()),feedback:()=>handle(async ui=>{
  ui.review();
  // The workspace replaces the legacy button handler. Explicitly invoke its
  // reader companion so load order cannot leave the expanded panel empty.
  try {
    await window.ScholarkFeatureLoader?.ensure('ai');
    return await window.ScholarkAIUI?.reviewEssay?.();
  } catch (_) {
    window.showToast?.('Passage feedback is ready. The expanded reader could not load; check your connection and run feedback again.','error');
  }
}),useEssay:()=>handle(ui=>ui.useEssay()),useActivities:()=>handle(ui=>ui.useActivities()),renderChances:school=>handle(ui=>ui.renderChances(school))};
// This placeholder is below the complete media carousel. No startup work is added
// to the cinematic or its scroll handlers.
const hero=document.getElementById('sk-profile-hero');if(hero){const update=()=>{hero.querySelector('p').textContent=window.currentUser?'Bring your activities, essay, and college planning into one profile.':'Sign in to keep your profile across devices, or try the tools locally.';};update();window.addEventListener('load',update,{once:true});const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)&&window.currentUser){handle(ui=>ui.refreshProfile());observer.disconnect();}});observer.observe(hero);}
const requestedWorkspace=new URL(location.href).searchParams.get('workspace');if(['activities','essay','chances'].includes(requestedWorkspace))handle(ui=>ui.open(requestedWorkspace));
if(new URL(location.href).searchParams.has('mentor'))handle(ui=>ui.openMentor(new URL(location.href).searchParams.get('mentor')));
})();
