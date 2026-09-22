# ProyectoTesis — Sistema de Aprendizaje Estudiantil Gamificado

Sistema web progresivo (PWA) para gestión administrativa y aprendizaje gamificado en educación primaria.
Trabajo Especial de Grado — Ingeniería en Informática.

## Contexto para IA

Este proyecto está completamente documentado en `docs/`. Lee los archivos en orden numérico para comprender el sistema completo antes de implementar cualquier cosa. El archivo `docs/10-plan-tareas.md` contiene el estado actual de las tareas.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui |
| PWA | next-pwa |
| Base de datos | Supabase (PostgreSQL) |
| Autenticación | Supabase Auth |
| Lógica serverless | Supabase Edge Functions (Deno) |
| Almacenamiento | Supabase Storage |
| Agente de IA | Google Gemini 3.6 Flash (fallback: Groq `openai/gpt-oss-20b`) |
| Deploy frontend | Vercel |
| Deploy backend | Supabase (managed) |
| CDN/Proxy | Cloudflare (opcional, encima de Vercel) |
| Costo total | $0 (free tiers) |

## Documentación

| # | Archivo | Contenido |
|---|---|---|
| 1 | [01-vision-y-alcance.md](docs/01-vision-y-alcance.md) | Problema, solución, usuarios, decisiones de scope |
| 2 | [02-arquitectura.md](docs/02-arquitectura.md) | Stack, infraestructura, límites free tier, variables de entorno |
| 3 | [03-modelo-datos.md](docs/03-modelo-datos.md) | Schema SQL completo con todas las tablas |
| 4 | [04-seguridad-roles.md](docs/04-seguridad-roles.md) | Roles, políticas RLS, funciones helper |
| 5 | [05-modulos.md](docs/05-modulos.md) | Especificación funcional por panel |
| 6 | [06-edge-functions.md](docs/06-edge-functions.md) | Funciones serverless con código completo |
| 7 | [07-agente-ia.md](docs/07-agente-ia.md) | Configuración del agente, prompts, reglas |
| 8 | [08-gamificacion.md](docs/08-gamificacion.md) | Sistema XP, niveles, leaderboard, tiers |
| 9 | [09-plantillas-actividad.md](docs/09-plantillas-actividad.md) | Definición de plantillas y estructura de pasos |
| 10 | [10-plan-tareas.md](docs/10-plan-tareas.md) | Plan 12 semanas + checklist completo de tareas |

## Estructura del proyecto (cuando se inicialice)

```
ProyectoTesis/
├── README.md
├── docs/                        # Esta documentación
└── app/                         # Código fuente Next.js (se crea en Semana 1)
    ├── (auth)/
    ├── (coordinator)/
    ├── (teacher)/
    ├── (student)/
    ├── api/
    └── supabase/
        └── functions/
            ├── complete-step/
            └── ask-agent/
```

## Reglas para el desarrollador (y para cualquier IA que asista)

1. **No implementar lo que no está en `docs/05-modulos.md`** — el scope está cerrado.
2. **No modificar `student_points` desde el cliente** — solo via Edge Function `complete-step`.
3. **No llamar a Gemini directamente desde el frontend** — solo via Edge Function `ask-agent`.
4. **Todo cambio al schema va primero a `docs/03-modelo-datos.md`**, luego al código.
5. **Marcar tareas como completadas en `docs/10-plan-tareas.md`** al terminarlas.
