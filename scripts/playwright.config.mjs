import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  timeout: 30000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['line']],
  use: {
    baseURL: process.env.SCHOLARK_BASE_URL || 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [
    { name: 'chromium-desktop', testMatch: ['ap-workflows-audit.spec.mjs', 'admissions-extras-audit.spec.mjs', 'ap-crash-course.spec.mjs', 'admissions-browser.spec.mjs', 'essay-passage-revision.spec.mjs', 'essay-studio.spec.mjs', 'activity-import.spec.mjs', 'activity-live-audit.spec.mjs', 'essay-studio-state-audit.spec.mjs', 'scholark-ai-scope-live-audit.spec.mjs', 'home-routes.spec.mjs', 'scholark-ai-browser.spec.mjs', 'scholark-ai-hardening.spec.mjs', 'scholark-cinematic-visual.spec.mjs'], use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox-desktop', testMatch: ['ap-workflows-audit.spec.mjs', 'admissions-extras-audit.spec.mjs', 'ap-crash-course.spec.mjs', 'admissions-browser.spec.mjs', 'essay-passage-revision.spec.mjs', 'essay-studio.spec.mjs', 'activity-import.spec.mjs', 'activity-live-audit.spec.mjs', 'essay-studio-state-audit.spec.mjs', 'scholark-ai-scope-live-audit.spec.mjs', 'scholark-ai-browser.spec.mjs', 'scholark-cinematic-visual.spec.mjs'], use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit-desktop', testMatch: ['ap-workflows-audit.spec.mjs', 'admissions-extras-audit.spec.mjs', 'ap-crash-course.spec.mjs', 'admissions-browser.spec.mjs', 'essay-passage-revision.spec.mjs', 'essay-studio.spec.mjs', 'activity-import.spec.mjs', 'activity-live-audit.spec.mjs', 'essay-studio-state-audit.spec.mjs', 'scholark-ai-scope-live-audit.spec.mjs', 'scholark-ai-browser.spec.mjs', 'scholark-cinematic-visual.spec.mjs'], use: { ...devices['Desktop Safari'] } },
    { name: 'chromium-mobile', testMatch: 'scholark-ai-mobile-smoke.spec.mjs', use: { ...devices['Pixel 7'] } },
    { name: 'webkit-mobile', testMatch: 'scholark-ai-mobile-smoke.spec.mjs', use: { ...devices['iPhone 14'] } }
  ]
});
