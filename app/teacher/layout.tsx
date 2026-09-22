import Link from 'next/link'
import { requireRole } from '@/lib/auth'
import { LogoutButton } from '@/components/logout-button'
import BackgroundEffects from '@/components/background-effects'

const NAV_LINKS = [
  { href: '/teacher/dashboard', label: 'Inicio' },
  { href: '/teacher/classroom', label: 'Mi Salón' },
  { href: '/teacher/activities', label: 'Actividades' },
  { href: '/teacher/lecciones', label: 'Lecciones' },
  { href: '/teacher/evaluations', label: 'Evaluaciones' },
]

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireRole('teacher')

  return (
    <div className="min-h-screen flex flex-col relative" data-theme="admin">
      <BackgroundEffects />
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between py-3 gap-4">
          <div className="flex items-center gap-6">
            <div>
              <span className="font-bold text-primary">EduVerso</span>
              <span className="text-xs text-muted-foreground ml-1.5">Docente</span>
            </div>
            <nav className="hidden md:flex gap-1">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {user.full_name}
            </span>
            <LogoutButton />
          </div>
        </div>
        {/* Navegación móvil */}
        <div className="md:hidden border-t border-border overflow-x-auto bg-card">
          <div className="flex gap-1 px-3 py-2 min-w-max">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-white/10 whitespace-nowrap transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto py-4 px-4">{children}</main>
    </div>
  )
}
