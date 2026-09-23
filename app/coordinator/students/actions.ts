'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import { mensajeDeError } from '@/lib/errores'

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
    return { error: mensajeDeError(authError, 'coordinator/students', 'Error al crear el usuario.') }
  }

  const { error: profileError } = await admin
    .from('profiles')
    .insert({ id: authData.user.id, role: 'student', full_name, is_active: true })

  if (profileError) {
    await admin.auth.admin.deleteUser(authData.user.id)
    return { error: mensajeDeError(profileError, 'coordinator/students') }
  }

  const { error: studentError } = await admin
    .from('students')
    .insert({ id: authData.user.id, birth_date })

  if (studentError) {
    await admin.auth.admin.deleteUser(authData.user.id)
    return { error: mensajeDeError(studentError, 'coordinator/students') }
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

  if (profileError) return { error: mensajeDeError(profileError, 'coordinator/students') }

  const { error: studentError } = await admin
    .from('students')
    .update({ birth_date })
    .eq('id', id)

  if (studentError) return { error: mensajeDeError(studentError, 'coordinator/students') }

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

  if (error) return { error: mensajeDeError(error, 'coordinator/students') }

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

  if (profileError) return { error: mensajeDeError(profileError, 'coordinator/students') }

  if (enrollmentId) {
    const { error: enrollmentError } = await admin
      .from('enrollments')
      .update({ status: 'withdrawn' })
      .eq('id', enrollmentId)

    if (enrollmentError) return { error: mensajeDeError(enrollmentError, 'coordinator/students') }

    await createLeaderboardSnapshot(admin, studentId, enrollmentId)
  }

  revalidatePath('/coordinator/students')
  redirect('/coordinator/students')
}

/**
 * Congela el XP del alumno en leaderboard_snapshots antes de que se retire
 * del salón, para que siga apareciendo (etiquetado "Egresado") en los
 * leaderboards de tier/institución. Ver docs/08-gamificacion.md.
 *
 * No lanza si algo falla — un snapshot faltante no debe bloquear el retiro
 * del alumno (que ya cambió profiles.is_active y enrollments.status).
 */
async function createLeaderboardSnapshot(
  admin: ReturnType<typeof createAdminClient>,
  studentId: string,
  enrollmentId: string,
) {
  const { data: enrollment } = await admin
    .from('enrollments')
    .select('classroom_id, school_year_id')
    .eq('id', enrollmentId)
    .maybeSingle()

  if (!enrollment) return

  const [{ data: classroom }, { data: schoolYear }, { data: profile }, { data: points }] =
    await Promise.all([
      admin
        .from('classrooms')
        .select('grade_id, section')
        .eq('id', enrollment.classroom_id)
        .maybeSingle(),
      admin
        .from('school_years')
        .select('end_date')
        .eq('id', enrollment.school_year_id)
        .maybeSingle(),
      admin.from('profiles').select('full_name').eq('id', studentId).maybeSingle(),
      admin
        .from('student_points')
        .select('total_xp')
        .eq('student_id', studentId)
        .eq('school_year_id', enrollment.school_year_id)
        .maybeSingle(),
    ])

  if (!classroom || !schoolYear || !profile) return

  const totalXp = (points as { total_xp: number } | null)?.total_xp ?? 0
  const expiresAt = new Date(schoolYear.end_date)
  expiresAt.setFullYear(expiresAt.getFullYear() + 2)

  await admin.from('leaderboard_snapshots').insert({
    student_name: profile.full_name,
    school_year_id: enrollment.school_year_id,
    grade_id: classroom.grade_id,
    section: classroom.section,
    total_xp: totalXp,
    expires_at: expiresAt.toISOString().slice(0, 10),
  })
}
