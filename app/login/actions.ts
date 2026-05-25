'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const ROLE_HOME: Record<string, string> = {
  coordinator: '/coordinator/dashboard',
  teacher: '/teacher/dashboard',
  student: '/student/dashboard',
}

export async function login(formData: FormData) {
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')

  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.user) {
    redirect('/login?error=invalid')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', data.user.id)
    .single()

  if (!profile) {
    await supabase.auth.signOut()
    redirect('/login?error=no_profile')
  }

  if (!profile.is_active) {
    await supabase.auth.signOut()
    redirect('/login?error=inactive')
  }

  redirect(ROLE_HOME[profile.role] ?? '/login')
}

export async function logout() {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
