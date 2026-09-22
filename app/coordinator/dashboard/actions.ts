'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireRole } from '@/lib/auth'

type ActionState = { error: string | null; deletedCount: number | null }

/**
 * Borra los snapshots de egresados cuyo expires_at ya pasó. Manual por ahora
 * (ver docs/08-gamificacion.md — "Reset anual" / "Alumnos egresados") — un
 * cron job es una mejora futura, no parte del alcance del TEG.
 */
export async function cleanExpiredSnapshots(
  _prev: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  await requireRole('coordinator')

  const admin = createAdminClient()
  const today = new Date().toISOString().slice(0, 10)

  const { data, error } = await admin
    .from('leaderboard_snapshots')
    .delete()
    .lt('expires_at', today)
    .select('id')

  if (error) return { error: error.message, deletedCount: null }

  revalidatePath('/coordinator/dashboard')
  return { error: null, deletedCount: (data ?? []).length }
}
