-- ---------------------------------------------------------------------------
-- Lecciones ilustradas por tema
--
-- El repaso de una actividad son tres párrafos: alcanza para recordar, no para
-- ENTENDER algo por primera vez. Los temas duros (fracciones, porcentajes, el
-- ciclo del agua, las cadenas alimentarias) necesitan más espacio y, sobre
-- todo, una imagen que se mueva mostrando el mecanismo.
--
-- La lección va colgada del TEMA y no de la actividad: el mecanismo de las
-- fracciones es el mismo sin importar qué evaluación haya armado el docente,
-- así que se escribe una vez y la aprovechan todas las actividades de ese
-- tema, del banco o propias.
--
-- `pages` es un arreglo de páginas, y cada página trae:
--   art    → id de la ilustración animada (ver lesson-scenes.tsx)
--   title  → título de la página
--   body   → el texto, escrito para leerse como un libro
--   labels → (opcional) rótulos que la ilustración dibuja
--
-- El id de la ilustración viaja como texto porque la base no puede guardar un
-- componente. El registro del cliente traduce ese id al dibujo; un id que no
-- exista muestra la página sin imagen en vez de romperla.
-- ---------------------------------------------------------------------------

create table if not exists public.topic_lessons (
  id         uuid primary key default gen_random_uuid(),
  -- Una lección por tema: si hiciera falta más, son páginas de la misma.
  topic_id   uuid not null unique references public.topics(id) on delete cascade,
  title      text not null,
  pages      jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),

  constraint pages_es_arreglo check (jsonb_typeof(pages) = 'array'),
  -- Una lección sin páginas no tiene nada que mostrar; que no exista es más
  -- honesto que un botón que abre una pantalla vacía.
  constraint pages_no_vacio check (jsonb_array_length(pages) > 0)
);

comment on table public.topic_lessons is
  'Lección ilustrada de un tema, en páginas. Se lee como un libro, antes o '
  'durante la actividad.';

alter table public.topic_lessons enable row level security;

-- Contenido curricular, igual que topics y subjects: lo lee cualquier
-- autenticado. Eso además la hace cacheable globalmente sin riesgo de filtrar
-- datos de nadie (ver la regla en lib/reference-data.ts).
drop policy if exists topic_lessons_select on public.topic_lessons;
create policy topic_lessons_select on public.topic_lessons
  for select using (true);

-- Escribir es de coordinación: es material del currículo, no de un salón.
drop policy if exists topic_lessons_write on public.topic_lessons;
create policy topic_lessons_write on public.topic_lessons
  for all using (public.is_coordinator()) with check (public.is_coordinator());
