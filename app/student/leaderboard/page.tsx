import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getCurrentSchoolYear } from '@/lib/reference-data'
import { getStudentPoints } from '@/lib/gamification'
import {
  getClassroomLeaderboard,
  getTierLeaderboard,
  type Tier,
} from '@/lib/leaderboard'
import { StudentShell } from '../_components/student-shell'
import { LeaderboardTabs } from './_components/leaderboard-tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Rocket } from 'lucide-react'

export default async function StudentLeaderboardPage() {
  const user = await requireRole('student')
  const supabase = createClient()

  const points = await getStudentPoints(supabase, user.id)

  const currentYear = await getCurrentSchoolYear()

  if (!currentYear) {
    return (
      <StudentShell userName={user.full_name} level={points.level} totalXp={points.totalXp}>
        <EmptyState message="No hay un año escolar activo todavía." />
      </StudentShell>
    )
  }

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('classroom_id')
    .eq('student_id', user.id)
    .eq('school_year_id', currentYear.id)
    .eq('status', 'active')
    .maybeSingle()

  if (!enrollment) {
    return (
      <StudentShell userName={user.full_name} level={points.level} totalXp={points.totalXp}>
        <EmptyState message="Todavía no tienes un salón asignado." />
      </StudentShell>
    )
  }

  const { data: classroom } = await supabase
    .from('classrooms')
    .select('grade_id')
    .eq('id', enrollment.classroom_id)
    .maybeSingle()

  const { data: grade } = classroom
    ? await supabase
        .from('grades')
        .select('tier')
        .eq('id', classroom.grade_id)
        .maybeSingle()
    : { data: null }

  const ownTier = (grade?.tier ?? 'bronze') as Tier

  const [classroomEntries, ownTierLeaderboard, bronze, silver, gold] =
    await Promise.all([
      getClassroomLeaderboard(
        supabase,
        enrollment.classroom_id,
        currentYear.id,
        user.id,
      ),
      getTierLeaderboard(supabase, ownTier, currentYear.id, user.id),
      getTierLeaderboard(supabase, 'bronze', currentYear.id, user.id),
      getTierLeaderboard(supabase, 'silver', currentYear.id, user.id),
      getTierLeaderboard(supabase, 'gold', currentYear.id, user.id),
    ])

  return (
    <StudentShell userName={user.full_name} level={points.level} totalXp={points.totalXp}>
      <div className="text-center mb-6">
        <p className="text-sm text-indigo-500 font-medium flex items-center justify-center gap-1.5">
          <Rocket className="w-4 h-4" />
          Ranking de exploradores
        </p>
        <h1 className="font-heading text-2xl font-bold text-indigo-950">La Flota</h1>
      </div>
      <LeaderboardTabs
        classroomEntries={classroomEntries}
        ownTier={ownTier}
        ownTierLeaderboard={ownTierLeaderboard}
        institution={{ bronze, silver, gold }}
      />
    </StudentShell>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card className="rounded-2xl border-indigo-100">
      <CardContent className="py-12 text-center">
        <Rocket className="w-12 h-12 text-indigo-300 mx-auto mb-4" />
        <p className="text-indigo-500">{message}</p>
      </CardContent>
    </Card>
  )
}
