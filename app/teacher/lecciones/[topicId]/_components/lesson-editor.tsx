'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { guardarLeccion } from '../../actions'
import { createClient } from '@/lib/supabase/client'
import { LESSON_BUCKET } from '@/lib/lesson-media'
import { LessonScene } from '@/app/student/lecciones/_components/lesson-scenes'
import { CATALOGO, GRUPOS, buscarEscena } from '@/app/student/lecciones/_components/scene-catalog'
import type { LessonPage } from '@/app/student/lecciones/_components/lesson-reader'
import { sanearEscena, ESCENA_VACIA, type EscenaDoc } from '@/lib/scene-doc'
import { SceneCanvas } from './scene-canvas'
import { AudioRecorder, extensionDe, tipoBase } from '@/app/teacher/activities/[id]/repaso/_components/audio-recorder'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Plus, Trash2, ChevronUp, ChevronDown, Image as ImageIcon, Shapes, Mic, X, Loader2, Eye, Palette,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type PaginaEdit = LessonPage & {
  key: string
  /** URL para ver la foto: local mientras se sube, firmada al cargar. */
  previa?: string | null
  imageUrl?: string | null
  audioUrl?: string | null
}

let contador = 0
const clave = () => `p${++contador}`

export function LessonEditor({
  topicId,
  topicName,
  gradeName,
  initialTitle,
  initialPages,
}: {
  topicId: string
  topicName: string
  gradeName: string
  initialTitle: string
  initialPages: (LessonPage & { imageUrl?: string | null; audioUrl?: string | null })[]
}) {
  const [state, action] = useFormState(guardarLeccion, { error: null })
  const [titulo, setTitulo] = useState(initialTitle)
  const [paginas, setPaginas] = useState<PaginaEdit[]>(() =>
    initialPages.map((p) => ({ ...p, key: clave(), previa: p.imageUrl ?? null })),
  )
  const [abierta, setAbierta] = useState(0)

  // Lo que se guarda: las páginas sin los campos de trabajo del editor.
  const serializadas = JSON.stringify(
    paginas.map(({ key, previa, imageUrl, audioUrl, ...p }) => p),
  )

  function actualizar(k: string, cambio: Partial<PaginaEdit>) {
    setPaginas((prev) => prev.map((p) => (p.key === k ? { ...p, ...cambio } : p)))
  }

  function agregar() {
    setPaginas((prev) => [...prev, { key: clave(), title: '', body: '' }])
    setAbierta(paginas.length)
  }

  function mover(i: number, delta: number) {
    const j = i + delta
    if (j < 0 || j >= paginas.length) return
    setPaginas((prev) => {
      const n = [...prev]
      ;[n[i], n[j]] = [n[j], n[i]]
      return n
    })
    setAbierta(j)
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="topic_id" value={topicId} />
      <input type="hidden" name="pages" value={serializadas} />

      {state.error && (
        <p className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="rounded-lg border border-border bg-card p-4 space-y-1.5 max-w-3xl">
        <Label htmlFor="title">Título de la lección</Label>
        <Input
          id="title"
          name="title"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder={`Ej: ${topicName} paso a paso`}
          maxLength={120}
          required
        />
        <p className="text-xs text-muted-foreground">
          {gradeName} · {topicName}
        </p>
      </div>

      <div className="space-y-2">
        {paginas.map((p, i) => (
          <PaginaCard
            key={p.key}
            pagina={p}
            numero={i + 1}
            total={paginas.length}
            abierta={abierta === i}
            topicId={topicId}
            topicName={topicName}
            onAbrir={() => setAbierta(abierta === i ? -1 : i)}
            onCambio={(c) => actualizar(p.key, c)}
            onMover={(d) => mover(i, d)}
            onBorrar={() => setPaginas((prev) => prev.filter((x) => x.key !== p.key))}
          />
        ))}
      </div>

      <Button type="button" variant="outline" onClick={agregar} className="w-full">
        <Plus className="w-4 h-4 mr-1" />
        Agregar página
      </Button>

      <div className="flex flex-wrap gap-2 pt-1">
        <BotonGuardar />
        <Button variant="outline" asChild>
          <Link href={`/teacher/lecciones/${topicId}/preview`} target="_blank">
            <Eye className="w-4 h-4 mr-1" />
            Ver como alumno
          </Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/teacher/lecciones">Volver</Link>
        </Button>
      </div>
    </form>
  )
}

function BotonGuardar() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Guardando…' : 'Guardar lección'}
    </Button>
  )
}

// ── Una página ─────────────────────────────────────────────────────────────

function PaginaCard({
  pagina,
  numero,
  total,
  abierta,
  topicId,
  topicName,
  onAbrir,
  onCambio,
  onMover,
  onBorrar,
}: {
  pagina: PaginaEdit
  numero: number
  total: number
  abierta: boolean
  topicId: string
  topicName: string
  onAbrir: () => void
  onCambio: (c: Partial<PaginaEdit>) => void
  onMover: (d: number) => void
  onBorrar: () => void
}) {
  const escena = pagina.art ? buscarEscena(pagina.art) : undefined

  return (
    <div className={cn('rounded-lg border bg-card', abierta ? 'border-primary/40' : 'border-border')}>
      <div className="flex items-center gap-2 p-3">
        <button
          type="button"
          onClick={onAbrir}
          className="flex-1 text-left min-w-0"
          aria-expanded={abierta}
        >
          <p className="text-sm font-medium text-foreground truncate">
            {numero}. {pagina.title || <span className="text-muted-foreground">Sin título</span>}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {escena
              ? escena.nombre
              : pagina.escena
                ? 'Diseño propio'
                : pagina.image
                  ? 'Con foto'
                  : pagina.audio
                    ? 'Con audio'
                    : 'Sin ilustración'}
          </p>
        </button>

        <Button type="button" size="icon-xs" variant="ghost" disabled={numero === 1}
          onClick={() => onMover(-1)} aria-label="Subir página">
          <ChevronUp className="w-3 h-3" />
        </Button>
        <Button type="button" size="icon-xs" variant="ghost" disabled={numero === total}
          onClick={() => onMover(1)} aria-label="Bajar página">
          <ChevronDown className="w-3 h-3" />
        </Button>
        <Button type="button" size="icon-xs" variant="ghost" onClick={onBorrar} aria-label="Eliminar página">
          <Trash2 className="w-3 h-3 text-muted-foreground" />
        </Button>
      </div>

      {abierta && (
        <div className="border-t border-border p-3 space-y-3">
          {/* `htmlFor`/`id` con el número de página: sin la asociación, un
              lector de pantalla no anuncia qué campo es —y con varias páginas
              abiertas habría ids repetidos. */}
          <div className="space-y-1.5 max-w-3xl">
            <Label htmlFor={`pagina-${numero}-titulo`} className="text-xs">
              Título de la página
            </Label>
            <Input
              id={`pagina-${numero}-titulo`}
              value={pagina.title}
              onChange={(e) => onCambio({ title: e.target.value })}
              placeholder="Ej: Cuenta los lados"
            />
          </div>

          <div className="space-y-1.5 max-w-3xl">
            <Label htmlFor={`pagina-${numero}-texto`} className="text-xs">
              Texto
            </Label>
            <Textarea
              id={`pagina-${numero}-texto`}
              value={pagina.body}
              onChange={(e) => onCambio({ body: e.target.value })}
              rows={4}
              placeholder="Una idea por párrafo. Deja una línea en blanco entre párrafos."
            />
          </div>

          <Ilustracion pagina={pagina} topicId={topicId} topicName={topicName} onCambio={onCambio} />
        </div>
      )}
    </div>
  )
}

// ── Elegir la ilustración ──────────────────────────────────────────────────

function Ilustracion({
  pagina,
  topicId,
  topicName,
  onCambio,
}: {
  pagina: PaginaEdit
  topicId: string
  topicName: string
  onCambio: (c: Partial<PaginaEdit>) => void
}) {
  const [modo, setModo] = useState<'escena' | 'disenar' | 'archivo'>(
    pagina.escena ? 'disenar' : pagina.image || pagina.audio ? 'archivo' : 'escena',
  )
  const escena = pagina.art ? buscarEscena(pagina.art) : undefined

  return (
    <div className="rounded-md border border-border p-3 space-y-3">
      <div className="flex items-center gap-2">
        <Button type="button" size="sm" variant={modo === 'escena' ? 'default' : 'outline'}
          onClick={() => setModo('escena')}>
          <Shapes className="w-3.5 h-3.5 mr-1.5" />
          Escena
        </Button>
        <Button type="button" size="sm" variant={modo === 'disenar' ? 'default' : 'outline'}
          onClick={() => setModo('disenar')}>
          <Palette className="w-3.5 h-3.5 mr-1.5" />
          Diseñar
        </Button>
        <Button type="button" size="sm" variant={modo === 'archivo' ? 'default' : 'outline'}
          onClick={() => setModo('archivo')}>
          <ImageIcon className="w-3.5 h-3.5 mr-1.5" />
          Foto o audio
        </Button>
      </div>

      {modo === 'escena' ? (
        <>
          <p className="text-xs text-muted-foreground">
            Elige un dibujo ya hecho y llena sus campos. Se ve al instante.
          </p>

          <select
            value={pagina.art ?? ''}
            onChange={(e) => {
              const id = e.target.value
              const nueva = id ? buscarEscena(id) : undefined
              // Se copia el EJEMPLO de la escena, no un arreglo vacío. Dos
              // razones: el docente ve de entrada un dibujo que funciona, y
              // la escena nunca recibe ranuras sin valor. Un `labels: []` no
              // activa los valores por defecto de la función —solo lo hace
              // `undefined`— así que `labels[0]` quedaba sin definir y la
              // escena reventaba al leerlo.
              onCambio({
                art: id || undefined,
                labels: nueva?.ejemplo?.labels ? [...nueva.ejemplo.labels] : undefined,
                values: nueva?.ejemplo?.values ? [...nueva.ejemplo.values] : undefined,
                escena: undefined,
                image: undefined,
                audio: undefined,
                previa: null,
              })
            }}
            className="flex h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
          >
            <option value="">Sin escena</option>
            {GRUPOS.map((g) => (
              <optgroup key={g} label={g}>
                {CATALOGO.filter((e) => e.grupo === g).map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nombre} — {e.para}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>

          {escena && (
            <>
              <div className="rounded-lg border border-border bg-white p-2">
                <LessonScene art={escena.id} labels={pagina.labels} values={pagina.values} />
              </div>

              {escena.campos.length > 0 && (
                <div className="grid sm:grid-cols-2 gap-2">
                  {escena.campos.map((hint, i) => (
                    <div key={i} className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">{hint}</Label>
                      <Input
                        value={pagina.labels?.[i] ?? ''}
                        onChange={(e) => {
                          // Las ranuras que falten se completan con el
                          // ejemplo, no con '': una cadena vacía dejaría un
                          // rótulo en blanco en el dibujo.
                          const base = escena.ejemplo?.labels ?? []
                          const labels = [...(pagina.labels ?? [])]
                          while (labels.length < escena.campos.length) {
                            labels.push(base[labels.length] ?? '')
                          }
                          labels[i] = e.target.value
                          onCambio({ labels })
                        }}
                        className="h-8 text-sm"
                      />
                    </div>
                  ))}
                </div>
              )}

              {escena.numeros && escena.numeros.length > 0 && (
                <div className="grid sm:grid-cols-2 gap-2">
                  {escena.numeros.map((hint, i) => (
                    <div key={i} className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">{hint}</Label>
                      <Input
                        type="number"
                        step="any"
                        value={pagina.values?.[i] ?? ''}
                        onChange={(e) => {
                          const base = escena.ejemplo?.values ?? []
                          const values = [...(pagina.values ?? [])]
                          while (values.length < (escena.numeros?.length ?? 0)) {
                            values.push(base[values.length] ?? 0)
                          }
                          values[i] = Number(e.target.value)
                          onCambio({ values })
                        }}
                        className="h-8 text-sm"
                      />
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Si dejas un campo vacío, la escena usa su texto de ejemplo.
              </p>
            </>
          )}
        </>
      ) : modo === 'disenar' ? (
        <>
          {/* Sin frase de ayuda: el lienzo vacío ya dice qué hacer, y lo dice
              en el sitio exacto donde hay que hacerlo. */}
          <SceneCanvas
            doc={pagina.escena ? sanearEscena(pagina.escena) : ESCENA_VACIA}
            topicId={topicId}
            topicName={topicName}
            onChange={(d: EscenaDoc) =>
              // Una página lleva una sola ilustración: al diseñar se sueltan
              // la escena del catálogo y los archivos, o se verían dos.
              onCambio({ escena: d, art: undefined, image: undefined, audio: undefined, previa: null })
            }
          />
        </>
      ) : (
        <SubirArchivo pagina={pagina} topicId={topicId} onCambio={onCambio} />
      )}
    </div>
  )
}

/**
 * Foto y audio para lo que ninguna escena explica.
 *
 * Es la salida cuando el docente quiere mostrar algo propio: una planta del
 * patio, el mapa de su estado, su propia voz explicando. Se sube directo a
 * Storage desde el navegador, igual que en el repaso de las actividades: un
 * archivo que pase por un Server Action se carga entero en memoria del
 * servidor para volver a subirse.
 */
function SubirArchivo({
  pagina,
  topicId,
  onCambio,
}: {
  pagina: PaginaEdit
  topicId: string
  onCambio: (c: Partial<PaginaEdit>) => void
}) {
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function subir(blob: Blob, extension: string) {
    const supabase = createClient()
    const ruta = `${topicId}/${crypto.randomUUID()}.${extension}`
    const { error: e } = await supabase.storage
      .from(LESSON_BUCKET)
      .upload(ruta, blob, { contentType: tipoBase(blob.type), upsert: false })
    if (e) throw new Error(e.message)
    return ruta
  }

  async function elegirFoto(f: File | null) {
    if (!f) return
    if (f.size > 10 * 1024 * 1024) {
      setError('La imagen pesa más de 10 MB. Usa una más liviana.')
      return
    }
    setSubiendo(true)
    setError(null)
    try {
      const ext = f.name.split('.').pop()?.toLowerCase() || 'jpg'
      const ruta = await subir(f, ext)
      onCambio({ image: ruta, previa: URL.createObjectURL(f), art: undefined, escena: undefined })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSubiendo(false)
    }
  }

  async function grabado(blob: Blob | null) {
    if (!blob) {
      onCambio({ audio: undefined, audioUrl: null })
      return
    }
    setSubiendo(true)
    setError(null)
    try {
      const ruta = await subir(blob, extensionDe(blob.type))
      onCambio({ audio: ruta, audioUrl: URL.createObjectURL(blob), art: undefined, escena: undefined })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Para lo que ninguna escena explica: una foto tuya, un mapa, tu voz.
      </p>

      <div className="space-y-1.5">
        <Label className="text-xs">Foto</Label>
        {pagina.previa ? (
          <div className="flex items-start gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- blob local o URL firmada */}
            <img src={pagina.previa} alt="" className="max-h-36 rounded-md border border-border" />
            <Button type="button" size="icon-sm" variant="ghost"
              onClick={() => onCambio({ image: undefined, previa: null })}
              aria-label="Quitar la foto">
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        ) : (
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(e) => elegirFoto(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-border file:bg-background file:px-3 file:py-1.5 file:text-sm file:text-foreground hover:file:bg-muted"
          />
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs flex items-center gap-1.5">
          <Mic className="w-3.5 h-3.5" />
          Audio (opcional)
        </Label>
        {pagina.audioUrl && (
          <div className="flex items-center gap-2">
            <audio src={pagina.audioUrl} controls className="h-9 flex-1 min-w-0" />
            <Button type="button" size="icon-sm" variant="ghost"
              onClick={() => onCambio({ audio: undefined, audioUrl: null })}
              aria-label="Quitar el audio">
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
        <AudioRecorder onChange={grabado} disabled={subiendo} />
      </div>

      {subiendo && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Subiendo…
        </p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
