-- ============================================================================
-- 02_helpers_and_rls.sql — Funciones helper + políticas RLS
-- Aplicar DESPUÉS de 01_schema.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Funciones helper (usadas por las políticas RLS)
-- ----------------------------------------------------------------------------

create or replace function public.get_role()
returns text as $$
  select role from public.profiles where id = auth.uid();
$$ language sql security definer stable;

create or replace function public.is_coordinator()
returns boolean as $$
  select public.get_role() = 'coordinator';
$$ language sql security definer stable;

create or replace function public.is_teacher()
returns boolean as $$
  select public.get_role() = 'teacher';
$$ language sql security definer stable;

create or replace function public.is_student()
returns boolean as $$
  select public.get_role() = 'student';
$$ language sql security definer stable;

create or replace function public.owns_classroom(p_classroom_id uuid)
returns boolean as $$
  select exists(
    select 1 from public.classrooms
    where id = p_classroom_id and teacher_id = auth.uid()
  );
$$ language sql security definer stable;

create or replace function public.my_classroom_id()
returns uuid as $$
  select classroom_id from public.enrollments
  where student_id = auth.uid() and status = 'active'
  order by enrolled_at desc limit 1;
$$ language sql security definer stable;

-- ----------------------------------------------------------------------------
-- Habilitar RLS en todas las tablas
-- ----------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.school_years enable row level security;
alter table public.grades enable row level security;
alter table public.classrooms enable row level security;
alter table public.enrollments enable row level security;
alter table public.subjects enable row level security;
alter table public.topics enable row level security;
alter table public.activity_templates enable row level security;
alter table public.activities enable row level security;
alter table public.activity_progress enable row level security;
alter table public.ai_interactions enable row level security;
alter table public.student_points enable row level security;
alter table public.leaderboard_snapshots enable row level security;
alter table public.presential_evaluations enable row level security;

-- ----------------------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------------------

create policy "profiles_select" on public.profiles for select to authenticated using (
  id = auth.uid()
  or public.is_coordinator()
  or (public.is_teacher() and exists(
    select 1 from public.enrollments e
    join public.classrooms c on c.id = e.classroom_id
    where e.student_id = profiles.id and c.teacher_id = auth.uid() and e.status = 'active'
  ))
);

create policy "profiles_insert" on public.profiles for insert to authenticated
  with check (public.is_coordinator());

create policy "profiles_update" on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_coordinator());

create policy "profiles_delete" on public.profiles for delete to authenticated
  using (public.is_coordinator());

-- ----------------------------------------------------------------------------
-- students
-- ----------------------------------------------------------------------------

create policy "students_select" on public.students for select to authenticated using (
  id = auth.uid()
  or public.is_coordinator()
  or (public.is_teacher() and exists(
    select 1 from public.enrollments e
    join public.classrooms c on c.id = e.classroom_id
    where e.student_id = students.id and c.teacher_id = auth.uid() and e.status = 'active'
  ))
);

create policy "students_insert" on public.students for insert to authenticated
  with check (public.is_coordinator());

create policy "students_update" on public.students for update to authenticated
  using (public.is_coordinator());

-- ----------------------------------------------------------------------------
-- school_years y grades
-- ----------------------------------------------------------------------------

create policy "school_years_select" on public.school_years for select to authenticated using (true);
create policy "school_years_write" on public.school_years for all to authenticated
  using (public.is_coordinator()) with check (public.is_coordinator());

create policy "grades_select" on public.grades for select to authenticated using (true);

-- ----------------------------------------------------------------------------
-- classrooms
-- ----------------------------------------------------------------------------

create policy "classrooms_select" on public.classrooms for select to authenticated using (
  public.is_coordinator()
  or teacher_id = auth.uid()
  or id = public.my_classroom_id()
);

create policy "classrooms_write" on public.classrooms for all to authenticated
  using (public.is_coordinator()) with check (public.is_coordinator());

-- ----------------------------------------------------------------------------
-- enrollments
-- ----------------------------------------------------------------------------

create policy "enrollments_select" on public.enrollments for select to authenticated using (
  public.is_coordinator()
  or (public.is_teacher() and public.owns_classroom(classroom_id))
  or student_id = auth.uid()
);

create policy "enrollments_write" on public.enrollments for all to authenticated
  using (public.is_coordinator()) with check (public.is_coordinator());

-- ----------------------------------------------------------------------------
-- subjects, topics, activity_templates (lectura pública para autenticados)
-- ----------------------------------------------------------------------------

create policy "subjects_select" on public.subjects for select to authenticated using (true);
create policy "topics_select" on public.topics for select to authenticated using (true);
create policy "templates_select" on public.activity_templates for select to authenticated using (true);

-- ----------------------------------------------------------------------------
-- activities
-- ----------------------------------------------------------------------------

create policy "activities_select" on public.activities for select to authenticated using (
  public.is_coordinator()
  or public.owns_classroom(classroom_id)
  or (
    public.is_student()
    and classroom_id = public.my_classroom_id()
    and status = 'active'
    and (available_from is null or available_from <= now())
    and (available_until is null or available_until >= now())
  )
);

create policy "activities_insert" on public.activities for insert to authenticated
  with check (public.is_coordinator() or public.owns_classroom(classroom_id));

create policy "activities_update" on public.activities for update to authenticated
  using (public.is_coordinator() or public.owns_classroom(classroom_id));

create policy "activities_delete" on public.activities for delete to authenticated
  using (public.is_coordinator() or (public.owns_classroom(classroom_id) and status = 'draft'));

-- ----------------------------------------------------------------------------
-- activity_progress
-- ----------------------------------------------------------------------------

create policy "progress_select" on public.activity_progress for select to authenticated using (
  public.is_coordinator()
  or (public.is_teacher() and exists(
    select 1 from public.activities a where a.id = activity_id and public.owns_classroom(a.classroom_id)
  ))
  or student_id = auth.uid()
);

create policy "progress_insert" on public.activity_progress for insert to authenticated
  with check (student_id = auth.uid());

create policy "progress_update" on public.activity_progress for update to authenticated
  using (student_id = auth.uid());

-- ----------------------------------------------------------------------------
-- ai_interactions
-- ----------------------------------------------------------------------------

create policy "ai_select" on public.ai_interactions for select to authenticated using (
  public.is_coordinator()
  or (public.is_teacher() and exists(
    select 1 from public.activities a where a.id = activity_id and public.owns_classroom(a.classroom_id)
  ))
  or student_id = auth.uid()
);

create policy "ai_insert" on public.ai_interactions for insert to authenticated
  with check (student_id = auth.uid());

create policy "ai_update" on public.ai_interactions for update to authenticated
  using (student_id = auth.uid());

-- ----------------------------------------------------------------------------
-- student_points
-- (lectura pública para leaderboard; escritura solo coordinador o Edge Function con service_role)
-- ----------------------------------------------------------------------------

create policy "points_select" on public.student_points for select to authenticated using (true);
create policy "points_write" on public.student_points for all to authenticated
  using (public.is_coordinator()) with check (public.is_coordinator());

-- ----------------------------------------------------------------------------
-- leaderboard_snapshots
-- ----------------------------------------------------------------------------

create policy "snapshots_select" on public.leaderboard_snapshots for select to authenticated using (true);
create policy "snapshots_write" on public.leaderboard_snapshots for all to authenticated
  using (public.is_coordinator()) with check (public.is_coordinator());

-- ----------------------------------------------------------------------------
-- presential_evaluations
-- ----------------------------------------------------------------------------

create policy "eval_select" on public.presential_evaluations for select to authenticated using (
  public.is_coordinator()
  or (public.is_teacher() and public.owns_classroom(classroom_id))
  or student_id = auth.uid()
);

create policy "eval_insert" on public.presential_evaluations for insert to authenticated
  with check (public.is_teacher() and public.owns_classroom(classroom_id));

create policy "eval_update" on public.presential_evaluations for update to authenticated
  using (public.is_coordinator() or (public.is_teacher() and public.owns_classroom(classroom_id)));
