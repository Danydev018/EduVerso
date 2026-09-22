import { URL_SUPABASE, CLAVE_SERVICIO } from '../seguridad/fixtures'

/**
 * Devuelve al alumno al punto de partida de una actividad.
 *
 * POR QUÉ HACE FALTA: el recorrido del alumno avanza de verdad —contesta,
 * gana XP, completa pasos— así que la segunda corrida encontraría la actividad
 * a medias o terminada y probaría otra cosa. Reponer antes de empezar es lo
 * que hace la prueba repetible.
 *
 * Usa la llave de servicio porque borra a nombre de otro: el alumno no puede
 * —ni debe— borrar su propio progreso, y eso está comprobado en
 * `seguridad/04-quiz.spec.ts`. Acá se hace desde fuera de la aplicación, como
 * lo haría quien prepara un laboratorio.
 */
async function borrar(ruta: string) {
  const r = await fetch(`${URL_SUPABASE}/rest/v1/${ruta}`, {
    method: 'DELETE',
    headers: {
      apikey: CLAVE_SERVICIO,
      Authorization: `Bearer ${CLAVE_SERVICIO}`,
    },
  })
  if (r.status >= 400) {
    throw new Error(`No se pudo reponer (${ruta}): ${r.status} ${await r.text()}`)
  }
}

export async function reponerActividad(alumnoId: string, actividadId: string) {
  // El orden importa: primero lo que referencia, después lo referenciado.
  await borrar(`quiz_results?student_id=eq.${alumnoId}&activity_id=eq.${actividadId}`)
  await borrar(`ai_interactions?student_id=eq.${alumnoId}&activity_id=eq.${actividadId}`)
  await borrar(`activity_progress?student_id=eq.${alumnoId}&activity_id=eq.${actividadId}`)
}

/** Pone el XP del alumno en cero, para medir lo que gana durante la prueba. */
export async function reponerPuntos(alumnoId: string) {
  await borrar(`student_points?student_id=eq.${alumnoId}`)
}

/** XP y nivel actuales, leídos por fuera de la aplicación. */
export async function puntosDe(alumnoId: string): Promise<{ total_xp: number; level: number } | null> {
  const r = await fetch(
    `${URL_SUPABASE}/rest/v1/student_points?student_id=eq.${alumnoId}&select=total_xp,level`,
    { headers: { apikey: CLAVE_SERVICIO, Authorization: `Bearer ${CLAVE_SERVICIO}` } },
  )
  const filas = (await r.json()) as { total_xp: number; level: number }[]
  return filas?.[0] ?? null
}

/** Cuántas respondió y cuántas acertó, según el registro del servidor. */
export async function aciertoDe(
  alumnoId: string,
  actividadId: string,
): Promise<{ respondidas: number; correctas: number }> {
  const r = await fetch(
    `${URL_SUPABASE}/rest/v1/quiz_results?student_id=eq.${alumnoId}&activity_id=eq.${actividadId}&select=is_correct`,
    { headers: { apikey: CLAVE_SERVICIO, Authorization: `Bearer ${CLAVE_SERVICIO}` } },
  )
  const filas = (await r.json()) as { is_correct: boolean }[]
  return {
    respondidas: filas.length,
    correctas: filas.filter((f) => f.is_correct).length,
  }
}

/**
 * Índices correctos del quiz, leídos con la llave de servicio.
 *
 * Esto es exactamente lo que el ALUMNO no puede hacer —está comprobado en
 * `seguridad/04-quiz.spec.ts`— y por eso hace falta acá: para poder pedirle a
 * la prueba "contesta todo bien" o "contesta todo mal" a propósito, y verificar
 * la fórmula del XP en sus dos extremos en vez de con un caso ambiguo.
 */
export async function clavesDe(actividadId: string): Promise<number[]> {
  const r = await fetch(
    `${URL_SUPABASE}/rest/v1/activity_quizzes?activity_id=eq.${actividadId}&select=quiz_text`,
    { headers: { apikey: CLAVE_SERVICIO, Authorization: `Bearer ${CLAVE_SERVICIO}` } },
  )
  const filas = (await r.json()) as { quiz_text: string }[]
  const texto = filas?.[0]?.quiz_text ?? ''

  // Mismo formato que documenta lib/quiz.ts: bloques separados por línea en
  // blanco, opciones "A) texto", y la correcta con `*` al final.
  const claves: number[] = []
  for (const bloque of texto.split(/\r?\n\s*\r?\n/)) {
    const lineas = bloque.split(/\r?\n/).map((l) => l.trim())
    if (!lineas.some((l) => /^P:/i.test(l))) continue
    const opciones = lineas.filter((l) => /^[A-Za-z][).]/.test(l))
    const indice = opciones.findIndex((l) => /\*\s*$/.test(l))
    if (opciones.length >= 2 && indice >= 0) claves.push(indice)
  }
  return claves
}
