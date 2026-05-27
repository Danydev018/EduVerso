'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'

type ActionState = { error: string | null }

export async function createStudent(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole('coordinator')

  const full_name = (formData.get('full_name') as string)?.trim()
  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string
  const birth_date = formData.get('birth_date') as string

  if (!full_name || !email || !password || !birth_date) {
    return { error: 'Todos los campos son obligatorios.' }
  }
  if (password.length < 6) {
    return { error: 'La contraseña debe tener al menos 6 caracteres.' }
  }

  const admin = createAdminClient()

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError || !authData.user) {
    return { error: authError?.message ?? 'Error al crear el usuario.' }
  }

  const { error: profileError } = await admin
    .from('profiles')
    .insert({ id: authData.user.id, role: 'student', full_name, is_active: true })

  if (profileError) {
    await admin.auth.admin.deleteUser(authData.user.id)
    return { error: profileError.message }
  }

  const { error: studentError } = await admin
    .from('students')
    .insert({ id: authData.user.id, birth_date })

  if (studentError) {
    await admin.auth.admin.deleteUser(authData.user.id)
    return { error: studentError.message }
  }

  revalidatePath('/coordinator/students')
  redirect('/coordinator/students')
}

export async function updateStudent(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole('coordinator')

  const id = formData.get('id') as string
  const full_name = (formData.get('full_name') as string)?.trim()
  const birth_date = formData.get('birth_date') as string

  if (!full_name || !birth_date) {
    return { error: 'Nombre y fecha de nacimiento son obligatorios.' }
  }

  const admin = createAdminClient()

  const { error: profileError } = await admin
    .from('profiles')
    .update({ full_name })
    .eq('id', id)

  if (profileError) return { error: profileError.message }

  const { error: studentError } = await admin
    .from('students')
    .update({ birth_date })
    .eq('id', id)

  if (studentError) return { error: studentError.message }

  revalidatePath('/coordinator/students')
  redirect('/coordinator/students')
}

export async function toggleStudentActive(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole('coordinator')

  const id = formData.get('id') as string
  const currentActive = formData.get('is_active') === 'true'

  const admin = createAdminClient()

  const { error } = await admin
    .from('profiles')
    .update({ is_active: !currentActive })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/coordinator/students')
  return { error: null }
}

export async function withdrawStudent(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole('coordinator')

  const studentId = formData.get('student_id') as string
  const enrollmentId = formData.get('enrollment_id') as string

  if (!studentId) return { error: 'ID de alumno requerido.' }

  const admin = createAdminClient()

  const { error: profileError } = await admin
    .from('profiles')
    .update({ is_active: false })
    .eq('id', studentId)

  if (profileError) return { error: profileError.message }

  if (enrollmentId) {
    const { error: enrollmentError } = await admin
      .from('enrollments')
      .update({ status: 'withdrawn' })
      .eq('id', enrollmentId)

    if (enrollmentError) return { error: enrollmentError.message }
  }

  revalidatePath('/coordinator/students')
  redirect('/coordinator/students')
}
