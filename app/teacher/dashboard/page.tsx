import Link from 'next/link'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getCurrentSchoolYear, getGrades } from '@/lib/reference-data'
import { getClassroomLeaderboard } from '@/lib/leaderboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  BookOpen,
  Trophy,
  AlertCircle,
  Activity,
  GraduationCap,
  ArrowRight,
  Star,
  Zap,
  TrendingDown,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Tipos internos para los datos que devuelven las consultas
// ---------------------------------------------------------------------------

interface ActivityRow {
  id: string
  title: string
  created_at: string
  status: string
}

interface ProfileRow {
  id: string
  full_name: string
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
          <p className="text-sm text-muted-foreground mt-2">
            Contacta a la coordinación para que active un año escolar.
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
    // Un docente puede tener más de un salón (ej. 3ro A y 3ro B).
    // Sin ordenar y acotar, maybeSingle() devuelve error PGRST116 y el
    // panel le dice "no tienes salón asignado" aunque tenga varios.
    .order('grade_id')
    .order('section')
    .limit(1)
    .maybeSingle()

  if (classroomError) {
    console.error('Error al obtener salón:', classroomError.message)
  }

  // Sin salón asignado: mostrar mensaje informativo
  if (!classroom) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            No tienes un salón asignado para el año escolar activo.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Solicita a la coordinación que te asigne un salón.
          </p>
        </CardContent>
      </Card>
    )
  }

  // --- 3. Consultas en paralelo: grado, estudiantes, actividades, puntos ---
  //
  // Nota de rendimiento: esta página hacía 7 viajes a Supabase en serie
  // (año → salón → lote → inactivos → progreso → top → leaderboard). Cada
  // uno suma su latencia de red completa, así que el docente esperaba la
  // suma de todos antes de ver nada. Ahora son 3 rondas: lo que no depende
  // de nada va junto acá, y lo que sí depende va en un único Promise.all
  // más abajo.
  const sieteDiasAtras = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000,
  ).toISOString()

  const [
    { data: grade },
    { data: activities },
    { data: enrolledStudents },
    { data: studentsWithRecentActivity },
    { data: topStudentPoints },
    classroomLeaderboard,
  ] = await Promise.all([
    // Nombre del grado (ej: "3er", "4to")
    getGrades().then((gs) => ({ data: gs.find((g) => g.id === classroom.grade_id) ?? null })),

    // Todas las actividades del salón (para completitud); las últimas 3 se
    // muestran en "Actividades recientes", el resto solo alimenta el widget
    // de menor completitud
    supabase
      .from('activities')
      .select('id, title, created_at, status')
      .eq('classroom_id', classroom.id)
      .order('created_at', { ascending: false }),

    // IDs de estudiantes matriculados activos. Sirve para el conteo total y
    // para el cálculo de inactivos, así que se pide una sola vez en vez de
    // sumarle un `count: exact` aparte como antes.
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

    // El leaderboard no depende de ninguna de las anteriores: se pide acá en
    // vez de al final, donde era el séptimo viaje en serie.
    getClassroomLeaderboard(supabase, classroom.id, currentYear.id, ''),
  ])

  const enrolledRows = (enrolledStudents as EnrolledStudent[] | null) ?? []
  const totalEstudiantes = enrolledRows.length

  // --- 4. Calcular estudiantes inactivos (sin actividad en 7 días) ---
  const recientesIds = new Set(
    (
      studentsWithRecentActivity as RecentStudentPoint[] | null
    )?.map((p) => p.student_id) ?? [],
  )

  // Inactivos = activos matriculados que NO aparecen en puntos recientes
  const inactivosIds = enrolledRows
    .map((e) => e.student_id)
    .filter((id) => !recientesIds.has(id))
  const inactivosCount = inactivosIds.length

  const typedActivities = (activities as ActivityRow[] | null) ?? []
  const activityIds = typedActivities.map((a) => a.id)
  const typedTopPoints = topStudentPoints as StudentPointRow | null

  // --- 5. Segunda ronda: lo que sí dependía de los resultados anteriores.
  // Antes eran 3 awaits separados (inactivos → progreso → perfil del top);
  // ahora viajan juntos.
  const [
    { data: inactivosProfiles },
    { data: progressData },
    { data: topProfile },
  ] = await Promise.all([
    inactivosIds.length > 0
      ? supabase.from('profiles').select('id, full_name').in('id', inactivosIds)
      : Promise.resolve({ data: [] as ProfileRow[] }),

    activityIds.length > 0
      ? supabase
          .from('activity_progress')
          .select('activity_id, completed_at')
          .in('activity_id', activityIds)
      : Promise.resolve({ data: [] as ActivityProgressRow[] }),

    typedTopPoints
      ? supabase
          .from('profiles')
          .select('full_name')
          .eq('id', typedTopPoints.student_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const inactivosNombres = ((inactivosProfiles as ProfileRow[] | null) ?? []).map(
    (p) => p.full_name,
  )
  const progressRows = (progressData as ActivityProgressRow[] | null) ?? []

  // Completados por actividad. Se agrupa en un solo recorrido en vez de
  // hacer un `filter` sobre todo el arreglo por cada actividad (que era
  // O(actividades × progresos)).
  const completadosPorActividad = new Map<string, number>()
  for (const p of progressRows) {
    if (p.completed_at !== null) {
      completadosPorActividad.set(
        p.activity_id,
        (completadosPorActividad.get(p.activity_id) ?? 0) + 1,
      )
    }
  }

  const actividadesConCompletitud = typedActivities.map((actividad) => {
    const completados = completadosPorActividad.get(actividad.id) ?? 0
    const porcentaje =
      totalEstudiantes > 0
        ? Math.round((completados / totalEstudiantes) * 100)
        : 0
    return { ...actividad, completados, porcentaje }
  })

  // Las 3 más recientes para la sección "Actividades recientes"
  // 6 en vez de 3: la grilla de dos columnas dejó alto libre, y estas filas
  // ya vienen calculadas — mostrar más aprovecha la pantalla sin costo extra.
  const actividadesRecientes = actividadesConCompletitud.slice(0, 6)

  // Actividad con menor completitud (solo activas/cerradas — un borrador no
  // visible al alumno siempre tendría 0% y distorsionaría la señal)
  const actividadMenorCompletitud = actividadesConCompletitud
    .filter((a) => a.status === 'active' || a.status === 'completed')
    .reduce<typeof actividadesConCompletitud[number] | null>((min, a) => {
      if (!min || a.porcentaje < min.porcentaje) return a
      return min
    }, null)

  // --- 6. Nombre y XP del top student (perfil ya resuelto arriba) ---
  const topXp = typedTopPoints?.total_xp ?? 0
  const topNombre = typedTopPoints
    ? ((topProfile as { full_name: string } | null)?.full_name ?? '—')
    : ''

  // --- 7. Nombre del salón para mostrar ---
  const gradeName = (grade as { name: string } | null)?.name ?? ''
  const nombreSalon = gradeName
    ? `${gradeName} — Sección ${classroom.section}`
    : `Sección ${classroom.section}`

  // --- 8. Top del salón (leaderboard ya resuelto arriba) ---
  const top3 = classroomLeaderboard.slice(0, 5)


  // --- 9. Vista del dashboard ---
  //
  // Layout de una sola pantalla: el docente no debería tener que scrollear
  // para ver el estado de su salón. Se usa una grilla de 12 columnas en vez
  // de tarjetas apiladas a todo el ancho — una tarjeta de 1200 px de ancho
  // con tres líneas de texto desperdicia el espacio y empuja el resto fuera
  // de la pantalla.
  return (
    <div className="flex flex-col gap-3">
      {/* Encabezado compacto: título y contexto en una sola línea */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h1 className="text-xl font-bold text-foreground">
          Bienvenido, {user.full_name.split(' ')[0]}
        </h1>
        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
          <GraduationCap className="w-3.5 h-3.5" />
          {nombreSalon} — {currentYear.name}
        </p>
      </div>

      {/* Fila de indicadores: tres tiles angostos, no tarjetas de ancho completo */}
      <div className="grid grid-cols-3 gap-3">
        <StatTile
          icon={<Users className="w-4 h-4 text-blue-500" />}
          label="Estudiantes"
          value={totalEstudiantes}
        />
        <StatTile
          icon={
            <AlertCircle
              className={`w-4 h-4 ${inactivosCount > 0 ? 'text-yellow-500' : 'text-green-500'}`}
            />
          }
          label="Inactivos > 7 días"
          value={inactivosCount}
          hint={inactivosNombres.length > 0 ? inactivosNombres.join(', ') : undefined}
        />
        <StatTile
          icon={<Trophy className="w-4 h-4 text-purple-500" />}
          label="Top de la semana"
          value={typedTopPoints ? topNombre : '—'}
          valueClassName="text-base truncate"
          hint={typedTopPoints ? `${topXp} XP` : 'Sin actividad esta semana'}
        />
      </div>

      {/* Zona principal en dos columnas: el contenido denso va lado a lado
          para que entre en el alto de la pantalla. */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
        {/* Actividades del salón — la columna ancha, es la tabla más útil */}
        <Card className="md:col-span-7">
          <CardHeader className="py-2.5 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Actividades recientes
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-0">
            {actividadesRecientes.length === 0 ? (
              <p className="text-sm text-muted-foreground py-3 text-center">
                No hay actividades creadas todavía.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {actividadesRecientes.map((actividad) => (
                  <div
                    key={actividad.id}
                    className="flex items-center justify-between gap-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {actividad.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(actividad.created_at).toLocaleDateString('es-AR', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </p>
                    </div>
                    {/* Barra de completitud: comunica el dato de un vistazo,
                        más rápido que leer el porcentaje. */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            actividad.porcentaje >= 75
                              ? 'bg-green-500'
                              : actividad.porcentaje >= 40
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.max(actividad.porcentaje, 2)}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-foreground w-9 text-right tabular-nums">
                        {actividad.porcentaje}%
                      </span>
                      <span className="text-xs text-muted-foreground w-8 text-right tabular-nums">
                        {actividad.completados}/{totalEstudiantes}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* La actividad más rezagada, como aviso dentro de la misma
                tarjeta: antes ocupaba una tarjeta entera de ancho completo
                para mostrar un solo dato. */}
            {actividadMenorCompletitud && (
              <div className="mt-2 pt-2 border-t border-border flex items-center gap-2">
                <TrendingDown className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                <p className="text-xs text-muted-foreground min-w-0 flex-1 truncate">
                  Más rezagada:{' '}
                  <span className="text-foreground font-medium">
                    {actividadMenorCompletitud.title}
                  </span>
                </p>
                <Badge
                  variant={
                    actividadMenorCompletitud.porcentaje >= 40 ? 'warning' : 'destructive'
                  }
                  className="flex-shrink-0"
                >
                  {actividadMenorCompletitud.porcentaje}%
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top 3 — columna angosta, al lado y no debajo */}
        <Card className="md:col-span-5">
          <CardHeader className="py-2.5 px-4">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Top del salón
              </CardTitle>
              <Link
                href="/teacher/classroom/leaderboard"
                className="text-xs text-blue-500 hover:underline flex items-center gap-1 flex-shrink-0"
              >
                Ver todo
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-0">
            {top3.length === 0 ? (
              <p className="text-sm text-muted-foreground py-3 text-center">
                Todavía no hay XP registrado.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {top3.map((entry) => (
                  <div key={entry.id} className="flex items-center gap-2.5 py-2">
                    <span
                      className={
                        'w-5 text-center text-sm font-bold flex-shrink-0 ' +
                        (entry.position === 1
                          ? 'text-yellow-500'
                          : entry.position === 2
                            ? 'text-muted-foreground'
                            : 'text-amber-700')
                      }
                    >
                      {entry.position}
                    </span>
                    <p className="flex-1 min-w-0 text-sm font-medium text-foreground truncate">
                      {entry.name}
                    </p>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                      <Star className="w-3 h-3" />
                      {entry.level}
                    </span>
                    <span className="flex items-center gap-1 text-sm font-semibold text-foreground flex-shrink-0 tabular-nums">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      {entry.totalXp.toLocaleString('es-AR')}
                    </span>
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

/**
 * Tile de indicador: alto fijo y compacto. Reemplaza a las <Card> con
 * CardHeader+CardContent que ocupaban ~130 px de alto cada una para mostrar
 * un número.
 */
function StatTile({
  icon,
  label,
  value,
  hint,
  valueClassName = 'text-2xl',
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  hint?: string
  valueClassName?: string
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2.5 min-w-0">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <p className={`font-bold text-foreground mt-0.5 ${valueClassName}`}>{value}</p>
      {hint && (
        <p className="text-xs text-muted-foreground truncate mt-0.5" title={hint}>
          {hint}
        </p>
      )}
    </div>
  )
}
