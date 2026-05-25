import { requireRole } from '@/lib/auth'
import { RoleShell } from '@/components/role-shell'

export default async function TeacherDashboard() {
  const user = await requireRole('teacher')

  return (
    <RoleShell
      title="Panel del Docente"
      roleLabel="Docente"
      userName={user.full_name}
    >
      <div className="bg-white border rounded-lg p-6">
        <p className="text-muted-foreground">
          Bienvenido. Esta sección se desarrolla en la <strong>Semana 3</strong> del plan.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Incluirá: vista del salón, actividades, evaluaciones presenciales y estadísticas.
        </p>
      </div>
    </RoleShell>
  )
}
