import { defineConfig, devices } from '@playwright/test'
import { loadEnvConfig } from '@next/env'

// Carga .env.local igual que lo hace Next, así las pruebas usan las mismas
// credenciales que la aplicación sin exportarlas a mano en cada terminal.
// Viene incluido con Next: no añade dependencias.
loadEnvConfig(process.cwd())

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
    // ── Seguridad a nivel de datos ──
    // No abren navegador: atacan la API REST con el token de cada rol, que es
    // el camino que tendría alguien saltándose la interfaz. Van aparte porque
    // no comparten sesión ni estado con las pruebas de interfaz.
    {
      name: 'provision',
      testMatch: '**/seguridad/00-provision.setup.ts',
    },
    {
      name: 'seguridad',
      testMatch: '**/seguridad/0[1-9]-*.spec.ts',
      dependencies: ['provision'],
    },
    // ── Recorridos de alumno y docente ──
    // Sí abren navegador: verifican el flujo completo, no las políticas.
    // Reutilizan las cuentas que provisiona el proyecto `provision`.
    {
      name: 'roles',
      testMatch: '**/auth-roles.setup.ts',
      dependencies: ['provision'],
    },
    {
      name: 'alumno',
      testMatch: '**/alumno/*.spec.ts',
      dependencies: ['roles'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/.auth/alumno.json',
      },
    },
    {
      name: 'docente',
      testMatch: '**/docente/*.spec.ts',
      dependencies: ['roles'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/.auth/docente.json',
      },
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
