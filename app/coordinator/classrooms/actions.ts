'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireRole } from '@/lib/auth'
import { mensajeDeError } from '@/lib/errores'

type ActionState = { error: string | null }

export async function createClassroom(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole('coordinator')

  const school_year_id = formData.get('school_year_id') as string
  const grade_id = formData.get('grade_id') as string
  const section = (formData.get('section') as string)?.trim().toUpperCase()
  const teacher_id = formData.get('teacher_id') as string

  if (!school_year_id || !grade_id || !section || !teacher_id) {
    return { error: 'Todos los campos son obligatorios.' }
  }
  if (!/^[A-Z]$/.test(section)) {
    return { error: 'La sección debe ser una sola letra (A, B, C...).' }
  }

  const admin = createAdminClient()

  const { error } = await admin.from('classrooms').insert({
    school_year_id,
    grade_id: Number(grade_id),
    section,
    teacher_id,
  })

  if (error) {
    if (error.code === '23505') {
      return { error: 'Ya existe un salón con ese grado y sección en el año activo.' }
    }
    return { error: mensajeDeError(error, 'coordinator/classrooms') }
  }

  revalidatePath('/coordinator/classrooms')
  redirect('/coordinator/classrooms')
}

export async function assignStudentToClassroom(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole('coordinator')

  const student_id = formData.get('student_id') as string
  const classroom_id = formData.get('classroom_id') as string
  const school_year_id = formData.get('school_year_id') as string

  if (!student_id || !classroom_id || !school_year_id) {
    return { error: 'Faltan datos requeridos.' }
  }

  const admin = createAdminClient()

  const { error } = await admin.from('enrollments').insert({
    student_id,
    classroom_id,
    school_year_id,
    status: 'active',
  })

  if (error) {
    if (error.code === '23505') {
      return { error: 'El alumno ya está matriculado en un salón este año.' }
    }
    return { error: mensajeDeError(error, 'coordinator/classrooms') }
  }

  revalidatePath(`/coordinator/classrooms/${classroom_id}`)
  return { error: null }
}

export async function removeStudentFromClassroom(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole('coordinator')

  const enrollment_id = formData.get('enrollment_id') as string
  const classroom_id = formData.get('classroom_id') as string

  const admin = createAdminClient()
  const { error } = await admin.from('enrollments').delete().eq('id', enrollment_id)

  if (error) return { error: mensajeDeError(error, 'coordinator/classrooms') }

  revalidatePath(`/coordinator/classrooms/${classroom_id}`)
  return { error: null }
}
