import { test, expect } from '@playwright/test';

const BASE = process.env.SCHOLARK_BASE_URL || 'http://127.0.0.1:4173';

test('all feature cards open their destinations and data pages contain results', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  const cardSelector = page.viewportSize()?.width <= 760 ? '.skm-tools .skm-card' : '.sk6-tool-card';
  await page.waitForSelector(cardSelector);
  await page.evaluate(() => { window.currentUser = { uid: 'navigation-regression', email: 'test@example.invalid' }; });

  const destinations = ['tools', 'tools', 'tools', 'essay', 'goals', 'prep', 'ap', 'compare', 'intelligence', 'careers', 'quiz', 'counselor'];
  await expect(page.locator(cardSelector)).toHaveCount(destinations.length);
  for (const [index, destination] of destinations.entries()) {
    await page.evaluate(() => window.showPage('home'));
    await page.locator(cardSelector).nth(index).click();
    await expect(page.locator(`#page-${destination}`)).toHaveClass(/\bactive\b/);
    if (destination === 'intelligence') await expect(page.locator('#sk4-college-results .sk4-school-card').first()).toBeVisible();
    if (destination === 'careers') await expect(page.locator('#sk4-career-results .sk4-career-card').first()).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test('About portrait is rectangular and its feature action navigates', async ({ page }) => {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => window.showPage('about'));
  await expect(page.locator('#page-about')).toHaveClass(/\bactive\b/);
  await expect(page.locator('.about-avatar img')).toHaveJSProperty('naturalWidth', 1170);
  const radius = await page.locator('.about-avatar').evaluate(element => getComputedStyle(element).borderRadius);
  expect(parseFloat(radius)).toBeLessThan(20);
  await page.locator('.about-hero-actions button').click();
  await expect(page.locator('#page-home')).toHaveClass(/\bactive\b/);
  await expect(page.locator('.skm-tools,.sk6-tools-section')).toBeVisible();
});
