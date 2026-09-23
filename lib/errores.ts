/**
 * Traduce un error del servidor a algo que se le pueda mostrar al usuario.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * POR QUÉ EXISTE ESTE ARCHIVO
 *
 * Las Server Actions devolvían el mensaje crudo de la librería:
 *
 *     if (error) return { error: error.message }
 *
 * y la pantalla lo pintaba tal cual. El 22 de septiembre de 2026 eso imprimió
 * la SUPABASE_SERVICE_ROLE_KEY completa en el panel de coordinación: la clave
 * guardada en Vercel traía un salto de línea, `fetch` la rechazó con
 * «Headers.set: "<la clave entera>" is an invalid header value», y ese texto
 * —clave incluida— viajó al navegador.
 *
 * Esa clave salta todas las políticas RLS. Un mensaje de error no puede ser
 * la vía por la que se escapa.
 *
 * El detalle completo no se pierde: se escribe en el registro del servidor,
 * donde sí hace falta para depurar y donde el usuario no llega.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * POR QUÉ NO ALCANZA CON CENSURAR LO QUE PAREZCA UNA CLAVE
 *
 * Se podría buscar y tachar lo que tenga forma de JWT. Pero eso obliga a
 * adivinar de antemano qué forma tendrá el próximo secreto que se filtre, y
 * basta equivocarse una vez. La regla segura es la inversa: al usuario solo
 * le llega texto que este archivo escribió, nunca texto que vino de afuera.
 */

/** Mensajes para las situaciones que el usuario sí puede resolver. */
const CONOCIDOS: ReadonlyArray<readonly [RegExp, string]> = [
  // Restricciones de contenido del material de repaso.
  [/imagen_con_descripcion/, 'La imagen necesita una explicación: graba un audio o escribe una descripción.'],
  [/texto_con_contenido/, 'El texto no puede estar vacío.'],
  [/audio_con_archivo/, 'Falta el archivo de audio.'],

  // RLS: la fila existe pero no es suya. No se detalla de quién es.
  [/row-level security|42501/, 'No tienes permiso para hacer eso.'],

  // Claves duplicadas y referencias rotas, en lenguaje de usuario.
  [/duplicate key|23505/, 'Ya existe un registro con esos datos.'],
  [/violates foreign key|23503/, 'Falta un dato relacionado, o el registro está en uso.'],
  [/not-null|23502/, 'Falta completar un campo obligatorio.'],

  // Credenciales de Auth.
  [/User already registered/, 'Ese correo ya está registrado.'],
  [/Password should be/, 'La contraseña es demasiado corta.'],
  [/Invalid login credentials/, 'Correo o contraseña incorrectos.'],
]

const GENERICO = 'No se pudo completar la operación. Intenta de nuevo; si persiste, avisa a soporte.'

/**
 * @param error    Lo que devolvió Supabase, Auth o el `catch`.
 * @param contexto Dónde ocurrió. Solo se usa en el registro del servidor.
 * @param respaldo Mensaje a mostrar si el error no es de los conocidos.
 */
export function mensajeDeError(error: unknown, contexto: string, respaldo = GENERICO): string {
  const crudo =
    typeof error === 'string'
      ? error
      : error instanceof Error
        ? error.message
        : typeof error === 'object' && error !== null && 'message' in error
          ? String((error as { message: unknown }).message)
          : String(error)

  // Al registro del servidor va todo; a la pantalla, nada de esto.
  console.error(`[${contexto}]`, error)

  for (const [patron, mensaje] of CONOCIDOS) {
    if (patron.test(crudo)) return mensaje
  }
  return respaldo
}
