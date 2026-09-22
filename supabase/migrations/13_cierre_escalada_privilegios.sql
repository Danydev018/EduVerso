-- ---------------------------------------------------------------------------
-- 13_cierre_escalada_privilegios.sql
--
-- Cierra dos agujeros que encontró la batería de pruebas de seguridad
-- (tests/e2e/seguridad). Los dos eran reproducibles con el token normal de un
-- usuario, sin herramientas especiales: basta la consola del navegador.
--
-- ───────────────────────────────────────────────────────────────────────────
-- AGUJERO 1 (CRÍTICO): cualquiera podía hacerse coordinador
--
-- La política era:
--
--   create policy "profiles_update" on public.profiles for update
--     to authenticated using (id = auth.uid() or public.is_coordinator());
--
-- Le falta `with check`. En RLS de Postgres las dos cláusulas hacen cosas
-- distintas y hay que escribir las dos:
--
--   USING      → qué filas EXISTENTES puedo tocar
--   WITH CHECK → en qué se pueden CONVERTIR esas filas
--
-- Sin `with check`, un UPDATE que pasa el `using` puede dejar la fila como
-- quiera. Un alumno hacía `PATCH /profiles?id=eq.<su-id>` con
-- `{"role":"coordinator"}` y quedaba coordinador: a partir de ahí
-- `is_coordinator()` le devuelve true y se abre TODO — los datos personales de
-- los demás niños, todos los salones, los años escolares.
--
-- Por qué se arregla con un DISPARADOR y no con `with check`: la política no
-- puede comparar el valor nuevo contra el viejo, porque no tiene acceso a OLD.
-- Se necesita saber si `role` CAMBIÓ, no cuánto vale; y eso solo lo ve un
-- trigger. El `with check` se agrega igual, para que la política deje de estar
-- a medias, pero la garantía real la da el trigger.
--
-- ───────────────────────────────────────────────────────────────────────────
-- AGUJERO 2 (MENOR): las lecciones se leían sin iniciar sesión
--
-- `topic_lessons_select` se creó como `for select using (true)`, sin `to
-- authenticated`. Una política sin rol aplica a TODOS, incluido `anon`, así que
-- cualquiera con la clave pública —que viaja en el HTML de cada página— podía
-- descargar el currículo completo. No hay datos personales ahí, pero es
-- trabajo de la escuela y contradice que todo esté tras RLS.
-- ---------------------------------------------------------------------------

-- ── 1. Escalada de privilegios ─────────────────────────────────────────────

create or replace function public.profiles_bloquear_escalada()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Coordinación sí puede: crea el personal y activa o desactiva cuentas.
  if public.is_coordinator() then
    return new;
  end if;

  if new.role is distinct from old.role then
    raise exception 'No autorizado: cambiar el rol es potestad de coordinación'
      using errcode = '42501';
  end if;

  if new.is_active is distinct from old.is_active then
    raise exception 'No autorizado: activar o desactivar cuentas es potestad de coordinación'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

comment on function public.profiles_bloquear_escalada() is
  'Impide que un usuario se cambie el rol o se reactive a sí mismo. Ver 13_cierre_escalada_privilegios.sql';

drop trigger if exists profiles_bloquear_escalada on public.profiles;
create trigger profiles_bloquear_escalada
  before update on public.profiles
  for each row execute function public.profiles_bloquear_escalada();

-- La política, ahora completa. El `with check` por sí solo no bastaría —no
-- distingue un rol que cambió de uno que ya era ese— pero deja de estar
-- incompleta, y cubre el caso de que alguien retire el trigger.
drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_coordinator())
  with check (id = auth.uid() or public.is_coordinator());

-- ── 2. Lecciones solo para usuarios con sesión ─────────────────────────────

drop policy if exists topic_lessons_select on public.topic_lessons;
create policy topic_lessons_select on public.topic_lessons
  for select to authenticated using (true);
