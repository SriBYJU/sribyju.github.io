import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const BASE = process.env.SCHOLARK_TEST_URL || 'http://127.0.0.1:4173/';

async function waitForV59(page) {
  await page.goto(BASE, { waitUntil:'domcontentloaded', timeout:30000 });
  await page.waitForFunction(() => !!window.ScholarkV59 && document.body.classList.contains('scholark-v59'), null, { timeout:25000 });
  await page.waitForTimeout(650);
}

async function dismissConsent(page) {
  const necessary = page.locator('#sk-legal-banner [data-necessary]');
  if (await necessary.count()) {
    await necessary.first().click();
    await page.waitForTimeout(100);
  }
}

async function assertBridgeRouteOrAuth(page, selector, targetId, label) {
  const button = page.locator(selector).first();
  assert.equal(await button.count(), 1, `${label} bridge action should exist`);
  await button.scrollIntoViewIfNeeded();
  await button.click();
  await page.waitForTimeout(250);
  const state = await page.evaluate(id => ({
    target:document.querySelector('#page-'+id)?.classList.contains('active') || false,
    authOpen:document.querySelector('#authModal')?.classList.contains('open') || false,
    active:document.querySelector('.page.active')?.id || ''
  }), targetId);
  assert.ok(state.target || state.authOpen, `${label} should open its target or the site's intentional sign-in gate: ${JSON.stringify(state)}`);
  if (state.authOpen) await page.evaluate(() => window.closeAuth?.());
  await page.evaluate(() => window.showPage?.('home'));
  await page.waitForTimeout(80);
}

async function desktopAudit(browser) {
  const context = await browser.newContext({ viewport:{width:1440,height:1000} });
  const page = await context.newPage();
  const consoleErrors=[];
  page.on('pageerror', e => consoleErrors.push(String(e.message||e)));
  await waitForV59(page);

  const state = await page.evaluate(() => {
    const audit = window.ScholarkV59.audit();
    const about = document.querySelector('#page-about .subtitle')?.textContent || '';
    const meta = document.querySelector('meta[name="description"]')?.content || '';
    const overflow = document.documentElement.scrollWidth - innerWidth;
    return {
      audit,
      about,
      meta,
      overflow,
      adReserves: document.querySelectorAll('.ad-banner,.ad-reserve,[data-ad-placement]').length,
      adsenseScripts: document.querySelectorAll('script[src*="googlesyndication.com/pagead/js/adsbygoogle.js"]').length,
      legalLinks: document.querySelectorAll('a[href="privacy.html"],a[href="terms.html"],a[href="security.html"]').length,
      finalText: document.querySelector('.sk12-final-status')?.textContent || ''
    };
  });

  assert.ok(state.audit.continuityScenes >= 2, 'expected at least two cinematic continuity scenes');
  assert.ok(state.audit.projectDisclosureCount >= 2, 'expected multiple project-status disclosures');
  assert.equal(state.audit.adScripts, 0, 'runtime should contain no AdSense scripts');
  assert.equal(state.audit.adNodes, 0, 'runtime should contain no AdSense nodes');
  assert.equal(state.audit.largeGaps.length, 0, `homepage should have no accidental >180px inter-section gaps: ${JSON.stringify(state.audit.largeGaps)}`);
  assert.equal(state.adReserves, 0, 'static ad reserve UI should be removed');
  assert.equal(state.adsenseScripts, 0, 'static AdSense loader should be absent');
  assert.ok(/not an incorporated company/i.test(state.about), 'About copy must clearly say Scholark is not an incorporated company');
  assert.ok(/not revenue-generating/i.test(state.about), 'About copy must clearly say Scholark is not revenue-generating');
  assert.ok(/non-commercial educational project/i.test(state.meta), 'metadata must identify Scholark as non-commercial');
  assert.ok(/not revenue-generating/i.test(state.finalText), 'cinematic closing disclosure must say not revenue-generating');
  assert.ok(state.legalLinks >= 5, 'Privacy, Terms, and Security should remain easy to find');
  assert.ok(state.overflow <= 4, `desktop horizontal overflow is ${state.overflow}px`);

  await dismissConsent(page);

  // Account-linked features may intentionally open the existing auth gate when logged out.
  await assertBridgeRouteOrAuth(page, '.sk12-continuity button[data-page="goals"]', 'goals', 'GPA Goals');
  await assertBridgeRouteOrAuth(page, '.sk12-continuity button[data-page="compare"]', 'compare', 'College Compare');
  await assertBridgeRouteOrAuth(page, '.sk12-continuity button[data-page="prep"]', 'prep', 'SAT Prep');

  // Public informational navigation still needs to function independently of account state.
  const aboutResult = await page.evaluate(() => window.showPage?.('about'));
  assert.notEqual(aboutResult, false, 'About should remain publicly navigable');
  await page.waitForFunction(() => document.querySelector('#page-about')?.classList.contains('active'), null, {timeout:5000});
  await page.evaluate(() => window.showPage?.('home'));

  await page.evaluate(() => document.documentElement.dataset.theme='dark');
  const dark = await page.evaluate(() => {
    const bridge=document.querySelector('.sk12-continuity:not(.deep)');
    const s=getComputedStyle(bridge);
    return {background:s.backgroundImage,color:getComputedStyle(bridge.querySelector('h3')).color};
  });
  assert.ok(dark.background && dark.background!=='none','dark-mode bridge should have a designed background');
  assert.ok(dark.color && dark.color!=='rgba(0, 0, 0, 0)','dark-mode headline should remain visible');

  const relevantErrors = consoleErrors.filter(x => !/firebase|auth\/operation-not-supported|network|failed to fetch/i.test(x));
  assert.equal(relevantErrors.length, 0, `unexpected page errors: ${relevantErrors.join(' | ')}`);
  await context.close();
}

async function mobileAudit(browser) {
  const context = await browser.newContext({ viewport:{width:390,height:844}, isMobile:true, hasTouch:true });
  const page = await context.newPage();
  await waitForV59(page);
  const state = await page.evaluate(() => ({
    scenes:document.querySelectorAll('.sk12-continuity').length,
    overflow:document.documentElement.scrollWidth-innerWidth,
    disclosures:document.querySelectorAll('.sk12-project-status').length,
    adNodes:document.querySelectorAll('ins.adsbygoogle').length
  }));
  assert.ok(state.scenes>=2,'mobile should retain the continuity scenes');
  assert.ok(state.disclosures>=2,'mobile should retain project disclosures');
  assert.equal(state.adNodes,0,'mobile should contain no ad nodes');
  assert.ok(state.overflow<=4,`mobile horizontal overflow is ${state.overflow}px`);
  await context.close();
}

async function reducedMotionAudit(browser) {
  const context = await browser.newContext({ viewport:{width:1280,height:800}, reducedMotion:'reduce' });
  const page = await context.newPage();
  await waitForV59(page);
  const motion = await page.evaluate(() => {
    const cloud=document.querySelector('.sk12-cloud');
    const copy=document.querySelector('.sk12-continuity-copy');
    return {animation:getComputedStyle(cloud).animationName,transform:getComputedStyle(copy).transform};
  });
  assert.equal(motion.animation,'none','reduced-motion mode should disable cloud animation');
  assert.equal(motion.transform,'none','reduced-motion mode should remove continuity transform');
  await context.close();
}

const browser = await chromium.launch({headless:true});
try {
  await desktopAudit(browser);
  await mobileAudit(browser);
  await reducedMotionAudit(browser);
  console.log('Scholark V5.9 browser audit passed: desktop, mobile, dark mode, routes/auth gates, zero large dead gaps, non-commercial identity, ad removal, and reduced-motion behavior.');
} finally {
  await browser.close();
}
