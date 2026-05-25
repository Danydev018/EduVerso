import { requireRole } from '@/lib/auth'
import { RoleShell } from '@/components/role-shell'

export default async function StudentDashboard() {
  const user = await requireRole('student')

  return (
    <RoleShell
      title="¡Hola!"
      roleLabel="Estudiante"
      userName={user.full_name}
    >
      <div className="bg-white border rounded-lg p-6">
        <p className="text-muted-foreground">
          Bienvenido. Esta sección se desarrolla a partir de la <strong>Semana 4</strong> del plan.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Aquí verás tus actividades disponibles, tu nivel, XP y leaderboard.
        </p>
      </div>
    </RoleShell>
  )
}
