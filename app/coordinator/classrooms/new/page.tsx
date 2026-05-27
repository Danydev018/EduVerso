import Link from 'next/link'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { NewClassroomForm } from './_components/new-classroom-form'

export default async function NewClassroomPage() {
  await requireRole('coordinator')
  const supabase = createClient()

  const [{ data: currentYear }, { data: grades }, { data: teacherProfiles }] = await Promise.all([
    supabase.from('school_years').select('id, name').eq('is_current', true).maybeSingle(),
    supabase.from('grades').select('id, name').order('id'),
    supabase.from('profiles').select('id, full_name').eq('role', 'teacher').eq('is_active', true).order('full_name'),
  ])

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link href="/coordinator/classrooms" className="text-sm text-blue-600 hover:underline">
          ← Volver a salones
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Crear salón</h1>
        {currentYear && (
          <p className="text-sm text-gray-500 mt-1">Año escolar activo: {currentYear.name}</p>
        )}
      </div>

      {!currentYear ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
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
