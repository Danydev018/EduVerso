-- ---------------------------------------------------------------------------
-- Que el docente arme sus propias lecciones
--
-- Hasta ahora `topic_lessons` solo la escribía coordinación: un docente podía
-- leer las 73 lecciones pero no crear ni corregir ninguna. Eso deja el
-- contenido congelado en quien lo sembró.
--
-- Se abre la escritura, PERO acotada a los temas del grado que el docente
-- realmente dicta. Sin esa condición, un docente de 1er grado podría
-- reescribir la lección de 6to, y el daño no se notaría hasta que un alumno
-- de sexto abriera una lección de primero.
-- ---------------------------------------------------------------------------

/**
 * ¿El tema pertenece a un grado que este docente dicta en el año activo?
 *
 * Va por `classrooms`: el grado sale del salón asignado, no de un campo del
 * perfil, para que un cambio de salón se refleje solo.
 */
create or replace function public.teaches_topic(p_topic_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from topics t
    join subjects s   on s.id = t.subject_id
    join classrooms c on c.grade_id = s.grade_id
    join school_years y on y.id = c.school_year_id and y.is_current
    where t.id = p_topic_id
      and c.teacher_id = auth.uid()
  );
$$;

drop policy if exists topic_lessons_write on public.topic_lessons;

-- Coordinación mantiene alcance total; el docente, solo su grado.
drop policy if exists topic_lessons_insert on public.topic_lessons;
create policy topic_lessons_insert on public.topic_lessons
  for insert with check (
    public.is_coordinator() or public.teaches_topic(topic_id)
  );

drop policy if exists topic_lessons_update on public.topic_lessons;
create policy topic_lessons_update on public.topic_lessons
  for update using (
    public.is_coordinator() or public.teaches_topic(topic_id)
  );

drop policy if exists topic_lessons_delete on public.topic_lessons;
create policy topic_lessons_delete on public.topic_lessons
  for delete using (
    public.is_coordinator() or public.teaches_topic(topic_id)
  );

-- Un tema no puede tener dos lecciones: la página del alumno lee una sola
-- (`maybeSingle`) y con dos filas devolvería error en vez de contenido.
create unique index if not exists topic_lessons_topic_unico
  on public.topic_lessons(topic_id);

-- ── Archivos de las lecciones ──────────────────────────────────────────────
-- Cuando una escena no alcanza, la página lleva una imagen o un audio. Van en
-- su propio bucket y no en `activity-media`, porque aquel decide el permiso
-- leyendo un `activity_id` de la ruta y una lección no pertenece a ninguna
-- actividad: cuelga de un tema.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'lesson-media', 'lesson-media', false,
  10485760,
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/mp4', 'audio/wav'
  ]
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

/** Primer segmento de la ruta = topic_id. Null si no sigue la convención. */
create or replace function public.topic_id_from_path(p_path text)
returns uuid
language plpgsql
immutable
as $$
declare
  v_id uuid;
begin
  v_id := (storage.foldername(p_path))[1]::uuid;
  return v_id;
exception when others then
  return null;
end;
$$;

-- Las lecciones son currículo: cualquier autenticado las lee, igual que la
-- fila de `topic_lessons` (su política de SELECT es `true`).
drop policy if exists lesson_media_select on storage.objects;
create policy lesson_media_select on storage.objects
  for select using (bucket_id = 'lesson-media');

drop policy if exists lesson_media_insert on storage.objects;
create policy lesson_media_insert on storage.objects
  for insert with check (
    bucket_id = 'lesson-media'
    and (public.is_coordinator() or public.teaches_topic(public.topic_id_from_path(name)))
  );

drop policy if exists lesson_media_update on storage.objects;
create policy lesson_media_update on storage.objects
  for update using (
    bucket_id = 'lesson-media'
    and (public.is_coordinator() or public.teaches_topic(public.topic_id_from_path(name)))
  );

drop policy if exists lesson_media_delete on storage.objects;
create policy lesson_media_delete on storage.objects
  for delete using (
    bucket_id = 'lesson-media'
    and (public.is_coordinator() or public.teaches_topic(public.topic_id_from_path(name)))
  );
