import Link from 'next/link'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getCurrentSchoolYear } from '@/lib/reference-data'
import { getStudentPoints, calculateLevelProgress } from '@/lib/gamification'
import { StudentShell } from '../_components/student-shell'
import { ShipBlueprint } from '../_components/ship-blueprint'
import { getShipProgress, type ProgresoNave } from '@/lib/ship-progress'
import { IntroGate } from '../_components/intro-gate'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Rocket,
  Wrench,
  Sparkles,
  ArrowRight,
  Play,
  CheckCircle2,
  Clock,
  Radar,
  Film,
} from 'lucide-react'

interface ActivityRow {
  id: string
  title: string
  available_until: string | null
}

interface ProgressRow {
  activity_id: string
  current_step: number
  completed_at: string | null
}

type ActivityStatus = 'completed' | 'in_progress' | 'new'

export default async function StudentDashboard() {
  const user = await requireRole('student')
  const supabase = createClient()

  const points = await getStudentPoints(supabase, user.id)
  const progress = calculateLevelProgress(points.totalXp, points.level)

  // --- Actividades disponibles para el resumen del dashboard ---
  const currentYear = await getCurrentSchoolYear()

  let activitiesWithStatus: Array<ActivityRow & { status: ActivityStatus }> = []
  let inProgressActivity: (ActivityRow & { status: ActivityStatus }) | null =
    null
  let planetName: string | null = null
  let shipProgress: ProgresoNave | null = null

  if (currentYear) {
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('classroom_id')
      .eq('student_id', user.id)
      .eq('school_year_id', currentYear.id)
      .eq('status', 'active')
      .maybeSingle()

    if (enrollment) {
      const { data: classroom } = await supabase
        .from('classrooms')
        .select('grade_id')
        .eq('id', enrollment.classroom_id)
        .maybeSingle()

      if (classroom) {
        const { data: grade } = await supabase
          .from('grades')
          .select('name')
          .eq('id', classroom.grade_id)
          .maybeSingle()
        planetName = grade?.name ?? null
      }

      shipProgress = await getShipProgress(supabase, user.id, enrollment.classroom_id)

      const { data: activitiesData } = await supabase
        .from('activities')
        .select('id, title, available_until')
        .eq('classroom_id', enrollment.classroom_id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      const activities = (activitiesData as ActivityRow[] | null) ?? []

      const { data: progressData } = await supabase
        .from('activity_progress')
        .select('activity_id, current_step, completed_at')
        .eq('student_id', user.id)
        .in(
          'activity_id',
          activities.length > 0
            ? activities.map((a) => a.id)
            : ['00000000-0000-0000-0000-000000000000'],
        )

      const progressMap = new Map<string, ProgressRow>()
      for (const p of (progressData as ProgressRow[] | null) ?? []) {
        progressMap.set(p.activity_id, p)
      }

      activitiesWithStatus = activities.map((a) => {
        const p = progressMap.get(a.id)
        const status: ActivityStatus = p?.completed_at
          ? 'completed'
          : p
            ? 'in_progress'
            : 'new'
        return { ...a, status }
      })

      inProgressActivity =
        activitiesWithStatus.find((a) => a.status === 'in_progress') ?? null
    }
  }

  const nextMission =
    inProgressActivity ?? activitiesWithStatus.find((a) => a.status === 'new')
  const previewActivities = activitiesWithStatus.slice(0, 4)

  return (
    <StudentShell
      userName={user.full_name}
      level={progress.level}
      totalXp={progress.totalXp}
    >
      {/* Manda a la cinemática la primera vez que el alumno entra. */}
      <IntroGate />

      <div className="space-y-5">
        {/* ── Cápsula de la nave: planeta actual + reparación ── */}
        <div className="rounded-3xl border-2 border-indigo-100 bg-white/80 backdrop-blur-sm p-6 text-center">
          <p className="text-sm text-indigo-500 font-medium">
            ¡Hola, {user.full_name.split(' ')[0]}! Tu nave está en
          </p>
          <h1 className="font-heading text-3xl font-bold text-indigo-950 mt-0.5">
            {planetName ? `Planeta ${planetName}` : 'un planeta desconocido'}
          </h1>

          {shipProgress && (
            <div className="mt-4">
              <ShipBlueprint progreso={shipProgress} />
            </div>
          )}

          <p className="text-sm text-indigo-500 mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <span className="inline-flex items-center gap-1.5 font-semibold text-indigo-950">
              <Rocket className="w-4 h-4 text-indigo-600" />
              Nivel {progress.level}
            </span>
            {progress.xpToNext > 0 ? (
              <span>
                ·{' '}
                <span className="font-semibold text-orange-600">
                  {progress.xpToNext} de energía estelar
                </span>{' '}
                para el siguiente nivel
              </span>
            ) : (
              <span>· ¡Todos los sistemas al máximo! Eres una leyenda del EduVerso.</span>
            )}
          </p>

          {nextMission && (
            <Button
              asChild
              className="clay-btn mt-5 h-12 px-6 rounded-2xl text-base bg-orange-500 hover:bg-orange-500 text-white"
              style={{ ['--clay-shadow' as string]: '#C2410C' }}
            >
              <Link href={`/student/activities/${nextMission.id}`}>
                <Wrench className="w-4 h-4 mr-1.5" />
                {nextMission.status === 'in_progress'
                  ? 'Continuar misión'
                  : 'Iniciar misión'}
              </Link>
            </Button>
          )}
        </div>

        {/* ── Bitácora reciente ── */}
        <Card className="rounded-2xl border-indigo-100">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="font-heading font-bold text-indigo-950 flex items-center gap-2">
                <Radar className="w-4 h-4 text-indigo-500" />
                Bitácora de misiones
              </p>
              {activitiesWithStatus.length > 0 && (
                <Link
                  href="/student/activities"
                  className="text-sm text-indigo-600 hover:underline flex items-center gap-1"
                >
                  Ver el planeta
                  <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>

            {previewActivities.length === 0 ? (
              <p className="text-sm text-indigo-400 text-center py-6">
                Todavía no hay misiones a la vista. ¡Vuelve pronto, explorador!
              </p>
            ) : (
              <div className="space-y-1">
                {previewActivities.map((a) => (
                  <Link
                    key={a.id}
                    href={`/student/activities/${a.id}`}
                    className="flex items-center justify-between gap-3 py-2.5 px-2 -mx-2 rounded-xl hover:bg-indigo-50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-indigo-950 truncate">
                        {a.title}
                      </p>
                      {a.available_until && (
                        <p className="text-xs text-indigo-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          Hasta{' '}
                          {new Date(a.available_until).toLocaleDateString(
                            'es-AR',
                            { day: 'numeric', month: 'short' },
                          )}
                        </p>
                      )}
                    </div>
                    <StatusBadge status={a.status} />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Volver a ver la historia: la cinemática solo aparece sola la
            primera vez, así que necesita una puerta de entrada permanente. */}
        {/* pb-6 extra: en mobile la barra de navegación es `fixed` y flota
            sobre el final del contenido; sin este colchón el enlace queda
            justo debajo de ella y no se puede tocar. */}
        <div className="text-center pb-6">
          <Link
            href="/student/intro"
            className="text-sm text-indigo-500 hover:text-indigo-700 hover:underline inline-flex items-center gap-1.5"
          >
            <Film className="w-3.5 h-3.5" />
            Volver a ver la historia
          </Link>
        </div>
      </div>
    </StudentShell>
  )
}

function StatusBadge({ status }: { status: ActivityStatus }) {
  if (status === 'completed') {
    return (
      <Badge variant="success" className="whitespace-nowrap flex-shrink-0 rounded-full">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        Reparado
      </Badge>
    )
  }
  if (status === 'in_progress') {
    return (
      <Badge variant="warning" className="whitespace-nowrap flex-shrink-0 rounded-full">
        <Play className="w-3 h-3 mr-1" />
        En curso
      </Badge>
    )
  }
  return (
    <Badge variant="secondary" className="whitespace-nowrap flex-shrink-0 rounded-full">
      <Sparkles className="w-3 h-3 mr-1" />
      Nueva
    </Badge>
  )
}
