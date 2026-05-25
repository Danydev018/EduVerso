import { LogoutButton } from './logout-button'

export function RoleShell({
  title,
  roleLabel,
  userName,
  children,
}: {
  title: string
  roleLabel: string
  userName: string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white">
        <div className="container mx-auto flex items-center justify-between py-3">
          <div>
            <h1 className="text-lg font-bold">EduVerso</h1>
            <p className="text-xs text-muted-foreground">{roleLabel}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {userName}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto py-6">
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        {children}
      </main>
    </div>
  )
}
