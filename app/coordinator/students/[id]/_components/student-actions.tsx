'use client'

import { useFormState } from 'react-dom'
import { toggleStudentActive, withdrawStudent } from '../../actions'
import { Button } from '@/components/ui/button'

type Props = {
  studentId: string
  isActive: boolean
  enrollmentId: string | null
  enrollmentStatus: string | null
}

export function StudentActions({ studentId, isActive, enrollmentId, enrollmentStatus }: Props) {
  const [toggleState, toggleAction] = useFormState(toggleStudentActive, { error: null })
  const [withdrawState, withdrawAction] = useFormState(withdrawStudent, { error: null })

  const canWithdraw = enrollmentStatus === 'active'

  return (
    <div className="glass-card p-6 space-y-4">
      <h2 className="font-semibold text-[hsl(var(--foreground))]">Acciones</h2>

      {(toggleState.error || withdrawState.error) && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {toggleState.error || withdrawState.error}
        </div>
      )}

      <form action={toggleAction} className="flex items-center gap-3">
        <input type="hidden" name="id" value={studentId} />
        <input type="hidden" name="is_active" value={String(isActive)} />
        <Button
          type="submit"
          variant={isActive ? 'outline' : 'secondary'}
          size="sm"
        >
          {isActive ? 'Desactivar cuenta' : 'Reactivar cuenta'}
        </Button>
        <span className="text-xs text-muted-foreground">
          {isActive ? 'El alumno no podrá iniciar sesión.' : 'El alumno podrá iniciar sesión.'}
        </span>
      </form>

      {canWithdraw && (
        <form
          action={withdrawAction}
          onSubmit={(e) => {
            if (!confirm('¿Retirar a este alumno? Esta acción desactiva su cuenta y marca la matrícula como retirado.')) {
              e.preventDefault()
            }
          }}
        >
          <input type="hidden" name="student_id" value={studentId} />
          {enrollmentId && <input type="hidden" name="enrollment_id" value={enrollmentId} />}
          <div className="flex items-center gap-3">
            <Button type="submit" variant="destructive" size="sm">
              Retirar alumno
            </Button>
            <span className="text-xs text-muted-foreground">
              Cambia la matrícula a &quot;retirado&quot; y desactiva la cuenta.
            </span>
          </div>
        </form>
      )}
    </div>
  )
}
