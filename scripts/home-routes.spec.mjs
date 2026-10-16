import { test, expect } from '@playwright/test';

const routes = [
  ['GPA Calculator', 'tools', 'gpa'],
  ['Weighted GPA', 'tools', 'weighted'],
  ['College Chances', 'tools', 'chances'],
  ['Essay Rubric Coach', 'essay'],
  ['GPA Goal Tracker', 'goals'],
  ['SAT / ACT Prep', 'prep'],
  ['AP Study Studio', 'ap'],
  ['College Compare', 'compare'],
  ['College Intelligence', 'intelligence'],
  ['Career Outcomes', 'careers'],
  ['College Match Quiz', 'quiz'],
  ['Admissions Guide', 'counselor']
];

test('all twelve homepage cards open the advertised section', async ({ page }) => {
  // Twelve complete navigations share this budget; each destination assertion
  // retains its normal timeout. Production traces reached route 12 at 30 seconds.
  test.setTimeout(60000);
  await page.goto('/');
  await expect(page.locator('.sk6-tool-card')).toHaveCount(routes.length);
  // Navigation only: a local stub bypasses the sign-in gate; no cloud data is written.
  await page.evaluate(() => {
    const stub = { uid: 'route-audit', email: 'route-audit@example.test' };
    window.currentUser = stub;
    window.__routeAuditAuth = setInterval(() => { window.currentUser = stub; }, 20);
  });
  for (const [index, [label, route, tab]] of routes.entries()) {
    await page.evaluate(() => window.showPage('home'));
    const card = page.locator('.sk6-tool-card').nth(index);
    await expect(card.locator('h3')).toHaveText(label);
    await card.click();
    await expect(page.locator(`#page-${route}`)).toHaveClass(/\bactive\b/);
    if (tab) await expect(page.locator(`#tab-${tab}`)).toHaveClass(/\bactive\b/);
  }
  await page.evaluate(() => clearInterval(window.__routeAuditAuth));
});

test('signed-out gated card opens sign-in, while Essay Coach opens', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.sk6-tool-card')).toHaveCount(routes.length);
  await page.locator('.sk6-tool-card').first().click();
  await expect(page.locator('#authModal')).toHaveClass(/\bopen\b/);
  await page.evaluate(() => window.closeAuth());
  await page.locator('.sk6-tool-card').nth(3).click();
  await expect(page.locator('#page-essay')).toHaveClass(/\bactive\b/);
});

test('About opens and the founder photo keeps its square-corner treatment', async ({ page }) => {
  await page.goto('/');
  await page.locator('#nav-about').click();
  await expect(page.locator('#page-about')).toHaveClass(/\bactive\b/);
  await expect(page.locator('#page-about .about-avatar img')).toBeVisible();
  const portrait = await page.locator('#page-about .about-avatar').evaluate(element => {
    const style = getComputedStyle(element);
    return { radius: parseFloat(style.borderTopLeftRadius), width: element.getBoundingClientRect().width };
  });
  expect(portrait.radius).toBeLessThan(portrait.width / 4);
});
