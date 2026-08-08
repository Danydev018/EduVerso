'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ArrowUpCircle, Loader2, CheckCircle } from 'lucide-react'

// ---------------------------------------------------------------------------
// Botón para promover a un estudiante (Client Component)
//
// Cambia el estado de la matrícula de 'active' a 'promoted' en la tabla
// enrollments. Muestra una confirmación antes de ejecutar la acción y se
// deshabilita una vez que el estudiante ya fue promovido.
// ---------------------------------------------------------------------------

interface PromoteButtonProps {
  enrollmentId: string
  studentName: string
}

export function PromoteButton({ enrollmentId, studentName }: PromoteButtonProps) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [promoted, setPromoted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePromote() {
    setLoading(true)
    setError(null)

    const supabase = createClient()

    const { error: updateError } = await supabase
      .from('enrollments')
      .update({ status: 'promoted' })
      .eq('id', enrollmentId)

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      setShowConfirm(false)
      return
    }

    setPromoted(true)
    setLoading(false)
    setShowConfirm(false)
    router.refresh()
  }

  // Si ya fue promovido, mostrar indicador
  if (promoted) {
    return (
      <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-md px-4 py-2">
        <CheckCircle className="w-4 h-4" />
        <span className="text-sm font-medium">Promovido</span>
      </div>
    )
  }

  return (
    <div>
      {error && (
        <p className="text-sm text-red-600 mb-2 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          Error: {error}
        </p>
      )}

      {!showConfirm ? (
        <Button
          onClick={() => setShowConfirm(true)}
          disabled={loading}
          variant="default"
          size="sm"
          className="gap-2"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ArrowUpCircle className="w-4 h-4" />
          )}
          Promover a {studentName.split(' ')[0]}
        </Button>
      ) : (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-md px-4 py-3">
          <p className="text-sm text-amber-800 flex-1">
            ¿Promover a <strong>{studentName}</strong>? Esto cambiará su matrícula a &quot;promovido&quot;.
          </p>
          <div className="flex items-center gap-2">
            <Button
              onClick={handlePromote}
              disabled={loading}
              variant="default"
              size="sm"
              className="gap-1"
            >
              {loading && <Loader2 className="w-3 h-3 animate-spin" />}
              Sí, promover
            </Button>
            <Button
              onClick={() => setShowConfirm(false)}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
