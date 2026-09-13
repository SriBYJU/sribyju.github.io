import { test, expect } from '@playwright/test';

const BASE = process.env.SCHOLARK_BASE_URL || 'http://127.0.0.1:4173';

async function waitForDesktopCinematic(page) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.ScholarkV3?.cinematicReady, null, { timeout: 15000 });
  await page.evaluate(() => window.ScholarkV3.cinematicReady);
  await page.waitForSelector('.sk6-portal-object .sk6-logo-face', { state: 'attached' });
}

test.describe('Scholark desktop S cinematic visual regression', () => {
  test('the S stays cohesive when the tile falls away and the portal zoom begins', async ({ page }) => {
    await waitForDesktopCinematic(page);

    const opening = await page.evaluate(() => ({
      rings: [...document.querySelectorAll('.sk6-portal-ring')].map(el => getComputedStyle(el).display),
      faceOpacity: Number(getComputedStyle(document.querySelector('.sk6-logo-face')).opacity),
      depthOpacity: Number(getComputedStyle(document.querySelector('.sk6-logo-depth')).opacity)
    }));

    expect(opening.rings.length).toBe(4);
    expect(opening.rings.every(value => value === 'none')).toBe(true);
    expect(opening.faceOpacity).toBeGreaterThan(0.9);
    expect(opening.depthOpacity).toBeGreaterThan(0.45);

    await page.evaluate(() => {
      const story = document.querySelector('.sk6-story');
      const runway = Math.max(1, story.offsetHeight - innerHeight);
      window.scrollTo(0, story.offsetTop + runway * 0.20);
    });
    await page.waitForTimeout(900);

    const mid = await page.evaluate(() => {
      const sticky = document.querySelector('.sk6-sticky');
      const face = document.querySelector('.sk6-logo-face');
      const depth = document.querySelector('.sk6-logo-depth');
      const portal = document.querySelector('.sk6-portal-object');
      const stage = document.querySelector('.sk6-portal-stage');
      const faceRect = face.getBoundingClientRect();
      const portalRect = portal.getBoundingClientRect();
      return {
        approach: Number.parseFloat(sticky.style.getPropertyValue('--sk6-approach') || '0'),
        dive: Number.parseFloat(sticky.style.getPropertyValue('--sk6-dive') || '0'),
        faceOpacity: Number(getComputedStyle(face).opacity),
        depthOpacity: Number(getComputedStyle(depth).opacity),
        rings: [...document.querySelectorAll('.sk6-portal-ring')].map(el => getComputedStyle(el).display),
        stageOpacity: Number(getComputedStyle(stage).opacity),
        faceCenterDelta: Math.hypot(
          (faceRect.left + faceRect.width / 2) - (portalRect.left + portalRect.width / 2),
          (faceRect.top + faceRect.height / 2) - (portalRect.top + portalRect.height / 2)
        )
      };
    });

    expect(mid.approach).toBeGreaterThan(0.45);
    expect(mid.dive).toBeGreaterThan(0);
    expect(mid.rings.every(value => value === 'none')).toBe(true);
    expect(mid.depthOpacity).toBeLessThan(0.12);
    expect(mid.faceOpacity).toBeGreaterThan(0.9);
    expect(mid.stageOpacity).toBeGreaterThan(0.5);
    expect(mid.faceCenterDelta).toBeLessThan(8);
  });
});
