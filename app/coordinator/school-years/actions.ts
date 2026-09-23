'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { CACHE_TAGS } from '@/lib/reference-data'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireRole } from '@/lib/auth'
import { mensajeDeError } from '@/lib/errores'

type ActionState = { error: string | null }

export async function createSchoolYear(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole('coordinator')

  const name = (formData.get('name') as string)?.trim()
  const start_date = formData.get('start_date') as string
  const end_date = formData.get('end_date') as string

  if (!name || !start_date || !end_date) {
    return { error: 'Todos los campos son obligatorios.' }
  }
  if (new Date(end_date) <= new Date(start_date)) {
    return { error: 'La fecha de fin debe ser posterior a la fecha de inicio.' }
  }

  const admin = createAdminClient()
  const { error } = await admin.from('school_years').insert({ name, start_date, end_date, is_current: false })

  if (error) return { error: mensajeDeError(error, 'coordinator/school-years') }

  // La lista de años está cacheada globalmente (lib/reference-data.ts).
  revalidateTag(CACHE_TAGS.schoolYears)
  revalidatePath('/coordinator/school-years')
  return { error: null }
}

export async function activateSchoolYear(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole('coordinator')

  const id = formData.get('id') as string
  const admin = createAdminClient()

  // Desactivar todos primero
  const { error: deactivateError } = await admin
    .from('school_years')
    .update({ is_current: false })
    .neq('id', id)

  if (deactivateError) return { error: mensajeDeError(deactivateError, 'coordinator/school-years') }

  const { error: activateError } = await admin
    .from('school_years')
    .update({ is_current: true })
    .eq('id', id)

  if (activateError) return { error: mensajeDeError(activateError, 'coordinator/school-years') }

  revalidateTag(CACHE_TAGS.schoolYears)
  revalidatePath('/coordinator/school-years')
  revalidatePath('/coordinator/dashboard')
  return { error: null }
}
