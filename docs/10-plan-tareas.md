# 10 — Plan de Desarrollo y Tareas

**Duración:** 12 semanas | **Equipo:** 1 desarrollador | **Presupuesto:** $0

Marcar cada tarea con `[x]` al completarla. Al final de cada semana, verificar el entregable antes de continuar.

---

## Regla de corte (si el tiempo se agota)

Cortar en este orden, de menor a mayor impacto:
1. Fallback Groq en el agente
2. Snapshots de egresados en leaderboard
3. Estadísticas avanzadas del docente
4. Evaluación presencial
5. Agente de IA completo (el sistema funciona sin él)

El núcleo no negociable: **Semanas 1-6 + Semana 9 + Semana 10**.

---

## Semana 1 — Fundación

**Entregable:** Login funcional que redirige a 3 dashboards vacíos según rol. Deploy en Vercel funcionando.

### Setup del proyecto
- [ ] Crear repositorio en GitHub
- [ ] Inicializar proyecto Next.js 14 con TypeScript: `npx create-next-app@latest app --typescript --tailwind --app`
- [ ] Instalar dependencias: `npm install @supabase/supabase-js @supabase/ssr shadcn-ui next-pwa`
- [ ] Inicializar shadcn/ui: `npx shadcn-ui@latest init`
- [ ] Configurar variables de entorno en `.env.local`
- [ ] Conectar repositorio a Vercel (deploy automático)

### Supabase
- [ ] Crear proyecto en supabase.com
- [ ] Aplicar schema completo de `docs/03-modelo-datos.md` en el SQL Editor
- [ ] Aplicar funciones helper de RLS de `docs/04-seguridad-roles.md`
- [ ] Aplicar todas las políticas RLS de `docs/04-seguridad-roles.md`
- [ ] Sembrar datos estáticos: grados (SQL en `docs/03-modelo-datos.md`)
- [ ] Sembrar plantillas de actividad (SQL en `docs/09-plantillas-actividad.md`)
- [ ] Crear año escolar inicial
- [ ] Crear cuenta de coordinación manualmente en Supabase Auth + insertar en `profiles`

### Autenticación y roles
- [ ] Configurar cliente Supabase con SSR (`@supabase/ssr`) para Next.js App Router
- [ ] Crear `middleware.ts` con protección de rutas por rol
- [ ] Implementar página de login (`/app/page.tsx` o `/app/(auth)/login/page.tsx`)
- [ ] Implementar redirección post-login según `profiles.role`
- [ ] Crear layouts vacíos para: `/coordinator`, `/teacher`, `/student`
- [ ] Verificar que un usuario sin sesión es redirigido a login

### PWA
- [ ] Configurar `next-pwa` en `next.config.js`
- [ ] Crear `public/manifest.json` con nombre, íconos y colores
- [ ] Crear íconos PNG en 192x192 y 512x512
- [ ] Verificar que Chrome en Android muestra el banner de instalación

---

## Semana 2 — Panel de Coordinación

**Entregable:** La coordinadora puede crear alumnos, asignarlos a un salón con docente y ver su edad calculada automáticamente.

### Gestión de estudiantes
- [ ] Página listado de alumnos con: nombre, edad calculada, grado, sección, status
- [ ] Filtros: por grado, sección, status (active/withdrawn)
- [ ] Formulario crear alumno: nombre, fecha de nacimiento, email, contraseña inicial
  - [ ] Crear usuario en Supabase Auth
  - [ ] Insertar en `profiles` con `role = 'student'`
  - [ ] Insertar en `students` con `birth_date`
- [ ] Editar alumno: modificar nombre y fecha de nacimiento
- [ ] Desactivar/reactivar alumno: toggle `profiles.is_active`
- [ ] Retirar alumno: cambiar `enrollments.status = 'withdrawn'` + desactivar cuenta

### Gestión de salones
- [ ] Página listado de salones del año activo: grado, sección, docente, cantidad de alumnos
- [ ] Formulario crear salón: seleccionar grado, sección, docente
- [ ] Asignar alumnos a salón: búsqueda de alumnos sin salón en el año activo
- [ ] Vista detalle del salón: lista de alumnos con botón para ir a la ficha

### Gestión de docentes
- [ ] Formulario crear docente: nombre, email, contraseña inicial
  - [ ] Crear en Supabase Auth
  - [ ] Insertar en `profiles` con `role = 'teacher'`
- [ ] Listar docentes con salón asignado (si tiene uno en el año activo)

### Año escolar
- [ ] Mostrar año escolar activo en el dashboard
- [ ] Formulario crear nuevo año escolar (nombre, fechas inicio/fin)
- [ ] Botón para activar un año escolar (desactiva el anterior)

---

## Semana 3 — Panel del Docente

**Entregable:** Docente ve su salón con lista de alumnos y puede registrar una evaluación presencial.

### Dashboard del docente
- [ ] Mostrar nombre del salón (ej: "3er Grado A — 2025-2026")
- [ ] Contador de alumnos activos en el salón
- [ ] Lista de últimas 3 actividades con porcentaje de completitud
- [ ] Indicador de alumnos sin actividad en 7 días

### Vista del salón
- [ ] Lista de alumnos con: nombre, nivel, XP, última actividad completada
- [ ] Indicador visual (color) para alumnos inactivos > 7 días
- [ ] Enlace a ficha individual de cada alumno

### Ficha del alumno (vista docente)
- [ ] Información básica: nombre, nivel, XP total
- [ ] Historial de actividades completadas con XP obtenido por cada una
- [ ] Sección de evaluaciones presenciales del alumno
- [ ] Botón: promover alumno (cambia `enrollments.status = 'promoted'`)

### Evaluaciones presenciales
- [ ] Página listado de evaluaciones del salón (filtrable por alumno y materia)
- [ ] Formulario registrar evaluación: seleccionar alumno, materia, nota, nota máxima, fecha, observaciones
- [ ] Editar evaluación existente
- [ ] Vista resumen: promedio por alumno y por materia

---

## Semana 4 — Sistema de Actividades (end-to-end)

**Entregable:** Alumno completa un paso de una actividad y su XP sube en la base de datos.

### Creación de actividades (docente)
- [ ] Página listado de actividades del salón con status y % completitud
- [ ] Formulario crear actividad:
  - [ ] Selección de plantilla (muestra nombre, descripción y número de pasos)
  - [ ] Selección de materia (filtrada por grado del salón)
  - [ ] Selección de tópico (filtrado por materia seleccionada)
  - [ ] Título de la actividad
  - [ ] Campo de contexto para el agente IA (opcional)
  - [ ] Fechas de disponibilidad (desde / hasta)
- [ ] Botón activar/desactivar actividad (cambia `status`)
- [ ] Vista detalle de actividad: progreso por alumno

### Edge Functions — deploy inicial
- [ ] Instalar Supabase CLI
- [ ] Crear función `complete-step` (código en `docs/06-edge-functions.md`)
- [ ] Crear función `ask-agent` (código en `docs/06-edge-functions.md`)
- [ ] Configurar secrets en Supabase: `GEMINI_API_KEY`, `GROQ_API_KEY`
- [ ] Deploy de ambas funciones
- [ ] Probar `complete-step` con Postman o curl antes de integrarlo al frontend

### Flujo del alumno — actividad
- [ ] Página listado de actividades disponibles del alumno (activas + dentro del período)
- [ ] Al entrar a una actividad: crear `activity_progress` si no existe
- [ ] Renderizar paso actual según `type` de la plantilla:
  - [ ] `introduction`: mostrar `description` del paso con área de contenido
  - [ ] `quiz`: mostrar preguntas (para la semana 4, pueden ser placeholder)
  - [ ] `challenge`: mostrar enunciado sin ícono de agente
- [ ] Botón "Completar paso" que llama `complete-step`
- [ ] Mostrar XP ganado al completar (+animación básica de número)
- [ ] Avanzar automáticamente al siguiente paso

---

## Semana 5 — Experiencia del Estudiante

**Entregable:** Un niño puede sentarse, completar una actividad y ver su XP subir con animación.

### Dashboard del alumno
- [ ] Saludo personalizado con nombre y nivel
- [ ] Barra de progreso de XP hacia el siguiente nivel (fórmula de `docs/08-gamificacion.md`)
- [ ] Lista de actividades disponibles con status (no iniciada / en progreso / completada)
- [ ] Indicador de actividad en progreso (si existe)

### UI de actividad mejorada
- [ ] Diseño mobile-first para la vista de actividad (pantalla completa, sin sidebar)
- [ ] Indicador de pasos: "Paso 2 de 3"
- [ ] Barra de progreso de la actividad
- [ ] Animación de XP ganado al completar paso (número flotante +35 XP)
- [ ] Modal de celebración al subir de nivel
- [ ] Pantalla de logro al completar actividad completa (XP total + bonus)

### Tipos de paso — implementación completa
- [ ] `quiz`: renderizar preguntas de opción múltiple con validación de respuesta
  - La pregunta y opciones las define el docente en `activities.ai_context` o en el futuro en una tabla separada. Por ahora: el docente escribe el quiz en el campo `ai_context` como texto estructurado.
- [ ] `challenge`: mismo que quiz pero sin ícono del agente

### Navbar del alumno
- [ ] Ícono de nivel y XP siempre visible
- [ ] Navegación: Inicio, Actividades, Leaderboard

---

## Semana 6 — Leaderboard

**Entregable:** Los 3 niveles de leaderboard funcionan con datos reales. Alumno egresado permanece en snapshot.

### Queries de leaderboard
- [ ] Implementar query de leaderboard del salón (ver `docs/08-gamificacion.md`)
- [ ] Implementar query de leaderboard por tier (bronce/plata/oro)
- [ ] Implementar query de leaderboard de institución (top 15 por tier)
- [ ] Combinar resultados activos + snapshots de egresados

### UI del leaderboard (alumno)
- [ ] Tabs: Mi Salón / Mi Grado / Institución
- [ ] Fila del leaderboard: posición, nombre, nivel, XP
- [ ] Resaltar la fila del alumno actual (aunque no esté en top 15)
- [ ] Etiqueta `[Egresado]` para alumnos de `leaderboard_snapshots`
- [ ] Indicadores de tier: ícono/color de bronce, plata, oro

### Snapshots de egresados
- [ ] Al retirar un alumno (en Panel Coordinación), crear `leaderboard_snapshot`
- [ ] Calcular `expires_at = end_date del año escolar + 2 años`
- [ ] Funcionalidad manual de limpieza de snapshots expirados (botón en panel coordinación)

### Leaderboard en panel del docente
- [ ] Sección en dashboard del docente: top 3 del salón resaltado
- [ ] Enlace al leaderboard completo del salón

---

## Semana 7 — Agente de IA

**Entregable:** Alumno en un paso con `ai_enabled = true` puede hacer 2 preguntas al agente y recibe respuesta contextualizada.

### Integración del agente
- [ ] Verificar que el deploy de `ask-agent` funciona correctamente con curl
- [ ] Obtener y configurar `GEMINI_API_KEY` en Supabase Secrets
- [ ] Obtener y configurar `GROQ_API_KEY` en Supabase Secrets (fallback)
- [ ] Probar el prompt con temas del currículo venezolano (matemáticas, lengua)

### UI del agente (componente `<AgentBubble>`)
- [ ] Ícono flotante del agente visible solo cuando `ai_enabled = true`
- [ ] Contador de preguntas restantes visible en el ícono
- [ ] Modal/drawer de chat al hacer tap en el ícono
- [ ] Campo de entrada de texto + botón enviar
- [ ] Respuesta del agente con indicador de carga (spinner)
- [ ] Mensaje cuando se agotan las preguntas
- [ ] Ícono desactivado visualmente cuando `questions_remaining = 0`

### Inicialización de ai_interactions
- [ ] Al entrar a un paso con `ai_enabled = true`, hacer upsert en `ai_interactions`
- [ ] Mostrar preguntas restantes correctas desde el inicio

### Testing del agente
- [ ] Verificar que el agente responde en contexto (tema correcto)
- [ ] Verificar que rechaza preguntas fuera del tema con el mensaje estándar
- [ ] Verificar que el contador decrementa correctamente
- [ ] Verificar que el fallback a Groq funciona (simular error de Gemini)

---

## Semana 8 — Estadísticas del Docente

**Entregable:** Docente ve qué alumnos completaron cada actividad y cuánto XP obtuvo cada uno.

### Panel de estadísticas por actividad
- [ ] En la vista detalle de actividad: tabla con todos los alumnos del salón
  - Columnas: nombre, status (no iniciada/en progreso/completada), XP obtenido, paso actual
- [ ] Indicador de porcentaje de completitud de la actividad

### Panel de estadísticas por alumno
- [ ] Ficha del alumno: gráfico simple de XP acumulado (últimas 5 actividades)
- [ ] Lista de actividades con: nombre, XP obtenido, fecha de completitud
- [ ] Promedio de XP por actividad del alumno vs promedio del salón

### Dashboard mejorado del docente
- [ ] Widget: alumnos sin actividad en los últimos 7 días (lista con nombre)
- [ ] Widget: actividad con menor tasa de completitud del salón
- [ ] Widget: alumno con mayor XP de la semana

---

## Semana 9 — PWA y Testing Mobile

**Entregable:** La app se instala en Android y todos los flujos funcionan en pantalla de 375px.

### Testing en dispositivos Android
- [ ] Instalar la app como PWA en al menos un dispositivo Android físico
- [ ] Verificar que el splash screen aparece al abrir
- [ ] Verificar que la app se abre en modo standalone (sin barra del browser)
- [ ] Verificar que el manifest permite instalación desde Chrome

### Responsive — revisión completa
- [ ] Login: funciona en 375px
- [ ] Dashboard alumno: funciona en 375px
- [ ] Vista de actividad + pasos: funciona en 375px
- [ ] AgentBubble: no tapa contenido importante en pantallas pequeñas
- [ ] Leaderboard: scroll horizontal si la tabla es muy ancha
- [ ] Formularios del coordinador: usables en mobile (aunque no es el uso principal)
- [ ] Formularios del docente: usables en mobile

### Offline handling
- [ ] Página de error de red con mensaje claro ("Revisa tu conexión a internet")
- [ ] La app no muestra pantalla blanca en negro sin conexión
- [ ] Los assets estáticos (íconos, fuentes) cargan desde caché

### Accesibilidad básica
- [ ] Textos legibles (mínimo 16px en mobile)
- [ ] Botones con área de tap suficiente (mínimo 44x44px)
- [ ] Contraste de colores adecuado para texto principal

---

## Semana 10 — Testing de Integración

**Entregable:** Todos los flujos críticos pasan sin errores con datos reales.

### Flujos a probar (end-to-end)

- [ ] **Flujo 1:** Coordinadora crea alumno → asigna a salón → alumno puede hacer login
- [ ] **Flujo 2:** Docente crea actividad → alumno la ve disponible en su dashboard
- [ ] **Flujo 3:** Alumno completa actividad (3 pasos) → XP se acredita → leaderboard se actualiza
- [ ] **Flujo 4:** Alumno pregunta al agente → contador decrece → se bloquea al llegar a 0
- [ ] **Flujo 5:** Coordinadora retira alumno → pierde acceso → aparece en leaderboard como egresado
- [ ] **Flujo 6:** Docente registra evaluación presencial → aparece en ficha del alumno → no afecta XP
- [ ] **Flujo 7:** Coordinadora crea nuevo año escolar → salones del año anterior no aparecen como activos
- [ ] **Flujo 8:** Alumno intenta acceder a ruta de coordinación → es redirigido a su dashboard

### Pruebas de seguridad RLS
- [ ] Alumno A no puede ver datos del alumno B (verificar en Supabase con JWT del alumno A)
- [ ] Docente no puede ver actividades de otro salón
- [ ] Alumno no puede modificar `student_points` directamente (request rechazado con 403)
- [ ] Alumno no puede completar un paso ya completado (Edge Function rechaza)

### Pruebas de edge cases
- [ ] ¿Qué pasa si el alumno recarga la página a mitad de una actividad? (debe retomar desde el paso actual)
- [ ] ¿Qué pasa si la actividad vence mientras el alumno está en medio de ella?
- [ ] ¿Qué pasa si Gemini está caído? (fallback a Groq)

---

## Semana 11 — Correcciones y Datos Demo

**Entregable:** Sistema estable con datos de demostración completos para la defensa.

### Corrección de bugs
- [ ] Corregir todos los issues encontrados en semana 10
- [ ] Revisar logs de Vercel y Supabase por errores recurrentes
- [ ] Optimizar queries lentas (especialmente leaderboard en institución)

### Datos de demostración
- [ ] Crear 20 alumnos distribuidos en 3 salones (2 grados diferentes)
- [ ] Crear 2 docentes con sus salones asignados
- [ ] Crear 6 actividades (2 por plantilla) con actividades ya completadas
- [ ] Simular XP variado para tener un leaderboard con datos reales
- [ ] Crear 3 evaluaciones presenciales de ejemplo
- [ ] Crear 1 alumno "egresado" con snapshot en el leaderboard

### Pulido final
- [ ] Revisar todos los mensajes de error (deben ser comprensibles para un niño)
- [ ] Revisar todos los textos de la UI (ortografía, coherencia)
- [ ] Verificar que el flujo de demo es fluido sin pasos manuales intermedios

---

## Semana 12 — Defensa

**Entregable:** Presentación exitosa del TEG.

### Preparación técnica
- [ ] Deploy final en Vercel con dominio limpio (el subdominio de Vercel está bien)
- [ ] Verificar que las Edge Functions están desplegadas y funcionando en producción
- [ ] Verificar que los datos de demo están cargados en producción
- [ ] Preparar dispositivo Android con la PWA instalada para la demo en vivo

### Preparación académica
- [ ] Capítulo de implementación del TEG: stack, decisiones, Edge Functions, RLS
- [ ] Capítulo de marco teórico: citar Ebbinghaus, Skinner, Kapp (no "como Duolingo")
- [ ] Preparar respuestas para preguntas del jurado:
  - [ ] ¿Por qué Supabase y no Firebase? (límites de lectura de Firestore)
  - [ ] ¿Por qué Next.js? (API routes + SSR + Vercel integration)
  - [ ] ¿Cómo garantizan la seguridad de datos de menores? (RLS + LOPNNA)
  - [ ] ¿Qué pasaría con 5,000 usuarios? (Supabase Pro tier, misma arquitectura)
  - [ ] ¿El agente está "entrenado"? (prompt engineering con contexto dinámico — ser honesto)
  - [ ] ¿Qué metodología pedagógica usa? (Ebbinghaus SRS + Variable Ratio Reinforcement)

### Demo en vivo (guión)
1. Login como coordinadora → crear alumno en tiempo real → asignar a salón
2. Login como docente → crear actividad → mostrar plantillas disponibles
3. Login como alumno → completar actividad (mostrar XP subir) → consultar al agente
4. Mostrar leaderboard actualizado
5. Mostrar panel de estadísticas del docente

---

## Progreso general

```
Sem 1  [ ] Fundación + Auth + PWA
Sem 2  [ ] Panel Coordinación
Sem 3  [ ] Panel Docente + Evaluaciones
Sem 4  [ ] Actividades end-to-end          ← Hito 1
Sem 5  [ ] UX Alumno + Gamificación
Sem 6  [ ] Leaderboard completo
Sem 7  [ ] Agente de IA                    ← Hito 2
Sem 8  [ ] Estadísticas Docente
Sem 9  [ ] PWA + Mobile testing
Sem 10 [ ] Testing integración             ← Hito 3
Sem 11 [ ] Correcciones + Demo data
Sem 12 [ ] Defensa                         ← Entrega final
```
