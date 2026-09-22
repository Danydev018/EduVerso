'use client'

import { useState } from 'react'
import type { QuizQuestion } from '@/lib/quiz'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  CheckCircle2,
  XCircle,
  Radar,
  ClipboardCheck,
  Wrench,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react'

export type PreviewStep = {
  index: number
  type: 'introduction' | 'quiz' | 'challenge'
  title: string
  description: string
  xp_reward: number
  duration_minutes: number
  ai_enabled: boolean
}

/** Los mismos rótulos narrativos que ve el alumno, para que la prueba
 *  refleje la pantalla real y no una versión simplificada. */
const STEP_META = {
  introduction: { label: 'Escaneo de la zona', Icon: Radar },
  quiz: { label: 'Prueba de sistemas', Icon: ClipboardCheck },
  challenge: { label: 'Reparación final', Icon: Wrench },
} as const

type Props = {
  steps: PreviewStep[]
  /** Preguntas del paso de quiz, o null si la actividad no tiene. */
  quiz: QuizQuestion[] | null
}

export function PreviewRunner({ steps, quiz }: Props) {
  const [actual, setActual] = useState(0)
  const [respuestas, setRespuestas] = useState<Record<number, number>>({})

  const paso = steps[actual]
  const meta = STEP_META[paso.type]
  const esQuiz = paso.type === 'quiz' && quiz !== null && quiz.length > 0

  const aciertos = quiz
    ? quiz.reduce(
        (n, q, i) => n + (respuestas[i] === q.correctIndex ? 1 : 0),
        0,
      )
    : 0
  const respondidas = Object.keys(respuestas).length

  return (
    <div className="space-y-4">
      {/* Recorrido libre: el docente prueba el paso que quiera, sin tener
          que completar los anteriores como sí hace el alumno. */}
      <div className="flex flex-wrap gap-1.5">
        {steps.map((s, i) => {
          const Icon = STEP_META[s.type].Icon
          return (
            <button
              key={s.index}
              type="button"
              onClick={() => setActual(i)}
              aria-current={i === actual}
              className={cn(
                'flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors',
                i === actual
                  ? 'border-primary bg-primary/10 text-primary font-medium'
                  : 'border-border text-muted-foreground hover:bg-muted',
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {s.title}
            </button>
          )
        })}
      </div>

      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div>
          <p className="text-xs text-muted-foreground">{meta.label}</p>
          <h2 className="text-lg font-semibold text-foreground">{paso.title}</h2>
        </div>

        <p className="text-sm text-muted-foreground">{paso.description}</p>

        <p className="text-xs text-muted-foreground">
          {paso.xp_reward} XP · {paso.duration_minutes} min
          {paso.ai_enabled ? ' · el alumno puede pedir pistas a Profe Bot' : ' · sin ayuda de Profe Bot'}
        </p>

        {paso.type === 'quiz' && !esQuiz && (
          <div className="rounded-md border border-dashed border-amber-300 bg-amber-50 px-3 py-3">
            <p className="text-sm text-amber-800">
              Este paso es de preguntas, pero la actividad no tiene ninguna
              cargada. El alumno lo vería vacío.
            </p>
          </div>
        )}

        {esQuiz && (
          <div className="space-y-3 pt-1">
            {quiz.map((q, qi) => {
              const elegida = respuestas[qi]
              const respondida = elegida !== undefined
              return (
                <div key={qi} className="rounded-md border border-border p-3 space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    {qi + 1}. {q.question}
                  </p>
                  <div className="space-y-1.5">
                    {q.options.map((o, oi) => {
                      const correcta = oi === q.correctIndex
                      return (
                        <button
                          key={oi}
                          type="button"
                          onClick={() =>
                            setRespuestas((prev) => ({ ...prev, [qi]: oi }))
                          }
                          className={cn(
                            'w-full text-left px-3 py-2 rounded-md border text-sm flex items-center justify-between gap-2 transition-colors',
                            !respondida && 'border-border hover:bg-muted',
                            respondida && correcta &&
                              'border-emerald-400 bg-emerald-50 text-emerald-800',
                            respondida && !correcta && elegida === oi &&
                              'border-red-400 bg-red-50 text-red-800',
                            respondida && !correcta && elegida !== oi &&
                              'border-border text-muted-foreground',
                          )}
                        >
                          <span>{o}</span>
                          {respondida && correcta && (
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                          )}
                          {respondida && !correcta && elegida === oi && (
                            <XCircle className="w-4 h-4 shrink-0" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {respondidas > 0 && (
              <div className="flex items-center justify-between gap-3 pt-1">
                <p className="text-xs text-muted-foreground">
                  {aciertos} de {respondidas} correctas
                  {respondidas < quiz.length &&
                    ` · faltan ${quiz.length - respondidas}`}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setRespuestas({})}
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                  Reiniciar
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={actual === 0}
          onClick={() => setActual((i) => i - 1)}
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Paso anterior
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={actual === steps.length - 1}
          onClick={() => setActual((i) => i + 1)}
        >
          Paso siguiente
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </div>
    </div>
  )
}
