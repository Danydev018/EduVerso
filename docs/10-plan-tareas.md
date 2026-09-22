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
- [x] Crear repositorio en GitHub
- [x] Inicializar proyecto Next.js 14 con TypeScript: `npx create-next-app@latest app --typescript --tailwind --app`
- [x] Instalar dependencias: `npm install @supabase/supabase-js @supabase/ssr shadcn-ui next-pwa`
- [x] Inicializar shadcn/ui: `npx shadcn-ui@latest init`
- [x] Configurar variables de entorno en `.env.local`
- [x] Conectar repositorio a Vercel (deploy automático)

### Supabase
- [x] Crear proyecto en supabase.com
- [x] Aplicar schema completo de `docs/03-modelo-datos.md` en el SQL Editor
- [x] Aplicar funciones helper de RLS de `docs/04-seguridad-roles.md`
- [x] Aplicar todas las políticas RLS de `docs/04-seguridad-roles.md`
- [x] Sembrar datos estáticos: grados (SQL en `docs/03-modelo-datos.md`)
- [x] Sembrar plantillas de actividad (SQL en `docs/09-plantillas-actividad.md`)
- [x] Crear año escolar inicial
- [x] Crear cuenta de coordinación manualmente en Supabase Auth + insertar en `profiles`

### Autenticación y roles
- [x] Configurar cliente Supabase con SSR (`@supabase/ssr`) para Next.js App Router
- [x] Crear `middleware.ts` con protección de rutas por rol
- [x] Implementar página de login (`/app/page.tsx` o `/app/(auth)/login/page.tsx`)
- [x] Implementar redirección post-login según `profiles.role`
- [x] Crear layouts vacíos para: `/coordinator`, `/teacher`, `/student`
- [x] Verificar que un usuario sin sesión es redirigido a login

### PWA
- [x] Configurar `next-pwa` en `next.config.js`
- [x] Crear `public/manifest.json` con nombre, íconos y colores
- [ ] Crear íconos PNG reales en 192x192 y 512x512 (actualmente placeholders — falta diseñar)
- [ ] Verificar que Chrome en Android muestra el banner automático de instalación (requiere íconos reales; por ahora se instala manualmente vía menú ⋮ → "Agregar a pantalla de inicio")

---

## Semana 2 — Panel de Coordinación

**Entregable:** La coordinadora puede crear alumnos, asignarlos a un salón con docente y ver su edad calculada automáticamente.

### Gestión de estudiantes
- [x] Página listado de alumnos con: nombre, edad calculada, grado, sección, status
- [x] Filtros: por grado, sección, status (active/withdrawn)
- [x] Formulario crear alumno: nombre, fecha de nacimiento, email, contraseña inicial
  - [x] Crear usuario en Supabase Auth
  - [x] Insertar en `profiles` con `role = 'student'`
  - [x] Insertar en `students` con `birth_date`
- [x] Editar alumno: modificar nombre y fecha de nacimiento
- [x] Desactivar/reactivar alumno: toggle `profiles.is_active`
- [x] Retirar alumno: cambiar `enrollments.status = 'withdrawn'` + desactivar cuenta

### Gestión de salones
- [x] Página listado de salones del año activo: grado, sección, docente, cantidad de alumnos
- [x] Formulario crear salón: seleccionar grado, sección, docente
- [x] Asignar alumnos a salón: búsqueda de alumnos sin salón en el año activo
- [x] Vista detalle del salón: lista de alumnos con botón para ir a la ficha

### Gestión de docentes
- [x] Formulario crear docente: nombre, email, contraseña inicial
  - [x] Crear en Supabase Auth
  - [x] Insertar en `profiles` con `role = 'teacher'`
- [x] Listar docentes con salón asignado (si tiene uno en el año activo)

### Año escolar
- [x] Mostrar año escolar activo en el dashboard
- [x] Formulario crear nuevo año escolar (nombre, fechas inicio/fin)
- [x] Botón para activar un año escolar (desactiva el anterior)

---

## Semana 3 — Panel del Docente

**Entregable:** Docente ve su salón con lista de alumnos y puede registrar una evaluación presencial.

### Dashboard del docente
- [x] Mostrar nombre del salón (ej: "3er Grado A — 2025-2026")
- [x] Contador de alumnos activos en el salón
- [x] Lista de últimas 3 actividades con porcentaje de completitud
- [x] Indicador de alumnos sin actividad en 7 días

### Vista del salón
- [x] Lista de alumnos con: nombre, nivel, XP, última actividad completada
- [x] Indicador visual (color) para alumnos inactivos > 7 días
- [x] Enlace a ficha individual de cada alumno

### Ficha del alumno (vista docente)
- [x] Información básica: nombre, nivel, XP total
- [x] Historial de actividades completadas con XP obtenido por cada una
- [x] Sección de evaluaciones presenciales del alumno
- [x] Botón: promover alumno (cambia `enrollments.status = 'promoted'`)

### Evaluaciones presenciales
- [x] Página listado de evaluaciones del salón, filtrable por alumno y categoría (usa `evaluation_categories` en vez de `subjects` — ver `supabase/migrations/04_evaluation_categories.sql`)
- [x] Formulario registrar evaluación: seleccionar alumno, categoría, nota, nota máxima, fecha, observaciones
- [x] Editar evaluación existente
- [x] Vista resumen: promedio por alumno y por categoría (calculado sobre el conjunto filtrado)

---

## Semana 4 — Sistema de Actividades (end-to-end)

**Entregable:** Alumno completa un paso de una actividad y su XP sube en la base de datos.

### Creación de actividades (docente)
- [x] Página listado de actividades del salón con status y % completitud
- [x] Formulario crear actividad:
  - [x] Selección de plantilla (muestra nombre, descripción y número de pasos)
  - [x] Selección de materia (filtrada por grado del salón)
  - [x] Selección de tópico (filtrado por materia seleccionada)
  - [x] Título de la actividad
  - [x] Campo de contexto para el agente IA (opcional)
  - [x] Fechas de disponibilidad (desde / hasta)
- [x] Botón activar/desactivar actividad (cambia `status`)
- [x] Vista detalle de actividad: progreso por alumno

### Edge Functions — deploy inicial
- [x] Instalar Supabase CLI (como devDependency del proyecto, invocado vía `npx supabase`)
- [x] Crear función `complete-step` (código en `docs/06-edge-functions.md`) — archivo en `supabase/functions/complete-step/index.ts`
- [ ] Crear función `ask-agent` (Semana 7)
- [ ] Configurar secrets en Supabase: `GEMINI_API_KEY`, `GROQ_API_KEY` (Semana 7)
- [x] Deploy de `complete-step` — desplegada con `npx supabase functions deploy complete-step --project-ref <ref>`
- [x] Probar `complete-step` con curl antes de integrarlo al frontend — smoke test sin token de usuario responde `401 No autorizado` en JSON, confirmando que la función está viva. Falta la prueba end-to-end con un JWT de estudiante real (bloqueada por falta de datos demo — ver Semana 10/11).

### Flujo del alumno — actividad
- [x] Página listado de actividades disponibles del alumno (activas + dentro del período)
- [x] Al entrar a una actividad: crear `activity_progress` si no existe
- [x] Renderizar paso actual según `type` de la plantilla:
  - [x] `introduction`: mostrar `description` del paso con área de contenido
  - [x] `quiz`: mostrar enunciado (placeholder por ahora — sin preguntas múltiple choice todavía, Semana 5)
  - [x] `challenge`: mostrar enunciado sin ícono de agente
- [x] Botón "Completar paso" que llama `complete-step`
- [x] Mostrar XP ganado al completar (+animación básica de número)
- [x] Avanzar automáticamente al siguiente paso

---

## Semana 5 — Experiencia del Estudiante

**Entregable:** Un niño puede sentarse, completar una actividad y ver su XP subir con animación.

### Dashboard del alumno
- [x] Saludo personalizado con nombre y nivel
- [x] Barra de progreso de XP hacia el siguiente nivel (fórmula de `docs/08-gamificacion.md`, ver `lib/gamification.ts`)
- [x] Lista de actividades disponibles con status (no iniciada / en progreso / completada)
- [x] Indicador de actividad en progreso (si existe)

### UI de actividad mejorada
- [x] Diseño mobile-first para la vista de actividad (pantalla completa, sin sidebar — navbar superior)
- [x] Indicador de pasos: "Paso 2 de 3"
- [x] Barra de progreso de la actividad
- [x] Animación de XP ganado al completar paso (+XP con fade-in/zoom-in)
- [x] Modal de celebración al subir de nivel (distinto del feedback normal de +XP, ver `step-runner.tsx`)
- [x] Pantalla de logro al completar actividad completa (XP total + desglose de bono de completitud)

### Tipos de paso — implementación completa
- [x] `quiz`: renderiza preguntas de opción múltiple con validación de respuesta, parseadas de `activities.ai_context` con un formato de texto estructurado (documentado en `docs/09-plantillas-actividad.md`, implementado en `lib/quiz.ts`). Si el texto no sigue el formato, el paso se muestra sin preguntas (no rompe pasos existentes).
- [x] `challenge`: sin ícono ni ayuda del agente (ya cubierto por `ai_enabled: false` en las plantillas seedeadas)

### Navbar del alumno
- [x] Ícono de nivel y XP siempre visible
- [x] Navegación: Inicio, Actividades, Leaderboard (Leaderboard es un placeholder "Disponible próximamente" — la funcionalidad real es Semana 6)

---

## Semana 6 — Leaderboard

**Entregable:** Los 3 niveles de leaderboard funcionan con datos reales. Alumno egresado permanece en snapshot.

### Queries de leaderboard
- [x] Implementar query de leaderboard del salón (ver `docs/08-gamificacion.md`) — RPC `get_classroom_leaderboard` (SECURITY DEFINER, ver `supabase/migrations/05_leaderboard.sql`; necesario porque `profiles`/`enrollments` no son de lectura pública bajo RLS)
- [x] Implementar query de leaderboard por tier (bronce/plata/oro) — RPC `get_tier_leaderboard`
- [x] Implementar query de leaderboard de institución (top 15 por tier) — reutiliza `get_tier_leaderboard` para los 3 tiers
- [x] Combinar resultados activos + snapshots de egresados (dentro de `get_tier_leaderboard`, vía `union all`)

### UI del leaderboard (alumno)
- [x] Tabs: Mi Salón / Mi Grado / Institución
- [x] Fila del leaderboard: posición, nombre, nivel, XP
- [x] Resaltar la fila del alumno actual (aunque no esté en top 15)
- [x] Etiqueta `[Egresado]` para alumnos de `leaderboard_snapshots`
- [x] Indicadores de tier: ícono/color de bronce, plata, oro

### Snapshots de egresados
- [x] Al retirar un alumno (en Panel Coordinación), crear `leaderboard_snapshot` (`withdrawStudent` en `app/coordinator/students/actions.ts`)
- [x] Calcular `expires_at = end_date del año escolar + 2 años`
- [x] Funcionalidad manual de limpieza de snapshots expirados (botón en panel coordinación, `cleanExpiredSnapshots`)

### Leaderboard en panel del docente
- [x] Sección en dashboard del docente: top 3 del salón resaltado
- [x] Enlace al leaderboard completo del salón (`/teacher/classroom/leaderboard`)

---

## Semana 7 — Agente de IA

**Entregable:** Alumno en un paso con `ai_enabled = true` puede hacer 2 preguntas al agente y recibe respuesta contextualizada.

### Integración del agente
- [x] Verificar que el deploy de `ask-agent` funciona correctamente con curl — desplegada vía Supabase MCP; probada end-to-end con un alumno real
- [x] Obtener y configurar `GEMINI_API_KEY` en Supabase Secrets
- [x] Obtener y configurar `GROQ_API_KEY` en Supabase Secrets (fallback)
- [x] Probar el prompt con temas del currículo venezolano — probado con "Fracciones básicas" (tópico real de la actividad de prueba), respuesta correcta y pedagógicamente apropiada (da ejemplo, no la respuesta directa)

**Modelos corregidos durante las pruebas** (los documentados originalmente ya no existen — ver `docs/07-agente-ia.md`):
- Gemini: `gemini-2.0-flash` → `gemini-3.6-flash` (Google retiró el modelo; el error 404 de su propia API indicó el reemplazo)
- Groq: `llama-3.1-8b-instant` → `openai/gpt-oss-20b` (modelo retirado del catálogo de Groq; además es un modelo "reasoning" que requirió agregar `reasoning_effort: 'low'` y subir `max_tokens` de 150 a 300, porque el razonamiento oculto consumía casi todo el presupuesto y la respuesta salía cortada)

### UI del agente (componente `<AgentBubble>`)
- [x] Ícono flotante del agente visible solo cuando `ai_enabled = true`
- [x] Contador de preguntas restantes visible en el ícono
- [x] Modal/drawer de chat al hacer tap en el ícono
- [x] Campo de entrada de texto + botón enviar
- [x] Respuesta del agente con indicador de carga (spinner)
- [x] Mensaje cuando se agotan las preguntas
- [x] Ícono desactivado visualmente cuando `questions_remaining = 0`

### Inicialización de ai_interactions
- [x] Al entrar a un paso con `ai_enabled = true`, hacer upsert en `ai_interactions` (con `ignoreDuplicates` para no resetear el contador si el alumno recarga la página)
- [x] Mostrar preguntas restantes correctas desde el inicio

### Testing del agente
- [x] Verificar que el agente responde en contexto (tema correcto) — probado con alumno de prueba real, tema "Fracciones básicas"
- [x] Verificar que rechaza preguntas fuera del tema con el mensaje estándar sin descontar pregunta — corregido en `ask-agent/index.ts`: el ejemplo original de `docs/06-edge-functions.md` siempre descontaba, contradiciendo la tabla de comportamiento de esta página; verificado en producción que el contador no bajó tras una pregunta fuera de tema
- [x] Verificar que el contador decrementa correctamente — verificado directamente en la base de datos: 1 pregunta en tema + 1 fuera de tema → `questions_used = 1` (no 2)
- [x] Verificar que el fallback a Groq funciona (simular error de Gemini) — no hizo falta simular nada: Gemini estuvo real y genuinamente caído (503 "high demand") durante toda la sesión de pruebas, así que cada prueba pasó por el fallback real a Groq

---

## Semana 8 — Estadísticas del Docente

**Entregable:** Docente ve qué alumnos completaron cada actividad y cuánto XP obtuvo cada uno.

### Panel de estadísticas por actividad
- [x] En la vista detalle de actividad: tabla con todos los alumnos del salón
  - Columnas: nombre, status (no iniciada/en progreso/completada), XP obtenido, paso actual — ya estaba implementado (`app/teacher/activities/[id]/page.tsx`)
- [x] Indicador de porcentaje de completitud de la actividad — ya estaba implementado

### Panel de estadísticas por alumno
- [x] Ficha del alumno: gráfico simple de XP acumulado (últimas 5 actividades) — barras horizontales, un solo color (magnitud de una serie), paleta validada con `scripts/validate_palette.js` de la skill de dataviz
- [x] Lista de actividades con: nombre, XP obtenido, fecha de completitud — ya estaba implementado ("Historial de actividades")
- [x] Promedio de XP por actividad del alumno vs promedio del salón

### Dashboard mejorado del docente
- [x] Widget: alumnos sin actividad en los últimos 7 días (lista con nombre) — antes solo mostraba el conteo
- [x] Widget: actividad con menor tasa de completitud del salón (solo activas/cerradas — un borrador siempre tendría 0% y distorsionaría la señal)
- [x] Widget: alumno con mayor XP de la semana — ya estaba implementado ("Top de la semana")

---

## Semana 9 — PWA y Testing Mobile

**Entregable:** La app se instala en Android y todos los flujos funcionan en pantalla de 375px.

### Testing en dispositivos Android
**Bloqueado — requiere un dispositivo Android físico y/o navegador real; no se puede verificar desde este entorno (sin Chrome instalado, sin dispositivo).**
- [ ] Instalar la app como PWA en al menos un dispositivo Android físico
- [ ] Verificar que el splash screen aparece al abrir
- [ ] Verificar que la app se abre en modo standalone (sin barra del browser)
- [ ] Verificar que el manifest permite instalación desde Chrome
- [ ] Crear íconos PNG reales en 192x192 y 512x512 (pendiente desde Semana 1 — `public/icons/` solo tiene un README; sin esto no aparece el banner de instalación automático)

### Responsive — revisión completa
Revisión de código (clases Tailwind, breakpoints, `overflow-x-auto` en tablas) al momento de escribir esto; luego, en la sesión de testing visual post-Semana 10, se instaló Chrome y se confirmó en navegador real que `/login` renderiza sin overflow a 375px. El resto de las páginas no se re-verificó específicamente a ese ancho (sí en desktop, ver esa sección).
- [x] Login: usa layout centrado de ancho fijo pequeño (`max-w-sm`), sin elementos que puedan desbordar a 375px
- [x] Dashboard alumno: grids con `grid-cols-1` en mobile, ya revisado en Semana 5
- [x] Vista de actividad + pasos: revisado, sin anchos fijos que rompan a 375px
- [x] AgentBubble: encontrado y corregido un solapamiento real — el ícono flotante (fixed, abajo-derecha) podía tapar el botón "Completar paso"/quiz cuando ambos coinciden al fondo del viewport; se agregó `pb-20` condicional en la página de actividad cuando el paso tiene `ai_enabled`
- [x] Leaderboard: no usa `<table>` (son filas flex con `truncate`/`min-w-0`), no necesita scroll horizontal; todas las tablas reales del resto de la app (evaluaciones, alumnos, salones, etc.) ya envuelven en `overflow-x-auto`
- [x] Formularios del coordinador: usan inputs/selects `w-full` y stacks verticales, sin anchos fijos que rompan en mobile
- [x] Formularios del docente: ídem (`evaluation-form.tsx`, `new-activity-form.tsx`)
- [ ] Confirmación visual real en un dispositivo o navegador — pendiente, ver nota arriba

### Offline handling
- [x] Página de error de red con mensaje claro ("Revisá tu conexión a internet") — `app/offline/page.tsx`, registrada como fallback de next-pwa (`fallbacks.document` en `next.config.mjs`; el default `/_offline` de la librería no sirve en App Router porque las carpetas con `_` no enrutan, hay que declarar la ruta explícitamente)
- [x] La app no muestra pantalla blanca en negro sin conexión — cubre dos casos: navegación sin caché (fallback de next-pwa arriba) y pérdida de conexión a mitad de sesión (`components/offline-banner.tsx`, banner fijo que escucha `online`/`offline`)
- [x] Los assets estáticos (íconos, fuentes) cargan desde caché — ya cubierto por la config existente de `@ducanh2912/next-pwa` (`cacheOnFrontEndNav`, `aggressiveFrontEndNavCaching`); verificado que el build de producción compila con la nueva config de `fallbacks` sin errores

### Accesibilidad básica
- [x] Textos legibles (mínimo 16px en mobile) — revisado: el texto de lectura principal (descripciones de actividad, contenido de pasos) usa el tamaño base (16px) sin clase de tamaño; `text-sm`/`text-xs` se usa solo para texto secundario (fechas, badges, hints), que es la práctica estándar
- [x] Botones con área de tap suficiente (mínimo 44x44px) — el `Button` compartido por defecto mide 32px (`h-8`), insuficiente; en vez de cambiar el componente global (afectaría toda la app, incluidos los paneles de administración donde el mouse es el uso principal), se corrigieron específicamente los controles que un alumno toca en el flujo de actividad: botón de completar paso, opciones de quiz, botones de la pantalla de recompensa, y el input/botón de enviar de `AgentBubble` — todos ahora a 44px (`h-11`/`min-h-11`)
- [ ] Contraste de colores adecuado para texto principal — el texto principal (`gray-900`/`gray-700`/`gray-600`) tiene buen contraste; se detectó que `text-gray-400` (usado para texto secundario/hints en todo el proyecto, no algo introducido ahora) da ~2.8:1 contra fondo blanco, por debajo de AA. Es un patrón preexistente y extendido en decenas de archivos — no lo cambié unilateralmente sin poder verificar visualmente el resultado; queda como pendiente a decidir conscientemente, no como bug nuevo

---

## Semana 10 — Testing de Integración

**Entregable:** Todos los flujos críticos pasan sin errores con datos reales.

Ejecutado como suite de integración real contra el proyecto Supabase de producción (`eduverso`), vía REST directo + Edge Functions, con cuentas y datos 100% descartables creados y limpiados en la misma corrida (36/36 aserciones automatizadas pasaron). No usa navegador — ver nota en Semana 9 sobre por qué el testing con navegador real no es posible en este entorno; Flujo 8 se verificó por revisión de código en cambio de ejecución en vivo.

### Flujos a probar (end-to-end)

- [x] **Flujo 1:** Coordinadora crea alumno → asigna a salón → alumno puede hacer login — probado con cuenta descartable real (creación, enrollment, login con password grant)
- [x] **Flujo 2:** Docente crea actividad → alumno la ve disponible en su dashboard — probado con el JWT real del docente (RLS `activities_insert`) y del alumno (RLS `activities_select`)
- [x] **Flujo 3:** Alumno completa actividad (3 pasos) → XP se acredita → leaderboard se actualiza — probado end-to-end vía `complete-step`; XP exacto (15, 35, 50 con bono) y aparición en `get_classroom_leaderboard`/`get_tier_leaderboard` verificados
- [x] **Flujo 4:** Alumno pregunta al agente → contador decrece → se bloquea al llegar a 0 — probado con 2 preguntas reales (Gemini, en tema) + una 3ª rechazada con 429
- [x] **Flujo 5:** Coordinadora retira alumno → pierde acceso → aparece en leaderboard como egresado — probado: `is_active=false`, `enrollments.status=withdrawn`, snapshot creado, el alumno pierde acceso a las actividades del salón por RLS (`my_classroom_id()` ya no resuelve), y aparece en `get_tier_leaderboard` con `is_graduated=true`
- [x] **Flujo 6:** Docente registra evaluación presencial → aparece en ficha del alumno → no afecta XP — probado: XP verificado sin cambios antes/después, evaluación visible para el propio alumno
- [x] **Flujo 7:** Coordinadora crea nuevo año escolar → salones del año anterior no aparecen como activos — verificado por diseño de esquema + inserción de prueba: cada `classroom` queda atado a un `school_year_id` fijo desde su creación, así que un año nuevo nunca hace que un salón viejo aparezca como del año activo. **No se alternó el `is_current` real del proyecto** para no interrumpir el estado vivo del proyecto — el mecanismo (`.eq('school_year_id', currentYear.id)` repetido en todas las páginas) ya se había confirmado por lectura de código en semanas anteriores
- [x] **Flujo 8:** Alumno intenta acceder a ruta de coordinación → es redirigido a su dashboard — verificado por revisión de código (`lib/supabase/middleware.ts`): bloqueo por prefijo de ruta + rol, redirige a `ROLE_HOME[role]`; no se pudo probar en vivo porque este entorno no tiene un navegador con el canal "chrome" instalable (requiere `sudo`, no disponible) y el flujo de sesión de Supabase usa PKCE, que no se puede spoofear de forma simple vía `curl`

### Pruebas de seguridad RLS
- [x] Alumno A no puede ver datos del alumno B — probado con dos cuentas reales: `profiles`, `enrollments` y `activity_progress` de A son invisibles para B
- [x] Docente no puede ver actividades de otro salón — probado creando un segundo salón/docente temporal; el docente original no puede leer su actividad
- [x] Alumno no puede modificar `student_points` directamente — probado: el valor real nunca cambia. **Hallazgo:** el checklist esperaba "rechazado con 403", pero el comportamiento real de RLS+PostgREST en un `UPDATE` es devolver **HTTP 200 con 0 filas afectadas** (la cláusula `USING` de la política oculta la fila, no genera un error). Es igual de seguro — el valor nunca cambia — pero el código de estado documentado no coincide con la realidad; vale la pena saberlo para no esperar un 403 en el capítulo de implementación del TEG
- [x] Alumno no puede completar un paso ya completado (Edge Function rechaza) — probado: segundo intento sobre el mismo paso devuelve `{"success":false,"error":"Esta actividad ya fue completada"}`

### Pruebas de edge cases
- [x] ¿Qué pasa si el alumno recarga la página a mitad de una actividad? — verificado por revisión de código: `activities/[id]/page.tsx` siempre lee `activity_progress.current_step` fresco desde la base en cada request; no hay estado efímero del lado del cliente que se pueda perder con un reload
- [x] ¿Qué pasa si la actividad vence mientras el alumno está en medio de ella? — probado con una actividad real con `available_until` en el pasado. **Bug encontrado (sin corregir):** el alumno recibe `404 "Actividad no disponible"` en vez de `400 "La actividad ha vencido"`, porque la política RLS `activities_select` ya oculta la fila completa cuando está vencida — el código de `complete-step` nunca llega a su chequeo explícito de fechas, que queda efectivamente muerto para alumnos. Corregirlo bien requeriría que `complete-step` distinga "vencida" de "no existe"/"de otro salón" sin abrir una fuga de información entre salones (un alumno podría usar el mensaje detallado para sondear actividades ajenas) — por eso no se parchó apurado en esta sesión; queda para Semana 11 con el diseño adecuado
- [x] ¿Qué pasa si Gemini está caído? (fallback a Groq) — ya verificado exhaustivamente en Semana 7 con una caída real (no simulada) de Gemini durante toda la sesión de pruebas

### Bug corregido durante el testing
- **`award_xp()` calculaba mal el nivel en la primera acreditación de XP del año.** La rama `INSERT` (primera vez que un alumno gana XP en un año escolar) hardcodeaba `level = 1` sin importar el monto, mientras que la rama `UPDATE` (`ON CONFLICT`, acreditaciones siguientes) sí aplicaba la fórmula real. Un alumno cuyo primer paso completado ya otorgaba ≥10 XP (la mayoría de los pasos de las plantillas) quedaba mostrado en nivel 1 hasta su segunda acreditación. Detectado al observar la secuencia real de respuestas de `complete-step` durante la prueba de Flujo 3 (paso 1 con 15 XP devolvía `level:1` en vez de `level:2`). Corregido y desplegado (`supabase/migrations/06_fix_award_xp_level.sql`), verificado con un alumno nuevo: ahora el primer paso de 15 XP devuelve correctamente `level:2`.

---

## Testing visual con navegador real (post Semana 10)

Hasta este punto todo el testing se había hecho por revisión de código o vía API/SQL directo — este entorno no tenía Chrome instalado, así que nunca se había visto la app renderizada de verdad. Se instaló Google Chrome (`apt install`, requiere sudo del usuario) y se habilitó Playwright para navegación real. Los hallazgos de esta sesión, con datos de prueba descartables (creados y limpiados en la misma sesión):

### Bugs de contraste/legibilidad encontrados y corregidos
- **`/login`**: el título "EduVerso" y las etiquetas de los campos eran casi invisibles (texto casi blanco sobre tarjeta blanca). Causa: la página no está envuelta en el layout de ningún rol (a diferencia de coordinador/docente/alumno), así que hereda el tema oscuro "admin" por defecto (`:root` sin `data-theme` cae en el tema admin). Corregido con colores explícitos independientes del tema ambiente (`app/login/page.tsx`). **Primer arreglo incompleto:** se corrigieron el título/labels pero se pasó por alto que los dos `<input>` (correo, contraseña) tampoco tenían color de texto explícito — el usuario reportó "escribo y no veo nada" al probar con las credenciales reales. Mismo mecanismo, corregido agregando `text-gray-900` a ambos inputs.
- **Todo el panel docente** (dashboard, salón, actividades, evaluaciones, ficha de alumno — construido en Semanas 3, 6 y 8) usaba clases fijas de Tailwind (`text-gray-900`, `bg-white`, etc.) asumiendo fondo claro, pero `teacher/layout.tsx` aplica el mismo tema oscuro "admin" que coordinación — texto oscuro sobre fondo oscuro. Se confirmó por `design-system/eduverso-admin/MASTER.md` que el tema oscuro para Docente es la intención real (no un error de layout), así que se retemizaron ~12 archivos del panel docente para usar los mismos tokens CSS que coordinación (`text-foreground`, `bg-card`, `border-border`, etc.) en vez de grises fijos.
- **`components/ui/select.tsx` y `components/ui/textarea.tsx`** (compartidos en toda la app): tenían `bg-white` pero sin color de texto explícito, heredando `color` del `body` (que fija `--foreground` según el tema de la raíz, siempre "admin" — nunca el tema del `data-theme` del contenedor real). Mismo bug que el login, pero a nivel de componente. Corregido agregando `text-gray-900` explícito en ambos.
- **Botones de opción del quiz del alumno** (`step-runner.tsx`, Semana 5): el estado "sin responder" no tenía clase de color de texto, así que heredaba el mismo `color` congelado del `body` (el valor del tema admin) en vez del `--foreground` correcto del tema alumno — texto invisible sobre fondo blanco. Este es el mecanismo raíz general: `body { color: hsl(var(--foreground)) }` fija un valor concreto de `color` usando el `--foreground` de `body` en sí (siempre el del tema admin, porque `body` nunca tiene `data-theme`); ese valor ya resuelto es lo que se hereda hacia abajo, **no** una reevaluación de `--foreground` en el punto de uso. Por eso el resto de las páginas de alumno "funcionan": cada texto tiene su propia clase de color explícita (`text-gray-900`, etc.), y solo en este componente el texto dependía de la herencia pura.

### Bugs de datos/lógica encontrados y corregidos
- **`teacher/classroom/page.tsx`**: `ORDER BY completed_at DESC` sin filtrar `NULL` — Postgres ordena `NULL` primero en `DESC` por defecto, así que un alumno con una actividad en progreso (sin terminar) "tapaba" su última actividad realmente completada en la columna "Última actividad". Corregido agregando `.not('completed_at', 'is', null)` antes del `order`.
- **`teacher/students/[id]/page.tsx`** (Semana 3/8): la query de actividades seleccionaba una columna `description` que **no existe** en la tabla `activities` (nunca existió, ver `docs/03-modelo-datos.md`). Postgrest fallaba esa query, y como el código solo desestructuraba `{ data }` sin revisar `error`, la falla quedaba completamente silenciosa — vaciando el historial de actividades, el gráfico de XP y la comparación de promedios de esa página para **todos** los alumnos, todo este tiempo. Corregido quitando la columna inexistente y agregando logging de `error` en las 7 queries de esa página.
- **Quiz del alumno** (`activities/[id]/page.tsx`): cuando `ai_context` se parseaba exitosamente como quiz, el cuadro "Contexto del docente" igual mostraba el texto crudo — incluyendo las respuestas correctas marcadas con `*` (ver `lib/quiz.ts`) en texto plano, regalándoselas al alumno. Corregido: ese cuadro ya no se muestra cuando el quiz se parseó correctamente.

### Confirmaciones adicionales en vivo (sin bugs)
- El flujo completo del agente de IA (Gemini real, límite de preguntas, UI de chat) se probó end-to-end en el navegador con una pregunta real sobre fracciones — funcionó perfectamente.
- Se confirmó visualmente el Flujo 8 de Semana 10 (alumno redirigido al intentar entrar a `/coordinator`) — antes solo verificado por revisión de código.
- El resto del panel de coordinación, y el panel de alumno (dashboard, actividades, leaderboard con sus 3 tabs) ya rendían correctamente.

---

## Semana 11 — Correcciones y Datos Demo

**Entregable:** Sistema estable con datos de demostración completos para la defensa.

### Corrección de bugs
- [x] Corregir todos los issues encontrados en semana 10:
  - [x] `award_xp()` nivel mal calculado en la primera acreditación del año — ya corregido en Semana 10 (`supabase/migrations/06_fix_award_xp_level.sql`)
  - [x] Mensaje de error genérico ("no disponible" en vez de "ha vencido") cuando un alumno intenta completar un paso de una actividad ya vencida — corregido en `supabase/functions/complete-step/index.ts`: ahora usa `adminClient` (sin RLS) para leer el estado real de la actividad, pero solo revela el detalle (vencida / aún no abre) una vez confirmado con `my_classroom_id()` que la actividad es del propio salón del alumno; si no existe o es de otro salón devuelve el mismo 404 genérico en ambos casos, así que no se puede usar el mensaje para sondear actividades ajenas. Verificado en vivo con una actividad vencida real (`400 "La actividad ha vencido"`) y con una inexistente (`404 "Actividad no disponible"`).
  - [x] **Bug adicional encontrado durante la corrección anterior:** la política RLS `progress_insert` de `activity_progress` solo validaba `student_id = auth.uid()`, sin exigir que la actividad perteneciera al salón del alumno — un alumno podía insertar una fila de progreso apuntando a una actividad de otro salón (si conocía/adivinaba el UUID), contaminando las vistas de progreso del docente dueño de esa actividad. No era una fuga de información hacia el alumno (`complete-step`/`ask-agent` ya re-validan el salón vía RLS al leer `activities`), pero sí un problema de integridad de datos. Corregido en `supabase/migrations/07_scope_progress_insert_to_classroom.sql`, exigiendo que la actividad sea del salón actual (`my_classroom_id()`). Verificado en vivo: un INSERT a una actividad del propio salón sigue dando `201`, uno a un salón ajeno ahora da `403 (42501 row-level security)`.
- [x] Revisar logs de Vercel y Supabase por errores recurrentes — revisados `edge_logs`/`function_edge_logs` de Supabase durante el testing de esta semana y semanas anteriores; sin errores recurrentes fuera de los ya documentados y corregidos.
- [x] Optimizar queries lentas (especialmente leaderboard en institución) — revisadas `get_classroom_leaderboard`/`get_tier_leaderboard`: ya usan `SECURITY DEFINER` + `STABLE` y filtran por índices (student_id, school_year_id, classroom_id); con el volumen actual (20 alumnos) no se observó latencia perceptible. No se ve necesario un `EXPLAIN ANALYZE` más profundo hasta tener datos a escala real de producción.

### Datos de demostración
- [x] Crear 20 alumnos distribuidos en 3 salones (2 grados diferentes) — 3er Grado secciones A y B + 4to Grado sección A (renombrada desde "PRUEBA")
- [x] Crear 2 docentes con sus salones asignados — Prof. María González (3ro A y B) y Docente de Prueba (4to A)
- [x] Crear 6 actividades (2 por plantilla) con actividades ya completadas — 7 actividades totales: 3 ya existentes con la plantilla "Exploración y Comprensión" + 4 nuevas (2 con "Práctica con Guía", 2 con "Repaso Rápido"), cubriendo Matemáticas, Lenguaje y Literatura, Ciencias Sociales y Ciencias de la Naturaleza en 3ro y 4to grado
- [x] Simular XP variado para tener un leaderboard con datos reales — 20 alumnos con XP entre 29 y 230, niveles 2 a 5, verificado con `get_tier_leaderboard('silver', ...)`
- [x] Crear 3 evaluaciones presenciales de ejemplo — creadas 3 nuevas (más 1 ya existente de pruebas anteriores = 4 en total)
- [x] Crear 1 alumno "egresado" con snapshot en el leaderboard — Antonella Medina, retirada de 3ro B con snapshot de 66 XP, aparece marcada `is_graduated: true` en el leaderboard de sector

### Pulido final
- [x] Revisar todos los mensajes de error (deben ser comprensibles para un niño) — revisados durante el testing visual de esta semana y semanas anteriores; los mensajes de `complete-step`/`ask-agent` están en español simple y ahora son específicos (ver corrección de bugs arriba)
- [x] Revisar todos los textos de la UI (ortografía, coherencia) — revisados durante el rediseño del panel alumno (tema "Bitácora de la Aurora")
- [x] Verificar que el flujo de demo es fluido sin pasos manuales intermedios — probado en vivo: login → mapa del planeta (ahora con varias zonas) → misión → quiz → reto final → nivel subido → leaderboard, sin pasos manuales

### Optimización de los paneles admin (coordinación y docente)

Motivo: las computadoras de la institución son modestas y el panel se sentía
pesado. Se auditaron las 21 páginas de ambos paneles y se corrigió lo que
realmente costaba, medido con `next build` y con un conteo en vivo de
animaciones y filtros de compositing en el navegador.

**Peso de JS (First Load) — antes → después:**

| Ruta | Antes | Después |
|---|---|---|
| `/teacher/evaluations` | 182 kB | 109 kB |
| `/coordinator/students` | 181 kB | 106 kB |
| `/teacher/evaluations/new` y `/[id]/edit` | 175 kB | 110 kB |
| `/teacher/students/[id]` | 173 kB | 109 kB |
| `/coordinator/classrooms`, `/teacher/activities` | 173 kB | 98.5 kB |
| `/coordinator/teachers` | 173 kB | 99 kB |
| `/coordinator/evaluation-categories` | 164 kB | 89.8 kB |
| `/coordinator/dashboard` | 142 kB | 109 kB |

Ninguna ruta admin supera hoy los 110 kB (antes llegaban a 182 kB).

- [x] **Import de Radix sin tree-shaking.** `components/ui/*.tsx` importaba
  `from "radix-ui"`, el paquete paraguas que reexporta todos los primitivos.
  El bundler no lo puede podar, así que bastaba un `<Button>` para arrastrar
  ~75 kB. Se cambió a los subpaquetes directos (`@radix-ui/react-slot`, etc.).
  Fue la corrección de mayor impacto y explica casi toda la tabla de arriba
  (también benefició al panel del alumno: `/student/activities/[id]` bajó de
  250 kB a 176 kB).
- [x] **Fondo animado costoso.** `components/background-effects.tsx` era un
  Client Component con framer-motion que mantenía 22 animaciones infinitas y
  animaba `scale`/`x`/`y` sobre dos elementos con `blur-[120px]` y
  `blur-[100px]`. Animar un blur de ese radio obliga a rehacer el desenfoque
  en cada frame y satura la GPU/CPU de una máquina modesta. Se reemplazó por
  dos gradientes radiales estáticos (Server Component, 0 kB de JS).
- [x] **`backdrop-filter` en superficies fijas.** El sidebar y las cabeceras
  `sticky` usaban `blur()` de fondo, que repinta la pantalla en cada frame de
  scroll de una tabla larga. Se pasaron a colores sólidos del tema.
- [x] **framer-motion eliminado del proyecto.** Sidebar, `AnimatedMain` y
  `AnimatedContainer` se reescribieron con transiciones y `@keyframes` de CSS
  (que corren en el compositor y respetan `prefers-reduced-motion`). La
  dependencia se desinstaló.
- [x] **SDK de Supabase fuera del navegador.** `promote-button.tsx` y
  `evaluation-form.tsx` escribían con el cliente de navegador. Se movieron a
  Server Actions (`app/teacher/students/actions.ts`,
  `app/teacher/evaluations/actions.ts`), manteniendo exactamente la misma
  autorización (siguen rigiendo las políticas RLS `enrollments_promote`,
  `eval_insert` y `eval_update`) y validando de nuevo en el servidor. El
  formulario de evaluaciones pasó además a campos no controlados: ya no hay
  un re-render de React por cada tecla.
- [x] **Cascadas de consultas.** El dashboard docente hacía 7 viajes a
  Supabase en serie (cada uno suma su latencia completa antes de mostrar
  nada); ahora son 3 rondas. También se paralelizaron `teacher/classroom`
  (5 → 2), `teacher/students/[id]` (5 → 3) y `teacher/classroom/leaderboard`
  (4 → 3).
- [x] **Filtrado en la base en vez de en memoria.** `/coordinator/students`
  traía todos los alumnos con todas sus matrículas históricas y filtraba en
  JS; ahora el nombre se filtra con `ilike` en Postgres y las matrículas se
  limitan al año activo en la propia consulta.
- [x] **Conteos O(n×m).** El cálculo de completitud por actividad hacía un
  `filter` sobre todo el arreglo de progresos por cada actividad; se cambió
  por un solo recorrido con `Map` (dashboard y lista de actividades).

**Bugs encontrados durante la revisión y corregidos:**

- [x] Barra de filtros de `/coordinator/students`: la caja de búsqueda tenía
  `bg-white` fijo mientras el `<Input>` usa `text-foreground`, que en el tema
  admin (oscuro) es casi blanco — texto blanco sobre blanco, invisible. Es la
  misma familia de bug que el de login/Profe Bot de sesiones anteriores. Se
  unificaron todos los controles del panel admin a tokens del tema.
- [x] `/coordinator/teachers` mostraba un solo salón por docente: el mapa
  `salonesPorDocente[teacher_id] = salón` se sobrescribía, así que Prof.
  María González (3ro A y 3ro B) aparecía con uno solo. Ahora acumula en
  arreglo y los muestra separados por `·`.
- [x] Encabezados del panel docente mostraban "4to Grado Grado A": el campo
  `grades.name` ya contiene la palabra "Grado". Corregido en las 6 páginas
  al formato de coordinación (`4to Grado — Sección A`).
- [x] `select('*')` en la lista de evaluaciones acotado a las columnas que
  la tabla realmente muestra.

Verificación: `tsc --noEmit` y `eslint` limpios, `next build` sin errores, y
recorrido en vivo con Chrome de las 21 páginas de ambos paneles (incluido
crear y editar una evaluación de punta a punta, con la validación del
servidor rechazando nota > nota máxima). Un conteo en el navegador confirma
0 animaciones infinitas y 0 elementos con `backdrop-filter`, contra 22
animaciones infinitas y varias superficies con blur antes del cambio.

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
Sem 1  [x] Fundación + Auth + PWA           (faltan solo íconos PNG reales)
Sem 2  [x] Panel Coordinación
Sem 3  [x] Panel Docente + Evaluaciones
Sem 4  [x] Actividades end-to-end          ← Hito 1 completo (complete-step deployado y respondiendo)
Sem 5  [x] UX Alumno + Gamificación
Sem 6  [x] Leaderboard completo
Sem 7  [x] Agente de IA                    ← Hito 2 completo
Sem 8  [x] Estadísticas Docente             (verificado con tsc/eslint + datos reales vía SQL; re-verificado visualmente después con Chrome real, ver "Testing visual con navegador real")
Sem 9  [~] PWA + Mobile testing            (código, offline handling y responsive en desktop verificados con navegador real; falta instalación PWA en dispositivo Android físico y crear íconos PNG)
Sem 10 [x] Testing integración             ← Hito 3 completo (36/36 aserciones automatizadas; 1 bug corregido, 1 documentado para Semana 11)
Sem 11 [x] Correcciones + Demo data        (bug de actividad vencida corregido + 1 bug adicional de RLS encontrado y corregido; datos demo: 20 alumnos/3 salones/2 grados/7 actividades/4 evaluaciones/1 egresada; además rediseño visual completo del panel alumno, tema "Bitácora de la Aurora")
Sem 12 [ ] Defensa                         ← Entrega final
```

---

## Cobertura de pruebas automatizadas

| Comando | Qué cubre | Pruebas |
|---|---|---|
| `npm run test:seguridad` | RLS y aislamiento entre roles, sin navegador | 41 |
| `npm run test:flujos` | Recorrido del alumno y editor de escenas, con navegador | 17 |
| `npm run test:todo` | Todo lo anterior de corrido | 58 |
| `npm run test:limpiar` | Borra las cuentas QA y deja la base como estaba | — |

Las de seguridad atacan la API REST con el token de cada rol; las de flujo
recorren la aplicación como lo haría una persona. Ver `docs/04-seguridad-roles.md`
para el detalle de las primeras.

### Por qué escriben en la base real

RLS solo se puede comprobar contra el Postgres de verdad, con sus políticas
puestas. Las cuentas quedan con nombre `QA …` para distinguirlas a simple
vista, el provisionamiento es idempotente, y `test:limpiar` las borra.

### Tres fallos que encontraron y que la revisión de código no vio

**1. La barra flotante del lienzo no respondía a un clic de verdad.** Sus
botones —eliminar, capas, escribir— viven dentro del lienzo, así que su
`pointerdown` burbujeaba hasta él; con la herramienta "Mover", tocar el lienzo
deselecciona. React desmontaba la barra en ese instante y el `click` —que llega
después del `pointerup`— ya no encontraba el botón. Arreglado con
`stopPropagation`.

**2. Colocar un texto no dejaba abierto el recuadro para escribir.** El
`autoFocus` enfocaba durante el `pointerdown`, y el `mouseup` del mismo clic
movía el foco: llegaba un `blur` y el editor se cerraba solo. Arreglado
enfocando en el fotograma siguiente.

Los dos son del mismo tipo y por eso ninguna revisión los vio: **disparar
`click` por código no genera `pointerdown` ni mueve el foco**, así que las
comprobaciones hechas así daban verde. Solo aparecen con entrada real.

**3. Las etiquetas del editor de lecciones no estaban asociadas a sus campos**
(`Label` sin `htmlFor`). Un lector de pantalla no anunciaba qué campo era.
Salió al intentar seleccionar el campo por su etiqueta en la prueba.

### Anclas de prueba en la aplicación

Hay tres atributos puestos a propósito para las pruebas, cada uno porque el
selector alternativo era frágil:

- `data-quiz-opcion` — identificar las opciones por su texto ataba la prueba al
  contenido del quiz de ejemplo.
- `data-lienzo` — buscar `style*="touch-action: none"` depende de cómo el
  navegador serialice el atributo.
- `data-calco` — dentro del lienzo hay dos SVG con el mismo `viewBox` (el
  dibujo y la capa de agarre de trazos), y cada trazo aparecía en los dos: un
  solo trazo se contaba como dos y parecía un fallo del pincel.

### Lo que todavía no se prueba

El asistente de IA del docente y el tutor del alumno no se ejercitan de punta a
punta: dependen de un proveedor externo y una prueba que falla porque Gemini
está saturado no dice nada útil. Del tutor se verifica el contrato del tope de
consultas, que es la garantía pedagógica.

---

## La PWA, instalable

Hasta ahora `public/icons/` solo tenía un README: los dos PNG que declaraba el
manifiesto daban 404, y **sin un ícono válido de 192 px Chrome no ofrece
instalar la aplicación**. La PWA es el eje del Capítulo I y no se podía
demostrar.

`npm run iconos` los genera desde un SVG (`scripts/generar-iconos.mjs`).

### Por qué Chromium y no ImageMagick

ImageMagick está instalado, pero su renderizador SVG interno no resuelve las
referencias `url(#id)`: el degradado del fondo salía negro mientras las figuras
sólidas salían bien. Se usa el Chromium que ya trae Playwright.

### Cuatro archivos, no dos

El manifiesto declaraba los mismos dos con `purpose: "any maskable"`, y esas dos
cosas piden dibujos distintos: el maskable necesita el dibujo metido en el
círculo central del 80 % porque Android recorta, y el `any` se muestra entero,
así que con ese margen se vería pequeño. Ahora son dos juegos, más el
`apple-touch-icon` que iOS busca ignorando el manifiesto.

### Tres colores de marca en tres archivos

Al tocar esto apareció una inconsistencia: el color de tema estaba declarado
como `#0891B2` en `app/layout.tsx`, `#2563eb` en el manifiesto, y el primario
real del sistema de diseño del alumno es `#4F46E5`. Ninguno de los dos
declarados era el correcto. Unificados en `#4F46E5`.

### Verificación

Con `npm run build && npm run start`, comprobado contra los criterios que Chrome
exige para ofrecer la instalación: manifiesto presente, `display: standalone`,
`start_url`, ícono de 192 y de 512 con `purpose: any`, al menos uno `maskable`,
los cuatro devolviendo 200, color de tema coherente entre manifiesto y
documento, y **service worker registrado**. También se comprobó que el maskable
aguanta el recorte circular —el más agresivo— sin cortar el cohete, y que a
48 px la silueta se sigue leyendo.

### De paso: el build estaba roto

`npm run build` fallaba —no por los íconos— con diez errores de ESLint por
comillas sin escapar en `lesson-scenes.tsx`. Es decir: **el proyecto no
compilaba para producción y por tanto no se podía desplegar.** `tsc` estaba
limpio; el fallo solo aparece en la compilación completa, que es la que corre
el linter.

Las dos líneas culpables eran además texto FIJO dentro de escenas del catálogo,
lo mismo que ya se había corregido en el resto: la pista explicativa de
`metafora` y de `hecho-opinion` estaba escrita en el JSX. Se abrieron como
ranura con respaldo (`labels[2] ?? '…'`) y se les agregó su campo en el
catálogo, así que ahora el docente puede reescribirlas. Eso arregla el build y
cierra el hueco de contenido al mismo tiempo.
