import Link from 'next/link'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StudentFilters } from './_components/student-filters'

function calculateAge(birthDate: string): number {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

const STATUS_LABELS: Record<string, { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary' }> = {
  active: { label: 'Activo', variant: 'success' },
  promoted: { label: 'Promovido', variant: 'secondary' },
  retained: { label: 'Repitente', variant: 'warning' },
  withdrawn: { label: 'Retirado', variant: 'destructive' },
}

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: { q?: string; grade?: string; section?: string; status?: string }
}) {
  await requireRole('coordinator')
  const supabase = createClient()

  const [{ data: currentYear }, { data: grades }, { data: rawStudents }] = await Promise.all([
    supabase.from('school_years').select('id, name').eq('is_current', true).maybeSingle(),
    supabase.from('grades').select('id, name').order('id'),
    supabase.from('students').select(`
      id,
      birth_date,
      profiles!inner(full_name, is_active),
      enrollments(id, status, school_year_id, classrooms(id, section, grade_id, grades(id, name)))
    `),
  ])

  const students = (rawStudents ?? []).map((s) => {
    const profile = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles
    const currentEnrollment = s.enrollments?.find((e) => e.school_year_id === currentYear?.id) ?? null
    const classroom = currentEnrollment?.classrooms as any
    return {
      id: s.id,
      full_name: profile?.full_name ?? '',
      is_active: profile?.is_active ?? false,
      birth_date: s.birth_date,
      age: calculateAge(s.birth_date),
      enrollment: currentEnrollment
        ? {
            id: currentEnrollment.id,
            status: currentEnrollment.status,
            section: classroom?.section ?? '',
            grade_id: classroom?.grade_id ?? null,
            grade_name: classroom?.grades?.name ?? '',
          }
        : null,
    }
  })

  // Apply filters
  const { q, grade, section, status } = searchParams
  const filtered = students.filter((s) => {
    if (q && !s.full_name.toLowerCase().includes(q.toLowerCase())) return false
    if (grade && String(s.enrollment?.grade_id) !== grade) return false
    if (section && s.enrollment?.section !== section) return false
    if (status === 'inactive' && s.is_active) return false
    if (status === 'active' && !s.is_active) return false
    if (status && !['active', 'inactive'].includes(status) && s.enrollment?.status !== status) return false
    return true
  })

  const sections = Array.from(new Set(students.map((s) => s.enrollment?.section).filter(Boolean))).sort()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Alumnos</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{filtered.length} de {students.length} alumnos</p>
        </div>
        <Button asChild>
          <Link href="/coordinator/students/new">+ Nuevo alumno</Link>
        </Button>
      </div>

      <StudentFilters grades={grades ?? []} sections={sections as string[]} />

      <div className="glass-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[hsl(var(--border))]">
              <th className="text-left px-4 py-3 font-medium text-[hsl(var(--muted-foreground))]">Nombre</th>
              <th className="text-left px-4 py-3 font-medium text-[hsl(var(--muted-foreground))]">Edad</th>
              <th className="text-left px-4 py-3 font-medium text-[hsl(var(--muted-foreground))]">Grado / Sección</th>
              <th className="text-left px-4 py-3 font-medium text-[hsl(var(--muted-foreground))]">Estado</th>
              <th className="text-right px-4 py-3 font-medium text-[hsl(var(--muted-foreground))]">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[hsl(var(--border))]">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-10 text-[hsl(var(--muted-foreground))]">
                  No se encontraron alumnos
                </td>
              </tr>
            )}
            {filtered.map((student) => {
              const enrollStatus = student.enrollment?.status ?? (student.is_active ? 'active' : 'inactive')
              const statusInfo = STATUS_LABELS[enrollStatus] ?? { label: student.is_active ? 'Activo' : 'Inactivo', variant: student.is_active ? 'success' : 'secondary' }
              return (
                <tr key={student.id} className="hover:bg-[hsl(var(--primary)/0.03)] transition-colors">
                  <td className="px-4 py-3 font-medium text-[hsl(var(--foreground))]">{student.full_name}</td>
                  <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">{student.age} años</td>
                  <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">
                    {student.enrollment
                      ? `${student.enrollment.grade_name} — ${student.enrollment.section}`
                      : <span className="text-[hsl(var(--muted-foreground))] italic">Sin salón</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusInfo.variant as any}>{statusInfo.label}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/coordinator/students/${student.id}`}
                      className="text-[hsl(var(--primary))] hover:underline text-sm font-medium"
                    >
                      Ver / Editar
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
