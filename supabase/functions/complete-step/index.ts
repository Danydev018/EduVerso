import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type Step = {
  index: number
  type: 'introduction' | 'quiz' | 'challenge'
  xp_reward: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { activity_id, step_index } = await req.json()

    if (!activity_id || typeof step_index !== 'number') {
      return fail(400, 'activity_id y step_index son requeridos')
    }

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } },
    )
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) return fail(401, 'No autorizado')

    const { data: profile } = await userClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'student') {
      return fail(403, 'Solo estudiantes pueden completar pasos')
    }

    const { data: activity } = await userClient
      .from('activities')
      .select(
        'id, classroom_id, status, available_from, available_until, activity_templates(steps), classrooms(school_year_id)',
      )
      .eq('id', activity_id)
      .single()

    if (!activity || activity.status !== 'active') {
      return fail(404, 'Actividad no disponible')
    }

    const now = new Date()
    if (activity.available_from && new Date(activity.available_from) > now) {
      return fail(400, 'La actividad aún no está disponible')
    }
    if (activity.available_until && new Date(activity.available_until) < now) {
      return fail(400, 'La actividad ha vencido')
    }

    const { data: progress } = await userClient
      .from('activity_progress')
      .select('current_step, completed_at')
      .eq('student_id', user.id)
      .eq('activity_id', activity_id)
      .single()

    if (!progress) return fail(404, 'Inicia la actividad antes de completar un paso')
    if (progress.completed_at) return fail(400, 'Esta actividad ya fue completada')
    if (step_index !== progress.current_step) {
      return fail(400, 'Paso inválido — no puedes saltar pasos')
    }

    const steps = (activity.activity_templates as { steps: Step[] }).steps
    const step = steps[step_index]
    if (!step) return fail(400, 'Este paso no existe en la plantilla')

    const is_last_step = step_index === steps.length - 1
    const xp_total = step.xp_reward + (is_last_step ? 25 : 0)

    const { data: result, error: rpcError } = await adminClient.rpc('award_xp', {
      p_student_id: user.id,
      p_school_year_id: (activity.classrooms as { school_year_id: string }).school_year_id,
      p_classroom_id: activity.classroom_id,
      p_activity_id: activity_id,
      p_step_index: step_index,
      p_xp_amount: xp_total,
      p_is_complete: is_last_step,
    })

    if (rpcError) throw rpcError

    return ok({ xp_earned: xp_total, is_complete: is_last_step, ...result })
  } catch (err) {
    return fail(500, (err as Error).message)
  }
})

const ok = (data: unknown) =>
  new Response(JSON.stringify({ success: true, ...(data as object) }), {
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })

const fail = (status: number, error: string) =>
  new Response(JSON.stringify({ success: false, error }), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
