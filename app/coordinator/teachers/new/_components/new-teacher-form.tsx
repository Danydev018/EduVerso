'use client'

import Link from 'next/link'
import { useFormState } from 'react-dom'
import { createTeacher } from '../../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function NewTeacherForm() {
  const [state, action] = useFormState(createTeacher, { error: null })

  return (
    <form action={action} className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      {state.error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="full_name">Nombre completo</Label>
        <Input id="full_name" name="full_name" placeholder="Ej: Prof. Carlos Medina" required />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input id="email" name="email" type="email" placeholder="docente@escuela.edu.ve" required />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Contraseña inicial</Label>
        <Input id="password" name="password" type="password" placeholder="Mínimo 6 caracteres" required />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit">Registrar docente</Button>
        <Button variant="outline" asChild>
          <Link href="/coordinator/teachers">Cancelar</Link>
        </Button>
      </div>
    </form>
  )
}
