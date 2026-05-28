import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : 'list',
  globalSetup: './e2e/global-setup.ts',

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    actionTimeout: 30000,
    navigationTimeout: 120000,
  },
  timeout: 120000,

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Firefox + WebKit + Mobile — local only (not in CI to save time)
    ...(process.env.CI
      ? []
      : [
          { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
          { name: 'webkit', use: { ...devices['Desktop Safari'] } },
          { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
          { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
        ]),
  ],

  // NO webServer block — Vercel is already running
});
