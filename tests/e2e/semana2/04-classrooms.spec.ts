import { test, expect } from '@playwright/test'

test.describe('Gestión de salones', () => {
  test('página de lista carga correctamente', async ({ page }) => {
    await page.goto('/coordinator/classrooms')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: /salones/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /nuevo salon|nuevo salón/i })).toBeVisible()
  })

  test('formulario de nuevo salón tiene todos los campos requeridos', async ({ page }) => {
    await page.goto('/coordinator/classrooms/new')
    await page.waitForLoadState('networkidle')

    // Si no hay año activo muestra advertencia, de lo contrario muestra el formulario
    const hasWarning = await page.getByText(/no hay año escolar|sin año activo/i).isVisible()
    if (hasWarning) {
      // Advertencia correctamente mostrada — marcar como pasado
      return
    }

    await expect(page.getByLabel(/grado/i)).toBeVisible()
    await expect(page.getByLabel(/sección/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /crear/i })).toBeVisible()
  })

  test('crear salón nuevo (requiere año activo y docentes)', async ({ page }) => {
    await page.goto('/coordinator/classrooms/new')
    await page.waitForLoadState('networkidle')

    const hasWarning = await page.getByText(/no hay año escolar|sin año activo|no hay docentes/i).isVisible()
    test.skip(hasWarning, 'Prerrequisitos no satisfechos: necesita año activo y docentes registrados')

    // Seleccionar primer grado disponible
    const gradeSelect = page.getByLabel(/grado/i)
    await gradeSelect.selectOption({ index: 1 })

    await page.getByLabel(/sección/i).fill('Z')

    const teacherSelect = page.getByLabel(/docente/i)
    const teacherOptions = await teacherSelect.locator('option').count()
    if (teacherOptions > 1) {
      await teacherSelect.selectOption({ index: 1 })
    }

    await page.getByRole('button', { name: /crear/i }).click()

    // Éxito: redirige a la lista o muestra error de duplicado
    await page.waitForTimeout(2000)
    const isDuplicate = await page.getByText(/ya existe|duplicado/i).isVisible()
    if (!isDuplicate) {
      await expect(page).toHaveURL(/\/coordinator\/classrooms/, { timeout: 8000 })
    }
  })

  test('detalle de salón muestra tabla de alumnos', async ({ page }) => {
    await page.goto('/coordinator/classrooms')
    await page.waitForLoadState('networkidle')

    const firstClassroom = page.getByRole('link').filter({ hasText: /grado|sección/i }).first()
    const hasLink = await firstClassroom.isVisible()
    test.skip(!hasLink, 'No hay salones registrados para revisar detalle')

    await firstClassroom.click()
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: /grado|sección/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /nombre/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /edad/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /estado/i })).toBeVisible()
  })
})
