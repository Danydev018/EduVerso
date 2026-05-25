import { requireRole } from '@/lib/auth'

export default async function CoordinatorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireRole('coordinator')
  return <>{children}</>
}
