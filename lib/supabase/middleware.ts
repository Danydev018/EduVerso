import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

type CookieToSet = { name: string; value: string; options: CookieOptions }

const PUBLIC_PATHS = ['/login', '/auth/callback']

const ROLE_HOME: Record<string, string> = {
  coordinator: '/coordinator/dashboard',
  teacher: '/teacher/dashboard',
  student: '/student/dashboard',
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))

  // Sin sesión: solo se permite acceder a rutas públicas.
  if (!user && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Con sesión activa: obtener el rol y validar acceso por prefijo.
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single()

    // Cuenta desactivada → logout y redirect.
    if (profile && !profile.is_active) {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/login?error=inactive', request.url))
    }

    const role = profile?.role as string | undefined
    const home = role ? ROLE_HOME[role] : '/login'

    // En /login o /: enviar al dashboard correspondiente.
    if (pathname === '/' || pathname.startsWith('/login')) {
      return NextResponse.redirect(new URL(home, request.url))
    }

    // Bloquear acceso a rutas de otro rol.
    const restricted: Array<[string, string]> = [
      ['/coordinator', 'coordinator'],
      ['/teacher', 'teacher'],
      ['/student', 'student'],
    ]
    for (const [prefix, required] of restricted) {
      if (pathname.startsWith(prefix) && role !== required) {
        return NextResponse.redirect(new URL(home, request.url))
      }
    }
  }

  return response
}
