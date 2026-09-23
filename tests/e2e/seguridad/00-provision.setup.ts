import { test as provision, expect } from '@playwright/test'
import fs from 'fs'
import {
  URL_SUPABASE, CLAVE_SERVICIO, CUENTAS, faltanClaves, leerComoServicio,
  ARCHIVO_IDS, type Escenario,
} from './fixtures'

/**
 * Provisiona el escenario mínimo para probar el aislamiento entre roles.
 *
 * Hacen falta DOS docentes con DOS salones distintos y un alumno en cada uno.
 * Con un solo docente no se puede demostrar nada: el aislamiento consiste
 * precisamente en que A no ve lo de B, y eso necesita un B.
 *
 * ES IDEMPOTENTE. Se puede correr mil veces: si la cuenta ya existe la
 * reutiliza. Eso importa porque estas pruebas escriben en la base real del
 * proyecto y no queremos que cada corrida deje basura nueva.
 *
 * Las cuentas quedan con nombre "QA …" para que se distingan a simple vista
 * de los datos reales de la escuela. Para borrarlas, ver `npm run test:limpiar`.
 */

async function servicio(ruta: string, metodo: string, cuerpo?: unknown) {
  const r = await fetch(`${URL_SUPABASE}/${ruta}`, {
    method: metodo,
    headers: {
      apikey: CLAVE_SERVICIO,
      Authorization: `Bearer ${CLAVE_SERVICIO}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  })
  return { estado: r.status, datos: await r.json().catch(() => null) }
}

/** Crea el usuario de auth si no existe; devuelve su id en cualquier caso. */
async function asegurarUsuario(correo: string, clave: string): Promise<string> {
  const creado = await servicio('auth/v1/admin/users', 'POST', {
    email: correo, password: clave, email_confirm: true,
  })
  const id = (creado.datos as { id?: string })?.id
  if (id) return id

  // Ya existía: se busca por correo en el listado de administración.
  const lista = await servicio(`auth/v1/admin/users?per_page=200`, 'GET')
  const usuarios = (lista.datos as { users?: { id: string; email: string }[] })?.users ?? []
  const hallado = usuarios.find((u) => u.email === correo)
  if (!hallado) {
    throw new Error(
      `No se pudo crear ni encontrar ${correo}. Respuesta: ${JSON.stringify(creado.datos).slice(0, 200)}`,
    )
  }
  return hallado.id
}

/**
 * Busca la fila por un filtro y, si no está, la crea.
 *
 * Hace falta para las tablas cuya unicidad NO es la clave primaria —el salón
 * es único por (año, grado, sección), no por su id—. El upsert de PostgREST
 * resuelve conflictos contra la clave primaria, así que con esas tablas
 * reintentar el POST da un 409 en vez de devolver la fila existente, y la
 * segunda corrida de la batería se caía.
 */
async function asegurarPorBusqueda(
  tabla: string,
  filtro: string,
  cuerpo: Record<string, unknown>,
): Promise<string> {
  const existentes = (await leerComoServicio(`${tabla}?${filtro}&select=id`)) as { id: string }[]
  if (Array.isArray(existentes) && existentes.length > 0) return existentes[0].id
  const creada = await servicio(`rest/v1/${tabla}`, 'POST', cuerpo)
  const id = ((creada.datos as { id: string }[]) ?? [])[0]?.id
  if (!id) {
    throw new Error(
      `No se pudo asegurar ${tabla} (${filtro}): ${JSON.stringify(creada.datos).slice(0, 200)}`,
    )
  }
  return id
}

/** Inserta la fila si no está. Solo sirve cuando se manda la clave primaria. */
async function asegurarFila(tabla: string, cuerpo: Record<string, unknown>) {
  const r = await fetch(`${URL_SUPABASE}/rest/v1/${tabla}`, {
    method: 'POST',
    headers: {
      apikey: CLAVE_SERVICIO,
      Authorization: `Bearer ${CLAVE_SERVICIO}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify(cuerpo),
  })
  return r.json().catch(() => null)
}

provision('provisionar cuentas y salones de prueba', async () => {
  const falta = faltanClaves()
  provision.skip(!!falta, falta ?? '')
  provision.setTimeout(120_000)

  // ── Año escolar vigente ──
  const anios = (await leerComoServicio('school_years?is_current=eq.true&select=id')) as { id: string }[]
  expect(anios.length, 'debe haber un año escolar vigente').toBeGreaterThan(0)
  const anioId = anios[0].id

  // ── Temas de dos grados distintos, para probar `teaches_topic` ──
  const temaDe = async (grado: number) => {
    const t = (await leerComoServicio(
      `topics?select=id,subjects!inner(grade_id)&subjects.grade_id=eq.${grado}&limit=1`,
    )) as { id: string }[]
    expect(t.length, `debe existir al menos un tema de ${grado}º grado`).toBeGreaterThan(0)
    return t[0].id
  }
  const temaGrado4 = await temaDe(4)
  const temaGrado3 = await temaDe(3)

  // ── Coordinación ──
  /*
    El rol NO se pone por la API pública: `profiles_bloquear_escalada`
    (migración 13) impide que nadie que no sea coordinación cambie un rol.
    Acá se escribe con la clave de servicio, que es justamente el camino que
    esa política deja abierto solo al servidor.
  */
  const coordinadorA = await asegurarUsuario(CUENTAS.coordinadorA.correo, CUENTAS.coordinadorA.clave)
  await asegurarFila('profiles', {
    id: coordinadorA, role: 'coordinator', full_name: CUENTAS.coordinadorA.nombre,
  })

  // ── Docentes ──
  const docenteA = await asegurarUsuario(CUENTAS.docenteA.correo, CUENTAS.docenteA.clave)
  const docenteB = await asegurarUsuario(CUENTAS.docenteB.correo, CUENTAS.docenteB.clave)
  await asegurarFila('profiles', { id: docenteA, role: 'teacher', full_name: CUENTAS.docenteA.nombre })
  await asegurarFila('profiles', { id: docenteB, role: 'teacher', full_name: CUENTAS.docenteB.nombre })

  // ── Un salón para cada uno, en grados distintos ──
  // Secciones "Y"/"Z" para no chocar con las reales (A, B, C…).
  const aulaA = await asegurarPorBusqueda(
    'classrooms',
    `school_year_id=eq.${anioId}&grade_id=eq.4&section=eq.Y`,
    { school_year_id: anioId, grade_id: 4, section: 'Y', teacher_id: docenteA },
  )
  const aulaB = await asegurarPorBusqueda(
    'classrooms',
    `school_year_id=eq.${anioId}&grade_id=eq.3&section=eq.Z`,
    { school_year_id: anioId, grade_id: 3, section: 'Z', teacher_id: docenteB },
  )

  // ── Un alumno en cada salón ──
  const alumnoA = await asegurarUsuario(CUENTAS.alumnoA.correo, CUENTAS.alumnoA.clave)
  const alumnoB = await asegurarUsuario(CUENTAS.alumnoB.correo, CUENTAS.alumnoB.clave)
  for (const [id, nombre] of [[alumnoA, CUENTAS.alumnoA.nombre], [alumnoB, CUENTAS.alumnoB.nombre]] as const) {
    await asegurarFila('profiles', { id, role: 'student', full_name: nombre })
    await asegurarFila('students', { id, birth_date: '2016-05-10' })
  }
  await asegurarPorBusqueda(
    'enrollments',
    `student_id=eq.${alumnoA}&school_year_id=eq.${anioId}`,
    { student_id: alumnoA, classroom_id: aulaA, school_year_id: anioId },
  )
  await asegurarPorBusqueda(
    'enrollments',
    `student_id=eq.${alumnoB}&school_year_id=eq.${anioId}`,
    { student_id: alumnoB, classroom_id: aulaB, school_year_id: anioId },
  )

  // ── Una actividad activa con quiz en el salón de A ──
  // El quiz lleva la marca `*` en la opción correcta, igual que lo escribiría
  // un docente: es lo que permite comprobar si esa marca se le filtra al alumno.
  const plantillas = (await leerComoServicio('activity_templates?select=id&limit=1')) as { id: string }[]
  expect(plantillas.length, 'debe existir al menos una plantilla de actividad').toBeGreaterThan(0)

  const yaHay = (await leerComoServicio(
    `activities?classroom_id=eq.${aulaA}&title=eq.QA%20quiz%20de%20prueba&select=id`,
  )) as { id: string }[]

  let actividadA: string
  if (yaHay.length > 0) {
    actividadA = yaHay[0].id
  } else {
    const creada = await servicio('rest/v1/activities', 'POST', {
      classroom_id: aulaA,
      template_id: plantillas[0].id,
      topic_id: temaGrado4,
      title: 'QA quiz de prueba',
      status: 'active',
      ai_context:
        'P: Cual es la capital de Venezuela?\nA) Maracaibo\nB) Caracas *\nC) Valencia\n\n' +
        'P: Cuanto es 7 x 8?\nA) 54\nB) 56 *\nC) 58',
    })
    actividadA = ((creada.datos as { id: string }[]) ?? [])[0]?.id
  }
  expect(actividadA, 'actividad con quiz en el salón de A').toBeTruthy()

  const escenario: Escenario = {
    anioId, docenteA, docenteB, alumnoA, alumnoB,
    aulaA, aulaB,
    actividadA, temaGrado4, temaGrado3,
  }
  fs.writeFileSync(ARCHIVO_IDS, JSON.stringify(escenario, null, 2))
})
