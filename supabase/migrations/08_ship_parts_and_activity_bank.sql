-- ---------------------------------------------------------------------------
-- Piezas de la nave + repositorio de evaluaciones
--
-- Dos necesidades distintas que se resuelven juntas porque se cruzan:
--
-- 1. PIEZAS DE LA NAVE (ship_parts)
--    La narrativa del panel alumno ("Bitácora de la Aurora") dice que cada
--    misión completada repara una pieza de la nave. Hasta ahora eso era solo
--    texto: no había forma de saber QUÉ pieza reparaba cada actividad. Esta
--    tabla le da entidad a las piezas y `activities.ship_part_id` conecta
--    cada evaluación con la que repara.
--
-- 2. REPOSITORIO DE EVALUACIONES (activity_bank)
--    El docente no debería escribir cada evaluación desde cero. El banco
--    guarda evaluaciones ya armadas (tema + plantilla + preguntas + pieza
--    sugerida) que puede revisar y asignar a su salón con un click. Sigue
--    pudiendo crear la suya: el banco no reemplaza el flujo actual, lo
--    complementa.
--
--    Una entrada del banco NO es una actividad: no pertenece a ningún salón
--    ni tiene fechas ni progreso. Al asignarla se COPIA su contenido a una
--    fila de `activities`, de modo que si después el docente edita su
--    actividad, o si alguien corrige el banco, no se pisan entre sí.
-- ---------------------------------------------------------------------------

-- ── Piezas de la nave ──────────────────────────────────────────────────────
create table if not exists public.ship_parts (
  id          text primary key,          -- slug legible: 'motor', 'casco'
  name        text not null,             -- "Motor de salto"
  description text not null,             -- qué hace, en lenguaje de niño
  icon        text not null,             -- nombre de ícono de lucide-react
  color       text not null,             -- clase de color para la UI
  order_index int  not null
);

comment on table public.ship_parts is
  'Componentes de la nave del alumno. Cada actividad puede reparar uno.';

-- ── Repositorio de evaluaciones ────────────────────────────────────────────
create table if not exists public.activity_bank (
  id             uuid primary key default gen_random_uuid(),
  topic_id       uuid not null references public.topics(id) on delete cascade,
  template_id    uuid not null references public.activity_templates(id),
  ship_part_id   text references public.ship_parts(id),
  title          text not null,
  -- Mismo formato que activities.ai_context: texto con las preguntas de
  -- opción múltiple (ver lib/quiz.ts). Se copia tal cual al asignar.
  content        text,
  difficulty     text not null default 'media'
                 check (difficulty in ('facil', 'media', 'dificil')),
  -- NULL = evaluación del sistema. Si un docente publica la suya al banco,
  -- queda su id acá para saber de quién vino.
  created_by     uuid references public.profiles(id) on delete set null,
  created_at     timestamptz not null default now()
);

create index if not exists activity_bank_topic_idx on public.activity_bank(topic_id);

comment on table public.activity_bank is
  'Evaluaciones listas para asignar. No pertenecen a ningún salón: al '
  'asignarlas se copia su contenido a activities.';

-- ── Enlace de la actividad con la pieza que repara ─────────────────────────
alter table public.activities
  add column if not exists ship_part_id text references public.ship_parts(id);

-- Deja rastro de qué entrada del banco originó la actividad. Sirve para
-- estadísticas ("¿qué evaluaciones se usan más?") sin acoplar las dos filas:
-- borrar del banco no debe borrar actividades ya asignadas a un salón.
alter table public.activities
  add column if not exists source_bank_id uuid
    references public.activity_bank(id) on delete set null;

-- ── RLS ────────────────────────────────────────────────────────────────────
alter table public.ship_parts    enable row level security;
alter table public.activity_bank enable row level security;

-- Las piezas son catálogo público para cualquier autenticado, igual que
-- grades/subjects/topics. Esto además las hace cacheables globalmente
-- (ver lib/reference-data.ts).
drop policy if exists ship_parts_select on public.ship_parts;
create policy ship_parts_select on public.ship_parts
  for select using (true);

-- El banco lo leen docentes y coordinación. Un alumno no tiene por qué ver
-- el repositorio completo: vería las respuestas correctas de evaluaciones
-- que todavía no le asignaron.
drop policy if exists activity_bank_select on public.activity_bank;
create policy activity_bank_select on public.activity_bank
  for select using (public.is_teacher() or public.is_coordinator());

-- Un docente puede aportar sus propias evaluaciones al banco, y solo puede
-- tocar las suyas. Las del sistema (created_by null) las administra
-- coordinación.
drop policy if exists activity_bank_insert on public.activity_bank;
create policy activity_bank_insert on public.activity_bank
  for insert with check (
    public.is_coordinator()
    or (public.is_teacher() and created_by = auth.uid())
  );

drop policy if exists activity_bank_update on public.activity_bank;
create policy activity_bank_update on public.activity_bank
  for update using (
    public.is_coordinator()
    or (public.is_teacher() and created_by = auth.uid())
  );

drop policy if exists activity_bank_delete on public.activity_bank;
create policy activity_bank_delete on public.activity_bank
  for delete using (
    public.is_coordinator()
    or (public.is_teacher() and created_by = auth.uid())
  );

-- ── Catálogo de piezas ─────────────────────────────────────────────────────
-- Ocho piezas, elegidas para que un niño entienda de inmediato para qué
-- sirve cada una y para que haya suficiente variedad como para repartirlas
-- entre las materias sin repetir siempre la misma.
insert into public.ship_parts (id, name, description, icon, color, order_index) values
  ('motor',      'Motor de salto',     'Impulsa la nave para viajar de un planeta a otro.',      'Rocket',     'text-orange-500', 1),
  ('navegacion', 'Sistema de rumbo',   'Calcula la ruta y dice hacia dónde volar.',              'Compass',    'text-sky-500',    2),
  ('energia',    'Panel de energía',   'Guarda la energía estelar que alimenta toda la nave.',   'Zap',        'text-amber-500',  3),
  ('casco',      'Casco exterior',     'Protege la nave del frío y de los meteoritos.',          'Shield',     'text-slate-400',  4),
  ('soporte',    'Soporte vital',      'Mantiene el aire limpio y la temperatura agradable.',    'HeartPulse', 'text-rose-500',   5),
  ('antena',     'Antena de contacto', 'Permite hablar con casa y pedir ayuda.',                 'RadioTower', 'text-violet-500', 6),
  ('sensores',   'Sensores del suelo', 'Analizan el planeta: rocas, agua y seres vivos.',        'Radar',      'text-emerald-500',7),
  ('bodega',     'Bodega de carga',    'Ordena las provisiones que recoges en cada planeta.',    'Package',    'text-indigo-500', 8)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  icon = excluded.icon,
  color = excluded.color,
  order_index = excluded.order_index;
