import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getGrades } from '@/lib/reference-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CalendarDays, Sparkles, FlaskConical, Pencil, BookOpen } from 'lucide-react'
import { shipPartIcon } from '@/lib/ship-parts'
import { ToggleActivityStatusButton } from './_components/toggle-status-button'

interface StudentRow {
  student_id: string
  full_name: string
  current_step: number
  xp_earned: number
  completed_at: string | null
  started_at: string | null
}

export default async function TeacherActivityDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const user = await requireRole('teacher')
  const supabase = createClient()

  const { data: activity } = await supabase
    .from('activities')
    .select(
      'id, title, status, ai_context, available_from, available_until, classroom_id, topic_id, template_id, ship_parts(name, description, icon, color)',
    )
    .eq('id', params.id)
    .maybeSingle()

  if (!activity) notFound()

  const { data: classroom } = await supabase
    .from('classrooms')
    .select('id, teacher_id, grade_id, section')
    .eq('id', activity.classroom_id)
    .maybeSingle()

  if (!classroom || classroom.teacher_id !== user.id) notFound()

  const [
    { data: template },
    { data: topic },
    { data: grade },
    { data: enrollments },
  ] = await Promise.all([
    supabase
      .from('activity_templates')
      .select('name, description, steps')
      .eq('id', activity.template_id)
      .maybeSingle(),
    supabase
      .from('topics')
      .select('name')
      .eq('id', activity.topic_id)
      .maybeSingle(),
    getGrades().then((gs) => ({ data: gs.find((g) => g.id === classroom.grade_id) ?? null })),
    supabase
      .from('enrollments')
      .select('student_id')
      .eq('classroom_id', classroom.id)
      .eq('status', 'active'),
  ])

  const steps = (template?.steps as { title: string; xp_reward: number }[] | undefined) ?? []
  const totalSteps = steps.length
  const studentIds = (enrollments ?? []).map((e) => e.student_id)

  let students: StudentRow[] = []

  if (studentIds.length > 0) {
    const [{ data: profiles }, { data: progress }] = await Promise.all([
      supabase.from('profiles').select('id, full_name').in('id', studentIds),
      supabase
        .from('activity_progress')
        .select('student_id, current_step, xp_earned, completed_at, started_at')
        .eq('activity_id', activity.id)
        .in('student_id', studentIds),
    ])

    const profileMap = new Map<string, string>()
    for (const p of profiles ?? []) profileMap.set(p.id, p.full_name)

    const progressMap = new Map<
      string,
      Omit<StudentRow, 'student_id' | 'full_name'>
    >()
    for (const p of progress ?? []) {
      progressMap.set(p.student_id, {
        current_step: p.current_step ?? 0,
        xp_earned: p.xp_earned ?? 0,
        completed_at: p.completed_at,
        started_at: p.started_at,
      })
    }

    students = studentIds.map((id) => ({
      student_id: id,
      full_name: profileMap.get(id) ?? '—',
      current_step: progressMap.get(id)?.current_step ?? 0,
      xp_earned: progressMap.get(id)?.xp_earned ?? 0,
      completed_at: progressMap.get(id)?.completed_at ?? null,
      started_at: progressMap.get(id)?.started_at ?? null,
    }))
  }

  const completados = students.filter((s) => s.completed_at).length
  const enProgreso = students.filter(
    (s) => s.started_at && !s.completed_at,
  ).length
  const porcentaje =
    students.length > 0
      ? Math.round((completados / students.length) * 100)
      : 0

  // Supabase devuelve la relación embebida como objeto o arreglo según la
  // forma de la FK; se normaliza para que el JSX no tenga que saberlo.
  const shipPart = (Array.isArray(activity.ship_parts)
    ? activity.ship_parts[0]
    : activity.ship_parts) as
    | { name: string; description: string; icon: string; color: string }
    | undefined
  const ShipPartIcon = shipPartIcon(shipPart?.icon)

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/teacher/activities"
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-3 h-3" />
          Volver a actividades
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{activity.title}</h1>
          {shipPart && (
            <p className="text-sm text-muted-foreground mt-1.5 flex items-center gap-1.5">
              <ShipPartIcon className={`w-4 h-4 shrink-0 ${shipPart.color}`} />
              Repara <span className="text-foreground font-medium">{shipPart.name}</span>
              <span className="hidden sm:inline">— {shipPart.description}</span>
            </p>
          )}
          <div className="text-sm text-muted-foreground mt-2 flex flex-wrap items-center gap-3">
            <Badge
              variant={
                activity.status === 'active'
                  ? 'success'
                  : activity.status === 'completed'
                    ? 'secondary'
                    : 'warning'
              }
            >
              {activity.status === 'active'
                ? 'Activa'
                : activity.status === 'completed'
                  ? 'Cerrada'
                  : 'Borrador'}
            </Badge>
            <span>
              {grade?.name ? `${grade.name} — Sección ${classroom.section}` : `Sección ${classroom.section}`}
            </span>
            <span className="text-muted-foreground">·</span>
            <span>{topic?.name ?? 'Tópico'}</span>
            <span className="text-muted-foreground">·</span>
            <span>{template?.name ?? 'Plantilla'}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href={`/teacher/activities/${activity.id}/repaso`}>
              <BookOpen className="w-4 h-4 mr-1" />
              Repaso
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/teacher/activities/${activity.id}/preview`}>
              <FlaskConical className="w-4 h-4 mr-1" />
              Probarla
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/teacher/activities/${activity.id}/edit`}>
              <Pencil className="w-4 h-4 mr-1" />
              Editar
            </Link>
          </Button>
          <ToggleActivityStatusButton
            activityId={activity.id}
            currentStatus={activity.status}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completitud
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{porcentaje}%</p>
            <p className="text-xs text-muted-foreground">
              {completados} de {students.length} terminaron
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En progreso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{enProgreso}</p>
            <p className="text-xs text-muted-foreground">comenzaron y no terminan</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CalendarDays className="w-3.5 h-3.5" />
              Disponibilidad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium text-foreground">
              {formatAvailability(
                activity.available_from,
                activity.available_until,
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {activity.ai_context && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              Contexto para Profe Bot
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {activity.ai_context}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Progreso por alumno</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {students.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No hay alumnos matriculados en este salón.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted border-y border-border">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Nombre
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Estado
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
                      Paso actual
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      XP
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {students.map((s) => {
                    const status = s.completed_at
                      ? 'completada'
                      : s.started_at
                        ? 'en progreso'
                        : 'sin iniciar'
                    return (
                      <tr key={s.student_id} className="hover:bg-muted/50">
                        <td className="px-4 py-3 font-medium text-foreground">
                          {s.full_name}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              status === 'completada'
                                ? 'success'
                                : status === 'en progreso'
                                  ? 'warning'
                                  : 'secondary'
                            }
                          >
                            {status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {totalSteps > 0
                            ? `${Math.min(s.current_step, totalSteps)} / ${totalSteps}`
                            : `${s.current_step}`}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          <span className="font-semibold">{s.xp_earned}</span>{' '}
                          XP
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function formatAvailability(from: string | null, until: string | null): string {
  if (!from && !until) return 'Siempre disponible'
  const f = from ? new Date(from).toLocaleString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'sin inicio'
  const u = until ? new Date(until).toLocaleString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'sin fin'
  return `${f} → ${u}`
}
