import { requireRole } from '@/lib/auth'
import { RoleShell } from '@/components/role-shell'

export default async function CoordinatorDashboard() {
  const user = await requireRole('coordinator')

  return (
    <RoleShell
      title="Panel de Coordinación"
      roleLabel="Coordinación"
      userName={user.full_name}
    >
      <div className="bg-white border rounded-lg p-6">
        <p className="text-muted-foreground">
          Bienvenido. Esta sección se desarrolla en la <strong>Semana 2</strong> del plan.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Incluirá: gestión de estudiantes, salones, docentes y año escolar.
        </p>
      </div>
    </RoleShell>
  )
}
