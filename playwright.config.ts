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

  /* Maximum time one test can run (90s in CI, 60s locally) */
  timeout: process.env.CI ? 90000 : 60000,

  /* Assertion timeout configuration */
  expect: {
    timeout: 15000,
  },

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if test.only was left in code */
  forbidOnly: !!process.env.CI,

  /* Retries in CI */
  retries: process.env.CI ? 2 : 0,

  /* Worker threads */
  workers: process.env.CI ? 4 : undefined,

  /* Reporter config */
  reporter: process.env.CI ? [['blob']] : [
    ['html'],
    ['json', { outputFile: 'results.json' }]
  ],

  /* Shared settings */
  use: {
    /* Maximum navigation timeout for page.goto / redirects (45s in CI) */
    navigationTimeout: process.env.CI ? 45000 : 30000,

    /* Maximum action timeout for click/fill operations (20s in CI) */
    actionTimeout: process.env.CI ? 20000 : 10000,

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
