import { test, expect } from '@playwright/test';

const BASE = process.env.SCHOLARK_BASE_URL || 'http://127.0.0.1:4173';

async function waitForAI(page) {
  await page.waitForFunction(() => !!(
    window.ScholarkAI &&
    window.ScholarkAIAgents &&
    window.ScholarkAIPractice &&
    window.ScholarkAIHealth &&
    window.ScholarkAIUI &&
    window.ScholarkAIPracticeUI
  ), null, { timeout: 20000 });
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try { Object.defineProperty(Navigator.prototype, 'gpu', { configurable: true, get: () => undefined }); } catch (_) {}
  });
});

test('mobile fallback runtime, dialogs, and adaptive practice stay usable', async ({ page }) => {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await waitForAI(page);

  const report = await page.evaluate(() => window.ScholarkAIHealth.run());
  expect(report.pass, JSON.stringify(report.failed)).toBe(true);

  await page.evaluate(() => window.ScholarkAIUI.open());
  await expect(page.locator('#sk-ai-dialog')).toBeVisible();
  await expect(page.locator('#sk-ai-input')).toBeFocused();
  await page.locator('#sk-ai-input').fill('Explain probability simply');
  await page.locator('#sk-ai-form').evaluate(form => form.requestSubmit());
  await expect(page.locator('#sk-ai-transcript .sk-ai-message.assistant')).toHaveCount(1, { timeout: 10000 });

  await page.evaluate(() => { window.ScholarkAIUI.close(); window.ScholarkAIPracticeUI.open(); });
  await expect(page.locator('#sk-practice-dialog')).toBeVisible();
  await page.locator('#sk-practice-skill').fill('linear equations');
  await page.locator('#sk-practice-start').click();
  await expect(page.locator('#sk-practice-stage')).toBeVisible();
  const box = await page.locator('.sk-practice-shell').boundingBox();
  const viewport = page.viewportSize();
  expect(box.width).toBeLessThanOrEqual(viewport.width + 1);
});
