'use client'

import { useFormState } from 'react-dom'
import { removeStudentFromClassroom } from '../../actions'

type Props = { enrollmentId: string; classroomId: string }

export function RemoveStudentButton({ enrollmentId, classroomId }: Props) {
  const [state, action] = useFormState(removeStudentFromClassroom, { error: null })

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm('¿Quitar a este alumno del salón? La matrícula se eliminará.')) {
          e.preventDefault()
        }
      }}
    >
      <input type="hidden" name="enrollment_id" value={enrollmentId} />
      <input type="hidden" name="classroom_id" value={classroomId} />
      <button
        type="submit"
        className="text-red-500 hover:text-red-700 text-xs hover:underline"
      >
        Quitar
      </button>
    </form>
  )
}
