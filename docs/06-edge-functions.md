# 06 — Edge Functions

Las Edge Functions viven en `supabase/functions/` y se ejecutan en Deno (runtime de Supabase).
Nunca llames a Gemini ni modifiques `student_points` desde el cliente — solo desde aquí.

## Estructura de archivos

```
supabase/
└── functions/
    ├── complete-step/
    │   └── index.ts
    └── ask-agent/
        └── index.ts
```

---

## Función 1: `complete-step`

**Propósito:** Validar que el paso completado es legítimo y acreditar XP al alumno de forma atómica.

**Llamada desde el cliente:**
```typescript
const { data, error } = await supabase.functions.invoke('complete-step', {
  body: { activity_id: 'uuid', step_index: 0 }
})
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "xp_earned": 35,
  "is_complete": false,
  "total_xp": 85,
  "level": 3
}
```

**Código completo:**

```typescript
// supabase/functions/complete-step/index.ts
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { activity_id, step_index } = await req.json()

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 1. Verificar identidad
    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) return fail(401, 'No autorizado')

    // 2. Verificar rol de estudiante
    const { data: profile } = await userClient
      .from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'student') return fail(403, 'Solo estudiantes pueden completar pasos')

    // 3. Verificar que la actividad existe, está activa y el alumno tiene acceso
    const { data: activity } = await userClient
      .from('activities')
      .select('id, classroom_id, status, available_from, available_until, activity_templates(steps), classrooms(school_year_id)')
      .eq('id', activity_id)
      .single()

    if (!activity || activity.status !== 'active') return fail(404, 'Actividad no disponible')

    const now = new Date()
    if (activity.available_from && new Date(activity.available_from) > now)
      return fail(400, 'La actividad aún no está disponible')
    if (activity.available_until && new Date(activity.available_until) < now)
      return fail(400, 'La actividad ha vencido')

    // 4. Verificar progreso actual del alumno
    const { data: progress } = await userClient
      .from('activity_progress')
      .select('current_step, completed_at')
      .eq('student_id', user.id)
      .eq('activity_id', activity_id)
      .single()

    if (!progress) return fail(404, 'Inicia la actividad antes de completar un paso')
    if (progress.completed_at) return fail(400, 'Esta actividad ya fue completada')
    if (step_index !== progress.current_step) return fail(400, 'Paso inválido — no puedes saltar pasos')

    // 5. Obtener XP del paso desde la plantilla
    const steps = (activity.activity_templates as { steps: Array<{ xp_reward: number }> }).steps
    const step = steps[step_index]
    if (!step) return fail(400, 'Este paso no existe en la plantilla')

    const is_last_step = step_index === steps.length - 1
    const xp_total = step.xp_reward + (is_last_step ? 25 : 0)

    // 6. Actualización atómica via stored procedure
    const { data: result, error: rpcError } = await adminClient.rpc('award_xp', {
      p_student_id:     user.id,
      p_school_year_id: (activity.classrooms as { school_year_id: string }).school_year_id,
      p_classroom_id:   activity.classroom_id,
      p_activity_id:    activity_id,
      p_step_index:     step_index,
      p_xp_amount:      xp_total,
      p_is_complete:    is_last_step,
    })

    if (rpcError) throw rpcError

    return ok({ xp_earned: xp_total, is_complete: is_last_step, ...result })

  } catch (err) {
    return fail(500, (err as Error).message)
  }
})

const ok = (data: unknown) =>
  new Response(JSON.stringify({ success: true, ...(data as object) }),
    { headers: { ...CORS, 'Content-Type': 'application/json' } })

const fail = (status: number, error: string) =>
  new Response(JSON.stringify({ success: false, error }),
    { status, headers: { ...CORS, 'Content-Type': 'application/json' } })
```

---

## Función 2: `ask-agent`

**Propósito:** Validar el límite de preguntas, construir el prompt con contexto curricular y llamar a Gemini.

**Llamada desde el cliente:**
```typescript
const { data, error } = await supabase.functions.invoke('ask-agent', {
  body: { activity_id: 'uuid', step_index: 0, question: '¿Cómo se suman fracciones?' }
})
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "response": "¡Buena pregunta! Imagina que tienes una pizza...",
  "questions_remaining": 1
}
```

**Código completo:**

```typescript
// supabase/functions/ask-agent/index.ts
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

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 1. Verificar identidad
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) return fail(401, 'No autorizado')

    // 2. Verificar límite de preguntas para este paso
    const { data: interaction } = await userClient
      .from('ai_interactions')
      .select('id, questions_used, questions_limit')
      .eq('student_id', user.id)
      .eq('activity_id', activity_id)
      .eq('step_index', step_index)
      .single()

    if (!interaction) return fail(404, 'Interacción no inicializada para este paso')
    if (interaction.questions_used >= interaction.questions_limit)
      return fail(429, 'Has agotado tus preguntas para este paso')

    // 3. Obtener contexto de la actividad
    const { data: activity } = await userClient
      .from('activities')
      .select('title, ai_context, topics(name, description), classrooms(grades(name))')
      .eq('id', activity_id)
      .single()

    if (!activity) return fail(404, 'Actividad no encontrada')

    // 4. Construir system prompt con contexto curricular
    const topic = activity.topics as { name: string; description: string }
    const grade = (activity.classrooms as { grades: { name: string } }).grades
    const systemPrompt = buildSystemPrompt(topic, grade.name, activity.ai_context)

    // 5. Llamar a Gemini (con fallback a Groq)
    let response: string
    try {
      const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!)
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        systemInstruction: systemPrompt,
      })
      const result = await model.generateContent(question)
      response = result.response.text()
    } catch {
      response = await callGroqFallback(question, systemPrompt)
    }

    // 6. Incremento atómico del contador
    await adminClient.rpc('increment_questions_used', { p_interaction_id: interaction.id })

    return ok({
      response,
      questions_remaining: interaction.questions_limit - interaction.questions_used - 1,
    })

  } catch (err) {
    return fail(500, (err as Error).message)
  }
})

function buildSystemPrompt(
  topic: { name: string; description: string },
  gradeName: string,
  aiContext: string | null
): string {
  return `
Eres un tutor amigable llamado "Profe Bot" para estudiantes de ${gradeName} en Venezuela.
Hablas de forma simple, clara y motivadora. Usas ejemplos cotidianos que los niños entiendan.

TEMA DE HOY: ${topic.name}
DESCRIPCIÓN DEL TEMA: ${topic.description}
${aiContext ? `INSTRUCCIONES ADICIONALES DEL DOCENTE: ${aiContext}` : ''}

REGLAS ESTRICTAS QUE DEBES SEGUIR SIEMPRE:
1. Solo respondes preguntas relacionadas con "${topic.name}".
2. Si la pregunta NO tiene relación con el tema, responde EXACTAMENTE:
   "¡Esa es una curiosidad interesante! Pero hoy nos enfocamos en ${topic.name}. ¿Tienes alguna duda sobre eso?"
3. Nunca des la respuesta directa a un ejercicio — da una pista que guíe al estudiante.
4. Máximo 3 oraciones por respuesta. Sé conciso y claro.
5. Usa un tono amigable y motivador, como un amigo que sabe mucho.
`.trim()
}

async function callGroqFallback(question: string, systemPrompt: string): Promise<string> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('GROQ_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question },
      ],
      max_tokens: 150,
    }),
  })
  const data = await response.json()
  return data.choices[0].message.content
}

const ok = (data: unknown) =>
  new Response(JSON.stringify({ success: true, ...(data as object) }),
    { headers: { ...CORS, 'Content-Type': 'application/json' } })

const fail = (status: number, error: string) =>
  new Response(JSON.stringify({ success: false, error }),
    { status, headers: { ...CORS, 'Content-Type': 'application/json' } })
```

---

## Variables de entorno requeridas

Configurar en Supabase Dashboard → Project Settings → Edge Functions → Secrets:

```
GEMINI_API_KEY     → Google AI Studio → API Keys
GROQ_API_KEY       → console.groq.com → API Keys
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` son inyectadas automáticamente por Supabase.

## Deploy de funciones

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Deploy de una función específica
supabase functions deploy complete-step --project-ref <tu-project-ref>
supabase functions deploy ask-agent --project-ref <tu-project-ref>
```
