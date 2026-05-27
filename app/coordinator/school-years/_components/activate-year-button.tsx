'use client'

import { useFormState } from 'react-dom'
import { activateSchoolYear } from '../actions'

export function ActivateYearButton({ id, name }: { id: string; name: string }) {
  const [state, action] = useFormState(activateSchoolYear, { error: null })

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(`¿Activar el año escolar "${name}"? El año activo actual quedará inactivo.`)) {
          e.preventDefault()
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="text-blue-600 hover:underline text-xs">
        Activar
      </button>
      {state.error && <span className="text-xs text-red-500 ml-2">{state.error}</span>}
    </form>
  )
}
