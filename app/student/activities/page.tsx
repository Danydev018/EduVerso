import Link from 'next/link'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { StudentShell } from '../_components/student-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookOpen, Play, CheckCircle2, Clock, ArrowRight } from 'lucide-react'

interface ActivityRow {
  id: string
  title: string
  available_from: string | null
  available_until: string | null
}

interface ProgressRow {
  activity_id: string
  current_step: number
  completed_at: string | null
}

export default async function StudentActivitiesPage() {
  const user = await requireRole('student')
  const supabase = createClient()

  const { data: currentYear } = await supabase
    .from('school_years')
    .select('id')
    .eq('is_current', true)
    .maybeSingle()

  if (!currentYear) {
    return (
      <StudentShell userName={user.full_name} title="Tus actividades">
        <EmptyState message="No hay un año escolar activo todavía." />
      </StudentShell>
    )
  }

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('classroom_id')
    .eq('student_id', user.id)
    .eq('school_year_id', currentYear.id)
    .eq('status', 'active')
    .maybeSingle()

  if (!enrollment) {
    return (
      <StudentShell userName={user.full_name} title="Tus actividades">
        <EmptyState message="Todavía no tenés un salón asignado." />
      </StudentShell>
    )
  }

  const { data: activitiesData } = await supabase
    .from('activities')
    .select('id, title, available_from, available_until')
    .eq('classroom_id', enrollment.classroom_id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  const activities = (activitiesData as ActivityRow[] | null) ?? []

  const { data: progressData } = await supabase
    .from('activity_progress')
    .select('activity_id, current_step, completed_at')
    .eq('student_id', user.id)
    .in('activity_id', activities.map((a) => a.id).length > 0 ? activities.map((a) => a.id) : ['00000000-0000-0000-0000-000000000000'])

  const progressMap = new Map<string, ProgressRow>()
  for (const p of (progressData as ProgressRow[] | null) ?? []) {
    progressMap.set(p.activity_id, p)
  }

  return (
    <StudentShell userName={user.full_name} title="Tus actividades">
      {activities.length === 0 ? (
        <EmptyState message="Todavía no tenés actividades disponibles. ¡Volvé pronto!" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activities.map((a) => {
            const p = progressMap.get(a.id)
            const status: 'completed' | 'in_progress' | 'new' = p?.completed_at
              ? 'completed'
              : p
                ? 'in_progress'
                : 'new'
            return (
              <Card key={a.id} className="hover:border-blue-300 transition">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {a.title}
                    </h3>
                    <StatusBadge status={status} />
                  </div>
                  {a.available_until && (
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Hasta {new Date(a.available_until).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                    </p>
                  )}
                  <div className="mt-4">
                    {status === 'completed' ? (
                      <Button asChild variant="outline" className="w-full">
                        <Link href={`/student/activities/${a.id}`}>
                          Revisar
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Link>
                      </Button>
                    ) : (
                      <Button asChild className="w-full">
                        <Link href={`/student/activities/${a.id}`}>
                          <Play className="w-4 h-4 mr-1" />
                          {status === 'in_progress' ? 'Continuar' : 'Empezar'}
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </StudentShell>
  )
}

function StatusBadge({ status }: { status: 'completed' | 'in_progress' | 'new' }) {
  if (status === 'completed') {
    return (
      <Badge variant="success" className="whitespace-nowrap">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        Completa
      </Badge>
    )
  }
  if (status === 'in_progress') {
    return (
      <Badge variant="warning" className="whitespace-nowrap">
        En progreso
      </Badge>
    )
  }
  return (
    <Badge variant="secondary" className="whitespace-nowrap">
      Nueva
    </Badge>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">{message}</p>
      </CardContent>
    </Card>
  )
}
