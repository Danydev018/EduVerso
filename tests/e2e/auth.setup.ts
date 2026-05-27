import { test as setup, expect } from '@playwright/test'
import path from 'path'

const authFile = path.join(__dirname, '.auth/coordinator.json')

setup('autenticar como coordinator', async ({ page }) => {
  const email = process.env.TEST_COORDINATOR_EMAIL
  const password = process.env.TEST_COORDINATOR_PASSWORD

  if (!email || !password) {
    throw new Error(
      'Configura TEST_COORDINATOR_EMAIL y TEST_COORDINATOR_PASSWORD en .env.local\n' +
      'Ejemplo:\n  TEST_COORDINATOR_EMAIL=coord@escuela.edu\n  TEST_COORDINATOR_PASSWORD=tupassword'
    )
  }

  await page.goto('/login')
  await page.waitForLoadState('networkidle')

  await page.locator('#email').fill(email)
  await page.locator('#password').fill(password)
  await page.getByRole('button', { name: /ingresar/i }).click()

  // Esperar redirección al dashboard del coordinator
  await page.waitForURL('**/coordinator/dashboard', { timeout: 15000 })
  await expect(page).toHaveURL(/coordinator\/dashboard/)

  await page.context().storageState({ path: authFile })
})
