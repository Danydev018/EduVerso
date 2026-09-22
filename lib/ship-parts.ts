import {
  Rocket,
  Compass,
  Zap,
  Shield,
  HeartPulse,
  RadioTower,
  Radar,
  Package,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

/**
 * Piezas de la nave: puente entre el dato de la base y su ícono.
 *
 * `ship_parts.icon` guarda el nombre del ícono como texto porque la base no
 * puede guardar un componente. Este mapa es explícito a propósito: importar
 * lucide por nombre dinámico arrastraría toda la librería al bundle, que es
 * justo lo que se corrigió al sacar el barrel de `radix-ui`.
 */
const ICONS: Record<string, LucideIcon> = {
  Rocket,
  Compass,
  Zap,
  Shield,
  HeartPulse,
  RadioTower,
  Radar,
  Package,
}

export interface ShipPart {
  id: string
  name: string
  description: string
  icon: string
  color: string
  order_index: number
}

/** Ícono de una pieza. `Wrench` cubre el caso de una pieza nueva sin mapear. */
export function shipPartIcon(icon: string | null | undefined): LucideIcon {
  return (icon && ICONS[icon]) || Wrench
}
