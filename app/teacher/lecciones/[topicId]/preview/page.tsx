import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { firmarRutas } from '@/lib/lesson-media'
import {
  LessonReader,
  type LessonPage,
  type LessonPageView,
} from '@/app/student/lecciones/_components/lesson-reader'

/**
 * La lección como la ve el alumno, pero dentro del panel del docente.
 *
 * No se reutiliza `/student/lecciones/...` porque esa ruta exige rol de
 * alumno —el middleware y `requireRole` la cierran— y el docente terminaba
 * rebotado a su panel al pulsar "Ver como alumno". Misma solución que la
 * prueba de las actividades: una ruta propia que monta el mismo lector.
 */
export default async function PreviewLessonPage({
  params,
}: {
  params: { topicId: string }
}) {
  await requireRole('teacher')
  const supabase = createClient()

  const { data: leccion } = await supabase
    .from('topic_lessons')
    .select('title, pages')
    .eq('topic_id', params.topicId)
    .maybeSingle<{ title: string; pages: LessonPage[] }>()

  if (!leccion || !Array.isArray(leccion.pages) || leccion.pages.length === 0) {
    notFound()
  }

  const firmas = await firmarRutas(
    supabase,
    leccion.pages.flatMap((p) => [p.image, p.audio].filter(Boolean) as string[]),
  )

  const paginas: LessonPageView[] = leccion.pages.map((p) => ({
    ...p,
    imageUrl: p.image ? (firmas.get(p.image) ?? null) : null,
    audioUrl: p.audio ? (firmas.get(p.audio) ?? null) : null,
  }))

  return (
    <LessonReader
      titulo={leccion.title}
      paginas={paginas}
      volverA={`/teacher/lecciones/${params.topicId}`}
      volverTexto="Volver a editar"
    />
  )
}
