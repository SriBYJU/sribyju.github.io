(() => {
  'use strict';
  if (window.__scholarkLegalInstalled) return;
  window.__scholarkLegalInstalled = true;

  const VERSION='2.0.0';
  const KEY='scholark:cookie-consent:v1';
  const defaults={necessary:true,analytics:false,ads:false};
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];

  function forceHttps(){
    if(location.protocol!=='http:')return;
    if(/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname))return;
    location.replace(`https://${location.host}${location.pathname}${location.search}${location.hash}`);
  }

  function readPrefs(){
    try{
      const raw=localStorage.getItem(KEY);
      if(!raw)return null;
      const parsed=JSON.parse(raw);
      return {...defaults,...parsed,ads:false};
    }catch{return null}
  }

  function googleConsent(mode,prefs){
    const value={...defaults,...prefs,ads:false};
    window.dataLayer=window.dataLayer||[];
    window.gtag=window.gtag||function(){window.dataLayer.push(arguments)};
    window.gtag('consent',mode,{
      analytics_storage:value.analytics?'granted':'denied',
      ad_storage:'denied',
      ad_user_data:'denied',
      ad_personalization:'denied',
      functionality_storage:'granted',
      security_storage:'granted'
    });
  }

  function savePrefs(prefs){
    const value={...defaults,...prefs,ads:false,savedAt:new Date().toISOString()};
    try{localStorage.setItem(KEY,JSON.stringify(value))}catch{}
    googleConsent('update',value);
    removeBanner();closeModal();announce('Cookie preferences saved.');
    return value;
  }

  function disableAdvertising(){
    window.SCHOLARK_AD_SLOTS={};
    const remove=()=>{
      $$('ins.adsbygoogle').forEach(el=>el.remove());
      $$('[data-ad-placement],.ad-banner,.ad-reserve').forEach(el=>{
        el.classList.remove('ad-loaded');
        el.removeAttribute('data-ad-placement');
        el.setAttribute('aria-hidden','true');
        el.style.display='none';
      });
      $$('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]').forEach(s=>s.remove());
    };
    remove();
    const mo=new MutationObserver(remove);
    mo.observe(document.documentElement,{subtree:true,childList:true});
    addEventListener('pagehide',()=>mo.disconnect(),{once:true});
  }

  function injectStyles(){
    if($('#scholark-legal-styles'))return;
    const style=document.createElement('style');
    style.id='scholark-legal-styles';
    style.textContent=`
      .sk-legal-banner{position:fixed;left:18px;right:18px;bottom:18px;z-index:4000;display:grid;grid-template-columns:1fr auto;gap:20px;align-items:center;max-width:980px;margin:auto;padding:18px 20px;border:1px solid color-mix(in srgb,var(--border,#ddd) 88%,transparent);border-radius:18px;background:color-mix(in srgb,var(--bg,#faf9f6) 94%,transparent);backdrop-filter:blur(22px) saturate(1.12);box-shadow:0 26px 80px rgba(42,24,14,.18);color:var(--ink,#1a1714)}
      .sk-legal-banner strong{display:block;font-family:var(--font-display,serif);font-size:18px;margin-bottom:3px}.sk-legal-banner p{margin:0;color:var(--ink2,#4a453e);font-size:12px;line-height:1.55;max-width:680px}.sk-legal-banner a{color:var(--accent,#c8622a)}
      .sk-legal-actions{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}.sk-legal-btn{border:1px solid var(--border,rgba(26,23,20,.12));border-radius:999px;background:var(--bg,#faf9f6);color:var(--ink,#1a1714);padding:10px 13px;font:700 11px var(--font-body,sans-serif);cursor:pointer}.sk-legal-btn.primary{background:var(--accent,#c8622a);border-color:var(--accent,#c8622a);color:white}.sk-legal-btn:hover{transform:translateY(-1px)}
      .sk-legal-overlay{position:fixed;inset:0;z-index:4100;display:none;place-items:center;padding:18px;background:rgba(18,14,12,.44);backdrop-filter:blur(8px)}.sk-legal-overlay.open{display:grid}.sk-legal-modal{width:min(560px,100%);max-height:min(760px,90vh);overflow:auto;background:var(--bg,#faf9f6);border:1px solid var(--border,rgba(26,23,20,.12));border-radius:24px;padding:25px;box-shadow:0 30px 100px rgba(0,0,0,.25);color:var(--ink,#1a1714)}.sk-legal-modal h2{font-family:var(--font-display,serif);font-size:29px;margin:0 0 8px}.sk-legal-modal>p{font-size:13px;color:var(--ink2,#4a453e)}
      .sk-pref-row{display:grid;grid-template-columns:1fr auto;gap:18px;align-items:center;padding:15px 0;border-top:1px solid var(--border,rgba(26,23,20,.1))}.sk-pref-row strong{font-size:13px}.sk-pref-row span{display:block;font-size:11px;color:var(--ink3,#8a847b);margin-top:2px}.sk-pref-row input{width:20px;height:20px;accent-color:var(--accent,#c8622a)}.sk-pref-row input:disabled{opacity:.65}.sk-legal-modal-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:18px;flex-wrap:wrap}
      .sk-footer-legal{display:flex;gap:12px;flex-wrap:wrap;align-items:center;font-size:11px;margin-top:10px}.sk-footer-legal a,.sk-footer-legal button{color:inherit;background:none;border:0;padding:0;text-decoration:underline;cursor:pointer;font:inherit}.sk-auth-legal{font-size:11px!important;color:var(--ink3,#8a847b)!important;line-height:1.5!important;margin:9px 0 0!important}.sk-auth-legal a{color:var(--accent,#c8622a)}.sk-sr-live{position:fixed;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
      @media(max-width:720px){.sk-legal-banner{grid-template-columns:1fr;gap:12px;bottom:10px;left:10px;right:10px}.sk-legal-actions{justify-content:stretch}.sk-legal-btn{flex:1}.sk-legal-modal{border-radius:18px;padding:21px}}
      @media(prefers-reduced-motion:reduce){.sk-legal-btn{transition:none!important}.sk-legal-btn:hover{transform:none}}
    `;
    document.head.appendChild(style);
  }

  function announce(text){
    let live=$('#sk-legal-live');
    if(!live){live=document.createElement('div');live.id='sk-legal-live';live.className='sk-sr-live';live.setAttribute('aria-live','polite');document.body.appendChild(live)}
    live.textContent=text;
  }
  function removeBanner(){$('#sk-legal-banner')?.remove()}

  function showBanner(){
    if($('#sk-legal-banner')||readPrefs())return;
    const el=document.createElement('section');
    el.id='sk-legal-banner';el.className='sk-legal-banner';el.setAttribute('role','dialog');el.setAttribute('aria-label','Cookie preferences');
    el.innerHTML=`<div><strong>Your privacy, your choice.</strong><p>Scholark uses necessary browser storage to keep the educational tools working. Optional analytics stays off until you choose otherwise. Scholark is a non-commercial educational project and does not use advertising cookies. See the <a href="privacy.html">Privacy Policy</a>.</p></div><div class="sk-legal-actions"><button class="sk-legal-btn" data-necessary>Necessary only</button><button class="sk-legal-btn" data-manage>Customize</button><button class="sk-legal-btn primary" data-accept>Allow analytics</button></div>`;
    document.body.appendChild(el);
    $('[data-necessary]',el).onclick=()=>savePrefs(defaults);
    $('[data-manage]',el).onclick=openModal;
    $('[data-accept]',el).onclick=()=>savePrefs({necessary:true,analytics:true,ads:false});
  }

  function ensureModal(){
    let overlay=$('#sk-legal-overlay');if(overlay)return overlay;
    overlay=document.createElement('div');overlay.id='sk-legal-overlay';overlay.className='sk-legal-overlay';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','sk-cookie-title');
    overlay.innerHTML=`<div class="sk-legal-modal"><h2 id="sk-cookie-title">Cookie Preferences</h2><p>Choose the optional storage you want Scholark to use. Necessary storage cannot be turned off because it supports authentication, security, preferences, and your consent choice. Scholark does not use advertising cookies.</p><div class="sk-pref-row"><div><strong>Necessary</strong><span>Authentication, security, preferences, and consent state.</span></div><input type="checkbox" checked disabled aria-label="Necessary storage enabled"></div><div class="sk-pref-row"><div><strong>Analytics</strong><span>Optional measurement that can help understand site usage and improve the educational experience.</span></div><input id="sk-pref-analytics" type="checkbox" aria-label="Allow analytics storage"></div><p style="margin-top:12px"><a href="privacy.html">Privacy Policy</a> · <a href="terms.html">Terms &amp; Conditions</a> · <a href="SECURITY.md">Security</a></p><div class="sk-legal-modal-actions"><button class="sk-legal-btn" data-cancel>Cancel</button><button class="sk-legal-btn primary" data-save>Save preferences</button></div></div>`;
    document.body.appendChild(overlay);
    $('[data-cancel]',overlay).onclick=closeModal;
    $('[data-save]',overlay).onclick=()=>savePrefs({necessary:true,analytics:$('#sk-pref-analytics',overlay).checked,ads:false});
    overlay.addEventListener('click',e=>{if(e.target===overlay)closeModal()});
    return overlay;
  }

  function openModal(){
    const prefs=readPrefs()||defaults,overlay=ensureModal();
    $('#sk-pref-analytics',overlay).checked=!!prefs.analytics;
    overlay.classList.add('open');setTimeout(()=>$('#sk-pref-analytics',overlay)?.focus(),0);
  }
  function closeModal(){$('#sk-legal-overlay')?.classList.remove('open')}

  function installAuthDisclosure(){
    const form=$('#auth-form-signup');if(!form)return;
    let p=$('.sk-auth-legal',form);
    if(!p){p=document.createElement('p');p.className='sk-auth-legal';const btn=form.querySelector('.auth-btn');if(btn)form.insertBefore(p,btn);else form.appendChild(p)}
    p.innerHTML='By creating an account or continuing with Google, you agree to the <a href="terms.html" target="_blank" rel="noopener noreferrer">Terms &amp; Conditions</a> and <a href="privacy.html" target="_blank" rel="noopener noreferrer">Privacy Policy</a>. Scholark is an independent, non-commercial student-built educational project, not an incorporated company or employer.';
    $$('p',form).filter(x=>x!==p&&/weekly college tips/i.test(x.textContent||'')).forEach(x=>x.remove());
  }

  function installFooterLinks(){
    $$('footer').forEach(footer=>{
      if($('.sk-footer-legal',footer))return;
      const row=document.createElement('div');row.className='sk-footer-legal';
      row.innerHTML='<a href="privacy.html">Privacy</a><a href="terms.html">Terms</a><a href="SECURITY.md">Security</a><button type="button">Cookie Preferences</button>';
      row.querySelector('button').onclick=openModal;
      const target=footer.querySelector('.footer-bottom')||footer;target.appendChild(row);
    });
  }

  function installSeoFallback(){
    const defs=[
      ['meta','property','og:title','Scholark — Free College Planning & Academic Support'],
      ['meta','property','og:description','Independent, student-built, non-commercial educational tools for GPA planning, admissions research, essays, SAT/ACT prep, AP study, and more.'],
      ['meta','property','og:type','website'],
      ['meta','property','og:url','https://sribyju.github.io/'],
      ['meta','property','og:image','https://sribyju.github.io/scholark-social-preview.jpg'],
      ['meta','name','twitter:card','summary_large_image'],
      ['meta','name','twitter:description','Independent, student-built, non-commercial educational tools for college planning and academic support.'],
      ['meta','name','twitter:image','https://sribyju.github.io/scholark-social-preview.jpg']
    ];
    defs.forEach(([tag,attr,key,val])=>{let m=document.head.querySelector(`${tag}[${attr}="${key}"]`);if(!m){m=document.createElement(tag);m.setAttribute(attr,key);document.head.appendChild(m)}m.content=val});
  }

  function boot(){
    forceHttps();injectStyles();disableAdvertising();
    const current=readPrefs();googleConsent('update',current||defaults);
    installAuthDisclosure();installFooterLinks();installSeoFallback();
    if(location.hash==='#cookie-preferences')setTimeout(openModal,80);else if(!current)setTimeout(showBanner,180);
    document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
    window.openCookiePreferences=openModal;
    window.ScholarkLegal={version:VERSION,openCookiePreferences:openModal,savePrefs,readPrefs,disableAdvertising};
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
