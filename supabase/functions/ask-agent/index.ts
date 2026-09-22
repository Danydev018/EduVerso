import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { GoogleGenerativeAI } from 'npm:@google/generative-ai'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { activity_id, step_index, question } = await req.json()

    if (!activity_id || typeof step_index !== 'number' || !question?.trim()) {
      return fail(400, 'activity_id, step_index y question son requeridos')
    }

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } },
    )
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // 1. Verificar identidad
    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) return fail(401, 'No autorizado')

    // 2. Verificar límite de preguntas para este paso
    const { data: interaction } = await userClient
      .from('ai_interactions')
      .select('id, questions_used, questions_limit')
      .eq('student_id', user.id)
      .eq('activity_id', activity_id)
      .eq('step_index', step_index)
      .single()

    if (!interaction) return fail(404, 'Interacción no inicializada para este paso')
    if (interaction.questions_used >= interaction.questions_limit) {
      return fail(429, 'Has usado todas tus pistas para este paso.')
    }

    // 3. Obtener contexto de la actividad
    const { data: activity } = await userClient
      .from('activities')
      .select('title, ai_context, topics(name, description), classrooms(grades(name))')
      .eq('id', activity_id)
      .single()

    if (!activity) return fail(404, 'Actividad no encontrada')

    // 4. Construir system prompt con contexto curricular
    const topic = activity.topics as unknown as { name: string; description: string }
    const grade = (activity.classrooms as unknown as { grades: { name: string } }).grades
    const systemPrompt = buildSystemPrompt(topic, grade.name, activity.ai_context)
    const offTopicMessage = buildOffTopicMessage(topic.name)

    // 5. Pedir la respuesta a los proveedores (ver askProviders)
    let response: string
    try {
      response = await askProviders(question, systemPrompt)
    } catch (err) {
      if (err instanceof RateLimitedError) {
        // 429, no 500: esto NO es un fallo del servidor, es saturación
        // momentánea de los proveedores. El código distinto le permite al
        // cliente (y a quien lea los logs) distinguir "está roto" de
        // "está ocupado, reintentá".
        return fail(429, 'Profe Bot está atendiendo a muchos exploradores. Intenta de nuevo en unos segundos.')
      }
      throw err
    }

    // 6. Si la respuesta es el mensaje estándar de "fuera de tema", no se
    // descuenta pregunta (ver docs/07-agente-ia.md — tabla de comportamiento).
    const isOffTopic = response.trim() === offTopicMessage

    if (!isOffTopic) {
      await adminClient.rpc('increment_questions_used', { p_interaction_id: interaction.id })
    }

    return ok({
      response,
      questions_remaining: isOffTopic
        ? interaction.questions_limit - interaction.questions_used
        : interaction.questions_limit - interaction.questions_used - 1,
    })
  } catch (err) {
    return fail(500, (err as Error).message)
  }
})

/**
 * Mensaje fijo para preguntas fuera de tema.
 *
 * Se mantiene CORTO a propósito: el código compara la respuesta del modelo
 * con este texto carácter por carácter para no descontarle una pregunta al
 * alumno (ver paso 6 del handler). Cuanto más largo o rebuscado, más
 * probable es que el modelo lo reproduzca con alguna variación y el alumno
 * pierda una pista sin motivo.
 */
function buildOffTopicMessage(topicName: string): string {
  // NO empezar con una frase que también sirva de saludo ("¡Qué fina esa
  // pregunta!", "¡Qué chévere!"): el modelo la usa para abrir respuestas
  // normales y termina emitiendo este mensaje completo ante preguntas que SÍ
  // eran del tema. Medido: ~17% de rechazos falsos con la variante anterior.
  // "De otro planeta" encaja con la historia de la app y ningún saludo
  // natural empieza así.
  return `¡Esa pregunta es de otro planeta! Hoy estamos en ${topicName}. ¿Tienes alguna duda de eso?`
}

/**
 * System prompt del agente.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * POR QUÉ ESTÁ ESCRITO TAN COMPACTO
 *
 * El respaldo (Groq gratuito) limita por TOKENS POR MINUTO, no por
 * peticiones: 8.000 TPM. Como este prompt viaja completo en CADA consulta,
 * su tamaño divide la capacidad del sistema:
 *
 *     peticiones/min ≈ 8000 / tokens_por_peticion
 *
 * Con la versión larga (~977 tokens) daban ~8 alumnos por minuto. Cada
 * token que se recorta acá se traduce en más alumnos atendidos, así que el
 * prompt lleva solo la DIRECTIVA y el razonamiento de cada regla vive en
 * estos comentarios, que no se envían a la API y son gratis.
 *
 * El razonamiento detrás de cada regla:
 *
 *  R2 — La frase de fuera de tema se compara carácter por carácter en el
 *       handler para no cobrar pista. La segunda mitad ("si es del tema,
 *       respóndela") existe porque sin ella el modelo rechazaba ~17% de
 *       preguntas legítimas.
 *  R4 — El tope de 3 oraciones no es solo pedagógico: acota los tokens de
 *       salida, que también cuentan para el límite TPM. Lo de texto plano
 *       salió de una prueba real: el modelo respondió "\\( \\frac{1}{2} \\)"
 *       y la burbuja del chat no renderiza LaTeX — el niño ve las barras.
 *  R5 — Venezuela usa "tú". El voseo rioplatense ("tenés", "mirá") le suena
 *       extranjero al niño, y "usted" suena distante.
 *  R6 — Una sola expresión por respuesta: repetida en cada frase suena
 *       falsa y le cuesta más entender. La explicación va en español claro
 *       porque la jerga acompaña, no reemplaza a la enseñanza.
 *  R7 — Lo leen niños de primaria en una tarea del colegio, y la respuesta
 *       llega a su pantalla sin filtro intermedio.
 * ─────────────────────────────────────────────────────────────────────────
 */
function buildSystemPrompt(
  topic: { name: string; description: string },
  gradeName: string,
  aiContext: string | null,
): string {
  return `
Eres "Profe Bot", tutor de ${gradeName} en Venezuela. Explicas simple y claro, con ejemplos cotidianos.

TEMA: ${topic.name}
${topic.description}
${aiContext ? `DEL DOCENTE: ${aiContext}` : ''}

REGLAS:
1. Solo respondes sobre "${topic.name}".
2. Usa esta frase EXACTA solo si la pregunta no tiene NADA que ver (fútbol, otra materia):
"${buildOffTopicMessage(topic.name)}"
Todo lo demás respóndelo: dudas básicas o mal escritas, desánimo ("no puedo") y pedidos de la respuesta directa. Nunca uses esa frase con ellos.
3. Si se desanima, anímalo. Si pide el resultado de un ejercicio, da una pista, nunca el resultado.
4. Máximo 3 oraciones. Escribe en texto plano: fracciones como 1/2, nunca LaTeX ni markdown.
5. Habla de "tú" (venezolano). Nunca "vos", "tenés", "podés", "mirá", ni "usted".
6. Una sola expresión venezolana por respuesta (chévere, épale, vale, pana, chamo/chama), en el saludo o el ánimo. La explicación, en español claro.
7. Prohibidas groserías y jerga de calle (coño, arrecho, de pinga, marico, verga).
`.trim()
}

/** Los dos proveedores están saturados: el cliente puede reintentar. */
class RateLimitedError extends Error {}

/** ¿El error viene de un límite de tasa/cuota y no de un fallo real? */
function esLimiteDeTasa(err: unknown): boolean {
  const m = String((err as Error)?.message ?? err).toLowerCase()
  return (
    m.includes('429') ||
    m.includes('rate limit') ||
    m.includes('quota') ||
    m.includes('resource_exhausted') ||
    m.includes('too many requests') ||
    m.includes('overloaded') ||
    m.includes('503')
  )
}

const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Cuánto esperar antes de reintentar, en milisegundos.
 *
 * Los proveedores dicen en el propio error cuánto falta para que se libere
 * la cuota ("Please try again in 2.2725s"). Adivinarlo con una espera fija
 * fue el error de la primera versión: esperaba 250 ms cuando Groq pedía
 * entre 1 y 4,5 segundos, así que todos los reintentos volvían a fallar y
 * solo agregaban latencia.
 *
 * Se topa en TOPE_ESPERA_MS porque la Edge Function tiene tiempo límite y
 * el alumno está mirando "Pensando...": es preferible un mensaje honesto de
 * "intenta de nuevo" que una espera larguísima.
 */
const TOPE_ESPERA_MS = 3000

function esperaSugerida(err: unknown, porDefecto: number): number {
  const m = String((err as Error)?.message ?? err)
  // "Please try again in 2.2725s" | "try again in 900ms"
  const seg = m.match(/try again in ([\d.]+)s/i)
  if (seg) return Math.min(Math.ceil(parseFloat(seg[1]) * 1000) + 100, TOPE_ESPERA_MS)
  const mil = m.match(/try again in ([\d.]+)ms/i)
  if (mil) return Math.min(Math.ceil(parseFloat(mil[1])) + 100, TOPE_ESPERA_MS)
  return Math.min(porDefecto, TOPE_ESPERA_MS)
}

/**
 * Cadena de proveedores: Gemini con reintentos, y Groq como respaldo.
 *
 * Antes se intentaba Gemini UNA vez y, si fallaba, Groq UNA vez; con ambos
 * saturados la excepción salía como HTTP 500. En una prueba de carga de 20
 * peticiones simultáneas eso dejó 3 alumnos sin respuesta.
 *
 * Cambios:
 *  - Reintento con espera creciente (250 ms, 700 ms) SOLO ante límites de
 *    tasa. Un 429 se resuelve esperando; un error de credenciales o de
 *    formato no, y reintentarlo solo suma latencia.
 *  - El respaldo también reintenta.
 *  - Si todo agota por saturación, se lanza RateLimitedError para que el
 *    handler responda 429 en vez de 500.
 *
 * La espera es corta a propósito: las Edge Functions tienen tiempo límite y
 * el alumno está mirando una pantalla de "Pensando...".
 */
async function askProviders(question: string, systemPrompt: string): Promise<string> {
  const proveedores = [
    ['GEMINI', () => callGemini(question, systemPrompt)],
    ['GROQ', () => callGroq(question, systemPrompt)],
  ] as const

  let ultimoLimite: unknown = null
  const inicio = Date.now()
  // Presupuesto total de espera. Sin esto, dos proveedores × varios
  // reintentos podrían encadenar más segundos de los que la función tiene
  // de vida, y el alumno se quedaría mirando "Pensando..." hasta el corte.
  const PRESUPUESTO_MS = 6000

  // Primera vuelta SIN esperas: ante un 429 de Gemini conviene ir directo a
  // Groq, que tiene una cuota independiente, en vez de esperar a que se
  // libere la de Gemini. Reintentar al mismo proveedor saturado es lo que
  // amplifica el atasco.
  for (const [nombre, llamar] of proveedores) {
    try {
      return await llamar()
    } catch (err) {
      const limite = esLimiteDeTasa(err)
      console.error(`${nombre}_ERROR vuelta=1 limiteDeTasa=${limite}`, (err as Error).message)
      if (limite) ultimoLimite = err
    }
  }

  // Segunda vuelta: los dos están saturados, así que ahora sí hay que
  // esperar — pero el tiempo que el propio proveedor indicó, no uno
  // inventado.
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

  if (ultimoLimite) {
    throw new RateLimitedError('Todos los proveedores están saturados')
  }
  throw new Error('El agente no está disponible en este momento. Intenta de nuevo en unos segundos.')
}

async function callGemini(question: string, systemPrompt: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!)
  const model = genAI.getGenerativeModel({
    model: 'gemini-3.6-flash',
    systemInstruction: systemPrompt,
  })
  const result = await model.generateContent(question)
  return result.response.text()
}

async function callGroq(question: string, systemPrompt: string): Promise<string> {
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
        { role: 'user', content: question },
      ],
      // openai/gpt-oss-20b es un modelo "reasoning": gasta parte del
      // max_tokens en razonamiento oculto antes de la respuesta visible.
      // Con 150 tokens y reasoning por defecto, el razonamiento solía
      // consumir casi todo el presupuesto y la respuesta salía cortada
      // (finish_reason: "length"). Bajamos el esfuerzo de razonamiento
      // (no lo necesitamos para pistas cortas) y subimos el límite.
      reasoning_effort: 'low',
      max_tokens: 300,
    }),
  })
  const data = await response.json()
  if (!response.ok || !data.choices) {
    console.error('GROQ_ERROR', response.status, JSON.stringify(data))
    // El código HTTP va DENTRO del mensaje a propósito: es lo único que
    // `esLimiteDeTasa` puede inspeccionar para distinguir una saturación
    // (429/503, se reintenta) de un error real (401 por credenciales, 400
    // por formato) que no tiene sentido reintentar.
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
