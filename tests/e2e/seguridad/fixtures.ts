import fs from 'fs'
import path from 'path'
import { loadEnvConfig } from '@next/env'

/**
 * Ayudantes para las pruebas de seguridad a nivel de datos.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * POR QUÉ ESTAS PRUEBAS NO USAN NAVEGADOR
 *
 * Las demás pruebas de la suite verifican la interfaz: que un botón exista,
 * que un formulario valide. Estas verifican otra cosa: que la BASE DE DATOS
 * niegue el acceso, aunque quien pregunte no pase por la interfaz.
 *
 * La diferencia importa. Un alumno con las herramientas de desarrollo del
 * navegador tiene su propio JWT y puede llamar a la API REST de Supabase
 * directamente, salteándose por completo las páginas de la aplicación. Si la
 * protección viviera solo en el código de las páginas, no protegería nada.
 * Por eso acá no se abre ninguna página: se ataca la API con el token de cada
 * rol, que es exactamente lo que haría alguien curioso.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * CÓMO SE LEEN LOS RESULTADOS
 *
 * Con RLS, "no tienes permiso" casi nunca es un 403: al leer, las filas que
 * no te corresponden simplemente NO EXISTEN para ti, así que la respuesta es
 * 200 con una lista vacía. Por eso las pruebas afirman sobre el CONTENIDO y
 * no sobre el código de estado. Un 200 con datos ajenos es la falla; un 200
 * vacío es el éxito.
 */

loadEnvConfig(process.cwd())

export const URL_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
export const CLAVE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
export const CLAVE_SERVICIO = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

/** Cuentas que la batería provisiona y usa. Ver `00-provision.setup.ts`. */
export const CUENTAS = {
  docenteA: { correo: 'qa.docente.a@eduverso.com', clave: 'EduVerso.QA.2026', nombre: 'QA Docente A' },
  docenteB: { correo: 'qa.docente.b@eduverso.com', clave: 'EduVerso.QA.2026', nombre: 'QA Docente B' },
  alumnoA: { correo: 'qa.alumno.a@eduverso.com', clave: 'EduVerso.QA.2026', nombre: 'QA Alumno A' },
  alumnoB: { correo: 'qa.alumno.b@eduverso.com', clave: 'EduVerso.QA.2026', nombre: 'QA Alumno B' },
} as const

/**
 * Faltan credenciales para correr esto.
 *
 * Se comprueba con una función y no al importar para que el fallo se vea como
 * una prueba saltada con motivo, en vez de como un error de carga del módulo.
 */
export function faltanClaves(): string | null {
  if (!URL_SUPABASE) return 'Falta NEXT_PUBLIC_SUPABASE_URL en .env.local'
  if (!CLAVE_ANON) return 'Falta NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local'
  if (!CLAVE_SERVICIO) return 'Falta SUPABASE_SERVICE_ROLE_KEY en .env.local'
  return null
}

/** Inicia sesión y devuelve el JWT de ese usuario. */
export async function tokenDe(correo: string, clave: string): Promise<string> {
  const r = await fetch(`${URL_SUPABASE}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: CLAVE_ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: correo, password: clave }),
  })
  const d = await r.json()
  if (!d.access_token) {
    throw new Error(`No se pudo iniciar sesión como ${correo}: ${JSON.stringify(d).slice(0, 200)}`)
  }
  return d.access_token as string
}

/**
 * Consulta la API REST haciéndose pasar por alguien.
 *
 * `token` nulo = anónimo (solo la clave pública, sin sesión), que es el caso
 * de quien no ha iniciado sesión.
 */
export async function leerComo(
  token: string | null,
  ruta: string,
): Promise<{ estado: number; datos: unknown }> {
  const cabeceras: Record<string, string> = { apikey: CLAVE_ANON }
  if (token) cabeceras.Authorization = `Bearer ${token}`
  const r = await fetch(`${URL_SUPABASE}/rest/v1/${ruta}`, { headers: cabeceras })
  return { estado: r.status, datos: await r.json().catch(() => null) }
}

/** Intenta escribir haciéndose pasar por alguien. */
export async function escribirComo(
  token: string | null,
  ruta: string,
  cuerpo: unknown,
  metodo: 'POST' | 'PATCH' = 'POST',
): Promise<{ estado: number; datos: unknown }> {
  const cabeceras: Record<string, string> = {
    apikey: CLAVE_ANON,
    'Content-Type': 'application/json',
  }
  if (token) cabeceras.Authorization = `Bearer ${token}`
  const r = await fetch(`${URL_SUPABASE}/rest/v1/${ruta}`, {
    method: metodo,
    headers: cabeceras,
    body: JSON.stringify(cuerpo),
  })
  return { estado: r.status, datos: await r.json().catch(() => null) }
}

/** Como `leerComo`, pero con la llave de servicio: ve todo, sin RLS. */
export async function leerComoServicio(ruta: string): Promise<unknown> {
  const r = await fetch(`${URL_SUPABASE}/rest/v1/${ruta}`, {
    headers: { apikey: CLAVE_SERVICIO, Authorization: `Bearer ${CLAVE_SERVICIO}` },
  })
  return r.json()
}

/** Cuántas filas devolvió una lectura. -1 si la respuesta no fue una lista. */
export function filas(datos: unknown): number {
  return Array.isArray(datos) ? datos.length : -1
}

/**
 * Saca las respuestas correctas de un texto de quiz.
 *
 * Replica la marca que usa `lib/quiz.ts`: la opción correcta lleva un `*` al
 * final de su línea. Se duplica a propósito en vez de importar el parser real,
 * para que la prueba siga detectando la fuga aunque alguien cambie el parser.
 */
export function respuestasCorrectas(texto: string | null | undefined): string[] {
  if (!texto) return []
  // Bucle con `exec` en vez de `matchAll` para no depender del target de
  // TypeScript del proyecto, que no habilita la iteración de iteradores.
  const patron = /^\s*[A-Za-z][).]\s*(.+?)\s*\*\s*$/gm
  const salida: string[] = []
  let m: RegExpExecArray | null
  while ((m = patron.exec(texto)) !== null) salida.push(m[1])
  return salida
}

/** Ids del escenario que deja el provisionamiento. */
export interface Escenario {
  anioId: string
  docenteA: string
  docenteB: string
  alumnoA: string
  alumnoB: string
  aulaA: string
  aulaB: string
  actividadA: string
  temaGrado4: string
  temaGrado3: string
}

export const ARCHIVO_IDS = path.join(__dirname, '.ids.json')

/**
 * Lee el escenario provisionado.
 *
 * Vive acá y no en el archivo de provisionamiento porque Playwright prohíbe
 * que un archivo de prueba importe a otro: los `.spec` necesitan estos ids, y
 * el `.setup` es un archivo de prueba.
 */
export function escenario(): Escenario {
  if (!fs.existsSync(ARCHIVO_IDS)) {
    throw new Error('Falta .ids.json — corre primero el proyecto "provision" de Playwright')
  }
  return JSON.parse(fs.readFileSync(ARCHIVO_IDS, 'utf8')) as Escenario
}
