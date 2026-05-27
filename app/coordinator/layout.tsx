import Link from 'next/link'
import { requireRole } from '@/lib/auth'
import { LogoutButton } from '@/components/logout-button'

const NAV_LINKS = [
  { href: '/coordinator/dashboard', label: 'Inicio' },
  { href: '/coordinator/students', label: 'Alumnos' },
  { href: '/coordinator/classrooms', label: 'Salones' },
  { href: '/coordinator/teachers', label: 'Docentes' },
  { href: '/coordinator/school-years', label: 'Año Escolar' },
]

export default async function CoordinatorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireRole('coordinator')

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between py-3 gap-4">
          <div className="flex items-center gap-6">
            <div>
              <span className="font-bold text-blue-700">EduVerso</span>
              <span className="text-xs text-gray-500 ml-1.5">Coordinación</span>
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
            <span className="text-sm text-gray-500 hidden sm:inline">{user.full_name}</span>
            <LogoutButton />
          </div>
        </div>
        {/* Mobile nav */}
        <div className="md:hidden border-t overflow-x-auto">
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
        {children}
      </main>
    </div>
  )
}
