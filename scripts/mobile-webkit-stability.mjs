import assert from 'node:assert/strict';
import { webkit, devices } from 'playwright';

const BASE=process.env.SCHOLARK_TEST_URL||'http://127.0.0.1:4173/';
const browser=await webkit.launch({headless:true});
const context=await browser.newContext({...devices['iPhone 13']});
const page=await context.newPage();
const errors=[];
page.on('pageerror',e=>errors.push(String(e.message||e)));
page.on('crash',()=>errors.push('PAGE_CRASH'));

try{
  await page.goto(BASE+'#home',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>window.ScholarkMobile?.version&&document.body.classList.contains('scholark-mobile-cinematic'),null,{timeout:20000});
  await page.waitForTimeout(400);

  const initial=await page.evaluate(()=>{
    const hero=document.querySelector('.skm-hero');
    const logo=document.querySelector('.skm-mark');
    const story=document.querySelector('.skm-story');
    const sticky=document.querySelector('.skm-stage');
    const r=e=>e?.getBoundingClientRect();
    return {
      mobile:window.ScholarkV3?.mobile,
      runtime:window.ScholarkMobile?.version,
      scripts:[...document.scripts].map(s=>s.src).filter(Boolean),
      styles:[...document.styleSheets].map(s=>s.href).filter(Boolean),
      hero:r(hero),logo:r(logo),story:r(story),sticky:r(sticky),
      heroOpacity:+getComputedStyle(hero).opacity,
      heavyCount:document.querySelectorAll('.sk6-experience,.sk6-orbit-scene,.sk11-orbit-shell,.sk9-observatory,.sk6-cloud,.sk6-logo-depth').length,
      mobileNodes:document.querySelectorAll('.skm-experience *').length,
      overflow:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-innerWidth
    };
  });

  assert.equal(initial.mobile,true,'mobile loader path must be active');
  assert.ok(/^1\./.test(initial.runtime),'dedicated mobile cinematic runtime must be active');
  assert.ok(initial.scripts.some(s=>s.includes('scholark-mobile.js')),'mobile runtime must be loaded');
  for(const forbidden of ['scholark-v53.js','scholark-v54.js','scholark-v55.js','scholark-v57.js','scholark-v58.js','scholark-v59.js','scholark-v510.js','scholark-v513.js']){
    assert.equal(initial.scripts.some(s=>s.includes(forbidden)),false,`${forbidden} must not load on phone`);
  }
  assert.equal(initial.heavyCount,0,'desktop cinematic scene graph must not exist on phone');
  assert.ok(initial.mobileNodes<130,`mobile cinematic DOM is unexpectedly large: ${initial.mobileNodes} nodes`);
  assert.ok(initial.hero&&initial.logo&&initial.story&&initial.sticky,'core mobile cinematic elements must exist');
  assert.ok(initial.hero.top>=60,'opening copy must begin below the sticky navigation');
  assert.ok(initial.logo.top>initial.hero.top+120,'S must sit clearly below the opening copy');
  assert.ok(initial.logo.top<700,'S must be visible in the opening viewport');
  assert.ok(initial.overflow<=2,`initial horizontal overflow is ${initial.overflow}px`);

  const metrics=await page.evaluate(()=>({
    start:scrollY+document.querySelector('.skm-story').getBoundingClientRect().top,
    range:document.querySelector('.skm-story').offsetHeight-document.querySelector('.skm-stage').offsetHeight
  }));

  const fractions=[.10,.22,.34,.46,.58,.70,.82,.92];
  for(let pass=0;pass<3;pass++){
    const seq=pass%2?fractions.slice().reverse():fractions;
    for(const fraction of seq){
      await page.evaluate(({y})=>scrollTo(0,y),{y:Math.round(metrics.start+metrics.range*fraction)});
      await page.waitForTimeout(75);
      assert.equal(page.isClosed(),false,`page closed during WebKit stress scroll at ${fraction}`);
      const state=await page.evaluate(()=>({
        progress:window.ScholarkMobile?.progress,
        y:scrollY,
        stickyTop:document.querySelector('.skm-stage')?.getBoundingClientRect().top
      }));
      assert.ok(Number.isFinite(state.progress),`mobile progress missing at ${fraction}`);
      assert.ok(Math.abs(state.progress-fraction)<.12,`scroll progress drifted: wanted ${fraction}, got ${state.progress}`);
      assert.ok(Math.abs(state.stickyTop-60)<=3||fraction>.90,`sticky stage lost its position at ${fraction}: ${state.stickyTop}px`);
    }
  }

  await page.evaluate(({y})=>scrollTo(0,y),{y:Math.round(metrics.start+metrics.range*.84)});
  await page.waitForTimeout(120);
  const mid=await page.evaluate(()=>{
    const hero=document.querySelector('.skm-hero');
    const logo=document.querySelector('.skm-mark');
    const sticky=document.querySelector('.skm-stage');
    return {
      progress:window.ScholarkMobile?.progress,
      stickyTop:sticky.getBoundingClientRect().top,
      heroOpacity:+getComputedStyle(hero).opacity,
      logoOpacity:+getComputedStyle(logo).opacity,
      logoTransform:getComputedStyle(logo).transform,
      logoRect:logo.getBoundingClientRect(),
      overflow:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-innerWidth
    };
  });
  assert.ok(mid.progress>.75,'mobile scroll runtime must advance through the cinematic');
  assert.ok(Math.abs(mid.stickyTop-60)<=3,'sticky stage must remain directly beneath the nav');
  assert.ok(mid.heroOpacity<.15,'opening copy should fade during the scroll');
  assert.notEqual(mid.logoTransform,'none','S must actually move/scale during scroll');
  assert.ok(mid.logoRect.top>-500&&mid.logoRect.bottom<1200,'S transform must remain bounded');
  assert.ok(mid.overflow<=2,`scrolled horizontal overflow is ${mid.overflow}px`);

  const relevant=errors.filter(x=>!/firebase|network|failed to fetch|auth\//i.test(x));
  assert.equal(relevant.length,0,`unexpected WebKit page errors: ${relevant.join(' | ')}`);
  console.log('ScholarK mobile WebKit audit passed: dedicated mobile loader, small DOM, no desktop scene graph, centered opening composition, sticky scroll animation, bounded S zoom, no horizontal overflow, and three repeated stress-scroll passes without page failure.');
}finally{
  await context.close();
  await browser.close();
}
