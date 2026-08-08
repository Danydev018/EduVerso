import Link from 'next/link'
import { requireRole } from '@/lib/auth'
import { NewTeacherForm } from './_components/new-teacher-form'

export default async function NewTeacherPage() {
  await requireRole('coordinator')

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link href="/coordinator/teachers" className="text-sm text-[hsl(var(--primary))] hover:underline">
          ← Volver a docentes
        </Link>
        <h1 className="text-2xl font-bold text-[hsl(var(--foreground))] mt-2">Registrar docente</h1>
      </div>
      <NewTeacherForm />
    </div>
  )
}
