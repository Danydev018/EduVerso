import Link from 'next/link'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, BookOpen } from 'lucide-react'
import {
  EvaluationForm,
  type StudentOption,
  type CategoryOption,
} from '../_components/evaluation-form'

// ---------------------------------------------------------------------------
// Tipos internos
// ---------------------------------------------------------------------------

interface EnrollmentRow {
  student_id: string
}

interface ProfileRow {
  id: string
  full_name: string
}

interface CategoryRow {
  id: string
  name: string
}

// ---------------------------------------------------------------------------
// Página para registrar nueva evaluación (Server Component)
// ---------------------------------------------------------------------------

export default async function NewEvaluationPage() {
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
      <div className="max-w-lg">
        <Link
          href="/teacher/evaluations"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Volver a evaluaciones
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-6">
          Registrar evaluación
        </h1>
        <Card>
          <CardContent className="py-8 text-center">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <p className="text-gray-600">
              No hay un año escolar activo configurado.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // --- 2. Obtener salón del docente ---
  const { data: classroom } = await supabase
    .from('classrooms')
    .select('id, grade_id')
    .eq('teacher_id', user.id)
    .eq('school_year_id', currentYear.id)
    .maybeSingle()

  if (!classroom) {
    return (
      <div className="max-w-lg">
        <Link
          href="/teacher/evaluations"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Volver a evaluaciones
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-6">
          Registrar evaluación
        </h1>
        <Card>
          <CardContent className="py-8 text-center">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              No tenés un salón asignado para este año escolar.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // --- 3. Obtener estudiantes y categorías en paralelo ---
  const [
    { data: enrollmentData },
    { data: categoriesData },
  ] = await Promise.all([
    // Estudiantes matriculados activos
    supabase
      .from('enrollments')
      .select('student_id')
      .eq('classroom_id', classroom.id)
      .eq('school_year_id', currentYear.id)
      .eq('status', 'active'),

    // Categorías de evaluación del grado
    supabase
      .from('evaluation_categories')
      .select('id, name')
      .eq('grade_id', classroom.grade_id)
      .order('name'),
  ])

  const enrollments = (enrollmentData as EnrollmentRow[] | null) ?? []
  const categories = (categoriesData as CategoryRow[] | null) ?? []

  // --- 4. Obtener nombres de estudiantes ---
  const studentIds = enrollments.map((e) => e.student_id)
  let students: StudentOption[] = []

  if (studentIds.length > 0) {
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', studentIds)
      .order('full_name')

    const profiles = (profilesData as ProfileRow[] | null) ?? []
    students = profiles.map((p) => ({
      student_id: p.id,
      full_name: p.full_name,
    }))
  }

  // Mapear categorías
  const categoryOptions: CategoryOption[] = categories.map((c) => ({
    id: c.id,
    name: c.name,
  }))

  // --- 5. Vista ---
  return (
    <div className="max-w-lg">
      <Link
        href="/teacher/evaluations"
        className="text-sm text-blue-600 hover:underline"
      >
        ← Volver a evaluaciones
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-6">
        Registrar evaluación
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos de la evaluación</CardTitle>
        </CardHeader>
        <CardContent>
          <EvaluationForm
            students={students}
            categories={categoryOptions}
            classroomId={classroom.id}
            teacherId={user.id}
            mode="create"
            submitLabel="Registrar evaluación"
          />
        </CardContent>
      </Card>
    </div>
  )
}
