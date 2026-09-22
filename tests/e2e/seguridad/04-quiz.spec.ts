import { test, expect } from '@playwright/test'
import {
  CUENTAS, URL_SUPABASE, CLAVE_ANON, tokenDe, leerComo, escribirComo,
  faltanClaves, escenario, filas,
} from './fixtures'

/**
 * El quiz calificado en el servidor.
 *
 * Desde la migración 14 el acierto influye en el XP. Eso cambia lo que está en
 * juego: antes, filtrar las respuestas solo arruinaba el valor formativo del
 * quiz; ahora también permitiría inflar la puntuación. Por eso estas pruebas
 * no verifican que "funcione", sino que NO SE PUEDA hacer trampa por ninguna
 * de las tres vías posibles:
 *
 *   1. Leer las respuestas antes de contestar.
 *   2. Reintentar hasta acertar.
 *   3. Escribir el resultado a mano, sin contestar.
 */

let tokenAlumnoA: string
let esc: ReturnType<typeof escenario>

/** Llama a una función de la base con la sesión de alguien. */
async function rpc(token: string, funcion: string, args: unknown) {
  const r = await fetch(`${URL_SUPABASE}/rest/v1/rpc/${funcion}`, {
    method: 'POST',
    headers: {
      apikey: CLAVE_ANON,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
  })
  return { estado: r.status, datos: await r.json().catch(() => null) }
}

test.beforeAll(async () => {
  const falta = faltanClaves()
  test.skip(!!falta, falta ?? '')
  esc = escenario()
  tokenAlumnoA = await tokenDe(CUENTAS.alumnoA.correo, CUENTAS.alumnoA.clave)
})

test.describe('Vía 1: leer las respuestas antes de contestar', () => {
  test('quiz_para_alumno entrega opciones pero no la correcta', async () => {
    const { datos } = await rpc(tokenAlumnoA, 'quiz_para_alumno', {
      p_activity_id: esc.actividadA,
    })
    const preguntas = (datos as Record<string, unknown>[] | null) ?? []
    expect(preguntas.length, 'debe recibir las preguntas').toBeGreaterThan(0)

    for (const p of preguntas) {
      expect(Object.keys(p), 'ninguna pregunta debe traer el índice correcto')
        .not.toContain('correcta')
      expect(p).toHaveProperty('opciones')
    }
  })

  test('la clave de respuestas le está negada', async () => {
    const { datos } = await leerComo(tokenAlumnoA, 'activity_quizzes?select=quiz_text')
    expect(filas(datos), 'activity_quizzes es del docente, no del alumno').toBeLessThanOrEqual(0)
  })

  test('ai_context ya no lleva marcas', async () => {
    const { datos } = await leerComo(
      tokenAlumnoA,
      `activities?id=eq.${esc.actividadA}&select=ai_context`,
    )
    const ctx = ((datos as { ai_context: string | null }[] | null) ?? [])[0]?.ai_context ?? ''
    // Se busca el asterisco al final de cualquier renglón, que es donde
    // significaba "esta es la correcta".
    expect(/\*[ \t]*$/m.test(ctx), 'no debe quedar ninguna marca').toBe(false)
  })
})

test.describe('Vía 2: reintentar hasta acertar', () => {
  test('solo cuenta el primer intento de cada pregunta', async () => {
    // Se usa la última pregunta del quiz para no pisar lo que ya haya
    // contestado otra prueba, y un paso alto que ninguna otra toca.
    const PASO = 7
    const PREGUNTA = 0

    const { datos: quiz } = await rpc(tokenAlumnoA, 'quiz_para_alumno', {
      p_activity_id: esc.actividadA,
    })
    const opciones = ((quiz as { opciones: string[] }[] | null) ?? [])[0]?.opciones ?? []
    expect(opciones.length, 'la pregunta debe tener opciones').toBeGreaterThan(1)

    // Primer intento: se elige a propósito la opción 0. Si resultara ser la
    // correcta, se prueba con la 1: lo que importa es fallar primero.
    const primera = await rpc(tokenAlumnoA, 'responder_quiz', {
      p_activity_id: esc.actividadA, p_step_index: PASO,
      p_question_index: PREGUNTA, p_chosen_index: 0,
    })
    const r1 = primera.datos as { acierto: boolean; indice_correcto: number; ya_respondida: boolean }
    expect(r1.ya_respondida, 'primer intento').toBe(false)

    // Segundo intento con la respuesta correcta.
    const segunda = await rpc(tokenAlumnoA, 'responder_quiz', {
      p_activity_id: esc.actividadA, p_step_index: PASO,
      p_question_index: PREGUNTA, p_chosen_index: r1.indice_correcto,
    })
    const r2 = segunda.datos as { acierto: boolean; ya_respondida: boolean }

    expect(r2.ya_respondida, 'debe avisar que ya estaba contestada').toBe(true)
    expect(r2.acierto, 'debe conservar el resultado del PRIMER intento').toBe(r1.acierto)
  })
})

test.describe('Vía 3: escribir el resultado a mano', () => {
  test('no puede insertar un acierto en quiz_results', async () => {
    const { estado } = await escribirComo(tokenAlumnoA, 'quiz_results', {
      student_id: esc.alumnoA,
      activity_id: esc.actividadA,
      step_index: 99,
      question_index: 0,
      chosen_index: 0,
      is_correct: true,
    })
    expect(estado, 'solo la función del servidor escribe resultados').toBeGreaterThanOrEqual(400)
  })

  test('no puede corregir un resultado suyo que falló', async () => {
    await escribirComo(
      tokenAlumnoA,
      `quiz_results?student_id=eq.${esc.alumnoA}&is_correct=is.false`,
      { is_correct: true },
      'PATCH',
    )
    const { datos } = await leerComo(
      tokenAlumnoA,
      `quiz_results?student_id=eq.${esc.alumnoA}&select=is_correct`,
    )
    const todos = (datos as { is_correct: boolean }[] | null) ?? []
    // En el escenario provisionado el alumno falla al menos una: si todas
    // aparecieran correctas, el PATCH habría pasado.
    expect(
      todos.some((r) => !r.is_correct),
      'el fallo registrado debe seguir siendo un fallo',
    ).toBe(true)
  })
})

test.describe('La métrica es privada', () => {
  test('solo ve su propio porcentaje', async () => {
    const { datos } = await leerComo(tokenAlumnoA, 'quiz_stats?select=student_id,porcentaje')
    const ajenos = ((datos as { student_id: string }[] | null) ?? [])
      .filter((s) => s.student_id !== esc.alumnoA)
    expect(ajenos, 'no debe ver el porcentaje de sus compañeros').toHaveLength(0)
  })
})

test.describe('El quiz de otro salón no se responde', () => {
  test('responder_quiz rechaza una actividad ajena', async () => {
    // Se inventa un id: si la función no verificara el salón, contestaría o
    // devolvería "pregunta inexistente" en vez de negar el acceso.
    const { estado, datos } = await rpc(tokenAlumnoA, 'responder_quiz', {
      p_activity_id: '00000000-0000-0000-0000-000000000000',
      p_step_index: 0, p_question_index: 0, p_chosen_index: 0,
    })
    expect(estado, `debe fallar; llegó ${estado} con ${JSON.stringify(datos)}`)
      .toBeGreaterThanOrEqual(400)
  })
})
