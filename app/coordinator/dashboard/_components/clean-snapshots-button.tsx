'use client'

import { useFormState } from 'react-dom'
import { cleanExpiredSnapshots } from '../actions'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

export function CleanSnapshotsButton() {
  const [state, action] = useFormState(cleanExpiredSnapshots, {
    error: null,
    deletedCount: null,
  })

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (
          !confirm(
            'Esto borra permanentemente los snapshots de egresados cuya fecha de expiración ya pasó. ¿Continuar?',
          )
        ) {
          e.preventDefault()
        }
      }}
      className="space-y-2"
    >
      <Button type="submit" variant="outline" size="sm" className="gap-2">
        <Trash2 className="w-3.5 h-3.5" />
        Limpiar snapshots expirados
      </Button>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      {state.deletedCount !== null && !state.error && (
        <p className="text-xs text-green-600">
          {state.deletedCount === 0
            ? 'No había snapshots expirados.'
            : `Se borraron ${state.deletedCount} snapshot(s) expirado(s).`}
        </p>
      )}
    </form>
  )
}
