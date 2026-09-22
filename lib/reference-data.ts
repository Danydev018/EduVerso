import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Caché de los datos de referencia del sistema.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * REGLA DE SEGURIDAD — leer antes de agregar algo acá.
 *
 * `unstable_cache` guarda UN resultado compartido por TODOS los usuarios del
 * servidor. Por eso acá solo pueden entrar tablas cuya política RLS de
 * SELECT sea `true`, es decir, que devuelvan exactamente las mismas filas
 * para cualquier usuario autenticado. Verificado en la base:
 *
 *   grades, subjects, topics, activity_templates, school_years,
 *   evaluation_categories, ship_parts  →  todas con `qual = true`
 *
 * NUNCA cachear acá nada filtrado por usuario (students, enrollments,
 * activities, activity_progress, student_points, presential_evaluations):
 * el primer docente en pedirlo llenaría la caché y el resto vería SUS datos.
 * Esas consultas siguen yendo a la base en cada request, con la sesión del
 * usuario y su RLS.
 *
 * Se usa `createAdminClient()` (sin RLS) a propósito: la consulta no debe
 * depender de las cookies del request, porque el resultado se comparte. Como
 * estas tablas son públicas para cualquier autenticado, el admin devuelve
 * las mismas filas que vería el usuario.
 * ─────────────────────────────────────────────────────────────────────────
 */

/** Etiquetas para invalidar con `revalidateTag` desde los Server Actions. */
export const CACHE_TAGS = {
  grades: 'ref:grades',
  subjects: 'ref:subjects',
  topics: 'ref:topics',
  templates: 'ref:templates',
  schoolYears: 'ref:school-years',
  evaluationCategories: 'ref:evaluation-categories',
  shipParts: 'ref:ship-parts',
} as const

/** Los grados no cambian nunca en la práctica: 1 día. */
export const getGrades = unstable_cache(
  async () => {
    const { data } = await createAdminClient().from('grades').select('id, name, tier').order('id')
    return data ?? []
  },
  ['ref-grades'],
  { tags: [CACHE_TAGS.grades], revalidate: 86400 },
)

export const getSubjects = unstable_cache(
  async () => {
    const { data } = await createAdminClient()
      .from('subjects')
      .select('id, name, grade_id')
      .order('name')
    return data ?? []
  },
  ['ref-subjects'],
  { tags: [CACHE_TAGS.subjects], revalidate: 3600 },
)

export const getTopics = unstable_cache(
  async () => {
    const { data } = await createAdminClient()
      .from('topics')
      .select('id, name, description, subject_id, order_index')
      .order('order_index')
    return data ?? []
  },
  ['ref-topics'],
  { tags: [CACHE_TAGS.topics], revalidate: 3600 },
)

export const getActivityTemplates = unstable_cache(
  async () => {
    const { data } = await createAdminClient()
      .from('activity_templates')
      .select('id, name, description, steps')
      .order('name')
    return data ?? []
  },
  ['ref-templates'],
  { tags: [CACHE_TAGS.templates], revalidate: 86400 },
)

/**
 * Año escolar activo. Se consulta en casi todas las páginas de los tres
 * paneles y cambia una vez al año, así que es la que más se gana cacheando.
 * La invalida `activateSchoolYear()` / `createSchoolYear()`.
 */
export const getCurrentSchoolYear = unstable_cache(
  async () => {
    const { data } = await createAdminClient()
      .from('school_years')
      .select('id, name, start_date, end_date')
      .eq('is_current', true)
      .maybeSingle()
    return data
  },
  ['ref-current-school-year'],
  { tags: [CACHE_TAGS.schoolYears], revalidate: 3600 },
)

export const getSchoolYears = unstable_cache(
  async () => {
    const { data } = await createAdminClient()
      .from('school_years')
      .select('id, name, start_date, end_date, is_current')
      .order('start_date', { ascending: false })
    return data ?? []
  },
  ['ref-school-years'],
  { tags: [CACHE_TAGS.schoolYears], revalidate: 3600 },
)

export const getEvaluationCategories = unstable_cache(
  async () => {
    const { data } = await createAdminClient()
      .from('evaluation_categories')
      .select('id, name, grade_id')
      .order('name')
    return data ?? []
  },
  ['ref-evaluation-categories'],
  { tags: [CACHE_TAGS.evaluationCategories], revalidate: 3600 },
)

/**
 * Piezas de la nave. Catálogo fijo: son las ocho partes que el alumno puede
 * reparar completando actividades. No se cachea `activity_bank` acá aunque
 * también sea contenido compartido, porque su RLS no es `true` (los alumnos
 * no lo ven) y además cada docente puede aportar las suyas.
 */
export const getShipParts = unstable_cache(
  async () => {
    const { data } = await createAdminClient()
      .from('ship_parts')
      .select('id, name, description, icon, color, order_index')
      .order('order_index')
    return data ?? []
  },
  ['ref-ship-parts'],
  { tags: [CACHE_TAGS.shipParts], revalidate: 86400 },
)
