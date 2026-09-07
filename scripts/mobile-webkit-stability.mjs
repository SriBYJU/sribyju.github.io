import assert from 'node:assert/strict';
import { webkit, devices } from 'playwright';

const BASE=process.env.SCHOLARK_TEST_URL||'http://127.0.0.1:4173/';
const browser=await webkit.launch({headless:true});
const context=await browser.newContext({...devices['iPhone 13']});
const page=await context.newPage();
const errors=[];
page.on('pageerror',e=>errors.push(String(e.message||e)));

try{
  await page.goto(BASE+'#home',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>window.ScholarkV513?.version&&document.body.classList.contains('scholark-v5'),null,{timeout:20000});
  await page.waitForTimeout(450);

  const initial=await page.evaluate(()=>{
    const hero=document.querySelector('.sk6-hero-copy');
    const logo=document.querySelector('.sk6-portal-object');
    const story=document.querySelector('.sk6-story');
    const sticky=document.querySelector('.sk6-sticky');
    const r=e=>e?.getBoundingClientRect();
    return {
      mobile:window.ScholarkV3?.mobile,
      runtime:window.ScholarkV513?.version,
      scripts:[...document.scripts].map(s=>s.src).filter(Boolean),
      hero:r(hero),logo:r(logo),story:r(story),sticky:r(sticky),
      heroOpacity:+getComputedStyle(hero).opacity,
      orbitCount:document.querySelectorAll('.sk6-orbit-scene,.sk11-orbit-shell,.sk9-observatory').length,
      overflow:document.documentElement.scrollWidth-innerWidth
    };
  });

  assert.equal(initial.mobile,true,'mobile loader path must be active');
  assert.ok(/^5\.14\./.test(initial.runtime),'V5.14 mobile runtime must be active');
  for(const forbidden of ['scholark-v54.js','scholark-v55.js','scholark-v57.js','scholark-v58.js','scholark-v59.js','scholark-v510.js']){
    assert.equal(initial.scripts.some(s=>s.includes(forbidden)),false,`${forbidden} must not load on phone`);
  }
  assert.equal(initial.orbitCount,0,'phone must contain no orbit/observatory scene');
  assert.ok(initial.hero && initial.logo && initial.story && initial.sticky,'core mobile cinematic elements must exist');
  assert.ok(initial.hero.top>=55,'hero must begin below the sticky navigation');
  assert.ok(initial.logo.top>initial.hero.top,'S must sit below the opening copy instead of being buried offscreen');
  assert.ok(initial.logo.top<720,'S must be visible in the opening viewport');
  assert.ok(initial.overflow<=4,`initial horizontal overflow is ${initial.overflow}px`);

  const storyTop=await page.evaluate(()=>scrollY+document.querySelector('.sk6-story').getBoundingClientRect().top);
  const max=await page.evaluate(()=>document.querySelector('.sk6-story').offsetHeight-innerHeight);

  for(const fraction of [.12,.24,.36,.48,.60,.72,.84]){
    await page.evaluate(y=>scrollTo(0,y),Math.round(storyTop+max*fraction));
    await page.waitForTimeout(90);
    assert.equal(page.isClosed(),false,`page closed during mobile scroll at ${fraction}`);
  }

  const mid=await page.evaluate(()=>{
    const hero=document.querySelector('.sk6-hero-copy');
    const logo=document.querySelector('.sk6-portal-object');
    const sticky=document.querySelector('.sk6-sticky');
    return {
      stickyTop:sticky.getBoundingClientRect().top,
      heroOpacity:+getComputedStyle(hero).opacity,
      logoTransform:getComputedStyle(logo).transform,
      logoRect:logo.getBoundingClientRect(),
      overflow:document.documentElement.scrollWidth-innerWidth
    };
  });
  assert.ok(Math.abs(mid.stickyTop-60)<=3,`sticky stage top is ${mid.stickyTop}px, expected ~60px`);
  assert.ok(mid.heroOpacity<.25,'opening copy should fade as the user scrolls');
  assert.notEqual(mid.logoTransform,'none','S must actually move/scale during scroll');
  assert.ok(mid.logoRect.top>-450&&mid.logoRect.bottom<1250,'S transform must remain bounded');
  assert.ok(mid.overflow<=4,`scrolled horizontal overflow is ${mid.overflow}px`);

  const relevant=errors.filter(x=>!/firebase|network|failed to fetch|auth\//i.test(x));
  assert.equal(relevant.length,0,`unexpected WebKit page errors: ${relevant.join(' | ')}`);
  console.log('ScholarK mobile WebKit stability audit passed: lightweight loader, bounded S composition, sticky scroll, no orbit scene, no horizontal overflow, and repeated scroll without page failure.');
}finally{
  await context.close();
  await browser.close();
}
