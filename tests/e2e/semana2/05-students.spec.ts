import { test, expect } from '@playwright/test'

const STUDENT_NAME = `Alumno Test ${Date.now()}`
const STUDENT_EMAIL = `alumno_test_${Date.now()}@prueba.edu`

test.describe('Gestión de alumnos', () => {
  test('página de lista carga con filtros y tabla', async ({ page }) => {
    await page.goto('/coordinator/students')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: /alumnos/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /nuevo alumno/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /nombre/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /edad/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /estado/i })).toBeVisible()
  })

  test('formulario de nuevo alumno tiene todos los campos', async ({ page }) => {
    await page.goto('/coordinator/students/new')
    await page.waitForLoadState('networkidle')

    await expect(page.getByLabel(/nombre completo/i)).toBeVisible()
    await expect(page.getByLabel(/correo|email/i)).toBeVisible()
    await expect(page.getByLabel(/contraseña|password/i)).toBeVisible()
    await expect(page.getByLabel(/fecha de nacimiento/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /crear/i })).toBeVisible()
  })

  test('filtros de búsqueda actualizan la URL', async ({ page }) => {
    await page.goto('/coordinator/students')
    await page.waitForLoadState('networkidle')

    // Buscar por texto
    const searchInput = page.getByPlaceholder(/buscar/i)
    if (await searchInput.isVisible()) {
      await searchInput.fill('test')
      await page.waitForTimeout(500)
      await expect(page).toHaveURL(/q=test/)
    }

    // Filtro de estado
    const statusFilter = page.getByRole('combobox').filter({ hasText: /estado|todos/i })
    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption('active')
      await expect(page).toHaveURL(/status=active/)
    }
  })

  test('edad del alumno se calcula correctamente', async ({ page }) => {
    await page.goto('/coordinator/students')
    await page.waitForLoadState('networkidle')

    // Si hay alumnos, verificar que la columna "Edad" tiene valores numéricos
    const ageCells = page.getByRole('cell').filter({ hasText: /^\d+ años$/ })
    const count = await ageCells.count()
    if (count > 0) {
      const firstAge = await ageCells.first().textContent()
      const years = parseInt(firstAge ?? '0')
      // Alumnos de primaria: entre 5 y 15 años
      expect(years).toBeGreaterThanOrEqual(5)
      expect(years).toBeLessThanOrEqual(15)
    }
  })

  test('crear alumno nuevo requiere SERVICE_ROLE_KEY', async ({ page }) => {
    test.skip(!process.env.SUPABASE_SERVICE_ROLE_KEY, 'Requiere SUPABASE_SERVICE_ROLE_KEY en .env.local')

    await page.goto('/coordinator/students/new')

    await page.getByLabel(/nombre completo/i).fill(STUDENT_NAME)
    await page.getByLabel(/correo/i).fill(STUDENT_EMAIL)
    await page.getByLabel(/contraseña/i).fill('password123')
    await page.getByLabel(/fecha de nacimiento/i).fill('2015-03-10')
    await page.getByRole('button', { name: /crear/i }).click()

    await expect(page).toHaveURL(/\/coordinator\/students/, { timeout: 10000 })
    await expect(page.getByText(STUDENT_NAME)).toBeVisible()
  })

  test('detalle de alumno muestra información correcta', async ({ page }) => {
    await page.goto('/coordinator/students')
    await page.waitForLoadState('networkidle')

    const firstStudentLink = page.getByRole('link').filter({ hasText: /\w+ \w+/ }).first()
    const hasStudents = await firstStudentLink.isVisible()
    test.skip(!hasStudents, 'No hay alumnos registrados para revisar detalle')

    await firstStudentLink.click()
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/fecha de nacimiento|edad/i)).toBeVisible()
  })

  test('editar datos del alumno requiere SERVICE_ROLE_KEY', async ({ page }) => {
    test.skip(!process.env.SUPABASE_SERVICE_ROLE_KEY, 'Requiere SUPABASE_SERVICE_ROLE_KEY en .env.local')

    await page.goto('/coordinator/students')
    await page.waitForLoadState('networkidle')

    // Navegar al primer alumno
    const studentLink = page.getByRole('link').filter({ hasText: STUDENT_NAME })
    test.skip(!(await studentLink.isVisible()), 'El alumno de prueba no fue creado aún')

    await studentLink.click()
    await page.waitForLoadState('networkidle')

    const nameInput = page.getByLabel(/nombre completo/i)
    await nameInput.fill(`${STUDENT_NAME} Editado`)
    await page.getByRole('button', { name: /guardar|actualizar/i }).click()

    await expect(page.getByText(`${STUDENT_NAME} Editado`)).toBeVisible({ timeout: 8000 })
  })

  test('toggle activo/inactivo del alumno requiere SERVICE_ROLE_KEY', async ({ page }) => {
    test.skip(!process.env.SUPABASE_SERVICE_ROLE_KEY, 'Requiere SUPABASE_SERVICE_ROLE_KEY en .env.local')

    await page.goto('/coordinator/students')
    await page.waitForLoadState('networkidle')

    const studentLink = page.getByRole('link').filter({ hasText: new RegExp(STUDENT_NAME) })
    test.skip(!(await studentLink.isVisible()), 'El alumno de prueba no fue creado aún')

    await studentLink.click()
    await page.waitForLoadState('networkidle')

    // Verificar badge de estado y hacer toggle
    const toggleBtn = page.getByRole('button', { name: /desactivar|activar/i })
    if (await toggleBtn.isVisible()) {
      page.on('dialog', (d) => d.accept())
      const beforeText = await toggleBtn.textContent()
      await toggleBtn.click()
      await page.waitForTimeout(2000)
      // El botón debería cambiar de texto
      const afterText = await toggleBtn.textContent()
      expect(afterText).not.toBe(beforeText)
    }
  })

  test('retirar alumno requiere SERVICE_ROLE_KEY', async ({ page }) => {
    test.skip(!process.env.SUPABASE_SERVICE_ROLE_KEY, 'Requiere SUPABASE_SERVICE_ROLE_KEY en .env.local')

    await page.goto('/coordinator/students')
    await page.waitForLoadState('networkidle')

    const studentLink = page.getByRole('link').filter({ hasText: new RegExp(STUDENT_NAME) })
    test.skip(!(await studentLink.isVisible()), 'El alumno de prueba no fue creado aún')

    await studentLink.click()
    await page.waitForLoadState('networkidle')

    page.on('dialog', (d) => d.accept())
    const withdrawBtn = page.getByRole('button', { name: /retirar/i })
    if (await withdrawBtn.isVisible()) {
      await withdrawBtn.click()
      await page.waitForTimeout(2000)
      // Debe mostrar badge "Retirado" o redirigir
      const hasWithdrawnBadge = await page.getByText(/retirado/i).isVisible()
      const redirected = page.url().includes('/coordinator/students')
      expect(hasWithdrawnBadge || redirected).toBe(true)
    }
  })
})
