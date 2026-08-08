import { requireRole } from '@/lib/auth'

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireRole('student')

  return (
    <div data-theme="student" className="min-h-screen flex flex-col font-sans">
      {children}
    </div>
  )
}
