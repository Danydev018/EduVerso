import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  BookOpen,
  Trophy,
  AlertCircle,
  Activity,
  GraduationCap,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Tipos internos para los datos que devuelven las consultas
// ---------------------------------------------------------------------------

interface ActivityRow {
  id: string
  title: string
  created_at: string
}

interface ActivityProgressRow {
  activity_id: string
  completed_at: string | null
}

interface EnrolledStudent {
  student_id: string
}

interface RecentStudentPoint {
  student_id: string
}

interface StudentPointRow {
  student_id: string
  total_xp: number
}

// ---------------------------------------------------------------------------
// Página del dashboard del docente (Server Component)
// ---------------------------------------------------------------------------

export default async function TeacherDashboard() {
  const user = await requireRole('teacher')
  const supabase = createClient()

  // --- 1. Obtener año escolar activo ---
  const { data: currentYear, error: yearError } = await supabase
    .from('school_years')
    .select('id, name')
    .eq('is_current', true)
    .maybeSingle()

  if (yearError) {
    console.error('Error al obtener año escolar:', yearError.message)
  }

  // Sin año activo: el docente no puede ver datos
  if (!currentYear) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-600">
            No hay un año escolar activo configurado.
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Contactá a la coordinación para que active un año escolar.
          </p>
        </CardContent>
      </Card>
    )
  }

  // --- 2. Obtener salón del docente para el año activo ---
  const { data: classroom, error: classroomError } = await supabase
    .from('classrooms')
    .select('id, section, grade_id')
    .eq('teacher_id', user.id)
    .eq('school_year_id', currentYear.id)
    .maybeSingle()

  if (classroomError) {
    console.error('Error al obtener salón:', classroomError.message)
  }

  // Sin salón asignado: mostrar mensaje informativo
  if (!classroom) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            No tenés un salón asignado para el año escolar activo.
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Solicitá a la coordinación que te asigne un salón.
          </p>
        </CardContent>
      </Card>
    )
  }

  // --- 3. Consultas en paralelo: grado, estudiantes, actividades, puntos ---
  const sieteDiasAtras = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000,
  ).toISOString()

  const [
    { data: grade },
    { count: studentCount },
    { data: activities },
    { data: enrolledStudents },
    { data: studentsWithRecentActivity },
    { data: topStudentPoints },
  ] = await Promise.all([
    // Nombre del grado (ej: "3er", "4to")
    supabase
      .from('grades')
      .select('name')
      .eq('id', classroom.grade_id)
      .maybeSingle(),

    // Cantidad de estudiantes activos en el salón
    supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('classroom_id', classroom.id)
      .eq('status', 'active'),

    // Últimas 3 actividades del salón
    supabase
      .from('activities')
      .select('id, title, created_at')
      .eq('classroom_id', classroom.id)
      .order('created_at', { ascending: false })
      .limit(3),

    // IDs de estudiantes matriculados activos (para cálculo de inactivos)
    supabase
      .from('enrollments')
      .select('student_id')
      .eq('classroom_id', classroom.id)
      .eq('status', 'active'),

    // Estudiantes con actividad (puntos) en los últimos 7 días
    supabase
      .from('student_points')
      .select('student_id')
      .eq('classroom_id', classroom.id)
      .gte('updated_at', sieteDiasAtras),

    // Top student: mayor XP entre quienes tuvieron actividad esta semana
    supabase
      .from('student_points')
      .select('student_id, total_xp')
      .eq('classroom_id', classroom.id)
      .gte('updated_at', sieteDiasAtras)
      .order('total_xp', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const totalEstudiantes = studentCount ?? 0

  // --- 4. Calcular estudiantes inactivos (sin actividad en 7 días) ---
  const activosIds = new Set(
    (enrolledStudents as EnrolledStudent[] | null)?.map((e) => e.student_id) ??
      [],
  )
  const recientesIds = new Set(
    (
      studentsWithRecentActivity as RecentStudentPoint[] | null
    )?.map((p) => p.student_id) ?? [],
  )

  // Inactivos = activos matriculados que NO aparecen en puntos recientes
  let inactivosCount = 0
  activosIds.forEach((id) => {
    if (!recientesIds.has(id)) {
      inactivosCount++
    }
  })

  // --- 5. Obtener progreso de las actividades para calcular % completitud ---
  const typedActivities = (activities as ActivityRow[] | null) ?? []
  const activityIds = typedActivities.map((a) => a.id)

  let progressRows: ActivityProgressRow[] = []
  if (activityIds.length > 0) {
    const { data: progressData } = await supabase
      .from('activity_progress')
      .select('activity_id, completed_at')
      .in('activity_id', activityIds)

    progressRows = (progressData as ActivityProgressRow[] | null) ?? []
  }

  // Calcular % de completitud por actividad: completados / total estudiantes
  const actividadesConCompletitud = typedActivities.map((actividad) => {
    const progresoActividad = progressRows.filter(
      (p) => p.activity_id === actividad.id,
    )
    const completados = progresoActividad.filter(
      (p) => p.completed_at !== null,
    ).length
    const porcentaje =
      totalEstudiantes > 0
        ? Math.round((completados / totalEstudiantes) * 100)
        : 0
    return { ...actividad, completados, porcentaje }
  })

  // --- 6. Obtener nombre del top student ---
  const typedTopPoints = topStudentPoints as StudentPointRow | null
  let topNombre = ''
  let topXp = 0

  if (typedTopPoints) {
    topXp = typedTopPoints.total_xp

    const { data: topProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', typedTopPoints.student_id)
      .maybeSingle()

    topNombre =
      (topProfile as { full_name: string } | null)?.full_name ?? '—'
  }

  // --- 7. Nombre del salón para mostrar ---
  const gradeName = (grade as { name: string } | null)?.name ?? ''
  const nombreSalon = gradeName
    ? `${gradeName} Grado ${classroom.section}`
    : `Sección ${classroom.section}`

  // --- 8. Vista del dashboard ---
  return (
    <div className="space-y-6">
        {/* Encabezado con nombre del salón y año escolar */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Bienvenido, {user.full_name.split(' ')[0]}
          </h1>
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            {nombreSalon} — {currentYear.name}
          </p>
        </div>

        {/* Tarjetas de estadísticas principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Estudiantes activos */}
          <Card>
            <CardHeader className="pb-2">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-2">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <CardTitle className="text-sm font-medium text-gray-500">
                Estudiantes activos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">
                {totalEstudiantes}
              </p>
            </CardContent>
          </Card>

          {/* Inactivos (sin actividad en 7 días) */}
          <Card>
            <CardHeader className="pb-2">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${
                  inactivosCount > 0 ? 'bg-yellow-50' : 'bg-green-50'
                }`}
              >
                <AlertCircle
                  className={`w-5 h-5 ${
                    inactivosCount > 0 ? 'text-yellow-600' : 'text-green-600'
                  }`}
                />
              </div>
              <CardTitle className="text-sm font-medium text-gray-500">
                Sin actividad &gt; 7 días
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-gray-900">
                  {inactivosCount}
                </p>
                {inactivosCount > 0 && (
                  <Badge variant="warning">Requiere atención</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top student de la semana */}
          <Card>
            <CardHeader className="pb-2">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center mb-2">
                <Trophy className="w-5 h-5 text-purple-600" />
              </div>
              <CardTitle className="text-sm font-medium text-gray-500">
                Top de la semana
              </CardTitle>
            </CardHeader>
            <CardContent>
              {typedTopPoints ? (
                <>
                  <p className="text-lg font-bold text-gray-900 truncate">
                    {topNombre}
                  </p>
                  <p className="text-sm text-purple-600 font-medium">
                    {topXp} XP
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-400">
                  Sin actividad esta semana
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sección de actividades recientes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Actividades recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {actividadesConCompletitud.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">
                No hay actividades creadas todavía.
              </p>
            ) : (
              <div className="space-y-3">
                {actividadesConCompletitud.map((actividad) => (
                  <div
                    key={actividad.id}
                    className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex-1 min-w-0 mr-4">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {actividad.title}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(actividad.created_at).toLocaleDateString(
                          'es-AR',
                          {
                            day: 'numeric',
                            month: 'short',
                          },
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-semibold text-gray-700">
                        {actividad.porcentaje}%
                      </span>
                      <Badge
                        variant={
                          actividad.porcentaje >= 75
                            ? 'success'
                            : actividad.porcentaje >= 40
                              ? 'warning'
                              : 'destructive'
                        }
                      >
                        {actividad.completados}/{totalEstudiantes}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
  )
}
