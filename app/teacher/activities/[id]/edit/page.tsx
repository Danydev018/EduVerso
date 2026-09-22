import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getShipParts } from '@/lib/reference-data'
import { splitQuizAndNotes } from '@/lib/quiz'
import { ArrowLeft } from 'lucide-react'
import { ActivityEditor } from './_components/activity-editor'

/** `datetime-local` necesita "YYYY-MM-DDTHH:mm" en hora local, no ISO/UTC. */
function paraInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

export default async function EditActivityPage({
  params,
}: {
  params: { id: string }
}) {
  const user = await requireRole('teacher')
  const supabase = createClient()

  const { data: activity } = await supabase
    .from('activities')
    .select(
      'id, title, ai_context, ship_part_id, available_from, available_until, classroom_id, topic_id, topics(name)',
    )
    .eq('id', params.id)
    .maybeSingle<{
      id: string
      title: string
      ai_context: string | null
      ship_part_id: string | null
      available_from: string | null
      available_until: string | null
      classroom_id: string
      topic_id: string
      topics: { name: string } | { name: string }[] | null
    }>()

  if (!activity) notFound()

  // La RLS de SELECT deja al docente ver actividades de su escuela, no solo
  // de su salón. Editar sí es exclusivo del dueño, así que se verifica acá
  // en vez de descubrirlo al guardar.
  const { data: classroom } = await supabase
    .from('classrooms')
    .select('id')
    .eq('id', activity.classroom_id)
    .eq('teacher_id', user.id)
    .maybeSingle()

  if (!classroom) notFound()

  const shipParts = await getShipParts()

  /*
    El quiz se lee de `activity_quizzes`, NO de `ai_context`.

    `ai_context` guarda el texto sin los asteriscos, porque esa columna le
    llega al alumno junto con su actividad (ver migración 14). Si el editor
    partiera de ahí, el docente abriría la actividad y vería sus preguntas sin
    ninguna respuesta marcada, y al guardar perdería la clave entera.

    La política de `activity_quizzes` ya restringe a coordinación y al docente
    dueño del salón, y arriba se verificó que este salón es suyo.
  */
  const { data: clave } = await supabase
    .from('activity_quizzes')
    .select('quiz_text')
    .eq('activity_id', activity.id)
    .maybeSingle<{ quiz_text: string }>()

  const { questions, notes } = splitQuizAndNotes(clave?.quiz_text ?? activity.ai_context)

  const topic = Array.isArray(activity.topics) ? activity.topics[0] : activity.topics

  return (
    <div className="space-y-5">
      <div>
        <Link
          href={`/teacher/activities/${activity.id}`}
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-1"
        >
          <ArrowLeft className="w-3 h-3" />
          Volver a la actividad
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Editar actividad</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Ajusta las preguntas a lo que estás enseñando. Los cambios solo
          afectan a tu salón.
        </p>
      </div>

      <ActivityEditor
        activityId={activity.id}
        topicId={activity.topic_id}
        topicName={topic?.name ?? 'este tema'}
        initialTitle={activity.title}
        initialQuestions={questions}
        initialNotes={notes}
        initialShipPart={activity.ship_part_id}
        initialFrom={paraInput(activity.available_from)}
        initialUntil={paraInput(activity.available_until)}
        shipParts={shipParts}
      />
    </div>
  )
}
