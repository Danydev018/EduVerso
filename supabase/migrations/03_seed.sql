-- ============================================================================
-- 03_seed.sql — Datos iniciales (grados, año escolar, plantillas)
-- Aplicar DESPUÉS de 02_helpers_and_rls.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Grados con tiers
-- ----------------------------------------------------------------------------

insert into public.grades (id, name, tier) values
  (1, '1er Grado', 'bronze'),
  (2, '2do Grado', 'bronze'),
  (3, '3er Grado', 'silver'),
  (4, '4to Grado', 'silver'),
  (5, '5to Grado', 'gold'),
  (6, '6to Grado', 'gold')
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- Año escolar inicial — ajustar fechas si es necesario
-- ----------------------------------------------------------------------------

insert into public.school_years (name, start_date, end_date, is_current) values
  ('2025-2026', '2025-09-16', '2026-07-15', true)
on conflict do nothing;

-- ----------------------------------------------------------------------------
-- Plantillas de actividad (ver docs/09-plantillas-actividad.md)
-- ----------------------------------------------------------------------------

insert into public.activity_templates (name, description, steps) values
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
