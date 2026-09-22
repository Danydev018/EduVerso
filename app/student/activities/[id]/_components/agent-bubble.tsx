'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getEdgeFunctionErrorMessage } from '@/lib/edge-function-error'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Bot, Loader2, Send, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  studentId: string
  activityId: string
  stepIndex: number
  questionLimit: number
}

type ChatMessage = {
  role: 'user' | 'agent'
  text: string
}

type AskAgentResponse = {
  success: boolean
  error?: string
  response?: string
  questions_remaining?: number
}

export function AgentBubble({
  studentId,
  activityId,
  stepIndex,
  questionLimit,
}: Props) {
  const [ready, setReady] = useState(false)
  const [open, setOpen] = useState(false)
  const [questionsRemaining, setQuestionsRemaining] = useState(questionLimit)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [asking, setAsking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Al montar: inicializar (o leer) el registro de ai_interactions para este
  // paso — ver docs/07-agente-ia.md. Un upsert con ignoreDuplicates deja
  // intacto el contador si el alumno ya había preguntado antes (recarga de
  // página); el select posterior siempre trae el estado real.
  useEffect(() => {
    let cancelled = false

    async function init() {
      const supabase = createClient()

      await supabase.from('ai_interactions').upsert(
        {
          student_id: studentId,
          activity_id: activityId,
          step_index: stepIndex,
          questions_used: 0,
          questions_limit: questionLimit,
        },
        { onConflict: 'student_id,activity_id,step_index', ignoreDuplicates: true },
      )

      const { data } = await supabase
        .from('ai_interactions')
        .select('questions_used, questions_limit')
        .eq('student_id', studentId)
        .eq('activity_id', activityId)
        .eq('step_index', stepIndex)
        .maybeSingle()

      if (cancelled) return

      const row = data as { questions_used: number; questions_limit: number } | null
      setQuestionsRemaining(
        row ? row.questions_limit - row.questions_used : questionLimit,
      )
      setReady(true)
    }

    init()
    return () => {
      cancelled = true
    }
  }, [studentId, activityId, stepIndex, questionLimit])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages, asking])

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault()
    const question = input.trim()
    if (!question || asking || questionsRemaining <= 0) return

    setError(null)
    setAsking(true)
    setMessages((prev) => [...prev, { role: 'user', text: question }])
    setInput('')

    const supabase = createClient()
    const { data, error: invokeError } = await supabase.functions.invoke<AskAgentResponse>(
      'ask-agent',
      { body: { activity_id: activityId, step_index: stepIndex, question } },
    )

    setAsking(false)

    if (invokeError || !data || !data.success) {
      if (data?.error) {
        setError(data.error)
      } else {
        setError(
          await getEdgeFunctionErrorMessage(
            invokeError,
            'No pudimos consultar a Profe Bot. Intenta de nuevo.',
          ),
        )
      }
      // Deshacer el envío optimista: se saca la burbuja de la pregunta que
      // quedó sin respuesta y se devuelve el texto al campo. El error más
      // común acá es saturación momentánea (429) y el mensaje le pide al
      // alumno reintentar — obligarlo a reescribir todo sería absurdo.
      setMessages((prev) => prev.slice(0, -1))
      setInput(question)
      return
    }

    setMessages((prev) => [...prev, { role: 'agent', text: data.response ?? '' }])
    if (typeof data.questions_remaining === 'number') {
      setQuestionsRemaining(data.questions_remaining)
    }
  }

  const exhausted = ready && questionsRemaining <= 0

  return (
    <>
      {/* Ícono flotante */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={!ready}
        title={
          exhausted
            ? 'Ya usaste todas tus pistas para este paso'
            : 'Preguntarle a Profe Bot'
        }
        className={cn(
          'fixed bottom-24 md:bottom-5 right-5 z-30 w-14 h-14 rounded-full shadow-lg shadow-violet-900/20 flex items-center justify-center transition-transform hover:scale-105',
          exhausted
            ? 'bg-indigo-200 cursor-default'
            : 'bg-violet-600 hover:bg-violet-700',
        )}
      >
        <Bot className="w-6 h-6 text-white" />
        {ready && (
          <span
            className={cn(
              'absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full text-[11px] font-bold flex items-center justify-center',
              exhausted ? 'bg-indigo-400 text-white' : 'bg-amber-400 text-violet-900',
            )}
          >
            {Math.max(0, questionsRemaining)}
          </span>
        )}
      </button>

      {/* Modal / drawer de chat */}
      {open && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-indigo-950/40 p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-xl flex flex-col max-h-[85vh] sm:max-h-[600px]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-indigo-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-indigo-950">Profe Bot</p>
                  <p className="text-xs text-indigo-400">
                    {exhausted
                      ? 'Sin pistas restantes'
                      : `${questionsRemaining} pregunta${questionsRemaining === 1 ? '' : 's'} restante${questionsRemaining === 1 ? '' : 's'}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-indigo-300 hover:text-indigo-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[200px]"
            >
              {messages.length === 0 && (
                <p className="text-sm text-indigo-400 text-center py-6">
                  Hazle una pregunta a Profe Bot sobre esta estación.
                </p>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    'max-w-[85%] rounded-2xl px-3 py-2 text-sm',
                    m.role === 'user'
                      ? 'ml-auto bg-indigo-600 text-white'
                      : 'bg-violet-50 text-violet-900',
                  )}
                >
                  {m.text}
                </div>
              ))}
              {asking && (
                <div className="bg-violet-50 text-violet-900 rounded-2xl px-3 py-2 text-sm w-fit flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Pensando...
                </div>
              )}
            </div>

            {error && (
              <div className="mx-4 mb-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                {error}
              </div>
            )}

            <div className="border-t border-indigo-100 p-3">
              {exhausted ? (
                <p className="text-sm text-indigo-400 text-center py-1">
                  Has usado todas tus pistas para esta estación.
                </p>
              ) : (
                <form onSubmit={handleAsk} className="flex items-center gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Escribe tu pregunta..."
                    disabled={asking}
                    maxLength={300}
                    className="h-11 rounded-2xl"
                  />
                  <Button
                    type="submit"
                    className="clay-btn h-11 w-11 rounded-2xl bg-violet-600 hover:bg-violet-600 text-white flex-shrink-0"
                    style={{ ['--clay-shadow' as string]: '#5B21B6' }}
                    disabled={asking || !input.trim()}
                  >
                    {asking ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
