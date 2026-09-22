-- ============================================================================
-- 05_leaderboard.sql — Funciones de leaderboard (Semana 6)
-- Aplicar DESPUÉS de 04_evaluation_categories.sql
--
-- Ver docs/08-gamificacion.md. profiles, enrollments y classrooms NO son de
-- lectura pública bajo RLS (solo student_points y leaderboard_snapshots lo
-- son) — un alumno no puede leer los perfiles/matrículas de sus compañeros
-- directamente. Estas funciones SECURITY DEFINER hacen el join necesario
-- para el leaderboard, con el mismo patrón que get_role()/owns_classroom()/
-- my_classroom_id() en 04-seguridad-roles.md.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Leaderboard del salón — solo alumnos matriculados activos en ese salón
--    y año escolar. Verifica autorización explícitamente porque, a
--    diferencia de my_classroom_id()/owns_classroom() (que solo devuelven
--    datos del propio caller), aquí el classroom_id es un parámetro
--    arbitrario que el cliente controla.
-- ----------------------------------------------------------------------------

create or replace function public.get_classroom_leaderboard(
  p_classroom_id uuid,
  p_school_year_id uuid
) returns table (
  student_id uuid,
  full_name text,
  total_xp integer,
  level integer
) as $$
begin
  -- coalesce(...) evita que una comparación NULL (auth.uid() sin sesión)
  -- deje pasar silenciosamente el chequeo: "IF NULL THEN" en plpgsql se
  -- comporta como false, no como true.
  if not coalesce(
    public.is_coordinator()
    or public.owns_classroom(p_classroom_id)
    or p_classroom_id = public.my_classroom_id(),
    false
  ) then
    raise exception 'No autorizado';
  end if;

  return query
    select p.id, p.full_name,
           coalesce(sp.total_xp, 0), coalesce(sp.level, 1)
    from public.enrollments e
    join public.profiles p on p.id = e.student_id
    left join public.student_points sp
      on sp.student_id = e.student_id and sp.school_year_id = p_school_year_id
    where e.classroom_id = p_classroom_id
      and e.school_year_id = p_school_year_id
      and e.status = 'active';
end;
$$ language plpgsql security definer stable;

-- ----------------------------------------------------------------------------
-- 2. Leaderboard por tier — combina alumnos activos de cualquier salón de
--    ese tier en el año dado con snapshots de egresados no expirados del
--    mismo tier. No requiere chequeo de autorización adicional: es un
--    ranking pensado para ser visible a cualquier usuario autenticado
--    (igual que student_points/leaderboard_snapshots ya lo son).
-- ----------------------------------------------------------------------------

create or replace function public.get_tier_leaderboard(
  p_tier text,
  p_school_year_id uuid
) returns table (
  id uuid,
  full_name text,
  total_xp integer,
  level integer,
  is_graduated boolean
) as $$
  select p.id, p.full_name, coalesce(sp.total_xp, 0), coalesce(sp.level, 1), false
  from public.enrollments e
  join public.classrooms c on c.id = e.classroom_id
  join public.grades g on g.id = c.grade_id
  join public.profiles p on p.id = e.student_id
  left join public.student_points sp
    on sp.student_id = e.student_id and sp.school_year_id = p_school_year_id
  where g.tier = p_tier
    and e.school_year_id = p_school_year_id
    and e.status = 'active'

  union all

  select ls.id, ls.student_name, ls.total_xp,
         greatest(1, floor(sqrt(ls.total_xp::numeric / 10))::int + 1), true
  from public.leaderboard_snapshots ls
  join public.grades g on g.id = ls.grade_id
  where g.tier = p_tier
    and ls.expires_at >= current_date;
$$ language sql security definer stable;

-- Postgres otorga EXECUTE a PUBLIC por defecto en CREATE FUNCTION. Los
-- leaderboards son "para todos los autenticados" (docs/04-seguridad-roles.md
-- usa "to authenticated" en las políticas de student_points/snapshots), no
-- público sin login — se revoca explícitamente el acceso anónimo.
revoke execute on function public.get_classroom_leaderboard(uuid, uuid) from public;
revoke execute on function public.get_tier_leaderboard(text, uuid) from public;
grant execute on function public.get_classroom_leaderboard(uuid, uuid) to authenticated;
grant execute on function public.get_tier_leaderboard(text, uuid) to authenticated;
