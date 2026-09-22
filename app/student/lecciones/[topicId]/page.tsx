import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { LessonReader, type LessonPage, type LessonPageView } from '../_components/lesson-reader'
import { firmarRutas } from '@/lib/lesson-media'

/**
 * Lección de un tema, a pantalla completa.
 *
 * Fuera de `StudentShell` a propósito: leer es otra cosa que navegar. Sin
 * barra superior ni botones flotantes, la pantalla queda para el texto y el
 * dibujo, como al abrir un libro.
 *
 * `volver` dice a dónde regresa al terminar: si llegó desde una actividad,
 * vuelve a esa actividad para ponerse a responder; si no, a su planeta.
 */
export default async function LessonPage({
  params,
  searchParams,
}: {
  params: { topicId: string }
  searchParams: { volver?: string }
}) {
  await requireRole('student')
  const supabase = createClient()

  const { data: leccion } = await supabase
    .from('topic_lessons')
    .select('title, pages, topics(name)')
    .eq('topic_id', params.topicId)
    .maybeSingle<{
      title: string
      pages: LessonPage[]
      topics: { name: string } | { name: string }[] | null
    }>()

  if (!leccion || !Array.isArray(leccion.pages) || leccion.pages.length === 0) {
    notFound()
  }

  // Solo se acepta una ruta interna: un `volver` con destino arbitrario
  // convertiría este enlace en un salto a cualquier sitio.
  const crudo = searchParams.volver ?? ''
  const volverA =
    crudo.startsWith('/student/') && !crudo.startsWith('//')
      ? crudo
      : '/student/activities'

  const vieneDeActividad = volverA.startsWith('/student/activities/')

  // Las páginas con foto o audio traen rutas del bucket; se firman en lote.
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
      volverA={volverA}
      volverTexto={vieneDeActividad ? '¡Listo, a responder!' : 'Terminar'}
    />
  )
}
