import assert from 'node:assert/strict';
import { webkit, devices } from 'playwright';

const BASE=process.env.SCHOLARK_TEST_URL||'http://127.0.0.1:4173/';
const browser=await webkit.launch({headless:true});

async function auditDevice(deviceName){
  const context=await browser.newContext({...devices[deviceName]});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e.message||e)));
  page.on('crash',()=>errors.push('PAGE_CRASH'));

  try{
    await page.goto(BASE+'#home',{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForFunction(()=>window.ScholarkMobile?.version&&document.body.classList.contains('scholark-mobile-cinematic'),null,{timeout:20000});
    await page.waitForTimeout(450);

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
        hero:r(hero),logo:r(logo),story:r(story),sticky:r(sticky),
        viewportH:innerHeight,
        heroOpacity:+getComputedStyle(hero).opacity,
        heavyCount:document.querySelectorAll('.sk6-experience,.sk6-orbit-scene,.sk11-orbit-shell,.sk9-observatory,.sk6-cloud,.sk6-logo-depth').length,
        mobileNodes:document.querySelectorAll('.skm-experience *').length,
        overflow:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-innerWidth
      };
    });

    assert.equal(initial.mobile,true,`${deviceName}: mobile loader path must be active`);
    assert.ok(/^1\./.test(initial.runtime),`${deviceName}: dedicated mobile cinematic runtime must be active`);
    assert.ok(initial.scripts.some(s=>s.includes('scholark-mobile.js')),`${deviceName}: mobile runtime must be loaded`);
    assert.ok(initial.scripts.some(s=>s.includes('scholark-feature-loader.js')),`${deviceName}: lazy feature loader must be loaded`);

    for(const forbidden of [
      'scholark-v53.js','scholark-v54.js','scholark-v55.js','scholark-v57.js','scholark-v58.js','scholark-v59.js','scholark-v510.js','scholark-v513.js',
      'ap-v2-data.js','ap-v2-app.js','prep-v2-data.js','prep-v2-app.js'
    ]){
      assert.equal(initial.scripts.some(s=>s.includes(forbidden)),false,`${deviceName}: ${forbidden} must not load during homepage startup`);
    }

    assert.equal(initial.heavyCount,0,`${deviceName}: desktop cinematic scene graph must not exist on phone`);
    assert.ok(initial.mobileNodes<130,`${deviceName}: mobile cinematic DOM is unexpectedly large: ${initial.mobileNodes} nodes`);
    assert.ok(initial.hero&&initial.logo&&initial.story&&initial.sticky,`${deviceName}: core mobile cinematic elements must exist`);
    assert.ok(initial.hero.top>=60,`${deviceName}: opening copy must begin below the sticky navigation`);
    assert.ok(initial.logo.top>initial.hero.bottom+8,`${deviceName}: S must sit below the opening copy without overlap`);
    assert.ok(initial.logo.bottom<initial.viewportH-8,`${deviceName}: S must be fully visible in the opening viewport`);
    assert.ok(initial.overflow<=2,`${deviceName}: initial horizontal overflow is ${initial.overflow}px`);

    const metrics=await page.evaluate(()=>({
      start:scrollY+document.querySelector('.skm-story').getBoundingClientRect().top,
      range:document.querySelector('.skm-story').offsetHeight-document.querySelector('.skm-stage').offsetHeight
    }));

    const fractions=[.10,.22,.34,.46,.58,.70,.82,.92];
    for(let pass=0;pass<4;pass++){
      const seq=pass%2?fractions.slice().reverse():fractions;
      for(const fraction of seq){
        await page.evaluate(({y})=>scrollTo(0,y),{y:Math.round(metrics.start+metrics.range*fraction)});
        await page.waitForTimeout(70);
        assert.equal(page.isClosed(),false,`${deviceName}: page closed during WebKit stress scroll at ${fraction}`);
        const state=await page.evaluate(()=>({
          progress:window.ScholarkMobile?.progress,
          stickyTop:document.querySelector('.skm-stage')?.getBoundingClientRect().top,
          overflow:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-innerWidth
        }));
        assert.ok(Number.isFinite(state.progress),`${deviceName}: mobile progress missing at ${fraction}`);
        assert.ok(Math.abs(state.progress-fraction)<.12,`${deviceName}: scroll progress drifted: wanted ${fraction}, got ${state.progress}`);
        assert.ok(Math.abs(state.stickyTop-60)<=3||fraction>.90,`${deviceName}: sticky stage lost its position at ${fraction}: ${state.stickyTop}px`);
        assert.ok(state.overflow<=2,`${deviceName}: horizontal overflow appeared while scrolling: ${state.overflow}px`);
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
        logoTransform:getComputedStyle(logo).transform,
        logoRect:logo.getBoundingClientRect(),
        overflow:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-innerWidth
      };
    });
    assert.ok(mid.progress>.75,`${deviceName}: mobile scroll runtime must advance through the cinematic`);
    assert.ok(Math.abs(mid.stickyTop-60)<=3,`${deviceName}: sticky stage must remain directly beneath the nav`);
    assert.ok(mid.heroOpacity<.15,`${deviceName}: opening copy should fade during the scroll`);
    assert.notEqual(mid.logoTransform,'none',`${deviceName}: S must actually move/scale during scroll`);
    assert.ok(mid.logoRect.top>-500&&mid.logoRect.bottom<1200,`${deviceName}: S transform must remain bounded`);
    assert.ok(mid.overflow<=2,`${deviceName}: scrolled horizontal overflow is ${mid.overflow}px`);

    const relevant=errors.filter(x=>!/firebase|network|failed to fetch|auth\//i.test(x));
    assert.equal(relevant.length,0,`${deviceName}: unexpected WebKit page errors: ${relevant.join(' | ')}`);
    console.log(`ScholarK mobile WebKit audit passed on ${deviceName}.`);
  } finally {
    await context.close();
  }
}

try{
  for(const deviceName of ['iPhone 13','iPhone SE']) await auditDevice(deviceName);
  console.log('ScholarK mobile WebKit audit passed: two iPhone sizes, dedicated lightweight loader, no eager AP/Test Prep engines, no desktop scene graph, non-overlapping opening composition, sticky scroll animation, bounded S zoom, no horizontal overflow, and four repeated stress-scroll passes per device without page failure.');
} finally {
  await browser.close();
}
