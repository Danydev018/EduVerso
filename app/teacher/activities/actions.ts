'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { quitarMarcas, parseQuiz } from '@/lib/quiz'

type ActionState = { error: string | null }

/**
 * Guarda el texto de una actividad desdoblado en dos.
 *
 * `activities.ai_context` le llega al ALUMNO junto con su actividad, así que
 * ahí va el texto SIN los asteriscos que marcan la correcta. La clave completa
 * queda en `activity_quizzes`, cuya política solo deja entrar a coordinación y
 * al docente dueño del salón (ver migración 14).
 *
 * Devuelve lo que hay que escribir en `ai_context`; la clave la guarda por su
 * cuenta. Si el texto no tiene formato de quiz —el docente escribió una nota
 * suelta para el tutor— no crea clave y borra la que hubiera, que es lo que
 * corresponde si alguien convierte un quiz en una nota.
 */
async function guardarClaveYLimpiar(
  supabase: ReturnType<typeof createClient>,
  activityId: string,
  textoConMarcas: string | null,
): Promise<string | null> {
  const esQuiz = (parseQuiz(textoConMarcas)?.length ?? 0) > 0

  if (esQuiz && textoConMarcas) {
    await supabase
      .from('activity_quizzes')
      .upsert({ activity_id: activityId, quiz_text: textoConMarcas, updated_at: new Date().toISOString() })
  } else {
    await supabase.from('activity_quizzes').delete().eq('activity_id', activityId)
  }

  return quitarMarcas(textoConMarcas)
}

/**
 * Salón del docente en el año activo.
 *
 * Un docente puede tener más de un salón (ej. 3ro A y 3ro B). Sin ordenar y
 * acotar, `maybeSingle()` devuelve PGRST116 y el panel responde "no tienes
 * salón asignado" aunque tenga varios. Mismo criterio que las páginas: se
 * toma el primero por grado y sección.
 */
async function getTeacherClassroom(teacherId: string) {
  const supabase = createClient()

  const { data: currentYear } = await supabase
    .from('school_years')
    .select('id')
    .eq('is_current', true)
    .maybeSingle()

  if (!currentYear) return { classroom: null, error: 'No hay un año escolar activo.' }

  const { data: classroom } = await supabase
    .from('classrooms')
    .select('id, grade_id')
    .eq('teacher_id', teacherId)
    .eq('school_year_id', currentYear.id)
    .order('grade_id')
    .order('section')
    .limit(1)
    .maybeSingle()

  if (!classroom) return { classroom: null, error: 'No tienes un salón asignado.' }

  return { classroom, error: null }
}

export async function createActivity(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireRole('teacher')
  const supabase = createClient()

  const template_id = formData.get('template_id') as string
  const topic_id = formData.get('topic_id') as string
  const title = (formData.get('title') as string)?.trim()
  const ai_context = (formData.get('ai_context') as string)?.trim() || null
  const ship_part_id = (formData.get('ship_part_id') as string) || null
  const available_from_raw = formData.get('available_from') as string
  const available_until_raw = formData.get('available_until') as string

  if (!template_id || !topic_id || !title) {
    return { error: 'Plantilla, tópico y título son obligatorios.' }
  }

  const { classroom, error: classroomError } = await getTeacherClassroom(user.id)
  if (!classroom) return { error: classroomError }

  const available_from = available_from_raw
    ? new Date(available_from_raw).toISOString()
    : null
  const available_until = available_until_raw
    ? new Date(available_until_raw).toISOString()
    : null

  if (available_from && available_until && available_from > available_until) {
    return { error: 'La fecha de inicio no puede ser posterior a la fecha de fin.' }
  }

  // Se inserta con el texto ya limpio y después se guarda la clave, que
  // necesita el id de la actividad recién creada.
  const { data: creada, error } = await supabase
    .from('activities')
    .insert({
      classroom_id: classroom.id,
      template_id,
      topic_id,
      title,
      ai_context: quitarMarcas(ai_context),
      ship_part_id,
      status: 'draft',
      available_from,
      available_until,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  if (creada) await guardarClaveYLimpiar(supabase, creada.id, ai_context)

  revalidatePath('/teacher/activities')
  redirect('/teacher/activities')
}

export async function toggleActivityStatus(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole('teacher')
  const supabase = createClient()

  const activity_id = formData.get('activity_id') as string
  const current_status = formData.get('current_status') as string

  if (!activity_id) return { error: 'Falta el ID de la actividad.' }

  const next_status = current_status === 'active' ? 'draft' : 'active'

  const { error } = await supabase
    .from('activities')
    .update({ status: next_status })
    .eq('id', activity_id)

  if (error) return { error: error.message }

  revalidatePath('/teacher/activities')
  revalidatePath(`/teacher/activities/${activity_id}`)
  return { error: null }
}

/**
 * Asigna una evaluación del repositorio al salón del docente.
 *
 * El contenido del banco se COPIA a la nueva actividad en vez de referenciarlo.
 * Así el docente puede ajustar las preguntas para su salón sin tocar el banco,
 * y una corrección posterior en el banco no cambia una evaluación que los
 * alumnos ya empezaron a responder. `source_bank_id` deja el rastro de origen.
 *
 * Nace como borrador: el docente decide cuándo activarla y con qué fechas.
 */
export async function assignFromBank(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireRole('teacher')
  const supabase = createClient()

  const bank_id = formData.get('bank_id') as string
  if (!bank_id) return { error: 'Falta la evaluación a asignar.' }

  const { classroom, error: classroomError } = await getTeacherClassroom(user.id)
  if (!classroom) return { error: classroomError }

  const { data: entrada } = await supabase
    .from('activity_bank')
    .select('id, topic_id, template_id, ship_part_id, title, content, briefing')
    .eq('id', bank_id)
    .maybeSingle()

  if (!entrada) return { error: 'Esa evaluación ya no está en el repositorio.' }

  // El repositorio muestra todos los grados, así que hay que verificar que el
  // tema pertenezca al grado del salón. Sin esto, un docente de 1er grado
  // podría asignar por error una evaluación de 6to.
  const { data: tema } = await supabase
    .from('topics')
    .select('id, subjects!inner(grade_id)')
    .eq('id', entrada.topic_id)
    .maybeSingle<{ id: string; subjects: { grade_id: number } }>()

  if (!tema || tema.subjects.grade_id !== classroom.grade_id) {
    return { error: 'Esa evaluación es de otro grado y no aplica a tu salón.' }
  }

  const { data: yaAsignada } = await supabase
    .from('activities')
    .select('id')
    .eq('classroom_id', classroom.id)
    .eq('source_bank_id', entrada.id)
    .limit(1)
    .maybeSingle()

  if (yaAsignada) {
    return { error: 'Ya asignaste esta evaluación a tu salón.' }
  }

  const { data: creada, error } = await supabase
    .from('activities')
    .insert({
      classroom_id: classroom.id,
      template_id: entrada.template_id,
      topic_id: entrada.topic_id,
      ship_part_id: entrada.ship_part_id,
      source_bank_id: entrada.id,
      title: entrada.title,
      ai_context: quitarMarcas(entrada.content),
      status: 'draft',
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  // La entrada del banco trae el quiz con sus marcas: van a la clave.
  if (creada) await guardarClaveYLimpiar(supabase, creada.id, entrada.content)

  // El repaso del banco se copia como bloques de texto de la actividad nueva.
  // Va después de crearla y sin cortar por el error: si esto fallara, el
  // docente igual tiene su evaluación asignada y puede escribir el repaso a
  // mano, que es mucho mejor que perder la asignación entera.
  const parrafos = Array.isArray(entrada.briefing)
    ? (entrada.briefing as unknown[]).filter(
        (t): t is string => typeof t === 'string' && t.trim() !== '',
      )
    : []

  if (creada && parrafos.length > 0) {
    await supabase.from('activity_briefing_blocks').insert(
      parrafos.map((texto, i) => ({
        activity_id: creada.id,
        kind: 'text',
        text_content: texto.trim(),
        order_index: i,
      })),
    )
  }

  revalidatePath('/teacher/activities')
  revalidatePath('/teacher/activities/repositorio')
  return { error: null }
}

/**
 * Quita del salón una actividad asignada desde el repositorio.
 *
 * La regla (ningún alumno la completó), el chequeo de permisos y el borrado
 * en cascada viven en `unassign_activity()` porque hay que tocar tres tablas
 * con políticas distintas en una sola transacción. Ver la migración 09.
 */
export async function unassignActivity(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole('teacher')
  const supabase = createClient()

  const activity_id = formData.get('activity_id') as string
  if (!activity_id) return { error: 'Falta la actividad a quitar.' }

  const { data, error } = await supabase.rpc('unassign_activity', {
    p_activity_id: activity_id,
  })

  if (error) return { error: error.message }

  const resultado = data as { ok: boolean; error?: string } | null
  if (!resultado?.ok) {
    return { error: resultado?.error ?? 'No se pudo quitar la actividad.' }
  }

  revalidatePath('/teacher/activities')
  revalidatePath('/teacher/activities/repositorio')
  return { error: null }
}

/**
 * Guarda los cambios que el docente hizo a una actividad de su salón.
 *
 * El contenido llega ya serializado al formato de `ai_context` desde el
 * editor (ver `serializeQuiz`). La RLS de UPDATE sobre `activities` ya limita
 * a los salones propios, así que acá no se repite ese chequeo; lo que sí se
 * valida es que la actividad siga siendo del docente antes de revalidar.
 */
export async function updateActivity(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole('teacher')
  const supabase = createClient()

  const activity_id = formData.get('activity_id') as string
  const title = (formData.get('title') as string)?.trim()
  const content = ((formData.get('content') as string) ?? '').trim() || null
  const ship_part_id = (formData.get('ship_part_id') as string) || null
  const available_from_raw = formData.get('available_from') as string
  const available_until_raw = formData.get('available_until') as string

  if (!activity_id) return { error: 'Falta la actividad.' }
  if (!title) return { error: 'El título es obligatorio.' }

  const available_from = available_from_raw
    ? new Date(available_from_raw).toISOString()
    : null
  const available_until = available_until_raw
    ? new Date(available_until_raw).toISOString()
    : null

  if (available_from && available_until && available_from > available_until) {
    return { error: 'La fecha de inicio no puede ser posterior a la fecha de fin.' }
  }

  const { error, count } = await supabase
    .from('activities')
    .update(
      {
        title,
        ai_context: quitarMarcas(content),
        ship_part_id,
        available_from,
        available_until,
      },
      { count: 'exact' },
    )
    .eq('id', activity_id)

  if (error) return { error: error.message }
  if (count === 0) return { error: 'Esa actividad no es de tu salón.' }

  // Solo después de confirmar que la actividad es suya: la política de
  // `activity_quizzes` lo comprobaría igual, pero así el orden es explícito.
  await guardarClaveYLimpiar(supabase, activity_id, content)

  revalidatePath('/teacher/activities')
  revalidatePath(`/teacher/activities/${activity_id}`)
  redirect(`/teacher/activities/${activity_id}`)
}
