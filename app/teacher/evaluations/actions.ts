'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { mensajeDeError } from '@/lib/errores'

export type EvaluationState = { error: string | null }

/**
 * Crea o actualiza una evaluación presencial.
 *
 * Antes el formulario escribía directo con el SDK de Supabase desde el
 * navegador, lo que sumaba ~75 kB de JS a /teacher/evaluations/new y
 * /teacher/evaluations/[id]/edit. Acá se usa el cliente de servidor con la
 * sesión del docente, así que siguen rigiendo `eval_insert` / `eval_update`
 * (is_teacher() AND owns_classroom(...)): no puede escribir notas en un
 * salón ajeno.
 *
 * La validación se repite del lado del servidor a propósito: la del
 * navegador es solo para dar feedback inmediato y no es una garantía.
 */
export async function saveEvaluation(
  _prev: EvaluationState,
  formData: FormData,
): Promise<EvaluationState> {
  await requireRole('teacher')

  const mode = formData.get('mode') as 'create' | 'edit'
  const evaluationId = formData.get('evaluation_id') as string | null
  const studentId = formData.get('student_id') as string
  const categoryId = formData.get('category_id') as string
  const classroomId = formData.get('classroom_id') as string
  const teacherId = formData.get('teacher_id') as string
  const date = formData.get('evaluation_date') as string
  const notes = ((formData.get('notes') as string) ?? '').trim()

  if (!studentId) return { error: 'Seleccioná un estudiante.' }
  if (!categoryId) return { error: 'Seleccioná una categoría de evaluación.' }
  if (!date) return { error: 'Seleccioná una fecha de evaluación.' }

  const score = parseFloat(formData.get('score') as string)
  const maxScore = parseFloat(formData.get('max_score') as string)

  if (isNaN(score) || score < 0) return { error: 'La nota debe ser un número positivo.' }
  if (isNaN(maxScore) || maxScore <= 0) return { error: 'La nota máxima debe ser mayor a 0.' }
  if (score > maxScore) {
    return { error: `La nota (${score}) no puede superar la nota máxima (${maxScore}).` }
  }

  const supabase = createClient()

  if (mode === 'edit') {
    if (!evaluationId) return { error: 'Falta el identificador de la evaluación.' }

    const { error } = await supabase
      .from('presential_evaluations')
      .update({
        student_id: studentId,
        category_id: categoryId,
        score,
        max_score: maxScore,
        evaluation_date: date,
        notes: notes || null,
      })
      .eq('id', evaluationId)

    if (error) return { error: mensajeDeError(error, 'teacher/evaluations') }
  } else {
    const { error } = await supabase.from('presential_evaluations').insert({
      student_id: studentId,
      category_id: categoryId,
      classroom_id: classroomId,
      teacher_id: teacherId,
      score,
      max_score: maxScore,
      evaluation_date: date,
      notes: notes || null,
    })

    if (error) return { error: mensajeDeError(error, 'teacher/evaluations') }
  }

  revalidatePath('/teacher/evaluations')
  revalidatePath(`/teacher/students/${studentId}`)
  redirect('/teacher/evaluations')
}
