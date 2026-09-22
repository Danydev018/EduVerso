import Link from 'next/link'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getCurrentSchoolYear, getGrades } from '@/lib/reference-data'
import { NewClassroomForm } from './_components/new-classroom-form'

export default async function NewClassroomPage() {
  await requireRole('coordinator')
  const supabase = createClient()

  const [currentYear, grades, { data: teacherProfiles }] = await Promise.all([
    // Año escolar y grados vienen de la caché de referencia (lib/reference-data.ts)
    getCurrentSchoolYear(),
    getGrades(),
    supabase.from('profiles').select('id, full_name').eq('role', 'teacher').eq('is_active', true).order('full_name'),
  ])

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link href="/coordinator/classrooms" className="text-sm text-[hsl(var(--primary))] hover:underline">
          ← Volver a salones
        </Link>
        <h1 className="text-2xl font-bold text-[hsl(var(--foreground))] mt-2">Crear salón</h1>
        {currentYear && (
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">Año escolar activo: {currentYear.name}</p>
        )}
      </div>

      {!currentYear ? (
        <div className="bg-[hsl(var(--accent)/0.1)] border border-[hsl(var(--accent)/0.3)] rounded-lg p-4 text-sm text-[hsl(var(--accent))]">
          Primero debes{' '}
          <Link href="/coordinator/school-years" className="underline">
            activar un año escolar
          </Link>{' '}
          para crear salones.
        </div>
      ) : (
        <NewClassroomForm
          currentYear={currentYear}
          grades={grades ?? []}
          teachers={teacherProfiles ?? []}
        />
      )}
    </div>
  )
}
