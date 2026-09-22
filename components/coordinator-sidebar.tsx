'use client'

import * as React from 'react'
import {
  LayoutDashboard,
  Users,
  School,
  BookOpen,
  Calendar,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  LogOut,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/login/actions'

const SIDEBAR_LINKS = [
  { href: '/coordinator/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { href: '/coordinator/students', label: 'Alumnos', icon: Users },
  { href: '/coordinator/classrooms', label: 'Salones', icon: School },
  { href: '/coordinator/teachers', label: 'Docentes', icon: BookOpen },
  { href: '/coordinator/school-years', label: 'Año Escolar', icon: Calendar },
  { href: '/coordinator/evaluation-categories', label: 'Evaluaciones', icon: ClipboardList },
]

const STORAGE_KEY = 'eduverso:sidebar-collapsed'

/**
 * Sidebar del panel de coordinación.
 *
 * Reescrito sin framer-motion, sin Radix Tooltip y sin ScrollArea: antes
 * cada ítem del menú montaba un Tooltip de Radix y dos `AnimatePresence`,
 * y el aside entero era un `motion.aside` — mucho JS y trabajo de layout
 * para una barra que solo se expande y colapsa. Ahora el ancho se anima con
 * una transición CSS, el tooltip colapsado es el atributo `title` nativo y
 * el scroll es `overflow-y-auto`.
 *
 * El estado colapsado se guarda en localStorage para que no se pierda al
 * navegar entre páginas (cada navegación remonta este componente).
 */
export function CoordinatorSidebar({
  userName,
  className,
}: {
  /** Nombre de la coordinadora, mostrado en el pie junto a "Cerrar sesión". */
  userName: string
  className?: string
}) {
  const [collapsed, setCollapsed] = React.useState(false)
  const pathname = usePathname()

  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  React.useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(STORAGE_KEY) === '1')
    } catch {
      // localStorage bloqueado (modo privado): se queda expandida, sin romper
    }
  }, [])

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
      } catch {
        // ignorar: el colapso sigue funcionando en esta sesión
      }
      return next
    })
  }

  return (
    <aside
      className={cn(
        'admin-sidebar relative flex flex-col rounded-2xl h-[calc(100vh-1.5rem)]',
        'sticky top-3 ml-3 mr-3 my-3 shrink-0 z-30 overflow-hidden',
        collapsed ? 'w-[72px]' : 'w-64',
        className,
      )}
    >
      <div className="flex items-center gap-3 px-4 h-16 shrink-0">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-white shrink-0">
          <GraduationCap className="w-5 h-5" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden whitespace-nowrap">
            <span className="font-bold text-foreground">EduVerso</span>
            <span className="text-xs text-muted-foreground ml-1.5">Coordinación</span>
          </div>
        )}
      </div>

      <div className="mx-3 h-px bg-border opacity-50" />

      <nav className="flex-1 overflow-y-auto flex flex-col gap-1 px-3 py-4">
        {SIDEBAR_LINKS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 h-11 rounded-xl text-sm transition-colors',
                collapsed ? 'px-3 justify-center' : 'px-4',
                isActive
                  ? 'bg-primary/15 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && (
                <span className="overflow-hidden whitespace-nowrap">{label}</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Pie: cuenta y controles.
          Vivían en una barra superior que ocupaba 64 px de alto en todas las
          páginas solo para mostrar el nombre y un botón; acá aprovechan el
          espacio muerto del sidebar y liberan esa franja para el contenido.

          Orden visual: la identidad es INFORMACIÓN, así que va en una
          superficie propia; "Cerrar sesión" y "Colapsar" son ACCIONES, así
          que usan exactamente la misma geometría que los ítems del menú
          (px-4, gap-3, ícono de 20 px) para que todos los íconos del sidebar
          caigan sobre una única línea vertical. Antes cada uno tenía su
          propio padding, su propio tamaño de ícono y el de colapsar estaba
          centrado — tres alineaciones distintas apiladas. */}
      <div className="mx-3 h-px bg-border opacity-50" />

      <div className="px-3 py-3 flex flex-col gap-1">
        <div
          className={cn(
            'flex items-center gap-3 rounded-xl bg-muted/60 mb-2',
            collapsed ? 'justify-center p-2' : 'px-3 py-2.5',
          )}
          title={collapsed ? userName : undefined}
        >
          <span className="w-8 h-8 rounded-full bg-primary text-white text-xs font-semibold flex items-center justify-center shrink-0">
            {initials}
          </span>
          {!collapsed && (
            // Solo el nombre: el rol ya se lee junto al logo, arriba del
            // mismo sidebar, y repetirlo acá era ruido.
            //
            // Se permiten dos líneas en vez de truncar: "Coordinadora de
            // Prueba" no entra en una sola, y cortar el nombre de una
            // persona ("Coordinadora de Prue…") se lee peor que ocupar
            // 16 px más en un sidebar que va sobrado de alto.
            <p className="text-sm font-medium text-foreground leading-snug line-clamp-2">
              {userName}
            </p>
          )}
        </div>

        <form action={logout}>
          <button
            type="submit"
            title={collapsed ? 'Cerrar sesión' : undefined}
            className={cn(
              'w-full h-11 rounded-xl flex items-center gap-3 text-sm cursor-pointer',
              'text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors',
              collapsed ? 'px-3 justify-center' : 'px-4',
            )}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span>Cerrar sesión</span>}
          </button>
        </form>

        <button
          type="button"
          onClick={toggle}
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          className={cn(
            'w-full h-11 rounded-xl flex items-center gap-3 text-sm cursor-pointer',
            'text-muted-foreground hover:bg-muted hover:text-foreground transition-colors',
            collapsed ? 'px-3 justify-center' : 'px-4',
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5 shrink-0" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5 shrink-0" />
              <span>Colapsar</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
