import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getCurrentSchoolYear } from '@/lib/reference-data'
import { getStudentPoints } from '@/lib/gamification'
import { getBriefing } from '@/lib/briefing'
import { BriefingView } from '@/components/briefing-view'
import { LessonLink } from '../../_components/lesson-link'
import { cn } from '@/lib/utils'
import { StudentShell } from '../../_components/student-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  Trophy,
  Zap,
  Radar,
  ClipboardCheck,
  Wrench,
  MapPin,
} from 'lucide-react'
import { startActivity } from '../actions'
import { StepRunner } from './_components/step-runner'
import { AgentBubble } from './_components/agent-bubble'

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

const STEP_META = {
  introduction: {
    label: 'Escaneo de la zona',
    blurb: 'Observa con calma: aquí reúnes las pistas que necesitas para la misión.',
    Icon: Radar,
  },
  quiz: {
    label: 'Prueba de sistemas',
    blurb: 'Responde para comprobar que aprendiste a operar estos sistemas.',
    Icon: ClipboardCheck,
  },
  challenge: {
    label: 'Reparación final',
    blurb: 'Aplica lo aprendido sin ayuda extra: la nave necesita esta pieza.',
    Icon: Wrench,
  },
} as const

export default async function StudentActivityPage({
  params,
}: {
  params: { id: string }
}) {
  const user = await requireRole('student')
  const supabase = createClient()

  const points = await getStudentPoints(supabase, user.id)

  const currentYear = await getCurrentSchoolYear()

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
      <StudentShell userName={user.full_name} level={points.level} totalXp={points.totalXp}>
        <BackLink />
        <Card className="rounded-2xl border-indigo-100">
          <CardContent className="py-8 text-center">
            <p className="text-indigo-500">
              Esta misión no está disponible en este momento.
            </p>
          </CardContent>
        </Card>
      </StudentShell>
    )
  }

  const [{ data: topic }, { data: template }] = await Promise.all([
    supabase.from('topics').select('name').eq('id', activity.topic_id).maybeSingle(),
    supabase
      .from('activity_templates')
      .select('name, steps')
      .eq('id', activity.template_id)
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

  const briefing = await getBriefing(supabase, activity.id)

  // ¿El tema tiene lección ilustrada? Solo se pide el título: la lección
  // completa se carga recién si el alumno la abre.
  const { data: leccion } = await supabase
    .from('topic_lessons')
    .select('topic_id, title')
    .eq('topic_id', activity.topic_id)
    .maybeSingle<{ topic_id: string; title: string }>()

  if (!progress) {
    return (
      <StudentShell userName={user.full_name} level={points.level} totalXp={points.totalXp}>
        <BackLink />
        <div className="max-w-2xl mx-auto space-y-4">
        {/* El repaso va antes del botón de iniciar: es lo que le da contexto
            para entender de qué trata la misión antes de meterse. */}
        <LessonLink
          leccion={leccion}
          volverA={`/student/activities/${activity.id}`}
        />
        <BriefingView blocks={briefing} />
        <Card className="rounded-2xl border-indigo-100">
          <CardContent className="p-6 space-y-4">
            <div>
              <p className="text-sm text-indigo-500 font-medium flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                Estación: {topic?.name ?? 'desconocida'}
              </p>
              <h2 className="font-heading text-2xl font-bold text-indigo-950 mt-1">
                {activity.title}
              </h2>
            </div>
            <p className="text-indigo-600">
              Esta misión tiene <strong>{steps.length} etapas</strong>. Cuando
              estés listo para explorar, presiona el botón.
            </p>
            <form action={startActivity}>
              <input type="hidden" name="activity_id" value={activity.id} />
              <Button
                type="submit"
                className="clay-btn h-12 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-600 text-white"
                style={{ ['--clay-shadow' as string]: '#3730A3' }}
              >
                <Wrench className="w-4 h-4 mr-1.5" />
                Iniciar misión
              </Button>
            </form>
          </CardContent>
        </Card>
        </div>
      </StudentShell>
    )
  }

  if (progress.completed_at) {
    const stepsXp = steps.reduce((sum, s) => sum + s.xp_reward, 0)
    const completionBonus = Math.max(0, progress.xp_earned - stepsXp)

    return (
      <StudentShell userName={user.full_name} level={points.level} totalXp={points.totalXp}>
        <BackLink />
        <Card className="rounded-2xl border-indigo-100 max-w-2xl mx-auto">
          <CardContent className="p-8 text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-indigo-950">
              ¡Misión completada!
            </h2>
            <p className="text-indigo-600">
              Recolectaste{' '}
              <strong className="text-orange-600">
                {progress.xp_earned} de energía estelar
              </strong>{' '}
              con <strong>{activity.title}</strong>.
            </p>
            {completionBonus > 0 && (
              <p className="text-sm text-amber-600">
                Incluye {completionBonus} de bono por completar la misión entera.
              </p>
            )}
            <Button
              asChild
              variant="outline"
              className="h-11 rounded-2xl border-indigo-200 text-indigo-700"
            >
              <Link href="/student/activities">Volver al planeta</Link>
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

  /*
    EL QUIZ LO DA LA BASE, NO EL CAMPO `ai_context`.

    Antes se parseaba `ai_context` acá y se le pasaba al cliente con el índice
    de la respuesta correcta. Eso significaba dos cosas: que la respuesta
    viajaba al navegador, y que el alumno podía pedir ese campo por la API y
    leerla antes de contestar (ver migración 14).

    `quiz_para_alumno` devuelve pregunta y opciones, sin la correcta. La
    corrección la hace `responder_quiz` en el servidor cuando el alumno
    contesta, y de ahí sale la métrica de acierto y el XP.

    `ai_context` sigue existiendo —le sirve de contexto al tutor— pero ya no
    lleva marcas, así que `parseQuiz` sobre él no devolvería nada.
  */
  const { data: quizCrudo } = await supabase.rpc('quiz_para_alumno', {
    p_activity_id: activity.id,
  })

  type PreguntaSinRespuesta = { pregunta: string; opciones: string[] }
  const preguntas = (Array.isArray(quizCrudo) ? quizCrudo : []) as PreguntaSinRespuesta[]

  const parsedQuiz = preguntas.length > 0 ? preguntas : null
  const quiz = currentStep.type === 'quiz' ? parsedQuiz : null
  const meta = STEP_META[currentStep.type]

  return (
    <StudentShell userName={user.full_name} level={points.level} totalXp={points.totalXp}>
      <BackLink />
      <div
        className={cn(
          'max-w-2xl mx-auto space-y-4',
          // Deja espacio para que el ícono flotante de Profe Bot (fixed,
          // abajo-derecha) nunca tape el botón de acción del paso en mobile.
          currentStep.ai_enabled && 'pb-20',
        )}
      >
        <div className="flex items-center justify-between text-sm">
          <p className="text-indigo-500 font-medium flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            Estación: {topic?.name ?? 'desconocida'}
          </p>
          <p className="text-indigo-400">
            Etapa {progress.current_step + 1} de {steps.length}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-2 flex-1 rounded-full transition-colors',
                i < progress.current_step && 'bg-emerald-400',
                i === progress.current_step && 'bg-indigo-500',
                i > progress.current_step && 'bg-indigo-100',
              )}
            />
          ))}
        </div>

        {/* El repaso va antes del paso: es justamente el contexto que faltaba
            al entrar. Queda visible en todas las etapas para poder volver a
            consultarlo, no solo en la primera. */}
        <LessonLink
          leccion={leccion}
          volverA={`/student/activities/${activity.id}`}
        />
        <BriefingView blocks={briefing} />

        <Card className="rounded-2xl border-indigo-100">
          <CardContent className="p-6 space-y-4">
            <div>
              <p className="text-sm font-semibold text-indigo-500 flex items-center gap-1.5">
                <meta.Icon className="w-4 h-4" />
                {meta.label}
              </p>
              <p className="text-xs text-indigo-400 mt-0.5">{meta.blurb}</p>
              <h2 className="font-heading text-2xl font-bold text-indigo-950 mt-2">
                {currentStep.title}
              </h2>
            </div>

            <p className="text-indigo-900/80 whitespace-pre-wrap">
              {currentStep.description}
            </p>

            {/* No mostrar si ai_context tiene formato de quiz (en NINGÚN
                paso, no solo en el paso tipo "quiz"): ese texto trae las
                respuestas correctas marcadas con "*" (ver lib/quiz.ts), y
                ai_context es un campo de la actividad completa, no de un
                paso — mostrarlo crudo en otro paso (ej. la introducción)
                se las regalaría igual al alumno en texto plano. */}
            {activity.ai_context && currentStep.ai_enabled && !parsedQuiz && (
              <div className="rounded-xl bg-violet-50 border border-violet-100 p-3 text-sm text-violet-900">
                <p className="font-semibold mb-1">Pista de la base</p>
                <p className="whitespace-pre-wrap">{activity.ai_context}</p>
              </div>
            )}

            <div className="text-xs text-orange-600 font-medium flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" fill="currentColor" />
              Vale {currentStep.xp_reward} de energía estelar
              {progress.current_step === steps.length - 1 &&
                ' + 25 de bono por terminar la misión'}
            </div>
          </CardContent>
        </Card>

        <StepRunner
          activityId={activity.id}
          stepIndex={progress.current_step}
          isLast={progress.current_step === steps.length - 1}
          quiz={quiz}
          previousLevel={points.level}
        />
      </div>

      {currentStep.ai_enabled && (
        <AgentBubble
          studentId={user.id}
          activityId={activity.id}
          stepIndex={progress.current_step}
          questionLimit={currentStep.ai_question_limit}
        />
      )}
    </StudentShell>
  )
}

function BackLink() {
  return (
    <div className="mb-4">
      <Link
        href="/student/activities"
        className="text-sm text-indigo-500 hover:text-indigo-700 inline-flex items-center gap-1"
      >
        <ArrowLeft className="w-3 h-3" />
        Volver al planeta
      </Link>
    </div>
  )
}
