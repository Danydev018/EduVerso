/**
 * Captura las pantallas del sistema para el anexo del Trabajo de Grado.
 *
 *     npm run dev          # en otra terminal
 *     node scripts/capturas-anexo.mjs
 *
 * Las imágenes salen a `docs/capturas/`. Desde ahí las incrusta
 * `scripts/md-a-docx.py` al generar el .docx.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * POR QUÉ USA LAS CUENTAS QA Y NO LAS REALES
 *
 * Las cuentas `qa.*` ya vienen con salón, matrícula y una actividad con quiz
 * —las provisiona `tests/e2e/seguridad/00-provision.setup.ts`—, así que las
 * pantallas salen con datos y no vacías. Además evita que aparezcan nombres de
 * estudiantes reales en un documento que se consigna: la LOPNNA, citada en las
 * bases legales de la propia propuesta, protege su imagen y su intimidad.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * POR QUÉ deviceScaleFactor 2
 *
 * Una captura a 1× se ve borrosa impresa. Al doble de densidad el texto de la
 * interfaz sigue siendo legible en papel.
 */
import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const BASE = 'http://localhost:3000'
const CLAVE = 'EduVerso.QA.2026'
const SALIDA = path.join(process.cwd(), 'docs', 'capturas')

const VISTA = { width: 1440, height: 900 }

async function entrar(ctx, correo, destino) {
  const p = await ctx.newPage()
  await p.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await p.locator('#email').fill(correo)
  await p.locator('#password').fill(CLAVE)
  await p.getByRole('button', { name: /ingresar/i }).click()
  await p.waitForURL(destino, { timeout: 40_000 })
  await p.waitForLoadState('networkidle')
  return p
}

/** El alumno nuevo cae en la cinemática de bienvenida. */
async function saltarIntro(p) {
  // La redirección a la intro llega después de que `networkidle` se cumple,
  // así que comprobar la URL una sola vez no basta: la primera lectura dice
  // /student/dashboard y un instante más tarde la pantalla es la intro.
  for (let i = 0; i < 3 && !p.url().includes('/student/intro'); i++) {
    await p.waitForTimeout(1200)
  }
  if (!p.url().includes('/student/intro')) return
  const saltar = p.getByRole('link', { name: /saltar/i }).or(p.getByRole('button', { name: /saltar/i }))
  await saltar.first().click()
  await p.waitForURL(/student\/dashboard/, { timeout: 30_000 })
  await p.waitForLoadState('networkidle')
}

/**
 * Captura desde el borde superior hasta donde termina `selector`.
 *
 * Algunas pantallas ocupan un tercio del alto y el resto es fondo vacío —el
 * salón de prueba tiene un solo estudiante—. Impresa, esa figura es sobre todo
 * un rectángulo negro. Recortando al contenido, la figura muestra lo que tiene
 * que mostrar y ocupa lo que le corresponde en la página.
 */
async function tomarRecortado(p, archivo, ruta, selector) {
  await p.goto(`${BASE}${ruta}`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(2500)
  const fin = await p.locator(selector).first().evaluate(
    (el) => el.getBoundingClientRect().bottom + window.scrollY,
  )
  await p.screenshot({
    path: path.join(SALIDA, archivo),
    clip: { x: 0, y: 0, width: VISTA.width, height: Math.ceil(fin) + 40 },
  })
  console.log(`  ${archivo.padEnd(34)} ${ruta} (recortada)`)
}

async function tomar(p, archivo, ruta) {
  if (ruta) {
    await p.goto(`${BASE}${ruta}`, { waitUntil: 'networkidle' })
    await saltarIntro(p)
  }
  // Las animaciones de entrada del tablero terminan solas; sin la espera, la
  // captura las congela a media opacidad.
  await p.waitForTimeout(2500)
  await p.screenshot({ path: path.join(SALIDA, archivo) })
  console.log(`  ${archivo.padEnd(34)} ${p.url().replace(BASE, '')}`)
}

async function main() {
  fs.mkdirSync(SALIDA, { recursive: true })
  const nav = await chromium.launch()

  // ── Pública ──
  const anon = await nav.newContext({ viewport: VISTA, deviceScaleFactor: 2 })
  const pa = await anon.newPage()
  await tomar(pa, '01-login.png', '/login')
  await anon.close()

  // ── Docente ──
  const cd = await nav.newContext({ viewport: VISTA, deviceScaleFactor: 2 })
  const pd = await entrar(cd, 'qa.docente.a@eduverso.com', /teacher\/dashboard/)
  await tomar(pd, '02-docente-tablero.png')
  await tomarRecortado(pd, '03-docente-salon.png', '/teacher/classroom', 'table')
  await tomar(pd, '04-docente-actividades.png', '/teacher/activities')
  await tomar(pd, '05-docente-lecciones.png', '/teacher/lecciones')

  // El editor de escenas: se entra por el primer tema de la lista, porque su
  // id depende de los datos y no se puede fijar en el script.
  // `waitForURL` es imprescindible: sin él `networkidle` se cumple con la
  // página VIEJA todavía en pantalla y la captura sale de la lista, no del
  // editor.
  const editar = pd.getByRole('link', { name: /editar/i }).first()
  if (await editar.count() > 0) {
    await editar.click()
    await pd.waitForURL(/teacher\/lecciones\/.+/, { timeout: 40_000 })
    await pd.waitForLoadState('networkidle')
    await tomar(pd, '06-docente-editor-leccion.png')

    // El lienzo es la pantalla que distingue al proyecto —catálogo de 131
    // piezas en 14 categorías— y vive tras la pestaña "Diseñar".
    const disenar = pd.getByRole('button', { name: /dise(ñ|n)ar/i }).first()
    if (await disenar.count() > 0) {
      await disenar.click()
      await pd.waitForTimeout(1800)

      /*
        Las categorías de la paleta son <details>, no botones: se abren
        poniéndoles `open`, no haciendo clic. Con todas plegadas el anexo
        muestra una lista de nombres y no se ve que el catálogo son dibujos.
      */
      await pd.evaluate(() => {
        const cats = [...document.querySelectorAll('details')]
        const nat = cats.find((d) => /^Naturaleza/.test(d.textContent.trim()))
        if (nat) nat.open = true
      })
      await pd.waitForTimeout(1200)

      /*
        Se colocan tres piezas para que el lienzo no salga vacío: una escena
        armada muestra de qué se trata la herramienta; un recuadro en blanco
        con el texto "Arrastra una pieza aquí" no muestra nada.

        NO se guarda la lección. Tocar una pieza la agrega al estado local del
        editor; la lección solo cambia si se envía el formulario, y el script
        se va de la página sin hacerlo.
      */
      for (const pieza of ['Sol', 'Árbol', 'Montaña']) {
        const b = pd.getByRole('button', { name: pieza, exact: true }).first()
        if (await b.count() > 0) {
          await b.click()
          await pd.waitForTimeout(500)
        }
      }
      await pd.waitForTimeout(800)

      /*
        Se captura el ELEMENTO del editor, no la ventana. El editor queda por
        debajo del pliegue y es más alto que el viewport: capturando la ventana
        sale cortado por arriba y por abajo. Playwright, en cambio, encuadra el
        elemento entero.

        `ancestor::div[3]` sube desde el lienzo hasta la tarjeta que contiene
        la barra de herramientas, el lienzo y la paleta: las tres cosas que la
        figura tiene que mostrar juntas.
      */
      const editor = pd.locator('[data-lienzo]').first().locator('xpath=ancestor::div[3]')
      await editor.screenshot({ path: path.join(SALIDA, '07-docente-lienzo.png') })
      console.log(`  ${'07-docente-lienzo.png'.padEnd(34)} (elemento: editor de escenas)`)
    }
  } else {
    console.log('  (ningún tema con lección para abrir el editor)')
  }
  await cd.close()

  // ── Alumno ──
  const ca = await nav.newContext({ viewport: VISTA, deviceScaleFactor: 2 })
  const pl = await entrar(ca, 'qa.alumno.a@eduverso.com', /student\/(dashboard|intro)/)
  await saltarIntro(pl)
  await tomar(pl, '08-alumno-tablero.png', '/student/dashboard')
  await tomar(pl, '09-alumno-misiones.png', '/student/activities')

  const mision = pl.locator('a[href*="/student/activities/"]').first()
  if (await mision.count() > 0) {
    await mision.click()
    await pl.waitForURL(/student\/activities\/.+/, { timeout: 40_000 })
    await pl.waitForLoadState('networkidle')
    await tomar(pl, '10-alumno-actividad.png')
  }
  await ca.close()

  await nav.close()
  console.log(`\nListo. Las capturas están en docs/capturas/`)
}

main().catch((e) => { console.error(e); process.exit(1) })
