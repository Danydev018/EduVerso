'use client'

import { useMemo, useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { assignFromBank, unassignActivity } from '../../actions'
import { shipPartIcon } from '@/lib/ship-parts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Check, ChevronDown, Search, Plus, Lock } from 'lucide-react'

export interface BankEntry {
  id: string
  title: string
  difficulty: 'facil' | 'media' | 'dificil'
  subjectId: string
  subjectName: string
  topicName: string
  templateName: string
  part: { id: string; name: string; icon: string; color: string } | null
  esPropia: boolean
  questions: { question: string; options: string[]; correctIndex: number }[]
  /** null si todavía no está en el salón del docente. */
  asignacion: {
    activityId: string
    completados: number
    enProgreso: number
  } | null
}

type Props = {
  entries: BankEntry[]
  subjects: { id: string; name: string }[]
  parts: { id: string; name: string; icon: string; color: string }[]
}

const DIFICULTADES = [
  { id: 'facil', label: 'Fácil', clase: 'success' as const },
  { id: 'media', label: 'Media', clase: 'secondary' as const },
  { id: 'dificil', label: 'Difícil', clase: 'warning' as const },
]

export function RepositoryBrowser({ entries, subjects, parts }: Props) {
  const [materia, setMateria] = useState('')
  const [dificultad, setDificultad] = useState('')
  const [pieza, setPieza] = useState('')
  const [busqueda, setBusqueda] = useState('')

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return entries.filter((e) => {
      if (materia && e.subjectId !== materia) return false
      if (dificultad && e.difficulty !== dificultad) return false
      if (pieza && e.part?.id !== pieza) return false
      if (q && !`${e.title} ${e.topicName}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [entries, materia, dificultad, pieza, busqueda])

  // Solo se ofrecen las piezas que alguna evaluación de este grado repara:
  // un filtro que no devuelve nada nunca es peor que no tener el filtro.
  const piezasEnUso = useMemo(() => {
    const ids = new Set(entries.map((e) => e.part?.id).filter(Boolean))
    return parts.filter((p) => ids.has(p.id))
  }, [entries, parts])

  const hayFiltro = materia || dificultad || pieza || busqueda

  return (
    <div className="grid gap-5 lg:grid-cols-[13rem_1fr]">
      <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar tema"
            className="pl-8 h-8 text-sm"
            aria-label="Buscar una evaluación por título o tema"
          />
        </div>

        <FilterGroup
          titulo="Materia"
          opciones={subjects.map((s) => ({ id: s.id, label: s.name }))}
          valor={materia}
          onChange={setMateria}
        />

        <FilterGroup
          titulo="Dificultad"
          opciones={DIFICULTADES.map((d) => ({ id: d.id, label: d.label }))}
          valor={dificultad}
          onChange={setDificultad}
        />

        {piezasEnUso.length > 0 && (
          <FilterGroup
            titulo="Pieza que repara"
            opciones={piezasEnUso.map((p) => ({ id: p.id, label: p.name }))}
            valor={pieza}
            onChange={setPieza}
          />
        )}
      </aside>

      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">
          {visibles.length} de {entries.length} evaluaciones
          {hayFiltro && (
            <button
              type="button"
              onClick={() => {
                setMateria('')
                setDificultad('')
                setPieza('')
                setBusqueda('')
              }}
              className="ml-2 underline hover:text-foreground"
            >
              Quitar filtros
            </button>
          )}
        </p>

        {visibles.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Ninguna evaluación coincide con esos filtros.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 items-start">
            {visibles.map((e) => (
              <EvaluationCard key={e.id} entry={e} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function FilterGroup({
  titulo,
  opciones,
  valor,
  onChange,
}: {
  titulo: string
  opciones: { id: string; label: string }[]
  valor: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-1.5">{titulo}</p>
      <div className="flex flex-col gap-0.5">
        <FilterOption label="Todas" activo={!valor} onClick={() => onChange('')} />
        {opciones.map((o) => (
          <FilterOption
            key={o.id}
            label={o.label}
            activo={valor === o.id}
            onClick={() => onChange(valor === o.id ? '' : o.id)}
          />
        ))}
      </div>
    </div>
  )
}

function FilterOption({
  label,
  activo,
  onClick,
}: {
  label: string
  activo: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={`text-left text-sm rounded px-2 py-1 transition-colors ${
        activo
          ? 'bg-primary/10 text-primary font-medium'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      {label}
    </button>
  )
}

function EvaluationCard({ entry }: { entry: BankEntry }) {
  const [abierta, setAbierta] = useState(false)
  const [state, action] = useFormState(assignFromBank, { error: null })

  const PartIcon = shipPartIcon(entry.part?.icon)
  const dificultad = DIFICULTADES.find((d) => d.id === entry.difficulty)

  return (
    <div className="rounded-lg border border-border bg-card p-3 flex flex-col gap-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground leading-snug">
            {entry.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {entry.subjectName} · {entry.topicName}
          </p>
        </div>
        {dificultad && (
          <Badge variant={dificultad.clase} className="shrink-0">
            {dificultad.label}
          </Badge>
        )}
      </div>

      {entry.part && (
        <div className="flex items-center gap-1.5 text-xs">
          <PartIcon className={`w-3.5 h-3.5 shrink-0 ${entry.part.color}`} />
          <span className="text-muted-foreground">Repara: </span>
          <span className="text-foreground font-medium truncate">
            {entry.part.name}
          </span>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {entry.questions.length}{' '}
        {entry.questions.length === 1 ? 'pregunta' : 'preguntas'} ·{' '}
        {entry.templateName}
        {entry.esPropia && ' · tuya'}
      </p>

      <button
        type="button"
        onClick={() => setAbierta((v) => !v)}
        aria-expanded={abierta}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground w-fit"
      >
        <ChevronDown
          className={`w-3 h-3 transition-transform ${abierta ? 'rotate-180' : ''}`}
        />
        {abierta ? 'Ocultar preguntas' : 'Ver preguntas'}
      </button>

      {abierta && (
        <ol className="space-y-2 border-l-2 border-border pl-3">
          {entry.questions.map((q, i) => (
            <li key={i} className="text-xs">
              <p className="text-foreground font-medium">{q.question}</p>
              <ul className="mt-0.5 space-y-0.5">
                {q.options.map((o, j) => (
                  <li
                    key={j}
                    className={
                      j === q.correctIndex
                        ? 'text-emerald-600 font-medium'
                        : 'text-muted-foreground'
                    }
                  >
                    {j === q.correctIndex ? '✓ ' : '· '}
                    {o}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}

      {state.error && (
        <p className="text-xs text-red-600">{state.error}</p>
      )}

      <div className="mt-auto pt-1">
        {entry.asignacion ? (
          <AssignedActions asignacion={entry.asignacion} />
        ) : (
          <form action={action}>
            <input type="hidden" name="bank_id" value={entry.id} />
            <AssignButton />
          </form>
        )}
      </div>
    </div>
  )
}

/**
 * Estado de una evaluación que ya está en el salón.
 *
 * Se puede quitar mientras nadie la haya completado. Si alguien avanzó sin
 * terminar, se pide confirmación en vez de borrar de una: ese avance se
 * pierde y el docente tiene que enterarse antes, no después.
 */
function AssignedActions({
  asignacion,
}: {
  asignacion: NonNullable<BankEntry['asignacion']>
}) {
  const [confirmando, setConfirmando] = useState(false)
  const [state, action] = useFormState(unassignActivity, { error: null })

  const { completados, enProgreso } = asignacion
  const bloqueada = completados > 0

  return (
    <div className="space-y-1.5">
      <p className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
        <Check className="w-3.5 h-3.5" />
        Ya está en tu salón
      </p>

      {state.error && <p className="text-xs text-red-600">{state.error}</p>}

      {bloqueada ? (
        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <Lock className="w-3.5 h-3.5 shrink-0 mt-px" />
          <span>
            {completados} {completados === 1 ? 'alumno la' : 'alumnos la'}{' '}
            completó. Ya no se puede quitar.
          </span>
        </p>
      ) : confirmando ? (
        <form action={action} className="space-y-1.5">
          <input type="hidden" name="activity_id" value={asignacion.activityId} />
          <p className="text-xs text-muted-foreground">
            {enProgreso > 0
              ? `Se perderá el avance de ${enProgreso} ${
                  enProgreso === 1 ? 'alumno que la empezó' : 'alumnos que la empezaron'
                }.`
              : 'Se quitará del salón. Puedes volver a asignarla cuando quieras.'}
          </p>
          <div className="flex gap-1.5">
            <UnassignButton />
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-xs"
              onClick={() => setConfirmando(false)}
            >
              Cancelar
            </Button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          className="text-xs text-muted-foreground underline hover:text-red-600"
        >
          Quitar de mi salón
        </button>
      )}
    </div>
  )
}

function UnassignButton() {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      size="sm"
      variant="destructive"
      className="text-xs"
      disabled={pending}
    >
      {pending ? 'Quitando…' : 'Sí, quitar'}
    </Button>
  )
}

function AssignButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="sm" className="w-full" disabled={pending}>
      {pending ? (
        'Asignando…'
      ) : (
        <>
          <Plus className="w-3.5 h-3.5 mr-1" />
          Asignar a mi salón
        </>
      )}
    </Button>
  )
}
