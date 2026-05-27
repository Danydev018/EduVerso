import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { AssignStudentForm } from './_components/assign-student-form'
import { RemoveStudentButton } from './_components/remove-student-button'

function calculateAge(birthDate: string): number {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export default async function ClassroomDetailPage({ params }: { params: { id: string } }) {
  await requireRole('coordinator')
  const supabase = createClient()

  const [{ data: classroom }, { data: currentYear }] = await Promise.all([
    supabase
      .from('classrooms')
      .select(`
        id, section, school_year_id,
        grades(id, name),
        profiles!classrooms_teacher_id_fkey(full_name),
        enrollments(
          id, status,
          students(id, birth_date, profiles(full_name))
        )
      `)
      .eq('id', params.id)
      .single(),
    supabase.from('school_years').select('id, name').eq('is_current', true).maybeSingle(),
  ])

  if (!classroom) notFound()

  const teacher = Array.isArray(classroom.profiles) ? classroom.profiles[0] : classroom.profiles
  const grade = classroom.grades as any
  const enrollments = (classroom.enrollments ?? []).map((e) => {
    const student = Array.isArray(e.students) ? e.students[0] : e.students
    const profile = student?.profiles ? (Array.isArray(student.profiles) ? student.profiles[0] : student.profiles) : null
    return {
      id: e.id,
      status: e.status,
      student_id: student?.id ?? '',
      full_name: profile?.full_name ?? '',
      age: student?.birth_date ? calculateAge(student.birth_date) : 0,
    }
  })

  const activeEnrollments = enrollments.filter((e) => e.status === 'active')

  // Students without a classroom this year (to assign)
  let availableStudents: { id: string; full_name: string }[] = []
  if (currentYear?.id === classroom.school_year_id) {
    const enrolledIds = enrollments.map((e) => e.student_id).filter(Boolean)
    const { data: allStudents } = await supabase
      .from('students')
      .select('id, profiles!inner(full_name)')
      .eq('profiles.is_active', true)

    // Get students already enrolled this year in any classroom
    const { data: alreadyEnrolled } = await supabase
      .from('enrollments')
      .select('student_id')
      .eq('school_year_id', currentYear?.id ?? '')

    const enrolledSet = new Set(alreadyEnrolled?.map((e) => e.student_id) ?? [])

    availableStudents = (allStudents ?? [])
      .filter((s) => !enrolledSet.has(s.id))
      .map((s) => {
        const p = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles
        return { id: s.id, full_name: (p as any)?.full_name ?? '' }
      })
      .sort((a, b) => a.full_name.localeCompare(b.full_name))
  }

  const isCurrentYear = currentYear?.id === classroom.school_year_id

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/coordinator/classrooms" className="text-sm text-blue-600 hover:underline">
          ← Volver a salones
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">
          {grade?.name} — Sección {classroom.section}
        </h1>
        <p className="text-gray-500 mt-1">
          Docente: {teacher?.full_name ?? '—'} · {activeEnrollments.length} alumnos activos
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <h2 className="font-semibold text-gray-700">Lista de alumnos</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-2 font-medium text-gray-600">Nombre</th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">Edad</th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">Estado</th>
              <th className="text-right px-4 py-2 font-medium text-gray-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {enrollments.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-8 text-gray-400">
                  No hay alumnos en este salón
                </td>
              </tr>
            )}
            {enrollments.map((e) => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 font-medium text-gray-900">
                  <Link href={`/coordinator/students/${e.student_id}`} className="hover:underline">
                    {e.full_name}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-gray-600">{e.age} años</td>
                <td className="px-4 py-2.5">
                  <Badge variant={
                    e.status === 'active' ? 'success' :
                    e.status === 'withdrawn' ? 'destructive' :
                    'secondary'
                  }>
                    {e.status === 'active' ? 'Activo' : e.status === 'withdrawn' ? 'Retirado' : e.status}
                  </Badge>
                </td>
                <td className="px-4 py-2.5 text-right">
                  {isCurrentYear && e.status === 'active' && (
                    <RemoveStudentButton enrollmentId={e.id} classroomId={params.id} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isCurrentYear && availableStudents.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-700 mb-4">Asignar alumno a este salón</h2>
          <AssignStudentForm
            classroomId={params.id}
            schoolYearId={currentYear?.id ?? ''}
            availableStudents={availableStudents}
          />
        </div>
      )}
    </div>
  )
}
