import Link from 'next/link'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default async function ClassroomsPage() {
  await requireRole('coordinator')
  const supabase = createClient()

  const { data: currentYear } = await supabase
    .from('school_years')
    .select('id, name')
    .eq('is_current', true)
    .maybeSingle()

  const { data: classrooms } = await supabase
    .from('classrooms')
    .select(`
      id, section,
      grades(id, name),
      profiles!classrooms_teacher_id_fkey(full_name),
      enrollments(id, status)
    `)
    .eq('school_year_id', currentYear?.id ?? '')
    .order('section')

  const rows = (classrooms ?? []).map((c) => {
    const teacher = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles
    const activeCount = c.enrollments?.filter((e) => e.status === 'active').length ?? 0
    return {
      id: c.id,
      grade_name: (c.grades as any)?.name ?? '',
      section: c.section,
      teacher_name: teacher?.full_name ?? '—',
      active_students: activeCount,
    }
  }).sort((a, b) => {
    const gradeA = parseInt(a.grade_name) || 0
    const gradeB = parseInt(b.grade_name) || 0
    return gradeA !== gradeB ? gradeA - gradeB : a.section.localeCompare(b.section)
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Salones</h1>
          <p className="text-sm text-gray-500">
            {currentYear ? `Año escolar: ${currentYear.name}` : 'Sin año activo'} · {rows.length} salones
          </p>
        </div>
        <Button asChild>
          <Link href="/coordinator/classrooms/new">+ Nuevo salón</Link>
        </Button>
      </div>

      {!currentYear && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
          No hay un año escolar activo.{' '}
          <Link href="/coordinator/school-years" className="underline">
            Crear o activar uno
          </Link>
          .
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Grado</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Sección</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Docente</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Alumnos activos</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-10 text-gray-400">
                  No hay salones creados para este año
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{row.grade_name}</td>
                <td className="px-4 py-3 text-gray-600">Sección {row.section}</td>
                <td className="px-4 py-3 text-gray-600">{row.teacher_name}</td>
                <td className="px-4 py-3">
                  <Badge variant={row.active_students > 0 ? 'secondary' : 'outline'}>
                    {row.active_students} alumnos
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/coordinator/classrooms/${row.id}`}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Ver detalle
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
