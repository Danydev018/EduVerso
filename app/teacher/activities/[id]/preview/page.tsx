import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { parseQuiz } from '@/lib/quiz'
import { getBriefing } from '@/lib/briefing'
import { BriefingView } from '@/components/briefing-view'
import { Button } from '@/components/ui/button'
import { ArrowLeft, FlaskConical, Pencil, BookOpen } from 'lucide-react'
import { PreviewRunner, type PreviewStep } from './_components/preview-runner'

/**
 * Modo prueba: el docente recorre la actividad como la vería el alumno.
 *
 * No escribe nada — ni progreso, ni XP, ni interacciones con el agente — así
 * que probar una actividad no ensucia las estadísticas del salón ni cuenta
 * como que alguien la completó (lo que además bloquearía desasignarla).
 */
export default async function PreviewActivityPage({
  params,
}: {
  params: { id: string }
}) {
  const user = await requireRole('teacher')
  const supabase = createClient()

  const { data: activity } = await supabase
    .from('activities')
    .select(
      'id, title, status, ai_context, classroom_id, topics(name), activity_templates(name, steps)',
    )
    .eq('id', params.id)
    .maybeSingle<{
      id: string
      title: string
      status: string
      ai_context: string | null
      classroom_id: string
      topics: { name: string } | { name: string }[] | null
      activity_templates:
        | { name: string; steps: PreviewStep[] }
        | { name: string; steps: PreviewStep[] }[]
        | null
    }>()

  if (!activity) notFound()

  const { data: classroom } = await supabase
    .from('classrooms')
    .select('id')
    .eq('id', activity.classroom_id)
    .eq('teacher_id', user.id)
    .maybeSingle()

  if (!classroom) notFound()

  const template = Array.isArray(activity.activity_templates)
    ? activity.activity_templates[0]
    : activity.activity_templates
  const topic = Array.isArray(activity.topics) ? activity.topics[0] : activity.topics

  const steps = (Array.isArray(template?.steps) ? template.steps : [])
    .slice()
    .sort((a, b) => a.index - b.index)

  /*
    El quiz sale de `activity_quizzes`, no de `ai_context`.

    Esta pantalla es la vista previa del DOCENTE: tiene que ver las preguntas
    con su respuesta marcada, para revisar lo que armó. `ai_context` guarda el
    texto sin marcas porque esa columna le llega al alumno (migración 14), así
    que parsearlo acá devolvería vacío.
  */
  const { data: clave } = await supabase
    .from('activity_quizzes')
    .select('quiz_text')
    .eq('activity_id', activity.id)
    .maybeSingle<{ quiz_text: string }>()

  const quiz = parseQuiz(clave?.quiz_text ?? activity.ai_context)
  const briefing = await getBriefing(supabase, activity.id)

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <Link
          href={`/teacher/activities/${activity.id}`}
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-1"
        >
          <ArrowLeft className="w-3 h-3" />
          Volver a la actividad
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{activity.title}</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {topic?.name} · {template?.name ?? 'sin plantilla'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/teacher/activities/${activity.id}/repaso`}>
                <BookOpen className="w-4 h-4 mr-1" />
                Repaso
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/teacher/activities/${activity.id}/edit`}>
                <Pencil className="w-4 h-4 mr-1" />
                Editar contenido
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <p className="flex items-start gap-2 rounded-md border border-sky-300 bg-sky-50 px-3 py-2 text-sm text-sky-900">
        <FlaskConical className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          Modo prueba. Puedes responder y saltar entre pasos: nada de esto se
          guarda ni cuenta como avance de nadie. Las respuestas correctas se
          marcan al elegir.
        </span>
      </p>

      <BriefingView blocks={briefing} variant="plain" />

      {steps.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-10 text-center">
          <p className="text-sm text-muted-foreground">
            Esta actividad no tiene pasos configurados en su plantilla.
          </p>
        </div>
      ) : (
        <PreviewRunner steps={steps} quiz={quiz} />
      )}
    </div>
  )
}
