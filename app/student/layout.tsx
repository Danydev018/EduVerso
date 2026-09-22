import { requireRole } from '@/lib/auth'
import { BackgroundMusic } from './_components/background-music'

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireRole('student')

  return (
    <div data-theme="student" className="min-h-screen flex flex-col font-sans">
      {children}
      {/* En el layout y no en StudentShell: el layout no se re-monta al
          navegar, así que la música no se corta entre pantallas. */}
      <BackgroundMusic />
    </div>
  )
}
