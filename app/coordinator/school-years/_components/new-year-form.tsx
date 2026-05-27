'use client'

import { useFormState } from 'react-dom'
import { createSchoolYear } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function NewYearForm() {
  const [state, action] = useFormState(createSchoolYear, { error: null })

  return (
    <form action={action} className="space-y-4">
      {state.error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nombre del año</Label>
          <Input id="name" name="name" placeholder="Ej: 2026-2027" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="start_date">Fecha de inicio</Label>
          <Input id="start_date" name="start_date" type="date" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="end_date">Fecha de fin</Label>
          <Input id="end_date" name="end_date" type="date" required />
        </div>
      </div>

      <Button type="submit" size="sm">Crear año escolar</Button>
    </form>
  )
}
