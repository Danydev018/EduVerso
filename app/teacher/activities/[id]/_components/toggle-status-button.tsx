'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { toggleActivityStatus } from '../../actions'
import { Button } from '@/components/ui/button'
import { Play, Pause } from 'lucide-react'

type Props = {
  activityId: string
  currentStatus: 'draft' | 'active' | 'completed'
}

export function ToggleActivityStatusButton({ activityId, currentStatus }: Props) {
  const [state, action] = useFormState(toggleActivityStatus, { error: null })

  if (currentStatus === 'completed') return null

  return (
    <form action={action} className="flex flex-col items-end gap-1">
      <input type="hidden" name="activity_id" value={activityId} />
      <input type="hidden" name="current_status" value={currentStatus} />
      <SubmitBtn isActive={currentStatus === 'active'} />
      {state.error && (
        <p className="text-xs text-red-600">{state.error}</p>
      )}
    </form>
  )
}

function SubmitBtn({ isActive }: { isActive: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      disabled={pending}
      variant={isActive ? 'outline' : 'default'}
    >
      {isActive ? (
        <>
          <Pause className="w-4 h-4 mr-1" />
          Pausar
        </>
      ) : (
        <>
          <Play className="w-4 h-4 mr-1" />
          Activar
        </>
      )}
    </Button>
  )
}
