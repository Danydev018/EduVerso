# 07 — Agente de IA

## Modelo principal

**Google Gemini 2.0 Flash** (free tier)
- SDK: `@google/generative-ai`
- Límites: 15 RPM, 1,500 req/día, 1,000,000 tokens/día
- Suficiente para ~375 sesiones de actividad diarias con las restricciones de preguntas

**Fallback: Groq Llama 3.1 8B Instant**
- API compatible con OpenAI (fetch directo, sin SDK adicional)
- Límites: 30 RPM, modelo más pequeño pero rápido
- Se activa automáticamente si Gemini devuelve error

## Naturaleza del agente

El agente NO está entrenado (no hay fine-tuning). Es un modelo base con:
- **System prompt dinámico** construido en tiempo real con el contexto de la actividad
- **Contexto curricular estático** (tópico, descripción, grado) inyectado en cada llamada
- **Contexto adicional del docente** (campo `activities.ai_context`, opcional)
- **Rol fijo** definido por la plantilla del paso (`ai_role` en el JSONB)

En documentos académicos, esto se describe como:
> "Agente conversacional con roles configurables mediante ingeniería de prompts dinámicos, basado en el modelo Gemini 2.0 Flash."

## Cómo se construye el prompt

```
[System Prompt] =
  Identidad del agente (nombre, tono, audiencia)
  + Grado escolar del alumno
  + Nombre y descripción del tópico (del currículo venezolano)
  + Instrucciones adicionales del docente (si las hay)
  + Reglas de comportamiento (siempre presentes)
```

Ver código completo en `docs/06-edge-functions.md` → función `buildSystemPrompt`.

## Reglas de comportamiento del agente (siempre activas)

1. **Solo responde sobre el tópico de la actividad.** Si la pregunta es ajena, lo indica con una frase estándar y no descuenta pregunta.
2. **Nunca da respuestas directas a ejercicios** — solo pistas que guíen al alumno.
3. **Máximo 3 oraciones por respuesta.** Respuestas cortas y claras.
4. **Tono amigable y motivador**, adaptado a niños de primaria.
5. **Nombre fijo:** "Profe Bot".

## Sistema de preguntas por paso

Definido en la plantilla de actividad (campo `steps[n].ai_question_limit`).

| Situación | Comportamiento |
|---|---|
| Pregunta dentro del tema | El agente responde. Se descuenta 1 pregunta. |
| Pregunta fuera del tema | El agente indica que no puede responder. NO se descuenta pregunta. |
| Preguntas agotadas | El ícono del agente se desactiva. Mensaje: "Has usado todas tus pistas para este paso." |

El contador de preguntas es por paso (no por actividad completa). Cada paso tiene su propio `ai_interactions` record.

## Cuándo aparece el agente

Controlado por el campo `ai_enabled` en cada paso de la plantilla:

```json
{ "index": 0, "type": "introduction", "ai_enabled": true, "ai_question_limit": 2 }
{ "index": 1, "type": "quiz",         "ai_enabled": true, "ai_question_limit": 2 }
{ "index": 2, "type": "challenge",    "ai_enabled": false }
```

Si `ai_enabled = false`, el ícono del agente no se renderiza en ese paso.

## Inicialización del registro de interacción

Cuando el alumno entra a un paso con `ai_enabled = true` por primera vez, el frontend crea el registro en `ai_interactions`:

```typescript
await supabase.from('ai_interactions').insert({
  student_id:      user.id,
  activity_id:     activityId,
  step_index:      stepIndex,
  questions_used:  0,
  questions_limit: template.steps[stepIndex].ai_question_limit,
})
```

Usar `upsert` con `onConflict: 'student_id, activity_id, step_index'` para evitar duplicados si el alumno recarga la página.

## Contexto del docente (`ai_context`)

Al crear una actividad, el docente puede escribir instrucciones adicionales para el agente. Ejemplos:

- "Enfócate en la suma de fracciones con igual denominador. Ignora la resta por ahora."
- "Los alumnos ya conocen los números decimales, puedes hacer referencias a ellos."
- "Usa ejemplos con frutas y comida que los niños conozcan."

Este texto se inyecta en el system prompt. Es opcional y no valida contenido — el docente es responsable de lo que escribe.

## Limitaciones documentadas (para el TEG)

1. El agente no tiene memoria entre sesiones — cada llamada es independiente.
2. El agente no puede evaluar respuestas formalmente — solo orienta.
3. La clasificación de "pregunta fuera del tema" la hace el propio LLM, no un clasificador separado. Puede tener falsos positivos/negativos ocasionales.
4. En caso de alta concurrencia (>15 req/min a Gemini), el fallback a Groq es automático pero el modelo de respaldo es menos capaz.

## Clave de API

Obtener en: https://aistudio.google.com/app/apikey
Guardar como secret en Supabase: `GEMINI_API_KEY`
