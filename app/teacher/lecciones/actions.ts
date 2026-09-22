'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { LESSON_BUCKET } from '@/lib/lesson-media'
import type { LessonPage } from '@/app/student/lecciones/_components/lesson-reader'

type ActionState = { error: string | null }

/**
 * Lecciones que escribe el docente.
 *
 * El permiso lo resuelve la RLS de `topic_lessons`, que se apoya en
 * `teaches_topic()`: un docente solo puede escribir sobre temas del grado que
 * dicta. Acá no se repite la condición; se comprueba que la escritura haya
 * afectado alguna fila, que es la señal de que la política dejó pasar.
 */
export async function guardarLeccion(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole('teacher')
  const supabase = createClient()

  const topic_id = formData.get('topic_id') as string
  const title = ((formData.get('title') as string) ?? '').trim()
  const crudo = (formData.get('pages') as string) ?? '[]'

  if (!topic_id) return { error: 'Falta el tema.' }
  if (!title) return { error: 'La lección necesita un título.' }

  let pages: LessonPage[]
  try {
    pages = JSON.parse(crudo)
  } catch {
    return { error: 'No pudimos leer las páginas. Vuelve a intentar.' }
  }

  if (!Array.isArray(pages) || pages.length === 0) {
    return { error: 'Agrega al menos una página.' }
  }

  for (let i = 0; i < pages.length; i++) {
    if (!pages[i].title?.trim()) return { error: `La página ${i + 1} no tiene título.` }
    if (!pages[i].body?.trim()) return { error: `La página ${i + 1} no tiene texto.` }
  }

  // Upsert por tema: `topic_lessons_topic_unico` garantiza una sola lección
  // por tema, así que crear y editar son la misma operación.
  const { error, count } = await supabase
    .from('topic_lessons')
    .upsert({ topic_id, title, pages }, { onConflict: 'topic_id', count: 'exact' })

  if (error) {
    if (error.message.includes('row-level security')) {
      return { error: 'Ese tema no es de un grado que dictes.' }
    }
    return { error: error.message }
  }
  if (count === 0) return { error: 'No se pudo guardar. Revisa tus permisos.' }

  revalidatePath('/teacher/lecciones')
  revalidatePath(`/teacher/lecciones/${topic_id}`)
  revalidatePath(`/student/lecciones/${topic_id}`)
  return { error: null }
}

export async function borrarLeccion(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole('teacher')
  const supabase = createClient()

  const topic_id = formData.get('topic_id') as string
  if (!topic_id) return { error: 'Falta el tema.' }

  // Los archivos de la lección se borran primero, mientras todavía se sabe
  // cuáles eran. Si fallara la limpieza del bucket quedan archivos huérfanos
  // de unos kB; al revés, la lección quedaría apuntando a la nada.
  const { data: leccion } = await supabase
    .from('topic_lessons')
    .select('pages')
    .eq('topic_id', topic_id)
    .maybeSingle<{ pages: LessonPage[] }>()

  const rutas = (leccion?.pages ?? [])
    .flatMap((p) => [p.image, p.audio])
    .filter(Boolean) as string[]

  const { error, count } = await supabase
    .from('topic_lessons')
    .delete({ count: 'exact' })
    .eq('topic_id', topic_id)

  if (error) return { error: error.message }
  if (count === 0) return { error: 'Ese tema no es de un grado que dictes.' }

  if (rutas.length > 0) await supabase.storage.from(LESSON_BUCKET).remove(rutas)

  revalidatePath('/teacher/lecciones')
  revalidatePath(`/student/lecciones/${topic_id}`)
  return { error: null }
}
