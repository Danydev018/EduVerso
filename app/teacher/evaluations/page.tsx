import Link from 'next/link'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Plus,
  BookOpen,
  AlertCircle,
  GraduationCap,
  TrendingUp,
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

export default async function TeacherEvaluationsPage() {
  const user = await requireRole('teacher')
  const supabase = createClient()

  // --- 1. Obtener año escolar activo ---
  const { data: currentYear } = await supabase
    .from('school_years')
    .select('id, name')
    .eq('is_current', true)
    .maybeSingle()

  if (!currentYear) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Evaluaciones</h1>
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
      </div>
    )
  }

  // --- 2. Obtener salón del docente ---
  const { data: classroom } = await supabase
    .from('classrooms')
    .select('id, section, grade_id')
    .eq('teacher_id', user.id)
    .eq('school_year_id', currentYear.id)
    .maybeSingle()

  if (!classroom) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Evaluaciones</h1>
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
      </div>
    )
  }

  // --- 3. Consultas en paralelo ---
  const [
    { data: gradeData },
    { data: evaluationsRaw },
    { data: categoriesRaw },
    { data: enrollmentRows },
  ] = await Promise.all([
    // Nombre del grado
    supabase
      .from('grades')
      .select('name')
      .eq('id', classroom.grade_id)
      .maybeSingle(),

    // Evaluaciones del salón
    supabase
      .from('presential_evaluations')
      .select('*')
      .eq('classroom_id', classroom.id)
      .order('evaluation_date', { ascending: false })
      .order('created_at', { ascending: false }),

    // Categorías del grado
    supabase
      .from('evaluation_categories')
      .select('id, name')
      .eq('grade_id', classroom.grade_id)
      .order('name'),

    // Estudiantes matriculados activos
    supabase
      .from('enrollments')
      .select('student_id')
      .eq('classroom_id', classroom.id)
      .eq('school_year_id', currentYear.id)
      .eq('status', 'active'),
  ])

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

  // Obtener perfiles de estudiantes (sin duplicados)
  const studentIdsSet = new Set(evaluations.map((e) => e.student_id))
  const studentIds: string[] = []
  studentIdsSet.forEach((id) => studentIds.push(id))

  let profileMap = new Map<string, string>()

  if (studentIds.length > 0) {
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', studentIds)

    const profiles = (profilesData as ProfileRow[] | null) ?? []
    for (const p of profiles) {
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
  // Promedio por estudiante
  const studentAverages = new Map<string, { name: string; total: number; count: number }>()
  for (const e of enrichedEvaluations) {
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
  for (const e of enrichedEvaluations) {
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
    ? `${gradeName} Grado ${classroom.section}`
    : `Sección ${classroom.section}`

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Evaluaciones
          </h1>
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            {classroomName} — {currentYear.name}
          </p>
        </div>

        {/* Botón para registrar nueva evaluación */}
        <Button asChild>
          <Link href="/teacher/evaluations/new" className="gap-2">
            <Plus className="w-4 h-4" />
            Nueva evaluación
          </Link>
        </Button>
      </div>

      {/* Sin estudiantes */}
      {enrollments.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              No hay estudiantes matriculados en tu salón.
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Solicitá a la coordinación que inscriba estudiantes.
            </p>
          </CardContent>
        </Card>
      ) : categories.length === 0 ? (
        /* Sin categorías */
        <Card>
          <CardContent className="py-8 text-center">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <p className="text-gray-600">
              No hay categorías de evaluación configuradas para tu grado.
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Contactá a la coordinación para que configure las categorías.
            </p>
          </CardContent>
        </Card>
      ) : evaluations.length === 0 ? (
        /* Sin evaluaciones todavía */
        <Card>
          <CardContent className="py-8 text-center">
            <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              No hay evaluaciones registradas todavía.
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Usá el botón &quot;Nueva evaluación&quot; para registrar la
              primera.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Resumen: promedios */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Promedio por estudiante */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Promedio por estudiante
                </CardTitle>
              </CardHeader>
              <CardContent>
                {studentAverages.size === 0 ? (
                  <p className="text-sm text-gray-400">Sin datos.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {Array.from(studentAverages.entries())
                      .sort(
                        (a, b) =>
                          b[1].total / b[1].count - a[1].total / a[1].count,
                      )
                      .map(([id, acc]) => (
                        <div
                          key={id}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-gray-700 truncate flex-1 mr-2">
                            {acc.name}
                          </span>
                          <Badge variant="secondary">
                            {(acc.total / acc.count).toFixed(1)}
                          </Badge>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Promedio por categoría */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Promedio por categoría
                </CardTitle>
              </CardHeader>
              <CardContent>
                {categoryAverages.size === 0 ? (
                  <p className="text-sm text-gray-400">Sin datos.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {Array.from(categoryAverages.entries())
                      .sort(
                        (a, b) =>
                          b[1].total / b[1].count - a[1].total / a[1].count,
                      )
                      .map(([id, acc]) => (
                        <div
                          key={id}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-gray-700 truncate flex-1 mr-2">
                            {acc.name}
                          </span>
                          <Badge variant="secondary">
                            {(acc.total / acc.count).toFixed(1)}
                          </Badge>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tabla de evaluaciones */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Estudiante
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Categoría
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">
                    Nota
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">
                    Fecha
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Observaciones
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {enrichedEvaluations.map((evaluation) => (
                  <tr
                    key={evaluation.id}
                    className="hover:bg-gray-50"
                  >
                    {/* Estudiante */}
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {evaluation.student_name}
                    </td>

                    {/* Categoría */}
                    <td className="px-4 py-3 text-gray-600">
                      <Badge variant="outline">
                        {evaluation.category_name}
                      </Badge>
                    </td>

                    {/* Nota */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-semibold text-gray-900">
                        {evaluation.score}
                      </span>
                      <span className="text-gray-400">
                        /{evaluation.max_score}
                      </span>
                      <span className="ml-2 text-xs text-gray-400">
                        ({evaluation.percentage.toFixed(0)}%)
                      </span>
                    </td>

                    {/* Fecha */}
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {new Date(
                        evaluation.evaluation_date,
                      ).toLocaleDateString('es-AR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Observaciones */}
                    <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">
                      {evaluation.notes ?? '—'}
                    </td>

                    {/* Acciones: editar */}
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/teacher/evaluations/${evaluation.id}/edit`}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
