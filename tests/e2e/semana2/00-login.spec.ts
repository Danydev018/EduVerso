import { test, expect } from '@playwright/test'

// Tests de la página de login — no requieren sesión activa
test.use({ storageState: { cookies: [], origins: [] } })

test.describe('Página de login', () => {
  test('muestra el formulario de autenticación', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
    await expect(page.getByRole('button', { name: /ingresar/i })).toBeVisible()
  })

  test('intento de acceso directo redirige al login', async ({ page }) => {
    await page.goto('/coordinator/dashboard')
    // Debe redirigir al login (307 → /login)
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/login/)
  })

  test('login con credenciales inválidas muestra error', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    await page.locator('#email').fill('noexiste@prueba.com')
    await page.locator('#password').fill('wrongpassword')
    await page.getByRole('button', { name: /ingresar/i }).click()

    // El server action redirige a /login?error=invalid con mensaje de error
    await expect(page).toHaveURL(/error=invalid/, { timeout: 8000 })
    await expect(page.getByText(/correo o contraseña incorrectos/i)).toBeVisible()
  })
})
