import Link from 'next/link'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, School, BookOpen, Calendar } from 'lucide-react'
import {
  AnimatedContainer,
  AnimatedItem,
  AnimatedGrid,
} from '@/components/animated-container'

export default async function CoordinatorDashboard() {
  const user = await requireRole('coordinator')
  const supabase = createClient()

  const { data: currentYear } = await supabase
    .from('school_years')
    .select('id, name')
    .eq('is_current', true)
    .maybeSingle()

  const [{ count: studentCount }, { count: teacherCount }, { count: classroomCount }] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student')
        .eq('is_active', true),
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'teacher')
        .eq('is_active', true),
      currentYear?.id
        ? supabase
            .from('classrooms')
            .select('*', { count: 'exact', head: true })
            .eq('school_year_id', currentYear.id)
        : Promise.resolve({ count: 0, error: null }),
    ])

  const stats = [
    {
      title: 'Alumnos activos',
      value: studentCount ?? 0,
      href: '/coordinator/students',
      icon: Users,
      color: 'text-[hsl(var(--primary))]',
      bg: 'bg-[hsl(var(--primary)/0.1)]',
    },
    {
      title: 'Salones',
      value: classroomCount ?? 0,
      href: '/coordinator/classrooms',
      icon: School,
      color: 'text-[hsl(var(--secondary))]',
      bg: 'bg-[hsl(var(--secondary)/0.15)]',
    },
    {
      title: 'Docentes',
      value: teacherCount ?? 0,
      href: '/coordinator/teachers',
      icon: BookOpen,
      color: 'text-[hsl(var(--accent))]',
      bg: 'bg-[hsl(var(--accent)/0.12)]',
    },
    {
      title: 'Año escolar',
      value: currentYear?.name ?? 'Sin año activo',
      href: '/coordinator/school-years',
      icon: Calendar,
      color: 'text-[hsl(var(--primary))]',
      bg: 'bg-[hsl(var(--primary)/0.1)]',
    },
  ]

  return (
    <AnimatedContainer>
      <AnimatedItem>
        <h1 className="text-2xl font-bold text-foreground">
          Bienvenida, {user.full_name.split(' ')[0]}
        </h1>
        <p className="text-[hsl(var(--muted-foreground))] mt-1">
          {currentYear ? `Año escolar activo: ${currentYear.name}` : 'No hay año escolar activo'}
        </p>
      </AnimatedItem>

      <AnimatedGrid>
        {stats.map(({ title, value, href, icon: Icon, color, bg }) => (
          <AnimatedItem key={href}>
            <Link href={href}>
              <Card className="glass-card cursor-pointer hover:scale-[1.02] transition-all duration-200">
                <CardHeader className="pb-2">
                  <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center mb-2`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <CardTitle className="text-sm font-medium text-[hsl(var(--muted-foreground))]">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-foreground">{value}</p>
                </CardContent>
              </Card>
            </Link>
          </AnimatedItem>
        ))}
      </AnimatedGrid>

      <AnimatedItem>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">Acciones rápidas</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Link href="/coordinator/students/new" className="text-sm text-[hsl(var(--primary))] hover:underline font-medium">
                + Registrar nuevo alumno
              </Link>
              <Link href="/coordinator/classrooms/new" className="text-sm text-[hsl(var(--primary))] hover:underline font-medium">
                + Crear nuevo salón
              </Link>
              <Link href="/coordinator/teachers/new" className="text-sm text-[hsl(var(--primary))] hover:underline font-medium">
                + Registrar docente
              </Link>
            </CardContent>
          </Card>
        </div>
      </AnimatedItem>
    </AnimatedContainer>
  )
}
