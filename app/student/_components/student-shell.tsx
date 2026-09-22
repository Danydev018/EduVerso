import Link from 'next/link'
import { LogoutButton } from '@/components/logout-button'
import { Rocket, Zap, Home, Map, Trophy } from 'lucide-react'
import { CosmicBackdrop } from './cosmic-backdrop'
import { calculateLevelProgress } from '@/lib/gamification'

const NAV_LINKS = [
  { href: '/student/dashboard', label: 'Bitácora', Icon: Home },
  { href: '/student/activities', label: 'Mi planeta', Icon: Map },
  { href: '/student/leaderboard', label: 'La flota', Icon: Trophy },
]

export function StudentShell({
  userName,
  title,
  level,
  totalXp,
  children,
}: {
  userName: string
  title?: string
  /** Nivel y XP actuales — siempre visibles en la barra de navegación. */
  level: number
  totalXp: number
  children: React.ReactNode
}) {
  const progress = calculateLevelProgress(totalXp, level)

  return (
    <div className="relative min-h-screen flex flex-col">
      <CosmicBackdrop />

      <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-md border-b border-indigo-100">
        <div className="container mx-auto flex items-center justify-between gap-3 py-2.5 px-4">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
              <Rocket className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading font-bold text-indigo-900 text-lg truncate">
              EduVerso
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-indigo-900/70 hover:text-indigo-900 hover:bg-indigo-50 transition-colors"
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div
              className="flex items-center gap-2 rounded-full bg-indigo-50 border border-indigo-100 pl-1 pr-3 py-1"
              title={`Nivel ${level} de la nave — ${totalXp.toLocaleString('es-AR')} de energía estelar`}
            >
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[11px] font-heading font-bold flex items-center justify-center flex-shrink-0">
                {level}
              </span>
              <div className="hidden sm:flex flex-col justify-center w-20">
                <div className="h-1.5 w-full rounded-full bg-indigo-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                    style={{ width: `${progress.progressPct}%` }}
                  />
                </div>
              </div>
              <span className="flex items-center gap-0.5 text-xs font-semibold text-orange-600 flex-shrink-0">
                <Zap className="w-3 h-3" fill="currentColor" />
                {totalXp.toLocaleString('es-AR')}
              </span>
            </div>
            <span className="text-sm text-indigo-900/70 hidden lg:inline truncate max-w-[10rem]">
              {userName}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto py-6 px-4 pb-24 md:pb-6">
        {title && (
          <h1 className="font-heading text-2xl font-bold text-indigo-950 mb-6">
            {title}
          </h1>
        )}
        {children}
      </main>

      {/* Consola de navegación flotante — solo mobile, imita una app nativa */}
      <nav className="md:hidden fixed bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-white/90 backdrop-blur-md border border-indigo-100 rounded-full shadow-lg shadow-indigo-950/10 px-1.5 py-1.5">
        {NAV_LINKS.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-full text-indigo-900/60 hover:text-indigo-900 hover:bg-indigo-50 transition-colors"
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-none">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
