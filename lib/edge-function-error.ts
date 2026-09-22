import { FunctionsHttpError } from '@supabase/supabase-js'

/**
 * `supabase.functions.invoke()` en respuestas no-2xx siempre pone en
 * `error.message` el string genérico "Edge Function returned a non-2xx
 * status code" — el mensaje real que arma la función (ver `fail()` en
 * supabase/functions/*​/index.ts) queda solo en `error.context`, que es el
 * Response crudo. Sin esto, ese string de la SDK se le mostraba tal cual al
 * alumno en pantalla.
 */
export async function getEdgeFunctionErrorMessage(
  error: unknown,
  fallback: string,
): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.clone().json()
      if (typeof body?.error === 'string' && body.error) return body.error
    } catch {
      // el body no era JSON parseable — usar el fallback
    }
  }
  return fallback
}
