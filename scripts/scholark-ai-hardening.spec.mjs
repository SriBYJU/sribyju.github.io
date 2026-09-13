import { test, expect } from '@playwright/test';

const BASE = process.env.SCHOLARK_BASE_URL || 'http://127.0.0.1:4173';

async function waitForAI(page) {
  await page.waitForFunction(() => !!(
    window.ScholarkAI &&
    window.ScholarkAIAgents &&
    window.ScholarkAIContext &&
    window.ScholarkAIDashboard &&
    window.ScholarkAIBridge &&
    window.ScholarkAIReliability &&
    window.ScholarkAIUI &&
    window.ScholarkAIUIPolish &&
    window.ScholarkAIPractice &&
    window.ScholarkAIPracticeUI &&
    window.ScholarkAIHealth
  ), null, { timeout: 25000 });
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try { Object.defineProperty(Navigator.prototype, 'gpu', { configurable: true, get: () => undefined }); } catch (_) {}
  });
});

test('ai-107 boot is bounded, cinematic-first, and remains event-loop responsive', async ({ page }) => {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await waitForAI(page);

  const state = await page.evaluate(async () => {
    const loader = window.ScholarkFeatureLoader;
    const started = performance.now();
    await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 80)));
    return {
      build: loader?.build,
      cinematicReadyAt: Number(loader?.state?.cinematicReadyAt || 0),
      cinematicReadyReason: loader?.state?.cinematicReadyReason || '',
      aiBootScheduledAt: Number(loader?.state?.aiBootScheduledAt || 0),
      aiBootStartedAt: Number(loader?.state?.aiBootStartedAt || 0),
      aiReadyAt: Number(loader?.state?.aiReadyAt || 0),
      aiBootError: loader?.state?.aiBootError || null,
      heartbeatMs: performance.now() - started
    };
  });

  expect(state.build).toBe('ai-107');
  expect(state.cinematicReadyAt).toBeGreaterThan(0);
  expect(['cinematic-promise', 'ready-class']).toContain(state.cinematicReadyReason);
  expect(state.aiBootScheduledAt).toBeGreaterThanOrEqual(state.cinematicReadyAt);
  expect(state.aiBootStartedAt).toBeGreaterThanOrEqual(state.cinematicReadyAt);
  expect(state.aiReadyAt).toBeGreaterThanOrEqual(state.aiBootStartedAt);
  expect(state.aiBootError).toBeNull();
  expect(state.heartbeatMs).toBeLessThan(2000);
});

test('AI UI polish settles after mutations instead of creating a mutation storm', async ({ page }) => {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await waitForAI(page);
  await page.evaluate(() => window.ScholarkAIUI.open());
  await expect(page.locator('#sk-ai-dialog')).toBeVisible();

  const result = await page.evaluate(async () => {
    const dialog = document.querySelector('#sk-ai-dialog');
    let mutationRecords = 0;
    const observer = new MutationObserver(records => { mutationRecords += records.length; });
    observer.observe(dialog, { childList: true, subtree: true, characterData: true });

    const marker = document.createElement('span');
    marker.hidden = true;
    marker.textContent = 'hardening-probe';
    dialog.appendChild(marker);
    marker.remove();

    await new Promise(resolve => setTimeout(resolve, 180));
    observer.disconnect();
    return {
      mutationRecords,
      welcome: document.querySelector('#sk-ai-dialog .sk-ai-welcome span')?.textContent || '',
      polishVersion: window.ScholarkAIUIPolish?.version || ''
    };
  });

  expect(result.polishVersion).toBe('1.0.1');
  expect(result.welcome).toContain('strongest practical on-device model');
  expect(result.mutationRecords).toBeLessThan(20);
});

test('essay autosave persists in the AI namespace without modifying legacy state', async ({ page }) => {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await waitForAI(page);

  const sentinel = JSON.stringify({ keep: true, scope: 'legacy-hardening' });
  const draft = 'I kept returning to the failed prototype because each error changed the question I was asking. Instead of hiding the mistake, I documented it, tested one variable at a time, and learned to treat revision as evidence rather than embarrassment.';

  const hook = await page.evaluate(({ value, draftText }) => {
    localStorage.setItem('gs_ai_hardening_sentinel', value);
    const textarea = document.querySelector('#essay-textarea');
    if (!textarea) return { found: false, autosaveHook: false };
    textarea.value = draftText;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    return { found: true, autosaveHook: textarea.dataset.skAiAutosave === '1' };
  }, { value: sentinel, draftText: draft });

  expect(hook.found).toBe(true);
  expect(hook.autosaveHook).toBe(true);
  await page.waitForTimeout(900);

  const saved = await page.evaluate(() => {
    const uid = window.currentUser?.uid || window._gsUser?.uid || 'local';
    const key = `essay_autosave_${uid}`;
    return {
      value: window.ScholarkAI.storage.read(key, null),
      rawKeys: Object.keys(localStorage).filter(k => k.includes('essay_autosave_')),
      legacy: localStorage.getItem('gs_ai_hardening_sentinel')
    };
  });

  expect(saved.value?.text).toBe(draft);
  expect(saved.rawKeys.some(k => k.startsWith('scholark_ai_v1_essay_autosave_'))).toBe(true);
  expect(saved.legacy).toBe(sentinel);
});

test('new conversation and cancel-generation affect only AI state', async ({ page }) => {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await waitForAI(page);

  const sentinel = JSON.stringify({ keep: true, value: 417 });
  await page.evaluate(value => {
    localStorage.setItem('gs_ai_clear_sentinel', value);
    window.ScholarkAI.sessions.append('tutor', 'user', 'temporary AI-only context');
    window.ScholarkAI.cancelGeneration();
    window.ScholarkAIUI.open();
  }, sentinel);

  await expect(page.locator('#sk-ai-dialog')).toBeVisible();
  await page.locator('.sk-ai-new').click();

  const state = await page.evaluate(() => ({
    tutorMessages: window.ScholarkAI.sessions.get('tutor').messages.length,
    legacy: localStorage.getItem('gs_ai_clear_sentinel'),
    remainingAISessions: Object.keys(localStorage).filter(k => k.startsWith('scholark_ai_v1_session_')).length
  }));

  expect(state.tutorMessages).toBe(0);
  expect(state.remainingAISessions).toBe(0);
  expect(state.legacy).toBe(sentinel);
});

test('reduced-motion preference disables AI pulse animation and quick-action transitions', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await waitForAI(page);
  await page.evaluate(() => window.ScholarkAIUI.open());

  const styles = await page.evaluate(() => {
    const pulse = document.querySelector('.sk-ai-progress > span');
    const quick = document.querySelector('.sk-ai-quick button');
    const duration = quick ? getComputedStyle(quick).transitionDuration : '';
    return {
      pulseAnimation: pulse ? getComputedStyle(pulse).animationName : '',
      quickTransition: duration,
      quickTransitionSeconds: Math.max(0, ...String(duration).split(',').map(value => Number.parseFloat(value) || 0))
    };
  });

  expect(styles.pulseAnimation).toBe('none');
  expect(styles.quickTransitionSeconds).toBeLessThanOrEqual(0.001);
});
