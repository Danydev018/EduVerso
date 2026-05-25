# 01 — Visión y Alcance

## Problema real de la institución

La escuela primaria donde se despliega este sistema tiene los siguientes problemas activos:

1. **Actualización manual de edades** — cada año escolar el personal actualiza manualmente la edad de cada alumno en registros físicos.
2. **Control de ingreso manual** — el registro de alumnos activos en la institución se lleva en papel.
3. **Sin herramienta de refuerzo académico digital** — los docentes no tienen forma de asignar actividades de repaso fuera del aula.
4. **Sin visibilidad del rendimiento estudiantil** — la coordinación no tiene datos agregados sobre el desempeño académico.

## Solución

Sistema web progresivo (PWA) con tres paneles diferenciados que unifica:

- **Gestión administrativa** del ciclo de vida del estudiante (matrícula, promoción, egreso).
- **Aprendizaje gamificado** mediante actividades basadas en plantillas pedagógicas.
- **Agente de IA tutor** como guía contextual dentro de las actividades.

## Usuarios y población

| Rol | Cantidad estimada | Descripción |
|---|---|---|
| Coordinación | 2-3 | Administra cuentas, salones, año escolar |
| Docentes | 10-15 | Gestiona su salón y crea actividades |
| Alumnos | ~680 | Cursa actividades, interactúa con el agente |
| **Total** | **~700** | Usuarios activos en el sistema |

**Patrón de uso:** El uso es principalmente desde casa (no concurrente en el aula), en dispositivos Android. Esto reduce significativamente la concurrencia pico.

## Marco pedagógico

El sistema de actividades está basado en:

- **Spaced Repetition System** (Ebbinghaus, 1885) — curva del olvido aplicada al espaciado de actividades.
- **Variable Ratio Reinforcement** (Skinner) — recompensas impredecibles que generan hábito.
- **Gamificación educativa** (Kapp, 2012) — XP, niveles y leaderboards para motivación intrínseca.

Referencia comercial análoga: Duolingo. La diferencia clave es que aquí el docente controla el contenido.

## Decisiones de scope (qué está IN y qué está OUT)

### IN — Debe estar en la entrega del TEG

- Gestión completa del ciclo de vida del alumno (coordinación).
- Salón digital por grado/sección/año con docente asignado.
- Sistema de actividades basado en plantillas predefinidas.
- Agente de IA contextual por actividad (Gemini 2.0 Flash).
- Sistema de XP, niveles y leaderboard en 3 niveles.
- Evaluación presencial registrada por el docente (no afecta leaderboard).
- PWA instalable en Android.
- Panel de estadísticas para el docente.

### OUT — Fuera del alcance de este TEG

- Soporte iOS (Safari tiene limitaciones con PWAs; 99.5% de usuarios son Android).
- Canal de avisos institucionales (eliminado para reducir scope).
- Evaluaciones formales a través del sistema (ninguna calificación oficial pasa por aquí).
- Creación de plantillas por el docente (solo el desarrollador crea plantillas).
- Fine-tuning del modelo de IA (se usa prompt engineering con contexto dinámico).

## Restricciones del proyecto

| Restricción | Valor |
|---|---|
| Tiempo de desarrollo | 12 semanas (3 meses) |
| Equipo | 1 desarrollador (solo) |
| Presupuesto infraestructura | $0 (solo free tiers) |
| Dispositivos objetivo | Android (smartphones) |
| Conectividad alumnos | Todos tienen internet en casa (coordinado con rectora) |

## Garantías pedagógicas

- Ninguna calificación oficial depende del uso de la app — el alumno sin acceso no es penalizado.
- El docente configura qué tópicos trabaja el agente — el desarrollador no define el currículo.
- El currículo base (materias y tópicos) es el currículo oficial venezolano, sembrado estáticamente.

## El sistema resuelve el problema #1 automáticamente

La edad de cada alumno **nunca se actualiza manualmente**. Se almacena `birth_date` y se calcula en tiempo real:

```sql
-- Edad siempre correcta, sin intervención humana
select extract(year from age(birth_date))::int as edad from students;
```
