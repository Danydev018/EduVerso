import Link from 'next/link'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ToggleTeacherButton } from './_components/toggle-teacher-button'

export default async function TeachersPage() {
  await requireRole('coordinator')
  const supabase = createClient()

  const [{ data: teachers }, { data: currentYear }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, is_active').eq('role', 'teacher').order('full_name'),
    supabase.from('school_years').select('id').eq('is_current', true).maybeSingle(),
  ])

  // Get classrooms for current year to show teacher assignment
  let classroomsByTeacher: Record<string, string> = {}
  if (currentYear?.id) {
    const { data: classrooms } = await supabase
      .from('classrooms')
      .select('teacher_id, section, grades(name)')
      .eq('school_year_id', currentYear.id)

    classrooms?.forEach((c) => {
      const grade = (c.grades as any)?.name ?? ''
      classroomsByTeacher[c.teacher_id] = `${grade} — ${c.section}`
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Docentes</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{(teachers ?? []).length} docentes registrados</p>
        </div>
        <Button asChild>
          <Link href="/coordinator/teachers/new">+ Nuevo docente</Link>
        </Button>
      </div>

      <div className="glass-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[hsl(var(--border))]">
              <th className="text-left px-4 py-3 font-medium text-[hsl(var(--muted-foreground))]">Nombre</th>
              <th className="text-left px-4 py-3 font-medium text-[hsl(var(--muted-foreground))]">Salón asignado</th>
              <th className="text-left px-4 py-3 font-medium text-[hsl(var(--muted-foreground))]">Estado</th>
              <th className="text-right px-4 py-3 font-medium text-[hsl(var(--muted-foreground))]">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[hsl(var(--border))]">
            {(teachers ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-10 text-[hsl(var(--muted-foreground))]">
                  No hay docentes registrados
                </td>
              </tr>
            )}
            {(teachers ?? []).map((teacher) => (
              <tr key={teacher.id} className="hover:bg-[hsl(var(--primary)/0.03)] transition-colors">
                <td className="px-4 py-3 font-medium text-[hsl(var(--foreground))]">{teacher.full_name}</td>
                <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">
                  {classroomsByTeacher[teacher.id] ?? (
                    <span className="text-[hsl(var(--muted-foreground))] italic">Sin salón asignado</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={teacher.is_active ? 'success' : 'secondary'}>
                    {teacher.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <ToggleTeacherButton id={teacher.id} isActive={teacher.is_active} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
