import Link from 'next/link'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookOpen, Plus, AlertCircle, ArrowRight } from 'lucide-react'

interface ActivityRow {
  id: string
  title: string
  status: 'draft' | 'active' | 'completed'
  available_from: string | null
  available_until: string | null
  created_at: string
}

interface ProgressRow {
  activity_id: string
  completed_at: string | null
}

export default async function TeacherActivitiesPage() {
  const user = await requireRole('teacher')
  const supabase = createClient()

  const { data: currentYear } = await supabase
    .from('school_years')
    .select('id, name')
    .eq('is_current', true)
    .maybeSingle()

  if (!currentYear) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-600">No hay un año escolar activo configurado.</p>
        </CardContent>
      </Card>
    )
  }

  const { data: classroom } = await supabase
    .from('classrooms')
    .select('id')
    .eq('teacher_id', user.id)
    .eq('school_year_id', currentYear.id)
    .maybeSingle()

  if (!classroom) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No tenés un salón asignado.</p>
        </CardContent>
      </Card>
    )
  }

  const [
    { count: studentCount },
    { data: activitiesData },
  ] = await Promise.all([
    supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('classroom_id', classroom.id)
      .eq('status', 'active'),
    supabase
      .from('activities')
      .select('id, title, status, available_from, available_until, created_at')
      .eq('classroom_id', classroom.id)
      .order('created_at', { ascending: false }),
  ])

  const activities = (activitiesData as ActivityRow[] | null) ?? []
  const totalEstudiantes = studentCount ?? 0

  let progressRows: ProgressRow[] = []
  if (activities.length > 0) {
    const { data } = await supabase
      .from('activity_progress')
      .select('activity_id, completed_at')
      .in('activity_id', activities.map((a) => a.id))
    progressRows = (data as ProgressRow[] | null) ?? []
  }

  const activitiesWithProgress = activities.map((a) => {
    const rows = progressRows.filter((p) => p.activity_id === a.id)
    const completados = rows.filter((p) => p.completed_at !== null).length
    const porcentaje =
      totalEstudiantes > 0
        ? Math.round((completados / totalEstudiantes) * 100)
        : 0
    return { ...a, completados, porcentaje }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Actividades</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Gestioná las actividades de tu salón.
          </p>
        </div>
        <Button asChild>
          <Link href="/teacher/activities/new">
            <Plus className="w-4 h-4 mr-1" />
            Nueva actividad
          </Link>
        </Button>
      </div>

      {activitiesWithProgress.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Todavía no creaste ninguna actividad.</p>
            <p className="text-sm text-gray-400 mt-2">
              Empezá creando una para tu salón.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Título
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Estado
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">
                  Disponibilidad
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Completitud
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {activitiesWithProgress.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {a.title}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        a.status === 'active'
                          ? 'success'
                          : a.status === 'completed'
                            ? 'secondary'
                            : 'warning'
                      }
                    >
                      {a.status === 'active'
                        ? 'Activa'
                        : a.status === 'completed'
                          ? 'Cerrada'
                          : 'Borrador'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {formatAvailability(a.available_from, a.available_until)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{a.porcentaje}%</span>
                      <span className="text-xs text-gray-400">
                        ({a.completados}/{totalEstudiantes})
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/teacher/activities/${a.id}`}
                      className="text-blue-600 hover:underline text-sm inline-flex items-center gap-1"
                    >
                      Ver detalle
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function formatAvailability(from: string | null, until: string | null): string {
  if (!from && !until) return 'Siempre'
  const f = from ? new Date(from).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }) : '—'
  const u = until ? new Date(until).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }) : '—'
  return `${f} → ${u}`
}
