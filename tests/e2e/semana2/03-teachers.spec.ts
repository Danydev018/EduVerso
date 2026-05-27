import { test, expect } from '@playwright/test'

const TEACHER_EMAIL = `docente_test_${Date.now()}@prueba.edu`
const TEACHER_NAME = `Docente Test ${Date.now()}`

test.describe('Gestión de docentes', () => {
  test('página de lista carga correctamente', async ({ page }) => {
    await page.goto('/coordinator/teachers')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: /docentes/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /nuevo docente/i })).toBeVisible()
  })

  test('formulario de nuevo docente tiene todos los campos', async ({ page }) => {
    await page.goto('/coordinator/teachers/new')
    await page.waitForLoadState('networkidle')

    await expect(page.getByLabel(/nombre/i)).toBeVisible()
    await expect(page.getByLabel(/correo|email/i)).toBeVisible()
    await expect(page.getByLabel(/contraseña|password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /crear/i })).toBeVisible()
  })

  test('crear docente nuevo requiere SERVICE_ROLE_KEY', async ({ page }) => {
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
    test.skip(!hasServiceKey, 'Requiere SUPABASE_SERVICE_ROLE_KEY en .env.local')

    await page.goto('/coordinator/teachers/new')

    await page.getByLabel(/nombre completo/i).fill(TEACHER_NAME)
    await page.getByLabel(/correo/i).fill(TEACHER_EMAIL)
    await page.getByLabel(/contraseña/i).fill('password123')
    await page.getByRole('button', { name: /crear/i }).click()

    // Éxito redirige a la lista
    await expect(page).toHaveURL(/\/coordinator\/teachers/, { timeout: 10000 })
    await expect(page.getByText(TEACHER_NAME)).toBeVisible()
  })

  test('rechaza crear docente con email duplicado requiere SERVICE_ROLE_KEY', async ({ page }) => {
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
    test.skip(!hasServiceKey, 'Requiere SUPABASE_SERVICE_ROLE_KEY en .env.local')

    await page.goto('/coordinator/teachers/new')

    // Email del coordinator real (ya existe en auth)
    const existingEmail = process.env.TEST_COORDINATOR_EMAIL!
    await page.getByLabel(/nombre completo/i).fill('Duplicado Test')
    await page.getByLabel(/correo/i).fill(existingEmail)
    await page.getByLabel(/contraseña/i).fill('password123')
    await page.getByRole('button', { name: /crear/i }).click()

    await expect(page.getByText(/exist|duplicado|already/i)).toBeVisible({ timeout: 5000 })
  })
})
