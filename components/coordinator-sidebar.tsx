'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const SIDEBAR_LINKS = [
  { href: '/coordinator/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { href: '/coordinator/students', label: 'Alumnos', icon: Users },
  { href: '/coordinator/classrooms', label: 'Salones', icon: School },
  { href: '/coordinator/teachers', label: 'Docentes', icon: BookOpen },
  { href: '/coordinator/school-years', label: 'Año Escolar', icon: Calendar },
  { href: '/coordinator/evaluation-categories', label: 'Evaluaciones', icon: ClipboardList },
]

interface CoordinatorSidebarProps {
  className?: string
}

export function CoordinatorSidebar({ className }: CoordinatorSidebarProps) {
  const [collapsed, setCollapsed] = React.useState(false)
  const pathname = usePathname()

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 256 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={cn(
        'glass-sidebar',
        'relative flex flex-col rounded-2xl h-[calc(100vh-1.5rem)] sticky top-3 ml-3 mr-3 my-3 shrink-0 z-30',
        'overflow-hidden',
        className
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 shrink-0">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[hsl(var(--primary))] text-white shadow-sm shadow-[hsl(var(--primary)/0.3)]">
          <GraduationCap className="w-5 h-5" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden whitespace-nowrap"
            >
              <span className="font-bold text-foreground">EduVerso</span>
              <span className="text-xs text-muted-foreground ml-1.5">Coordinación</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mx-3 h-px bg-[hsl(var(--border))] opacity-50" />

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="flex flex-col gap-1 px-3">
          {SIDEBAR_LINKS.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`)
            const Icon = link.icon

            return (
              <Tooltip key={link.href} delayDuration={0}>
                <TooltipTrigger asChild>
                  <Link href={link.href}>
                    <Button
                      variant="ghost"
                      className={cn(
                        'w-full justify-start gap-3 h-11 rounded-xl transition-all duration-200',
                        collapsed ? 'px-3' : 'px-4',
                        isActive
                          ? 'bg-[hsl(var(--primary)/0.15)] text-primary font-medium shadow-sm'
                          : 'text-muted-foreground hover:bg-white/10 hover:text-foreground'
                      )}
                    >
                      <Icon className={cn(
                        'w-5 h-5 shrink-0',
                        isActive ? 'text-primary' : 'text-muted-foreground'
                      )} />
                      <AnimatePresence>
                        {!collapsed && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden whitespace-nowrap text-sm"
                          >
                            {link.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </Button>
                  </Link>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right" className="flex items-center gap-2 glass">
                    {link.label}
                  </TooltipContent>
                )}
              </Tooltip>
            )
          })}
        </nav>
      </ScrollArea>

      {/* Collapse Button */}
      <div className="px-3 pb-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'w-full justify-center gap-2 rounded-xl h-10',
            'text-muted-foreground hover:bg-white/10 hover:text-foreground',
            'transition-all duration-200'
          )}
        >
          <AnimatePresence mode="wait">
            {collapsed ? (
              <motion.div
                key="expand"
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 90 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight className="w-4 h-4" />
              </motion.div>
            ) : (
              <motion.div
                key="collapse"
                initial={{ opacity: 0, rotate: 90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: -90 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="text-xs">Colapsar</span>
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </div>
    </motion.aside>
  )
}