import { requireRole } from '@/lib/auth'
import { CoordinatorSidebar } from '@/components/coordinator-sidebar'
import { AnimatedMain } from '@/components/animated-main'
import { LogoutButton } from '@/components/logout-button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import BackgroundEffects from '@/components/background-effects'

export default async function CoordinatorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireRole('coordinator')

  return (
    <div
      className="min-h-screen flex relative"
      data-theme="admin"
    >
      <BackgroundEffects />
      <CoordinatorSidebar />
      
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur-md h-16 flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-foreground">
              Panel de Coordinación
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                <AvatarFallback className="bg-primary text-white text-sm">
                  {user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-foreground">{user.full_name}</p>
                <p className="text-xs text-muted-foreground">Coordinador</p>
              </div>
            </div>
            <LogoutButton />
          </div>
        </header>

        {/* Main Content with Animation */}
        <AnimatedMain>
          {children}
        </AnimatedMain>
      </div>
    </div>
  )
}
