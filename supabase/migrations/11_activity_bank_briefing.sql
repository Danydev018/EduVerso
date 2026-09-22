-- ---------------------------------------------------------------------------
-- Repaso en el repositorio de evaluaciones
--
-- El repaso ("Antes de empezar") vive en `activity_briefing_blocks`, colgado
-- de una actividad concreta. Eso deja un hueco: una evaluación del banco no
-- puede llevar repaso, así que el docente que la asigna recibe las preguntas
-- pero manda al alumno directo a responder, sin contexto.
--
-- Acá el banco guarda su propio repaso como un arreglo de párrafos, y
-- `assignFromBank` los copia a bloques de texto de la actividad nueva. Mismo
-- criterio que el contenido de las preguntas: se COPIA, no se referencia, así
-- el docente puede ajustar el repaso de su salón sin tocar el banco.
--
-- Es jsonb de textos y no bloques completos a propósito: el contenido semilla
-- no puede traer imágenes ni audios (no hay archivos que subir), y un arreglo
-- de párrafos es exactamente lo que hace falta para explicar con ejemplos.
-- ---------------------------------------------------------------------------

alter table public.activity_bank
  add column if not exists briefing jsonb not null default '[]'::jsonb;

comment on column public.activity_bank.briefing is
  'Párrafos del repaso previo, en orden. Se copian a activity_briefing_blocks '
  'como bloques de texto al asignar la evaluación a un salón.';

-- Solo arreglos: si entrara un objeto o un texto suelto, el copiado al
-- asignar fallaría en silencio y el alumno se quedaría sin repaso.
alter table public.activity_bank
  drop constraint if exists briefing_es_arreglo;
alter table public.activity_bank
  add constraint briefing_es_arreglo
  check (jsonb_typeof(briefing) = 'array');
