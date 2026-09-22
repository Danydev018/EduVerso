// ---------------------------------------------------------------------------
// Profe Bot para el docente.
//
// El agente de `ask-agent` está pensado para el alumno: responde en tres
// oraciones, nunca da el resultado y se niega a salir del tema. Nada de eso
// sirve para ayudar a un docente a ARMAR la evaluación, así que esta función
// es aparte en vez de un modo más dentro de aquella.
//
// Dos modos:
//   suggest  → qué se puede evaluar de un tema (subtemas concretos)
//   generate → las preguntas ya escritas, en el formato de lib/quiz.ts
//
// La cadena de proveedores (Gemini → Groq, con reintentos guiados por el
// propio error) es la misma que la de ask-agent y por los mismos motivos;
// ver los comentarios de aquella función.
// ---------------------------------------------------------------------------
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { GoogleGenerativeAI } from 'npm:@google/generative-ai'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const DIFICULTADES: Record<string, string> = {
  facil: 'sencillas, de reconocimiento directo',
  media: 'de aplicación: hay que razonar un paso',
  dificil: 'de análisis: hay que combinar dos ideas o interpretar un enunciado',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { mode, topic_id, intent, count, difficulty } = await req.json()

    if (mode !== 'generate' && mode !== 'suggest') {
      return fail(400, 'mode debe ser "generate" o "suggest"')
    }
    if (!topic_id) return fail(400, 'topic_id es requerido')

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } },
    )

    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) return fail(401, 'No autorizado')

    // Esta función redacta contenido evaluativo con las respuestas correctas.
    // Un alumno que la invocara obtendría preguntas resueltas de su propio
    // tema, así que el rol se verifica acá y no solo en la interfaz.
    const { data: perfil } = await userClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (perfil?.role !== 'teacher' && perfil?.role !== 'coordinator') {
      return fail(403, 'Solo docentes y coordinación pueden usar este asistente.')
    }

    const { data: tema } = await userClient
      .from('topics')
      .select('name, description, subjects(name, grades(name))')
      .eq('id', topic_id)
      .maybeSingle()

    if (!tema) return fail(404, 'Tema no encontrado')

    const materia = tema.subjects as unknown as {
      name: string
      grades: { name: string }
    }
    const contexto = {
      tema: tema.name,
      descripcion: tema.description ?? '',
      materia: materia.name,
      grado: materia.grades.name,
    }

    if (mode === 'suggest') {
      const texto = await askProviders(
        buildSuggestPrompt(contexto),
        `Sugiere qué evaluar de "${contexto.tema}".`,
        2000,
      )
      return ok({ suggestions: parseSuggestions(texto) })
    }

    const cantidad = Math.min(Math.max(Number(count) || 3, 1), 6)
    const nivel = DIFICULTADES[difficulty as string] ?? DIFICULTADES.media

    const texto = await askProviders(
      buildGeneratePrompt(contexto, cantidad, nivel, String(intent ?? '').trim()),
      `Escribe ${cantidad} preguntas de "${contexto.tema}".`,
      4000,
    )

    const preguntas = parseQuiz(normalizar(texto))

    if (!preguntas || preguntas.length === 0) {
      console.error('FORMATO_INVALIDO', texto.slice(0, 400))
      return fail(
        502,
        'El asistente devolvió las preguntas en un formato que no pudimos leer. Intenta de nuevo.',
      )
    }

    return ok({ questions: preguntas })
  } catch (err) {
    if (err instanceof RateLimitedError) {
      return fail(429, 'El asistente está saturado ahora mismo. Intenta en unos segundos.')
    }
    console.error('TEACHER_ASSIST_ERROR', (err as Error).message)
    return fail(500, 'No pudimos generar el contenido. Intenta de nuevo.')
  }
})

// ── Prompts ────────────────────────────────────────────────────────────────

type Contexto = { tema: string; descripcion: string; materia: string; grado: string }

function buildSuggestPrompt(c: Contexto): string {
  return `Eres asesor pedagógico de primaria en Venezuela. Ayudas a un docente de ${c.grado} a planificar qué evaluar.

Tema: "${c.tema}" (${c.materia}).${c.descripcion ? `\nAlcance: ${c.descripcion}` : ''}

Devuelve entre 4 y 6 subtemas concretos y evaluables de ese tema, apropiados para ${c.grado}.
Una línea por subtema, empezando con "- ". Máximo 12 palabras cada uno.
Nada de introducción ni cierre: solo la lista.`
}

function buildGeneratePrompt(
  c: Contexto,
  cantidad: number,
  nivel: string,
  intent: string,
): string {
  return `Eres docente de primaria en Venezuela y redactas evaluaciones de opción múltiple.

Grado: ${c.grado}. Materia: ${c.materia}. Tema: "${c.tema}".${
    c.descripcion ? `\nAlcance del tema: ${c.descripcion}` : ''
  }${intent ? `\nEl docente quiere evaluar específicamente: ${intent}` : ''}

Escribe exactamente ${cantidad} preguntas ${nivel}.

FORMATO OBLIGATORIO, sin nada antes ni después:

P: enunciado de la pregunta
A) primera opción
B) segunda opción *
C) tercera opción
D) cuarta opción

Reglas:
1. El asterisco al final marca la ÚNICA opción correcta. Exactamente una por pregunta.
2. Una línea en blanco entre preguntas. Sin numerar, sin markdown, sin negritas, sin explicaciones.
3. Cada pregunta con 4 opciones (3 si el tema no da para más).
4. Los distractores deben ser errores que un niño de ${c.grado} cometería de verdad, no opciones absurdas.
5. Varía la letra de la respuesta correcta entre las preguntas.
6. Vocabulario y contexto de Venezuela y de la vida diaria (arepas, bolívares, el Ávila, el Orinoco). Español neutro, trato de "tú".
7. Matemáticas en texto plano: fracciones como 1/2, nunca LaTeX.\n8. Verifica cada respuesta antes de marcarla: el asterisco debe estar en la opción realmente correcta.`
}

// ── Normalización y parseo ─────────────────────────────────────────────────

/**
 * Reconstruye la salida del modelo en el formato exacto que parsea el quiz.
 *
 * El prompt pide un formato estricto y el modelo igual se desvía. La
 * desviación que rompía todo era sutil: dejaba una línea en blanco ENTRE el
 * enunciado y sus opciones. Como `parseQuiz` separa preguntas por líneas en
 * blanco, la pregunta y sus opciones caían en bloques distintos y ninguno
 * parseaba: el del enunciado por tener una sola línea, el de las opciones
 * por no empezar con "P:".
 *
 * Por eso acá no se "limpia" el espaciado: se ignora por completo y se
 * re-segmenta por los "P:", que es la única marca fiable. Así da igual si el
 * modelo separa con una línea en blanco, con dos o con ninguna.
 */
function normalizar(texto: string): string {
  const lineas = texto
    .replace(/```[a-z]*\n?/gi, '')
    .replace(/\*\*/g, '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    // El modelo a veces agrega esto aunque ya marcó con asterisco.
    .filter((l) => !/^(respuesta|correcta|explicaci[óo]n)\s*[:.]/i.test(l))

  const bloques: string[][] = []

  for (const linea of lineas) {
    // "1. P: ..." | "1) P: ..." → "P: ..."
    const conNumero = linea.match(/^\d+[).]\s*(P:.*)$/i)
    // "Pregunta 2: ..." → "P: ..."
    const comoPregunta = linea.match(/^pregunta\s*\d*\s*[:.]\s*(.+)$/i)

    const normalizada = conNumero
      ? conNumero[1]
      : comoPregunta
        ? `P: ${comoPregunta[1]}`
        : linea

    if (/^P:/i.test(normalizada)) {
      bloques.push([normalizada])
    } else if (bloques.length > 0 && /^[A-Za-z][).]\s*.+$/.test(normalizada)) {
      // Solo se acumulan líneas que parezcan opción; cualquier comentario
      // suelto del modelo entre preguntas se descarta.
      bloques[bloques.length - 1].push(normalizada)
    }
  }

  return bloques.map((b) => b.join('\n')).join('\n\n')
}

interface QuizQuestion {
  question: string
  options: string[]
  correctIndex: number
}

/** Misma lógica que lib/quiz.ts. Duplicada porque las Edge Functions no
 *  comparten el bundle de la app. */
function parseQuiz(text: string): QuizQuestion[] | null {
  const QUESTION_PREFIX = /^P:\s*/i
  const OPTION_LINE = /^[A-Za-z][).]\s*(.+)$/

  const questions: QuizQuestion[] = []

  for (const block of text.split(/\r?\n\s*\r?\n/).map((b) => b.trim()).filter(Boolean)) {
    const lines = block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
    if (lines.length < 3 || !QUESTION_PREFIX.test(lines[0])) continue

    const question = lines[0].replace(QUESTION_PREFIX, '').trim()
    const options: string[] = []
    let correctIndex = -1

    for (let i = 1; i < lines.length; i++) {
      const match = lines[i].match(OPTION_LINE)
      if (!match) continue
      let optionText = match[1].trim()
      if (/\*\s*$/.test(optionText)) {
        optionText = optionText.replace(/\*\s*$/, '').trim()
        correctIndex = options.length
      }
      options.push(optionText)
    }

    if (question && options.length >= 2 && correctIndex >= 0) {
      questions.push({ question, options, correctIndex })
    }
  }

  return questions.length > 0 ? questions : null
}

function parseSuggestions(texto: string): string[] {
  return texto
    .split('\n')
    .map((l) => l.replace(/^[-*•\d.)\s]+/, '').trim())
    .filter((l) => l.length > 3 && l.length < 120)
    .slice(0, 6)
}

// ── Proveedores ────────────────────────────────────────────────────────────
// Mismo esquema que ask-agent: primera vuelta sin esperas (las cuotas de
// Gemini y Groq son independientes, conviene saltar de uno al otro antes que
// esperar), y una segunda vuelta con la espera que el propio error indica.

class RateLimitedError extends Error {}

function esLimiteDeTasa(err: unknown): boolean {
  const m = String((err as Error)?.message ?? err).toLowerCase()
  return (
    m.includes('429') || m.includes('rate limit') || m.includes('quota') ||
    m.includes('resource_exhausted') || m.includes('too many requests') ||
    m.includes('overloaded') || m.includes('503')
  )
}

const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms))
const TOPE_ESPERA_MS = 4000

function esperaSugerida(err: unknown, porDefecto: number): number {
  const m = String((err as Error)?.message ?? err)
  const seg = m.match(/try again in ([\d.]+)s/i)
  if (seg) return Math.min(Math.ceil(parseFloat(seg[1]) * 1000) + 100, TOPE_ESPERA_MS)
  const mil = m.match(/try again in ([\d.]+)ms/i)
  if (mil) return Math.min(Math.ceil(parseFloat(mil[1])) + 100, TOPE_ESPERA_MS)
  return Math.min(porDefecto, TOPE_ESPERA_MS)
}

async function askProviders(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
): Promise<string> {
  const proveedores = [
    ['GEMINI', () => callGemini(userPrompt, systemPrompt, maxTokens)],
    ['GROQ', () => callGroq(userPrompt, systemPrompt, maxTokens)],
  ] as const

  let ultimoLimite: unknown = null
  const inicio = Date.now()
  // Más holgado que en ask-agent (6 s): el docente está armando una
  // evaluación, no en medio de un ejercicio, y tolera unos segundos más.
  const PRESUPUESTO_MS = 12000

  for (const [nombre, llamar] of proveedores) {
    try {
      return await llamar()
    } catch (err) {
      const limite = esLimiteDeTasa(err)
      console.error(`${nombre}_ERROR vuelta=1 limiteDeTasa=${limite}`, (err as Error).message)
      if (limite) ultimoLimite = err
    }
  }

  if (ultimoLimite) {
    for (const [nombre, llamar] of proveedores) {
      const espera = esperaSugerida(ultimoLimite, 1200)
      if (Date.now() - inicio + espera > PRESUPUESTO_MS) break
      await dormir(espera)
      try {
        return await llamar()
      } catch (err) {
        const limite = esLimiteDeTasa(err)
        console.error(`${nombre}_ERROR vuelta=2 esperó=${espera}ms limiteDeTasa=${limite}`, (err as Error).message)
        if (limite) ultimoLimite = err
      }
    }
  }

  if (ultimoLimite) throw new RateLimitedError('Todos los proveedores están saturados')
  throw new Error('El asistente no está disponible en este momento.')
}

async function callGemini(
  userPrompt: string,
  systemPrompt: string,
  maxTokens: number,
): Promise<string> {
  const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!)
  const model = genAI.getGenerativeModel({
    model: 'gemini-3.6-flash',
    systemInstruction: systemPrompt,
    // maxOutputTokens incluye los tokens de razonamiento del modelo, no
    // solo el texto visible: por eso los presupuestos son holgados.
    generationConfig: { maxOutputTokens: maxTokens, temperature: 0.8 },
  })
  const result = await model.generateContent(userPrompt)
  return result.response.text()
}

async function callGroq(
  userPrompt: string,
  systemPrompt: string,
  maxTokens: number,
): Promise<string> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('GROQ_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-20b',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      // Igual que en ask-agent: openai/gpt-oss-20b gasta parte del
      // max_tokens en razonamiento oculto ANTES de la respuesta visible.
      // Con reasoning_effort 'medium' y presupuestos ajustados, el
      // razonamiento se comía casi todo y la salida llegaba cortada a mitad
      // de palabra (la lista de sugerencias con un solo ítem, el quiz sin
      // cerrar la primera opción). Esfuerzo bajo + presupuesto holgado.
      reasoning_effort: 'low',
      max_tokens: maxTokens,
      temperature: 0.8,
    }),
  })
  const data = await response.json()
  if (!response.ok || !data.choices) {
    console.error('GROQ_ERROR', response.status, JSON.stringify(data).slice(0, 300))
    throw new Error(
      `Groq respondió ${response.status}: ${data?.error?.message ?? 'sin detalle'}`,
    )
  }
  return data.choices[0].message.content
}

const ok = (data: unknown) =>
  new Response(JSON.stringify({ success: true, ...(data as object) }), {
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })

const fail = (status: number, error: string) =>
  new Response(JSON.stringify({ success: false, error }), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
