'use client'

import { useFormState } from 'react-dom'
import { assignStudentToClassroom } from '../../actions'
import { Button } from '@/components/ui/button'

type Props = {
  classroomId: string
  schoolYearId: string
  availableStudents: { id: string; full_name: string }[]
}

export function AssignStudentForm({ classroomId, schoolYearId, availableStudents }: Props) {
  const [state, action] = useFormState(assignStudentToClassroom, { error: null })

  return (
    <form action={action} className="flex flex-wrap gap-3 items-end">
      {state.error && (
        <p className="w-full text-sm text-red-600">{state.error}</p>
      )}

      <input type="hidden" name="classroom_id" value={classroomId} />
      <input type="hidden" name="school_year_id" value={schoolYearId} />

      <div className="flex-1 min-w-48">
        <select
          name="student_id"
          required
          className="flex h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">Seleccionar alumno...</option>
          {availableStudents.map((s) => (
            <option key={s.id} value={s.id}>
              {s.full_name}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" size="sm">Asignar</Button>
    </form>
  )
}
