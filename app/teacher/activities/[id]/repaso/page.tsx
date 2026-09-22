import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getBriefing } from '@/lib/briefing'
import { Button } from '@/components/ui/button'
import { ArrowLeft, FlaskConical } from 'lucide-react'
import { BriefingEditor } from './_components/briefing-editor'

export default async function BriefingPage({
  params,
}: {
  params: { id: string }
}) {
  const user = await requireRole('teacher')
  const supabase = createClient()

  const { data: activity } = await supabase
    .from('activities')
    .select('id, title, classroom_id, topics(name)')
    .eq('id', params.id)
    .maybeSingle<{
      id: string
      title: string
      classroom_id: string
      topics: { name: string } | { name: string }[] | null
    }>()

  if (!activity) notFound()

  const { data: classroom } = await supabase
    .from('classrooms')
    .select('id')
    .eq('id', activity.classroom_id)
    .eq('teacher_id', user.id)
    .maybeSingle()

  if (!classroom) notFound()

  const blocks = await getBriefing(supabase, activity.id)
  const topic = Array.isArray(activity.topics) ? activity.topics[0] : activity.topics

  return (
    <div className="space-y-5 max-w-3xl">
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
            <h1 className="text-2xl font-bold text-foreground">Antes de empezar</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Lo que el alumno ve al abrir <span className="text-foreground">{activity.title}</span>
              {topic ? `, sobre ${topic.name}` : ''}. Ponlo en contexto antes de
              la primera pregunta.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href={`/teacher/activities/${activity.id}/preview`}>
              <FlaskConical className="w-4 h-4 mr-1" />
              Probarla
            </Link>
          </Button>
        </div>
      </div>

      <BriefingEditor activityId={activity.id} blocks={blocks} />
    </div>
  )
}
