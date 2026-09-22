'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useFormState } from 'react-dom'
import { createActivity } from '../../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { shipPartIcon } from '@/lib/ship-parts'

type Template = {
  id: string
  name: string
  description: string | null
  stepCount: number
  xpTotal: number
}

type Subject = { id: string; name: string }
type Topic = { id: string; name: string; subject_id: string }
type ShipPart = {
  id: string
  name: string
  description: string
  icon: string
  color: string
}

type Props = {
  templates: Template[]
  subjects: Subject[]
  topics: Topic[]
  shipParts: ShipPart[]
}

export function NewActivityForm({ templates, subjects, topics, shipParts }: Props) {
  const [state, action] = useFormState(createActivity, { error: null })
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [selectedPart, setSelectedPart] = useState('')

  const filteredTopics = useMemo(
    () => topics.filter((t) => t.subject_id === selectedSubject),
    [topics, selectedSubject],
  )

  const templateInfo = useMemo(
    () => templates.find((t) => t.id === selectedTemplate),
    [templates, selectedTemplate],
  )

  return (
    <form action={action} className="glass-card p-6 space-y-4">
      {state.error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="template_id">Plantilla</Label>
        <select
          id="template_id"
          name="template_id"
          required
          value={selectedTemplate}
          onChange={(e) => setSelectedTemplate(e.target.value)}
          className="flex h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">Seleccionar plantilla</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        {templateInfo && (
          <p className="text-xs text-muted-foreground">
            {templateInfo.description}{' '}
            <span className="text-muted-foreground">
              · {templateInfo.stepCount} pasos · hasta {templateInfo.xpTotal} XP
            </span>
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="subject_id">Materia</Label>
        <select
          id="subject_id"
          name="subject_id"
          required
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="flex h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">Seleccionar materia</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="topic_id">Tópico</Label>
        <select
          id="topic_id"
          name="topic_id"
          required
          disabled={!selectedSubject}
          className="flex h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">
            {selectedSubject ? 'Seleccionar tópico' : 'Elige una materia primero'}
          </option>
          {filteredTopics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          name="title"
          placeholder="Ej: Fracciones equivalentes"
          maxLength={120}
          required
        />
      </div>

      <fieldset className="space-y-1.5">
        <legend className="text-sm font-medium leading-none mb-1.5">
          Pieza de la nave que repara
        </legend>
        <p className="text-xs text-muted-foreground mb-2">
          El alumno verá qué parte de su nave arregla al completar esta
          actividad. Opcional.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {shipParts.map((p) => {
            const Icon = shipPartIcon(p.icon)
            const activa = selectedPart === p.id
            return (
              <button
                key={p.id}
                type="button"
                title={p.description}
                aria-pressed={activa}
                onClick={() => setSelectedPart(activa ? '' : p.id)}
                className={`flex flex-col items-center gap-1 rounded-md border px-2 py-2.5 text-center transition-colors ${
                  activa
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:bg-muted'
                }`}
              >
                <Icon className={`w-4 h-4 ${p.color}`} />
                <span className="text-xs leading-tight text-foreground">
                  {p.name}
                </span>
              </button>
            )
          })}
        </div>
        <input type="hidden" name="ship_part_id" value={selectedPart} />
      </fieldset>

      <div className="space-y-1.5">
        <Label htmlFor="ai_context">Contexto para Profe Bot (opcional)</Label>
        <Textarea
          id="ai_context"
          name="ai_context"
          placeholder="Notas o instrucciones extra para el agente de IA."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="available_from">Disponible desde</Label>
          <Input
            id="available_from"
            name="available_from"
            type="datetime-local"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="available_until">Disponible hasta</Label>
          <Input
            id="available_until"
            name="available_until"
            type="datetime-local"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit">Crear actividad</Button>
        <Button variant="outline" asChild>
          <Link href="/teacher/activities">Cancelar</Link>
        </Button>
      </div>
    </form>
  )
}
