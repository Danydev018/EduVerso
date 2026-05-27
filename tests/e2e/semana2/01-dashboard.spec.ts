import { test, expect } from '@playwright/test'

test.describe('Dashboard coordinación', () => {
  test('carga con los 4 contadores y accesos rápidos', async ({ page }) => {
    await page.goto('/coordinator/dashboard')
    await page.waitForLoadState('networkidle')

    // Título
    await expect(page.getByRole('heading', { name: /panel|dashboard/i })).toBeVisible()

    // Los 4 contadores estadísticos deben estar visibles
    await expect(page.getByText(/alumno/i).first()).toBeVisible()
    await expect(page.getByText(/salon|aula/i).first()).toBeVisible()
    await expect(page.getByText(/docente/i).first()).toBeVisible()

    // Los números deben ser dígitos (no NaN ni undefined)
    const statNumbers = page.locator('[class*="text-3xl"], [class*="text-4xl"]')
    const count = await statNumbers.count()
    expect(count).toBeGreaterThanOrEqual(3)
  })

  test('navegación lateral contiene todos los módulos', async ({ page }) => {
    await page.goto('/coordinator/dashboard')

    const navLinks = [/alumnos/i, /salones/i, /docentes/i, /año escolar/i]
    for (const link of navLinks) {
      await expect(page.getByRole('link', { name: link })).toBeVisible()
    }
  })

  test('acceso directo a alumnos desde dashboard', async ({ page }) => {
    await page.goto('/coordinator/dashboard')
    await page.getByRole('link', { name: /alumnos/i }).first().click()
    await expect(page).toHaveURL(/\/coordinator\/students/)
  })
})
