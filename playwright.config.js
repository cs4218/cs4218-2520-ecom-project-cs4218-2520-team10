import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: './client/.env' });

export default defineConfig({
  // Directory where your tests are
  testDir: './client/tests/e2e',

  // Run tests in parallel
  fullyParallel: false, // Keep false if tests share DB state

  // Retry failed tests once
  retries: 1,

  // Timeout per test
  timeout: 30000,

  // Reporter
  reporter: 'html',

  use: {
    // Base URL so you can use relative URLs in tests
    baseURL: 'http://localhost:3000',

    // Keep browser open on failure for debugging
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  // Browser to test on
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],

  // Start your dev server before tests run
  webServer: [
    {
      command: 'npm run server', // starts backend
      url: 'http://localhost:6060',
      reuseExistingServer: true,
      timeout: 30000,
    },
    {
      command: 'npm run client', // starts frontend
      url: 'http://localhost:3000',
      reuseExistingServer: true,
      timeout: 60000,
    },
  ],
});