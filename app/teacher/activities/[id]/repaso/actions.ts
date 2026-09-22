'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { BRIEFING_BUCKET } from '@/lib/briefing'

type ActionState = { error: string | null }

/**
 * Bloques del repaso previo.
 *
 * Los permisos los resuelve la RLS de `activity_briefing_blocks`, que se apoya
 * en `can_edit_activity()`. Acá no se repite ese chequeo: se comprueba que la
 * escritura haya afectado alguna fila, que es la señal de que la RLS dejó
 * pasar. Repetir la condición en dos lugares es lo que hace que después se
 * desincronicen.
 */

function revalidar(activityId: string) {
  revalidatePath(`/teacher/activities/${activityId}/repaso`)
  revalidatePath(`/teacher/activities/${activityId}/preview`)
  revalidatePath(`/student/activities/${activityId}`)
}

export async function addTextBlock(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole('teacher')
  const supabase = createClient()

  const activity_id = formData.get('activity_id') as string
  const texto = ((formData.get('text_content') as string) ?? '').trim()

  if (!activity_id) return { error: 'Falta la actividad.' }
  if (!texto) return { error: 'Escribe algo antes de agregarlo.' }

  const { error } = await supabase.from('activity_briefing_blocks').insert({
    activity_id,
    kind: 'text',
    text_content: texto,
    order_index: await siguienteOrden(supabase, activity_id),
  })

  if (error) return { error: mensaje(error.message) }

  revalidar(activity_id)
  return { error: null }
}

/**
 * Registra un archivo que el navegador ya subió al bucket.
 *
 * La subida ocurre en el cliente, directo contra Storage: pasar un audio o una
 * foto por un Server Action significaría cargarlo entero en memoria del
 * servidor y volver a subirlo. El cliente sube y acá solo se guarda la ruta,
 * que la RLS del bucket ya autorizó.
 */
export async function addMediaBlock(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole('teacher')
  const supabase = createClient()

  const activity_id = formData.get('activity_id') as string
  const kind = formData.get('kind') as 'image' | 'audio'
  const media_path = formData.get('media_path') as string
  const audio_path = (formData.get('audio_path') as string) || null
  const text_content = ((formData.get('text_content') as string) ?? '').trim() || null

  if (!activity_id || !media_path) return { error: 'Falta el archivo.' }
  if (kind !== 'image' && kind !== 'audio') return { error: 'Tipo de bloque inválido.' }

  // La base también lo exige (constraint imagen_con_descripcion), pero acá el
  // mensaje puede explicar qué hacer en vez de mostrar un error de Postgres.
  if (kind === 'image' && !audio_path && !text_content) {
    return {
      error: 'La imagen necesita una explicación: graba un audio o escribe una descripción.',
    }
  }

  const { error } = await supabase.from('activity_briefing_blocks').insert({
    activity_id,
    kind,
    media_path,
    audio_path,
    text_content,
    order_index: await siguienteOrden(supabase, activity_id),
  })

  if (error) return { error: mensaje(error.message) }

  revalidar(activity_id)
  return { error: null }
}

export async function deleteBriefingBlock(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole('teacher')
  const supabase = createClient()

  const activity_id = formData.get('activity_id') as string
  const block_id = formData.get('block_id') as string
  if (!activity_id || !block_id) return { error: 'Falta el bloque.' }

  const { data: bloque } = await supabase
    .from('activity_briefing_blocks')
    .select('media_path, audio_path')
    .eq('id', block_id)
    .maybeSingle<{ media_path: string | null; audio_path: string | null }>()

  const { error, count } = await supabase
    .from('activity_briefing_blocks')
    .delete({ count: 'exact' })
    .eq('id', block_id)

  if (error) return { error: mensaje(error.message) }
  if (count === 0) return { error: 'Ese bloque no es de tu actividad.' }

  // Los archivos se borran DESPUÉS de la fila y sin cortar por el error: si
  // la limpieza del bucket falla, queda un archivo huérfano de unos pocos
  // kB, molesto pero inofensivo. Al revés —borrar el archivo y que falle la
  // fila— el alumno vería un bloque roto.
  const rutas = [bloque?.media_path, bloque?.audio_path].filter(Boolean) as string[]
  if (rutas.length > 0) {
    await supabase.storage.from(BRIEFING_BUCKET).remove(rutas)
  }

  revalidar(activity_id)
  return { error: null }
}

/** Mueve un bloque una posición arriba o abajo intercambiando el orden. */
export async function moveBriefingBlock(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole('teacher')
  const supabase = createClient()

  const activity_id = formData.get('activity_id') as string
  const block_id = formData.get('block_id') as string
  const direccion = formData.get('direction') as 'up' | 'down'
  if (!activity_id || !block_id) return { error: 'Falta el bloque.' }

  const { data: bloques } = await supabase
    .from('activity_briefing_blocks')
    .select('id, order_index')
    .eq('activity_id', activity_id)
    .order('order_index')

  if (!bloques) return { error: 'No pudimos reordenar el repaso.' }

  const i = bloques.findIndex((b) => b.id === block_id)
  const j = direccion === 'up' ? i - 1 : i + 1
  if (i < 0 || j < 0 || j >= bloques.length) return { error: null }

  // Se reescriben los índices de toda la lista ya intercambiada. Los valores
  // pueden venir repetidos o con huecos de operaciones previas, así que
  // renumerar es más confiable que intercambiar solo dos.
  const orden = bloques.map((b) => b.id)
  ;[orden[i], orden[j]] = [orden[j], orden[i]]

  for (let k = 0; k < orden.length; k++) {
    await supabase
      .from('activity_briefing_blocks')
      .update({ order_index: k })
      .eq('id', orden[k])
  }

  revalidar(activity_id)
  return { error: null }
}

async function siguienteOrden(
  supabase: ReturnType<typeof createClient>,
  activityId: string,
): Promise<number> {
  const { data } = await supabase
    .from('activity_briefing_blocks')
    .select('order_index')
    .eq('activity_id', activityId)
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle<{ order_index: number }>()

  return (data?.order_index ?? -1) + 1
}

/** Traduce los errores de las restricciones a algo accionable. */
function mensaje(raw: string): string {
  if (raw.includes('imagen_con_descripcion')) {
    return 'La imagen necesita una explicación: graba un audio o escribe una descripción.'
  }
  if (raw.includes('texto_con_contenido')) return 'El texto no puede estar vacío.'
  if (raw.includes('audio_con_archivo')) return 'Falta el archivo de audio.'
  if (raw.includes('row-level security')) return 'Esa actividad no es de tu salón.'
  return raw
}

/**
 * Edita un bloque ya guardado.
 *
 * Hasta ahora el repaso solo se podía armar y desarmar: para cambiar una foto
 * mal encuadrada o corregir una descripción había que borrar el bloque y
 * volver a empezar, perdiendo también el audio grabado.
 *
 * Los archivos nuevos ya vienen subidos por el navegador (mismo motivo que en
 * `addMediaBlock`); acá se intercambian las rutas y se borran las viejas.
 * Un campo ausente en el formulario significa "no lo toques", que es lo que
 * permite cambiar solo la descripción sin resubir la imagen.
 */
export async function updateBriefingBlock(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole('teacher')
  const supabase = createClient()

  const activity_id = formData.get('activity_id') as string
  const block_id = formData.get('block_id') as string
  if (!activity_id || !block_id) return { error: 'Falta el bloque.' }

  const { data: actual } = await supabase
    .from('activity_briefing_blocks')
    .select('kind, text_content, media_path, audio_path')
    .eq('id', block_id)
    .maybeSingle<{
      kind: 'text' | 'image' | 'audio'
      text_content: string | null
      media_path: string | null
      audio_path: string | null
    }>()

  if (!actual) return { error: 'Ese bloque ya no existe.' }

  const nuevoTexto = formData.get('text_content')
  const nuevoMedio = formData.get('media_path') as string | null
  const nuevoAudio = formData.get('audio_path') as string | null
  // Marca explícita para distinguir "no lo toques" de "quítalo": sin esto,
  // borrar el audio de una imagen sería indistinguible de no enviarlo.
  const quitarAudio = formData.get('quitar_audio') === '1'

  const texto =
    nuevoTexto === null ? actual.text_content : (nuevoTexto as string).trim() || null
  const medio = nuevoMedio || actual.media_path
  const audio = quitarAudio ? null : nuevoAudio || actual.audio_path

  if (actual.kind === 'image' && !audio && !texto) {
    return {
      error: 'La imagen necesita una explicación: graba un audio o escribe una descripción.',
    }
  }

  const { error, count } = await supabase
    .from('activity_briefing_blocks')
    .update({ text_content: texto, media_path: medio, audio_path: audio }, { count: 'exact' })
    .eq('id', block_id)

  if (error) return { error: mensaje(error.message) }
  if (count === 0) return { error: 'Ese bloque no es de tu actividad.' }

  // Recién ahora se borran los archivos reemplazados: si la fila no se
  // hubiera actualizado, el alumno vería un bloque apuntando a la nada.
  const huerfanos = [
    nuevoMedio && actual.media_path !== nuevoMedio ? actual.media_path : null,
    (quitarAudio || (nuevoAudio && actual.audio_path !== nuevoAudio)) ? actual.audio_path : null,
  ].filter(Boolean) as string[]

  if (huerfanos.length > 0) {
    await supabase.storage.from(BRIEFING_BUCKET).remove(huerfanos)
  }

  revalidar(activity_id)
  return { error: null }
}
