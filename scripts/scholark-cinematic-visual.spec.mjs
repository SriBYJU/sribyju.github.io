import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';

const BASE = process.env.SCHOLARK_BASE_URL || 'http://127.0.0.1:4173';
const CINEMATIC_BUILD = '5153';
const EVIDENCE_DIR = process.env.SCHOLARK_AUDIT_OUT || '/tmp/scholark-production-audit';

async function waitForDesktopCinematic(page) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.ScholarkV3?.cinematicReady, null, { timeout: 15000 });
  await page.evaluate(() => window.ScholarkV3.cinematicReady);
  await page.waitForSelector('.sk6-experience .sk6-portal-object .sk6-logo-face', { state: 'attached' });
  await page.waitForSelector('.sk6-cloud', { state: 'attached' });
}

async function settle(page) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.waitForTimeout(180);
}

async function readState(page) {
  return page.evaluate(() => {
    const sticky = document.querySelector('.sk6-sticky');
    const story = document.querySelector('.sk6-story');
    const portal = document.querySelector('.sk6-portal-object');
    const face = document.querySelector('.sk6-logo-face');
    const depth = document.querySelector('.sk6-logo-depth');
    const wave = document.querySelector('.sk6-wave-scene');
    const orbit = document.querySelector('.sk6-orbit-scene');
    const exit = document.querySelector('.sk6-exit-copy');
    if (!sticky || !story || !portal || !face || !depth || !wave || !orbit || !exit) {
      throw new Error('desktop-cinematic-state-missing');
    }
    const numberVar = name => Number.parseFloat(sticky.style.getPropertyValue(name) || '0');
    const clouds = [...document.querySelectorAll('.sk6-cloud')];
    const rings = [...document.querySelectorAll('.sk6-portal-ring')];
    const layers = [...document.querySelectorAll('.sk6-logo-layer')];
    const orbitNodes = [...orbit.querySelectorAll('.sk6-orbit,.sk6-orbit-core')];
    const visible = el => {
      const css = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return css.display !== 'none' && css.visibility !== 'hidden' && Number(css.opacity) > 0.03 && rect.width > 1 && rect.height > 1;
    };
    const orbitCss = getComputedStyle(orbit);
    const orbitRect = orbit.getBoundingClientRect();
    return {
      p: numberVar('--sk6-p'),
      approach: numberVar('--sk6-approach'),
      dive: numberVar('--sk6-dive'),
      through: numberVar('--sk6-through'),
      waveOpacity: numberVar('--sk6-wave-opacity'),
      orbitOpacity: numberVar('--sk6-orbit-opacity'),
      exitOpacity: numberVar('--sk6-exit-opacity'),
      portalScale: numberVar('--sk6-portal-scale'),
      portalOpacity: Number(getComputedStyle(document.querySelector('.sk6-portal-stage')).opacity),
      depthOpacity: Number(getComputedStyle(depth).opacity),
      faceOpacity: Number(getComputedStyle(face).opacity),
      clouds: clouds.length,
      visibleClouds: clouds.filter(visible).length,
      cloudMotion: clouds.map(el => ({
        sx: Number.parseFloat(el.style.getPropertyValue('--sx') || '0'),
        sy: Number.parseFloat(el.style.getPropertyValue('--sy') || '0'),
        zoom: Number.parseFloat(el.style.getPropertyValue('--zoom') || '1')
      })),
      rays: document.querySelectorAll('.sk6-ray').length,
      dust: document.querySelectorAll('.sk6-dust').length,
      hills: document.querySelectorAll('.sk6-hills').length,
      campus: document.querySelectorAll('.sk6-campus-wrap').length,
      books: document.querySelectorAll('.sk6-book-stack').length,
      leaves: document.querySelectorAll('.sk6-leaf').length,
      floatCards: document.querySelectorAll('.sk6-float-card').length,
      ringCount: rings.length,
      ringDisplays: rings.map(el => getComputedStyle(el).display),
      ringOpacities: rings.map(el => Number(getComputedStyle(el).opacity)),
      layerCount: layers.length,
      layerOpacities: layers.map(el => Number(getComputedStyle(el).opacity)),
      waveVisible: visible(wave),
      orbitDisplay: orbitCss.display,
      orbitVisibility: orbitCss.visibility,
      orbitComputedOpacity: Number(orbitCss.opacity),
      orbitWidth: orbitRect.width,
      orbitHeight: orbitRect.height,
      orbitNodeCount: orbitNodes.length,
      visibleOrbitNodes: orbitNodes.filter(visible).length,
      exitVisible: visible(exit),
      storyHeight: story.offsetHeight,
      viewportHeight: innerHeight
    };
  });
}

async function seekProgress(page, target) {
  let low = 0;
  let high = 1;
  let state = await readState(page);
  for (let i = 0; i < 11; i += 1) {
    const fraction = (low + high) / 2;
    await page.evaluate(f => {
      const story = document.querySelector('.sk6-story');
      if (!story) throw new Error('desktop-story-missing');
      const runway = Math.max(1, story.offsetHeight - innerHeight);
      window.scrollTo({ top: story.offsetTop + runway * f, behavior: 'instant' });
    }, fraction);
    await settle(page);
    state = await readState(page);
    if (Math.abs(state.p - target) <= 0.018) return state;
    if (state.p < target) low = fraction;
    else high = fraction;
  }
  return state;
}

async function evidence(page, testInfo, label) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  const safeProject = testInfo.project.name.replace(/[^a-z0-9_-]+/gi, '-');
  await page.screenshot({
    path: path.join(EVIDENCE_DIR, `cinematic-${safeProject}-${label}.png`),
    fullPage: false,
    animations: 'allow'
  });
}

test.describe('Scholark desktop cinematic restoration', () => {
  test.setTimeout(60000);

  test('desktop loads the fresh cinematic build and the original dimensional atmosphere', async ({ page }, testInfo) => {
    await waitForDesktopCinematic(page);
    const assets = await page.evaluate(() => ({
      build: window.ScholarkV3?.build,
      styleHrefs: [...document.querySelectorAll('link[rel="stylesheet"]')].map(link => link.href),
      scriptSrcs: [...document.scripts].map(script => script.src).filter(Boolean)
    }));
    expect(assets.build).toBe(CINEMATIC_BUILD);
    expect(assets.scriptSrcs.some(src => src.includes(`scholark-v3.js?build=${CINEMATIC_BUILD}`))).toBe(true);
    expect(assets.styleHrefs.some(href => href.includes(`scholark-v512.css?build=${CINEMATIC_BUILD}`))).toBe(true);
    expect(assets.scriptSrcs.some(src => src.includes(`scholark-v53.js?build=${CINEMATIC_BUILD}`))).toBe(true);

    await seekProgress(page, 0.01);
    const opening = await readState(page);
    console.log('cinematic opening', JSON.stringify(opening));
    // V5.3 creates seven hero clouds; later additive cinematic layers may add more.
    expect(opening.clouds).toBeGreaterThanOrEqual(7);
    expect(opening.visibleClouds).toBeGreaterThanOrEqual(7);
    expect(opening.rays).toBe(3);
    expect(opening.dust).toBe(18);
    expect(opening.hills).toBe(1);
    expect(opening.campus).toBe(1);
    expect(opening.books).toBeGreaterThanOrEqual(2);
    expect(opening.leaves).toBeGreaterThanOrEqual(2);
    expect(opening.floatCards).toBeGreaterThanOrEqual(4);
    expect(opening.ringCount).toBe(4);
    expect(opening.ringDisplays.every(value => value !== 'none')).toBe(true);
    expect(opening.layerCount).toBe(10);
    expect(opening.layerOpacities.every(value => value > 0.85)).toBe(true);
    expect(opening.depthOpacity).toBeGreaterThan(0.85);
    expect(opening.faceOpacity).toBeGreaterThan(0.9);
    await evidence(page, testInfo, 'opening');
  });

  test('the S, clouds and cinematic scenes animate through the original scroll sequence', async ({ page }, testInfo) => {
    await waitForDesktopCinematic(page);

    // Probe after the approach is substantially underway. A fixed earlier p could land before
    // meaningful cloud displacement on slower smoothing engines even though the same animation works.
    const portal = await seekProgress(page, 0.285);
    console.log('cinematic portal', JSON.stringify(portal));
    expect(portal.approach).toBeGreaterThan(0.75);
    expect(portal.dive).toBeGreaterThan(0.05);
    expect(portal.portalScale).toBeGreaterThan(2);
    expect(portal.ringDisplays.every(value => value !== 'none')).toBe(true);
    expect(Math.max(...portal.ringOpacities)).toBeGreaterThan(0.55);
    expect(portal.depthOpacity).toBeGreaterThan(0.85);
    expect(portal.layerOpacities.every(value => value > 0.85)).toBe(true);
    expect(portal.cloudMotion.some(c => Math.abs(c.sx) > 8 || Math.abs(c.sy) > 8 || c.zoom > 1.04)).toBe(true);
    await evidence(page, testInfo, 'portal');

    const wave = await seekProgress(page, 0.50);
    console.log('cinematic wave', JSON.stringify(wave));
    expect(wave.through).toBeGreaterThan(0.9);
    expect(wave.waveOpacity).toBeGreaterThan(0.7);
    expect(wave.waveVisible).toBe(true);
    await evidence(page, testInfo, 'wave');

    const orbit = await seekProgress(page, 0.71);
    console.log('cinematic orbit', JSON.stringify(orbit));
    expect(orbit.orbitOpacity).toBeGreaterThan(0.7);
    expect(orbit.orbitDisplay).not.toBe('none');
    expect(orbit.orbitVisibility).not.toBe('hidden');
    expect(orbit.orbitComputedOpacity).toBeGreaterThan(0.7);
    expect(orbit.orbitWidth).toBeGreaterThan(100);
    expect(orbit.orbitHeight).toBeGreaterThan(100);
    expect(orbit.orbitNodeCount).toBeGreaterThanOrEqual(5);
    expect(orbit.visibleOrbitNodes).toBeGreaterThanOrEqual(5);
    await evidence(page, testInfo, 'orbit');

    // Sample firmly inside the exit phase; keep the opacity requirement strict.
    const ending = await seekProgress(page, 0.93);
    console.log('cinematic ending', JSON.stringify(ending));
    expect(ending.exitOpacity).toBeGreaterThan(0.75);
    expect(ending.exitVisible).toBe(true);
    await evidence(page, testInfo, 'ending');
  });

  test('a desktop can explicitly restore the full cinematic when the system requests reduced motion', async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`${BASE}?motion=system`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!window.ScholarkV3?.cinematicReady, null, { timeout: 15000 });
    await page.evaluate(() => window.ScholarkV3.cinematicReady);

    const reduced = await page.evaluate(() => ({
      systemReduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
      effectiveReduced: window.ScholarkMotion?.reduced,
      mode: window.ScholarkMotion?.mode,
      classReduced: document.documentElement.classList.contains('sk6-reduce-motion'),
      storyHeight: document.querySelector('.sk6-story')?.offsetHeight,
      viewportHeight: innerHeight,
      stored: localStorage.getItem('scholark:v3:motion-mode')
    }));
    expect(reduced.systemReduced).toBe(true);
    expect(reduced.effectiveReduced).toBe(true);
    expect(reduced.mode).toBe('system');
    expect(reduced.classReduced).toBe(true);
    expect(reduced.storyHeight).toBeLessThanOrEqual(reduced.viewportHeight * 1.2);
    expect(reduced.stored).toBe('system');
    await expect(page.locator('[data-motion-toggle]')).toContainText('Play full cinematic');
    await evidence(page, testInfo, 'reduced-with-restore-control');

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
      page.locator('[data-motion-toggle]').click()
    ]);
    await page.waitForFunction(() => !!window.ScholarkV3?.cinematicReady, null, { timeout: 15000 });
    await page.evaluate(() => window.ScholarkV3.cinematicReady);
    await page.waitForSelector('.sk6-experience .sk6-portal-object .sk6-logo-face', { state: 'attached' });

    const restored = await page.evaluate(() => ({
      systemReduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
      effectiveReduced: window.ScholarkMotion?.reduced,
      mode: window.ScholarkMotion?.mode,
      classReduced: document.documentElement.classList.contains('sk6-reduce-motion'),
      classForced: document.documentElement.classList.contains('sk6-force-motion'),
      storyHeight: document.querySelector('.sk6-story')?.offsetHeight,
      viewportHeight: innerHeight,
      stored: localStorage.getItem('scholark:v3:motion-mode')
    }));
    expect(restored.systemReduced).toBe(true);
    expect(restored.effectiveReduced).toBe(false);
    expect(restored.mode).toBe('full');
    expect(restored.classReduced).toBe(false);
    expect(restored.classForced).toBe(true);
    expect(restored.storyHeight).toBeGreaterThan(restored.viewportHeight * 5);
    expect(restored.stored).toBe('full');
    await expect(page.locator('[data-motion-toggle]')).toContainText('Reduce motion');

    const orbit = await seekProgress(page, 0.71);
    expect(orbit.orbitOpacity).toBeGreaterThan(0.7);
    expect(orbit.orbitDisplay).not.toBe('none');
    expect(orbit.visibleOrbitNodes).toBeGreaterThanOrEqual(5);
    await evidence(page, testInfo, 'restored-full-motion');
  });
});
