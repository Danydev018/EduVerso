# SETUP — Semana 1

Pasos manuales para tener el proyecto corriendo localmente y desplegado en Vercel.

Después de completar estos pasos, marca como `[x]` las tareas correspondientes en
`docs/10-plan-tareas.md` → Semana 1.

---

## 1. Instalar dependencias

Desde la carpeta `ProyectoTesis/`:

```bash
cd ProyectoTesis
npm install
```

Requisitos: Node.js 18.17 o superior.

---

## 2. Crear proyecto en Supabase

1. Ir a https://supabase.com → **New Project**.
2. Nombre del proyecto: `eduplay` (o el que prefieras).
3. Contraseña de la base de datos: **guárdala**, la vas a necesitar.
4. Región: la más cercana a Venezuela (probablemente `us-east-1`).
5. Esperar a que el proyecto termine de aprovisionarse (~2 min).

---

## 3. Aplicar las migraciones SQL

En Supabase Dashboard → **SQL Editor** → **New query**, pegar y ejecutar EN ORDEN:

1. Todo el contenido de `supabase/migrations/01_schema.sql`
2. Todo el contenido de `supabase/migrations/02_helpers_and_rls.sql`
3. Todo el contenido de `supabase/migrations/03_seed.sql`

Verifica en **Table Editor** que aparecieron las 14 tablas y que `grades` tiene 6 filas.

---

## 4. Crear la primera cuenta de coordinación

En **Authentication → Users → Add user → Create new user**:

- Email: `coordinacion@institucion.test` (o uno real)
- Password: una contraseña segura
- **Marcar:** "Auto Confirm User"

Copia el `User UID` que se generó (lo necesitas en el paso siguiente).

Luego en **SQL Editor**, ejecutar (reemplazando `<USER_UID>` por el real):

```sql
insert into public.profiles (id, role, full_name)
values ('<USER_UID>', 'coordinator', 'Coordinación General');
```

---

## 5. Configurar variables de entorno locales

Crear el archivo `.env.local` en la raíz de `ProyectoTesis/`:

```bash
cp .env.example .env.local
```

En Supabase Dashboard → **Project Settings → API**:

- Copiar el **Project URL** → pegarlo en `NEXT_PUBLIC_SUPABASE_URL`
- Copiar el **anon public key** → pegarlo en `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Nota:** El `service_role` key NO va aquí. Solo se usa en Edge Functions (más adelante).

---

## 6. Correr el proyecto en local

```bash
npm run dev
```

Abrir http://localhost:3000

Probar:
1. La página te redirige a `/login`.
2. Ingresar con el email y contraseña creados en el paso 4.
3. Debe redirigir a `/coordinator/dashboard`.
4. El botón "Cerrar sesión" debe regresar a `/login`.

---

## 7. Crear repositorio GitHub y desplegar a Vercel

### GitHub

```bash
cd ProyectoTesis
git init
git add .
git commit -m "Semana 1: fundación del proyecto"
```

Crear un repositorio nuevo en GitHub (privado preferiblemente) y luego:

```bash
git remote add origin https://github.com/<usuario>/<repo>.git
git branch -M main
git push -u origin main
```

### Vercel

1. Ir a https://vercel.com → **Add New → Project**.
2. Importar el repositorio de GitHub.
3. Framework Preset: **Next.js** (se detecta automáticamente).
4. Root Directory: déjalo en blanco (la raíz del repo es la raíz del proyecto Next).
5. En **Environment Variables**, agregar:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. **Deploy**.

Cuando termine, Vercel te da una URL pública (ej: `eduplay.vercel.app`). Abrirla y verificar que el login también funciona en producción.

---

## 8. Probar la PWA

En el dispositivo Android:

1. Abrir la URL de Vercel en Chrome.
2. Hacer login.
3. Aparece el banner "Agregar a pantalla de inicio" (o ir al menú de Chrome y elegirlo manualmente).
4. La app se abre desde el ícono como si fuera nativa.

**Nota:** Los íconos en `public/icons/` son placeholders. Reemplazarlos antes de hacer demo a la rectora.

---

## Errores comunes

| Error | Causa | Solución |
|---|---|---|
| Redirección infinita en `/login` | El usuario no tiene perfil en `profiles` | Ejecutar el INSERT del paso 4 |
| "Tu cuenta no tiene perfil asignado" | Mismo caso anterior | Verificar el `User UID` |
| 401 en queries de Supabase | Variables de entorno mal copiadas | Revisar `.env.local` y reiniciar `npm run dev` |
| PWA no se instala | Falta de HTTPS o manifest mal formado | Probar en Vercel (Vercel da HTTPS); revisar `public/manifest.json` |

---

## Checklist final de la Semana 1

Marcar en `docs/10-plan-tareas.md`:

- [x] Setup del proyecto (Next.js + Tailwind + dependencias)
- [x] Supabase configurado con las 3 migraciones
- [x] Autenticación funcionando (login + middleware + redirección por rol)
- [x] Tres dashboards vacíos renderizan según el rol
- [x] PWA instalable en Android
- [x] Repositorio en GitHub + deploy en Vercel funcionando
