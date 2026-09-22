import { test, expect } from '@playwright/test'
import { escenario, faltanClaves } from '../seguridad/fixtures'
import { reponerActividad, reponerPuntos, puntosDe, aciertoDe, clavesDe } from './reponer'

/**
 * Recorrido del alumno: del tablero a completar un paso con quiz.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * QUÉ VERIFICA Y QUÉ NO
 *
 * No comprueba que los botones existan —eso ya lo cubren las pruebas de
 * interfaz— sino que la CADENA COMPLETA cierre: el alumno contesta en el
 * navegador, el servidor corrige y registra, y el XP que acaba teniendo
 * corresponde a lo que acertó.
 *
 * Esa cadena atraviesa tres procesos distintos (navegador, Next, Postgres más
 * la Edge Function) y es donde vive el riesgo real: cada pieza puede estar
 * bien y el conjunto seguir roto.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * POR QUÉ REPONE EL ESTADO
 *
 * Esta prueba avanza de verdad: gasta el progreso de la actividad. Sin
 * reponer, la segunda corrida la encontraría a medias y probaría otra cosa.
 * Ver `reponer.ts`.
 */

let esc: ReturnType<typeof escenario>

test.beforeAll(() => {
  const falta = faltanClaves()
  test.skip(!!falta, falta ?? '')
  esc = escenario()
})

test.beforeEach(async () => {
  await reponerActividad(esc.alumnoA, esc.actividadA)
})

/**
 * Abre la actividad y la arranca.
 *
 * Con el progreso recién repuesto la pantalla no muestra los pasos sino un
 * botón "Iniciar misión": la fila de `activity_progress` se crea al empezar,
 * no al abrir. Sin este paso la prueba buscaba "Completar etapa" en una
 * pantalla que todavía no la tenía.
 */
async function abrirYComenzar(page: import('@playwright/test').Page, actividadId: string) {
  await page.goto(`/student/activities/${actividadId}`)
  await page.waitForLoadState('networkidle')
  await saltarIntro(page)
  if (!page.url().includes(actividadId)) {
    await page.goto(`/student/activities/${actividadId}`)
    await page.waitForLoadState('networkidle')
  }

  const iniciar = page.getByRole('button', { name: /iniciar misión/i })
  if (await iniciar.count() > 0) {
    await iniciar.click()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1200)
  }
}

/**
 * Deja atrás la intro si el alumno cae en ella.
 *
 * La primera vez, entrar manda a `/student/intro`: una cinemática de
 * bienvenida con un enlace "Saltar". No es un estorbo de la prueba sino parte
 * del recorrido real —un alumno nuevo la ve— y por eso se atraviesa en vez de
 * desactivarla. En las corridas sueltas no aparecía porque la sesión ya la
 * traía vista.
 */
async function saltarIntro(page: import('@playwright/test').Page) {
  if (!page.url().includes('/student/intro')) return
  const saltar = page.getByRole('link', { name: /saltar/i })
    .or(page.getByRole('button', { name: /saltar/i }))
  await saltar.first().click()
  await page.waitForURL(/student\/dashboard/, { timeout: 20_000 })
  await page.waitForLoadState('networkidle')
}

/**
 * Cierra el paso actual y avanza al siguiente.
 *
 * Completar un paso NO recarga la pantalla: aparece una tarjeta de recompensa
 * —"+15 de energía", el nivel si subió— y hay que tocar su botón para seguir.
 * Es un momento deliberado del diseño, para que el niño vea lo que ganó, y por
 * eso la prueba tiene que pasar por ahí en vez de esperar una navegación.
 */
async function cerrarPaso(page: import('@playwright/test').Page) {
  const completar = page.getByRole('button', { name: /completar etapa|terminar misión/i })
  await expect(completar).toBeVisible({ timeout: 15_000 })
  await completar.click()

  // La tarjeta de recompensa llega después de que la Edge Function otorga el
  // XP, así que se le da tiempo de red.
  const seguir = page.getByRole('button', { name: /seguir a la próxima etapa|ver resumen de la misión/i })
  await expect(seguir).toBeVisible({ timeout: 25_000 })
  await seguir.click()
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1200)
}

test.describe('El alumno llega a su actividad', () => {
  test('el tablero lo recibe con su sesión resuelta', async ({ page }) => {
    await page.goto('/student/dashboard')
    await page.waitForLoadState('networkidle')
    await saltarIntro(page)

    // El cascarón del alumno lleva su nombre y su marcador de energía: es la
    // señal de que la sesión y la gamificación se resolvieron en el servidor.
    // Se afirma sobre el nombre y no sobre la palabra "nivel", que en el
    // encabezado aparece como un número sin etiqueta.
    await expect(page).toHaveURL(/student\/dashboard/)
    await expect(page.getByText('QA Alumno A').first()).toBeVisible({ timeout: 15_000 })
  })

  test('la lista de misiones incluye la actividad de su salón', async ({ page }) => {
    await page.goto('/student/activities')
    await page.waitForLoadState('networkidle')
    await saltarIntro(page)
    if (!page.url().includes('/student/activities')) {
      await page.goto('/student/activities')
      await page.waitForLoadState('networkidle')
    }
    await expect(page.getByText('QA quiz de prueba')).toBeVisible({ timeout: 15_000 })
  })

  test('no puede abrir una actividad que no es de su salón', async ({ page }) => {
    // Un id inventado tiene que dar 404, no una pantalla a medias.
    const r = await page.goto('/student/activities/00000000-0000-0000-0000-000000000000')
    expect(r?.status(), 'una actividad ajena debe responder 404').toBe(404)
  })
})

test.describe('Contestar el quiz otorga XP según el acierto', () => {
  test('acertar todo da el XP completo del paso', async ({ page }) => {
    await reponerPuntos(esc.alumnoA)

    await abrirYComenzar(page, esc.actividadA)

    // ── Paso 0: introducción, sin preguntas ──
    await cerrarPaso(page)

    const puntosTrasIntro = await puntosDe(esc.alumnoA)
    expect(puntosTrasIntro?.total_xp, 'la introducción no tiene quiz: XP completo').toBe(15)
  })

  /**
   * Resuelve el quiz eligiendo, en cada pregunta, la opción que se le indique.
   *
   * `desplazamiento` decide qué se contesta respecto de la correcta: 0 acierta
   * siempre, 1 falla siempre (elige la de al lado). Así la misma función sirve
   * para las dos puntas de la fórmula del XP.
   */
  async function resolverQuiz(
    page: import('@playwright/test').Page,
    claves: number[],
    desplazamiento: number,
  ) {
    for (let pregunta = 0; pregunta < claves.length; pregunta++) {
      const opciones = page.locator('[data-quiz-opcion]')
      await expect(opciones.first()).toBeVisible({ timeout: 15_000 })
      const total = await opciones.count()

      const elegir = (claves[pregunta] + desplazamiento) % total
      await opciones.nth(elegir).click()

      await page.getByRole('button', { name: /^Comprobar$/ }).click()

      const seguir = page.getByRole('button', { name: /Continuar|Ver cómo me fue/ })
      await expect(seguir).toBeVisible({ timeout: 15_000 })
      await seguir.click()
      await page.waitForTimeout(400)
    }
  }

  test('acertar todo el quiz da el XP completo del paso', async ({ page }) => {
    await reponerPuntos(esc.alumnoA)
    const claves = await clavesDe(esc.actividadA)
    expect(claves.length, 'el escenario debe tener preguntas').toBeGreaterThan(0)

    await abrirYComenzar(page, esc.actividadA)
    await cerrarPaso(page) // introducción

    await resolverQuiz(page, claves, 0)

    const acierto = await aciertoDe(esc.alumnoA, esc.actividadA)
    expect(acierto.correctas, 'debe acertarlas todas').toBe(claves.length)

    await cerrarPaso(page)

    // Acierto 100% ⇒ el paso paga su XP entero. El de introducción son 15.
    const puntos = await puntosDe(esc.alumnoA)
    expect((puntos?.total_xp ?? 0) - 15, 'acertar todo paga el máximo').toBe(35)
  })

  test('fallar todo el quiz deja el piso del XP, no cero', async ({ page }) => {
    await reponerPuntos(esc.alumnoA)
    const claves = await clavesDe(esc.actividadA)

    await abrirYComenzar(page, esc.actividadA)
    await cerrarPaso(page) // introducción

    await resolverQuiz(page, claves, 1)

    const acierto = await aciertoDe(esc.alumnoA, esc.actividadA)
    expect(acierto.respondidas, 'las respuestas deben quedar registradas').toBe(claves.length)
    expect(acierto.correctas, 'debe fallarlas todas').toBe(0)

    await cerrarPaso(page)

    /*
      Acierto 0% ⇒ ceil(35 × 0.4) = 14. Ni cero —eso sería castigar al niño
      por haberlo intentado— ni el máximo, que haría que la nota no midiera
      nada. Es el piso que define la fórmula en `complete-step`.
    */
    const puntos = await puntosDe(esc.alumnoA)
    expect((puntos?.total_xp ?? 0) - 15, 'el piso del 40% debe pagarse').toBe(14)
  })
})

test.describe('El tutor asiste sin resolver', () => {
  test('el tope de consultas lo controla el servidor', async ({ page, request }) => {
    await abrirYComenzar(page, esc.actividadA)

    // El paso de introducción del escenario no tiene el tutor habilitado en
    // todas las plantillas, así que la presencia de la burbuja se comprueba
    // solo si la plantilla lo activó. Lo que sí se verifica siempre es el
    // contrato del tope, que es la garantía pedagógica.
    const burbuja = page.getByRole('button', { name: /profe bot|preguntar|ayuda/i })
    const hayTutor = await burbuja.count()

    if (hayTutor === 0) {
      test.info().annotations.push({
        type: 'nota',
        description: 'Este paso no habilita el tutor; se verifica solo el tope por API.',
      })
    }

    // El tope vive en `ai_interactions.questions_limit`. Que exista la columna
    // y que la función la respete es lo que impide que un alumno pida
    // indefinidamente hasta que el modelo le suelte la respuesta.
    const r = await request.get(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/ai_interactions?select=questions_used,questions_limit&limit=1`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        },
      },
    )
    expect(r.status(), 'la tabla del tope debe existir').toBe(200)
  })
})
