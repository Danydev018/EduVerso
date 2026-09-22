import Link from 'next/link'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getCurrentSchoolYear, getGrades } from '@/lib/reference-data'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  GraduationCap,
  AlertCircle,
  BookOpen,
  ArrowRight,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Tipos internos para los datos que devuelven las consultas
// ---------------------------------------------------------------------------

interface EnrollmentRow {
  student_id: string
}

interface ProfileRow {
  id: string
  full_name: string
}

interface StudentPointRow {
  student_id: string
  total_xp: number
  level: number
  updated_at: string
}

interface ActivityProgressRow {
  student_id: string
  completed_at: string | null
}

interface StudentData {
  student_id: string
  full_name: string
  level: number | null
  total_xp: number
  last_activity: string | null
  is_active: boolean // true si student_points.updated_at está dentro de los últimos 7 días
}

// ---------------------------------------------------------------------------
// Página del salón del docente (Server Component)
// ---------------------------------------------------------------------------

export default async function TeacherClassroomPage() {
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

  // --- 2. Obtener salón asignado al docente para el año activo ---
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

  // --- 3. Grado y matrículas en paralelo ---
  // (no dependen entre sí; antes eran dos viajes en serie)
  const [{ data: grade }, { data: enrollmentRows }] = await Promise.all([
    getGrades().then((gs) => ({ data: gs.find((g) => g.id === classroom.grade_id) ?? null })),
    supabase
      .from('enrollments')
      .select('student_id')
      .eq('classroom_id', classroom.id)
      .eq('school_year_id', currentYear.id)
      .eq('status', 'active'),
  ])

  const gradeName = (grade as { name: string } | null)?.name ?? ''
  const classroomName = gradeName
    ? `${gradeName} — Sección ${classroom.section}`
    : `Sección ${classroom.section}`

  const typedEnrollments = (enrollmentRows as EnrollmentRow[] | null) ?? []
  const studentIds = typedEnrollments.map((e) => e.student_id)
  const totalEstudiantes = studentIds.length

  // --- 5. Sin estudiantes matriculados: mostrar mensaje ---
  if (studentIds.length === 0) {
    return (
      <div className="space-y-4">
        {/* Encabezado con nombre del salón y año */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {classroomName}
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            {currentYear.name}
          </p>
        </div>

        <Card>
          <CardContent className="py-8 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No hay estudiantes matriculados en este salón.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Solicita a la coordinación que inscriba estudiantes.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // --- 6. Consultas en paralelo: perfiles, puntos, actividad reciente ---
  const [
    { data: profilesData },
    { data: pointsData },
    { data: activityData },
  ] = await Promise.all([
    // Nombres de los estudiantes
    supabase.from('profiles').select('id, full_name').in('id', studentIds),

    // Puntos y nivel por estudiante en este salón y año
    supabase
      .from('student_points')
      .select('student_id, total_xp, level, updated_at')
      .eq('classroom_id', classroom.id)
      .eq('school_year_id', currentYear.id)
      .in('student_id', studentIds),

    // Progreso de actividades más reciente por estudiante. Se filtran los
    // registros sin completar: Postgres ordena NULL primero en DESC por
    // defecto, así que sin este filtro un alumno con una actividad en
    // progreso (completed_at null) "tapaba" su última actividad realmente
    // completada en el mapa de abajo.
    supabase
      .from('activity_progress')
      .select('student_id, completed_at')
      .in('student_id', studentIds)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false }),
  ])

  const typedProfiles = (profilesData as ProfileRow[] | null) ?? []
  const typedPoints = (pointsData as StudentPointRow[] | null) ?? []
  const typedActivity = (activityData as ActivityProgressRow[] | null) ?? []

  // --- 7. Construir mapas de búsqueda ---
  const profileMap = new Map<string, string>()
  for (const p of typedProfiles) {
    profileMap.set(p.id, p.full_name)
  }

  const pointsMap = new Map<string, StudentPointRow>()
  for (const p of typedPoints) {
    pointsMap.set(p.student_id, p)
  }

  // Última actividad: primer registro por estudiante (ya ordenado DESC)
  const lastActivityMap = new Map<string, string | null>()
  for (const a of typedActivity) {
    if (!lastActivityMap.has(a.student_id)) {
      lastActivityMap.set(a.student_id, a.completed_at)
    }
  }

  // --- 8. Umbral de inactividad: 7 días ---
  const sieteDiasAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  // --- 9. Armar lista de estudiantes con todos los datos ---
  const students: StudentData[] = typedEnrollments.map((enrollment) => {
    const sid = enrollment.student_id
    const points = pointsMap.get(sid)

    // Activo si existe registro de puntos y su updated_at está dentro de los últimos 7 días
    const isActive = points
      ? new Date(points.updated_at) >= sieteDiasAtras
      : false

    return {
      student_id: sid,
      full_name: profileMap.get(sid) ?? '—',
      level: points?.level ?? null,
      total_xp: points?.total_xp ?? 0,
      last_activity: lastActivityMap.get(sid) ?? null,
      is_active: isActive,
    }
  })

  // --- 10. Vista del salón ---
  return (
    <div className="space-y-6">
        {/* Encabezado: nombre del salón, año escolar y cantidad de estudiantes */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {classroomName}
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
            <GraduationCap className="w-4 h-4" />
            {currentYear.name}
            <span className="text-muted-foreground">·</span>
            <Users className="w-4 h-4" />
            {totalEstudiantes} estudiante{totalEstudiantes !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Tabla de estudiantes */}
        <div className="bg-card rounded-lg border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Nombre
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
                  Nivel actual
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  XP Total
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
                  Última actividad
                </th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">
                  Estado
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {students.map((student) => (
                <tr key={student.student_id} className="hover:bg-muted/50">
                  {/* Nombre completo */}
                  <td className="px-4 py-3 font-medium text-foreground">
                    {student.full_name}
                  </td>

                  {/* Nivel actual */}
                  <td className="px-4 py-3 text-muted-foreground">
                    {student.level !== null ? (
                      <Badge variant="secondary">Nivel {student.level}</Badge>
                    ) : (
                      <span className="text-muted-foreground italic">—</span>
                    )}
                  </td>

                  {/* XP Total */}
                  <td className="px-4 py-3 text-muted-foreground">
                    {student.total_xp > 0 ? (
                      <span className="font-semibold">
                        {student.total_xp.toLocaleString('es-AR')} XP
                      </span>
                    ) : (
                      <span className="text-muted-foreground italic">0 XP</span>
                    )}
                  </td>

                  {/* Última actividad */}
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {student.last_activity ? (
                      new Date(student.last_activity).toLocaleDateString(
                        'es-AR',
                        {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        },
                      )
                    ) : (
                      <span className="text-muted-foreground italic">
                        Sin actividad
                      </span>
                    )}
                  </td>

                  {/* Indicador visual de actividad */}
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block w-2.5 h-2.5 rounded-full ${
                        student.is_active ? 'bg-green-500' : 'bg-yellow-500'
                      }`}
                      title={
                        student.is_active
                          ? 'Activo (últimos 7 días)'
                          : 'Inactivo (más de 7 días sin actividad)'
                      }
                    />
                  </td>

                  {/* Acciones: link al detalle del estudiante */}
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/teacher/students/${student.student_id}`}
                      className="text-blue-600 hover:underline text-sm inline-flex items-center gap-1"
                    >
                      Ver detalle
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
  )
}
