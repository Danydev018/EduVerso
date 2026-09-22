import Link from 'next/link'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getCurrentSchoolYear } from '@/lib/reference-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, School, BookOpen, Calendar, ArrowRight } from 'lucide-react'
import { CleanSnapshotsButton } from './_components/clean-snapshots-button'

interface ClassroomRow {
  id: string
  section: string
  grade_id: number
  grades: { name: string } | { name: string }[] | null
}

export default async function CoordinatorDashboard() {
  const user = await requireRole('coordinator')
  const supabase = createClient()

  // Año escolar activo: cacheado en lib/reference-data.ts
  const currentYear = await getCurrentSchoolYear()

  const [
    { count: studentCount },
    { count: teacherCount },
    { data: classroomsData },
    { data: enrollmentRows },
  ] = await Promise.all([
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
    // Los salones del año activo se listan además de contarse: la tabla de
    // ocupación de abajo es la información que la coordinadora realmente
    // usa, y sale de la misma consulta que antes solo servía para un número.
    currentYear?.id
      ? supabase
          .from('classrooms')
          .select('id, section, grade_id, grades(name)')
          .eq('school_year_id', currentYear.id)
          .order('grade_id')
          .order('section')
      : Promise.resolve({ data: [] as ClassroomRow[] }),
    currentYear?.id
      ? supabase
          .from('enrollments')
          .select('classroom_id')
          .eq('school_year_id', currentYear.id)
          .eq('status', 'active')
      : Promise.resolve({ data: [] as { classroom_id: string }[] }),
  ])

  const classrooms = (classroomsData as ClassroomRow[] | null) ?? []

  // Alumnos por salón en un solo recorrido
  const porSalon = new Map<string, number>()
  for (const e of (enrollmentRows as { classroom_id: string }[] | null) ?? []) {
    porSalon.set(e.classroom_id, (porSalon.get(e.classroom_id) ?? 0) + 1)
  }

  const stats = [
    {
      title: 'Alumnos activos',
      value: studentCount ?? 0,
      href: '/coordinator/students',
      icon: Users,
      color: 'text-[hsl(var(--primary))]',
    },
    {
      title: 'Salones',
      value: classrooms.length,
      href: '/coordinator/classrooms',
      icon: School,
      color: 'text-[hsl(var(--secondary))]',
    },
    {
      title: 'Docentes',
      value: teacherCount ?? 0,
      href: '/coordinator/teachers',
      icon: BookOpen,
      color: 'text-[hsl(var(--accent))]',
    },
    {
      title: 'Año escolar',
      value: currentYear?.name ?? 'Sin año activo',
      href: '/coordinator/school-years',
      icon: Calendar,
      color: 'text-[hsl(var(--primary))]',
      small: true,
    },
  ]

  // Layout de una sola pantalla: cuatro tiles compactos arriba y dos columnas
  // debajo, en vez de tarjetas de ancho completo apiladas que obligaban a
  // scrollear para llegar a las acciones rápidas.
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h1 className="text-xl font-bold text-foreground">
          Bienvenida al panel de coordinación, {user.full_name.split(' ')[0]}
        </h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          {currentYear ? `Año escolar activo: ${currentYear.name}` : 'No hay año escolar activo'}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(({ title, value, href, icon: Icon, color, small }) => (
          <Link
            key={href}
            href={href}
            className="rounded-lg border border-border bg-card px-3 py-2.5 hover:border-[hsl(var(--primary)/0.4)] transition-colors min-w-0"
          >
            <div className="flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))]">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="truncate">{title}</span>
            </div>
            <p
              className={`font-bold text-foreground mt-0.5 truncate ${small ? 'text-base' : 'text-2xl'}`}
            >
              {value}
            </p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        {/* Ocupación de salones: el dato operativo que antes no estaba en
            ningún lado del inicio y obligaba a entrar a "Salones". */}
        <Card className="lg:col-span-7">
          <CardHeader className="py-2.5 px-4">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <School className="w-4 h-4" />
                Salones del año
              </CardTitle>
              <Link
                href="/coordinator/classrooms"
                className="text-xs text-[hsl(var(--primary))] hover:underline flex items-center gap-1 flex-shrink-0"
              >
                Ver todo
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-0">
            {classrooms.length === 0 ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))] py-3 text-center">
                No hay salones creados para este año.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {classrooms.slice(0, 6).map((c) => {
                  const gradeRel = c.grades
                  const gradeName =
                    (Array.isArray(gradeRel) ? gradeRel[0] : gradeRel)?.name ?? ''
                  const alumnos = porSalon.get(c.id) ?? 0
                  return (
                    <Link
                      key={c.id}
                      href={`/coordinator/classrooms/${c.id}`}
                      className="flex items-center justify-between gap-3 py-2 -mx-2 px-2 rounded hover:bg-[hsl(var(--primary)/0.05)] transition-colors"
                    >
                      <p className="text-sm font-medium text-foreground truncate">
                        {gradeName} — Sección {c.section}
                      </p>
                      <span className="text-xs text-[hsl(var(--muted-foreground))] flex-shrink-0 tabular-nums">
                        {alumnos} alumno{alumnos === 1 ? '' : 's'}
                      </span>
                    </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-5 flex flex-col gap-3">
          <Card>
            <CardHeader className="py-2.5 px-4">
              <CardTitle className="text-sm">Acciones rápidas</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3 pt-0 flex flex-col gap-1.5">
              <Link
                href="/coordinator/students/new"
                className="text-sm text-[hsl(var(--primary))] hover:underline font-medium"
              >
                + Registrar nuevo alumno
              </Link>
              <Link
                href="/coordinator/classrooms/new"
                className="text-sm text-[hsl(var(--primary))] hover:underline font-medium"
              >
                + Crear nuevo salón
              </Link>
              <Link
                href="/coordinator/teachers/new"
                className="text-sm text-[hsl(var(--primary))] hover:underline font-medium"
              >
                + Registrar docente
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-2.5 px-4">
              <CardTitle className="text-sm">Mantenimiento</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3 pt-0">
              <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2">
                Los alumnos egresados quedan en el leaderboard hasta 2 años después
                del cierre de su año escolar. Los snapshots vencidos no se borran
                automáticamente todavía.
              </p>
              <CleanSnapshotsButton />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
