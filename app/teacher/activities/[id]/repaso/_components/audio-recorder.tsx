'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, Square, Trash2, Loader2 } from 'lucide-react'

/**
 * Grabador de audio con MediaRecorder.
 *
 * Devuelve el Blob grabado al padre; no sube nada por su cuenta, para que el
 * mismo componente sirva tanto para un bloque de audio suelto como para la
 * explicación de una imagen.
 *
 * Sobre el formato: cada navegador soporta contenedores distintos y ninguno
 * los soporta todos. Se prueba una lista en orden y se usa el primero que el
 * navegador acepte, en vez de fijar 'audio/webm' y que falle en Safari.
 */
const FORMATOS = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/mp4',
]

function formatoSoportado(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined
  return FORMATOS.find((f) => MediaRecorder.isTypeSupported(f))
}

/** El mime del blob trae parámetros ("audio/webm;codecs=opus") que el bucket
 *  no acepta en su lista; se guarda el tipo base. */
export function tipoBase(mime: string): string {
  return mime.split(';')[0]
}

export function extensionDe(mime: string): string {
  const base = tipoBase(mime)
  if (base === 'audio/mp4') return 'm4a'
  if (base === 'audio/ogg') return 'ogg'
  if (base === 'audio/mpeg') return 'mp3'
  return 'webm'
}

type Props = {
  /** Se llama con el audio grabado, o con null cuando se descarta. */
  onChange: (blob: Blob | null) => void
  disabled?: boolean
}

export function AudioRecorder({ onChange, disabled }: Props) {
  const [grabando, setGrabando] = useState(false)
  const [preparando, setPreparando] = useState(false)
  const [segundos, setSegundos] = useState(0)
  const [urlPrevia, setUrlPrevia] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const trozosRef = useRef<Blob[]>([])
  const urlRef = useRef<string | null>(null)

  // El stream del micrófono y la URL del objeto viven fuera de React; si el
  // componente se desmonta grabando, hay que soltar el micrófono a mano o el
  // navegador deja el indicador de grabación encendido.
  useEffect(() => {
    return () => {
      recorderRef.current?.stream.getTracks().forEach((t) => t.stop())
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    }
  }, [])

  useEffect(() => {
    if (!grabando) return
    const id = setInterval(() => setSegundos((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [grabando])

  async function empezar() {
    setError(null)
    setPreparando(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = formatoSoportado()
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)

      trozosRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) trozosRef.current.push(e.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(trozosRef.current, {
          type: mimeType ?? 'audio/webm',
        })
        stream.getTracks().forEach((t) => t.stop())

        if (urlRef.current) URL.revokeObjectURL(urlRef.current)
        const url = URL.createObjectURL(blob)
        urlRef.current = url
        setUrlPrevia(url)
        onChange(blob)
      }

      recorder.start()
      recorderRef.current = recorder
      setSegundos(0)
      setGrabando(true)
    } catch (err) {
      const nombre = (err as Error).name
      setError(
        nombre === 'NotAllowedError'
          ? 'El navegador bloqueó el micrófono. Permite el acceso e intenta de nuevo.'
          : nombre === 'NotFoundError'
            ? 'No encontramos un micrófono conectado.'
            : 'No pudimos usar el micrófono en este equipo.',
      )
    } finally {
      setPreparando(false)
    }
  }

  function detener() {
    recorderRef.current?.stop()
    setGrabando(false)
  }

  function descartar() {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    urlRef.current = null
    setUrlPrevia(null)
    setSegundos(0)
    onChange(null)
  }

  const reloj = `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, '0')}`

  return (
    <div className="space-y-2">
      {!urlPrevia ? (
        <div className="flex items-center gap-2">
          {grabando ? (
            <>
              <Button type="button" size="sm" variant="destructive" onClick={detener}>
                <Square className="w-3.5 h-3.5 mr-1.5" fill="currentColor" />
                Detener
              </Button>
              <span
                className="flex items-center gap-1.5 text-xs text-red-600"
                role="status"
                aria-live="polite"
              >
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                Grabando {reloj}
              </span>
            </>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={empezar}
              disabled={disabled || preparando}
            >
              {preparando ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Mic className="w-3.5 h-3.5 mr-1.5" />
              )}
              Grabar audio
            </Button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <audio src={urlPrevia} controls className="h-9 flex-1 min-w-0" />
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            onClick={descartar}
            aria-label="Descartar la grabación"
          >
            <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
          </Button>
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
