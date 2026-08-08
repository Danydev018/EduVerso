'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

type ActionState = { error: string | null }

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
  const available_from_raw = formData.get('available_from') as string
  const available_until_raw = formData.get('available_until') as string

  if (!template_id || !topic_id || !title) {
    return { error: 'Plantilla, tópico y título son obligatorios.' }
  }

  const { data: currentYear } = await supabase
    .from('school_years')
    .select('id')
    .eq('is_current', true)
    .maybeSingle()

  if (!currentYear) {
    return { error: 'No hay un año escolar activo.' }
  }

  const { data: classroom } = await supabase
    .from('classrooms')
    .select('id')
    .eq('teacher_id', user.id)
    .eq('school_year_id', currentYear.id)
    .maybeSingle()

  if (!classroom) {
    return { error: 'No tenés un salón asignado en el año activo.' }
  }

  const available_from = available_from_raw
    ? new Date(available_from_raw).toISOString()
    : null
  const available_until = available_until_raw
    ? new Date(available_until_raw).toISOString()
    : null

  if (available_from && available_until && available_from > available_until) {
    return { error: 'La fecha de inicio no puede ser posterior a la fecha de fin.' }
  }

  const { error } = await supabase.from('activities').insert({
    classroom_id: classroom.id,
    template_id,
    topic_id,
    title,
    ai_context,
    status: 'draft',
    available_from,
    available_until,
  })

  if (error) return { error: error.message }

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
