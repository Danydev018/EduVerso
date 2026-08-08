import { redirect } from 'next/navigation'
import Link from 'next/link'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
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
  description: string | null
}

interface ActivityProgressRow {
  activity_id: string
  xp_earned: number
  completed_at: string | null
}

interface ActivityWithProgress {
  id: string
  title: string
  description: string | null
  xp_earned: number
  completed_at: string | null
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
  const { data: currentYear } = await supabase
    .from('school_years')
    .select('id, name')
    .eq('is_current', true)
    .maybeSingle()

  // Sin año activo: el docente no puede ver datos
  if (!currentYear) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-600">
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
    .maybeSingle()

  if (!classroom) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            No tenés un salón asignado para este año escolar.
          </p>
        </CardContent>
      </Card>
    )
  }

  // --- 3. Verificar que el estudiante esté matriculado en el salón del docente ---
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id, status, student_id, classroom_id, school_year_id')
    .eq('student_id', studentId)
    .eq('classroom_id', classroom.id)
    .eq('school_year_id', currentYear.id)
    .maybeSingle()

  // Si el estudiante no está en el salón del docente, redirigir
  if (!enrollment) {
    redirect(
      `/teacher/classroom?error=${encodeURIComponent('El estudiante no pertenece a tu salón.')}`,
    )
  }

  // --- 4. Obtener datos del estudiante en paralelo ---
  const [
    { data: profileData },
    { data: pointsData },
    { data: gradeData },
    { data: activitiesData },
    { data: progressData },
  ] = await Promise.all([
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
    supabase
      .from('grades')
      .select('name')
      .eq('id', classroom.grade_id)
      .maybeSingle(),

    // Actividades del salón
    supabase
      .from('activities')
      .select('id, title, description')
      .eq('classroom_id', classroom.id)
      .order('created_at', { ascending: false }),

    // Progreso de actividades del estudiante
    supabase
      .from('activity_progress')
      .select('activity_id, xp_earned, completed_at')
      .eq('student_id', studentId),
  ])

  const profile = profileData as ProfileRow | null
  const points = pointsData as StudentPointRow | null
  const grade = gradeData as { name: string } | null
  const activities = (activitiesData as ActivityRow[] | null) ?? []
  const progress = (progressData as ActivityProgressRow[] | null) ?? []

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
        description: activity.description,
        xp_earned: prog?.xp_earned ?? 0,
        completed_at: prog?.completed_at ?? null,
      }
    },
  )

  // Filtrar solo las actividades completadas para el historial
  const completedActivities = activitiesWithProgress.filter(
    (a) => a.completed_at !== null,
  )

  // --- 8. Nombre del salón para mostrar ---
  const gradeName = grade?.name ?? ''
  const classroomName = gradeName
    ? `${gradeName} Grado ${classroom.section}`
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
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {profile.full_name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
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
                  <span className="font-semibold text-gray-700">
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
                  <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">
                    Sin actividades completadas
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    El estudiante aún no ha finalizado ninguna actividad.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {completedActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                    >
                      <div className="flex-1 min-w-0 mr-4">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {activity.title}
                        </p>
                        {activity.description && (
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                            {activity.description}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <Badge variant="default" className="text-xs">
                          +{activity.xp_earned} XP
                        </Badge>
                        <span className="text-xs text-gray-400">
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

          {/* Sección de evaluaciones presenciales (placeholder) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                Evaluaciones presenciales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="py-8 text-center">
                <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">
                  Evaluaciones presenciales
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Disponible próximamente (Semana 3.3)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  )
}
