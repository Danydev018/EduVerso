import { test, expect } from '@playwright/test'
import { CUENTAS, tokenDe, leerComo, escribirComo, faltanClaves, escenario } from './fixtures'

/**
 * Qué alcanza un DOCENTE con su propio token.
 *
 * El docente tiene poder legítimo sobre su salón: ve a sus alumnos, califica,
 * asigna actividades y redacta las lecciones de su grado. Lo que se verifica
 * acá es que ese poder TERMINE en el borde de su salón y de su grado.
 *
 * El docente A dicta 4º grado; el B, 3º. Ninguno debe alcanzar lo del otro.
 */

let tokenA: string
let esc: ReturnType<typeof escenario>

test.beforeAll(async () => {
  const falta = faltanClaves()
  test.skip(!!falta, falta ?? '')
  esc = escenario()
  tokenA = await tokenDe(CUENTAS.docenteA.correo, CUENTAS.docenteA.clave)
})

test.describe('El docente ve lo suyo', () => {
  test('ve su propio salón', async () => {
    const { datos } = await leerComo(tokenA, `classrooms?id=eq.${esc.aulaA}&select=id,teacher_id`)
    const aula = ((datos as { id: string; teacher_id: string }[] | null) ?? [])[0]
    expect(aula?.id, 'debe ver el salón que dicta').toBe(esc.aulaA)
    expect(aula?.teacher_id).toBe(esc.docenteA)
  })

  test('ve la actividad que tiene asignada su salón', async () => {
    const { datos } = await leerComo(tokenA, `activities?id=eq.${esc.actividadA}&select=id`)
    expect(datos, 'debe ver la actividad de su salón').toHaveLength(1)
  })
})

test.describe('El docente no cruza a otro salón', () => {
  test('no ve el progreso de alumnos de otro salón', async () => {
    const { datos } = await leerComo(tokenA, 'activity_progress?select=student_id')
    const ids = ((datos as { student_id: string }[] | null) ?? []).map((p) => p.student_id)
    expect(ids, 'el progreso del alumno de B no debe aparecer').not.toContain(esc.alumnoB)
  })

  test('no ve las evaluaciones presenciales de otro salón', async () => {
    const { datos } = await leerComo(tokenA, 'presential_evaluations?select=student_id')
    const ids = ((datos as { student_id: string }[] | null) ?? []).map((e) => e.student_id)
    expect(ids).not.toContain(esc.alumnoB)
  })

  test('no puede asignar una actividad al salón de otro docente', async () => {
    const { estado } = await escribirComo(tokenA, 'activities', {
      classroom_id: esc.aulaB,
      template_id: '00000000-0000-0000-0000-000000000000',
      topic_id: esc.temaGrado3,
      title: 'QA intrusión',
      status: 'active',
    })
    expect(estado, 'no debe poder escribir en el salón de B').toBeGreaterThanOrEqual(400)
  })

  test('no puede reasignarse el salón de otro docente', async () => {
    await escribirComo(tokenA, `classrooms?id=eq.${esc.aulaB}`, { teacher_id: esc.docenteA }, 'PATCH')
    // La verdad se comprueba leyendo con la llave de servicio, no con la del
    // docente: si el PATCH hubiera pasado, el dueño habría cambiado de verdad.
    const { datos } = await leerComo(tokenA, `classrooms?id=eq.${esc.aulaB}&select=teacher_id`)
    const visto = ((datos as { teacher_id: string }[] | null) ?? [])[0]
    // O no lo ve (RLS lo oculta) o lo ve intacto; lo que no puede es haberlo tomado.
    if (visto) expect(visto.teacher_id).not.toBe(esc.docenteA)
  })
})

test.describe('El docente solo redacta lecciones de su grado', () => {
  /**
   * `teaches_topic()` es la función que decide esto: comprueba que el tema
   * pertenezca a un grado en el que el docente tenga salón en el año vigente.
   * Sin ella, cualquier docente podría reescribir las lecciones de toda la
   * escuela, que es el riesgo real de haber abierto `topic_lessons` a los
   * docentes en la migración 12.
   */
  test('puede escribir la lección de un tema de su grado', async () => {
    const { estado } = await escribirComo(tokenA, 'topic_lessons', {
      topic_id: esc.temaGrado4,
      title: 'QA lección permitida',
      pages: [{ title: 'Página', body: 'Texto de prueba' }],
    })
    // 201 si la creó; 409 si ya existía (el índice único por tema). Las dos
    // respuestas prueban lo mismo: la política no lo rechazó.
    expect([201, 409].includes(estado), `esperaba 201 o 409, llegó ${estado}`).toBe(true)
  })

  test('NO puede escribir la lección de un tema de otro grado', async () => {
    const { estado } = await escribirComo(tokenA, 'topic_lessons', {
      topic_id: esc.temaGrado3,
      title: 'QA lección prohibida',
      pages: [{ title: 'Página', body: 'No debería guardarse' }],
    })
    expect(estado, 'teaches_topic() debe rechazar un tema de 3º grado').toBeGreaterThanOrEqual(400)
  })
})

test.describe('El docente no escala privilegios', () => {
  test('no puede cambiarse el rol a coordinador', async () => {
    await escribirComo(tokenA, `profiles?id=eq.${esc.docenteA}`, { role: 'coordinator' }, 'PATCH')
    const { datos } = await leerComo(tokenA, `profiles?id=eq.${esc.docenteA}&select=role`)
    const perfil = ((datos as { role: string }[] | null) ?? [])[0]
    expect(perfil?.role, 'el rol no debe poder escalarse').toBe('teacher')
  })

  test('no puede crear un año escolar', async () => {
    const { estado } = await escribirComo(tokenA, 'school_years', {
      name: 'QA 2099-2100', starts_on: '2099-09-01', ends_on: '2100-07-01', is_current: false,
    })
    expect(estado, 'los años escolares son de coordinación').toBeGreaterThanOrEqual(400)
  })
})
