import Link from 'next/link'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, School, BookOpen, Calendar } from 'lucide-react'

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
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Salones',
      value: classroomCount ?? 0,
      href: '/coordinator/classrooms',
      icon: School,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      title: 'Docentes',
      value: teacherCount ?? 0,
      href: '/coordinator/teachers',
      icon: BookOpen,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      title: 'Año escolar',
      value: currentYear?.name ?? 'Sin año activo',
      href: '/coordinator/school-years',
      icon: Calendar,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bienvenida, {user.full_name.split(' ')[0]}
        </h1>
        <p className="text-gray-500 mt-1">
          {currentYear ? `Año escolar activo: ${currentYear.name}` : 'No hay año escolar activo'}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ title, value, href, icon: Icon, color, bg }) => (
          <Link key={href} href={href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-2">
                <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center mb-2`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Acciones rápidas</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Link href="/coordinator/students/new" className="text-sm text-blue-600 hover:underline">
              + Registrar nuevo alumno
            </Link>
            <Link href="/coordinator/classrooms/new" className="text-sm text-blue-600 hover:underline">
              + Crear nuevo salón
            </Link>
            <Link href="/coordinator/teachers/new" className="text-sm text-blue-600 hover:underline">
              + Registrar docente
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
