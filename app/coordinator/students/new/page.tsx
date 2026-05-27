'use client'

import Link from 'next/link'
import { useFormState } from 'react-dom'
import { createStudent } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function NewStudentPage() {
  const [state, action] = useFormState(createStudent, { error: null })

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link href="/coordinator/students" className="text-sm text-blue-600 hover:underline">
          ← Volver a alumnos
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Registrar alumno</h1>
      </div>

      <form action={action} className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        {state.error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {state.error}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="full_name">Nombre completo</Label>
          <Input id="full_name" name="full_name" placeholder="Ej: María González" required />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="birth_date">Fecha de nacimiento</Label>
          <Input id="birth_date" name="birth_date" type="date" required />
          <p className="text-xs text-gray-500">La edad se calcula automáticamente a partir de esta fecha.</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input id="email" name="email" type="email" placeholder="alumno@escuela.edu.ve" required />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Contraseña inicial</Label>
          <Input id="password" name="password" type="password" placeholder="Mínimo 6 caracteres" required />
          <p className="text-xs text-gray-500">El alumno podrá cambiarla más adelante.</p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit">Crear alumno</Button>
          <Button variant="outline" asChild>
            <Link href="/coordinator/students">Cancelar</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
