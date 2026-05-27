'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireRole } from '@/lib/auth'

type ActionState = { error: string | null }

export async function createTeacher(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole('coordinator')

  const full_name = (formData.get('full_name') as string)?.trim()
  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string

  if (!full_name || !email || !password) {
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
    .insert({ id: authData.user.id, role: 'teacher', full_name, is_active: true })

  if (profileError) {
    await admin.auth.admin.deleteUser(authData.user.id)
    return { error: profileError.message }
  }

  revalidatePath('/coordinator/teachers')
  redirect('/coordinator/teachers')
}

export async function toggleTeacherActive(
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

  revalidatePath('/coordinator/teachers')
  return { error: null }
}
