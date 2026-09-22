'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BRIEFING_BUCKET, type BriefingBlockView } from '@/lib/briefing'
import {
  addTextBlock,
  addMediaBlock,
  deleteBriefingBlock,
  moveBriefingBlock,
  updateBriefingBlock,
} from '../actions'
import { AudioRecorder, extensionDe, tipoBase } from './audio-recorder'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Type,
  ImageIcon,
  Mic,
  Trash2,
  ChevronUp,
  ChevronDown,
  Loader2,
  AlertTriangle,
  Plus,
  Pencil,
  X,
} from 'lucide-react'

type Props = {
  activityId: string
  blocks: BriefingBlockView[]
}

const LIMITE_BYTES = 10 * 1024 * 1024

export function BriefingEditor({ activityId, blocks }: Props) {
  const router = useRouter()
  const [agregando, setAgregando] = useState<'text' | 'image' | 'audio' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function refrescar() {
    setAgregando(null)
    setError(null)
    startTransition(() => router.refresh())
  }

  return (
    <div className="space-y-4">
      {blocks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-8 px-4 text-center">
          <p className="text-sm text-muted-foreground">
            El repaso está vacío: el alumno entra directo a las preguntas.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Agrega abajo lo que quieras que vea o escuche antes de empezar.
          </p>
        </div>
      ) : (
        <ol className="space-y-2">
          {blocks.map((b, i) => (
            <BlockRow
              key={b.id}
              activityId={activityId}
              block={b}
              esPrimero={i === 0}
              esUltimo={i === blocks.length - 1}
              onChange={refrescar}
            />
          ))}
        </ol>
      )}

      {error && (
        <p className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {agregando === null ? (
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setAgregando('text')}>
            <Type className="w-3.5 h-3.5 mr-1.5" />
            Texto
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setAgregando('image')}>
            <ImageIcon className="w-3.5 h-3.5 mr-1.5" />
            Imagen
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setAgregando('audio')}>
            <Mic className="w-3.5 h-3.5 mr-1.5" />
            Audio
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card p-4">
          {agregando === 'text' && (
            <TextForm activityId={activityId} onDone={refrescar} onCancel={() => setAgregando(null)} />
          )}
          {agregando === 'image' && (
            <ImageForm
              activityId={activityId}
              onDone={refrescar}
              onCancel={() => setAgregando(null)}
              onError={setError}
            />
          )}
          {agregando === 'audio' && (
            <AudioForm
              activityId={activityId}
              onDone={refrescar}
              onCancel={() => setAgregando(null)}
              onError={setError}
            />
          )}
        </div>
      )}
    </div>
  )
}

// ── Subida al bucket ───────────────────────────────────────────────────────

/**
 * Sube un archivo directo a Storage desde el navegador.
 *
 * No pasa por un Server Action a propósito: un audio o una foto cargarían
 * entero el archivo en memoria del servidor para volver a subirlo. La RLS del
 * bucket (`can_edit_activity` sobre la carpeta) autoriza la subida, así que
 * saltarse el servidor no se salta ningún permiso.
 */
async function subir(activityId: string, blob: Blob, extension: string) {
  const supabase = createClient()
  const nombre = `${activityId}/${crypto.randomUUID()}.${extension}`

  const { error } = await supabase.storage
    .from(BRIEFING_BUCKET)
    .upload(nombre, blob, { contentType: tipoBase(blob.type), upsert: false })

  if (error) throw new Error(error.message)
  return nombre
}

// ── Formularios de alta ────────────────────────────────────────────────────

function TextForm({
  activityId,
  onDone,
  onCancel,
}: {
  activityId: string
  onDone: () => void
  onCancel: () => void
}) {
  const [texto, setTexto] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function guardar() {
    setGuardando(true)
    const fd = new FormData()
    fd.set('activity_id', activityId)
    fd.set('text_content', texto)
    const res = await addTextBlock({ error: null }, fd)
    setGuardando(false)
    if (res.error) setError(res.error)
    else onDone()
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="texto">Texto del repaso</Label>
      <Textarea
        id="texto"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows={4}
        placeholder="Ej: Ya vimos que una fracción parte algo en pedazos iguales. Hoy vamos a compararlas."
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button type="button" size="sm" onClick={guardar} disabled={guardando || !texto.trim()}>
          {guardando ? 'Agregando…' : 'Agregar'}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  )
}

/**
 * Alta de una imagen.
 *
 * Acá vive la regla: mientras no haya audio grabado ni descripción escrita, el
 * botón de agregar está deshabilitado y se explica por qué. La base la exige
 * igual (constraint imagen_con_descripcion), pero el docente tiene que
 * enterarse antes de subir, no al recibir un error.
 */
function ImageForm({
  activityId,
  onDone,
  onCancel,
  onError,
}: {
  activityId: string
  onDone: () => void
  onCancel: () => void
  onError: (m: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [archivo, setArchivo] = useState<File | null>(null)
  const [previa, setPrevia] = useState<string | null>(null)
  const [descripcion, setDescripcion] = useState('')
  const [audio, setAudio] = useState<Blob | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function elegir(f: File | null) {
    if (previa) URL.revokeObjectURL(previa)
    if (!f) {
      setArchivo(null)
      setPrevia(null)
      return
    }
    if (f.size > LIMITE_BYTES) {
      setError('La imagen pesa más de 10 MB. Usa una más liviana.')
      return
    }
    setError(null)
    setArchivo(f)
    setPrevia(URL.createObjectURL(f))
  }

  const explicada = audio !== null || descripcion.trim().length > 0

  async function guardar() {
    if (!archivo || !explicada) return
    setGuardando(true)
    setError(null)
    try {
      const extension = archivo.name.split('.').pop()?.toLowerCase() || 'png'
      const media_path = await subir(activityId, archivo, extension)

      let audio_path: string | null = null
      if (audio) audio_path = await subir(activityId, audio, extensionDe(audio.type))

      const fd = new FormData()
      fd.set('activity_id', activityId)
      fd.set('kind', 'image')
      fd.set('media_path', media_path)
      if (audio_path) fd.set('audio_path', audio_path)
      fd.set('text_content', descripcion)

      const res = await addMediaBlock({ error: null }, fd)
      if (res.error) setError(res.error)
      else onDone()
    } catch (e) {
      onError((e as Error).message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="imagen">Imagen</Label>
        <input
          ref={inputRef}
          id="imagen"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(e) => elegir(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-border file:bg-background file:px-3 file:py-1.5 file:text-sm file:text-foreground hover:file:bg-muted"
        />
      </div>

      {previa && (
        // eslint-disable-next-line @next/next/no-img-element -- blob local, no pasa por el optimizador
        <img
          src={previa}
          alt="Vista previa de la imagen elegida"
          className="max-h-48 rounded-md border border-border"
        />
      )}

      {archivo && (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 space-y-3">
          <p className="flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />
            <span>
              Explica la imagen para que sirva a quien no puede verla bien:
              graba un audio o escribe una descripción. Con cualquiera de las
              dos alcanza.
            </span>
          </p>

          <AudioRecorder onChange={setAudio} disabled={guardando} />

          <div className="space-y-1.5">
            <Label
              htmlFor="descripcion"
              className="text-xs text-amber-700 dark:text-amber-300"
            >
              O descríbela por escrito
            </Label>
            <Textarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={2}
              placeholder="Ej: un mapa de Venezuela con la región de los Llanos pintada de verde."
              className="text-sm bg-background"
            />
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={guardar}
          disabled={!archivo || !explicada || guardando}
        >
          {guardando ? (
            <>
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              Subiendo…
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Agregar imagen
            </>
          )}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        {archivo && !explicada && (
          <span className="text-xs text-muted-foreground">
            Falta el audio o la descripción.
          </span>
        )}
      </div>
    </div>
  )
}

function AudioForm({
  activityId,
  onDone,
  onCancel,
  onError,
}: {
  activityId: string
  onDone: () => void
  onCancel: () => void
  onError: (m: string) => void
}) {
  const [audio, setAudio] = useState<Blob | null>(null)
  const [nota, setNota] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function guardar() {
    if (!audio) return
    setGuardando(true)
    setError(null)
    try {
      const media_path = await subir(activityId, audio, extensionDe(audio.type))
      const fd = new FormData()
      fd.set('activity_id', activityId)
      fd.set('kind', 'audio')
      fd.set('media_path', media_path)
      fd.set('text_content', nota)
      const res = await addMediaBlock({ error: null }, fd)
      if (res.error) setError(res.error)
      else onDone()
    } catch (e) {
      onError((e as Error).message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Audio del repaso</Label>
        <p className="text-xs text-muted-foreground">
          Grábalo con tus palabras: para muchos alumnos es más claro escucharte
          que leer.
        </p>
        <AudioRecorder onChange={setAudio} disabled={guardando} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="nota" className="text-xs">
          Título del audio (opcional)
        </Label>
        <Textarea
          id="nota"
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          rows={1}
          placeholder="Ej: repaso de lo que vimos el lunes"
          className="text-sm"
        />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-2">
        <Button type="button" size="sm" onClick={guardar} disabled={!audio || guardando}>
          {guardando ? (
            <>
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              Subiendo…
            </>
          ) : (
            'Agregar audio'
          )}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  )
}

// ── Un bloque ya guardado ──────────────────────────────────────────────────

function BlockRow({
  activityId,
  block,
  esPrimero,
  esUltimo,
  onChange,
}: {
  activityId: string
  block: BriefingBlockView
  esPrimero: boolean
  esUltimo: boolean
  onChange: () => void
}) {
  const [ocupado, setOcupado] = useState(false)
  const [editando, setEditando] = useState(false)

  if (editando) {
    return (
      <li className="rounded-lg border border-primary/40 bg-card p-3">
        <BlockEditForm
          activityId={activityId}
          block={block}
          onDone={() => {
            setEditando(false)
            onChange()
          }}
          onCancel={() => setEditando(false)}
        />
      </li>
    )
  }

  async function ejecutar(
    accion: typeof deleteBriefingBlock | typeof moveBriefingBlock,
    extra?: Record<string, string>,
  ) {
    setOcupado(true)
    const fd = new FormData()
    fd.set('activity_id', activityId)
    fd.set('block_id', block.id)
    for (const [k, v] of Object.entries(extra ?? {})) fd.set(k, v)
    await accion({ error: null }, fd)
    setOcupado(false)
    onChange()
  }

  const Icon = block.kind === 'text' ? Type : block.kind === 'image' ? ImageIcon : Mic

  return (
    <li className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-start gap-3">
        <Icon className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />

        <div className="flex-1 min-w-0 space-y-2">
          {block.kind === 'text' && (
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {block.text_content}
            </p>
          )}

          {block.kind === 'image' && (
            <>
              {block.mediaUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- URL firmada de Storage
                <img
                  src={block.mediaUrl}
                  alt={block.text_content ?? 'Imagen del repaso'}
                  className="max-h-48 rounded-md border border-border"
                />
              )}
              {block.audioUrl && (
                <audio src={block.audioUrl} controls className="h-9 w-full max-w-sm" />
              )}
              {block.text_content && (
                <p className="text-sm text-muted-foreground">{block.text_content}</p>
              )}
            </>
          )}

          {block.kind === 'audio' && (
            <>
              {block.text_content && (
                <p className="text-sm text-foreground">{block.text_content}</p>
              )}
              {block.mediaUrl && (
                <audio src={block.mediaUrl} controls className="h-9 w-full max-w-sm" />
              )}
            </>
          )}
        </div>

        <div className="flex flex-col gap-0.5 shrink-0">
          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            disabled={ocupado}
            onClick={() => setEditando(true)}
            aria-label="Editar bloque"
          >
            <Pencil className="w-3 h-3" />
          </Button>
          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            disabled={esPrimero || ocupado}
            onClick={() => ejecutar(moveBriefingBlock, { direction: 'up' })}
            aria-label="Mover arriba"
          >
            <ChevronUp className="w-3 h-3" />
          </Button>
          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            disabled={esUltimo || ocupado}
            onClick={() => ejecutar(moveBriefingBlock, { direction: 'down' })}
            aria-label="Mover abajo"
          >
            <ChevronDown className="w-3 h-3" />
          </Button>
          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            disabled={ocupado}
            onClick={() => ejecutar(deleteBriefingBlock)}
            aria-label="Eliminar bloque"
          >
            <Trash2 className="w-3 h-3 text-muted-foreground" />
          </Button>
        </div>
      </div>
    </li>
  )
}

/**
 * Edición de un bloque existente.
 *
 * La imagen y el audio son opcionales de reemplazar: si el docente no elige
 * archivo nuevo, se conservan los que ya estaban. Eso permite el caso más
 * común —corregir la descripción sin volver a subir la foto— sin gastar datos.
 *
 * La regla de la imagen sigue vigente al editar: no se puede dejar una imagen
 * sin audio ni descripción quitando lo que la explicaba.
 */
function BlockEditForm({
  activityId,
  block,
  onDone,
  onCancel,
}: {
  activityId: string
  block: BriefingBlockView
  onDone: () => void
  onCancel: () => void
}) {
  const [texto, setTexto] = useState(block.text_content ?? '')
  const [archivo, setArchivo] = useState<File | null>(null)
  const [previa, setPrevia] = useState<string | null>(null)
  const [audioNuevo, setAudioNuevo] = useState<Blob | null>(null)
  const [quitarAudio, setQuitarAudio] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const esImagen = block.kind === 'image'
  const esAudio = block.kind === 'audio'

  // Con qué audio quedaría la imagen tras los cambios pendientes.
  const tendraAudio = esImagen && (audioNuevo !== null || (!quitarAudio && !!block.audio_path))
  const explicada = !esImagen || tendraAudio || texto.trim().length > 0

  function elegir(f: File | null) {
    if (previa) URL.revokeObjectURL(previa)
    if (!f) {
      setArchivo(null)
      setPrevia(null)
      return
    }
    if (f.size > LIMITE_BYTES) {
      setError('El archivo pesa más de 10 MB. Usa uno más liviano.')
      return
    }
    setError(null)
    setArchivo(f)
    setPrevia(f.type.startsWith('image/') ? URL.createObjectURL(f) : null)
  }

  async function guardar() {
    if (!explicada) return
    setGuardando(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.set('activity_id', activityId)
      fd.set('block_id', block.id)
      fd.set('text_content', texto)

      if (archivo) {
        const ext = archivo.name.split('.').pop()?.toLowerCase() || 'png'
        fd.set('media_path', await subir(activityId, archivo, ext))
      }
      if (audioNuevo) {
        const ruta = await subir(activityId, audioNuevo, extensionDe(audioNuevo.type))
        // En un bloque de audio el archivo principal ES el audio; en uno de
        // imagen, el audio va aparte como explicación.
        fd.set(esAudio ? 'media_path' : 'audio_path', ruta)
      } else if (quitarAudio) {
        fd.set('quitar_audio', '1')
      }

      const res = await updateBriefingBlock({ error: null }, fd)
      if (res.error) setError(res.error)
      else onDone()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">
          {block.kind === 'text'
            ? 'Editar texto'
            : esImagen
              ? 'Editar imagen'
              : 'Editar audio'}
        </p>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          onClick={onCancel}
          aria-label="Cancelar la edición"
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      {esImagen && (
        <div className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- URL firmada o blob local */}
          <img
            src={previa ?? block.mediaUrl ?? ''}
            alt={previa ? 'Vista previa de la imagen nueva' : 'Imagen actual del bloque'}
            className="max-h-40 rounded-md border border-border"
          />
          <div className="space-y-1">
            <Label htmlFor={`img-${block.id}`} className="text-xs">
              Cambiar la imagen (opcional)
            </Label>
            <input
              id={`img-${block.id}`}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => elegir(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-border file:bg-background file:px-3 file:py-1.5 file:text-sm file:text-foreground hover:file:bg-muted"
            />
          </div>
        </div>
      )}

      {(esImagen || esAudio) && (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 space-y-2">
          <p className="text-xs text-amber-700 dark:text-amber-300">
            {esImagen
              ? 'La imagen tiene que quedar explicada: con audio, con descripción, o con las dos.'
              : 'Graba de nuevo para reemplazar el audio.'}
          </p>

          {block.audioUrl && !audioNuevo && !quitarAudio && (
            <div className="flex items-center gap-2">
              <audio src={block.audioUrl} controls className="h-9 flex-1 min-w-0" />
              {esImagen && (
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => setQuitarAudio(true)}
                  aria-label="Quitar el audio de esta imagen"
                >
                  <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                </Button>
              )}
            </div>
          )}

          {quitarAudio && !audioNuevo && (
            <p className="text-xs text-amber-700 dark:text-amber-300">
              El audio se quitará al guardar.{' '}
              <button
                type="button"
                onClick={() => setQuitarAudio(false)}
                className="underline"
              >
                Deshacer
              </button>
            </p>
          )}

          <AudioRecorder onChange={setAudioNuevo} disabled={guardando} />
        </div>
      )}

      <div className="space-y-1">
        <Label htmlFor={`txt-${block.id}`} className="text-xs">
          {block.kind === 'text'
            ? 'Texto'
            : esImagen
              ? 'Descripción de la imagen'
              : 'Título del audio (opcional)'}
        </Label>
        <Textarea
          id={`txt-${block.id}`}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={block.kind === 'text' ? 4 : 2}
          className="text-sm"
        />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={guardar}
          disabled={guardando || !explicada || (block.kind === 'text' && !texto.trim())}
        >
          {guardando ? (
            <>
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              Guardando…
            </>
          ) : (
            'Guardar cambios'
          )}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        {!explicada && (
          <span className="text-xs text-muted-foreground">
            Falta el audio o la descripción.
          </span>
        )}
      </div>
    </div>
  )
}
