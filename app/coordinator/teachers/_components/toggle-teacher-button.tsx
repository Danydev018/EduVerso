'use client'

import { useFormState } from 'react-dom'
import { toggleTeacherActive } from '../actions'

export function ToggleTeacherButton({ id, isActive }: { id: string; isActive: boolean }) {
  const [state, action] = useFormState(toggleTeacherActive, { error: null })

  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="is_active" value={String(isActive)} />
      <button
        type="submit"
        className={`text-xs hover:underline ${isActive ? 'text-red-500' : 'text-green-600'}`}
      >
        {isActive ? 'Desactivar' : 'Reactivar'}
      </button>
      {state.error && <span className="text-xs text-red-500 ml-2">{state.error}</span>}
    </form>
  )
}
