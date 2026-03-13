import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
  testDir: './tests',
  timeout: 600000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
  },
  projects: [
    // Setup authentification
    {
      name: 'setup',
      testMatch: '**/admin.setup.ts',
    },

    // Tests auth sans storageState
    {
      name: 'auth-tests',
      testMatch: '**/auth.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },

    // Tests avec session admin
    {
      name: 'chromium',
      testMatch: ['**/example.spec.ts', '**/admin.spec.ts'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/.auth/admin.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      testMatch: ['**/example.spec.ts', '**/admin.spec.ts'],
      use: {
        ...devices['Desktop Firefox'],
        storageState: 'tests/.auth/admin.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      testMatch: ['**/example.spec.ts', '**/admin.spec.ts'],
      use: {
        ...devices['Desktop Safari'],
        storageState: 'tests/.auth/admin.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'edge',
      testMatch: ['**/example.spec.ts', '**/admin.spec.ts'],
      use: {
        ...devices['Desktop Edge'],
        storageState: 'tests/.auth/admin.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'mobile-chrome',
      testMatch: ['**/example.spec.ts', '**/admin.spec.ts'],
      use: {
        ...devices['Galaxy S20 Ultra'],
        storageState: 'tests/.auth/admin.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'mobile-safari',
      testMatch: ['**/example.spec.ts', '**/admin.spec.ts'],
      use: {
        ...devices['iPhone 16'],
        storageState: 'tests/.auth/admin.json',
      },
      dependencies: ['setup'],
    },
  ],
});