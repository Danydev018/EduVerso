'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getEdgeFunctionErrorMessage } from '@/lib/edge-function-error'
import { sanearEscena, type EscenaDoc } from '@/lib/scene-doc'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sparkles, Loader2, Undo2 } from 'lucide-react'

/**
 * Asistente de diseño.
 *
 * Manda la escena actual y una instrucción en palabras; recibe el documento
 * modificado. Lo que vuelve pasa por `sanearEscena` antes de tocar el lienzo:
 * el modelo puede inventar una pieza que no existe o sacar algo del lienzo, y
 * un elemento inválido rompería el dibujo.
 *
 * Guarda el estado previo para deshacer de una vez: un cambio hecho por el
 * asistente puede tocar muchos elementos a la vez, y rehacerlo a mano sería
 * tedioso.
 */
const EJEMPLOS = [
  'Pon tres árboles en el campo',
  'Agrega el sol arriba a la izquierda',
  'Traza una flecha del sol al árbol del medio',
  'Pon dos personas conversando',
]

export function AsistenteEscena({
  doc,
  topicName,
  onAplicar,
}: {
  doc: EscenaDoc
  topicId: string
  topicName: string
  onAplicar: (d: EscenaDoc) => void
}) {
  const [instruccion, setInstruccion] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previo, setPrevio] = useState<EscenaDoc | null>(null)

  async function pedir(texto: string) {
    if (!texto.trim()) return
    setCargando(true)
    setError(null)

    const supabase = createClient()
    const { data, error: invokeError } = await supabase.functions.invoke<{
      success: boolean
      error?: string
      escena?: unknown
    }>('scene-assistant', {
      body: { instruccion: texto, escena: doc, tema: topicName },
    })

    setCargando(false)

    if (invokeError || !data?.success) {
      setError(
        await getEdgeFunctionErrorMessage(
          invokeError,
          data?.error ?? 'No pudimos generar el diseño. Intenta de nuevo.',
        ),
      )
      return
    }

    const limpio = sanearEscena(data.escena)
    if (limpio.elementos.length === 0 && doc.elementos.length > 0) {
      setError('El asistente devolvió un lienzo vacío. Prueba a pedirlo de otra forma.')
      return
    }

    setPrevio(doc)
    onAplicar(limpio)
    setInstruccion('')
  }

  // Última franja del marco del editor, no tarjeta flotante: el violeta se
  // queda en el icono y el borde superior, suficiente para distinguirlo sin
  // que compita con el dibujo.
  return (
    <div className="border-t border-violet-500/30 bg-violet-500/5 px-2.5 py-2 space-y-1.5">
      <p className="flex items-center gap-1.5 text-xs font-medium text-foreground">
        <Sparkles className="w-3.5 h-3.5 text-violet-500" />
        Pídeselo al asistente
      </p>

      {/* Una línea, con el botón al lado: lo que se escribe acá es una frase
          ("pon tres árboles en el campo"), y el recuadro de varias líneas
          ocupaba más alto que el propio lienzo sin que nadie lo llenara. */}
      <div className="flex items-center gap-2">
        <Input
          value={instruccion}
          onChange={(e) => setInstruccion(e.target.value)}
          onKeyDown={(e) => {
            // Sin esto, Enter enviaría el formulario de la lección y la
            // guardaría a media edición. Aquí Enter significa "aplicar".
            if (e.key !== 'Enter') return
            e.preventDefault()
            if (!cargando && instruccion.trim()) pedir(instruccion)
          }}
          placeholder="Ej: pon una montaña detrás y dos árboles delante"
          className="h-8 text-sm bg-background"
        />
        <Button
          type="button"
          size="sm"
          className="shrink-0"
          onClick={() => pedir(instruccion)}
          disabled={cargando || !instruccion.trim()}
        >
          {cargando ? (
            <>
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              Dibujando…
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Aplicar
            </>
          )}
        </Button>
        {previo && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="shrink-0"
            onClick={() => {
              onAplicar(previo)
              setPrevio(null)
            }}
          >
            <Undo2 className="w-3.5 h-3.5 mr-1.5" />
            Deshacer
          </Button>
        )}
      </div>

      {/* Ejemplos y aviso comparten fila: el aviso importa, pero no tanto como
          para gastar un renglón propio. */}
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        {EJEMPLOS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => setInstruccion(e)}
            className="text-[11px] rounded-full border border-border px-2 py-0.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            {e}
          </button>
        ))}
        <p className="text-[11px] text-muted-foreground ml-auto">
          Coloca lo que le pidas; revisa el resultado.
        </p>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
