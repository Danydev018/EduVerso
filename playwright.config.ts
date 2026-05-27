import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // los tests de CRUD comparten estado en Supabase
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
  },

  projects: [
    {
      name: 'setup',
      testMatch: '**/auth.setup.ts',
    },
    {
      name: 'smoke',
      testMatch: '**/semana2/00-login.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'semana2',
      testMatch: '**/semana2/0[1-9]-*.spec.ts',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/.auth/coordinator.json',
      },
    },
  ],

  // El servidor dev debe estar corriendo: npm run dev
})
