import { test, expect } from '@playwright/test';

const BASE = process.env.SCHOLARK_BASE_URL || 'http://127.0.0.1:4173';

async function waitForDesktopCinematic(page) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.ScholarkV3?.cinematicReady, null, { timeout: 15000 });
  await page.evaluate(() => window.ScholarkV3.cinematicReady);
  await page.waitForSelector('.sk6-portal-object .sk6-logo-face', { state: 'attached' });
}

async function readPortalState(page, fraction = null) {
  return page.evaluate((requestedFraction) => {
    const sticky = document.querySelector('.sk6-sticky');
    const face = document.querySelector('.sk6-logo-face');
    const depth = document.querySelector('.sk6-logo-depth');
    const portal = document.querySelector('.sk6-portal-object');
    const stage = document.querySelector('.sk6-portal-stage');
    if (!sticky || !face || !depth || !portal || !stage) throw new Error('desktop-portal-state-missing');
    const faceRect = face.getBoundingClientRect();
    const portalRect = portal.getBoundingClientRect();
    return {
      requestedFraction,
      scrollY,
      approach: Number.parseFloat(sticky.style.getPropertyValue('--sk6-approach') || '0'),
      dive: Number.parseFloat(sticky.style.getPropertyValue('--sk6-dive') || '0'),
      through: Number.parseFloat(sticky.style.getPropertyValue('--sk6-through') || '0'),
      faceOpacity: Number(getComputedStyle(face).opacity),
      depthOpacity: Number(getComputedStyle(depth).opacity),
      rings: [...document.querySelectorAll('.sk6-portal-ring')].map(el => getComputedStyle(el).display),
      stageOpacity: Number(getComputedStyle(stage).opacity),
      faceCenterDelta: Math.hypot(
        (faceRect.left + faceRect.width / 2) - (portalRect.left + portalRect.width / 2),
        (faceRect.top + faceRect.height / 2) - (portalRect.top + portalRect.height / 2)
      )
    };
  }, fraction);
}

async function seekPortalZoomPhase(page) {
  // Browser engines do not map the same story-scroll fraction to the exact same
  // sticky/cinematic progress. Seek using the animation's own state instead of
  // assuming a hard-coded scroll percentage is equivalent everywhere.
  const fractions = [0.18, 0.22, 0.26, 0.30, 0.34, 0.38, 0.42, 0.46, 0.50, 0.56, 0.62];
  let state = await readPortalState(page, 0);

  for (const fraction of fractions) {
    await page.evaluate((f) => {
      const story = document.querySelector('.sk6-story');
      if (!story) throw new Error('desktop-story-missing');
      const runway = Math.max(1, story.offsetHeight - innerHeight);
      window.scrollTo({ top: story.offsetTop + runway * f, behavior: 'instant' });
    }, fraction);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.waitForTimeout(220);
    state = await readPortalState(page, fraction);
    if (state.approach >= 0.55 && state.dive >= 0.05 && state.through < 0.65) return state;
  }

  return state;
}

test.describe('Scholark desktop S cinematic visual regression', () => {
  test('the S stays cohesive when the tile falls away and the portal zoom begins', async ({ page }) => {
    await waitForDesktopCinematic(page);

    const opening = await readPortalState(page, 0);
    expect(opening.rings.length).toBe(4);
    expect(opening.rings.every(value => value === 'none')).toBe(true);
    expect(opening.faceOpacity).toBeGreaterThan(0.9);
    expect(opening.depthOpacity).toBeGreaterThan(0.45);

    const mid = await seekPortalZoomPhase(page);
    console.log('desktop S portal mid-state', JSON.stringify(mid));

    // First prove we actually reached the affected scroll phase. The geometry
    // assertions below are only meaningful once approach + dive are underway.
    expect(mid.approach, `portal phase not reached: ${JSON.stringify(mid)}`).toBeGreaterThanOrEqual(0.55);
    expect(mid.dive, `portal phase not reached: ${JSON.stringify(mid)}`).toBeGreaterThanOrEqual(0.05);
    expect(mid.rings.every(value => value === 'none'), `rings detached at mid-scroll: ${JSON.stringify(mid)}`).toBe(true);
    expect(mid.depthOpacity, `deep extrusion remained visible: ${JSON.stringify(mid)}`).toBeLessThan(0.12);
    expect(mid.faceOpacity, `S face faded unexpectedly: ${JSON.stringify(mid)}`).toBeGreaterThan(0.9);
    expect(mid.stageOpacity, `portal stage disappeared too early: ${JSON.stringify(mid)}`).toBeGreaterThan(0.5);
    expect(mid.faceCenterDelta, `S face drifted away from portal center: ${JSON.stringify(mid)}`).toBeLessThan(8);
  });
});
