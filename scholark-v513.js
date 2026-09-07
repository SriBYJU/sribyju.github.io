(() => {
  'use strict';
  if (window.__scholarkV513Installed) return;
  window.__scholarkV513Installed = true;

  const mobile = matchMedia('(max-width:760px), (pointer:coarse)');
  if (!mobile.matches) return;

  if (!document.querySelector('link[href*="scholark-v514.css"]')) {
    const l=document.createElement('link');
    l.rel='stylesheet';
    l.href='scholark-v514.css?build=5140';
    (document.head||document.documentElement).appendChild(l);
  }

  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const q = (s, r=document) => r.querySelector(s);
  const qa = (s, r=document) => [...r.querySelectorAll(s)];
  const clamp = (n,a=0,b=1) => Math.max(a,Math.min(b,n));
  let story, sticky, raf=0;

  function prune(){
    qa([
      '.sk6-grain','.sk6-cloud','.sk6-ray','.sk6-dust-field','.sk6-book-stack','.sk6-leaf',
      '.sk6-float-field','.sk6-through-copy','.sk6-wave-scene','.sk6-orbit-scene','.sk9-observatory',
      '.sk6-logo-depth','.sk6-portal-ring','.sk6-glint','.sk6-core-glow','.sk6-final-halo'
    ].join(',')).forEach(el => el.remove());
    document.body?.classList.add('scholark-mobile-safe');
    document.documentElement.dataset.scholarkMobile = 'safe-514';
  }

  function set(name,val){ sticky?.style.setProperty(name,val); }

  function render(){
    raf=0;
    if (!story || !sticky || reduce.matches) return;
    const rect = story.getBoundingClientRect();
    const max = Math.max(1, story.offsetHeight - innerHeight);
    const p = clamp(-rect.top / max);

    const hero = clamp(1 - p / .30);
    const heroY = -18 * clamp(p / .30);
    const dive = clamp((p - .11) / .56);
    const scale = 1 + dive * .95;
    const logoY = -38 * dive;
    const logoOpacity = 1 - clamp((p - .69) / .15);
    const exit = clamp((p - .72) / .20);
    const exitY = 16 * (1 - exit);
    const worldY = -10 * clamp(p / .65);

    set('--skm-hero', hero.toFixed(3));
    set('--skm-hero-y', heroY.toFixed(1)+'px');
    set('--skm-logo-scale', scale.toFixed(3));
    set('--skm-logo-y', logoY.toFixed(1)+'px');
    set('--skm-logo-opacity', logoOpacity.toFixed(3));
    set('--skm-exit', exit.toFixed(3));
    set('--skm-exit-y', exitY.toFixed(1)+'px');
    set('--skm-world-y', worldY.toFixed(1)+'px');
    set('--skm-bg', (.18 + p*.30).toFixed(3));
    set('--skm-dive', clamp((p-.42)/.48).toFixed(3));
  }

  function request(){ if (!raf) raf=requestAnimationFrame(render); }

  function boot(attempt=0){
    story=q('.sk6-story');
    sticky=q('.sk6-sticky');
    if (!story || !sticky){
      if (attempt < 80) setTimeout(()=>boot(attempt+1),25);
      return;
    }
    prune();
    if (reduce.matches) return;
    addEventListener('scroll',request,{passive:true});
    addEventListener('resize',request,{passive:true});
    addEventListener('orientationchange',()=>setTimeout(request,100),{passive:true});
    request();
    window.ScholarkV513={version:'5.14.0',refresh:request};
  }

  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>boot(),{once:true});
  else boot();
})();
