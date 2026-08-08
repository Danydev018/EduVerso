'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export async function startActivity(formData: FormData): Promise<void> {
  const user = await requireRole('student')
  const supabase = createClient()

  const activity_id = formData.get('activity_id') as string
  if (!activity_id) throw new Error('Falta el ID de la actividad.')

  const { data: existing } = await supabase
    .from('activity_progress')
    .select('id')
    .eq('student_id', user.id)
    .eq('activity_id', activity_id)
    .maybeSingle()

  if (!existing) {
    const { error } = await supabase.from('activity_progress').insert({
      student_id: user.id,
      activity_id,
      current_step: 0,
      xp_earned: 0,
    })
    if (error) throw new Error(error.message)
  }

  revalidatePath(`/student/activities/${activity_id}`)
  redirect(`/student/activities/${activity_id}`)
}
