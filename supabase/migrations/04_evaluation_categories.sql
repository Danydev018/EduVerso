-- ============================================================================
-- 04_evaluation_categories.sql — Categorías de evaluación + migración de tabla
-- Aplicar DESPUÉS de 03_seed.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Crear tabla evaluation_categories
-- ----------------------------------------------------------------------------

create table public.evaluation_categories (
  id          uuid primary key default gen_random_uuid(),
  grade_id    smallint not null references public.grades(id),
  name        text not null,
  created_at  timestamptz not null default now(),
  unique (grade_id, name)
);

-- ----------------------------------------------------------------------------
-- 2. Habilitar RLS
-- ----------------------------------------------------------------------------

alter table public.evaluation_categories enable row level security;

-- ----------------------------------------------------------------------------
-- 3. Políticas RLS
-- ----------------------------------------------------------------------------

-- Lectura: todos los usuarios autenticados (necesario para que los docentes
-- vean las categorías de su grado)
create policy "eval_categories_select" on public.evaluation_categories
  for select to authenticated
  using (true);

-- Escritura: solo coordinador
create policy "eval_categories_write" on public.evaluation_categories
  for all to authenticated
  using (public.is_coordinator())
  with check (public.is_coordinator());

-- ----------------------------------------------------------------------------
-- 4. Migrar presential_evaluations: agregar category_id, relajar subject_id
-- ----------------------------------------------------------------------------

alter table public.presential_evaluations
  add column if not exists category_id uuid references public.evaluation_categories(id);

-- subject_id deja de ser obligatorio
alter table public.presential_evaluations
  alter column subject_id drop not null;

-- Actualizar política de inserción de presential_evaluations para reflejar
-- que ahora se usa category_id en vez de subject_id. La política existente
-- ya cubre el caso (solo verifica owns_classroom), pero agregamos una nueva
-- política más específica que reemplace a eval_insert.
drop policy if exists "eval_insert" on public.presential_evaluations;
create policy "eval_insert" on public.presential_evaluations
  for insert to authenticated
  with check (
    public.is_teacher()
    and public.owns_classroom(classroom_id)
  );

-- ----------------------------------------------------------------------------
-- 5. Datos semilla: categorías por defecto para todos los grados
-- ----------------------------------------------------------------------------

insert into public.evaluation_categories (grade_id, name) values
  (1, 'Matemáticas'), (1, 'Lenguaje y Literatura'),
  (1, 'Ciencias Sociales'), (1, 'Ciencias de la Naturaleza'),
  (2, 'Matemáticas'), (2, 'Lenguaje y Literatura'),
  (2, 'Ciencias Sociales'), (2, 'Ciencias de la Naturaleza'),
  (3, 'Matemáticas'), (3, 'Lenguaje y Literatura'),
  (3, 'Ciencias Sociales'), (3, 'Ciencias de la Naturaleza'),
  (4, 'Matemáticas'), (4, 'Lenguaje y Literatura'),
  (4, 'Ciencias Sociales'), (4, 'Ciencias de la Naturaleza'),
  (5, 'Matemáticas'), (5, 'Lenguaje y Literatura'),
  (5, 'Ciencias Sociales'), (5, 'Ciencias de la Naturaleza'),
  (6, 'Matemáticas'), (6, 'Lenguaje y Literatura'),
  (6, 'Ciencias Sociales'), (6, 'Ciencias de la Naturaleza')
on conflict (grade_id, name) do nothing;
