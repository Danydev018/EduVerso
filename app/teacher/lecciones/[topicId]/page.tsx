import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getCurrentSchoolYear } from '@/lib/reference-data'
import { firmarRutas } from '@/lib/lesson-media'
import type { LessonPage } from '@/app/student/lecciones/_components/lesson-reader'
import { ArrowLeft } from 'lucide-react'
import { LessonEditor } from './_components/lesson-editor'

export default async function EditLessonPage({
  params,
}: {
  params: { topicId: string }
}) {
  const user = await requireRole('teacher')
  const supabase = createClient()

  const { data: tema } = await supabase
    .from('topics')
    .select('id, name, subjects(grade_id, name, grades(name))')
    .eq('id', params.topicId)
    .maybeSingle<{
      id: string
      name: string
      subjects: { grade_id: number; name: string; grades: { name: string } | null } | null
    }>()

  if (!tema?.subjects) notFound()

  // La RLS deja escribir solo sobre temas del grado que dicta; se comprueba
  // acá también para no ofrecerle un editor que al guardar va a rechazarlo.
  const currentYear = await getCurrentSchoolYear()
  const { data: classroom } = currentYear
    ? await supabase
        .from('classrooms')
        .select('id')
        .eq('teacher_id', user.id)
        .eq('school_year_id', currentYear.id)
        .eq('grade_id', tema.subjects.grade_id)
        .limit(1)
        .maybeSingle()
    : { data: null }

  if (!classroom) notFound()

  const { data: leccion } = await supabase
    .from('topic_lessons')
    .select('title, pages')
    .eq('topic_id', tema.id)
    .maybeSingle<{ title: string; pages: LessonPage[] }>()

  const paginas = leccion?.pages ?? []
  const firmas = await firmarRutas(
    supabase,
    paginas.flatMap((p) => [p.image, p.audio].filter(Boolean) as string[]),
  )

  // Más ancha en pantalla grande: esto es un editor, no un artículo, y el
  // lienzo de escenas necesita sitio. Los campos de texto se limitan ellos
  // mismos para no quedar con renglones ilegibles.
  return (
    <div className="space-y-5 max-w-3xl xl:max-w-5xl">
      <div>
        <Link
          href="/teacher/lecciones"
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-1"
        >
          <ArrowLeft className="w-3 h-3" />
          Lecciones
        </Link>
        <h1 className="text-2xl font-bold text-foreground">
          {leccion ? 'Editar lección' : 'Nueva lección'}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          El alumno la lee antes de responder. Una idea por página.
        </p>
      </div>

      <LessonEditor
        topicId={tema.id}
        topicName={tema.name}
        gradeName={tema.subjects.grades?.name ?? ''}
        initialTitle={leccion?.title ?? ''}
        initialPages={paginas.map((p) => ({
          ...p,
          imageUrl: p.image ? (firmas.get(p.image) ?? null) : null,
          audioUrl: p.audio ? (firmas.get(p.audio) ?? null) : null,
        }))}
      />
    </div>
  )
}
