-- ---------------------------------------------------------------------------
-- 15_responder_quiz.sql
--
-- La corrección del quiz pasa al servidor, pregunta por pregunta.
--
-- ───────────────────────────────────────────────────────────────────────────
-- POR QUÉ PREGUNTA POR PREGUNTA Y NO AL CERRAR EL PASO
--
-- Se podría calificar todo junto al completar el paso, con una sola llamada.
-- Pero la interacción que ya existe es: el alumno elige, toca "comprobar", y
-- ve al instante si acertó y cuál era la correcta. Eso es lo formativo del
-- quiz y es lo que hay que conservar. Calificar al final obligaría a contestar
-- todo a ciegas y recibir el resultado de golpe.
--
-- El costo es un viaje al servidor por pregunta. Es aceptable: el alumno ya
-- está en línea —acaba de cargar la actividad— y son tres o cuatro preguntas.
--
-- ───────────────────────────────────────────────────────────────────────────
-- SOLO CUENTA EL PRIMER INTENTO
--
-- El `on conflict do nothing` sobre la restricción única de `quiz_results` es
-- lo que hace que el porcentaje signifique algo. Sin eso bastaría insistir
-- hasta acertar y todos tendrían 100%.
--
-- Ojo: la función DEVUELVE la corrección aunque la respuesta ya estuviera
-- registrada, para que recargar la página no rompa la pantalla. Lo que no
-- hace es volver a contarla.
-- ---------------------------------------------------------------------------

create or replace function public.responder_quiz(
  p_activity_id    uuid,
  p_step_index     integer,
  p_question_index integer,
  p_chosen_index   integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_quiz       jsonb;
  v_pregunta   jsonb;
  v_correcta   integer;
  v_acierto    boolean;
  v_ya_estaba  boolean := false;
  v_previa     integer;
begin
  if not public.is_student() then
    raise exception 'Solo el alumno contesta el quiz' using errcode = '42501';
  end if;

  -- Mismas condiciones que la política `activities_select`: la actividad tiene
  -- que ser de su salón y estar vigente. Se repiten acá porque esta función es
  -- SECURITY DEFINER y por tanto se salta RLS: la autorización es su
  -- responsabilidad.
  if not exists (
    select 1 from public.activities a
    where a.id = p_activity_id
      and a.classroom_id = public.my_classroom_id()
      and a.status = 'active'
      and (a.available_from is null or a.available_from <= now())
      and (a.available_until is null or a.available_until >= now())
  ) then
    raise exception 'Actividad no disponible' using errcode = '42501';
  end if;

  select public.quiz_parsear(quiz_text) into v_quiz
  from public.activity_quizzes
  where activity_id = p_activity_id;

  if v_quiz is null or jsonb_array_length(v_quiz) <= p_question_index or p_question_index < 0 then
    raise exception 'Esa pregunta no existe' using errcode = '22023';
  end if;

  v_pregunta := v_quiz -> p_question_index;
  v_correcta := (v_pregunta ->> 'correcta')::integer;
  v_acierto  := (p_chosen_index = v_correcta);

  -- ¿Ya había contestado? Se mira antes de insertar para poder informarlo.
  select chosen_index into v_previa
  from public.quiz_results
  where student_id = auth.uid()
    and activity_id = p_activity_id
    and step_index = p_step_index
    and question_index = p_question_index;

  if v_previa is not null then
    v_ya_estaba := true;
    -- Se responde con el PRIMER intento, no con el actual: es el que cuenta.
    v_acierto := (v_previa = v_correcta);
  else
    insert into public.quiz_results (
      student_id, activity_id, step_index, question_index, chosen_index, is_correct
    ) values (
      auth.uid(), p_activity_id, p_step_index, p_question_index, p_chosen_index, v_acierto
    )
    on conflict (student_id, activity_id, step_index, question_index) do nothing;
  end if;

  return jsonb_build_object(
    'acierto', v_acierto,
    'indice_correcto', v_correcta,
    'ya_respondida', v_ya_estaba
  );
end;
$$;

comment on function public.responder_quiz(uuid, integer, integer, integer) is
  'Corrige una respuesta del quiz en el servidor y la registra. Solo cuenta el primer intento. Ver 15_responder_quiz.sql';

-- ── Acierto acumulado de un alumno en una actividad ────────────────────────

/*
  La usa `complete-step` para ponderar el XP. Va como función y no como
  consulta suelta para que la fórmula del XP y la métrica lean lo mismo.

  Devuelve 1.0 cuando el paso no tenía preguntas: un paso de introducción no
  debe cobrar menos XP por no tener quiz.
*/
create or replace function public.quiz_acierto(
  p_student_id  uuid,
  p_activity_id uuid,
  p_step_index  integer
)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select case
    when count(*) = 0 then 1.0
    else count(*) filter (where is_correct)::numeric / count(*)
  end
  from public.quiz_results
  where student_id = p_student_id
    and activity_id = p_activity_id
    and step_index = p_step_index;
$$;

comment on function public.quiz_acierto(uuid, uuid, integer) is
  'Proporción de acierto de un alumno en un paso. 1.0 si el paso no tenía quiz.';
