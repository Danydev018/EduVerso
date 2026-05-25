# 09 — Plantillas de Actividad

Las plantillas son predefinidas por el desarrollador. Los docentes no pueden crear ni modificar plantillas — solo crear actividades a partir de ellas. Si se requiere una plantilla nueva, el desarrollador la agrega directamente en la base de datos.

## Estructura de una plantilla (JSONB)

```typescript
type Step = {
  index: number           // posición del paso (0-based)
  type: 'introduction'    // contenido explicativo
       | 'quiz'           // preguntas de opción múltiple o respuesta corta
       | 'challenge'      // ejercicio sin ayuda del agente
  title: string           // título visible al alumno
  description: string     // instrucción o enunciado del paso
  ai_enabled: boolean     // ¿el agente está disponible en este paso?
  ai_question_limit: number // preguntas disponibles (0 si ai_enabled = false)
  xp_reward: number       // XP que se otorga al completar este paso
  duration_minutes: number // tiempo estimado del paso (informativo)
}

type Template = {
  id: string
  name: string
  description: string
  steps: Step[]
}
```

---

## Plantilla 1: Exploración + Quiz

**Nombre:** `Exploración y Comprensión`
**Descripción:** Introduce un tema nuevo con contenido explicativo y valida comprensión con preguntas.
**Metodología:** Introducción espaciada + recuperación activa (Ebbinghaus).

```json
{
  "name": "Exploración y Comprensión",
  "description": "Introduce un tema nuevo y evalúa comprensión básica.",
  "steps": [
    {
      "index": 0,
      "type": "introduction",
      "title": "Exploremos el tema",
      "description": "Lee con atención. Puedes preguntarle a Profe Bot si algo no queda claro.",
      "ai_enabled": true,
      "ai_question_limit": 2,
      "xp_reward": 15,
      "duration_minutes": 5
    },
    {
      "index": 1,
      "type": "quiz",
      "title": "¿Qué aprendiste?",
      "description": "Responde las preguntas sobre lo que acabas de leer. Profe Bot puede darte pistas.",
      "ai_enabled": true,
      "ai_question_limit": 2,
      "xp_reward": 35,
      "duration_minutes": 10
    },
    {
      "index": 2,
      "type": "challenge",
      "title": "Reto final",
      "description": "Demuestra lo que aprendiste. Sin ayuda esta vez — tú puedes.",
      "ai_enabled": false,
      "ai_question_limit": 0,
      "xp_reward": 25,
      "duration_minutes": 5
    }
  ]
}
```

**XP total posible:** 75 + 25 (bonus completitud) = **100 XP**

---

## Plantilla 2: Práctica Guiada

**Nombre:** `Práctica con Guía`
**Descripción:** El agente introduce el proceso, luego el alumno practica con asistencia, y cierra con un ejercicio autónomo.
**Metodología:** Modelado → práctica guiada → práctica independiente (Gradual Release of Responsibility).

```json
{
  "name": "Práctica con Guía",
  "description": "El agente modela el proceso y acompaña la práctica antes del ejercicio autónomo.",
  "steps": [
    {
      "index": 0,
      "type": "introduction",
      "title": "Profe Bot te explica",
      "description": "Profe Bot te mostrará cómo resolver este tipo de problema. Puedes hacerle preguntas.",
      "ai_enabled": true,
      "ai_question_limit": 2,
      "xp_reward": 10,
      "duration_minutes": 5
    },
    {
      "index": 1,
      "type": "quiz",
      "title": "Practiquemos juntos",
      "description": "Resuelve estos ejercicios. Profe Bot puede darte una pista si la necesitas.",
      "ai_enabled": true,
      "ai_question_limit": 2,
      "xp_reward": 40,
      "duration_minutes": 15
    },
    {
      "index": 2,
      "type": "challenge",
      "title": "¡Ahora tú solo!",
      "description": "Un ejercicio final sin ayuda. Confía en lo que aprendiste.",
      "ai_enabled": false,
      "ai_question_limit": 0,
      "xp_reward": 30,
      "duration_minutes": 10
    }
  ]
}
```

**XP total posible:** 80 + 25 (bonus) = **105 XP**

---

## Plantilla 3: Repaso Espaciado

**Nombre:** `Repaso Rápido`
**Descripción:** Revisión de un tema ya visto. Más preguntas, menos explicación. Refuerza la memoria a largo plazo.
**Metodología:** Recuperación espaciada (spaced repetition, Ebbinghaus). Ideal para actividades de repaso 1-2 semanas después de la actividad original.

```json
{
  "name": "Repaso Rápido",
  "description": "Refuerza lo que ya aprendiste con preguntas de repaso y un reto cronometrado.",
  "steps": [
    {
      "index": 0,
      "type": "introduction",
      "title": "Recordemos",
      "description": "Un resumen breve del tema. ¿Lo recuerdas todo?",
      "ai_enabled": false,
      "ai_question_limit": 0,
      "xp_reward": 5,
      "duration_minutes": 3
    },
    {
      "index": 1,
      "type": "quiz",
      "title": "Quiz de repaso",
      "description": "8 preguntas sobre el tema. Profe Bot puede darte una pista si la necesitas.",
      "ai_enabled": true,
      "ai_question_limit": 2,
      "xp_reward": 50,
      "duration_minutes": 12
    },
    {
      "index": 2,
      "type": "challenge",
      "title": "Reto relámpago",
      "description": "El ejercicio más difícil. Sin ayuda. ¡Tú puedes!",
      "ai_enabled": false,
      "ai_question_limit": 0,
      "xp_reward": 20,
      "duration_minutes": 5
    }
  ]
}
```

**XP total posible:** 75 + 25 (bonus) = **100 XP**

---

## SQL para sembrar las plantillas

```sql
insert into activity_templates (name, description, steps) values
(
  'Exploración y Comprensión',
  'Introduce un tema nuevo y evalúa comprensión básica.',
  '[
    {"index":0,"type":"introduction","title":"Exploremos el tema","description":"Lee con atención. Puedes preguntarle a Profe Bot si algo no queda claro.","ai_enabled":true,"ai_question_limit":2,"xp_reward":15,"duration_minutes":5},
    {"index":1,"type":"quiz","title":"¿Qué aprendiste?","description":"Responde las preguntas sobre lo que acabas de leer. Profe Bot puede darte pistas.","ai_enabled":true,"ai_question_limit":2,"xp_reward":35,"duration_minutes":10},
    {"index":2,"type":"challenge","title":"Reto final","description":"Demuestra lo que aprendiste. Sin ayuda esta vez — tú puedes.","ai_enabled":false,"ai_question_limit":0,"xp_reward":25,"duration_minutes":5}
  ]'::jsonb
),
(
  'Práctica con Guía',
  'El agente modela el proceso y acompaña la práctica antes del ejercicio autónomo.',
  '[
    {"index":0,"type":"introduction","title":"Profe Bot te explica","description":"Profe Bot te mostrará cómo resolver este tipo de problema. Puedes hacerle preguntas.","ai_enabled":true,"ai_question_limit":2,"xp_reward":10,"duration_minutes":5},
    {"index":1,"type":"quiz","title":"Practiquemos juntos","description":"Resuelve estos ejercicios. Profe Bot puede darte una pista si la necesitas.","ai_enabled":true,"ai_question_limit":2,"xp_reward":40,"duration_minutes":15},
    {"index":2,"type":"challenge","title":"¡Ahora tú solo!","description":"Un ejercicio final sin ayuda. Confía en lo que aprendiste.","ai_enabled":false,"ai_question_limit":0,"xp_reward":30,"duration_minutes":10}
  ]'::jsonb
),
(
  'Repaso Rápido',
  'Refuerza lo que ya aprendiste con preguntas de repaso y un reto cronometrado.',
  '[
    {"index":0,"type":"introduction","title":"Recordemos","description":"Un resumen breve del tema. ¿Lo recuerdas todo?","ai_enabled":false,"ai_question_limit":0,"xp_reward":5,"duration_minutes":3},
    {"index":1,"type":"quiz","title":"Quiz de repaso","description":"8 preguntas sobre el tema. Profe Bot puede darte una pista si la necesitas.","ai_enabled":true,"ai_question_limit":2,"xp_reward":50,"duration_minutes":12},
    {"index":2,"type":"challenge","title":"Reto relámpago","description":"El ejercicio más difícil. Sin ayuda. ¡Tú puedes!","ai_enabled":false,"ai_question_limit":0,"xp_reward":20,"duration_minutes":5}
  ]'::jsonb
);
```

## Cómo agregar una plantilla nueva

1. Definir el arreglo `steps` siguiendo el tipo `Step` definido arriba.
2. Insertar directamente en la base de datos via SQL Editor de Supabase.
3. La nueva plantilla aparece automáticamente en el selector del docente sin cambios en el frontend.
4. Documentar la nueva plantilla en este archivo antes de insertarla.
