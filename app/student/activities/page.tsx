import Link from 'next/link'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getCurrentSchoolYear, getGrades } from '@/lib/reference-data'
import { getStudentPoints } from '@/lib/gamification'
import { getSubjectTheme } from '@/lib/subject-theme'
import { StudentShell } from '../_components/student-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Play,
  CheckCircle2,
  Clock,
  ArrowRight,
  MapPin,
  Telescope,
} from 'lucide-react'

interface ActivityRow {
  id: string
  title: string
  available_from: string | null
  available_until: string | null
  topic_id: string
}

interface ProgressRow {
  activity_id: string
  current_step: number
  completed_at: string | null
}

type Status = 'completed' | 'in_progress' | 'new'

interface Mission extends ActivityRow {
  status: Status
}

interface Outpost {
  id: string
  name: string
  order_index: number
  missions: Mission[]
}

interface Zone {
  id: string
  name: string
  outposts: Outpost[]
}

export default async function StudentActivitiesPage() {
  const user = await requireRole('student')
  const supabase = createClient()

  const points = await getStudentPoints(supabase, user.id)

  const currentYear = await getCurrentSchoolYear()

  if (!currentYear) {
    return (
      <StudentShell userName={user.full_name} level={points.level} totalXp={points.totalXp}>
        <EmptyState message="Todavía no hay un año escolar activo." />
      </StudentShell>
    )
  }

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('classroom_id')
    .eq('student_id', user.id)
    .eq('school_year_id', currentYear.id)
    .eq('status', 'active')
    .maybeSingle()

  if (!enrollment) {
    return (
      <StudentShell userName={user.full_name} level={points.level} totalXp={points.totalXp}>
        <EmptyState message="Todavía no tienes un salón asignado." />
      </StudentShell>
    )
  }

  const { data: classroom } = await supabase
    .from('classrooms')
    .select('grade_id')
    .eq('id', enrollment.classroom_id)
    .maybeSingle()

  const { data: grade } = classroom
    ? await getGrades().then((gs) => ({ data: gs.find((g) => g.id === classroom.grade_id) ?? null }))
    : { data: null }

  const { data: activitiesData } = await supabase
    .from('activities')
    .select('id, title, available_from, available_until, topic_id')
    .eq('classroom_id', enrollment.classroom_id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  const activities = (activitiesData as ActivityRow[] | null) ?? []

  // Las zonas del mapa se arman a partir de los temas que las misiones de
  // este salón realmente usan (no de subjects.grade_id === classroom.grade_id):
  // así el mapa refleja la realidad aunque una actividad venga de un tema de
  // otro grado (contenido de refuerzo, o datos de prueba inconsistentes).
  const topicIds = Array.from(new Set(activities.map((a) => a.topic_id)))

  const { data: topicsData } = topicIds.length
    ? await supabase
        .from('topics')
        .select('id, name, order_index, subject_id')
        .in('id', topicIds)
        .order('order_index')
    : { data: null }

  const topics = topicsData ?? []
  const subjectIds = Array.from(new Set(topics.map((t) => t.subject_id)))

  const { data: subjectsData } = subjectIds.length
    ? await supabase.from('subjects').select('id, name').in('id', subjectIds).order('name')
    : { data: null }

  const subjects = subjectsData ?? []

  const { data: progressData } = await supabase
    .from('activity_progress')
    .select('activity_id, current_step, completed_at')
    .eq('student_id', user.id)
    .in(
      'activity_id',
      activities.length > 0 ? activities.map((a) => a.id) : ['00000000-0000-0000-0000-000000000000'],
    )

  const progressMap = new Map<string, ProgressRow>()
  for (const p of (progressData as ProgressRow[] | null) ?? []) {
    progressMap.set(p.activity_id, p)
  }

  const missions: Mission[] = activities.map((a) => {
    const p = progressMap.get(a.id)
    const status: Status = p?.completed_at ? 'completed' : p ? 'in_progress' : 'new'
    return { ...a, status }
  })

  const zones: Zone[] = subjects.map((subject) => ({
    id: subject.id,
    name: subject.name,
    outposts: topics
      .filter((t) => t.subject_id === subject.id)
      .map((t) => ({
        id: t.id,
        name: t.name,
        order_index: t.order_index,
        missions: missions.filter((m) => m.topic_id === t.id),
      })),
  }))

  return (
    <StudentShell userName={user.full_name} level={points.level} totalXp={points.totalXp}>
      <div className="space-y-1 text-center mb-6">
        <p className="text-sm text-indigo-500 font-medium flex items-center justify-center gap-1.5">
          <MapPin className="w-4 h-4" />
          Estás explorando
        </p>
        <h1 className="font-heading text-2xl font-bold text-indigo-950">
          {grade ? `Planeta ${grade.name}` : 'un planeta desconocido'}
        </h1>
      </div>

      {zones.length === 0 ? (
        <EmptyState message="Todavía no hay zonas mapeadas en este planeta. ¡Vuelve pronto!" />
      ) : (
        <div className="space-y-10">
          {zones.map((zone) => (
            <ZoneSection key={zone.id} zone={zone} />
          ))}
        </div>
      )}
    </StudentShell>
  )
}

function ZoneSection({ zone }: { zone: Zone }) {
  const theme = getSubjectTheme(zone.name)
  const { Icon } = theme

  return (
    <section id={`zona-${zone.id}`}>
      <div className="flex items-center gap-2.5 mb-5">
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', theme.bg)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-heading font-bold text-indigo-950 leading-tight">{zone.name}</p>
          <p className="text-xs text-indigo-400">{theme.label}</p>
        </div>
      </div>

      {zone.outposts.length === 0 ? (
        <p className="text-sm text-indigo-400 pl-1">
          Todavía no hay estaciones descubiertas en esta zona.
        </p>
      ) : (
        <ol className="relative space-y-6 pl-1">
          {/* Sendero de la ruta */}
          <div
            className="absolute left-[19px] top-3 bottom-3 w-0.5 border-l-2 border-dashed border-indigo-200"
            aria-hidden="true"
          />
          {zone.outposts.map((outpost, i) => (
            <OutpostNode key={outpost.id} outpost={outpost} theme={theme} index={i} />
          ))}
        </ol>
      )}
    </section>
  )
}

function OutpostNode({
  outpost,
  theme,
  index,
}: {
  outpost: Outpost
  theme: ReturnType<typeof getSubjectTheme>
  index: number
}) {
  const hasActive = outpost.missions.some((m) => m.status !== 'completed')
  const allDone = outpost.missions.length > 0 && !hasActive

  return (
    <li className="relative pl-11">
      <div
        className={cn(
          'absolute left-0 top-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-heading font-bold text-sm ring-4 ring-white',
          allDone ? 'bg-emerald-500' : theme.bg,
          hasActive && outpost.missions.some((m) => m.status === 'in_progress') && 'mission-pulse',
        )}
      >
        {allDone ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
      </div>

      <div className="pt-1">
        <p className="text-sm font-semibold text-indigo-950 mb-2">{outpost.name}</p>

        {outpost.missions.length === 0 ? (
          <p className="text-xs text-indigo-400">Aún no hay misiones en esta estación.</p>
        ) : (
          <div className="space-y-2">
            {outpost.missions.map((m) => (
              <MissionCard key={m.id} mission={m} />
            ))}
          </div>
        )}
      </div>
    </li>
  )
}

function MissionCard({ mission }: { mission: Mission }) {
  return (
    <Card className="rounded-2xl border-indigo-100 hover:border-indigo-300 transition-colors">
      <CardContent className="p-4 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-indigo-950 truncate">{mission.title}</p>
          {mission.available_until && (
            <p className="text-xs text-indigo-400 flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3" />
              Hasta{' '}
              {new Date(mission.available_until).toLocaleDateString('es-AR', {
                day: 'numeric',
                month: 'short',
              })}
            </p>
          )}
        </div>
        {mission.status === 'completed' ? (
          <Button asChild variant="outline" size="sm" className="rounded-full flex-shrink-0">
            <Link href={`/student/activities/${mission.id}`}>
              Revisar
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </Button>
        ) : (
          <Button
            asChild
            size="sm"
            className="clay-btn rounded-full flex-shrink-0 bg-indigo-600 hover:bg-indigo-600 text-white"
            style={{ ['--clay-shadow' as string]: '#3730A3' }}
          >
            <Link href={`/student/activities/${mission.id}`}>
              <Play className="w-3.5 h-3.5 mr-1" />
              {mission.status === 'in_progress' ? 'Continuar' : 'Empezar'}
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card className="rounded-2xl border-indigo-100">
      <CardContent className="py-12 text-center">
        <Telescope className="w-12 h-12 text-indigo-300 mx-auto mb-4" />
        <p className="text-indigo-500">{message}</p>
      </CardContent>
    </Card>
  )
}
