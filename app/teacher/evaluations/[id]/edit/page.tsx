import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getCurrentSchoolYear } from '@/lib/reference-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, BookOpen } from 'lucide-react'
import {
  EvaluationForm,
  type StudentOption,
  type CategoryOption,
  type EvaluationData,
} from '../../_components/evaluation-form'

// ---------------------------------------------------------------------------
// Tipos internos
// ---------------------------------------------------------------------------

interface EvaluationRow {
  id: string
  student_id: string
  classroom_id: string
  teacher_id: string
  category_id: string | null
  score: number
  max_score: number
  evaluation_date: string
  notes: string | null
}

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
// Página de edición de evaluación (Server Component)
// ---------------------------------------------------------------------------

export default async function EditEvaluationPage({
  params,
}: {
  params: { id: string }
}) {
  const user = await requireRole('teacher')
  const supabase = createClient()
  const evaluationId = params.id

  // --- 1. Obtener año escolar activo ---
  const currentYear = await getCurrentSchoolYear()

  if (!currentYear) {
    return (
      <div className="max-w-lg">
        <Link
          href="/teacher/evaluations"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Volver a evaluaciones
        </Link>
        <h1 className="text-2xl font-bold text-foreground mt-2 mb-6">
          Editar evaluación
        </h1>
        <Card>
          <CardContent className="py-8 text-center">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <p className="text-muted-foreground">
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
    // Un docente puede tener más de un salón (ej. 3ro A y 3ro B).
    // Sin ordenar y acotar, maybeSingle() devuelve error PGRST116 y el
    // panel le dice "no tienes salón asignado" aunque tenga varios.
    .order('grade_id')
    .order('section')
    .limit(1)
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
        <h1 className="text-2xl font-bold text-foreground mt-2 mb-6">
          Editar evaluación
        </h1>
        <Card>
          <CardContent className="py-8 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No tienes un salón asignado para este año escolar.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // --- 3. Obtener la evaluación a editar ---
  const { data: evaluationRaw } = await supabase
    .from('presential_evaluations')
    .select('*')
    .eq('id', evaluationId)
    .maybeSingle()

  const evaluation = evaluationRaw as EvaluationRow | null

  // Validar que la evaluación existe
  if (!evaluation) {
    redirect('/teacher/evaluations')
  }

  // Validar que la evaluación pertenece al salón del docente (defensa en profundidad)
  if (evaluation.classroom_id !== classroom.id) {
    redirect('/teacher/evaluations')
  }

  // --- 4. Obtener estudiantes y categorías en paralelo ---
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

  // --- 5. Obtener nombres de estudiantes ---
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

  // --- 6. Construir datos pre-llenados ---
  const evaluationData: EvaluationData = {
    id: evaluation.id,
    student_id: evaluation.student_id,
    category_id: evaluation.category_id ?? '',
    score: evaluation.score,
    max_score: evaluation.max_score,
    evaluation_date: evaluation.evaluation_date,
    notes: evaluation.notes ?? undefined,
  }

  // --- 7. Vista ---
  return (
    <div className="max-w-lg">
      <Link
        href="/teacher/evaluations"
        className="text-sm text-blue-600 hover:underline"
      >
        ← Volver a evaluaciones
      </Link>
      <h1 className="text-2xl font-bold text-foreground mt-2 mb-6">
        Editar evaluación
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
            evaluation={evaluationData}
            mode="edit"
            submitLabel="Guardar cambios"
          />
        </CardContent>
      </Card>
    </div>
  )
}
