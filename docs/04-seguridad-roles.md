# 04 — Seguridad y Roles

## Roles del sistema

| Rol | Descripción | Quién lo asigna |
|---|---|---|
| `coordinator` | Administra toda la institución | El desarrollador (setup inicial) |
| `teacher` | Gestiona su salón y crea actividades | Coordinación |
| `student` | Cursa actividades y consulta al agente | Coordinación |

El rol se almacena en `profiles.role`. Supabase Auth maneja la sesión (JWT). El rol viaja en el JWT via el campo `app_metadata` para evitar consultas adicionales en cada request.

## Funciones helper de RLS

Aplicar en el SQL Editor de Supabase **antes** de crear las políticas:

```sql
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
```

## Políticas RLS por tabla

Habilitar RLS en todas las tablas:
```sql
alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.school_years enable row level security;
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
```

### profiles

```sql
create policy "profiles_select" on public.profiles for select to authenticated using (
  id = auth.uid()
  or is_coordinator()
  or (is_teacher() and exists(
    select 1 from public.enrollments e
    join public.classrooms c on c.id = e.classroom_id
    where e.student_id = profiles.id and c.teacher_id = auth.uid() and e.status = 'active'
  ))
);
create policy "profiles_insert" on public.profiles for insert to authenticated
  with check (is_coordinator());
create policy "profiles_update" on public.profiles for update to authenticated
  using (id = auth.uid() or is_coordinator());
create policy "profiles_delete" on public.profiles for delete to authenticated
  using (is_coordinator());
```

### students

```sql
create policy "students_select" on public.students for select to authenticated using (
  id = auth.uid()
  or is_coordinator()
  or (is_teacher() and exists(
    select 1 from public.enrollments e
    join public.classrooms c on c.id = e.classroom_id
    where e.student_id = students.id and c.teacher_id = auth.uid() and e.status = 'active'
  ))
);
create policy "students_insert" on public.students for insert to authenticated
  with check (is_coordinator());
create policy "students_update" on public.students for update to authenticated
  using (is_coordinator());
```

### school_years y grades

```sql
create policy "school_years_select" on public.school_years for select to authenticated using (true);
create policy "school_years_write" on public.school_years for all to authenticated
  using (is_coordinator()) with check (is_coordinator());

create policy "grades_select" on public.grades for select to authenticated using (true);
```

### classrooms

```sql
create policy "classrooms_select" on public.classrooms for select to authenticated using (
  is_coordinator()
  or teacher_id = auth.uid()
  or id = my_classroom_id()
);
create policy "classrooms_write" on public.classrooms for all to authenticated
  using (is_coordinator()) with check (is_coordinator());
```

### enrollments

```sql
create policy "enrollments_select" on public.enrollments for select to authenticated using (
  is_coordinator()
  or (is_teacher() and owns_classroom(classroom_id))
  or student_id = auth.uid()
);
create policy "enrollments_write" on public.enrollments for all to authenticated
  using (is_coordinator()) with check (is_coordinator());
```

### subjects y topics (currículo estático)

```sql
create policy "subjects_select" on public.subjects for select to authenticated using (true);
create policy "topics_select" on public.topics for select to authenticated using (true);
create policy "templates_select" on public.activity_templates for select to authenticated using (true);
```

### activities

```sql
create policy "activities_select" on public.activities for select to authenticated using (
  is_coordinator()
  or owns_classroom(classroom_id)
  or (
    is_student()
    and classroom_id = my_classroom_id()
    and status = 'active'
    and (available_from is null or available_from <= now())
    and (available_until is null or available_until >= now())
  )
);
create policy "activities_insert" on public.activities for insert to authenticated
  with check (is_coordinator() or owns_classroom(classroom_id));
create policy "activities_update" on public.activities for update to authenticated
  using (is_coordinator() or owns_classroom(classroom_id));
create policy "activities_delete" on public.activities for delete to authenticated
  using (is_coordinator() or (owns_classroom(classroom_id) and status = 'draft'));
```

### activity_progress

```sql
create policy "progress_select" on public.activity_progress for select to authenticated using (
  is_coordinator()
  or (is_teacher() and exists(
    select 1 from public.activities a where a.id = activity_id and owns_classroom(a.classroom_id)
  ))
  or student_id = auth.uid()
);
create policy "progress_insert" on public.activity_progress for insert to authenticated
  with check (student_id = auth.uid());
create policy "progress_update" on public.activity_progress for update to authenticated
  using (student_id = auth.uid());
```

### ai_interactions

```sql
create policy "ai_select" on public.ai_interactions for select to authenticated using (
  is_coordinator()
  or (is_teacher() and exists(
    select 1 from public.activities a where a.id = activity_id and owns_classroom(a.classroom_id)
  ))
  or student_id = auth.uid()
);
create policy "ai_insert" on public.ai_interactions for insert to authenticated
  with check (student_id = auth.uid());
create policy "ai_update" on public.ai_interactions for update to authenticated
  using (student_id = auth.uid());
```

### student_points

```sql
-- Lectura pública para el leaderboard (todos los autenticados ven todos los puntos)
create policy "points_select" on public.student_points for select to authenticated using (true);
-- Escritura SOLO desde Edge Functions con service role (nunca desde el cliente)
create policy "points_write" on public.student_points for all to authenticated
  using (is_coordinator()) with check (is_coordinator());
```

### leaderboard_snapshots

```sql
create policy "snapshots_select" on public.leaderboard_snapshots for select to authenticated using (true);
create policy "snapshots_write" on public.leaderboard_snapshots for all to authenticated
  using (is_coordinator()) with check (is_coordinator());
```

### presential_evaluations

```sql
create policy "eval_select" on public.presential_evaluations for select to authenticated using (
  is_coordinator()
  or (is_teacher() and owns_classroom(classroom_id))
  or student_id = auth.uid()
);
create policy "eval_insert" on public.presential_evaluations for insert to authenticated
  with check (is_teacher() and owns_classroom(classroom_id));
create policy "eval_update" on public.presential_evaluations for update to authenticated
  using (is_coordinator() or (is_teacher() and owns_classroom(classroom_id)));
```

## Tabla resumen de permisos

| Tabla | Coordinador | Docente | Alumno |
|---|---|---|---|
| profiles | CRUD todo | R (su salón) | R/U propio |
| students | CRUD todo | R (su salón) | R propio |
| school_years | CRUD | R | R |
| classrooms | CRUD | R (propios) | R (el suyo) |
| enrollments | CRUD | R (su salón) | R propio |
| subjects / topics | CRUD | R | R |
| activity_templates | R | R | R |
| activities | CRUD | CRUD (su salón) | R (activas) |
| activity_progress | R | R (su salón) | CRUD propio |
| ai_interactions | R | R (su salón) | CRU propio |
| student_points | CRUD | R | R |
| leaderboard_snapshots | CRUD | R | R |
| presential_evaluations | CRUD | CRU (su salón) | R propio |

## Regla crítica de seguridad

`student_points` **nunca** es modificable por el cliente directamente. Solo lo escribe la Edge Function `complete-step` usando el `SUPABASE_SERVICE_ROLE_KEY`, que bypasea RLS. Esto previene que un alumno manipule su XP desde el browser o con herramientas como Postman.

---

## Batería de pruebas de seguridad a nivel de datos

`tests/e2e/seguridad/` — se corre con `npm run test:seguridad`.

**No abre navegador.** Ataca la API REST con el token de cada rol, que es el
camino de quien se salta la interfaz: un alumno con la consola del navegador
tiene su propio JWT y puede consultar Supabase directamente. Si la protección
viviera en el código de las páginas, no protegería nada.

Escenario provisionado (idempotente, cuentas con nombre `QA …`): dos docentes
con salones de grados distintos y un alumno en cada uno. Con un solo docente no
se puede demostrar aislamiento, porque el aislamiento es que A no vea lo de B.

**Cómo se leen los resultados.** Con RLS, "prohibido" casi nunca es un 403: al
leer, las filas ajenas simplemente no existen para ti, así que llega un 200 con
lista vacía. Por eso las pruebas afirman sobre el CONTENIDO, no sobre el código
de estado. Un 200 con datos ajenos es la falla.

Estas pruebas escriben en la base real —RLS solo se comprueba contra el Postgres
de verdad— así que hay `npm run test:limpiar` para dejarla como estaba.

### Lo que encontró en la primera corrida

**1. Escalada de privilegios (CRÍTICO, corregido).** Cualquier usuario podía
hacerse coordinador con un `PATCH /profiles?id=eq.<su-id>` y
`{"role":"coordinator"}`. Desde ahí `is_coordinator()` devuelve true y se abre
todo: los datos personales de los demás niños, todos los salones, los años
escolares.

La causa: `profiles_update` tenía `using` pero **no `with check`**. Son cosas
distintas y hay que escribir las dos —`USING` decide qué filas existentes puedo
tocar; `WITH CHECK` decide en qué se pueden convertir— y sin la segunda, un
UPDATE que pasa la primera puede dejar la fila como quiera.

Corregido en `13_cierre_escalada_privilegios.sql`. La garantía real la da un
disparador y no el `with check`, porque una política no puede comparar el valor
nuevo contra el viejo: no tiene acceso a `OLD`, y lo que hay que detectar es que
`role` CAMBIÓ, no cuánto vale.

**2. Lecciones legibles sin sesión (menor, corregido).**
`topic_lessons_select` se creó como `for select using (true)`, sin
`to authenticated`. Una política sin rol aplica a todos, incluido `anon`, así
que cualquiera con la clave pública —que viaja en el HTML de cada página— podía
descargar el currículo completo. Corregido en la misma migración.

**3. Respuestas del quiz visibles al alumno (abierto).** El texto del quiz vive
en `activities.ai_context` con la opción correcta marcada con `*`. El alumno
necesita leer su actividad para resolverla, así que `activities_select` se la
concede entera, incluido ese campo: con su token puede leer todas las respuestas
antes de contestar.

Alcance: **no permite inflar la puntuación.** El XP se otorga por completar el
paso, no por acertar, así que no hay fraude en el marcador. Lo que se rompe es
la utilidad formativa del quiz.

No se corrige con una política, porque el campo mezcla dos audiencias: es el
contexto del tutor Y la fuente del quiz. Las dos salidas posibles están
anotadas en el comentario de la prueba. Mientras siga abierto, esa prueba falla
a propósito en cada corrida.
