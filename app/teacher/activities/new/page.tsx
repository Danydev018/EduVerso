import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle, BookOpen } from 'lucide-react'
import { NewActivityForm } from './_components/new-activity-form'

export default async function NewActivityPage() {
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
    .select('id, grade_id')
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
    { data: templates },
    { data: subjects },
  ] = await Promise.all([
    supabase
      .from('activity_templates')
      .select('id, name, description, steps')
      .order('name'),
    supabase
      .from('subjects')
      .select('id, name')
      .eq('grade_id', classroom.grade_id)
      .order('name'),
  ])

  const subjectIds = (subjects ?? []).map((s) => s.id)

  let topics: { id: string; name: string; subject_id: string }[] = []
  if (subjectIds.length > 0) {
    const { data } = await supabase
      .from('topics')
      .select('id, name, subject_id')
      .in('subject_id', subjectIds)
      .order('order_index')
    topics = data ?? []
  }

  type TemplateStep = { title: string; xp_reward: number }

  const templateList = (templates ?? []).map((t) => {
    const steps = Array.isArray(t.steps) ? (t.steps as TemplateStep[]) : []
    return {
      id: t.id,
      name: t.name,
      description: t.description,
      stepCount: steps.length,
      xpTotal: steps.reduce((acc, s) => acc + (s.xp_reward ?? 0), 0) + 25,
    }
  })

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nueva actividad</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Creá una actividad a partir de una plantilla.
        </p>
      </div>

      <NewActivityForm
        templates={templateList}
        subjects={subjects ?? []}
        topics={topics}
      />
    </div>
  )
}
