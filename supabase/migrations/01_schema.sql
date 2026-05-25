-- ============================================================================
-- 01_schema.sql — Schema completo del proyecto
-- Aplicar en Supabase SQL Editor en orden: 01 → 02 → 03
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Capa 1: Usuarios
-- ----------------------------------------------------------------------------

create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        text not null check (role in ('coordinator', 'teacher', 'student')),
  full_name   text not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table public.students (
  id           uuid primary key references public.profiles(id) on delete cascade,
  birth_date   date not null,
  enrolled_at  date not null default current_date
);

-- ----------------------------------------------------------------------------
-- Capa 2: Estructura escolar
-- ----------------------------------------------------------------------------

create table public.school_years (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  start_date  date not null,
  end_date    date not null,
  is_current  boolean not null default false
);

-- Solo un año puede ser current a la vez
create unique index school_years_one_current
  on public.school_years (is_current) where is_current = true;

create table public.grades (
  id    smallint primary key,
  name  text not null,
  tier  text not null check (tier in ('bronze', 'silver', 'gold'))
);

create table public.classrooms (
  id             uuid primary key default gen_random_uuid(),
  school_year_id uuid not null references public.school_years(id),
  grade_id       smallint not null references public.grades(id),
  section        text not null,
  teacher_id     uuid not null references public.profiles(id),
  created_at     timestamptz not null default now(),
  unique (school_year_id, grade_id, section)
);

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

create index enrollments_classroom_idx on public.enrollments(classroom_id);
create index enrollments_student_idx on public.enrollments(student_id);

-- ----------------------------------------------------------------------------
-- Capa 3: Currículo (estático)
-- ----------------------------------------------------------------------------

create table public.subjects (
  id       uuid primary key default gen_random_uuid(),
  grade_id smallint not null references public.grades(id),
  name     text not null
);

create table public.topics (
  id          uuid primary key default gen_random_uuid(),
  subject_id  uuid not null references public.subjects(id),
  name        text not null,
  description text,
  order_index integer not null default 0
);

-- ----------------------------------------------------------------------------
-- Capa 4: Actividades
-- ----------------------------------------------------------------------------

create table public.activity_templates (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  steps       jsonb not null
);

create table public.activities (
  id              uuid primary key default gen_random_uuid(),
  classroom_id    uuid not null references public.classrooms(id),
  template_id     uuid not null references public.activity_templates(id),
  topic_id        uuid not null references public.topics(id),
  title           text not null,
  ai_context      text,
  status          text not null default 'draft'
                  check (status in ('draft', 'active', 'completed')),
  available_from  timestamptz,
  available_until timestamptz,
  created_at      timestamptz not null default now()
);

create index activities_classroom_idx on public.activities(classroom_id);

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

-- ----------------------------------------------------------------------------
-- Capa 5: Puntos y Leaderboard
-- ----------------------------------------------------------------------------

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

create index student_points_xp_idx
  on public.student_points (school_year_id, total_xp desc);

create table public.leaderboard_snapshots (
  id             uuid primary key default gen_random_uuid(),
  student_name   text not null,
  school_year_id uuid not null references public.school_years(id),
  grade_id       smallint not null references public.grades(id),
  section        text not null,
  total_xp       integer not null,
  expires_at     date not null
);

-- ----------------------------------------------------------------------------
-- Capa 6: Evaluación presencial
-- ----------------------------------------------------------------------------

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

-- ----------------------------------------------------------------------------
-- Stored procedures
-- ----------------------------------------------------------------------------

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
  insert into public.student_points (student_id, school_year_id, classroom_id, total_xp, level)
  values (p_student_id, p_school_year_id, p_classroom_id, p_xp_amount, 1)
  on conflict (student_id, school_year_id)
  do update set
    total_xp   = public.student_points.total_xp + p_xp_amount,
    level      = greatest(1, floor(sqrt((public.student_points.total_xp + p_xp_amount)::numeric / 10))::int + 1),
    updated_at = now()
  returning total_xp, level into v_new_xp, v_new_level;

  update public.activity_progress set
    current_step = p_step_index + 1,
    xp_earned    = xp_earned + p_xp_amount,
    completed_at = case when p_is_complete then now() else null end
  where student_id = p_student_id and activity_id = p_activity_id;

  return jsonb_build_object(
    'total_xp', v_new_xp,
    'level', v_new_level,
    'xp_earned', p_xp_amount
  );
end;
$$ language plpgsql security definer;

create or replace function public.increment_questions_used(p_interaction_id uuid)
returns void as $$
  update public.ai_interactions
  set questions_used = questions_used + 1
  where id = p_interaction_id;
$$ language sql security definer;
