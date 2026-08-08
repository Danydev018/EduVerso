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
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Salones</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {currentYear ? `Año escolar: ${currentYear.name}` : 'Sin año activo'} · {rows.length} salones
          </p>
        </div>
        <Button asChild>
          <Link href="/coordinator/classrooms/new">+ Nuevo salón</Link>
        </Button>
      </div>

      {!currentYear && (
        <div className="bg-[hsl(var(--accent)/0.1)] border border-[hsl(var(--accent)/0.3)] rounded-lg p-4 text-sm text-[hsl(var(--accent))]">
          No hay un año escolar activo.{' '}
          <Link href="/coordinator/school-years" className="underline font-medium">
            Crear o activar uno
          </Link>
          .
        </div>
      )}

      <div className="glass-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[hsl(var(--border))]">
              <th className="text-left px-4 py-3 font-medium text-[hsl(var(--muted-foreground))]">Grado</th>
              <th className="text-left px-4 py-3 font-medium text-[hsl(var(--muted-foreground))]">Sección</th>
              <th className="text-left px-4 py-3 font-medium text-[hsl(var(--muted-foreground))]">Docente</th>
              <th className="text-left px-4 py-3 font-medium text-[hsl(var(--muted-foreground))]">Alumnos activos</th>
              <th className="text-right px-4 py-3 font-medium text-[hsl(var(--muted-foreground))]">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[hsl(var(--border))]">
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-10 text-[hsl(var(--muted-foreground))]">
                  No hay salones creados para este año
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-[hsl(var(--primary)/0.03)] transition-colors">
                <td className="px-4 py-3 font-medium text-[hsl(var(--foreground))]">{row.grade_name}</td>
                <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">Sección {row.section}</td>
                <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">{row.teacher_name}</td>
                <td className="px-4 py-3">
                  <Badge variant={row.active_students > 0 ? 'secondary' : 'outline'}>
                    {row.active_students} alumnos
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/coordinator/classrooms/${row.id}`}
                    className="text-[hsl(var(--primary))] hover:underline text-sm font-medium"
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
