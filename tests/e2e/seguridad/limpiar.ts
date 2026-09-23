/**
 * Borra todo lo que provisiona la batería de seguridad.
 *
 * Correr con: `npm run test:limpiar`
 *
 * POR QUÉ EXISTE: estas pruebas escriben en la base real del proyecto, no en
 * una de mentira. Eso es deliberado —RLS solo se puede comprobar contra el
 * Postgres de verdad, con sus políticas puestas— pero obliga a poder dejar
 * la base como estaba.
 *
 * El orden importa: primero lo que apunta a otras filas (matrículas,
 * actividades), después los salones, y al final los usuarios. Al borrar el
 * usuario de auth, el perfil y el alumno caen solos por `on delete cascade`.
 */
import { loadEnvConfig } from '@next/env'

loadEnvConfig(process.cwd())

const URL_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL
const CLAVE = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!URL_SUPABASE || !CLAVE) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const CORREOS_QA = [
  'qa.coordinador.a@eduverso.com',
  'qa.docente.a@eduverso.com',
  'qa.docente.b@eduverso.com',
  'qa.alumno.a@eduverso.com',
  'qa.alumno.b@eduverso.com',
]

async function api(ruta: string, metodo = 'GET') {
  const r = await fetch(`${URL_SUPABASE}/${ruta}`, {
    method: metodo,
    headers: { apikey: CLAVE!, Authorization: `Bearer ${CLAVE}` },
  })
  const texto = await r.text()
  return { estado: r.status, datos: texto ? JSON.parse(texto) : null }
}

async function main() {
  // ── Ids de las cuentas QA ──
  const { datos: lista } = await api('auth/v1/admin/users?per_page=200')
  const usuarios = (lista?.users ?? []) as { id: string; email: string }[]
  const qa = usuarios.filter((u) => CORREOS_QA.includes(u.email))
  console.log(`Cuentas QA encontradas: ${qa.length}`)

  const ids = qa.map((u) => u.id)
  const enLista = `(${ids.join(',')})`

  if (ids.length > 0) {
    // ── Dependencias, de más externa a más interna ──
    for (const paso of [
      `rest/v1/ai_interactions?student_id=in.${enLista}`,
      `rest/v1/activity_progress?student_id=in.${enLista}`,
      `rest/v1/presential_evaluations?student_id=in.${enLista}`,
      `rest/v1/student_points?student_id=in.${enLista}`,
      `rest/v1/enrollments?student_id=in.${enLista}`,
    ]) {
      const { estado } = await api(paso, 'DELETE')
      console.log(`  ${paso.split('?')[0].replace('rest/v1/', '')} → ${estado}`)
    }

    // Actividades y salones de los docentes QA
    const { datos: aulas } = await api(`rest/v1/classrooms?teacher_id=in.${enLista}&select=id`)
    for (const a of (aulas ?? []) as { id: string }[]) {
      await api(`rest/v1/activities?classroom_id=eq.${a.id}`, 'DELETE')
      await api(`rest/v1/enrollments?classroom_id=eq.${a.id}`, 'DELETE')
      const { estado } = await api(`rest/v1/classrooms?id=eq.${a.id}`, 'DELETE')
      console.log(`  salón ${a.id.slice(0, 8)} → ${estado}`)
    }

    // ── Los usuarios: el perfil y el alumno caen en cascada ──
    for (const u of qa) {
      const { estado } = await api(`auth/v1/admin/users/${u.id}`, 'DELETE')
      console.log(`  ${u.email} → ${estado}`)
    }
  }

  // ── Lecciones que dejaron las pruebas de `teaches_topic` ──
  const { estado } = await api('rest/v1/topic_lessons?title=like.QA%20*', 'DELETE')
  console.log(`  lecciones QA → ${estado}`)

  console.log('\nListo. Quedan intactos los datos reales de la escuela.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
