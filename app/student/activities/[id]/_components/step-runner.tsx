'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getEdgeFunctionErrorMessage } from '@/lib/edge-function-error'
import { reproducirSfx } from '@/lib/sfx'
import { Button } from '@/components/ui/button'
import {
  Loader2,
  Zap,
  CheckCircle2,
  XCircle,
  Rocket,
  Wrench,
  PartyPopper,
  ThumbsUp,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
/**
 * Una pregunta tal como la recibe el navegador: SIN la respuesta.
 *
 * Antes llegaba con `correctIndex` y la corrección se hacía acá. Ahora el
 * índice correcto solo aparece en la respuesta de `responder_quiz`, es decir
 * DESPUÉS de que el alumno contestó, que es cuando puede verlo sin que le
 * sirva para hacer trampa.
 */
type PreguntaSinRespuesta = {
  pregunta: string
  opciones: string[]
}

type Props = {
  activityId: string
  stepIndex: number
  isLast: boolean
  /** Preguntas y opciones del paso, o null si no tiene quiz. */
  quiz: PreguntaSinRespuesta[] | null
  /** Nivel del alumno ANTES de completar este paso, para detectar si subió de nivel. */
  previousLevel: number
}

type CompleteStepResponse = {
  success: boolean
  error?: string
  xp_earned?: number
  is_complete?: boolean
  total_xp?: number
  level?: number
}

/**
 * Umbrales del resultado final.
 *
 * El XP no depende del puntaje —completar el paso siempre lo otorga— pero el
 * niño sí necesita saber cómo le fue. Tres tramos en vez de aprobado/reprobado:
 * "más o menos" evita que quedarse a una respuesta se sienta igual que no
 * haber entendido nada.
 */
const UMBRAL_EXITO = 0.8
const UMBRAL_REGULAR = 0.5

export function StepRunner({
  activityId,
  stepIndex,
  isLast,
  quiz,
  previousLevel,
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reward, setReward] = useState<CompleteStepResponse | null>(null)
  const [pending, startTransition] = useTransition()

  // ── Estado del quiz, una pregunta a la vez ───────────────────────────────
  const [indice, setIndice] = useState(0)
  const [elegida, setElegida] = useState<number | null>(null)
  // null mientras no comprobó; true/false una vez comprobada.
  const [acerto, setAcerto] = useState<boolean | null>(null)
  const [aciertos, setAciertos] = useState(0)
  /** Índice correcto, tal como lo informó el servidor al corregir. */
  const [correctoDelServidor, setCorrectoDelServidor] = useState<number | null>(null)
  const [comprobando, setComprobando] = useState(false)
  const [errorQuiz, setErrorQuiz] = useState<string | null>(null)
  const [terminado, setTerminado] = useState(false)

  const total = quiz?.length ?? 0
  const pregunta = quiz?.[indice]
  const leveledUp = Boolean(reward?.level && reward.level > previousLevel)

  const resultado = useMemo(() => {
    if (total === 0) return 'exito' as const
    const proporcion = aciertos / total
    if (proporcion >= UMBRAL_EXITO) return 'exito' as const
    if (proporcion >= UMBRAL_REGULAR) return 'regular' as const
    return 'fracaso' as const
  }, [aciertos, total])

  /*
    La corrección la decide el SERVIDOR.

    El navegador ya no sabe cuál es la correcta, así que no puede corregir ni
    mentir: manda la opción elegida y recibe si acertó y cuál era. Ese mismo
    viaje es el que registra la respuesta para la métrica de acierto, y el
    servidor solo cuenta el primer intento de cada pregunta.
  */
  async function comprobar() {
    if (elegida === null || !pregunta || comprobando) return
    setComprobando(true)
    setErrorQuiz(null)

    const { data, error } = await createClient().rpc('responder_quiz', {
      p_activity_id: activityId,
      p_step_index: stepIndex,
      p_question_index: indice,
      p_chosen_index: elegida,
    })

    setComprobando(false)

    if (error || !data) {
      // Sin corrección no se sigue: dar por buena la respuesta sin que el
      // servidor la registre dejaría el porcentaje de acierto incompleto.
      setErrorQuiz('No pudimos revisar tu respuesta. Intenta otra vez.')
      return
    }

    const r = data as { acierto: boolean; indice_correcto: number }
    setCorrectoDelServidor(r.indice_correcto)
    setAcerto(r.acierto)
    if (r.acierto) setAciertos((n) => n + 1)
    reproducirSfx(r.acierto ? 'correcto' : 'incorrecto')
  }

  function continuar() {
    if (indice + 1 >= total) {
      setTerminado(true)
      // El puntaje final ya está completo acá: el sonido corresponde al
      // resultado incluyendo la pregunta que se acaba de responder.
      const proporcion = total === 0 ? 1 : aciertos / total
      reproducirSfx(
        proporcion >= UMBRAL_EXITO ? 'exito' : proporcion >= UMBRAL_REGULAR ? 'regular' : 'fracaso',
      )
      return
    }
    setIndice((i) => i + 1)
    setElegida(null)
    setAcerto(null)
    setCorrectoDelServidor(null)
    setErrorQuiz(null)
  }

  /*
    Reintentar recorre las preguntas otra vez para que el niño repase, pero el
    servidor ya no cuenta esas respuestas: solo registra el primer intento de
    cada pregunta. El `aciertos` local se reinicia porque es la pantalla, no la
    métrica; la métrica real vive en `quiz_results`.
  */
  function reintentar() {
    setIndice(0)
    setElegida(null)
    setAcerto(null)
    setAciertos(0)
    setTerminado(false)
    setCorrectoDelServidor(null)
    setErrorQuiz(null)
  }

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
      setError(
        await getEdgeFunctionErrorMessage(
          invokeError,
          'No pudimos registrar la reparación. Intenta de nuevo.',
        ),
      )
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

  // ── Pantalla de recompensa ───────────────────────────────────────────────
  if (reward) {
    if (leveledUp) {
      return (
        <div className="rounded-2xl border-2 border-orange-200 bg-gradient-to-b from-orange-50 to-white p-6 text-center space-y-3 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-16 h-16 mx-auto rounded-full bg-orange-500 flex items-center justify-center">
            <Rocket className="w-8 h-8 text-white" />
          </div>
          <p className="text-lg font-semibold text-orange-700">
            ¡La nave subió de nivel!
          </p>
          <p className="font-heading text-4xl font-bold text-orange-700">
            Nivel {reward.level}
          </p>
          <p className="text-sm text-indigo-500">
            +{reward.xp_earned} de energía · {reward.total_xp} en total
          </p>
          <Button
            onClick={handleContinue}
            disabled={pending}
            className="clay-btn h-11 rounded-2xl bg-orange-500 hover:bg-orange-500 text-white"
            style={{ ['--clay-shadow' as string]: '#C2410C' }}
          >
            {reward.is_complete ? '¡Ver resumen de la misión!' : 'Seguir a la próxima etapa'}
          </Button>
        </div>
      )
    }

    return (
      <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-6 text-center space-y-3 animate-in fade-in zoom-in-95 duration-300">
        <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500 flex items-center justify-center">
          <Zap className="w-7 h-7 text-white" fill="currentColor" />
        </div>
        <p className="font-heading text-3xl font-bold text-emerald-700">
          +{reward.xp_earned} de energía estelar
        </p>
        {reward.level && (
          <p className="text-sm text-indigo-500">
            Vas en <strong>nivel {reward.level}</strong> con{' '}
            <strong>{reward.total_xp}</strong> en total.
          </p>
        )}
        <Button
          onClick={handleContinue}
          disabled={pending}
          className="clay-btn h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-600 text-white"
          style={{ ['--clay-shadow' as string]: '#3730A3' }}
        >
          {reward.is_complete ? '¡Ver resumen de la misión!' : 'Seguir a la próxima etapa'}
        </Button>
      </div>
    )
  }

  // ── Paso sin preguntas ───────────────────────────────────────────────────
  if (!quiz || total === 0) {
    return (
      <div className="space-y-4">
        {error && <ErrorBanner mensaje={error} />}
        <BotonReparar loading={loading} isLast={isLast} onClick={handleComplete} />
      </div>
    )
  }

  // ── Resumen del quiz ─────────────────────────────────────────────────────
  if (terminado) {
    const cara = {
      exito: { Icon: PartyPopper, color: 'emerald', titulo: '¡Excelente!' },
      regular: { Icon: ThumbsUp, color: 'amber', titulo: '¡Casi, casi!' },
      fracaso: { Icon: RefreshCw, color: 'indigo', titulo: 'Sigue intentando' },
    }[resultado]

    const mensaje = {
      exito: 'Dominaste esta parte. La nave lo agradece.',
      regular: 'Vas bien, pero algunas se te escaparon. ¿Las repasas?',
      fracaso: 'Este tema todavía cuesta. Vuelve a intentarlo, no hay apuro.',
    }[resultado]

    return (
      <div className="space-y-4">
        <div
          className={cn(
            'rounded-2xl border-2 p-6 text-center space-y-3 animate-in fade-in zoom-in-95 duration-300',
            resultado === 'exito' && 'border-emerald-200 bg-emerald-50',
            resultado === 'regular' && 'border-amber-200 bg-amber-50',
            resultado === 'fracaso' && 'border-indigo-200 bg-indigo-50',
          )}
        >
          <div
            className={cn(
              'w-14 h-14 mx-auto rounded-full flex items-center justify-center',
              resultado === 'exito' && 'bg-emerald-500',
              resultado === 'regular' && 'bg-amber-500',
              resultado === 'fracaso' && 'bg-indigo-500',
            )}
          >
            <cara.Icon className="w-7 h-7 text-white" />
          </div>

          <p
            className={cn(
              'font-heading text-2xl font-bold',
              resultado === 'exito' && 'text-emerald-700',
              resultado === 'regular' && 'text-amber-700',
              resultado === 'fracaso' && 'text-indigo-700',
            )}
          >
            {cara.titulo}
          </p>

          <p className="font-heading text-4xl font-bold text-indigo-950">
            {aciertos} / {total}
          </p>
          <p className="text-sm text-indigo-500">{mensaje}</p>
        </div>

        {error && <ErrorBanner mensaje={error} />}

        <div className="space-y-2">
          <BotonReparar loading={loading} isLast={isLast} onClick={handleComplete} />
          <button
            type="button"
            onClick={reintentar}
            className="w-full text-sm text-indigo-500 hover:text-indigo-700 underline py-2"
          >
            Responder de nuevo
          </button>
        </div>
      </div>
    )
  }

  // ── Una pregunta a la vez ────────────────────────────────────────────────
  const comprobada = acerto !== null

  return (
    <div className="space-y-4">
      {/* Barra de avance por pregunta: el niño ve cuánto le falta, que es la
          diferencia entre un formulario largo y algo que se siente corto. */}
      <div className="flex items-center gap-2">
        <div className="flex-1 flex gap-1">
          {quiz.map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-2 flex-1 rounded-full transition-colors',
                i < indice && 'bg-emerald-400',
                i === indice && 'bg-indigo-500',
                i > indice && 'bg-indigo-100',
              )}
            />
          ))}
        </div>
        <span className="text-xs font-semibold text-indigo-400 tabular-nums">
          {indice + 1}/{total}
        </span>
      </div>

      <div key={indice} className="animate-in fade-in slide-in-from-right-4 duration-200">
        <p className="font-heading text-xl font-bold text-indigo-950 mb-3">
          {pregunta!.pregunta}
        </p>

        <div className="space-y-2">
          {pregunta!.opciones.map((opcion, i) => {
            const seleccionada = elegida === i
            const esCorrecta = i === correctoDelServidor

            return (
              <button
                key={i}
                type="button"
                disabled={comprobada}
                onClick={() => setElegida(i)}
                aria-pressed={seleccionada}
                // Ancla para las pruebas: identificar las opciones por su
                // texto ataba la prueba al contenido del quiz de ejemplo, y
                // cualquier cambio de redacción la rompía sin que nada
                // estuviera mal.
                data-quiz-opcion={i}
                className={cn(
                  // min-h-14 para que el dedo de un niño acierte sin pelear
                  'w-full min-h-14 text-left px-4 py-3 rounded-2xl border-2 text-base font-medium transition-all flex items-center justify-between gap-3',
                  !comprobada &&
                    !seleccionada &&
                    'border-indigo-100 bg-white text-indigo-950 hover:border-indigo-300 hover:bg-indigo-50 active:scale-[0.99]',
                  !comprobada &&
                    seleccionada &&
                    'border-indigo-500 bg-indigo-50 text-indigo-900',
                  comprobada && esCorrecta && 'border-emerald-400 bg-emerald-50 text-emerald-800',
                  comprobada &&
                    seleccionada &&
                    !esCorrecta &&
                    'border-red-400 bg-red-50 text-red-800',
                  comprobada &&
                    !seleccionada &&
                    !esCorrecta &&
                    'border-indigo-100 bg-white text-indigo-300',
                )}
              >
                <span>{opcion}</span>
                {comprobada && esCorrecta && (
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                )}
                {comprobada && seleccionada && !esCorrecta && (
                  <XCircle className="w-5 h-5 flex-shrink-0" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Franja de resultado: aparece bajo las opciones, como en las apps de
          idiomas, para que la corrección se lea sin perder de vista lo que
          eligió. */}
      {comprobada && (
        <div
          role="status"
          className={cn(
            'rounded-2xl px-4 py-3 animate-in fade-in slide-in-from-bottom-2 duration-200',
            acerto ? 'bg-emerald-100 text-emerald-900' : 'bg-red-100 text-red-900',
          )}
        >
          <p className="font-heading font-bold flex items-center gap-1.5">
            {acerto ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                ¡Correcto!
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4" />
                No era esa
              </>
            )}
          </p>
          {!acerto && (
            <p className="text-sm mt-0.5">
              La respuesta es: <strong>{pregunta!.opciones[correctoDelServidor ?? 0]}</strong>
            </p>
          )}
        </div>
      )}

      {error && <ErrorBanner mensaje={error} />}
      {errorQuiz && <ErrorBanner mensaje={errorQuiz} />}

      {!comprobada ? (
        <Button
          onClick={comprobar}
          disabled={elegida === null || comprobando}
          className={cn(
            'clay-btn w-full h-12 rounded-2xl text-white',
            elegida !== null && 'bg-indigo-600 hover:bg-indigo-600',
          )}
          style={
            elegida !== null ? { ['--clay-shadow' as string]: '#3730A3' } : undefined
          }
        >
          {comprobando ? 'Revisando…' : elegida === null ? 'Elige una respuesta' : 'Comprobar'}
        </Button>
      ) : (
        <Button
          onClick={continuar}
          className={cn(
            'clay-btn w-full h-12 rounded-2xl text-white',
            acerto ? 'bg-emerald-500 hover:bg-emerald-500' : 'bg-indigo-600 hover:bg-indigo-600',
          )}
          style={{ ['--clay-shadow' as string]: acerto ? '#047857' : '#3730A3' }}
        >
          {indice + 1 >= total ? 'Ver cómo me fue' : 'Continuar'}
        </Button>
      )}
    </div>
  )
}

function ErrorBanner({ mensaje }: { mensaje: string }) {
  return (
    <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
      {mensaje}
    </div>
  )
}

function BotonReparar({
  loading,
  isLast,
  onClick,
}: {
  loading: boolean
  isLast: boolean
  onClick: () => void
}) {
  return (
    <Button
      onClick={onClick}
      disabled={loading}
      className={cn(
        'clay-btn w-full h-12 rounded-2xl text-white',
        !loading && 'bg-orange-500 hover:bg-orange-500',
      )}
      style={!loading ? { ['--clay-shadow' as string]: '#C2410C' } : undefined}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Reparando...
        </>
      ) : (
        <>
          <Wrench className="w-4 h-4 mr-1.5" />
          {isLast ? '¡Terminar misión!' : 'Completar etapa'}
        </>
      )}
    </Button>
  )
}
