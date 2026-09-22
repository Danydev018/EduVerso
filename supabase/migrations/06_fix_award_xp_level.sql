-- ============================================================================
-- 06_fix_award_xp_level.sql — Corrige el cálculo de nivel en la primera
-- acreditación de XP del año (Semana 10, testing de integración)
-- Aplicar DESPUÉS de 05_leaderboard.sql
--
-- Bug: la rama INSERT de award_xp() (definida en 01_schema.sql) hardcodeaba
-- level=1 sin importar cuánto XP se otorgara en esa primera vez. Solo la
-- rama UPDATE (ON CONFLICT, en acreditaciones posteriores) calculaba el
-- nivel con la fórmula real. Un alumno cuyo primer paso completado en el
-- año ya otorgaba >=10 XP (la mayoría de los pasos) quedaba mostrado en
-- nivel 1 hasta su segunda acreditación de XP.
--
-- Encontrado ejecutando el flujo real complete-step con un alumno nuevo:
-- primer paso de 15 XP devolvía level=1 en vez de 2
-- (floor(sqrt(15/10))+1 = 2, ver docs/08-gamificacion.md).
-- ============================================================================

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
  values (
    p_student_id, p_school_year_id, p_classroom_id, p_xp_amount,
    greatest(1, floor(sqrt(p_xp_amount::numeric / 10))::int + 1)
  )
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
