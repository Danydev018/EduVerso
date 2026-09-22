import Link from 'next/link'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import {
  getCurrentSchoolYear,
  getShipParts,
  getSubjects,
  getTopics,
  getActivityTemplates,
} from '@/lib/reference-data'
import { parseQuiz } from '@/lib/quiz'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, BookOpen, ArrowLeft } from 'lucide-react'
import { RepositoryBrowser, type BankEntry } from './_components/repository-browser'

export default async function ActivityRepositoryPage() {
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
    .select('id, grade_id, section, grades(name)')
    .eq('teacher_id', user.id)
    .eq('school_year_id', currentYear.id)
    .order('grade_id')
    .order('section')
    .limit(1)
    .maybeSingle<{
      id: string
      grade_id: number
      section: string
      grades: { name: string } | null
    }>()

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

  // Catálogo cacheado: no toca la base en cada visita.
  const [allSubjects, allTopics, templates, shipParts] = await Promise.all([
    getSubjects(),
    getTopics(),
    getActivityTemplates(),
    getShipParts(),
  ])

  // El repositorio se filtra al grado del salón: una evaluación de 6to no le
  // sirve a un docente de 1ro, y mostrarla solo ensucia la búsqueda.
  const subjects = allSubjects.filter((s) => s.grade_id === classroom.grade_id)
  const subjectById = new Map(subjects.map((s) => [s.id, s]))
  const topics = allTopics.filter((t) => subjectById.has(t.subject_id))
  const topicIds = topics.map((t) => t.id)

  if (topicIds.length === 0) {
    return (
      <EmptyRepository gradeName={classroom.grades?.name ?? 'tu grado'} />
    )
  }

  const [{ data: bankRows }, { data: asignadas }] = await Promise.all([
    supabase
      .from('activity_bank')
      .select('id, topic_id, template_id, ship_part_id, title, content, difficulty, created_by')
      .in('topic_id', topicIds)
      .order('title'),
    supabase
      .from('activities')
      .select('id, source_bank_id')
      .eq('classroom_id', classroom.id)
      .not('source_bank_id', 'is', null),
  ])

  // De cada evaluación del banco ya asignada: qué actividad la representa y
  // si algún alumno la completó (eso decide si todavía se puede quitar).
  const porBanco = new Map<string, { activityId: string }>()
  for (const a of asignadas ?? []) {
    porBanco.set(a.source_bank_id as string, { activityId: a.id as string })
  }

  const activityIds = Array.from(porBanco.values(), (v) => v.activityId)
  const completadosPorActividad = new Map<string, number>()
  const empezadosPorActividad = new Map<string, number>()

  if (activityIds.length > 0) {
    const { data: progreso } = await supabase
      .from('activity_progress')
      .select('activity_id, completed_at')
      .in('activity_id', activityIds)

    for (const fila of progreso ?? []) {
      const id = fila.activity_id as string
      if (fila.completed_at !== null) {
        completadosPorActividad.set(id, (completadosPorActividad.get(id) ?? 0) + 1)
      } else {
        empezadosPorActividad.set(id, (empezadosPorActividad.get(id) ?? 0) + 1)
      }
    }
  }
  const topicById = new Map(topics.map((t) => [t.id, t]))
  const templateById = new Map(templates.map((t) => [t.id, t]))
  const partById = new Map(shipParts.map((p) => [p.id, p]))

  const entries: BankEntry[] = (bankRows ?? []).map((row) => {
    const topic = topicById.get(row.topic_id)
    const subject = topic ? subjectById.get(topic.subject_id) : undefined
    const part = row.ship_part_id ? partById.get(row.ship_part_id) : undefined
    const preguntas = parseQuiz(row.content) ?? []

    return {
      id: row.id,
      title: row.title,
      difficulty: row.difficulty as BankEntry['difficulty'],
      subjectId: subject?.id ?? '',
      subjectName: subject?.name ?? 'Sin materia',
      topicName: topic?.name ?? 'Sin tema',
      templateName: templateById.get(row.template_id)?.name ?? 'Sin plantilla',
      part: part
        ? { id: part.id, name: part.name, icon: part.icon, color: part.color }
        : null,
      esPropia: row.created_by !== null,
      questions: preguntas.map((q) => ({
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
      })),
      asignacion: (() => {
        const asignada = porBanco.get(row.id)
        if (!asignada) return null
        return {
          activityId: asignada.activityId,
          completados: completadosPorActividad.get(asignada.activityId) ?? 0,
          enProgreso: empezadosPorActividad.get(asignada.activityId) ?? 0,
        }
      })(),
    }
  })

  const gradeName = classroom.grades?.name ?? ''

  if (entries.length === 0) return <EmptyRepository gradeName={gradeName} />

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/teacher/activities"
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-1"
          >
            <ArrowLeft className="w-3 h-3" />
            Actividades
          </Link>
          <h1 className="text-2xl font-bold text-foreground">
            Repositorio de evaluaciones
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {entries.length} evaluaciones listas para {gradeName} {classroom.section}.
            Cada una repara una pieza de la nave.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/teacher/activities/new">Crear la mía</Link>
        </Button>
      </div>

      <RepositoryBrowser
        entries={entries}
        subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
        parts={shipParts.map((p) => ({
          id: p.id,
          name: p.name,
          icon: p.icon,
          color: p.color,
        }))}
      />
    </div>
  )
}

function EmptyRepository({ gradeName }: { gradeName: string }) {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">
          Todavía no hay evaluaciones cargadas para {gradeName}.
        </p>
        <Button className="mt-4" asChild>
          <Link href="/teacher/activities/new">Crear una evaluación</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
