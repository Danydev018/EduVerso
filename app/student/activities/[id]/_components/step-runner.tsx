'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Loader2, Sparkles } from 'lucide-react'

type Props = {
  activityId: string
  stepIndex: number
  isLast: boolean
}

type CompleteStepResponse = {
  success: boolean
  error?: string
  xp_earned?: number
  is_complete?: boolean
  total_xp?: number
  level?: number
}

export function StepRunner({ activityId, stepIndex, isLast }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reward, setReward] = useState<CompleteStepResponse | null>(null)
  const [pending, startTransition] = useTransition()

  async function handleComplete() {
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data, error: invokeError } = await supabase.functions.invoke<CompleteStepResponse>(
      'complete-step',
      { body: { activity_id: activityId, step_index: stepIndex } },
    )

    setLoading(false)

    if (invokeError || !data) {
      setError(invokeError?.message ?? 'No pudimos completar el paso. Intentá de nuevo.')
      return
    }
    if (!data.success) {
      setError(data.error ?? 'Algo salió mal.')
      return
    }

    setReward(data)
  }

  function handleContinue() {
    setReward(null)
    startTransition(() => router.refresh())
  }

  if (reward) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center space-y-3 animate-in fade-in zoom-in-95 duration-300">
        <div className="w-14 h-14 mx-auto rounded-full bg-green-500 flex items-center justify-center">
          <Sparkles className="w-7 h-7 text-white" />
        </div>
        <p className="text-3xl font-bold text-green-700">
          +{reward.xp_earned} XP
        </p>
        {reward.level && (
          <p className="text-sm text-gray-600">
            Vas en <strong>nivel {reward.level}</strong> con{' '}
            <strong>{reward.total_xp} XP</strong> totales.
          </p>
        )}
        <Button onClick={handleContinue} disabled={pending}>
          {reward.is_complete ? '¡Ver resumen!' : 'Continuar al siguiente paso'}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <Button onClick={handleComplete} disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Guardando...
          </>
        ) : (
          <>{isLast ? '¡Terminar actividad!' : 'Completar paso'}</>
        )}
      </Button>
    </div>
  )
}
