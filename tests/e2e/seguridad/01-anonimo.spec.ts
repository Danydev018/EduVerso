import { test, expect } from '@playwright/test'
import { leerComo, escribirComo, filas, faltanClaves } from './fixtures'

/**
 * Lo que ve alguien SIN sesión, armado solo con la clave pública.
 *
 * La clave anónima (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) viaja al navegador en
 * cada carga de página: cualquiera puede leerla del código fuente. Por eso no
 * es un secreto y no puede ser lo único que separe a un extraño de los datos
 * de los niños. Lo que de verdad protege es que todas las políticas exijan el
 * rol `authenticated`.
 */

test.describe('Sin sesión no se accede a nada', () => {
  test.beforeEach(() => {
    const falta = faltanClaves()
    test.skip(!!falta, falta ?? '')
  })

  const TABLAS_SENSIBLES = [
    'profiles',
    'students',
    'enrollments',
    'classrooms',
    'activities',
    'activity_progress',
    'student_points',
    'presential_evaluations',
    'ai_interactions',
    'topic_lessons',
  ]

  for (const tabla of TABLAS_SENSIBLES) {
    test(`no puede leer ${tabla}`, async () => {
      const { datos } = await leerComo(null, `${tabla}?select=*&limit=5`)
      // RLS no distingue "prohibido" de "vacío" al leer: ambas son 200 con [].
      // Lo que se afirma es que NO VUELVE NINGUNA FILA, que es lo que importa.
      expect(filas(datos), `${tabla} no debe devolver filas a un anónimo`).toBeLessThanOrEqual(0)
    })
  }

  test('no puede insertar un perfil', async () => {
    const { estado } = await escribirComo(null, 'profiles', {
      id: '00000000-0000-0000-0000-000000000000',
      role: 'coordinator',
      full_name: 'Intruso',
    })
    expect(estado, 'la inserción anónima debe ser rechazada').toBeGreaterThanOrEqual(400)
  })

  test('no puede otorgarse puntos', async () => {
    const { estado } = await escribirComo(null, 'student_points', {
      student_id: '00000000-0000-0000-0000-000000000000',
      school_year_id: '00000000-0000-0000-0000-000000000000',
      classroom_id: '00000000-0000-0000-0000-000000000000',
      total_xp: 99999,
    })
    expect(estado).toBeGreaterThanOrEqual(400)
  })
})
