import type { SupabaseClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Queries de leaderboard — ver docs/08-gamificacion.md
//
// profiles/enrollments/classrooms NO son de lectura pública bajo RLS (solo
// student_points y leaderboard_snapshots lo son — ver docs/04-seguridad-
// roles.md). Por eso estas funciones llaman a los RPC `get_classroom_
// leaderboard` / `get_tier_leaderboard` (SECURITY DEFINER, ver
// supabase/migrations/05_leaderboard.sql) en vez de hacer los joins acá:
// un alumno no puede leer los perfiles/matrículas de sus compañeros
// directamente, así que el join tiene que ocurrir del lado de la base de
// datos con privilegios elevados, igual que owns_classroom()/my_classroom_id().
// ---------------------------------------------------------------------------

export type Tier = 'bronze' | 'silver' | 'gold'

export interface LeaderboardEntry {
  id: string
  name: string
  totalXp: number
  level: number
  position: number
  isGraduated: boolean
  isCurrentUser: boolean
}

function rank(
  entries: { id: string; name: string; totalXp: number; level: number; isGraduated: boolean }[],
  currentStudentId: string,
): LeaderboardEntry[] {
  return [...entries]
    .sort((a, b) => b.totalXp - a.totalXp)
    .map((e, i) => ({
      ...e,
      position: i + 1,
      isCurrentUser: !e.isGraduated && e.id === currentStudentId,
    }))
}

/**
 * Leaderboard del salón: solo alumnos matriculados activos en ese salón y
 * año escolar. No incluye egresados — cuando un alumno se retira, ya no
 * pertenece a este salón.
 */
export async function getClassroomLeaderboard(
  supabase: SupabaseClient,
  classroomId: string,
  schoolYearId: string,
  currentStudentId: string,
): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase.rpc('get_classroom_leaderboard', {
    p_classroom_id: classroomId,
    p_school_year_id: schoolYearId,
  })

  if (error || !data) return []

  const entries = (
    data as { student_id: string; full_name: string; total_xp: number; level: number }[]
  ).map((row) => ({
    id: row.student_id,
    name: row.full_name,
    totalXp: row.total_xp,
    level: row.level,
    isGraduated: false,
  }))

  return rank(entries, currentStudentId)
}

/**
 * Leaderboard por tier (bronce/plata/oro): combina alumnos activos de
 * cualquier salón de ese tier con snapshots de egresados no expirados del
 * mismo tier. Devuelve el top 15 y, si el alumno actual no está entre
 * ellos, su propia posición aparte.
 */
export async function getTierLeaderboard(
  supabase: SupabaseClient,
  tier: Tier,
  schoolYearId: string,
  currentStudentId: string,
): Promise<{ top: LeaderboardEntry[]; ownEntry: LeaderboardEntry | null }> {
  const { data, error } = await supabase.rpc('get_tier_leaderboard', {
    p_tier: tier,
    p_school_year_id: schoolYearId,
  })

  if (error || !data) return { top: [], ownEntry: null }

  const entries = (
    data as {
      id: string
      full_name: string
      total_xp: number
      level: number
      is_graduated: boolean
    }[]
  ).map((row) => ({
    id: row.id,
    name: row.full_name,
    totalXp: row.total_xp,
    level: row.level,
    isGraduated: row.is_graduated,
  }))

  const ranked = rank(entries, currentStudentId)
  const top = ranked.slice(0, 15)
  const ownEntry = ranked.find((e) => e.isCurrentUser) ?? null

  return { top, ownEntry: top.some((e) => e.isCurrentUser) ? null : ownEntry }
}
