import type { SupabaseClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Fórmulas de XP y nivel — ver docs/08-gamificacion.md
//
// nivel = max(1, floor(sqrt(xp_total / 10)) + 1)
// XP necesario para llegar al nivel L: (L - 1)^2 * 10
// ---------------------------------------------------------------------------

export interface LevelProgress {
  level: number
  totalXp: number
  /** XP acumulado al inicio del nivel actual */
  xpForCurrentLevel: number
  /** XP acumulado necesario para alcanzar el siguiente nivel */
  xpForNextLevel: number
  /** XP ganado dentro del nivel actual */
  xpIntoLevel: number
  /** XP que separa al nivel actual del siguiente */
  xpNeededForLevel: number
  /** XP que falta para subir de nivel */
  xpToNext: number
  /** Porcentaje de progreso hacia el siguiente nivel (0-100) */
  progressPct: number
}

/** nivel = max(1, floor(sqrt(xp_total / 10)) + 1) — ver docs/08-gamificacion.md */
export function levelFromXp(totalXp: number): number {
  return Math.max(1, Math.floor(Math.sqrt(totalXp / 10)) + 1)
}

export function calculateLevelProgress(
  totalXp: number,
  level: number,
): LevelProgress {
  const xpForCurrentLevel = (level - 1) * (level - 1) * 10
  const xpForNextLevel = level * level * 10
  const xpIntoLevel = Math.max(0, totalXp - xpForCurrentLevel)
  const xpNeededForLevel = Math.max(1, xpForNextLevel - xpForCurrentLevel)
  const progressPct = Math.min(
    100,
    Math.round((xpIntoLevel / xpNeededForLevel) * 100),
  )
  const xpToNext = Math.max(0, xpForNextLevel - totalXp)

  return {
    level,
    totalXp,
    xpForCurrentLevel,
    xpForNextLevel,
    xpIntoLevel,
    xpNeededForLevel,
    xpToNext,
    progressPct,
  }
}

export interface StudentPoints {
  totalXp: number
  level: number
}

/**
 * Obtiene el XP y nivel del alumno para el año escolar activo. Devuelve
 * { totalXp: 0, level: 1 } si no hay año activo o el alumno todavía no
 * tiene registro en student_points (no ha completado ninguna actividad).
 */
export async function getStudentPoints(
  supabase: SupabaseClient,
  studentId: string,
): Promise<StudentPoints> {
  const { data: currentYear } = await supabase
    .from('school_years')
    .select('id')
    .eq('is_current', true)
    .maybeSingle()

  if (!currentYear) return { totalXp: 0, level: 1 }

  const { data: points } = await supabase
    .from('student_points')
    .select('total_xp, level')
    .eq('student_id', studentId)
    .eq('school_year_id', currentYear.id)
    .maybeSingle()

  const row = points as { total_xp: number; level: number } | null

  return {
    totalXp: row?.total_xp ?? 0,
    level: row?.level ?? 1,
  }
}
