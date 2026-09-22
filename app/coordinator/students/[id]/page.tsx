import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getCurrentSchoolYear } from '@/lib/reference-data'
import { Badge } from '@/components/ui/badge'
import { EditStudentForm } from './_components/edit-student-form'
import { StudentActions } from './_components/student-actions'

function calculateAge(birthDate: string): number {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export default async function StudentDetailPage({ params }: { params: { id: string } }) {
  await requireRole('coordinator')
  const supabase = createClient()

  const [{ data: studentData }, currentYear] = await Promise.all([
    supabase.from('students').select(`
      id, birth_date,
      profiles!inner(full_name, is_active),
      enrollments(id, status, school_year_id, classrooms(id, section, grades(id, name)))
    `).eq('id', params.id).single(),
    getCurrentSchoolYear(),
  ])

  if (!studentData) notFound()

  const profile = Array.isArray(studentData.profiles) ? studentData.profiles[0] : studentData.profiles
  const currentEnrollment = studentData.enrollments?.find((e) => e.school_year_id === currentYear?.id) ?? null
  const classroom = currentEnrollment?.classrooms as any

  const student = {
    id: studentData.id,
    full_name: profile?.full_name ?? '',
    is_active: profile?.is_active ?? false,
    birth_date: studentData.birth_date,
    age: calculateAge(studentData.birth_date),
    enrollment: currentEnrollment
      ? {
          id: currentEnrollment.id,
          status: currentEnrollment.status,
          section: classroom?.section ?? '',
          grade_name: classroom?.grades?.name ?? '',
        }
      : null,
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/coordinator/students" className="text-sm text-[hsl(var(--primary))] hover:underline">
          ← Volver a alumnos
        </Link>
        <div className="flex items-center gap-3 mt-2">
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">{student.full_name}</h1>
          <Badge variant={student.is_active ? 'success' : 'secondary'}>
            {student.is_active ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>
        <p className="text-[hsl(var(--muted-foreground))] mt-1">{student.age} años</p>
      </div>

      <div className="glass-card p-4 space-y-2">
        <h2 className="font-semibold text-[hsl(var(--foreground))]">Matrícula actual</h2>
        {student.enrollment ? (
          <div className="text-sm text-[hsl(var(--muted-foreground))] space-y-1">
            <p>
              <span className="font-medium">Salón:</span>{' '}
              {student.enrollment.grade_name} — Sección {student.enrollment.section}
            </p>
            <p>
              <span className="font-medium">Estado:</span>{' '}
              <Badge variant={
                student.enrollment.status === 'active' ? 'success' :
                student.enrollment.status === 'withdrawn' ? 'destructive' : 'secondary'
              } className="ml-1">
                {student.enrollment.status}
              </Badge>
            </p>
          </div>
        ) : (
          <p className="text-sm text-[hsl(var(--muted-foreground))] italic">Sin matrícula en el año activo</p>
        )}
      </div>

      <EditStudentForm student={student} />

      <StudentActions
        studentId={student.id}
        isActive={student.is_active}
        enrollmentId={student.enrollment?.id ?? null}
        enrollmentStatus={student.enrollment?.status ?? null}
      />
    </div>
  )
}
