import { test, expect } from '@playwright/test'

const YEAR_NAME = `Test ${Date.now()}`

test.describe('Años escolares', () => {
  test('página carga con tabla y formulario', async ({ page }) => {
    await page.goto('/coordinator/school-years')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: /año escolar/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /nombre/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /inicio/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /fin/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /estado/i })).toBeVisible()
  })

  test('crear año escolar nuevo', async ({ page }) => {
    await page.goto('/coordinator/school-years')
    await page.waitForLoadState('networkidle')

    await page.getByLabel(/nombre/i).fill(YEAR_NAME)
    await page.getByLabel(/inicio/i).fill('2025-09-15')
    await page.getByLabel(/fin/i).fill('2026-07-15')
    await page.getByRole('button', { name: /crear/i }).click()

    // Debe aparecer en la tabla después de revalidación
    await expect(page.getByText(YEAR_NAME)).toBeVisible({ timeout: 8000 })
  })

  test('rechaza año con fecha fin anterior a inicio', async ({ page }) => {
    await page.goto('/coordinator/school-years')

    await page.getByLabel(/nombre/i).fill('Año inválido')
    await page.getByLabel(/inicio/i).fill('2025-09-15')
    await page.getByLabel(/fin/i).fill('2025-08-01') // fin < inicio
    await page.getByRole('button', { name: /crear/i }).click()

    await expect(page.getByText(/fin.*inicio|fecha|inválid/i)).toBeVisible({ timeout: 5000 })
  })

  test('activar un año escolar', async ({ page }) => {
    await page.goto('/coordinator/school-years')
    await page.waitForLoadState('networkidle')

    // Buscar el año recién creado en la fila y hacer click en "Activar"
    const row = page.getByRole('row').filter({ hasText: YEAR_NAME })
    const activateBtn = row.getByRole('button', { name: /activar/i })

    // Si ya está activo no habrá botón; si no, activar
    const hasButton = await activateBtn.isVisible()
    if (hasButton) {
      page.on('dialog', (d) => d.accept())
      await activateBtn.click()
      await expect(row.getByText(/activo/i)).toBeVisible({ timeout: 8000 })
    } else {
      // El año ya está activo, verificar badge
      await expect(row.getByText(/activo/i)).toBeVisible()
    }
  })
})
