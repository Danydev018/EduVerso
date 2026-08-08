'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useFormState } from 'react-dom'
import { createActivity } from '../../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type Template = {
  id: string
  name: string
  description: string | null
  stepCount: number
  xpTotal: number
}

type Subject = { id: string; name: string }
type Topic = { id: string; name: string; subject_id: string }

type Props = {
  templates: Template[]
  subjects: Subject[]
  topics: Topic[]
}

export function NewActivityForm({ templates, subjects, topics }: Props) {
  const [state, action] = useFormState(createActivity, { error: null })
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('')

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
          className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Seleccionar plantilla</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        {templateInfo && (
          <p className="text-xs text-gray-500">
            {templateInfo.description}{' '}
            <span className="text-gray-400">
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
          className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
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
          className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">
            {selectedSubject ? 'Seleccionar tópico' : 'Elegí una materia primero'}
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
