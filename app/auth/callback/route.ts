import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Callback usado por Supabase tras flujos OAuth o recuperación de contraseña.
// Por ahora solo intercambia el código por sesión y redirige al home.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(`${origin}/`)
}
