import { redirect } from 'next/navigation'
import Link from 'next/link'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getCurrentSchoolYear, getGrades } from '@/lib/reference-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PromoteButton } from './_components/promote-button'
import {
  ArrowLeft,
  GraduationCap,
  Star,
  Zap,
  BookOpen,
  AlertCircle,
  Clock,
  School,
  TrendingUp,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Tipos internos para los datos que devuelven las consultas
// ---------------------------------------------------------------------------

interface ProfileRow {
  id: string
  full_name: string
}

interface StudentPointRow {
  student_id: string
  total_xp: number
  level: number
}

interface ActivityRow {
  id: string
  title: string
}

interface ActivityProgressRow {
  activity_id: string
  xp_earned: number
  completed_at: string | null
}

interface ActivityWithProgress {
  id: string
  title: string
  xp_earned: number
  completed_at: string | null
}

interface EvaluationRow {
  id: string
  category_id: string | null
  score: number
  max_score: number
  evaluation_date: string
  notes: string | null
}

interface CategoryRow {
  id: string
  name: string
}

interface EvaluationWithCategory {
  id: string
  category_name: string
  score: number
  max_score: number
  evaluation_date: string
  notes: string | null
}

// ---------------------------------------------------------------------------
// Página de detalle de estudiante para el docente (Server Component)
// ---------------------------------------------------------------------------

export default async function TeacherStudentDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const user = await requireRole('teacher')
  const supabase = createClient()
  const studentId = params.id

  // --- 1. Obtener año escolar activo ---
  const currentYear = await getCurrentSchoolYear()

  // Sin año activo: el docente no puede ver datos
  if (!currentYear) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-muted-foreground">
            No hay un año escolar activo configurado.
          </p>
        </CardContent>
      </Card>
    )
  }

  // --- 2. Obtener salón del docente para el año activo ---
  const { data: classroom } = await supabase
    .from('classrooms')
    .select('id, section, grade_id, school_year_id')
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
      <Card>
        <CardContent className="py-8 text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            No tienes un salón asignado para este año escolar.
          </p>
        </CardContent>
      </Card>
    )
  }

  // --- 3. Datos del estudiante + verificación de pertenencia, en paralelo ---
  //
  // La matrícula se pide junto al resto en vez de esperarla primero: es un
  // viaje de red menos, y sigue siendo seguro porque nada se renderiza
  // hasta comprobarla justo abajo (y RLS ya limita lo que el docente puede
  // leer de todos modos).
  const [
    { data: enrollment },
    { data: profileData, error: profileError },
    { data: pointsData, error: pointsError },
    { data: gradeData },
    { data: activitiesData, error: activitiesError },
    { data: progressData, error: progressError },
    { data: evaluationsData, error: evaluationsError },
    { data: categoriesData, error: categoriesError },
  ] = await Promise.all([
    supabase
      .from('enrollments')
      .select('id, status, student_id, classroom_id, school_year_id')
      .eq('student_id', studentId)
      .eq('classroom_id', classroom.id)
      .eq('school_year_id', currentYear.id)
      .maybeSingle(),

    // Perfil del estudiante
    supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', studentId)
      .maybeSingle(),

    // Puntos y nivel del estudiante para este año escolar
    supabase
      .from('student_points')
      .select('student_id, total_xp, level')
      .eq('student_id', studentId)
      .eq('school_year_id', currentYear.id)
      .maybeSingle(),

    // Nombre del grado
    getGrades().then((gs) => ({ data: gs.find((g) => g.id === classroom.grade_id) ?? null })),

    // Actividades del salón (la tabla no tiene columna description —
    // seleccionarla hacía fallar la query en Postgrest y, como el código
    // solo desestructuraba `data` sin revisar `error`, la falla quedaba
    // silenciosa y vaciaba todo el historial/gráfico de XP de esta página)
    supabase
      .from('activities')
      .select('id, title')
      .eq('classroom_id', classroom.id)
      .order('created_at', { ascending: false }),

    // Progreso de actividades del estudiante
    supabase
      .from('activity_progress')
      .select('activity_id, xp_earned, completed_at')
      .eq('student_id', studentId),

    // Evaluaciones presenciales del estudiante en este salón
    supabase
      .from('presential_evaluations')
      .select('id, category_id, score, max_score, evaluation_date, notes')
      .eq('student_id', studentId)
      .eq('classroom_id', classroom.id)
      .order('evaluation_date', { ascending: false }),

    // Categorías de evaluación del grado (para mostrar el nombre)
    supabase
      .from('evaluation_categories')
      .select('id, name')
      .eq('grade_id', classroom.grade_id),
  ])

  // Si el estudiante no está en el salón del docente, redirigir antes de
  // renderizar nada con los datos que se pidieron en paralelo arriba.
  if (!enrollment) {
    redirect(
      `/teacher/classroom?error=${encodeURIComponent('El estudiante no pertenece a tu salón.')}`,
    )
  }

  for (const [label, err] of [
    ['profile', profileError],
    ['points', pointsError],
    ['activities', activitiesError],
    ['progress', progressError],
    ['evaluations', evaluationsError],
    ['categories', categoriesError],
  ] as const) {
    if (err) console.error(`Error al obtener ${label}:`, err.message)
  }

  // Progreso completado de TODO el salón, para el promedio comparativo
  // (consulta aparte: depende de "activities" recién resuelto arriba)
  const classroomActivityIds = (
    (activitiesData as ActivityRow[] | null) ?? []
  ).map((a) => a.id)

  const { data: classroomProgressData } =
    classroomActivityIds.length > 0
      ? await supabase
          .from('activity_progress')
          .select('xp_earned, completed_at')
          .in('activity_id', classroomActivityIds)
          .not('completed_at', 'is', null)
      : { data: [] as { xp_earned: number; completed_at: string | null }[] }

  const profile = profileData as ProfileRow | null
  const points = pointsData as StudentPointRow | null
  const grade = gradeData as { name: string } | null
  const activities = (activitiesData as ActivityRow[] | null) ?? []
  const progress = (progressData as ActivityProgressRow[] | null) ?? []
  const evaluations = (evaluationsData as EvaluationRow[] | null) ?? []
  const categories = (categoriesData as CategoryRow[] | null) ?? []

  // --- 5. Estudiante no encontrado (sin perfil) ---
  if (!profile) {
    redirect(
      `/teacher/classroom?error=${encodeURIComponent('Estudiante no encontrado.')}`,
    )
  }

  // --- 6. Construir mapa de progreso por actividad ---
  const progressMap = new Map<string, ActivityProgressRow>()
  for (const p of progress) {
    progressMap.set(p.activity_id, p)
  }

  // --- 7. Armar lista de actividades con progreso del estudiante ---
  const activitiesWithProgress: ActivityWithProgress[] = activities.map(
    (activity) => {
      const prog = progressMap.get(activity.id)
      return {
        id: activity.id,
        title: activity.title,
        xp_earned: prog?.xp_earned ?? 0,
        completed_at: prog?.completed_at ?? null,
      }
    },
  )

  // Filtrar solo las actividades completadas para el historial
  const completedActivities = activitiesWithProgress.filter(
    (a) => a.completed_at !== null,
  )

  // --- 7c. Últimas 5 actividades completadas (orden cronológico) para el gráfico de XP ---
  const chartActivities = [...completedActivities]
    .sort(
      (a, b) =>
        new Date(a.completed_at as string).getTime() -
        new Date(b.completed_at as string).getTime(),
    )
    .slice(-5)
  const maxChartXp = Math.max(1, ...chartActivities.map((a) => a.xp_earned))

  // --- 7d. Promedio de XP por actividad: alumno vs salón ---
  const studentAvgXp =
    completedActivities.length > 0
      ? completedActivities.reduce((sum, a) => sum + a.xp_earned, 0) /
        completedActivities.length
      : 0

  const classroomCompletions = classroomProgressData ?? []
  const classroomAvgXp =
    classroomCompletions.length > 0
      ? classroomCompletions.reduce((sum, p) => sum + (p.xp_earned ?? 0), 0) /
        classroomCompletions.length
      : 0

  // --- 7b. Enriquecer evaluaciones con el nombre de la categoría ---
  const categoryMap = new Map<string, string>()
  for (const c of categories) {
    categoryMap.set(c.id, c.name)
  }

  const evaluationsWithCategory: EvaluationWithCategory[] = evaluations.map(
    (e) => ({
      id: e.id,
      category_name: e.category_id
        ? (categoryMap.get(e.category_id) ?? '—')
        : '—',
      score: e.score,
      max_score: e.max_score,
      evaluation_date: e.evaluation_date,
      notes: e.notes,
    }),
  )

  // --- 8. Nombre del salón para mostrar ---
  const gradeName = grade?.name ?? ''
  const classroomName = gradeName
    ? `${gradeName} — Sección ${classroom.section}`
    : `Sección ${classroom.section}`

  // --- 9. Vista del detalle ---
  return (
    <div className="space-y-6">
        {/* Navegación: volver al salón */}
        <Link
          href="/teacher/classroom"
          className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-3 h-3" />
          Volver al salón
        </Link>

        {/* Encabezado del estudiante */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {profile.full_name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                {/* Nivel actual */}
                {points?.level ? (
                  <Badge variant="secondary" className="gap-1">
                    <Star className="w-3 h-3" />
                    Nivel {points.level}
                  </Badge>
                ) : null}

                {/* XP total */}
                <span className="flex items-center gap-1">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span className="font-semibold text-foreground">
                    {points?.total_xp?.toLocaleString('es-AR') ?? 0} XP
                  </span>
                </span>

                {/* Salón y año */}
                <span className="flex items-center gap-1">
                  <School className="w-4 h-4" />
                  {classroomName}
                </span>

                <span className="flex items-center gap-1">
                  <GraduationCap className="w-4 h-4" />
                  {currentYear.name}
                </span>
              </div>
            </div>

            {/* Botón de promover (solo si la matrícula está activa) */}
            {enrollment.status === 'active' && (
              <PromoteButton
                enrollmentId={enrollment.id}
                studentId={studentId}
                studentName={profile.full_name}
              />
            )}

            {/* Indicador si ya fue promovido */}
            {enrollment.status === 'promoted' && (
              <Badge variant="success" className="gap-1 text-sm px-3 py-1">
                <Star className="w-3 h-3" />
                Estudiante promovido
              </Badge>
            )}
          </div>
        </div>

        {/* Progreso de XP: gráfico de las últimas actividades + comparación con el salón */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Progreso de XP
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Sin actividades completadas todavía.
              </p>
            ) : (
              <div className="space-y-6">
                {/* Gráfico: XP de las últimas actividades completadas, en orden cronológico */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-3">
                    XP de las últimas {chartActivities.length} actividades completadas
                  </p>
                  <div className="space-y-2.5">
                    {chartActivities.map((activity) => {
                      const widthPct = Math.max(
                        4,
                        Math.round((activity.xp_earned / maxChartXp) * 100),
                      )
                      return (
                        <div
                          key={activity.id}
                          className="flex items-center gap-3"
                        >
                          <span className="text-xs text-muted-foreground w-28 sm:w-36 truncate flex-shrink-0">
                            {activity.title}
                          </span>
                          <div className="flex-1 flex items-center gap-2 min-w-0">
                            <div
                              className="h-3 bg-blue-100 rounded-full flex-1 overflow-hidden"
                              title={`${activity.title}: ${activity.xp_earned} XP`}
                            >
                              <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${widthPct}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-foreground w-14 flex-shrink-0 text-right tabular-nums">
                              {activity.xp_earned} XP
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Comparación: promedio del alumno vs promedio del salón */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground">Promedio del alumno</p>
                    <p className="text-lg font-bold text-foreground">
                      {studentAvgXp.toFixed(1)} XP
                      <span className="text-xs font-normal text-muted-foreground">
                        {' '}
                        / actividad
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Promedio del salón</p>
                    <p className="text-lg font-bold text-foreground">
                      {classroomAvgXp.toFixed(1)} XP
                      <span className="text-xs font-normal text-muted-foreground">
                        {' '}
                        / actividad
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Historial de actividades */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Historial de actividades
              </CardTitle>
            </CardHeader>
            <CardContent>
              {completedActivities.length === 0 ? (
                <div className="py-8 text-center">
                  <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    Sin actividades completadas
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    El estudiante aún no ha finalizado ninguna actividad.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {completedActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                    >
                      <div className="flex-1 min-w-0 mr-4">
                        <p className="text-sm font-medium text-foreground truncate">
                          {activity.title}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <Badge variant="default" className="text-xs">
                          +{activity.xp_earned} XP
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {activity.completed_at
                            ? new Date(
                                activity.completed_at,
                              ).toLocaleDateString('es-AR', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '—'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sección de evaluaciones presenciales */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                Evaluaciones presenciales
              </CardTitle>
            </CardHeader>
            <CardContent>
              {evaluationsWithCategory.length === 0 ? (
                <div className="py-8 text-center">
                  <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    Sin evaluaciones registradas
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Este estudiante todavía no tiene evaluaciones presenciales.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {evaluationsWithCategory.map((evaluation) => (
                    <div
                      key={evaluation.id}
                      className="flex items-start justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                    >
                      <div className="flex-1 min-w-0 mr-4">
                        <p className="text-sm font-medium text-foreground">
                          {evaluation.category_name}
                        </p>
                        {evaluation.notes && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {evaluation.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <Badge variant="secondary" className="text-xs">
                          {evaluation.score}/{evaluation.max_score}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(
                            evaluation.evaluation_date,
                          ).toLocaleDateString('es-AR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
  )
}
