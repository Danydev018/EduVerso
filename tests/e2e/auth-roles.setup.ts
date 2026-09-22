import { test as setup, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { CUENTAS } from './seguridad/fixtures'

/**
 * Deja una sesión guardada para el docente y para el alumno.
 *
 * Reutiliza las cuentas que provisiona la batería de seguridad
 * (`seguridad/00-provision.setup.ts`) en vez de crear otras: esas ya vienen
 * con salón, matrícula y una actividad con quiz, que es justo el escenario que
 * estas pruebas necesitan recorrer. Por eso el proyecto depende de `provision`.
 *
 * El `storageState` que se guarda acá es lo que permite que cada spec arranque
 * ya dentro de la aplicación, sin repetir el login en cada prueba.
 */

const CARPETA = path.join(__dirname, '.auth')

async function entrar(page: import('@playwright/test').Page, correo: string, clave: string, destino: RegExp) {
  await page.goto('/login')
  await page.waitForLoadState('networkidle')
  await page.locator('#email').fill(correo)
  await page.locator('#password').fill(clave)
  await page.getByRole('button', { name: /ingresar/i }).click()
  await page.waitForURL(destino, { timeout: 30_000 })
  await expect(page).toHaveURL(destino)
}

setup('autenticar como docente', async ({ page }) => {
  fs.mkdirSync(CARPETA, { recursive: true })
  await entrar(page, CUENTAS.docenteA.correo, CUENTAS.docenteA.clave, /teacher\/dashboard/)
  await page.context().storageState({ path: path.join(CARPETA, 'docente.json') })
})

setup('autenticar como alumno', async ({ page }) => {
  fs.mkdirSync(CARPETA, { recursive: true })
  // El alumno puede caer en la intro la primera vez; se acepta cualquiera de
  // las dos para no depender de si ya la vio.
  await entrar(page, CUENTAS.alumnoA.correo, CUENTAS.alumnoA.clave, /student\/(dashboard|intro)/)
  await page.context().storageState({ path: path.join(CARPETA, 'alumno.json') })
})
