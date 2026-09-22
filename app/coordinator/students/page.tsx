import Link from 'next/link'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StudentFilters } from './_components/student-filters'
import { Pagination } from '@/components/pagination'
import { getPageRange, getTotalPages } from '@/lib/pagination'
import { getCurrentSchoolYear, getGrades } from '@/lib/reference-data'

/** Forma que devuelve la consulta anidada de PostgREST. */
interface StudentQueryRow {
  id: string
  birth_date: string
  profiles: { full_name: string; is_active: boolean } | { full_name: string; is_active: boolean }[] | null
  enrollments?: Array<{
    id: string
    status: string
    school_year_id: string
    classrooms:
      | { id: string; section: string; grade_id: number; grades: { id: number; name: string } | null }
      | Array<{ id: string; section: string; grade_id: number; grades: { id: number; name: string } | null }>
      | null
  }>
}

function calculateAge(birthDate: string): number {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

const STATUS_LABELS: Record<string, { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary' }> = {
  active: { label: 'Activo', variant: 'success' },
  promoted: { label: 'Promovido', variant: 'secondary' },
  retained: { label: 'Repitente', variant: 'warning' },
  withdrawn: { label: 'Retirado', variant: 'destructive' },
}

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: {
    q?: string
    grade?: string
    section?: string
    status?: string
    page?: string
  }
}) {
  await requireRole('coordinator')
  const supabase = createClient()

  const { q, grade, section, status } = searchParams
  const { page, from, to } = getPageRange(searchParams.page)

  // El año activo sale de la caché de referencia (misma fila para todos los
  // usuarios, ver lib/reference-data.ts) en vez de consultarse en cada carga.
  const currentYear = await getCurrentSchoolYear()

  // Todos los filtros se aplican en Postgres. Es obligatorio para paginar:
  // si una parte se filtrara en memoria, el total y el corte de página
  // dejarían de coincidir con lo que realmente se muestra.
  //
  // `enrollments!inner` se usa SOLO cuando hay un filtro que depende de la
  // matrícula (grado, sección o estado de matrícula). Sin esos filtros se
  // usa el join normal, para no esconder a los alumnos sin salón asignado —
  // que son justamente los que la coordinadora necesita ver para asignarlos.
  const enrollmentStatus =
    status && !['active', 'inactive'].includes(status) ? status : undefined
  const needsInnerEnrollment = Boolean(grade || section || enrollmentStatus)
  const enrollmentJoin = needsInnerEnrollment ? 'enrollments!inner' : 'enrollments'
  const classroomJoin = needsInnerEnrollment ? 'classrooms!inner' : 'classrooms'

  const selectShape = `
      id,
      birth_date,
      profiles!inner(full_name, is_active),
      ${enrollmentJoin}(id, status, school_year_id, ${classroomJoin}(id, section, grade_id, grades(id, name)))
    `

  // Los filtros se aplican igual al conteo y a la página de datos, así que
  // viven en un solo lugar. El tipo del builder de PostgREST es demasiado
  // recursivo para encadenarlo genéricamente, de ahí el `any` acotado a esta
  // función (los nombres de columna sí se validan contra la base en runtime).
  type Filterable = {
    ilike: (col: string, val: string) => Filterable
    eq: (col: string, val: unknown) => Filterable
  }
  function applyFilters<T>(builder: T): T {
    let b = builder as unknown as Filterable
    if (q) b = b.ilike('profiles.full_name', `%${q}%`)
    if (status === 'active') b = b.eq('profiles.is_active', true)
    if (status === 'inactive') b = b.eq('profiles.is_active', false)
    if (currentYear?.id) b = b.eq('enrollments.school_year_id', currentYear.id)
    if (enrollmentStatus) b = b.eq('enrollments.status', enrollmentStatus)
    if (grade) b = b.eq('enrollments.classrooms.grade_id', Number(grade))
    if (section) b = b.eq('enrollments.classrooms.section', section)
    return b as unknown as T
  }

  const [grades, { count: totalRows }, { data: rawStudents }] = await Promise.all([
    // Grados: dato de referencia cacheado, igual para todos los usuarios.
    getGrades(),
    applyFilters(supabase.from('students').select(selectShape, { count: 'exact', head: true })),
    applyFilters(supabase.from('students').select(selectShape)).range(from, to),
  ])

  const totalPages = getTotalPages(totalRows)

  const students = ((rawStudents as StudentQueryRow[] | null) ?? []).map((s) => {
    const profile = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles
    const currentEnrollment = s.enrollments?.find((e) => e.school_year_id === currentYear?.id) ?? null
    const classroomRel = currentEnrollment?.classrooms
    const classroom = Array.isArray(classroomRel) ? classroomRel[0] : classroomRel
    return {
      id: s.id,
      full_name: profile?.full_name ?? '',
      is_active: profile?.is_active ?? false,
      birth_date: s.birth_date,
      age: calculateAge(s.birth_date),
      enrollment: currentEnrollment
        ? {
            id: currentEnrollment.id,
            status: currentEnrollment.status,
            section: classroom?.section ?? '',
            grade_id: classroom?.grade_id ?? null,
            grade_name: classroom?.grades?.name ?? '',
          }
        : null,
    }
  })

  // Ya no hay filtrado en memoria: todo se resolvió en la consulta de arriba,
  // que es lo que permite que el contador y la paginación sean correctos.
  const filtered = students

  // Las secciones del desplegable salen de los salones del año, NO de los
  // alumnos de la página actual: con paginación, derivarlas de la página
  // visible dejaría fuera secciones que sí existen y el filtro quedaría
  // incompleto según en qué página estuviera parada la coordinadora.
  const { data: sectionRows } = currentYear?.id
    ? await supabase
        .from('classrooms')
        .select('section')
        .eq('school_year_id', currentYear.id)
    : { data: [] as { section: string }[] }

  const sections = Array.from(
    new Set(((sectionRows as { section: string }[] | null) ?? []).map((c) => c.section)),
  ).sort()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Alumnos</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {totalRows ?? 0} alumno{totalRows === 1 ? '' : 's'}
            {totalPages > 1 && ` · página ${page} de ${totalPages}`}
          </p>
        </div>
        <Button asChild>
          <Link href="/coordinator/students/new">+ Nuevo alumno</Link>
        </Button>
      </div>

      <StudentFilters grades={grades ?? []} sections={sections as string[]} />

      <div className="glass-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[hsl(var(--border))]">
              <th className="text-left px-4 py-3 font-medium text-[hsl(var(--muted-foreground))]">Nombre</th>
              <th className="text-left px-4 py-3 font-medium text-[hsl(var(--muted-foreground))]">Edad</th>
              <th className="text-left px-4 py-3 font-medium text-[hsl(var(--muted-foreground))]">Grado / Sección</th>
              <th className="text-left px-4 py-3 font-medium text-[hsl(var(--muted-foreground))]">Estado</th>
              <th className="text-right px-4 py-3 font-medium text-[hsl(var(--muted-foreground))]">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[hsl(var(--border))]">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-10 text-[hsl(var(--muted-foreground))]">
                  No se encontraron alumnos
                </td>
              </tr>
            )}
            {filtered.map((student) => {
              const enrollStatus = student.enrollment?.status ?? (student.is_active ? 'active' : 'inactive')
              const statusInfo = STATUS_LABELS[enrollStatus] ?? { label: student.is_active ? 'Activo' : 'Inactivo', variant: student.is_active ? 'success' : 'secondary' }
              return (
                <tr key={student.id} className="hover:bg-[hsl(var(--primary)/0.03)] transition-colors">
                  <td className="px-4 py-3 font-medium text-[hsl(var(--foreground))]">{student.full_name}</td>
                  <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">{student.age} años</td>
                  <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">
                    {student.enrollment
                      ? `${student.enrollment.grade_name} — ${student.enrollment.section}`
                      : <span className="text-[hsl(var(--muted-foreground))] italic">Sin salón</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusInfo.variant as any}>{statusInfo.label}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/coordinator/students/${student.id}`}
                      className="text-[hsl(var(--primary))] hover:underline text-sm font-medium"
                    >
                      Ver / Editar
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        totalRows={totalRows ?? 0}
        basePath="/coordinator/students"
        searchParams={searchParams}
        itemLabel="alumnos"
      />
    </div>
  )
}
