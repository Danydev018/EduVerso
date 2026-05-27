'use client'

import { useFormState } from 'react-dom'
import { updateStudent } from '../../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Student = {
  id: string
  full_name: string
  birth_date: string
}

export function EditStudentForm({ student }: { student: Student }) {
  const [state, action] = useFormState(updateStudent, { error: null })

  return (
    <form action={action} className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      <h2 className="font-semibold text-gray-700">Editar datos</h2>

      {state.error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <input type="hidden" name="id" value={student.id} />

      <div className="space-y-1.5">
        <Label htmlFor="full_name">Nombre completo</Label>
        <Input id="full_name" name="full_name" defaultValue={student.full_name} required />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="birth_date">Fecha de nacimiento</Label>
        <Input id="birth_date" name="birth_date" type="date" defaultValue={student.birth_date} required />
      </div>

      <Button type="submit" size="sm">Guardar cambios</Button>
    </form>
  )
}
