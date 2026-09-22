import Link from 'next/link'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getCurrentSchoolYear } from '@/lib/reference-data'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookOpen, Plus, AlertCircle, ArrowRight, Library, Wrench } from 'lucide-react'
import { shipPartIcon } from '@/lib/ship-parts'

interface ActivityRow {
  id: string
  title: string
  status: 'draft' | 'active' | 'completed'
  available_from: string | null
  available_until: string | null
  created_at: string
  ship_parts: { name: string; icon: string; color: string } | null
}

interface ProgressRow {
  activity_id: string
  completed_at: string | null
}

export default async function TeacherActivitiesPage() {
  const user = await requireRole('teacher')
  const supabase = createClient()

  const currentYear = await getCurrentSchoolYear()

  if (!currentYear) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-muted-foreground">No hay un año escolar activo configurado.</p>
        </CardContent>
      </Card>
    )
  }

  const { data: classroom } = await supabase
    .from('classrooms')
    .select('id')
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
      <Card>
        <CardContent className="py-8 text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No tienes un salón asignado.</p>
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
      .select('id, title, status, available_from, available_until, created_at, ship_parts(name, icon, color)')
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

  // Un solo recorrido para contar completados por actividad, en vez de un
  // `filter` sobre todo el arreglo por cada actividad (O(actividades × progresos)).
  const completadosPorActividad = new Map<string, number>()
  for (const p of progressRows) {
    if (p.completed_at !== null) {
      completadosPorActividad.set(
        p.activity_id,
        (completadosPorActividad.get(p.activity_id) ?? 0) + 1,
      )
    }
  }

  const activitiesWithProgress = activities.map((a) => {
    const completados = completadosPorActividad.get(a.id) ?? 0
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
          <h1 className="text-2xl font-bold text-foreground">Actividades</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Gestiona las actividades de tu salón.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/teacher/activities/repositorio">
              <Library className="w-4 h-4 mr-1" />
              Repositorio
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/teacher/activities/new">
              <Plus className="w-4 h-4 mr-1" />
              Crear la mía
            </Link>
          </Button>
        </div>
      </div>

      {activitiesWithProgress.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Todavía no creaste ninguna actividad.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Elige una del repositorio o escribe la tuya.
            </p>
            <Button className="mt-4" asChild>
              <Link href="/teacher/activities/repositorio">
                <Library className="w-4 h-4 mr-1" />
                Ver el repositorio
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-card rounded-lg border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Título
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Repara
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Estado
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
                  Disponibilidad
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Completitud
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {activitiesWithProgress.map((a) => (
                <tr key={a.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium text-foreground">
                    {a.title}
                  </td>
                  <td className="px-4 py-3">
                    <ShipPartCell part={a.ship_parts} />
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
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {formatAvailability(a.available_from, a.available_until)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{a.porcentaje}%</span>
                      <span className="text-xs text-muted-foreground">
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

/** La pieza que repara la actividad, o un guion si el docente no eligió una. */
function ShipPartCell({
  part,
}: {
  part: { name: string; icon: string; color: string } | null
}) {
  if (!part) {
    return (
      <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
        <Wrench className="w-3.5 h-3.5" />
        Sin asignar
      </span>
    )
  }
  const Icon = shipPartIcon(part.icon)
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-foreground">
      <Icon className={`w-3.5 h-3.5 ${part.color}`} />
      {part.name}
    </span>
  )
}

function formatAvailability(from: string | null, until: string | null): string {
  if (!from && !until) return 'Siempre'
  const f = from ? new Date(from).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }) : '—'
  const u = until ? new Date(until).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }) : '—'
  return `${f} → ${u}`
}
