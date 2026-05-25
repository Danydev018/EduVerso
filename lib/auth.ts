import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type Role = 'coordinator' | 'teacher' | 'student'

export type AuthUser = {
  id: string
  email: string
  full_name: string
  role: Role
}

/**
 * Asegura que el usuario actual está autenticado y tiene el rol esperado.
 * Si no, redirige a /login. El middleware ya hace esta validación a nivel de ruta,
 * pero este helper también la hace en los layouts/server components para defensa en profundidad.
 */
export async function requireRole(expected: Role): Promise<AuthUser> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, is_active')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.is_active || profile.role !== expected) {
    redirect('/login')
  }

  return {
    id: user.id,
    email: user.email ?? '',
    full_name: profile.full_name,
    role: profile.role as Role,
  }
}
