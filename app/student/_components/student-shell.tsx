import Link from 'next/link'
import { LogoutButton } from '@/components/logout-button'

const NAV_LINKS = [
  { href: '/student/dashboard', label: 'Inicio' },
  { href: '/student/activities', label: 'Actividades' },
]

export function StudentShell({
  userName,
  title,
  children,
}: {
  userName: string
  title?: string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white">
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between py-3 px-4 gap-4">
          <div className="flex items-center gap-6">
            <div>
              <span className="font-bold text-blue-600">EduVerso</span>
              <span className="text-xs text-gray-500 ml-1.5">Estudiante</span>
            </div>
            <nav className="hidden md:flex gap-1">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="px-3 py-1.5 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 hidden sm:inline">
              {userName}
            </span>
            <LogoutButton />
          </div>
        </div>
        <div className="md:hidden border-t overflow-x-auto bg-white/80">
          <div className="flex gap-1 px-3 py-2 min-w-max">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="px-3 py-1.5 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 whitespace-nowrap transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto py-6 px-4">
        {title && <h1 className="text-2xl font-bold text-gray-900 mb-6">{title}</h1>}
        {children}
      </main>
    </div>
  )
}
