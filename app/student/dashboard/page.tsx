import Link from 'next/link'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { StudentShell } from '../_components/student-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trophy, Sparkles, BookOpen, ArrowRight } from 'lucide-react'

export default async function StudentDashboard() {
  const user = await requireRole('student')
  const supabase = createClient()

  const { data: currentYear } = await supabase
    .from('school_years')
    .select('id')
    .eq('is_current', true)
    .maybeSingle()

  const { data: points } = currentYear
    ? await supabase
        .from('student_points')
        .select('total_xp, level')
        .eq('student_id', user.id)
        .eq('school_year_id', currentYear.id)
        .maybeSingle()
    : { data: null as { total_xp: number; level: number } | null }

  const totalXp = points?.total_xp ?? 0
  const level = points?.level ?? 1

  const xpForCurrentLevel = (level - 1) * (level - 1) * 10
  const xpForNextLevel = level * level * 10
  const xpIntoLevel = Math.max(0, totalXp - xpForCurrentLevel)
  const xpNeededForLevel = Math.max(1, xpForNextLevel - xpForCurrentLevel)
  const progressPct = Math.min(
    100,
    Math.round((xpIntoLevel / xpNeededForLevel) * 100),
  )
  const xpToNext = Math.max(0, xpForNextLevel - totalXp)

  return (
    <StudentShell userName={user.full_name} title={`¡Hola, ${user.full_name.split(' ')[0]}!`}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-gray-500">Tu nivel</p>
                <p className="text-4xl font-bold text-blue-600">
                  {level}
                </p>
              </div>
              <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center">
                <Trophy className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
            <div className="mt-5 space-y-2">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>{xpIntoLevel} / {xpNeededForLevel} XP</span>
                <span>
                  {xpToNext > 0
                    ? `${xpToNext} XP para nivel ${level + 1}`
                    : '¡Al máximo!'}
                </span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-purple-100 flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6 text-purple-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {totalXp.toLocaleString('es-AR')}
            </p>
            <p className="text-sm text-gray-500">XP totales</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardContent className="p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                ¿Listo para una actividad?
              </p>
              <p className="text-sm text-gray-500">
                Mirá qué tareas tenés disponibles.
              </p>
            </div>
          </div>
          <Button asChild>
            <Link href="/student/activities">
              Ir a actividades
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </StudentShell>
  )
}
