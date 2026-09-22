-- ---------------------------------------------------------------------------
-- 14_quiz_calificado.sql
--
-- El quiz pasa a corregirse en el servidor, a llevar métrica de acierto y a
-- influir en el XP. Hasta ahora se corregía en el navegador y el servidor no
-- se enteraba del resultado.
--
-- ───────────────────────────────────────────────────────────────────────────
-- EL PROBLEMA QUE CIERRA
--
-- Las preguntas viven en `activities.ai_context` con la opción correcta
-- marcada con `*`. El alumno necesita leer su actividad para resolverla, así
-- que `activities_select` se la concedía entera: con su propio token podía
-- pedir ese campo y leer todas las respuestas antes de contestar
-- (ver tests/e2e/seguridad/02-alumno.spec.ts).
--
-- Mientras el XP no dependía del acierto eso solo arruinaba el valor
-- formativo. Ahora que el acierto cuenta, además permitiría inflar la
-- puntuación, así que hay que cerrarlo de verdad.
--
-- ───────────────────────────────────────────────────────────────────────────
-- CÓMO SE CIERRA
--
-- RLS es por FILA, no por columna: mientras la clave de respuestas viva en una
-- columna de `activities`, cualquier política que le deje ver la actividad se
-- la deja ver entera. Así que la clave se muda a su propia tabla
-- (`activity_quizzes`), con su propia política, y de `ai_context` se borran
-- los asteriscos. El alumno sigue viendo las preguntas; la respuesta ya no
-- está ahí.
--
-- ───────────────────────────────────────────────────────────────────────────
-- POR QUÉ EL PARSER VA EN SQL Y NO EN LA EDGE FUNCTION
--
-- Podría duplicarse la lógica de `lib/quiz.ts` en Deno, pero entonces habría
-- DOS parsers: el que muestra las opciones y el que corrige. Si se separan, el
-- alumno vería una lista y se le calificaría contra otra, y el fallo sería
-- silencioso. Con el parser en la base, lo que se muestra y lo que se corrige
-- salen de la misma función.
-- ---------------------------------------------------------------------------

-- ── 1. El parser, único y autoritativo ─────────────────────────────────────

/*
  Formato que escribe el docente (igual que documenta lib/quiz.ts):

    P: ¿Cuál es la capital de Francia?
    A) Madrid
    B) París *
    C) Roma

  Bloques separados por línea en blanco. La correcta lleva `*` al final.
  Un bloque sin pregunta, con menos de dos opciones o sin ninguna marcada se
  descarta: es el caso del docente que solo dejó una nota para el tutor.
*/
create or replace function public.quiz_parsear(p_texto text)
returns jsonb
language plpgsql
immutable
as $$
declare
  v_bloque    text;
  v_linea     text;
  v_pregunta  text;
  v_opciones  text[];
  v_correcta  integer;
  v_texto_op  text;
  v_salida    jsonb := '[]'::jsonb;
begin
  if p_texto is null or btrim(p_texto) = '' then
    return v_salida;
  end if;

  foreach v_bloque in array regexp_split_to_array(p_texto, E'\\n[ \\t]*\\n')
  loop
    v_pregunta := null;
    v_opciones := array[]::text[];
    v_correcta := null;

    foreach v_linea in array regexp_split_to_array(v_bloque, E'\\n')
    loop
      v_linea := btrim(v_linea);

      if v_linea ~* '^P:' then
        v_pregunta := btrim(regexp_replace(v_linea, '^[Pp]:[ \t]*', ''));

      elsif v_linea ~ '^[A-Za-z][).][ \t]*.+' then
        v_texto_op := btrim(regexp_replace(v_linea, '^[A-Za-z][).][ \t]*', ''));

        -- La marca se detecta ANTES de limpiarla, o se perdería el dato.
        if v_texto_op ~ '\*[ \t]*$' then
          v_correcta := array_length(v_opciones, 1);
          if v_correcta is null then v_correcta := 0; end if;
          v_texto_op := btrim(regexp_replace(v_texto_op, '[ \t]*\*[ \t]*$', ''));
        end if;

        v_opciones := v_opciones || v_texto_op;
      end if;
    end loop;

    if v_pregunta is not null
       and coalesce(array_length(v_opciones, 1), 0) >= 2
       and v_correcta is not null then
      v_salida := v_salida || jsonb_build_object(
        'pregunta', v_pregunta,
        'opciones', to_jsonb(v_opciones),
        'correcta', v_correcta
      );
    end if;
  end loop;

  return v_salida;
end;
$$;

comment on function public.quiz_parsear(text) is
  'Parser único del formato de quiz. Devuelve [{pregunta, opciones[], correcta}]. Ver 14_quiz_calificado.sql';

-- ── 2. La clave de respuestas, en su propia tabla ──────────────────────────

create table if not exists public.activity_quizzes (
  activity_id uuid primary key references public.activities(id) on delete cascade,
  quiz_text   text not null,
  updated_at  timestamptz not null default now()
);

comment on table public.activity_quizzes is
  'Texto del quiz CON las respuestas marcadas. Tabla aparte porque RLS es por fila: en una columna de activities el alumno la vería junto con la actividad.';

alter table public.activity_quizzes enable row level security;

-- Solo coordinación y el docente dueño del salón. El alumno NO entra acá.
drop policy if exists activity_quizzes_select on public.activity_quizzes;
create policy activity_quizzes_select on public.activity_quizzes
  for select to authenticated using (
    public.is_coordinator()
    or exists (
      select 1 from public.activities a
      where a.id = activity_quizzes.activity_id
        and public.owns_classroom(a.classroom_id)
    )
  );

drop policy if exists activity_quizzes_write on public.activity_quizzes;
create policy activity_quizzes_write on public.activity_quizzes
  for all to authenticated using (
    public.is_coordinator()
    or exists (
      select 1 from public.activities a
      where a.id = activity_quizzes.activity_id
        and public.owns_classroom(a.classroom_id)
    )
  ) with check (
    public.is_coordinator()
    or exists (
      select 1 from public.activities a
      where a.id = activity_quizzes.activity_id
        and public.owns_classroom(a.classroom_id)
    )
  );

-- ── 3. Mudar lo que ya existe y limpiar ai_context ─────────────────────────

-- Se copia la clave a la tabla nueva…
insert into public.activity_quizzes (activity_id, quiz_text)
select a.id, a.ai_context
from public.activities a
where a.ai_context is not null
  and jsonb_array_length(public.quiz_parsear(a.ai_context)) > 0
on conflict (activity_id) do nothing;

-- …y se le quitan los asteriscos a ai_context, que el alumno sí puede leer.
-- Queda con las preguntas y las opciones, que es lo que necesita para
-- resolver, y le sigue sirviendo de contexto al tutor.
-- El filtro va con LIKE y no con una expresión regular a propósito: el
-- operador `~` no acepta banderas, así que su `$` significa "fin de la
-- CADENA" y no "fin de línea". Escrito como `ai_context ~ '\*[ \t]*$'` el
-- filtro solo encontraba textos cuyo ÚLTIMO renglón llevara asterisco —casi
-- ninguno— y el UPDATE no tocaba nada, en silencio. El `regexp_replace` sí
-- lleva la bandera `n` y por eso limpia todos los renglones.
update public.activities
set ai_context = regexp_replace(ai_context, '[ \t]*\*[ \t]*$', '', 'gn')
where ai_context is not null
  and ai_context like '%*%';

-- ── 4. Resultado de cada respuesta ─────────────────────────────────────────

create table if not exists public.quiz_results (
  id             uuid primary key default gen_random_uuid(),
  student_id     uuid not null references public.students(id) on delete cascade,
  activity_id    uuid not null references public.activities(id) on delete cascade,
  step_index     integer not null,
  question_index integer not null,
  chosen_index   integer not null,
  is_correct     boolean not null,
  answered_at    timestamptz not null default now(),
  -- CUENTA LA PRIMERA RESPUESTA. Si se pudiera reintentar, el porcentaje de
  -- acierto dejaría de medir nada: bastaría insistir hasta acertar.
  unique (student_id, activity_id, step_index, question_index)
);

comment on table public.quiz_results is
  'Una fila por pregunta contestada. La restricción única hace que solo cuente el primer intento.';

alter table public.quiz_results enable row level security;

-- El alumno ve lo suyo; el docente, lo de su salón; coordinación, todo.
drop policy if exists quiz_results_select on public.quiz_results;
create policy quiz_results_select on public.quiz_results
  for select to authenticated using (
    student_id = auth.uid()
    or public.is_coordinator()
    or exists (
      select 1 from public.activities a
      where a.id = quiz_results.activity_id
        and public.owns_classroom(a.classroom_id)
    )
  );

-- Nadie escribe por la API: solo la Edge Function con service_role, que es la
-- única que ve la clave de respuestas. Sin política de escritura, RLS niega.

-- ── 5. Lo que el alumno puede pedir: preguntas SIN respuestas ──────────────

/*
  `SECURITY DEFINER` para que pueda leer `activity_quizzes`, que el alumno no
  alcanza. Antes de devolver nada comprueba que quien pregunta sea un alumno
  del salón de esa actividad y que la actividad esté vigente: las mismas
  condiciones que la política `activities_select`.

  Devuelve las opciones y NO el índice correcto. Esa es toda la diferencia con
  lo que había antes.
*/
create or replace function public.quiz_para_alumno(p_activity_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_texto text;
  v_quiz  jsonb;
begin
  if not public.is_student() then
    raise exception 'Solo el alumno usa esta función' using errcode = '42501';
  end if;

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

  select quiz_text into v_texto
  from public.activity_quizzes
  where activity_id = p_activity_id;

  v_quiz := public.quiz_parsear(v_texto);

  -- Se quita `correcta` de cada pregunta antes de que salga de la base.
  return coalesce(
    (select jsonb_agg(q - 'correcta') from jsonb_array_elements(v_quiz) q),
    '[]'::jsonb
  );
end;
$$;

comment on function public.quiz_para_alumno(uuid) is
  'Preguntas y opciones del quiz, SIN el índice correcto. Ver 14_quiz_calificado.sql';

-- ── 6. Porcentaje de acierto ───────────────────────────────────────────────

create or replace view public.quiz_stats as
select
  r.student_id,
  r.activity_id,
  a.classroom_id,
  count(*)                                              as respondidas,
  count(*) filter (where r.is_correct)                  as correctas,
  round(100.0 * count(*) filter (where r.is_correct) / count(*), 1) as porcentaje
from public.quiz_results r
join public.activities a on a.id = r.activity_id
group by r.student_id, r.activity_id, a.classroom_id;

comment on view public.quiz_stats is
  'Acierto por alumno y actividad. Hereda RLS de quiz_results: cada uno ve lo que le toca.';
