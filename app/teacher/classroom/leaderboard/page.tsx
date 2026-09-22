import Link from 'next/link'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getCurrentSchoolYear, getGrades } from '@/lib/reference-data'
import { getClassroomLeaderboard } from '@/lib/leaderboard'
import { Card, CardContent } from '@/components/ui/card'
import { Star, Zap, ArrowLeft, AlertCircle, BookOpen, Trophy } from 'lucide-react'

export default async function TeacherClassroomLeaderboardPage() {
  const user = await requireRole('teacher')
  const supabase = createClient()

  const currentYear = await getCurrentSchoolYear()

  if (!currentYear) {
    return (
      <EmptyState
        icon={AlertCircle}
        message="No hay un año escolar activo configurado."
      />
    )
  }

  const { data: classroom } = await supabase
    .from('classrooms')
    .select('id, section, grade_id')
    .eq('teacher_id', user.id)
    .eq('school_year_id', currentYear.id)
    // Un docente puede tener más de un salón (ej. 3ro A y 3ro B).
    // Sin ordenar y acotar, maybeSingle() devuelve error PGRST116 y el
    // panel le dice "no tienes salón asignado" aunque tenga varios.
    .order('grade_id')
    .order('section')
    .limit(1)
    .maybeSingle()

  if (!classroom) {
    return (
      <EmptyState
        icon={BookOpen}
        message="No tienes un salón asignado para el año escolar activo."
      />
    )
  }

  // El nombre del grado y el leaderboard no dependen entre sí: se piden
  // juntos en vez de encadenar dos viajes de red.
  const [{ data: grade }, entries] = await Promise.all([
    getGrades().then((gs) => ({ data: gs.find((g) => g.id === classroom.grade_id) ?? null })),
    getClassroomLeaderboard(supabase, classroom.id, currentYear.id, ''),
  ])

  const gradeName = grade?.name ?? ''
  const classroomName = gradeName
    ? `${gradeName} — Sección ${classroom.section}`
    : `Sección ${classroom.section}`

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/teacher/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-3 h-3" />
          Volver al dashboard
        </Link>
        <h1 className="text-2xl font-bold text-foreground mt-2">
          Leaderboard — {classroomName}
        </h1>
        <p className="text-muted-foreground mt-1">{currentYear.name}</p>
      </div>

      {entries.length === 0 ? (
        <EmptyState
          icon={Trophy}
          message="Todavía no hay XP registrado en el salón."
        />
      ) : (
        <div className="bg-card rounded-lg border border-border divide-y divide-border">
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-center gap-3 px-4 py-3">
              <span
                className={
                  'w-6 text-center text-sm font-semibold flex-shrink-0 ' +
                  (entry.position === 1
                    ? 'text-yellow-500'
                    : entry.position === 2
                      ? 'text-muted-foreground'
                      : entry.position === 3
                        ? 'text-amber-700'
                        : 'text-muted-foreground')
                }
              >
                {entry.position}
              </span>
              <p className="flex-1 min-w-0 text-sm font-medium text-foreground truncate">
                {entry.name}
              </p>
              <span className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                <Star className="w-3 h-3" />
                Nivel {entry.level}
              </span>
              <span className="flex items-center gap-1 text-sm font-semibold text-foreground flex-shrink-0 w-20 justify-end">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                {entry.totalXp.toLocaleString('es-AR')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function EmptyState({
  icon: Icon,
  message,
}: {
  icon: typeof AlertCircle
  message: string
}) {
  return (
    <Card>
      <CardContent className="py-8 text-center">
        <Icon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  )
}
