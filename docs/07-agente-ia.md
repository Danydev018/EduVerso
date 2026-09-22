# 07 — Agente de IA

## Modelo principal

**Google Gemini 3.6 Flash** (free tier)
- SDK: `@google/generative-ai`
- Límites: 15 RPM, 1,500 req/día, 1,000,000 tokens/día
- Suficiente para ~375 sesiones de actividad diarias con las restricciones de preguntas
- Nota: `gemini-2.0-flash` (el modelo originalmente planeado) fue retirado por Google;
  al probar en producción devuelve 404 indicando migrar a `gemini-3.6-flash`. Verificar
  este nombre de modelo periódicamente — Google retira versiones de Gemini con el tiempo.

**Fallback: Groq `openai/gpt-oss-20b`**
- API compatible con OpenAI (fetch directo, sin SDK adicional)
- Modelo "reasoning": consume parte del `max_tokens` en razonamiento oculto antes de
  la respuesta visible. Usar `reasoning_effort: 'low'` y un `max_tokens` generoso
  (300+), o la respuesta puede salir cortada (`finish_reason: "length"`).
- Se activa automáticamente si Gemini devuelve error
- Nota: `llama-3.1-8b-instant` (el modelo originalmente planeado) ya no existe en el
  catálogo de Groq. Verificar modelos disponibles en `GET /openai/v1/models` con tu
  API key si esto vuelve a fallar — Groq cambia su catálogo con el tiempo.

## Naturaleza del agente

El agente NO está entrenado (no hay fine-tuning). Es un modelo base con:
- **System prompt dinámico** construido en tiempo real con el contexto de la actividad
- **Contexto curricular estático** (tópico, descripción, grado) inyectado en cada llamada
- **Contexto adicional del docente** (campo `activities.ai_context`, opcional)
- **Rol fijo** definido por la plantilla del paso (`ai_role` en el JSONB)

En documentos académicos, esto se describe como:
> "Agente conversacional con roles configurables mediante ingeniería de prompts dinámicos, basado en el modelo Gemini 3.6 Flash."

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
6. **Habla venezolano.** Trata de "tú" (nunca "vos" ni formas rioplatenses
   como "tenés"/"mirá", que al niño le suenan extranjeras; tampoco "usted",
   que suena distante).
7. **Usa jerga venezolana de aula**, la que emplearía un maestro cariñoso:
   "chévere", "qué fino", "épale", "vale", "pana", "chamo"/"chama". Con
   tres límites que están escritos en el propio prompt:
   - **Una sola expresión por respuesta**, en el saludo o en el ánimo. Si
     aparece en cada frase suena falsa y le cuesta más entender al niño.
   - **La explicación del tema va en español claro.** La jerga acompaña, no
     reemplaza a la enseñanza.
   - **Prohibida la jerga de calle y las groserías** (se enumeran de forma
     explícita en el prompt). El público son niños de primaria haciendo una
     tarea del colegio.

> **Cuidado al editar el mensaje de fuera de tema.** El handler compara la
> respuesta del modelo con ese texto carácter por carácter para decidir si
> descuenta una pregunta. Hay dos trampas, ambas encontradas midiendo:
>
> 1. **No alargarlo.** Cuanto más largo, más probable que el modelo lo
>    reproduzca con variaciones y el alumno pierda una pista sin motivo.
> 2. **No empezarlo con una frase que también sirva de saludo.** Una versión
>    que abría con "¡Qué fina esa pregunta!" chocaba con la jerga permitida:
>    el modelo emitía el mensaje completo de rechazo ante preguntas que SÍ
>    eran del tema, en un **~17 % de los casos** (medido con ráfagas de 6 y
>    12 preguntas legítimas). Se cambió a "¡Esa pregunta es de otro planeta!"
>    — encaja con la historia de la app y ningún saludo natural empieza así —
>    y se sacó "qué fino" de la lista de jerga sugerida. Reverificado:
>    **0 rechazos falsos sobre 6 preguntas legítimas**, y la única pregunta
>    realmente ajena sí fue rechazada.

## Capacidad y límites (medido)

Prueba de carga contra `ask-agent` (script en el historial del proyecto):

| Capa | Resultado |
|---|---|
| Límite de la app (`questions_limit`) | Responde **429** correctamente, antes de llamar a Gemini |
| Supabase Edge Functions | **100 peticiones concurrentes sin un solo fallo** de plataforma; p50 ~900 ms, p95 sube de 0,7 s a 2,3 s |
| Proveedor de IA (Gemini free + respaldo Groq) | **El cuello de botella real.** Una ráfaga de 20 simultáneas dio 17 OK y 3 fallos |

### El cuello de botella real: Groq, por tokens/minuto

Los logs de la prueba lo dejaron claro — **todos** los fallos venían de Groq:

```
GROQ_ERROR 429: Rate limit reached ... on tokens per minute (TPM):
Limit 8000, Used 7326, Requested 977. Please try again in 2.2725s
```

Tres datos que hay que tener presentes:

1. **El límite de Groq gratuito es de tokens por minuto (8.000), no de
   peticiones.** Con un prompt de ~977 tokens eso son **~8 peticiones por
   minuto**. Ese es el techo, y es mucho más bajo que el de Gemini.
2. **El tamaño del prompt es una palanca directa de capacidad.** Recortar el
   system prompt sube el número de alumnos simultáneos de forma proporcional.
3. **El proveedor dice cuánto esperar** en el propio mensaje de error. La
   primera versión de los reintentos esperaba 250 ms fijos cuando Groq pedía
   entre 1 y 4,5 s: fallaban todos y solo sumaban latencia.

### Cadena de respaldo (diseño actual)

- **Primera vuelta sin esperas.** Ante un 429 de Gemini se salta *ya* a Groq,
  que tiene cuota independiente. Reintentar contra el proveedor saturado solo
  amplifica el atasco.
- **Segunda vuelta solo si ambos fallaron por saturación**, esperando el
  tiempo que el proveedor indicó (tope de 3 s, presupuesto total de 6 s para
  no agotar la vida de la Edge Function).
- **Si aun así se agota, responde 429 y no 500.** El 500 decía "está roto"
  cuando en realidad estaba ocupado; el 429 le dice al cliente que reintente.
- El alumno **no pierde pista** en ningún fallo: `increment_questions_used`
  queda después del punto donde se lanza la excepción.
- El cliente **restaura la pregunta en el campo de texto** al fallar, para
  que no tenga que reescribirla.

### El prompt es una palanca de capacidad

Como el límite del respaldo es por tokens, **el tamaño del system prompt
divide la capacidad del sistema**. Se recortó un 45 % (528 → 293 tokens)
moviendo el *porqué* de cada regla a comentarios del código, que no se envían
a la API.

| Tokens por petición | Peticiones/min en Groq |
|---|---|
| ~977 (versión larga) | 8 |
| ~700 (actual) | 11 |

**Recortar de más rompe comportamiento.** Una versión aún más corta perdió
dos casos, detectados con la prueba de regresión:

- *"esto está difícil, no puedo"* → lo rechazaba como fuera de tema en vez de
  animar al alumno, que es justamente lo que Profe Bot debe hacer.
- *"dame la respuesta ya"* → lo rechazaba en vez de dar una pista.

Ambos están ahora enumerados explícitamente en las reglas 2 y 3.

También apareció que el modelo respondía con **LaTeX** (`\frac{1}{2}`), que la
burbuja del chat no renderiza: el niño veía las barras invertidas. La regla 4
exige texto plano.

> Antes de tocar el prompt, correr la prueba de regresión: cubre rechazos
> falsos, voseo, groserías y LaTeX.

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

## Profe Bot del lado del docente (`teacher-assist`)

El agente del alumno (`ask-agent`) está afinado para lo contrario de lo que
necesita un docente: responde en tres oraciones, nunca da el resultado y se
niega a salir del tema. Por eso el asistente de autoría es una Edge Function
aparte y no un modo más de aquella.

Dos modos, ambos restringidos a `teacher` y `coordinator` **dentro de la
función** (no solo en la interfaz): redacta contenido evaluativo con las
respuestas correctas, así que un alumno que la invocara obtendría resueltas
las preguntas de su propio tema.

| Modo | Qué hace | Devuelve |
|---|---|---|
| `suggest` | Propone subtemas evaluables del tema | 4–6 líneas |
| `generate` | Redacta las preguntas ya armadas | Preguntas parseadas |

### Dos fallas que costaron encontrar

**1. Presupuesto de tokens agotado por el razonamiento.** La primera versión
devolvía texto cortado a mitad de palabra: la lista de sugerencias con un
solo ítem, el quiz sin terminar la primera opción. Tanto `gpt-oss-20b` como
`gemini-3.6-flash` son modelos de razonamiento y gastan parte del
`max_tokens` en razonar **antes** del texto visible; con presupuestos
ajustados (400 y 1400) el razonamiento se lo comía casi todo. Es la misma
lección que ya estaba documentada para `ask-agent`. Solución: `reasoning_effort: 'low'`
y presupuestos holgados (2000 y 4000).

**2. Línea en blanco entre el enunciado y sus opciones.** El modelo escribía:

```
P: ¿...?

A) opción
B) opción *
```

`parseQuiz` separa preguntas por líneas en blanco, así que el enunciado y sus
opciones caían en bloques distintos y **ninguno** parseaba. Por eso
`normalizar()` no intenta limpiar el espaciado: lo ignora por completo y
re-segmenta por los `P:`, que es la única marca fiable.

Medición tras los arreglos: **6/6 generaciones válidas**, 17 preguntas, 0 sin
respuesta marcada, p50 1,3 s.

### Límite conocido

La IA se equivoca marcando la respuesta correcta. En una prueba dio como
correcta "sublimación" para una pregunta sobre qué inicia la lluvia. Por eso
las preguntas generadas **nunca se guardan solas**: entran al editor marcadas
en ámbar, con un aviso explícito de revisarlas, y el docente confirma. El
asistente redacta borradores; quien evalúa sigue siendo el docente.
