import type { BriefingBlockView } from '@/lib/briefing'
import { Volume2 } from 'lucide-react'

/**
 * El repaso tal como lo recibe el alumno.
 *
 * Server Component: las URLs vienen firmadas desde el servidor y los controles
 * de audio son los nativos del navegador, así que no hace falta JavaScript
 * propio. En equipos lentos —el caso de esta escuela— eso importa.
 *
 * `variant` cambia solo la piel: 'student' usa la estética redondeada del
 * panel del alumno, 'plain' la sobria del panel del docente cuando prueba la
 * actividad.
 */
export function BriefingView({
  blocks,
  variant = 'student',
}: {
  blocks: BriefingBlockView[]
  variant?: 'student' | 'plain'
}) {
  if (blocks.length === 0) return null

  const esAlumno = variant === 'student'

  return (
    <section
      className={
        esAlumno
          ? 'rounded-2xl border-2 border-indigo-100 bg-white p-4 space-y-3'
          : 'rounded-lg border border-border bg-card p-4 space-y-3'
      }
      aria-label="Antes de empezar"
    >
      <h2
        className={
          esAlumno
            ? 'font-heading text-lg font-bold text-indigo-950'
            : 'text-sm font-semibold text-foreground'
        }
      >
        Antes de empezar
      </h2>

      {blocks.map((b) => (
        <div key={b.id} className="space-y-2">
          {b.kind === 'text' && (
            <p
              className={
                esAlumno
                  ? 'text-indigo-950 whitespace-pre-wrap'
                  : 'text-sm text-foreground whitespace-pre-wrap'
              }
            >
              {b.text_content}
            </p>
          )}

          {b.kind === 'image' && b.mediaUrl && (
            <figure className="space-y-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element -- URL firmada de Storage, fuera del optimizador */}
              <img
                src={b.mediaUrl}
                // La descripción escrita es el alt natural. Si el docente la
                // explicó en audio, el alt lo dice para que quien use lector
                // de pantalla sepa que hay una explicación reproducible.
                alt={b.text_content ?? 'Imagen explicada en el audio de abajo'}
                className={
                  esAlumno
                    ? 'w-full rounded-xl border border-indigo-100'
                    : 'max-h-64 rounded-md border border-border'
                }
              />
              {b.audioUrl && (
                <audio src={b.audioUrl} controls preload="none" className="h-9 w-full" />
              )}
              {b.text_content && (
                <figcaption
                  className={
                    esAlumno ? 'text-sm text-indigo-500' : 'text-xs text-muted-foreground'
                  }
                >
                  {b.text_content}
                </figcaption>
              )}
            </figure>
          )}

          {b.kind === 'audio' && b.mediaUrl && (
            <div className="space-y-1">
              <p
                className={
                  esAlumno
                    ? 'flex items-center gap-1.5 text-sm text-indigo-500'
                    : 'flex items-center gap-1.5 text-xs text-muted-foreground'
                }
              >
                <Volume2 className="w-3.5 h-3.5" />
                {b.text_content || 'Escucha a tu maestra'}
              </p>
              <audio src={b.mediaUrl} controls preload="none" className="h-9 w-full" />
            </div>
          )}
        </div>
      ))}
    </section>
  )
}
