# 05 — Módulos y Especificación Funcional

Cada panel tiene su propio layout con guard de autenticación por rol. Si el usuario no tiene el rol correcto, es redirigido al dashboard de su propio rol.

---

## Panel de Coordinación (`/coordinator`)

### Dashboard
- Contador de: alumnos activos, docentes, salones del año actual.
- Lista de los últimos 5 alumnos matriculados.
- Acceso rápido a: crear alumno, crear salón, gestionar año escolar.

### Gestión de Estudiantes (`/coordinator/students`)
- **Listar** todos los alumnos con: nombre, edad calculada (no almacenada), grado actual, sección, status.
- **Filtrar** por: grado, sección, status (active/withdrawn).
- **Crear alumno**: formulario con nombre completo, fecha de nacimiento, email (para Supabase Auth), contraseña inicial.
- **Editar alumno**: modificar nombre, fecha de nacimiento.
- **Desactivar/reactivar**: marca `profiles.is_active = false`. El alumno deja de poder acceder.
- **Retirar alumno**: cambia `enrollments.status = 'withdrawn'` y desactiva la cuenta. Los datos permanecen en el sistema como registro histórico.

### Ficha del Alumno (`/coordinator/students/[id]`)
- Información personal (nombre, edad, fecha de ingreso).
- Historial de salones por año escolar.
- Status actual de matrícula.
- Botones: promover, retener, retirar.

### Gestión de Salones (`/coordinator/classrooms`)
- **Listar** salones del año escolar activo con: grado, sección, docente asignado, cantidad de alumnos.
- **Crear salón**: seleccionar grado, sección, docente, año escolar.
- **Asignar alumnos** a un salón: búsqueda de alumnos sin salón en el año actual.
- **Ver detalle** del salón: lista de alumnos, docente, actividades.

### Gestión de Años Escolares (`/coordinator/school-years`)
- Listar años escolares con fechas y status (activo/inactivo).
- Crear nuevo año escolar.
- Marcar un año como activo (solo uno puede estar activo a la vez).
- El año activo determina qué salones y actividades son vigentes.

---

## Panel del Docente (`/teacher`)

### Dashboard
- Resumen de su salón: nombre del salón (ej: "3er Grado A"), número de alumnos.
- Actividades recientes: las últimas 3 actividades con porcentaje de completitud.
- Alumno del momento: el alumno con más XP en el salón esta semana.

### Mi Salón (`/teacher/classroom`)
- Lista de alumnos con: nombre, nivel actual, XP total, última actividad.
- Indicador visual de alumnos sin actividad en los últimos 7 días.
- Acceso a la ficha individual de cada alumno.

### Ficha del Alumno (`/teacher/students/[id]`)
- Información del alumno (nombre, nivel, XP).
- Historial de actividades completadas con puntaje obtenido.
- Evaluaciones presenciales registradas.
- Estadísticas de uso del agente IA.

### Actividades (`/teacher/activities`)
- **Listar** actividades del salón actual con status (borrador/activa/completada) y porcentaje de completitud.
- **Crear actividad** (`/teacher/activities/new`):
  1. Seleccionar plantilla de actividad.
  2. Seleccionar materia y tópico (del currículo venezolano, filtrado por grado del salón).
  3. Título de la actividad.
  4. Contexto adicional para el agente IA (campo de texto opcional).
  5. Fechas de disponibilidad (desde / hasta).
- **Ver detalle** de actividad: lista de alumnos con progreso y XP obtenido.
- **Activar/desactivar** actividad: cambia el status.

### Evaluaciones Presenciales (`/teacher/evaluations`)
- **Listar** evaluaciones registradas (filtradas por alumno, materia, fecha).
- **Registrar evaluación**:
  - Seleccionar alumno del salón.
  - Seleccionar materia.
  - Nota obtenida y nota máxima.
  - Fecha y observaciones.
- **Editar** evaluación existente.
- **Vista por alumno**: todas las evaluaciones de un alumno agrupadas por materia.

---

## Panel del Alumno (`/student`)

### Dashboard
- Saludo personalizado con nombre y nivel actual.
- Barra de progreso de XP hacia el siguiente nivel.
- Lista de actividades disponibles (activas y dentro del período).
- Actividad en progreso (si existe).
- Posición actual en el leaderboard del salón.

### Actividad (`/student/activities/[id]`)

El alumno navega por los pasos definidos en la plantilla:

1. Al entrar a una actividad por primera vez, se crea el registro en `activity_progress` con `current_step = 0`.
2. Cada paso se renderiza según su `type` definido en la plantilla:
   - `introduction`: contenido explicativo. El agente puede aparecer si `ai_enabled = true`.
   - `quiz`: preguntas de selección o respuesta corta. El agente puede dar pistas si `ai_enabled = true`.
   - `challenge`: ejercicio sin ayuda del agente (`ai_enabled = false`).
3. Al completar un paso, se llama la Edge Function `complete-step`.
4. Se muestra animación de XP ganado y actualización de nivel si corresponde.
5. Al completar el último paso, se muestra pantalla de logro con XP total y bonus de completitud (+25 XP).

**Interacción con el agente** (cuando `ai_enabled = true`):
- Ícono flotante del agente en la esquina de la pantalla.
- Contador de preguntas restantes visible (`X preguntas disponibles`).
- El agente responde solo sobre el tópico de la actividad.
- Si la pregunta es ajena al tema, el agente lo indica y no descuenta pregunta.
- Cuando se agotan las preguntas, el ícono se desactiva con mensaje explicativo.

### Leaderboard (`/student/leaderboard`)
- **Tab: Mi Salón** — ranking de todos los alumnos del salón, ordenado por XP.
- **Tab: Mi Grado** — ranking del tier correspondiente (bronce/plata/oro), top 15.
- **Tab: Institución** — ranking general de toda la institución, top 15 por tier.
- La posición del alumno actual siempre se resalta, aunque no esté en el top 15.
- Alumnos egresados aparecen con indicador `[Egresado]` mientras dure su snapshot.

---

## Componentes compartidos

| Componente | Descripción |
|---|---|
| `<RoleGuard>` | Redirige si el rol del usuario no coincide con la ruta |
| `<Navbar>` | Navegación adaptada al rol |
| `<XpBadge>` | Muestra nivel + XP del alumno |
| `<AgentBubble>` | Interfaz del agente IA (chat flotante) |
| `<LeaderboardRow>` | Fila del ranking con posición, nombre, XP, nivel |
| `<ActivityCard>` | Tarjeta de actividad con status y progreso |
| `<StepRenderer>` | Renderiza el paso actual según su `type` |

---

## Reglas de negocio críticas

1. Un alumno solo puede ver actividades de su salón actual con `status = 'active'` y dentro de las fechas.
2. Un alumno no puede retroceder a un paso ya completado.
3. El XP solo se otorga una vez por paso (el `unique` en `activity_progress` lo garantiza a nivel de DB).
4. El docente no puede modificar una actividad con `status = 'completed'`.
5. La coordinación puede cambiar el status de cualquier actividad en cualquier momento.
6. Un alumno retirado (`withdrawn`) pierde acceso inmediatamente pero sus datos históricos permanecen.
