import { test, expect } from '@playwright/test'
import {
  CUENTAS, tokenDe, leerComo, escribirComo, filas, faltanClaves, respuestasCorrectas, escenario,
} from './fixtures'

/**
 * Qué alcanza un ALUMNO con su propio token.
 *
 * Este es el rol más importante de auditar, por dos motivos. Uno: son menores,
 * y la propuesta se compromete a proteger su privacidad. Dos: es el rol más
 * numeroso y el que más probablemente husmee, porque la aplicación vive en su
 * teléfono.
 *
 * El alumno de las pruebas (`alumnoA`) está matriculado en el salón del
 * docente A. Todo lo del salón B le debe resultar invisible.
 */

let tokenAlumnoA: string
let esc: ReturnType<typeof escenario>

test.beforeAll(async () => {
  const falta = faltanClaves()
  test.skip(!!falta, falta ?? '')
  esc = escenario()
  tokenAlumnoA = await tokenDe(CUENTAS.alumnoA.correo, CUENTAS.alumnoA.clave)
})

test.describe('Privacidad entre alumnos', () => {
  test('no accede a la fecha de nacimiento de otros alumnos', async () => {
    const { datos } = await leerComo(tokenAlumnoA, 'students?select=id,birth_date')
    const propios = (datos as { id: string }[] | null) ?? []
    const ajenos = propios.filter((s) => s.id !== esc.alumnoA)
    expect(ajenos, 'un alumno no debe leer datos personales de otros').toHaveLength(0)
  })

  test('no accede a la matrícula de otros alumnos', async () => {
    const { datos } = await leerComo(tokenAlumnoA, `enrollments?select=student_id,classroom_id`)
    const ajenos = ((datos as { student_id: string }[] | null) ?? [])
      .filter((e) => e.student_id !== esc.alumnoA)
    expect(ajenos, 'la matrícula ajena no debe ser legible').toHaveLength(0)
  })

  test('no accede al progreso de otros alumnos', async () => {
    const { datos } = await leerComo(tokenAlumnoA, 'activity_progress?select=student_id,xp_earned')
    const ajenos = ((datos as { student_id: string }[] | null) ?? [])
      .filter((p) => p.student_id !== esc.alumnoA)
    expect(ajenos, 'el progreso ajeno no debe ser legible').toHaveLength(0)
  })

  test('no accede a las evaluaciones presenciales de nadie', async () => {
    // Las notas presenciales son del docente; el alumno no las ve ni las suyas
    // en esta versión, porque el sistema es de refuerzo, no de calificaciones.
    const { datos } = await leerComo(tokenAlumnoA, 'presential_evaluations?select=student_id,score')
    expect(filas(datos)).toBeLessThanOrEqual(0)
  })
})

test.describe('Aislamiento entre salones', () => {
  test('no ve las actividades de otro salón', async () => {
    const { datos } = await leerComo(tokenAlumnoA, 'activities?select=id,classroom_id')
    const ajenas = ((datos as { classroom_id: string }[] | null) ?? [])
      .filter((a) => a.classroom_id !== esc.aulaA)
    expect(ajenas, 'solo debe ver actividades de su propio salón').toHaveLength(0)
  })

  test('no ve los salones que no son el suyo', async () => {
    const { datos } = await leerComo(tokenAlumnoA, 'classrooms?select=id')
    const ids = ((datos as { id: string }[] | null) ?? []).map((c) => c.id)
    expect(ids, 'el salón del docente B no debe aparecer').not.toContain(esc.aulaB)
  })
})

test.describe('El alumno no puede alterar su propia puntuación', () => {
  test('no puede insertar puntos', async () => {
    const { estado } = await escribirComo(tokenAlumnoA, 'student_points', {
      student_id: esc.alumnoA,
      school_year_id: esc.anioId,
      classroom_id: esc.aulaA,
      total_xp: 999999,
      level: 99,
    })
    expect(estado, 'solo coordinación o la Edge Function otorgan XP').toBeGreaterThanOrEqual(400)
  })

  test('no puede subirse el XP existente', async () => {
    const { estado } = await escribirComo(
      tokenAlumnoA,
      `student_points?student_id=eq.${esc.alumnoA}`,
      { total_xp: 999999, level: 99 },
      'PATCH',
    )
    // Un PATCH que no encuentra filas escribibles devuelve 204 sin tocar nada;
    // lo que se verifica luego es que el XP NO cambió.
    expect([204, 401, 403, 404].includes(estado), `estado inesperado: ${estado}`).toBe(true)

    const { datos } = await leerComo(tokenAlumnoA, `student_points?student_id=eq.${esc.alumnoA}&select=total_xp`)
    const puntos = ((datos as { total_xp: number }[] | null) ?? [])[0]
    if (puntos) {
      expect(puntos.total_xp, 'el XP no debe haber cambiado').toBeLessThan(999999)
    }
  })

  test('no puede cambiar su propio rol a coordinador', async () => {
    await escribirComo(tokenAlumnoA, `profiles?id=eq.${esc.alumnoA}`, { role: 'coordinator' }, 'PATCH')
    const { datos } = await leerComo(tokenAlumnoA, `profiles?id=eq.${esc.alumnoA}&select=role`)
    const perfil = ((datos as { role: string }[] | null) ?? [])[0]
    expect(perfil?.role, 'el rol no debe poder escalarse').toBe('student')
  })
})

test.describe('Integridad del quiz', () => {
  /**
   * Esta es la prueba que descubrió una fuga real.
   *
   * El texto del quiz vive en `activities.ai_context`, y la opción correcta se
   * marca con un `*`. El alumno necesita leer su actividad para resolverla, así
   * que la política `activities_select` se la concede entera — incluido el
   * campo con las respuestas. Con su propio token puede pedirlo y leerlas todas
   * antes de contestar.
   *
   * ALCANCE DEL PROBLEMA: no permite inflar la puntuación. El XP se otorga por
   * completar el paso, no por acertar (ver `step-runner.tsx`), así que no hay
   * fraude posible en el marcador. Lo que se rompe es la utilidad formativa del
   * quiz, que es su única razón de existir.
   *
   * Mientras la fuga siga abierta, esta prueba FALLA a propósito: sirve de
   * recordatorio en cada corrida. Cuando se cierre, pasa sin tocarla.
   */
  test('las respuestas correctas no le llegan al alumno', async () => {
    const { datos } = await leerComo(
      tokenAlumnoA,
      `activities?id=eq.${esc.actividadA}&select=title,ai_context`,
    )
    const actividad = ((datos as { title: string; ai_context: string | null }[] | null) ?? [])[0]
    expect(actividad, 'el alumno debe poder ver su actividad').toBeTruthy()

    const filtradas = respuestasCorrectas(actividad.ai_context)
    expect(
      filtradas,
      `El alumno puede leer ${filtradas.length} respuesta(s) correcta(s) desde la API: ` +
      `${JSON.stringify(filtradas)}. El quiz deja de tener valor formativo. ` +
      `Ver el comentario de esta prueba para el análisis.`,
    ).toHaveLength(0)
  })
})
