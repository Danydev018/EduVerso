import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { StudentShell } from '../../_components/student-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Trophy, CheckCircle2 } from 'lucide-react'
import { startActivity } from '../actions'
import { StepRunner } from './_components/step-runner'

type Step = {
  index: number
  type: 'introduction' | 'quiz' | 'challenge'
  title: string
  description: string
  ai_enabled: boolean
  ai_question_limit: number
  xp_reward: number
  duration_minutes: number
}

export default async function StudentActivityPage({
  params,
}: {
  params: { id: string }
}) {
  const user = await requireRole('student')
  const supabase = createClient()

  const { data: currentYear } = await supabase
    .from('school_years')
    .select('id')
    .eq('is_current', true)
    .maybeSingle()

  if (!currentYear) notFound()

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('classroom_id')
    .eq('student_id', user.id)
    .eq('school_year_id', currentYear.id)
    .eq('status', 'active')
    .maybeSingle()

  if (!enrollment) notFound()

  const { data: activity } = await supabase
    .from('activities')
    .select(
      'id, title, status, classroom_id, available_from, available_until, ai_context, topic_id, template_id',
    )
    .eq('id', params.id)
    .maybeSingle()

  if (!activity || activity.classroom_id !== enrollment.classroom_id) notFound()
  if (activity.status !== 'active') {
    return (
      <StudentShell userName={user.full_name}>
        <BackLink />
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-600">
              Esta actividad no está disponible en este momento.
            </p>
          </CardContent>
        </Card>
      </StudentShell>
    )
  }

  const [{ data: template }, { data: topic }] = await Promise.all([
    supabase
      .from('activity_templates')
      .select('name, steps')
      .eq('id', activity.template_id)
      .maybeSingle(),
    supabase
      .from('topics')
      .select('name')
      .eq('id', activity.topic_id)
      .maybeSingle(),
  ])

  const steps = (template?.steps as Step[] | undefined) ?? []
  if (steps.length === 0) notFound()

  const { data: progress } = await supabase
    .from('activity_progress')
    .select('current_step, xp_earned, completed_at')
    .eq('student_id', user.id)
    .eq('activity_id', activity.id)
    .maybeSingle()

  if (!progress) {
    return (
      <StudentShell userName={user.full_name}>
        <BackLink />
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <p className="text-sm text-blue-600 font-medium">
                {topic?.name ?? 'Tema'} · {template?.name ?? 'Actividad'}
              </p>
              <h2 className="text-2xl font-bold text-gray-900 mt-1">
                {activity.title}
              </h2>
            </div>
            <p className="text-gray-600">
              Esta actividad tiene <strong>{steps.length} pasos</strong>. Cuando
              estés listo, presioná empezar.
            </p>
            <form action={startActivity}>
              <input type="hidden" name="activity_id" value={activity.id} />
              <Button type="submit">Empezar actividad</Button>
            </form>
          </CardContent>
        </Card>
      </StudentShell>
    )
  }

  if (progress.completed_at) {
    return (
      <StudentShell userName={user.full_name}>
        <BackLink />
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              ¡Ya completaste esta actividad!
            </h2>
            <p className="text-gray-600">
              Ganaste <strong>{progress.xp_earned} XP</strong> con{' '}
              <strong>{activity.title}</strong>.
            </p>
            <Button asChild variant="outline">
              <Link href="/student/activities">
                Ver otras actividades
              </Link>
            </Button>
          </CardContent>
        </Card>
      </StudentShell>
    )
  }

  if (progress.current_step >= steps.length) {
    redirect('/student/activities')
  }

  const currentStep = steps[progress.current_step]

  return (
    <StudentShell userName={user.full_name}>
      <BackLink />
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between text-sm">
          <p className="text-blue-600 font-medium">
            {topic?.name ?? 'Tema'} · {template?.name ?? 'Actividad'}
          </p>
          <p className="text-gray-500">
            Paso {progress.current_step + 1} de {steps.length}
          </p>
        </div>

        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all"
            style={{
              width: `${(progress.current_step / steps.length) * 100}%`,
            }}
          />
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                {labelForType(currentStep.type)}
              </p>
              <h2 className="text-2xl font-bold text-gray-900 mt-1">
                {currentStep.title}
              </h2>
            </div>

            <p className="text-gray-700 whitespace-pre-wrap">
              {currentStep.description}
            </p>

            {activity.ai_context && currentStep.ai_enabled && (
              <div className="rounded-md bg-purple-50 border border-purple-100 p-3 text-sm text-purple-900">
                <p className="font-semibold mb-1">Contexto del docente</p>
                <p className="whitespace-pre-wrap">{activity.ai_context}</p>
              </div>
            )}

            <div className="text-xs text-gray-500 flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Vale {currentStep.xp_reward} XP
              {progress.current_step === steps.length - 1 && ' + 25 XP de bonus'}
            </div>
          </CardContent>
        </Card>

        <StepRunner
          activityId={activity.id}
          stepIndex={progress.current_step}
          isLast={progress.current_step === steps.length - 1}
        />
      </div>
    </StudentShell>
  )
}

function labelForType(type: Step['type']): string {
  if (type === 'introduction') return 'Exploración'
  if (type === 'quiz') return 'Quiz'
  return 'Reto'
}

function BackLink() {
  return (
    <div className="mb-4">
      <Link
        href="/student/activities"
        className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-1"
      >
        <ArrowLeft className="w-3 h-3" />
        Volver a actividades
      </Link>
    </div>
  )
}
