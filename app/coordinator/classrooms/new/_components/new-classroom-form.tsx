'use client'

import Link from 'next/link'
import { useFormState } from 'react-dom'
import { createClassroom } from '../../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Props = {
  currentYear: { id: string; name: string }
  grades: { id: number; name: string }[]
  teachers: { id: string; full_name: string }[]
}

export function NewClassroomForm({ currentYear, grades, teachers }: Props) {
  const [state, action] = useFormState(createClassroom, { error: null })

  return (
    <form action={action} className="glass-card p-6 space-y-4">
      {state.error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <input type="hidden" name="school_year_id" value={currentYear.id} />

      <div className="space-y-1.5">
        <Label htmlFor="grade_id">Grado</Label>
        <select
          id="grade_id"
          name="grade_id"
          required
          className="flex h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">Seleccionar grado</option>
          {grades.map((g) => (
            <option key={g.id} value={String(g.id)}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="section">Sección</Label>
        <Input
          id="section"
          name="section"
          placeholder="Ej: A"
          maxLength={1}
          required
          className="uppercase w-24"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="teacher_id">Docente asignado</Label>
        <select
          id="teacher_id"
          name="teacher_id"
          required
          className="flex h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">Seleccionar docente</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.full_name}
            </option>
          ))}
        </select>
        {teachers.length === 0 && (
          <p className="text-xs text-yellow-700">
            No hay docentes registrados.{' '}
            <Link href="/coordinator/teachers/new" className="underline">
              Registrar docente
            </Link>
            .
          </p>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit">Crear salón</Button>
        <Button variant="outline" asChild>
          <Link href="/coordinator/classrooms">Cancelar</Link>
        </Button>
      </div>
    </form>
  )
}
