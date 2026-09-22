import type { SupabaseClient } from '@supabase/supabase-js'
import { getShipParts } from '@/lib/reference-data'

/**
 * Estado de reparación de la nave del alumno.
 *
 * Cada pieza se conecta con las actividades que el docente le afilió
 * (`activities.ship_part_id`). El estado sale de cruzar esas actividades con
 * el progreso del alumno:
 *
 *   sin_asignar → el docente todavía no puso ninguna actividad en esa pieza.
 *                 Se muestra como hueco en el plano, pero NO es tocable: no
 *                 hay a dónde mandar al alumno y un botón muerto solo frustra.
 *   pendiente   → hay actividad(es) sin terminar. Tocarla lleva a la primera.
 *   reparada    → completó todas las actividades de esa pieza.
 *
 * Que una pieza sin asignar se vea igual que una pendiente sería mentirle al
 * alumno sobre lo que le falta hacer, así que son estados distintos.
 */

export type EstadoPieza = 'sin_asignar' | 'pendiente' | 'reparada'

export interface PiezaProgreso {
  id: string
  name: string
  description: string
  icon: string
  color: string
  estado: EstadoPieza
  /** Actividades que el docente afilió a esta pieza. */
  total: number
  completadas: number
  /** A dónde va el alumno al tocarla. `null` si no hay nada que hacer. */
  actividadId: string | null
  actividadTitulo: string | null
}

export interface ProgresoNave {
  piezas: PiezaProgreso[]
  reparadas: number
  /** Piezas que el docente puso en juego: las únicas sobre las que el alumno
   *  puede hacer algo, y por lo tanto el denominador honesto del progreso. */
  enJuego: number
}

interface FilaActividad {
  id: string
  title: string
  ship_part_id: string | null
  created_at: string
}

export async function getShipProgress(
  supabase: SupabaseClient,
  studentId: string,
  classroomId: string,
): Promise<ProgresoNave> {
  const piezasCatalogo = await getShipParts()

  // La RLS de `activities` ya filtra por salón, estado activo y ventana de
  // disponibilidad para un alumno, así que no hace falta repetirlo acá: lo
  // que vuelve es exactamente lo que este alumno puede hacer hoy.
  const { data: actividadesData } = await supabase
    .from('activities')
    .select('id, title, ship_part_id, created_at')
    .eq('classroom_id', classroomId)
    .not('ship_part_id', 'is', null)
    .order('created_at')

  const actividades = (actividadesData as FilaActividad[] | null) ?? []

  const completadas = new Set<string>()
  if (actividades.length > 0) {
    const { data: progresoData } = await supabase
      .from('activity_progress')
      .select('activity_id, completed_at')
      .eq('student_id', studentId)
      .in('activity_id', actividades.map((a) => a.id))

    for (const p of progresoData ?? []) {
      if (p.completed_at !== null) completadas.add(p.activity_id as string)
    }
  }

  const porPieza = new Map<string, FilaActividad[]>()
  for (const a of actividades) {
    const lista = porPieza.get(a.ship_part_id!) ?? []
    lista.push(a)
    porPieza.set(a.ship_part_id!, lista)
  }

  const piezas: PiezaProgreso[] = piezasCatalogo.map((p) => {
    const suyas = porPieza.get(p.id) ?? []
    const hechas = suyas.filter((a) => completadas.has(a.id)).length
    // La primera sin terminar: al tocar la pieza, el alumno cae donde
    // realmente le toca seguir, no en una que ya hizo.
    const siguiente = suyas.find((a) => !completadas.has(a.id)) ?? null

    const estado: EstadoPieza =
      suyas.length === 0 ? 'sin_asignar' : hechas === suyas.length ? 'reparada' : 'pendiente'

    return {
      id: p.id,
      name: p.name,
      description: p.description,
      icon: p.icon,
      color: p.color,
      estado,
      total: suyas.length,
      completadas: hechas,
      actividadId: siguiente?.id ?? null,
      actividadTitulo: siguiente?.title ?? null,
    }
  })

  return {
    piezas,
    reparadas: piezas.filter((p) => p.estado === 'reparada').length,
    enJuego: piezas.filter((p) => p.estado !== 'sin_asignar').length,
  }
}
