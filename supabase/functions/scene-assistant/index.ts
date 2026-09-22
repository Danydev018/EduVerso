// ---------------------------------------------------------------------------
// Asistente de diseño de escenas.
//
// El docente escribe lo que quiere ("pon tres árboles en el campo y una
// flecha del sol al árbol del medio") y esta función devuelve el documento de
// la escena ya modificado, no texto.
//
// LA SKILL: el modelo no dibuja libremente. Se le da un vocabulario cerrado
// —las piezas del kit, el lienzo de 400×220, los tipos de elemento— y debe
// responder en JSON con ese vocabulario. Lo que no encaje se descarta al
// validar en el cliente (`sanearEscena`). Un modelo suelto inventaría piezas
// que no existen y cada respuesta habría que revisarla a mano.
//
// La cadena de proveedores es la misma de `ask-agent` y `teacher-assist`, por
// los mismos motivos; ver los comentarios de aquellas.
// ---------------------------------------------------------------------------
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { GoogleGenerativeAI } from 'npm:@google/generative-ai'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/*
 * El catálogo va POR GRUPOS y no como una lista suelta.
 *
 * Con más de cien nombres seguidos el modelo se pierde y acaba inventando
 * piezas parecidas ("Arbolito", "Nube2"). Agrupados ocupa lo mismo y el
 * modelo encuentra por tema lo que busca. Tiene que coincidir con
 * GRUPOS_PIEZAS de lib/scene-doc.ts: lo que no encaje lo descarta
 * `sanearEscena` en el cliente, así que un desajuste se ve como piezas que
 * el asistente pide y no aparecen.
 */
const CATALOGO = `  Personas y lugares: Persona, Casa, Edificio, Bandera\n  Naturaleza: Sol, Nube, Arbol, Montana, Gota\n  Objetos: Libro, Papel, Vaso, Jarra, Balanza, Bombillo, Panel\n  Números y medida: Abaco, BloqueDecena, CuboUnidad, RectaNumerica, Reloj, Moneda, Billete, Dado, FraccionCirculo, FraccionBarra, Regla, Termometro, Grafico, Calculadora\n  Figuras: Circulo, Cuadrado, Rectangulo, Triangulo, Pentagono, Hexagono, Cubo, Esfera, Cilindro, Piramide\n  Plantas: Flor, Girasol, Semilla, Brote, Maceta, Hoja, Raiz, Cactus, Palmera, Hierba\n  Animales: Pez, Pajaro, Mariposa, Perro, Gato, Vaca, Gallina, Caballo, Tortuga, Rana, Hormiga, Abeja, Guacamaya, Delfin, Oveja, Cerdo\n  Cielo y clima: Luna, Estrella, Arcoiris, Rayo, CopoNieve, Viento, Lluvia, Tormenta, Charco\n  Cuerpo: Corazon, Cerebro, Pulmones, Diente, Ojo, Mano, Hueso, Estomago, Oido\n  Comida: Manzana, Banana, Naranja, Pan, Leche, Huevo, Queso, Arepa, Zanahoria, Pescado, Uvas, Maiz\n  Escuela y objetos: Mochila, Pizarron, Tijeras, Pegamento, Escuadra, GloboTerraqueo, Microscopio, Iman, Pila, Lupa, Cuaderno, Lapiz, Computadora\n  Transporte: Carro, Autobus, Bicicleta, Barco, Avion, Tren, Cohete, Camion\n  Lugares: Escuela, Hospital, Tienda, Puente, Rio, Volcan, Cerca\n  Símbolos: Bocadillo, Pensamiento, Interrogacion, Exclamacion, TarjetaLetra, Sobre, Megafono`
const FONDOS = ['blanco', 'cielo', 'campo', 'noche', 'aula']

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { instruccion, escena, tema } = await req.json()
    if (!instruccion?.trim()) return fail(400, 'Falta la instrucción.')

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } },
    )

    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) return fail(401, 'No autorizado')

    const { data: perfil } = await userClient
      .from('profiles').select('role').eq('id', user.id).maybeSingle()

    if (perfil?.role !== 'teacher' && perfil?.role !== 'coordinator') {
      return fail(403, 'Solo docentes y coordinación pueden usar el asistente.')
    }

    const actual = escena && typeof escena === 'object' ? escena : { fondo: 'blanco', elementos: [] }

    const texto = await askProviders(
      buildPrompt(String(tema ?? ''), actual),
      String(instruccion).slice(0, 400),
      3000,
    )

    const doc = extraerJson(texto)
    if (!doc) {
      console.error('JSON_INVALIDO', texto.slice(0, 400))
      return fail(502, 'El asistente no devolvió un diseño que pudiéramos leer. Intenta con otras palabras.')
    }

    return ok({ escena: doc })
  } catch (err) {
    if (err instanceof RateLimitedError) {
      return fail(429, 'El asistente está saturado. Intenta en unos segundos.')
    }
    console.error('SCENE_ASSISTANT_ERROR', (err as Error).message)
    return fail(500, 'No pudimos generar el diseño. Intenta de nuevo.')
  }
})

function buildPrompt(tema: string, actual: unknown): string {
  return `Eres asistente de diseño de ilustraciones educativas para primaria.

Trabajas sobre un lienzo de 400 de ancho por 220 de alto. El origen (0,0) está
arriba a la izquierda. El suelo suele estar cerca de y=170.
${tema ? `El tema de la lección es: "${tema}".` : ''}

ESTADO ACTUAL DE LA ESCENA (JSON):
${JSON.stringify(actual).slice(0, 2000)}

Devuelve el documento COMPLETO ya modificado, en JSON y nada más.

Estructura:
{"fondo":"<uno de: ${FONDOS.join(', ')}>","elementos":[ ... ]}

Tipos de elemento admitidos:

1. Pieza ilustrada ya dibujada:
{"id":"a1","tipo":"pieza","pieza":"<un nombre EXACTO del catálogo>","x":200,"y":170,"s":1}

CATÁLOGO DE PIEZAS (por tema; usa el nombre tal cual, con esa misma grafía):
${CATALOGO}

   - "y" es donde APOYA la pieza (su base), no su centro.
   - "s" es la escala: 1 normal, 0.6 pequeña, 1.6 grande.
   - Persona admite {"props":{"ropa":"#DC2626","pose":"saluda|quieta|piensa|senala"}}
   - Sol admite {"props":{"rayos":"si|no"}}; Bombillo {"props":{"encendido":"si|no"}}
   - Vaso y Jarra admiten {"props":{"nivel":0.7}}

2. Texto: {"id":"a2","tipo":"texto","x":200,"y":30,"texto":"Hola","tam":15,"color":"#312E81","anchor":"middle"}

3. Flecha: {"id":"a3","tipo":"flecha","desde":[80,100],"hasta":[200,100],"curva":0,"color":"#F97316"}
   - "curva" positivo arquea hacia arriba; 0 es recta.

4. Trazo a mano: {"id":"a4","tipo":"trazo","puntos":[[20,100],[60,90],[100,110]],"color":"#6366F1","grosor":3}

5. Forma: {"id":"a5","tipo":"forma","forma":"rect","x":40,"y":60,"w":100,"h":60,"color":"#C7D2FE"}

Reglas:
- CONSERVA los elementos que ya existen, salvo que se pida quitarlos o moverlos.
- Cada elemento necesita un "id" distinto, de pocas letras.
- Todo debe caber en el lienzo: x entre 0 y 400, y entre 0 y 220.
- Si apoyas piezas en el piso, usa y entre 160 y 185 para que no floten.
- Al repartir varias piezas iguales, sepáralas al menos 60 en x.
- No inventes nombres de pieza: solo los de la lista.`
}

/**
 * Saca el JSON de la respuesta.
 *
 * Aunque el prompt pide "nada más", el modelo suele envolverlo en un bloque de
 * código o anteponer una frase. Se recorta entre la primera llave y la última
 * en vez de exigir una respuesta limpia: reintentar cuesta segundos y esto
 * resuelve el caso común.
 */
function extraerJson(texto: string): unknown | null {
  const limpio = texto.replace(/```json?/gi, '').replace(/```/g, '').trim()
  const ini = limpio.indexOf('{')
  const fin = limpio.lastIndexOf('}')
  if (ini === -1 || fin <= ini) return null
  try {
    const doc = JSON.parse(limpio.slice(ini, fin + 1))
    if (!doc || typeof doc !== 'object' || !Array.isArray(doc.elementos)) return null
    return doc
  } catch {
    return null
  }
}

// ── Proveedores ────────────────────────────────────────────────────────────

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
  return Math.min(porDefecto, TOPE_ESPERA_MS)
}

async function askProviders(system: string, userPrompt: string, maxTokens: number): Promise<string> {
  const proveedores = [
    ['GEMINI', () => callGemini(userPrompt, system, maxTokens)],
    ['GROQ', () => callGroq(userPrompt, system, maxTokens)],
  ] as const

  let ultimoLimite: unknown = null
  const inicio = Date.now()
  const PRESUPUESTO_MS = 14000

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
        if (esLimiteDeTasa(err)) ultimoLimite = err
        console.error(`${nombre}_ERROR vuelta=2`, (err as Error).message)
      }
    }
  }

  if (ultimoLimite) throw new RateLimitedError('Proveedores saturados')
  throw new Error('El asistente no está disponible en este momento.')
}

async function callGemini(userPrompt: string, system: string, maxTokens: number): Promise<string> {
  const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!)
  const model = genAI.getGenerativeModel({
    model: 'gemini-3.6-flash',
    systemInstruction: system,
    // maxOutputTokens incluye los tokens de razonamiento del modelo, no solo
    // el texto visible: por eso el presupuesto va holgado.
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature: 0.5,
      responseMimeType: 'application/json',
    },
  })
  const result = await model.generateContent(userPrompt)
  return result.response.text()
}

async function callGroq(userPrompt: string, system: string, maxTokens: number): Promise<string> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('GROQ_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-20b',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userPrompt },
      ],
      reasoning_effort: 'low',
      max_tokens: maxTokens,
      temperature: 0.5,
      response_format: { type: 'json_object' },
    }),
  })
  const data = await response.json()
  if (!response.ok || !data.choices) {
    console.error('GROQ_ERROR', response.status, JSON.stringify(data).slice(0, 300))
    throw new Error(`Groq respondió ${response.status}: ${data?.error?.message ?? 'sin detalle'}`)
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
