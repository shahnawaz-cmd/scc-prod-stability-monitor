import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * Playwright Configuration for SCC Monitoring Flow
 * Configured with resilient CI timeouts, trace, video, and screenshot artifact recording on failure.
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
    ['html'],
    ['json', { outputFile: 'results.json' }]
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
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
});
