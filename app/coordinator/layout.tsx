import { requireRole } from '@/lib/auth'
import { CoordinatorSidebar } from '@/components/coordinator-sidebar'
import BackgroundEffects from '@/components/background-effects'

export default async function CoordinatorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireRole('coordinator')

  return (
    <div className="min-h-screen flex relative" data-theme="admin">
      <BackgroundEffects />

      {/* La cuenta y el cierre de sesión viven en el pie del sidebar. Antes
          había además una barra superior fija de 64 px que solo repetía el
          título del panel y esos dos elementos: se quitó para devolverle esa
          franja al contenido, que es lo que la coordinadora necesita ver. */}
      <CoordinatorSidebar userName={user.full_name} />

      <main className="admin-fade-in flex-1 p-4 overflow-auto min-w-0">
        {children}
      </main>
    </div>
  )
}
