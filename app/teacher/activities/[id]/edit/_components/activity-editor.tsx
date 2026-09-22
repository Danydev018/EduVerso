'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { updateActivity } from '../../../actions'
import { createClient } from '@/lib/supabase/client'
import { getEdgeFunctionErrorMessage } from '@/lib/edge-function-error'
import { serializeQuiz } from '@/lib/quiz'
import type { QuizQuestion } from '@/lib/quiz'
import { shipPartIcon } from '@/lib/ship-parts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Plus,
  Trash2,
  Sparkles,
  Loader2,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  Eye,
} from 'lucide-react'

type ShipPart = {
  id: string
  name: string
  description: string
  icon: string
  color: string
}

type Props = {
  activityId: string
  topicId: string
  topicName: string
  initialTitle: string
  initialQuestions: QuizQuestion[]
  initialNotes: string
  initialShipPart: string | null
  initialFrom: string
  initialUntil: string
  shipParts: ShipPart[]
}

/** Una pregunta en edición. `nueva` marca las que vinieron de Profe Bot y el
 *  docente todavía no revisó. */
type Draft = QuizQuestion & { key: string; nueva?: boolean }

let contador = 0
const nuevaClave = () => `q${++contador}`

const DIFICULTADES = [
  { id: 'facil', label: 'Fácil' },
  { id: 'media', label: 'Media' },
  { id: 'dificil', label: 'Difícil' },
]

export function ActivityEditor({
  activityId,
  topicId,
  topicName,
  initialTitle,
  initialQuestions,
  initialNotes,
  initialShipPart,
  initialFrom,
  initialUntil,
  shipParts,
}: Props) {
  const [state, action] = useFormState(updateActivity, { error: null })

  const [preguntas, setPreguntas] = useState<Draft[]>(() =>
    initialQuestions.map((q) => ({ ...q, key: nuevaClave() })),
  )
  const [notas, setNotas] = useState(initialNotes)
  const [pieza, setPieza] = useState(initialShipPart ?? '')

  // El contenido viaja serializado en un campo oculto: adentro se trabaja con
  // objetos, pero la base guarda el formato de texto de lib/quiz.ts.
  const contenido = [serializeQuiz(preguntas.map(({ question, options, correctIndex }) => ({
    question,
    options,
    correctIndex,
  }))), notas.trim()]
    .filter(Boolean)
    .join('\n\n')

  const sinRevisar = preguntas.filter((p) => p.nueva).length

  function actualizar(key: string, cambio: Partial<Draft>) {
    setPreguntas((prev) =>
      prev.map((p) => (p.key === key ? { ...p, ...cambio, nueva: false } : p)),
    )
  }

  function agregarVacia() {
    setPreguntas((prev) => [
      ...prev,
      { key: nuevaClave(), question: '', options: ['', ''], correctIndex: 0 },
    ])
  }

  function agregarGeneradas(nuevas: QuizQuestion[]) {
    setPreguntas((prev) => [
      ...prev,
      ...nuevas.map((q) => ({ ...q, key: nuevaClave(), nueva: true })),
    ])
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_20rem] items-start">
      <form action={action} className="space-y-5">
        <input type="hidden" name="activity_id" value={activityId} />
        <input type="hidden" name="content" value={contenido} />
        <input type="hidden" name="ship_part_id" value={pieza} />

        {state.error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {state.error}
          </div>
        )}

        <div className="rounded-lg border border-border bg-card p-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              name="title"
              defaultValue={initialTitle}
              maxLength={120}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="available_from">Disponible desde</Label>
              <Input
                id="available_from"
                name="available_from"
                type="datetime-local"
                defaultValue={initialFrom}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="available_until">Disponible hasta</Label>
              <Input
                id="available_until"
                name="available_until"
                type="datetime-local"
                defaultValue={initialUntil}
              />
            </div>
          </div>

          <fieldset>
            <legend className="text-sm font-medium mb-2">Pieza que repara</legend>
            <div className="grid grid-cols-4 gap-2">
              {shipParts.map((p) => {
                const Icon = shipPartIcon(p.icon)
                const activa = pieza === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    title={p.description}
                    aria-pressed={activa}
                    onClick={() => setPieza(activa ? '' : p.id)}
                    className={`flex flex-col items-center gap-1 rounded-md border px-2 py-2 text-center transition-colors ${
                      activa ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${p.color}`} />
                    <span className="text-xs leading-tight">{p.name}</span>
                  </button>
                )
              })}
            </div>
          </fieldset>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">
              Preguntas{' '}
              <span className="text-muted-foreground font-normal">
                ({preguntas.length})
              </span>
            </h2>
            <Button type="button" size="sm" variant="outline" onClick={agregarVacia}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Agregar
            </Button>
          </div>

          {sinRevisar > 0 && (
            <p className="flex items-start gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />
              <span>
                {sinRevisar}{' '}
                {sinRevisar === 1 ? 'pregunta generada' : 'preguntas generadas'} por
                Profe Bot. Revísalas antes de guardar: la IA se equivoca, sobre
                todo al marcar cuál es la respuesta correcta.
              </span>
            </p>
          )}

          {preguntas.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border py-8 text-center">
              <p className="text-sm text-muted-foreground">
                Esta actividad no tiene preguntas todavía.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Escríbelas tú o pídeselas a Profe Bot.
              </p>
            </div>
          ) : (
            preguntas.map((p, i) => (
              <QuestionEditor
                key={p.key}
                numero={i + 1}
                draft={p}
                onChange={(cambio) => actualizar(p.key, cambio)}
                onRemove={() =>
                  setPreguntas((prev) => prev.filter((x) => x.key !== p.key))
                }
              />
            ))
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notas">Notas para Profe Bot (opcional)</Label>
          <p className="text-xs text-muted-foreground">
            Contexto que el agente usa al ayudar al alumno. No se le muestra
            como pregunta.
          </p>
          <Textarea
            id="notas"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={3}
            placeholder="Ej: insistir en que comparen denominadores antes de sumar."
          />
        </div>

        <div className="flex flex-wrap gap-3 pt-1">
          <SaveButton />
          <Button variant="outline" asChild>
            <Link href={`/teacher/activities/${activityId}/preview`}>
              <Eye className="w-4 h-4 mr-1" />
              Probarla
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href={`/teacher/activities/${activityId}`}>Cancelar</Link>
          </Button>
        </div>
      </form>

      <AssistantPanel
        topicId={topicId}
        topicName={topicName}
        onQuestions={agregarGeneradas}
      />
    </div>
  )
}

function SaveButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Guardando…' : 'Guardar cambios'}
    </Button>
  )
}

// ── Una pregunta ───────────────────────────────────────────────────────────

function QuestionEditor({
  numero,
  draft,
  onChange,
  onRemove,
}: {
  numero: number
  draft: Draft
  onChange: (cambio: Partial<Draft>) => void
  onRemove: () => void
}) {
  function cambiarOpcion(i: number, valor: string) {
    const options = [...draft.options]
    options[i] = valor
    onChange({ options })
  }

  function quitarOpcion(i: number) {
    const options = draft.options.filter((_, j) => j !== i)
    // Si se borra la opción correcta o una anterior, el índice se corre.
    let correctIndex = draft.correctIndex
    if (i === draft.correctIndex) correctIndex = 0
    else if (i < draft.correctIndex) correctIndex -= 1
    onChange({ options, correctIndex })
  }

  return (
    <div
      className={`rounded-lg border bg-card p-3 space-y-2.5 ${
        draft.nueva ? 'border-amber-300' : 'border-border'
      }`}
    >
      <div className="flex items-start gap-2">
        <span className="text-xs text-muted-foreground mt-2 w-4 shrink-0">
          {numero}.
        </span>
        <Textarea
          value={draft.question}
          onChange={(e) => onChange({ question: e.target.value })}
          rows={2}
          placeholder="Enunciado de la pregunta"
          className="text-sm"
          aria-label={`Enunciado de la pregunta ${numero}`}
        />
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          onClick={onRemove}
          aria-label={`Eliminar la pregunta ${numero}`}
        >
          <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
        </Button>
      </div>

      <div className="space-y-1.5 pl-6">
        {draft.options.map((o, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="radio"
              name={`correcta-${draft.key}`}
              checked={draft.correctIndex === i}
              onChange={() => onChange({ correctIndex: i })}
              className="shrink-0 accent-emerald-600"
              aria-label={`Marcar la opción ${i + 1} como correcta`}
            />
            <Input
              value={o}
              onChange={(e) => cambiarOpcion(i, e.target.value)}
              placeholder={`Opción ${i + 1}`}
              className="h-8 text-sm"
              aria-label={`Texto de la opción ${i + 1}`}
            />
            {draft.options.length > 2 && (
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                onClick={() => quitarOpcion(i)}
                aria-label={`Eliminar la opción ${i + 1}`}
              >
                <Trash2 className="w-3 h-3 text-muted-foreground" />
              </Button>
            )}
          </div>
        ))}

        {draft.options.length < 6 && (
          <button
            type="button"
            onClick={() => onChange({ options: [...draft.options, ''] })}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Agregar opción
          </button>
        )}
      </div>

      <p className="text-xs text-muted-foreground pl-6">
        El punto verde marca la respuesta correcta.
      </p>
    </div>
  )
}

// ── Profe Bot para el docente ──────────────────────────────────────────────

function AssistantPanel({
  topicId,
  topicName,
  onQuestions,
}: {
  topicId: string
  topicName: string
  onQuestions: (qs: QuizQuestion[]) => void
}) {
  const [intencion, setIntencion] = useState('')
  const [cantidad, setCantidad] = useState(3)
  const [dificultad, setDificultad] = useState('media')
  const [sugerencias, setSugerencias] = useState<string[]>([])
  const [cargando, setCargando] = useState<'sugerir' | 'generar' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [ultimo, setUltimo] = useState<number | null>(null)

  async function llamar(body: Record<string, unknown>) {
    const supabase = createClient()
    return supabase.functions.invoke<{
      success: boolean
      error?: string
      suggestions?: string[]
      questions?: QuizQuestion[]
    }>('teacher-assist', { body })
  }

  async function sugerir() {
    setCargando('sugerir')
    setError(null)
    const { data, error: invokeError } = await llamar({ mode: 'suggest', topic_id: topicId })
    setCargando(null)

    if (invokeError || !data?.success) {
      setError(
        await getEdgeFunctionErrorMessage(
          invokeError,
          data?.error ?? 'No pudimos traer sugerencias. Intenta de nuevo.',
        ),
      )
      return
    }
    setSugerencias(data.suggestions ?? [])
  }

  async function generar() {
    setCargando('generar')
    setError(null)
    setUltimo(null)
    const { data, error: invokeError } = await llamar({
      mode: 'generate',
      topic_id: topicId,
      intent: intencion.trim(),
      count: cantidad,
      difficulty: dificultad,
    })
    setCargando(null)

    if (invokeError || !data?.success) {
      setError(
        await getEdgeFunctionErrorMessage(
          invokeError,
          data?.error ?? 'No pudimos generar las preguntas. Intenta de nuevo.',
        ),
      )
      return
    }
    const qs = data.questions ?? []
    onQuestions(qs)
    setUltimo(qs.length)
  }

  return (
    <aside className="rounded-lg border border-border bg-card p-4 space-y-3 lg:sticky lg:top-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-violet-500" />
        <h2 className="text-sm font-semibold">Profe Bot te ayuda</h2>
      </div>
      <p className="text-xs text-muted-foreground">
        Arma preguntas de <span className="text-foreground">{topicName}</span> a
        partir de lo que quieras enseñar. Las agrega abajo para que las revises.
      </p>

      <div className="space-y-1.5">
        <Label htmlFor="intencion" className="text-xs">
          ¿Qué quieres que aprendan?
        </Label>
        <Textarea
          id="intencion"
          value={intencion}
          onChange={(e) => setIntencion(e.target.value)}
          rows={3}
          placeholder="Ej: que sepan cuándo conviene sumar y cuándo restar en problemas de la vida diaria."
          className="text-sm"
        />
      </div>

      <button
        type="button"
        onClick={sugerir}
        disabled={cargando !== null}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
      >
        {cargando === 'sugerir' ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Lightbulb className="w-3.5 h-3.5" />
        )}
        ¿No sabes por dónde empezar?
      </button>

      {sugerencias.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Toca una para usarla:</p>
          {sugerencias.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIntencion(s)}
              className="block w-full text-left text-xs rounded border border-border px-2 py-1.5 hover:bg-muted"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor="cantidad" className="text-xs">
            Cuántas
          </Label>
          <select
            id="cantidad"
            value={cantidad}
            onChange={(e) => setCantidad(Number(e.target.value))}
            className="flex h-8 w-full rounded-md border border-border bg-background px-2 text-sm text-foreground"
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="dificultad" className="text-xs">
            Dificultad
          </Label>
          <select
            id="dificultad"
            value={dificultad}
            onChange={(e) => setDificultad(e.target.value)}
            className="flex h-8 w-full rounded-md border border-border bg-background px-2 text-sm text-foreground"
          >
            {DIFICULTADES.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Button
        type="button"
        onClick={generar}
        disabled={cargando !== null}
        className="w-full"
        size="sm"
      >
        {cargando === 'generar' ? (
          <>
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            Escribiendo…
          </>
        ) : (
          <>
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Generar preguntas
          </>
        )}
      </Button>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {ultimo !== null && (
        <p className="flex items-center gap-1.5 text-xs text-emerald-600">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {ultimo} {ultimo === 1 ? 'pregunta agregada' : 'preguntas agregadas'} abajo.
        </p>
      )}
    </aside>
  )
}
