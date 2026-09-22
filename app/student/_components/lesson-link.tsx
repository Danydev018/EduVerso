import Link from 'next/link'
import { BookOpen, ArrowRight } from 'lucide-react'

/**
 * Puerta de entrada a la lección ilustrada del tema.
 *
 * Se muestra junto al repaso y antes de las preguntas, que es el momento en
 * que sirve: cuando el alumno todavía no entendió y está por responder.
 *
 * Si el tema no tiene lección no aparece nada. Un botón que lleva a una
 * pantalla vacía es peor que no tener el botón.
 */
export function LessonLink({
  leccion,
  volverA,
}: {
  leccion: { topic_id: string; title: string } | null
  volverA: string
}) {
  if (!leccion) return null

  return (
    <Link
      href={`/student/lecciones/${leccion.topic_id}?volver=${encodeURIComponent(volverA)}`}
      className="flex items-center gap-3 rounded-2xl border-2 border-amber-200 bg-amber-50 px-4 py-3 hover:border-amber-300 hover:bg-amber-100 transition-colors group"
    >
      <span className="w-10 h-10 rounded-full bg-amber-400 grid place-items-center shrink-0">
        <BookOpen className="w-5 h-5 text-white" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-heading font-bold text-amber-900 leading-tight">
          {leccion.title}
        </span>
        <span className="block text-sm text-amber-700">
          ¿No lo tienes claro? Léelo con dibujos antes de empezar.
        </span>
      </span>
      <ArrowRight className="w-4 h-4 text-amber-600 shrink-0 group-hover:translate-x-0.5 transition-transform" />
    </Link>
  )
}
