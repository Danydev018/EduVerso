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
          <h1 className="text-2xl font-bold text-gray-900">Docentes</h1>
          <p className="text-sm text-gray-500">{(teachers ?? []).length} docentes registrados</p>
        </div>
        <Button asChild>
          <Link href="/coordinator/teachers/new">+ Nuevo docente</Link>
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Salón asignado</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(teachers ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-10 text-gray-400">
                  No hay docentes registrados
                </td>
              </tr>
            )}
            {(teachers ?? []).map((teacher) => (
              <tr key={teacher.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{teacher.full_name}</td>
                <td className="px-4 py-3 text-gray-600">
                  {classroomsByTeacher[teacher.id] ?? (
                    <span className="text-gray-400 italic">Sin salón asignado</span>
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
