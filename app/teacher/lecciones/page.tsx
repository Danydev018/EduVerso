import Link from 'next/link'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getCurrentSchoolYear, getSubjects, getTopics } from '@/lib/reference-data'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, BookOpen, Pencil, Plus, ArrowRight } from 'lucide-react'

/**
 * Los temas del grado del docente, con su lección si la tiene.
 *
 * Se lista por tema y no por lección para que el vacío se vea: lo que importa
 * es qué temas todavía no tienen material, no cuántas lecciones hay.
 */
export default async function TeacherLessonsPage() {
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
    .select('grade_id, section, grades(name)')
    .eq('teacher_id', user.id)
    .eq('school_year_id', currentYear.id)
    .order('grade_id')
    .order('section')
    .limit(1)
    .maybeSingle<{ grade_id: number; section: string; grades: { name: string } | null }>()

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

  const [allSubjects, allTopics] = await Promise.all([getSubjects(), getTopics()])
  const subjects = allSubjects.filter((s) => s.grade_id === classroom.grade_id)
  const subjectById = new Map(subjects.map((s) => [s.id, s]))
  const topics = allTopics.filter((t) => subjectById.has(t.subject_id))

  const { data: lecciones } = await supabase
    .from('topic_lessons')
    .select('topic_id, title, pages')
    .in('topic_id', topics.length > 0 ? topics.map((t) => t.id) : ['00000000-0000-0000-0000-000000000000'])

  const porTema = new Map(
    (lecciones ?? []).map((l) => [
      l.topic_id as string,
      { title: l.title as string, paginas: Array.isArray(l.pages) ? l.pages.length : 0 },
    ]),
  )

  const porMateria = subjects.map((s) => ({
    materia: s.name,
    temas: topics.filter((t) => t.subject_id === s.id),
  }))

  const conLeccion = topics.filter((t) => porTema.has(t.id)).length

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Lecciones</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Material de lectura para {classroom.grades?.name} {classroom.section}.
          Puedes usar los dibujos que ya existen o subir tus propias fotos y audios.
        </p>
        <p className="text-sm mt-2">
          <span className="font-semibold text-foreground">{conLeccion}</span>
          <span className="text-muted-foreground"> de {topics.length} temas con lección</span>
        </p>
      </div>

      <div className="space-y-5">
        {porMateria.map(({ materia, temas }) => (
          <div key={materia}>
            <h2 className="text-sm font-semibold text-muted-foreground mb-2">{materia}</h2>
            <div className="grid gap-2 md:grid-cols-2">
              {temas.map((t) => {
                const l = porTema.get(t.id)
                return (
                  <Link
                    key={t.id}
                    href={`/teacher/lecciones/${t.id}`}
                    className="rounded-lg border border-border bg-card p-3 hover:bg-muted/50 transition-colors flex items-center gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{t.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {l ? `${l.title} · ${l.paginas} ${l.paginas === 1 ? 'página' : 'páginas'}` : 'Sin lección todavía'}
                      </p>
                    </div>
                    {l ? (
                      <Badge variant="success" className="shrink-0">
                        <Pencil className="w-3 h-3 mr-1" />
                        Editar
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="shrink-0">
                        <Plus className="w-3 h-3 mr-1" />
                        Crear
                      </Badge>
                    )}
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
