import Link from 'next/link'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Pagination } from '@/components/pagination'
import { getPageRange, getTotalPages } from '@/lib/pagination'
import {
  getCurrentSchoolYear,
  getGrades,
  getEvaluationCategories,
} from '@/lib/reference-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EvaluationFilters } from './_components/evaluation-filters'
import {
  Plus,
  BookOpen,
  AlertCircle,
  GraduationCap,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Tipos internos para los datos que devuelven las consultas
// ---------------------------------------------------------------------------

interface EvaluationRow {
  id: string
  student_id: string
  category_id: string
  score: number
  max_score: number
  evaluation_date: string
  notes: string | null
  created_at: string
}

interface CategoryRow {
  id: string
  name: string
}

interface StudentEnrollmentRow {
  student_id: string
}

interface ProfileRow {
  id: string
  full_name: string
}

// ---------------------------------------------------------------------------
// Evaluación aumentada con nombre de estudiante y categoría
// ---------------------------------------------------------------------------

interface EnrichedEvaluation {
  id: string
  student_id: string
  student_name: string
  category_id: string
  category_name: string
  score: number
  max_score: number
  percentage: number
  evaluation_date: string
  notes: string | null
  created_at: string
}

// ---------------------------------------------------------------------------
// Página de lista de evaluaciones del docente (Server Component)
// ---------------------------------------------------------------------------

export default async function TeacherEvaluationsPage({
  searchParams,
}: {
  searchParams: { student?: string; category?: string; page?: string }
}) {
  const user = await requireRole('teacher')
  const supabase = createClient()

  const studentFilter = searchParams.student || ''
  const categoryFilter = searchParams.category || ''
  const { page, from, to } = getPageRange(searchParams.page)

  // --- 1. Año escolar activo (cacheado: misma fila para todos los usuarios) ---
  const currentYear = await getCurrentSchoolYear()

  if (!currentYear) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Evaluaciones</h1>
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
      </div>
    )
  }

  // --- 2. Obtener salón del docente ---
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
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Evaluaciones</h1>
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
      </div>
    )
  }

  // --- 3. Consultas en paralelo ---
  // Los mismos filtros se aplican al conteo total y a la página visible.
  const classroomId = classroom.id
  type EvalFilterable = { eq: (col: string, val: unknown) => EvalFilterable }
  function applyEvalFilters<T>(builder: T): T {
    let b = builder as unknown as EvalFilterable
    b = b.eq('classroom_id', classroomId)
    if (studentFilter) b = b.eq('student_id', studentFilter)
    if (categoryFilter) b = b.eq('category_id', categoryFilter)
    return b as unknown as T
  }

  const evaluationsQuery = applyEvalFilters(
    supabase
      .from('presential_evaluations')
      // columnas explícitas en vez de '*': la tabla trae notas largas y
      // metadatos que esta lista no muestra
      .select('id, student_id, category_id, score, max_score, evaluation_date, notes'),
  )
    .order('evaluation_date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, to)

  const evaluationsCountQuery = applyEvalFilters(
    supabase.from('presential_evaluations').select('id', { count: 'exact', head: true }),
  )

  const [
    allGrades,
    { data: evaluationsRaw },
    { count: totalEvaluations },
    allCategories,
    { data: enrollmentRows },
  ] = await Promise.all([
    // Grados y categorías: datos de referencia cacheados (iguales para todos
    // los usuarios), no vuelven a la base en cada carga de la página.
    getGrades(),

    // Evaluaciones del salón, ya paginadas
    evaluationsQuery,

    // Total para calcular la cantidad de páginas
    evaluationsCountQuery,

    getEvaluationCategories(),

    // Estudiantes matriculados activos
    supabase
      .from('enrollments')
      .select('student_id')
      .eq('classroom_id', classroom.id)
      .eq('school_year_id', currentYear.id)
      .eq('status', 'active'),
  ])

  const gradeData = allGrades.find((g) => g.id === classroom.grade_id) ?? null
  const categoriesRaw = allCategories.filter((c) => c.grade_id === classroom.grade_id)
  const totalPages = getTotalPages(totalEvaluations)

  const grade = gradeData as { name: string } | null
  const evaluations = (evaluationsRaw as EvaluationRow[] | null) ?? []
  const categories = (categoriesRaw as CategoryRow[] | null) ?? []
  const enrollments =
    (enrollmentRows as StudentEnrollmentRow[] | null) ?? []

  // --- 4. Construir mapas de búsqueda ---
  const categoryMap = new Map<string, string>()
  for (const c of categories) {
    categoryMap.set(c.id, c.name)
  }

  // Perfiles de todos los estudiantes matriculados (cubre el filtro y las
  // evaluaciones mostradas, incluso si el filtro deja la lista vacía)
  const enrolledStudentIds = enrollments.map((e) => e.student_id)
  let profileMap = new Map<string, string>()
  let studentOptions: ProfileRow[] = []

  if (enrolledStudentIds.length > 0) {
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', enrolledStudentIds)
      .order('full_name')

    studentOptions = (profilesData as ProfileRow[] | null) ?? []
    for (const p of studentOptions) {
      profileMap.set(p.id, p.full_name)
    }
  }

  // --- 5. Enriquecer evaluaciones con nombres ---
  const enrichedEvaluations: EnrichedEvaluation[] = evaluations.map((e) => ({
    ...e,
    student_name: profileMap.get(e.student_id) ?? '—',
    category_name: categoryMap.get(e.category_id) ?? '—',
    percentage: e.max_score > 0 ? (e.score / e.max_score) * 100 : 0,
  }))

  // --- 6. Calcular resúmenes ---
  //
  // Los promedios se calculan sobre TODAS las evaluaciones que cumplen el
  // filtro, no sobre `enrichedEvaluations` (que ahora es solo la página
  // visible). Con paginación, promediar la página daría un número distinto
  // en cada página para el mismo filtro — sería un dato incorrecto, no solo
  // incompleto. Se piden únicamente las tres columnas necesarias.
  const { data: summaryRows } = await applyEvalFilters(
    supabase.from('presential_evaluations').select('student_id, category_id, score'),
  )

  const summaryEvaluations = (
    (summaryRows as { student_id: string; category_id: string; score: number }[] | null) ?? []
  ).map((e) => ({
    student_id: e.student_id,
    category_id: e.category_id,
    score: e.score,
    student_name: profileMap.get(e.student_id) ?? '—',
    category_name: categoryMap.get(e.category_id) ?? '—',
  }))

  // Promedio por estudiante
  const studentAverages = new Map<string, { name: string; total: number; count: number }>()
  for (const e of summaryEvaluations) {
    const acc = studentAverages.get(e.student_id) ?? {
      name: e.student_name,
      total: 0,
      count: 0,
    }
    acc.total += e.score
    acc.count += 1
    studentAverages.set(e.student_id, acc)
  }

  // Promedio por categoría
  const categoryAverages = new Map<string, { name: string; total: number; count: number }>()
  for (const e of summaryEvaluations) {
    const acc = categoryAverages.get(e.category_id) ?? {
      name: e.category_name,
      total: 0,
      count: 0,
    }
    acc.total += e.score
    acc.count += 1
    categoryAverages.set(e.category_id, acc)
  }

  // --- 7. Nombre del salón ---
  const gradeName = grade?.name ?? ''
  const classroomName = gradeName
    ? `${gradeName} — Sección ${classroom.section}`
    : `Sección ${classroom.section}`


  // --- 8. Vista en dos niveles ---
  //
  // Nivel 1 (sin ?student=): lista de alumnos del salón, paginada de a 10.
  // Nivel 2 (con ?student=): las notas de ESE alumno, que es la tabla que
  // antes se mostraba de entrada mezclando a todo el salón.
  //
  // La lista de alumnos se pagina en memoria a propósito: son los
  // matriculados del salón (decenas, no miles) y sus promedios ya salen del
  // mismo recorrido que alimenta los resúmenes, así que partirla en la base
  // agregaría consultas sin ahorrar nada.
  const selectedStudent = studentFilter
    ? studentOptions.find((p) => p.id === studentFilter) ?? null
    : null

  const studentRows = studentOptions
    .map((p) => {
      const acc = studentAverages.get(p.id)
      return {
        id: p.id,
        name: p.full_name,
        count: acc?.count ?? 0,
        average: acc && acc.count > 0 ? acc.total / acc.count : null,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))

  const STUDENTS_PER_PAGE = 10
  const studentsTotalPages = getTotalPages(studentRows.length, STUDENTS_PER_PAGE)
  const studentsPage = Math.min(page, studentsTotalPages)
  const visibleStudents = studentRows.slice(
    (studentsPage - 1) * STUDENTS_PER_PAGE,
    studentsPage * STUDENTS_PER_PAGE,
  )

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Evaluaciones</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
            <GraduationCap className="w-4 h-4" />
            {classroomName} — {currentYear.name}
          </p>
        </div>

        <Button asChild>
          <Link href="/teacher/evaluations/new" className="gap-2">
            <Plus className="w-4 h-4" />
            Nueva evaluación
          </Link>
        </Button>
      </div>

      {enrollments.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No hay estudiantes matriculados en tu salón.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Solicita a la coordinación que inscriba estudiantes.
            </p>
          </CardContent>
        </Card>
      ) : categories.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <p className="text-muted-foreground">
              No hay categorías de evaluación configuradas para tu grado.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Contacta a la coordinación para que configure las categorías.
            </p>
          </CardContent>
        </Card>
      ) : selectedStudent ? (
        /* ─────────── NIVEL 2: notas de un alumno ─────────── */
        <>
          <Link
            href="/teacher/evaluations"
            className="text-sm text-blue-500 hover:underline inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3 h-3" />
            Volver a la lista de alumnos
          </Link>

          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 className="text-lg font-semibold text-foreground">
              {selectedStudent.full_name}
            </h2>
            <p className="text-sm text-muted-foreground">
              {totalEvaluations ?? 0} evaluación
              {totalEvaluations === 1 ? '' : 'es'}
              {(() => {
                const acc = studentAverages.get(selectedStudent.id)
                return acc && acc.count > 0
                  ? ` · promedio ${(acc.total / acc.count).toFixed(1)}`
                  : ''
              })()}
            </p>
          </div>

          {/* Filtro por categoría, acotado al alumno abierto */}
          <EvaluationFilters
            students={studentOptions.map((p) => ({ id: p.id, name: p.full_name }))}
            categories={categories.map((c) => ({ id: c.id, name: c.name }))}
          />

          {enrichedEvaluations.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {categoryFilter
                    ? 'Este alumno no tiene evaluaciones en esa categoría.'
                    : 'Este alumno todavía no tiene evaluaciones registradas.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="bg-card rounded-lg border border-border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                        Categoría
                      </th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                        Nota
                      </th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                        Fecha
                      </th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                        Observaciones
                      </th>
                      <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {enrichedEvaluations.map((e) => (
                      <tr key={e.id} className="hover:bg-muted/50">
                        <td className="px-4 py-2.5">
                          <Badge variant="outline">{e.category_name}</Badge>
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                          <span className="font-semibold text-foreground">{e.score}</span>
                          /{e.max_score}{' '}
                          <span className="text-xs">({e.percentage}%)</span>
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                          {new Date(e.evaluation_date).toLocaleDateString('es-AR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground max-w-xs truncate">
                          {e.notes || '—'}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <Link
                            href={`/teacher/evaluations/${e.id}/edit`}
                            className="text-blue-500 hover:underline text-sm"
                          >
                            Editar
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Pagination
                page={page}
                totalPages={totalPages}
                totalRows={totalEvaluations ?? 0}
                basePath="/teacher/evaluations"
                searchParams={searchParams}
                itemLabel="evaluaciones"
              />
            </>
          )}
        </>
      ) : (
        /* ─────────── NIVEL 1: alumnos del salón ─────────── */
        <>
          <div className="bg-card rounded-lg border border-border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                    Estudiante
                  </th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                    Evaluaciones
                  </th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                    Promedio
                  </th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visibleStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/50">
                    <td className="px-4 py-2.5 font-medium text-foreground">
                      <Link
                        href={`/teacher/evaluations?student=${s.id}`}
                        className="hover:underline"
                      >
                        {s.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground tabular-nums">
                      {s.count}
                    </td>
                    <td className="px-4 py-2.5">
                      {s.average === null ? (
                        <span className="text-muted-foreground italic text-xs">
                          Sin notas
                        </span>
                      ) : (
                        <Badge
                          variant={
                            s.average >= 14 ? 'success' : s.average >= 10 ? 'warning' : 'destructive'
                          }
                        >
                          {s.average.toFixed(1)}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Link
                        href={`/teacher/evaluations?student=${s.id}`}
                        className="text-blue-500 hover:underline text-sm inline-flex items-center gap-1"
                      >
                        Ver notas
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={studentsPage}
            totalPages={studentsTotalPages}
            totalRows={studentRows.length}
            basePath="/teacher/evaluations"
            searchParams={searchParams}
            itemLabel="alumnos"
          />

          {/* Promedio por categoría: dato de todo el salón, útil como
              panorama general antes de entrar a un alumno puntual. */}
          {categoryAverages.size > 0 && (
            <Card>
              <CardHeader className="py-2.5 px-4">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Promedio del salón por categoría
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 pt-0">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1.5">
                  {Array.from(categoryAverages.entries())
                    .sort((a, b) => b[1].total / b[1].count - a[1].total / a[1].count)
                    .map(([id, acc]) => (
                      <div key={id} className="flex items-center justify-between gap-2 text-sm">
                        <span className="text-muted-foreground truncate">{acc.name}</span>
                        <span className="font-semibold text-foreground tabular-nums">
                          {(acc.total / acc.count).toFixed(1)}
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
