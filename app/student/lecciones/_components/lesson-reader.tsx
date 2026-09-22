'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ArrowRight, ArrowLeft, BookOpen, Check, Volume2 } from 'lucide-react'
import { LessonScene } from './lesson-scenes'
import { CustomScene } from './custom-scene'
import type { EscenaDoc } from '@/lib/scene-doc'

export interface LessonPage {
  /** Id de una escena del catálogo. */
  art?: string
  title: string
  body: string
  labels?: string[]
  values?: number[]
  /** Ruta en el bucket `lesson-media`, para lo que ninguna escena explica. */
  image?: string
  audio?: string
  /** Escena que el docente armó en el lienzo. Ver lib/scene-doc.ts. */
  escena?: EscenaDoc
}

/** La misma página con las rutas ya resueltas a URLs que el navegador abre. */
export interface LessonPageView extends LessonPage {
  imageUrl?: string | null
  audioUrl?: string | null
}

/**
 * Lector de la lección, página por página.
 *
 * Avanza con un botón y no con temporizador, igual que la cinemática de
 * apertura: un alumno que lee despacio no debería pelear con una animación
 * que se le adelanta.
 *
 * El texto manda sobre el dibujo. La ilustración va arriba, acotada, y el
 * cuerpo del texto usa medida de lectura (unos 60 caracteres) y tamaño
 * grande, porque esto se lee como un libro y no como una interfaz.
 */
export function LessonReader({
  titulo,
  paginas,
  volverA,
  volverTexto,
}: {
  titulo: string
  paginas: LessonPageView[]
  volverA: string
  volverTexto: string
}) {
  const [i, setI] = useState(0)
  const pagina = paginas[i]
  const ultima = i === paginas.length - 1

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-indigo-50 to-white">
      <header className="flex items-center justify-between gap-3 px-4 py-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-indigo-900 min-w-0">
          <BookOpen className="w-4 h-4 shrink-0 text-indigo-500" />
          <span className="truncate">{titulo}</span>
        </p>
        <Link
          href={volverA}
          className="text-sm text-indigo-500 hover:text-indigo-800 shrink-0 px-2 py-1"
        >
          Salir
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-4">
        <div className="w-full max-w-xl">
          {/* Una página lleva UNA ilustración: la escena si la hay, y si no,
              la foto o el audio que el docente subió. Dos cosas compitiendo
              arriba le quitarían el foco al texto. */}
          {pagina.escena ? (
            <div className="rounded-3xl bg-white border-2 border-indigo-100 p-3 mb-5">
              <div key={i} className="w-full aspect-[400/220]">
                <CustomScene doc={pagina.escena} />
              </div>
            </div>
          ) : pagina.art ? (
            <div className="rounded-3xl bg-white border-2 border-indigo-100 p-3 mb-5">
              {/* key: al cambiar de página el SVG se vuelve a montar y las
                  animaciones de entrada arrancan de nuevo. Sin esto, la
                  segunda vez que aparece una escena ya está "terminada". */}
              <LessonScene
                key={i}
                art={pagina.art}
                labels={pagina.labels}
                values={pagina.values}
              />
            </div>
          ) : pagina.imageUrl ? (
            <div className="rounded-3xl bg-white border-2 border-indigo-100 p-3 mb-5">
              {/* eslint-disable-next-line @next/next/no-img-element -- URL firmada de Storage */}
              <img
                src={pagina.imageUrl}
                alt={pagina.title}
                className="w-full rounded-2xl max-h-[46vh] object-contain"
              />
            </div>
          ) : null}

          {pagina.audioUrl && (
            <div className="rounded-2xl bg-white border-2 border-indigo-100 p-3 mb-5 flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-indigo-500 shrink-0" />
              <audio src={pagina.audioUrl} controls preload="none" className="h-10 w-full" />
            </div>
          )}

          <div key={`txt-${i}`} className="animate-in fade-in slide-in-from-bottom-3 duration-300">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-indigo-950">
              {pagina.title}
            </h1>
            {/* max-w-[60ch] y leading holgado: medida de lectura de libro. */}
            <div className="mt-3 space-y-3 max-w-[60ch]">
              {pagina.body.split('\n\n').map((p, k) => (
                <p key={k} className="text-[17px] leading-relaxed text-indigo-900 whitespace-pre-line">
                  {p}
                </p>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="px-4 pb-6 pt-2">
        <div className="max-w-xl mx-auto space-y-3">
          {/* Marcador de páginas: se ve cuánto falta, como el grosor que
              queda de un libro. Tocable para saltar a una página leída. */}
          <div className="flex justify-center gap-1.5">
            {paginas.map((_, k) => (
              <button
                key={k}
                type="button"
                onClick={() => setI(k)}
                aria-label={`Ir a la página ${k + 1}`}
                aria-current={k === i}
                className={cn(
                  'h-2 rounded-full transition-all',
                  k === i ? 'w-7 bg-indigo-600' : 'w-2 bg-indigo-200 hover:bg-indigo-300',
                )}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setI((n) => n - 1)}
              disabled={i === 0}
              className="h-12 rounded-2xl text-indigo-600"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Atrás
            </Button>

            {ultima ? (
              <Button
                asChild
                className="clay-btn flex-1 h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-500 text-white text-base"
                style={{ ['--clay-shadow' as string]: '#047857' }}
              >
                <Link href={volverA}>
                  <Check className="w-4 h-4 mr-1.5" />
                  {volverTexto}
                </Link>
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => setI((n) => n + 1)}
                className="clay-btn flex-1 h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-600 text-white text-base"
                style={{ ['--clay-shadow' as string]: '#3730A3' }}
              >
                Seguir leyendo
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            )}
          </div>

          <p className="text-center text-xs text-indigo-400">
            Página {i + 1} de {paginas.length}
          </p>
        </div>
      </footer>
    </div>
  )
}
