-- progress_insert solo validaba student_id = auth.uid(), sin verificar que
-- la actividad perteneciera al salón del alumno. Un alumno podía insertar
-- una fila de activity_progress apuntando a una actividad de OTRO salón
-- (si conocía/adivinaba el UUID) que luego contaminaría las vistas de
-- progreso del docente dueño de esa actividad (progress_select permite a
-- un docente ver cualquier fila de activity_progress de sus propias
-- actividades, sin exigir que el alumno pertenezca a su salón).
-- No es una fuga de información hacia el alumno (complete-step/ask-agent
-- ya re-validan el salón vía RLS al leer "activities"), pero sí permitía
-- ensuciar datos de otro salón. Se corrige exigiendo que la actividad sea
-- del salón actual del alumno (misma función my_classroom_id() que usa
-- activities_select).

drop policy if exists progress_insert on public.activity_progress;

create policy progress_insert on public.activity_progress
  for insert
  with check (
    student_id = auth.uid()
    and exists (
      select 1 from public.activities a
      where a.id = activity_progress.activity_id
        and a.classroom_id = public.my_classroom_id()
    )
  );
