import type { SupabaseClient } from '@supabase/supabase-js'

export const LESSON_BUCKET = 'lesson-media'

/** Una hora alcanza de sobra para leer una lección. */
const VALIDA_SEGUNDOS = 3600

/**
 * Cambia las rutas del bucket por URLs firmadas.
 *
 * Mismo criterio que el repaso de las actividades: el bucket es privado y se
 * firma en el servidor, en lote, para no hacer un viaje por archivo.
 */
export async function firmarRutas(
  supabase: SupabaseClient,
  rutas: string[],
): Promise<Map<string, string>> {
  const unicas = Array.from(new Set(rutas.filter(Boolean)))
  if (unicas.length === 0) return new Map()

  const { data } = await supabase.storage
    .from(LESSON_BUCKET)
    .createSignedUrls(unicas, VALIDA_SEGUNDOS)

  const mapa = new Map<string, string>()
  for (const f of data ?? []) {
    // Un archivo que ya no existe vuelve con error y sin URL. Se omite: la
    // página se muestra sin la imagen, que es mejor que romper la lección.
    if (f.path && f.signedUrl) mapa.set(f.path, f.signedUrl)
  }
  return mapa
}
