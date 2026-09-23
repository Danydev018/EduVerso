'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { mensajeDeError } from '@/lib/errores'

export type PromoteState = { error: string | null; promoted: boolean }

/**
 * Promueve a un alumno (matrícula 'active' → 'promoted').
 *
 * Antes esto lo hacía el navegador con el SDK de Supabase, lo que metía
 * ~75 kB de JS en la página de detalle del alumno solo para un UPDATE. Acá
 * se usa el cliente de servidor con la sesión del docente, así que sigue
 * aplicando la misma política RLS `enrollments_promote`
 * (is_teacher() AND owns_classroom(...) AND status = 'promoted'):
 * un docente no puede promover alumnos de otro salón.
 */
export async function promoteStudent(
  _prev: PromoteState,
  formData: FormData,
): Promise<PromoteState> {
  await requireRole('teacher')

  const enrollmentId = formData.get('enrollment_id') as string
  const studentId = formData.get('student_id') as string

  if (!enrollmentId) {
    return { error: 'Falta el identificador de la matrícula.', promoted: false }
  }

  const supabase = createClient()
  const { error } = await supabase
    .from('enrollments')
    .update({ status: 'promoted' })
    .eq('id', enrollmentId)

  if (error) return { error: mensajeDeError(error, 'teacher/students'), promoted: false }

  if (studentId) revalidatePath(`/teacher/students/${studentId}`)
  revalidatePath('/teacher/classroom')

  return { error: null, promoted: true }
}
