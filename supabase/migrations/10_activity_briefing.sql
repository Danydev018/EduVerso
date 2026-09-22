-- ---------------------------------------------------------------------------
-- Repaso previo de la actividad ("Antes de empezar")
--
-- El alumno entraba a la actividad sin contexto: la primera pantalla ya le
-- pedía responder. Este repaso es lo que el docente le muestra ANTES, con sus
-- propias palabras: texto, imágenes y audio que puede grabar en el momento.
--
-- REGLA DE LA IMAGEN
-- Una imagen sola no explica nada, y menos a un niño que está empezando a
-- leer o que no puede verla. Por eso toda imagen exige una descripción: audio
-- grabado o texto. La regla se aplica con un CHECK y no solo en la interfaz,
-- porque es una condición del contenido, no una validación de formulario.
-- ---------------------------------------------------------------------------

create table if not exists public.activity_briefing_blocks (
  id           uuid primary key default gen_random_uuid(),
  activity_id  uuid not null references public.activities(id) on delete cascade,
  order_index  int  not null default 0,
  kind         text not null check (kind in ('text', 'image', 'audio')),

  -- Bloque de texto: el contenido. Bloque de imagen: su descripción escrita.
  text_content text,
  -- Ruta en el bucket `activity-media`: la imagen o el audio del bloque.
  media_path   text,
  -- Solo para bloques de imagen: el audio donde el docente la explica.
  audio_path   text,

  created_at   timestamptz not null default now(),

  constraint texto_con_contenido check (
    kind <> 'text' or coalesce(btrim(text_content), '') <> ''
  ),
  constraint audio_con_archivo check (
    kind <> 'audio' or media_path is not null
  ),
  -- La regla: imagen + (audio explicándola o texto describiéndola).
  constraint imagen_con_descripcion check (
    kind <> 'image' or (
      media_path is not null
      and (coalesce(btrim(text_content), '') <> '' or audio_path is not null)
    )
  )
);

create index if not exists briefing_blocks_activity_idx
  on public.activity_briefing_blocks(activity_id, order_index);

comment on table public.activity_briefing_blocks is
  'Repaso que el alumno ve antes de empezar la actividad. Toda imagen lleva '
  'audio o texto que la describa (constraint imagen_con_descripcion).';

-- ── Quién puede ver una actividad ──────────────────────────────────────────
-- Réplica exacta de la política `activities_select`, incluida la ventana de
-- disponibilidad para el alumno. Se extrae a una función para que el repaso y
-- sus archivos hereden la misma visibilidad sin repetir la condición en tres
-- lugares (y sin que se desincronicen si mañana cambia).
create or replace function public.can_view_activity(p_activity_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from activities a
    where a.id = p_activity_id
      and (
        public.is_coordinator()
        or public.owns_classroom(a.classroom_id)
        or (
          public.is_student()
          and a.classroom_id = public.my_classroom_id()
          and a.status = 'active'
          and (a.available_from  is null or a.available_from  <= now())
          and (a.available_until is null or a.available_until >= now())
        )
      )
  );
$$;

-- Editar el repaso es exclusivo del docente dueño (o coordinación).
create or replace function public.can_edit_activity(p_activity_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from activities a
    where a.id = p_activity_id
      and (public.is_coordinator() or public.owns_classroom(a.classroom_id))
  );
$$;

-- ── RLS de los bloques ─────────────────────────────────────────────────────
alter table public.activity_briefing_blocks enable row level security;

drop policy if exists briefing_select on public.activity_briefing_blocks;
create policy briefing_select on public.activity_briefing_blocks
  for select using (public.can_view_activity(activity_id));

drop policy if exists briefing_insert on public.activity_briefing_blocks;
create policy briefing_insert on public.activity_briefing_blocks
  for insert with check (public.can_edit_activity(activity_id));

drop policy if exists briefing_update on public.activity_briefing_blocks;
create policy briefing_update on public.activity_briefing_blocks
  for update using (public.can_edit_activity(activity_id));

drop policy if exists briefing_delete on public.activity_briefing_blocks;
create policy briefing_delete on public.activity_briefing_blocks
  for delete using (public.can_edit_activity(activity_id));

-- ── Bucket de archivos ─────────────────────────────────────────────────────
-- Privado a propósito. El audio lo graba una persona real hablándole a sus
-- alumnos; con el bucket público, cualquiera con la URL lo escucharía. Se
-- sirve con URLs firmadas de corta vida generadas en el servidor.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'activity-media', 'activity-media', false,
  10485760,  -- 10 MB: un audio de un minuto pesa ~500 kB; una foto, ~2 MB
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/mp4', 'audio/wav'
  ]
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Convención de rutas: `{activity_id}/{archivo}`. El permiso sale de la
-- actividad dueña de la carpeta, así que hay que leer ese primer segmento.
create or replace function public.activity_id_from_path(p_path text)
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
  -- Ruta que no sigue la convención: sin actividad, sin permiso.
  return null;
end;
$$;

drop policy if exists activity_media_select on storage.objects;
create policy activity_media_select on storage.objects
  for select using (
    bucket_id = 'activity-media'
    and public.can_view_activity(public.activity_id_from_path(name))
  );

drop policy if exists activity_media_insert on storage.objects;
create policy activity_media_insert on storage.objects
  for insert with check (
    bucket_id = 'activity-media'
    and public.can_edit_activity(public.activity_id_from_path(name))
  );

drop policy if exists activity_media_update on storage.objects;
create policy activity_media_update on storage.objects
  for update using (
    bucket_id = 'activity-media'
    and public.can_edit_activity(public.activity_id_from_path(name))
  );

drop policy if exists activity_media_delete on storage.objects;
create policy activity_media_delete on storage.objects
  for delete using (
    bucket_id = 'activity-media'
    and public.can_edit_activity(public.activity_id_from_path(name))
  );
