import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';
import path from 'path';

// Load .env.playwright so BASE_URL is always set without manual env vars
config({ path: path.resolve(__dirname, '.env.playwright') });

const isRemote = !!process.env.BASE_URL && !process.env.BASE_URL.includes('localhost');

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
    locale: 'ar',
  },
  timeout: 120000,

  // Auto-start Next.js dev server when running locally (no BASE_URL set)
  ...(!isRemote && {
    webServer: {
      command: 'npm run dev',
      url: 'http://localhost:3000',
      reuseExistingServer: true,
      timeout: 120000,
    },
  }),

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Firefox + Mobile Chrome — local only (webkit skipped: binary not installed)
    ...(process.env.CI
      ? []
      : [
          { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
          { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
        ]),
  ],
});

