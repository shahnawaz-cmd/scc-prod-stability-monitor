import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * Playwright Configuration for SCC Production Monitoring & Member Area Flows
 * Single unified configuration routing specific test suites to designated browser devices.
 */
export default defineConfig({
  testDir: './tests',

  /* Maximum time one test can run (60s in CI, 45s locally) */
  timeout: process.env.CI ? 60000 : 45000,

  /* Assertion timeout configuration */
  expect: {
    timeout: 10000,
  },

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if test.only was left in code */
  forbidOnly: !!process.env.CI,
 
  /* Retries in CI (1 retry to avoid multiplier effect) */
  retries: process.env.CI ? 1 : 0,

  /* Worker threads (set to 2 for both local and CI stability) */
  workers: 2,

  /* Reporter config */
  reporter: process.env.CI ? [['blob']] : [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'results.json' }],
    ['list']
  ],

  /* Shared settings */
  use: {
    /* Maximum navigation timeout for page.goto / redirects */
    navigationTimeout: 45000,

    /* Maximum action timeout for click/fill operations */
    actionTimeout: 20000,

    /* Artifact recording settings for debugging failures */
    trace: 'retain-on-failure',       // Collect full trace on test failure
    video: 'retain-on-failure',       // Record and save video on test failure
    screenshot: 'only-on-failure',    // Capture screenshot on test failure
  },

  /* Browser Projects */
  projects: [
    // 🌐 Public Monitoring Flow
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /scc-monitoring\.spec\.ts/,
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
      testMatch: /scc-monitoring\.spec\.ts/,
    },

    // 🔒 Member Area Monitoring Flow (Mobile Chrome Only)
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
      testMatch: /scc-member-area\.spec\.ts/,
    },
  ],
});
