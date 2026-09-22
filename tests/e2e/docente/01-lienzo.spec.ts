import { test, expect, type Page } from '@playwright/test'
import { escenario, faltanClaves, URL_SUPABASE, CLAVE_SERVICIO } from '../seguridad/fixtures'

/**
 * Editor de escenas del docente.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * QUÉ SE JUEGA ACÁ
 *
 * Es la pieza más nueva y la más compleja del sistema: un lienzo con 131
 * componentes, seis herramientas y un asistente de IA, todo sobre eventos de
 * puntero. Nada de eso se puede verificar leyendo el código.
 *
 * La prueba que más importa es la última: **que la escena sobreviva a guardar
 * y recargar**. Si el documento no persiste, todo lo demás es decorado.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * POR QUÉ DEJA LA LECCIÓN COMO ESTABA
 *
 * Escribe en un tema real del grado del docente. Al terminar, borra la
 * lección que creó: si no, la segunda corrida encontraría un editor con
 * contenido y probaría otra cosa.
 */

let esc: ReturnType<typeof escenario>

test.beforeAll(() => {
  const falta = faltanClaves()
  test.skip(!!falta, falta ?? '')
  esc = escenario()
})

/** Borra la lección del tema de prueba, por fuera de la aplicación. */
async function borrarLeccion(temaId: string) {
  await fetch(`${URL_SUPABASE}/rest/v1/topic_lessons?topic_id=eq.${temaId}`, {
    method: 'DELETE',
    headers: { apikey: CLAVE_SERVICIO, Authorization: `Bearer ${CLAVE_SERVICIO}` },
  })
}

test.afterAll(async () => {
  if (esc) await borrarLeccion(esc.temaGrado4)
})

/** Lee la lección del tema desde la base, sin pasar por la aplicación. */
async function leccionGuardada(temaId: string) {
  const r = await fetch(
    `${URL_SUPABASE}/rest/v1/topic_lessons?topic_id=eq.${temaId}&select=title,pages`,
    { headers: { apikey: CLAVE_SERVICIO, Authorization: `Bearer ${CLAVE_SERVICIO}` } },
  )
  const filas = (await r.json()) as { title: string; pages: unknown[] }[]
  return filas?.[0] ?? null
}

/** El lienzo, por su ancla de pruebas. */
function lienzo(page: Page) {
  return page.locator('[data-lienzo]').first()
}

/** Cuántos elementos tiene la escena, contando los agarres de selección. */
async function elementos(page: Page) {
  return lienzo(page).locator('button[aria-label^="Seleccionar"]').count()
}

/**
 * Trazos DIBUJADOS.
 *
 * Se excluye `[data-calco]` a propósito: dentro del lienzo hay dos SVG con el
 * mismo `viewBox` —el dibujo y la capa invisible que da área de agarre a
 * trazos y flechas— y cada trazo aparece en los dos. Contando ambos, un solo
 * trazo se leía como dos y parecía un fallo del pincel.
 */
async function trazos(page: Page) {
  return lienzo(page)
    .locator('svg:not([data-calco]) > path[stroke-linecap="round"]')
    .count()
}

/**
 * Abre el editor del tema de prueba en modo Diseñar.
 *
 * Si el tema todavía no tiene lección, el editor muestra "Nueva lección" SIN
 * ninguna página, y los modos de ilustración viven dentro de la tarjeta de
 * página: sin agregar una, el botón "Diseñar" no existe. Por eso hay que
 * crearla acá y no dar por hecho que ya está.
 */
async function abrirDisenar(page: Page, temaId: string) {
  await page.goto(`/teacher/lecciones/${temaId}`)
  await page.waitForLoadState('networkidle')

  const disenar = page.getByRole('button', { name: /^Diseñar$/ })
  if ((await disenar.count()) === 0) {
    await page.getByRole('button', { name: /agregar página/i }).click()
    await page.waitForTimeout(600)
  }

  await expect(disenar.first()).toBeVisible({ timeout: 15_000 })
  await disenar.first().click()
  await expect(lienzo(page)).toBeVisible({ timeout: 15_000 })
}

/** Elige una herramienta del riel. */
async function herramienta(page: Page, nombre: RegExp) {
  await page.getByRole('button', { name: nombre }).first().click()
  await page.waitForTimeout(250)
}

test.describe('La paleta', () => {
  test('arranca con las categorías plegadas y su recuento', async ({ page }) => {
    await abrirDisenar(page, esc.temaGrado4)

    const categorias = page.locator('details')
    const total = await categorias.count()
    expect(total, 'debe haber varias categorías').toBeGreaterThan(5)

    for (let i = 0; i < total; i++) {
      expect(
        await categorias.nth(i).evaluate((d) => (d as HTMLDetailsElement).open),
        'ninguna debe venir abierta',
      ).toBe(false)
    }
  })

  test('al expandir, las piezas se dibujan de verdad', async ({ page }) => {
    await abrirDisenar(page, esc.temaGrado4)

    const categoria = page.locator('details').first()
    await categoria.locator('summary').click()

    const piezas = categoria.locator('button[draggable="true"]')
    await expect(piezas.first()).toBeVisible()
    expect(await piezas.count(), 'la categoría debe traer piezas').toBeGreaterThan(0)

    // Cada pieza lleva su miniatura en SVG. Si fuera solo texto, el `viewBox`
    // no estaría: es lo que distingue el catálogo dibujado del de nombres.
    const primera = piezas.first().locator('svg')
    await expect(primera).toHaveAttribute('viewBox', /.+/)

    // Y esa miniatura tiene que tener contenido, no ser un marco vacío.
    const caja = await primera.evaluate((svg) => {
      const b = (svg as SVGGraphicsElement).getBBox()
      return { w: b.width, h: b.height }
    })
    expect(caja.w, 'la miniatura debe dibujar algo').toBeGreaterThan(1)
    expect(caja.h).toBeGreaterThan(1)
  })
})

test.describe('Colocar y quitar piezas', () => {
  test('tocar una pieza la agrega al lienzo', async ({ page }) => {
    await abrirDisenar(page, esc.temaGrado4)

    const antes = await elementos(page)
    await page.locator('details').first().locator('summary').click()
    await page.locator('button[draggable="true"]').first().click()
    await page.waitForTimeout(600)

    expect(await elementos(page), 'debe haber un elemento más').toBe(antes + 1)
  })

  test('arrastrar una pieza la deja donde se suelta', async ({ page }) => {
    await abrirDisenar(page, esc.temaGrado4)
    await page.locator('details').first().locator('summary').click()

    const pieza = page.locator('button[draggable="true"]').first()
    const marco = lienzo(page)
    const caja = await marco.boundingBox()
    expect(caja, 'el lienzo debe estar en pantalla').toBeTruthy()

    // Se suelta en el cuadrante inferior derecho, bien lejos del centro donde
    // caería si el arrastre se ignorara y solo funcionara el toque.
    await pieza.dragTo(marco, {
      targetPosition: { x: caja!.width * 0.8, y: caja!.height * 0.75 },
    })
    await page.waitForTimeout(700)

    expect(await elementos(page)).toBeGreaterThan(0)

    const agarre = marco.locator('button[aria-label^="Seleccionar"]').last()
    const r = await agarre.boundingBox()
    const centroX = (r!.x + r!.width / 2 - caja!.x) / caja!.width
    expect(centroX, 'debe quedar a la derecha, no en el centro').toBeGreaterThan(0.6)
  })

  test('el botón eliminar quita el elemento elegido', async ({ page }) => {
    await abrirDisenar(page, esc.temaGrado4)
    await page.locator('details').first().locator('summary').click()
    await page.locator('button[draggable="true"]').first().click()
    await page.waitForTimeout(600)

    const antes = await elementos(page)
    expect(antes).toBeGreaterThan(0)

    // Al agregarla queda elegida, así que su barra flotante ya está puesta.
    await lienzo(page).getByRole('button', { name: /eliminar este elemento/i }).click()
    await page.waitForTimeout(500)

    expect(await elementos(page), 'debe quedar uno menos').toBe(antes - 1)
  })
})

test.describe('Dibujar y borrar', () => {
  test('el pincel deja un trazo y el borrador lo quita sin tocar las piezas', async ({ page }) => {
    await abrirDisenar(page, esc.temaGrado4)

    // Una pieza, para comprobar después que el borrador la respeta.
    await page.locator('details').first().locator('summary').click()
    await page.locator('button[draggable="true"]').first().click()
    await page.waitForTimeout(600)
    const piezas = await elementos(page)

    // ── Pincel ──
    await herramienta(page, /^Pincel$/)
    const caja = await lienzo(page).boundingBox()
    const y = caja!.y + caja!.height * 0.3

    await page.mouse.move(caja!.x + caja!.width * 0.2, y)
    await page.mouse.down()
    for (let i = 1; i <= 6; i++) {
      await page.mouse.move(caja!.x + caja!.width * (0.2 + i * 0.05), y)
      await page.waitForTimeout(60)
    }
    await page.mouse.up()
    await page.waitForTimeout(700)

    expect(await trazos(page), 'el pincel debe dejar un trazo').toBe(1)

    // ── Borrador ──
    await herramienta(page, /^Borrador$/)
    const caja2 = await lienzo(page).boundingBox()
    const y2 = caja2!.y + caja2!.height * 0.3

    await page.mouse.move(caja2!.x + caja2!.width * 0.3, y2)
    await page.mouse.down()
    await page.mouse.move(caja2!.x + caja2!.width * 0.35, y2)
    await page.mouse.up()
    await page.waitForTimeout(700)

    expect(await trazos(page), 'el borrador debe quitar el trazo').toBe(0)
    expect(
      await elementos(page),
      'el borrador NO debe tocar las piezas: para eso está el botón eliminar',
    ).toBe(piezas)
  })

  test('el texto se escribe y se ve en el dibujo', async ({ page }) => {
    await abrirDisenar(page, esc.temaGrado4)

    await herramienta(page, /^Texto$/)
    const caja = await lienzo(page).boundingBox()
    await page.mouse.click(caja!.x + caja!.width * 0.5, caja!.y + caja!.height * 0.35)
    await page.waitForTimeout(700)

    // Colocar un texto abre la escritura sola, con el texto de muestra
    // preseleccionado: se puede escribir de una vez.
    const campo = lienzo(page).locator('input')
    await expect(campo).toBeVisible({ timeout: 10_000 })
    await campo.fill('El agua se evapora')
    await campo.press('Enter')
    await page.waitForTimeout(600)

    const textos = lienzo(page).locator('svg[viewBox="0 0 400 220"] text')
    await expect(textos.filter({ hasText: 'El agua se evapora' })).toHaveCount(1)
  })
})

test.describe('La escena sobrevive a guardar', () => {
  /**
   * La prueba que de verdad importa.
   *
   * Todo lo anterior ocurre en memoria del navegador. Esto comprueba que el
   * documento de la escena llegue a `topic_lessons.pages[].escena`, vuelva al
   * recargar, y se dibuje otra vez. Sin esto, el editor sería una demostración.
   */
  test('se guarda, se recarga y sigue ahí', async ({ page }) => {
    /*
      Esta prueba necesita más reloj que las demás: escribe la lección, espera
      a que la Server Action la deje en la base (hasta 25 s), recarga la página
      y vuelve a montar el editor. Con el tiempo por defecto de 30 s se quedaba
      sin margen justo en la última aserción, y el fallo parecía un selector
      roto cuando era el cronómetro.
    */
    test.setTimeout(120_000)
    await borrarLeccion(esc.temaGrado4)
    await abrirDisenar(page, esc.temaGrado4)

    /*
      La acción de guardar VALIDA: exige título de lección, y título y texto en
      cada página. Es correcto que lo haga —una lección a medias no le sirve al
      alumno— y la primera versión de esta prueba lo descubrió al fallar: había
      agregado una página vacía y el guardado la rechazó sin decir nada más que
      su mensaje de error en pantalla.
    */
    await page.getByLabel(/título de la lección/i).fill('QA lección de lienzo')
    await page.getByLabel(/título de la página/i).first().fill('QA página con escena')
    await page.getByLabel(/^Texto$/).first().fill('Texto de prueba para la página.')

    // Dos piezas y un texto: suficiente para reconocer la escena al volver.
    await page.locator('details').first().locator('summary').click()
    const piezas = page.locator('button[draggable="true"]')
    await piezas.nth(0).click()
    await page.waitForTimeout(400)
    await piezas.nth(1).click()
    await page.waitForTimeout(400)

    const puestos = await elementos(page)
    expect(puestos, 'debe haber elementos antes de guardar').toBeGreaterThanOrEqual(2)

    await page.getByRole('button', { name: /guardar lección/i }).click()

    /*
      No se espera a que desaparezca "Guardando…": esa aserción se cumple al
      instante si el botón todavía no cambió, y la prueba recargaba antes de
      que la acción terminara. Se espera el efecto de VERDAD, que es la fila
      en la base.
    */
    await expect
      .poll(async () => (await leccionGuardada(esc.temaGrado4)) !== null, {
        timeout: 25_000,
        message: 'la lección debe llegar a la base',
      })
      .toBe(true)

    // Y que no quedó ningún error en pantalla, que es como se vería un
    // rechazo de la validación.
    await expect(page.getByText(/no tiene título|no tiene texto|necesita un título/i))
      .toHaveCount(0)

    const guardada = await leccionGuardada(esc.temaGrado4)
    expect(guardada?.title).toBe('QA lección de lienzo')
    expect(guardada?.pages?.length, 'debe haber una página').toBe(1)

    // ── Recargar desde cero ──
    await page.reload()
    await page.waitForLoadState('networkidle')

    /*
      Al recargar, las tarjetas de página vienen PLEGADAS: el editor no asume
      cuál querías editar. Hay que abrir la tarjeta —su cabecera es un botón
      con `aria-expanded`— para que aparezcan los modos de ilustración.
    */
    const cabecera = page.locator('button[aria-expanded]').first()
    await expect(cabecera).toBeVisible({ timeout: 15_000 })
    if ((await cabecera.getAttribute('aria-expanded')) === 'false') {
      await cabecera.click()
      await page.waitForTimeout(600)
    }

    const modo = page.getByRole('button', { name: /^Diseñar$/ }).first()
    await expect(modo).toBeVisible({ timeout: 15_000 })
    await modo.click()
    await expect(lienzo(page)).toBeVisible({ timeout: 15_000 })
    await page.waitForTimeout(800)

    expect(
      await elementos(page),
      'la escena debe volver con los mismos elementos',
    ).toBe(puestos)

    // Y que se DIBUJE, no solo que el documento exista: el SVG del lienzo
    // tiene que traer los grupos de las piezas.
    const grupos = await lienzo(page)
      .locator('svg[viewBox="0 0 400 220"] > g')
      .count()
    expect(grupos, 'las piezas deben volver a dibujarse').toBeGreaterThan(0)
  })
})
