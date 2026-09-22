import type { SupabaseClient } from '@supabase/supabase-js'

export const BRIEFING_BUCKET = 'activity-media'

/** Vida de las URLs firmadas. Alcanza de sobra para leer el repaso y hace que
 *  un enlace copiado no sirva de mucho rato fuera de la aplicación. */
const URL_VALIDA_SEGUNDOS = 3600

export type BriefingKind = 'text' | 'image' | 'audio'

export interface BriefingBlock {
  id: string
  kind: BriefingKind
  order_index: number
  text_content: string | null
  media_path: string | null
  audio_path: string | null
}

/** Un bloque con las rutas ya resueltas a URLs que el navegador puede abrir. */
export interface BriefingBlockView extends BriefingBlock {
  mediaUrl: string | null
  audioUrl: string | null
}

/**
 * Cambia las rutas del bucket por URLs firmadas.
 *
 * El bucket es privado: el audio lo graba una persona real hablándole a sus
 * alumnos, así que no puede quedar accesible para cualquiera que tenga el
 * enlace. Se firman en el servidor, con la sesión del usuario, de modo que la
 * RLS del bucket decide qué se puede firmar.
 *
 * Las firmas se piden en lote (`createSignedUrls`) y no una por archivo: un
 * repaso con seis imágenes serían doce viajes de ida y vuelta.
 */
export async function withSignedUrls(
  supabase: SupabaseClient,
  blocks: BriefingBlock[],
): Promise<BriefingBlockView[]> {
  const rutas = Array.from(
    new Set(
      blocks.flatMap((b) => [b.media_path, b.audio_path].filter(Boolean) as string[]),
    ),
  )

  if (rutas.length === 0) {
    return blocks.map((b) => ({ ...b, mediaUrl: null, audioUrl: null }))
  }

  const { data } = await supabase.storage
    .from(BRIEFING_BUCKET)
    .createSignedUrls(rutas, URL_VALIDA_SEGUNDOS)

  const porRuta = new Map<string, string>()
  for (const firma of data ?? []) {
    // `createSignedUrls` no falla entera si un archivo no existe: devuelve esa
    // entrada con error y signedUrl null. Se omite y el bloque se muestra sin
    // el medio, en vez de romper todo el repaso por un archivo perdido.
    if (firma.path && firma.signedUrl) porRuta.set(firma.path, firma.signedUrl)
  }

  return blocks.map((b) => ({
    ...b,
    mediaUrl: b.media_path ? (porRuta.get(b.media_path) ?? null) : null,
    audioUrl: b.audio_path ? (porRuta.get(b.audio_path) ?? null) : null,
  }))
}

/** Lee el repaso de una actividad, ya listo para mostrar. */
export async function getBriefing(
  supabase: SupabaseClient,
  activityId: string,
): Promise<BriefingBlockView[]> {
  const { data } = await supabase
    .from('activity_briefing_blocks')
    .select('id, kind, order_index, text_content, media_path, audio_path')
    .eq('activity_id', activityId)
    .order('order_index')

  return withSignedUrls(supabase, (data as BriefingBlock[] | null) ?? [])
}
