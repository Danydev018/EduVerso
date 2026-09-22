'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { ArrowUpCircle, Loader2, CheckCircle } from 'lucide-react'
import { promoteStudent, type PromoteState } from '../../actions'

// ---------------------------------------------------------------------------
// Botón para promover a un estudiante (Client Component)
//
// El UPDATE se hace en un Server Action (../../actions.ts) en vez de con el
// SDK de Supabase en el navegador: ese import arrastraba ~75 kB de JS a esta
// página solo para una escritura. La autorización no cambia — el action usa
// la sesión del docente, así que sigue rigiendo la política RLS
// `enrollments_promote`.
// ---------------------------------------------------------------------------

interface PromoteButtonProps {
  enrollmentId: string
  studentId: string
  studentName: string
}

const INITIAL: PromoteState = { error: null, promoted: false }

export function PromoteButton({
  enrollmentId,
  studentId,
  studentName,
}: PromoteButtonProps) {
  const [state, action] = useFormState(promoteStudent, INITIAL)
  const [showConfirm, setShowConfirm] = useState(false)

  if (state.promoted) {
    return (
      <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-md px-4 py-2">
        <CheckCircle className="w-4 h-4" />
        <span className="text-sm font-medium">Promovido</span>
      </div>
    )
  }

  return (
    <div>
      {state.error && (
        <p className="text-sm text-red-600 mb-2 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          Error: {state.error}
        </p>
      )}

      {!showConfirm ? (
        <Button
          onClick={() => setShowConfirm(true)}
          variant="default"
          size="sm"
          className="gap-2"
        >
          <ArrowUpCircle className="w-4 h-4" />
          Promover a {studentName.split(' ')[0]}
        </Button>
      ) : (
        <form
          action={action}
          className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-md px-4 py-3"
        >
          <input type="hidden" name="enrollment_id" value={enrollmentId} />
          <input type="hidden" name="student_id" value={studentId} />
          <p className="text-sm text-amber-800 flex-1">
            ¿Promover a <strong>{studentName}</strong>? Esto cambiará su matrícula a
            &quot;promovido&quot;.
          </p>
          <div className="flex items-center gap-2">
            <ConfirmButtons onCancel={() => setShowConfirm(false)} />
          </div>
        </form>
      )}
    </div>
  )
}

/** Subcomponente: useFormStatus solo funciona dentro del <form>. */
function ConfirmButtons({ onCancel }: { onCancel: () => void }) {
  const { pending } = useFormStatus()

  return (
    <>
      <Button type="submit" disabled={pending} variant="default" size="sm" className="gap-1">
        {pending && <Loader2 className="w-3 h-3 animate-spin" />}
        Sí, promover
      </Button>
      <Button type="button" onClick={onCancel} disabled={pending} variant="outline" size="sm">
        Cancelar
      </Button>
    </>
  )
}
