# 02 — Arquitectura

## Stack completo

```
┌─────────────────────────────────────────┐
│           Cliente (Android PWA)          │
│     Next.js 14 + TypeScript + shadcn/ui  │
│              Tailwind CSS                │
└────────────────┬────────────────────────┘
                 │ HTTPS
        ┌────────▼────────┐
        │   Vercel CDN    │  ← Deploy automático desde GitHub
        │  (free tier)    │
        └────────┬────────┘
                 │
        ┌────────▼────────────────────────┐
        │           Supabase              │
        │  ┌──────────┐  ┌─────────────┐ │
        │  │PostgreSQL│  │  Supabase   │ │
        │  │  + RLS   │  │    Auth     │ │
        │  └──────────┘  └─────────────┘ │
        │  ┌──────────────────────────┐  │
        │  │    Edge Functions (Deno) │  │
        │  │  - complete-step         │  │
        │  │  - ask-agent             │  │
        │  └──────────┬───────────────┘  │
        └─────────────┼───────────────────┘
                      │ API calls
              ┌───────▼────────┐
              │  Gemini 2.0    │  ← Primary AI
              │  Flash (free)  │
              └───────┬────────┘
                      │ fallback
              ┌───────▼────────┐
              │  Groq Llama    │  ← Fallback AI
              │  3.1 (free)    │
              └────────────────┘
```

## Tecnologías y versiones

| Tecnología | Versión | Propósito |
|---|---|---|
| Next.js | 14.x (App Router) | Framework frontend + API routes |
| TypeScript | 5.x | Tipado estático |
| Tailwind CSS | 3.x | Estilos |
| shadcn/ui | latest | Componentes UI |
| next-pwa | 5.x | Configuración PWA |
| @supabase/supabase-js | 2.x | Cliente Supabase |
| @google/generative-ai | latest | SDK Gemini |
| Supabase | managed | DB + Auth + Edge Functions |
| Deno | runtime de Supabase | Edge Functions runtime |

## Límites de los free tiers

### Supabase Free
| Recurso | Límite | Estimado del proyecto |
|---|---|---|
| Base de datos | 500 MB | ~50 MB (700 usuarios + actividades) |
| Bandwidth | 5 GB/mes | ~1-2 GB/mes |
| Usuarios activos | 50,000/mes | ~700/mes |
| Edge Function invocaciones | 500,000/mes | ~15,000/mes |
| Storage | 1 GB | < 100 MB |

### Vercel Free
| Recurso | Límite | Estimado |
|---|---|---|
| Bandwidth | 100 GB/mes | < 5 GB/mes |
| Deployments | 100/día | < 5/día |
| Serverless functions | 100 GB-hrs | Mínimo (usamos Supabase EF) |

### Gemini 2.0 Flash Free
| Recurso | Límite | Estimado |
|---|---|---|
| Requests por minuto | 15 RPM | Pico estimado: 8-10 RPM (uso desde casa) |
| Requests por día | 1,500 req/día | ~375 sesiones de actividad/día |
| Tokens por día | 1,000,000/día | Suficiente con prompts cortos |

### Groq Free (fallback)
| Recurso | Límite |
|---|---|
| Requests por minuto | 30 RPM |
| Modelo | Llama 3.1 8B |

## Rutas de la aplicación Next.js

```
app/
├── page.tsx                        # Login / landing
├── (auth)/
│   └── login/page.tsx
├── (coordinator)/
│   ├── layout.tsx                  # Guard: solo coordinación
│   ├── dashboard/page.tsx
│   ├── students/page.tsx           # Listado + creación
│   ├── students/[id]/page.tsx      # Ficha del alumno
│   ├── classrooms/page.tsx         # Salones
│   └── school-years/page.tsx       # Años escolares
├── (teacher)/
│   ├── layout.tsx                  # Guard: solo docente
│   ├── dashboard/page.tsx
│   ├── classroom/page.tsx          # Su salón
│   ├── activities/page.tsx         # Actividades del salón
│   ├── activities/new/page.tsx     # Crear actividad
│   ├── activities/[id]/page.tsx    # Detalle actividad
│   ├── students/[id]/page.tsx      # Estadísticas alumno
│   └── evaluations/page.tsx        # Evaluaciones presenciales
├── (student)/
│   ├── layout.tsx                  # Guard: solo alumno
│   ├── dashboard/page.tsx
│   ├── activities/page.tsx         # Actividades disponibles
│   ├── activities/[id]/page.tsx    # Actividad en curso
│   └── leaderboard/page.tsx
└── api/                            # Minimal — lógica pesada en Edge Functions
    └── webhooks/                   # Si se necesitan webhooks futuros
```

## Variables de entorno

```bash
# .env.local (nunca al repositorio)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Solo en Supabase Edge Functions Secrets (nunca en el frontend)
SUPABASE_SERVICE_ROLE_KEY=eyJ...
GEMINI_API_KEY=AIza...
GROQ_API_KEY=gsk_...
```

## Middleware de autenticación (Next.js)

El archivo `middleware.ts` en la raíz del proyecto redirige según el rol:

```typescript
// Rutas protegidas por rol
// /coordinator/* → solo role = 'coordinator'
// /teacher/*     → solo role = 'teacher'
// /student/*     → solo role = 'student'
// /              → redirige al dashboard del rol actual
```

## PWA — Configuración

El `manifest.json` debe incluir:
- `name`: nombre de la app en el idioma de la institución
- `short_name`: nombre corto para el ícono
- `theme_color`: color institucional
- `background_color`: blanco
- `display`: `standalone`
- `icons`: al menos 192x192 y 512x512

La app debe mostrar un mensaje claro (no pantalla en blanco) cuando no hay conexión.

## Deployment

1. Repositorio en GitHub (rama `main` = producción).
2. Vercel conectado al repositorio — deploy automático en cada push a `main`.
3. Supabase — proyecto creado manualmente, schema aplicado via SQL editor.
4. Variables de entorno configuradas en Vercel Dashboard y en Supabase Secrets.
