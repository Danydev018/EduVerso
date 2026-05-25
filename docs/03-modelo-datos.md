# 03 — Modelo de Datos

El schema completo se aplica en el SQL Editor de Supabase en el orden indicado.

## Capa 1 — Usuarios

```sql
-- Extiende auth.users de Supabase Auth
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        text not null check (role in ('coordinator', 'teacher', 'student')),
  full_name   text not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Datos extendidos solo para alumnos
create table public.students (
  id           uuid primary key references public.profiles(id) on delete cascade,
  birth_date   date not null,
  enrolled_at  date not null default current_date
);
```

**Nota:** La edad NUNCA se almacena. Se calcula siempre:
```sql
select extract(year from age(birth_date))::int as edad from students;
```

## Capa 2 — Estructura Escolar

```sql
-- Año escolar (ej: "2025-2026")
create table public.school_years (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  start_date  date not null,
  end_date    date not null,
  is_current  boolean not null default false
);

-- Grados del 1 al 6 (sembrado estático)
create table public.grades (
  id    smallint primary key,  -- 1 al 6
  name  text not null,          -- "1er Grado", "2do Grado", etc.
  tier  text not null check (tier in ('bronze', 'silver', 'gold'))
  -- bronze: grados 1-2 | silver: grados 3-4 | gold: grados 5-6
);

-- Salón digital: combinación de año + grado + sección + docente
create table public.classrooms (
  id             uuid primary key default gen_random_uuid(),
  school_year_id uuid not null references public.school_years(id),
  grade_id       smallint not null references public.grades(id),
  section        text not null,  -- "A", "B", "C"
  teacher_id     uuid not null references public.profiles(id),
  created_at     timestamptz not null default now(),
  unique (school_year_id, grade_id, section)
);

-- Matrícula: historial completo del alumno en la institución
create table public.enrollments (
  id             uuid primary key default gen_random_uuid(),
  student_id     uuid not null references public.students(id),
  classroom_id   uuid not null references public.classrooms(id),
  school_year_id uuid not null references public.school_years(id),
  status         text not null default 'active'
                 check (status in ('active', 'promoted', 'retained', 'withdrawn')),
  enrolled_at    timestamptz not null default now(),
  unique (student_id, school_year_id)
);
```

**Regla de negocio clave:** `unique (student_id, school_year_id)` garantiza que un alumno pertenece a exactamente un salón por año escolar. El docente cambia el status a `promoted` para que la coordinación lo matricule en el grado siguiente el año próximo. Si queda en `retained`, la coordinación lo puede rematricular en el mismo grado.

## Capa 3 — Currículo (datos estáticos)

```sql
-- Materias por grado (sembrado una sola vez, no modificable por usuarios)
create table public.subjects (
  id       uuid primary key default gen_random_uuid(),
  grade_id smallint not null references public.grades(id),
  name     text not null  -- "Matemáticas", "Lenguaje y Literatura", etc.
);

-- Tópicos por materia (unidades del currículo venezolano)
create table public.topics (
  id          uuid primary key default gen_random_uuid(),
  subject_id  uuid not null references public.subjects(id),
  name        text not null,
  description text,
  order_index integer not null default 0
);
```

## Capa 4 — Actividades

```sql
-- Plantillas predefinidas por el desarrollador (no modificable por usuarios)
create table public.activity_templates (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  steps       jsonb not null  -- ver docs/09-plantillas-actividad.md para estructura
);

-- Actividades creadas por el docente a partir de una plantilla
create table public.activities (
  id              uuid primary key default gen_random_uuid(),
  classroom_id    uuid not null references public.classrooms(id),
  template_id     uuid not null references public.activity_templates(id),
  topic_id        uuid not null references public.topics(id),
  title           text not null,
  ai_context      text,  -- contexto adicional que el docente da al agente
  status          text not null default 'draft'
                  check (status in ('draft', 'active', 'completed')),
  available_from  timestamptz,
  available_until timestamptz,
  created_at      timestamptz not null default now()
);

-- Progreso del alumno en una actividad
create table public.activity_progress (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references public.students(id),
  activity_id  uuid not null references public.activities(id),
  current_step integer not null default 0,
  xp_earned    integer not null default 0,
  started_at   timestamptz not null default now(),
  completed_at timestamptz,
  unique (student_id, activity_id)
);

-- Control de interacciones con el agente IA por paso
create table public.ai_interactions (
  id              uuid primary key default gen_random_uuid(),
  student_id      uuid not null references public.students(id),
  activity_id     uuid not null references public.activities(id),
  step_index      integer not null,
  questions_used  integer not null default 0,
  questions_limit integer not null,
  created_at      timestamptz not null default now(),
  unique (student_id, activity_id, step_index)
);
```

## Capa 5 — Puntos y Leaderboard

```sql
-- XP acumulado por alumno por año escolar
create table public.student_points (
  id             uuid primary key default gen_random_uuid(),
  student_id     uuid not null references public.students(id),
  school_year_id uuid not null references public.school_years(id),
  classroom_id   uuid not null references public.classrooms(id),
  total_xp       integer not null default 0,
  level          integer not null default 1,
  updated_at     timestamptz not null default now(),
  unique (student_id, school_year_id)
);

-- Historial de alumnos egresados en el leaderboard (máx. 2 años escolares)
create table public.leaderboard_snapshots (
  id             uuid primary key default gen_random_uuid(),
  student_name   text not null,       -- desnormalizado (el perfil puede desactivarse)
  school_year_id uuid not null references public.school_years(id),
  grade_id       smallint not null references public.grades(id),
  section        text not null,
  total_xp       integer not null,
  expires_at     date not null        -- end_date del año escolar + 2 años
);
```

## Capa 6 — Evaluación Presencial

```sql
-- Registro de evaluaciones en el aula (NO afecta leaderboard ni XP)
create table public.presential_evaluations (
  id              uuid primary key default gen_random_uuid(),
  student_id      uuid not null references public.students(id),
  classroom_id    uuid not null references public.classrooms(id),
  teacher_id      uuid not null references public.profiles(id),
  subject_id      uuid not null references public.subjects(id),
  score           numeric(5,2) not null,
  max_score       numeric(5,2) not null default 20,
  evaluation_date date not null,
  notes           text,
  created_at      timestamptz not null default now()
);
```

## Stored Procedures

```sql
-- Actualización atómica de XP (llamado desde Edge Function complete-step)
create or replace function public.award_xp(
  p_student_id     uuid,
  p_school_year_id uuid,
  p_classroom_id   uuid,
  p_activity_id    uuid,
  p_step_index     integer,
  p_xp_amount      integer,
  p_is_complete    boolean
) returns jsonb as $$
declare
  v_new_xp    integer;
  v_new_level integer;
begin
  insert into student_points (student_id, school_year_id, classroom_id, total_xp, level)
  values (p_student_id, p_school_year_id, p_classroom_id, p_xp_amount, 1)
  on conflict (student_id, school_year_id)
  do update set
    total_xp   = student_points.total_xp + p_xp_amount,
    level      = greatest(1, floor(sqrt((student_points.total_xp + p_xp_amount)::numeric / 10))::int + 1),
    updated_at = now()
  returning total_xp, level into v_new_xp, v_new_level;

  update activity_progress set
    current_step = p_step_index + 1,
    xp_earned    = xp_earned + p_xp_amount,
    completed_at = case when p_is_complete then now() else null end
  where student_id = p_student_id and activity_id = p_activity_id;

  return jsonb_build_object('total_xp', v_new_xp, 'level', v_new_level, 'xp_earned', p_xp_amount);
end;
$$ language plpgsql security definer;

-- Incremento atómico de preguntas usadas (llamado desde Edge Function ask-agent)
create or replace function public.increment_questions_used(p_interaction_id uuid)
returns void as $$
  update public.ai_interactions
  set questions_used = questions_used + 1
  where id = p_interaction_id;
$$ language sql security definer;
```

## Datos de siembra (seed)

```sql
-- Grados con tiers
insert into grades (id, name, tier) values
  (1, '1er Grado', 'bronze'),
  (2, '2do Grado', 'bronze'),
  (3, '3er Grado', 'silver'),
  (4, '4to Grado', 'silver'),
  (5, '5to Grado', 'gold'),
  (6, '6to Grado', 'gold');

-- Año escolar inicial
insert into school_years (name, start_date, end_date, is_current) values
  ('2025-2026', '2025-09-16', '2026-07-15', true);
```

## Diagrama de relaciones clave

```
auth.users ──► profiles ──► students
                        ──► [teacher] classrooms ◄── school_years
                                                 ◄── grades
              students ──► enrollments ──► classrooms

              activities ──► activity_templates
                         ──► topics ──► subjects ──► grades
                         ──► classrooms

              activity_progress ──► activities
                                ──► students
              ai_interactions   ──► activity_progress

              student_points ──► students
                             ──► school_years
                             ──► classrooms
```
