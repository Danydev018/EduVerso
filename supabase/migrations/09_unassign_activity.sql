-- ---------------------------------------------------------------------------
-- Desasignar una actividad de un salón.
--
-- El docente se puede equivocar al asignar del repositorio, y hasta ahora no
-- había vuelta atrás: la política `activities_delete` solo permite borrar
-- borradores, y `activity_progress` no tiene política de DELETE, así que
-- cualquier actividad que un alumno hubiera abierto quedaba clavada por la
-- foreign key (ambas FK son NO ACTION).
--
-- La regla que fija esto: se puede quitar mientras NINGÚN alumno la haya
-- completado. Si alguien la terminó, esa nota ya es parte de su historial y
-- borrarla sería falsear el registro del salón.
--
-- Va como SECURITY DEFINER porque la operación necesita tocar tres tablas con
-- políticas distintas de forma atómica. El chequeo de permisos se hace acá
-- adentro de forma explícita, que es lo que la RLS haría por nosotros.
--
-- Sobre el XP: `student_points.total_xp` es un acumulado, no un registro de
-- eventos por actividad. Un alumno que avanzó algunos pasos sin terminar
-- conserva el XP que ya ganó; se pierde el avance dentro de la actividad, no
-- sus puntos. Es la salida correcta: el trabajo que hizo fue real.
-- ---------------------------------------------------------------------------

create or replace function public.unassign_activity(p_activity_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_classroom_id uuid;
  v_completados  int;
  v_descartados  int;
begin
  select classroom_id into v_classroom_id
  from activities
  where id = p_activity_id;

  if v_classroom_id is null then
    return jsonb_build_object('ok', false, 'error', 'La actividad ya no existe.');
  end if;

  -- Mismo criterio que activities_delete, sin la condición de borrador.
  if not (public.is_coordinator() or public.owns_classroom(v_classroom_id)) then
    return jsonb_build_object('ok', false, 'error', 'Esa actividad no es de tu salón.');
  end if;

  select count(*) into v_completados
  from activity_progress
  where activity_id = p_activity_id and completed_at is not null;

  if v_completados > 0 then
    return jsonb_build_object(
      'ok', false,
      'completados', v_completados,
      'error', format(
        '%s alumno%s ya la completó. No se puede quitar sin borrar su avance.',
        v_completados,
        case when v_completados = 1 then '' else 's' end
      )
    );
  end if;

  select count(*) into v_descartados
  from activity_progress
  where activity_id = p_activity_id;

  -- Las FK son NO ACTION, así que hay que limpiar en orden antes del borrado.
  delete from ai_interactions   where activity_id = p_activity_id;
  delete from activity_progress where activity_id = p_activity_id;
  delete from activities        where id = p_activity_id;

  return jsonb_build_object('ok', true, 'descartados', v_descartados);
end;
$$;

comment on function public.unassign_activity(uuid) is
  'Quita una actividad de un salón si ningún alumno la completó. Devuelve '
  '{ok, error?, descartados?} y borra en cascada manual el progreso parcial.';

revoke all on function public.unassign_activity(uuid) from public;
grant execute on function public.unassign_activity(uuid) to authenticated;
