# 08 — Gamificación

## Marco teórico

El sistema de gamificación se basa en:

- **Spaced Repetition System** (Ebbinghaus, 1885): las actividades refuerzan contenido en intervalos óptimos para combatir la curva del olvido.
- **Variable Ratio Reinforcement** (Skinner, 1938): recompensas variables (bonus de completitud, subida de nivel inesperada) generan mayor adherencia que recompensas fijas.
- **Gamificación educativa** (Kapp, 2012): XP, niveles y rankings como motivadores intrínsecos sin reemplazar la evaluación formal.

## Sistema de XP

### Cómo se gana XP

| Evento | XP otorgado |
|---|---|
| Completar un paso de actividad | Definido en `steps[n].xp_reward` (ver plantillas) |
| Completar una actividad completa | +25 XP (bonus de completitud) |

El XP se otorga via Edge Function `complete-step`. Nunca directamente desde el cliente.

### Fórmula de nivel

```
nivel = max(1, floor(sqrt(xp_total / 10)) + 1)
```

| XP total | Nivel |
|---|---|
| 0 | 1 |
| 10 | 2 |
| 40 | 3 |
| 90 | 4 |
| 160 | 5 |
| 250 | 6 |
| 360 | 7 |
| 490 | 8 |

Los primeros niveles son rápidos (motivador inicial). Los niveles altos requieren constancia (progresión sostenida). Esta curva replica el patrón de Duolingo y otros sistemas de aprendizaje adaptativo.

### Progresión de XP por nivel (cuánto XP se necesita para subir)

| De nivel | A nivel | XP necesario |
|---|---|---|
| 1 | 2 | 10 XP |
| 2 | 3 | 30 XP adicionales |
| 3 | 4 | 50 XP adicionales |
| 4 | 5 | 70 XP adicionales |
| 5 | 6 | 90 XP adicionales |

Una actividad típica otorga entre 60-100 XP. Un alumno activo sube de nivel cada 1-2 actividades en los niveles bajos.

## Sistema de Leaderboard

### Tres niveles de ranking

| Nivel | Alcance | Quién aparece |
|---|---|---|
| Salón | Solo los alumnos del salón del docente | Todos los alumnos del salón |
| Grado (Tier) | Alumnos del mismo tier del año escolar activo | Top 15 + posición propia |
| Institución | Todos los alumnos del año escolar activo | Top 15 por tier + posición propia |

### Tres tiers por grado

| Tier | Grados | Descripción |
|---|---|---|
| Bronce | 1ro y 2do | Primer ciclo |
| Plata | 3ro y 4to | Segundo ciclo |
| Oro | 5to y 6to | Tercer ciclo |

Los tiers garantizan que los alumnos compitan contra pares de su nivel académico, no contra estudiantes mayores.

### Cálculo del leaderboard (no se almacena, se calcula)

```sql
-- Leaderboard del salón
select
  p.full_name,
  sp.total_xp,
  sp.level,
  rank() over (order by sp.total_xp desc) as position
from student_points sp
join profiles p on p.id = sp.student_id
join enrollments e on e.student_id = sp.student_id
where sp.school_year_id = <año_actual>
  and e.classroom_id = <classroom_id>
  and e.status = 'active'
order by sp.total_xp desc;

-- Leaderboard por tier (ej: bronce = grados 1 y 2)
select
  p.full_name,
  sp.total_xp,
  sp.level,
  g.name as grade_name,
  rank() over (order by sp.total_xp desc) as position
from student_points sp
join profiles p on p.id = sp.student_id
join classrooms c on c.id = sp.classroom_id
join grades g on g.id = c.grade_id
join enrollments e on e.student_id = sp.student_id and e.classroom_id = c.id
where sp.school_year_id = <año_actual>
  and g.tier = 'bronze'
  and e.status = 'active'
order by sp.total_xp desc
limit 15;
```

### Alumnos egresados en el leaderboard

Cuando un alumno es retirado o egresa de la institución:
1. La coordinación (o una función automática) crea un registro en `leaderboard_snapshots` con el XP final y `expires_at = end_date_del_año_escolar + 2 años`.
2. El alumno aparece en el leaderboard con su puntaje congelado y una etiqueta `[Egresado]`.
3. Al llegar `expires_at`, el snapshot se elimina (puede ser manual por coordinación o con un cron job futuro).

### Reset anual

Al inicio de cada nuevo año escolar:
- Los registros en `student_points` del año anterior quedan como histórico.
- Se crean nuevos registros con `total_xp = 0` para el año nuevo cuando el alumno completa su primera actividad.
- Los leaderboards muestran solo el año escolar activo (el del `school_years.is_current = true`).

## Recompensas visuales

| Evento | Feedback visual |
|---|---|
| Completar paso | Animación de +XP flotante (número sube y desaparece) |
| Subir de nivel | Modal de celebración con el nuevo nivel |
| Completar actividad | Pantalla de logro con XP total ganado + bonus |
| Llegar al top 3 del salón | Insignia especial en el dashboard del alumno |

## Lo que NO hace el sistema de gamificación

- No reemplaza evaluaciones formales (las notas del docente son independientes).
- No penaliza al alumno por inactividad (no hay vidas ni rachas que perder).
- No comparte el rendimiento individual de un alumno con otros alumnos (el leaderboard muestra nombre y XP, no estadísticas detalladas).
