import { PALETA, Apoyo, type Pieza } from './lesson-art'

/**
 * Escuela, transporte, lugares y símbolos del lenguaje.
 *
 * Mismas reglas de estilo que `lesson-art.tsx`: base en y=0, centro en x=0,
 * luz de arriba a la izquierda, volumen + apoyo + reflejo.
 *
 * SOBRE LOS VEHÍCULOS: van de perfil y con las ruedas tocando y=0, para que
 * apoyen en el mismo suelo que las personas y los árboles. Un carro en tres
 * cuartos se ve mejor suelto pero no se puede alinear con nada.
 */

// ── Escuela y objetos ──────────────────────────────────────────────────────

export function Mochila({ x, y, s = 1, color = '#3B82F6' }: Pieza & { color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={16} />
      <path d="M-12,-36 Q-12,-46 0,-46 Q12,-46 12,-36" fill="none" stroke={color} strokeWidth="3.4" />
      <path d="M-16,-40 Q-16,-46 -10,-46 L-10,-30 Z" fill="#1D4ED8" />
      <path d="M-16,-38 Q0,-48 16,-38 L16,-4 Q16,0 12,0 L-12,0 Q-16,0 -16,-4 Z" fill={color} filter="url(#la-sombra)" />
      <path d="M-13,-16 L13,-16 L13,-2 L-13,-2 Z" fill="#1E40AF" />
      <rect x={-5} y={-11} width={10} height={4} rx={1.5} fill="#E2E8F0" />
      <path d="M-12,-34 Q0,-42 12,-34" stroke="#FFFFFF" strokeWidth="2" fill="none" opacity="0.28" strokeLinecap="round" />
    </g>
  )
}

export function Pizarron({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={26} />
      <path d="M-10,-12 L-20,0 M10,-12 L20,0" stroke="#78350F" strokeWidth="3" strokeLinecap="round" />
      <rect x={-30} y={-48} width={60} height={38} rx={2} fill="#78350F" filter="url(#la-sombra)" />
      <rect x={-26} y={-44} width={52} height={28} rx={1} fill="#166534" />
      <path d="M-20,-36 L4,-36 M-20,-30 L12,-30 M-20,-24 L-4,-24" stroke="#FFFFFF" strokeWidth="1.4" opacity="0.75" strokeLinecap="round" />
      <rect x={-26} y={-15} width={52} height={3} fill="#92400E" />
      <rect x={-10} y={-14} width={7} height={2} rx={1} fill="#F8FAFC" />
      <path d="M-24,-42 L-24,-20" stroke="#FFFFFF" strokeWidth="2" opacity="0.12" strokeLinecap="round" />
    </g>
  )
}

export function Tijeras({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={1} ancho={12} />
      <path d="M-6,-14 L-14,-42" stroke="url(#la-metal)" strokeWidth="5" strokeLinecap="round" />
      <path d="M6,-14 L14,-42" stroke="url(#la-metal)" strokeWidth="5" strokeLinecap="round" />
      <path d="M-6,-14 L-14,-42" stroke="#94A3B8" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
      <circle cx={-8} cy={-7} r={6.5} fill="none" stroke="#F97316" strokeWidth="3.4" />
      <circle cx={8} cy={-7} r={6.5} fill="none" stroke="#F97316" strokeWidth="3.4" />
      <circle cx={0} cy={-17} r={2.4} fill="#64748B" />
      <path d="M-12,-38 L-8,-22" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.6" strokeLinecap="round" />
    </g>
  )
}

export function Pegamento({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={11} />
      <rect x={-9} y={-30} width={18} height={30} rx={3} fill="#F8FAFC" filter="url(#la-sombra)" />
      <rect x={-9} y={-24} width={18} height={16} fill="#F97316" />
      <path d="M-5,-19 L5,-19 M-5,-15 L3,-15" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />
      <rect x={-4} y={-38} width={8} height={9} rx={2} fill="#EA580C" />
      <path d="M-2,-42 Q0,-46 2,-42 L2,-38 L-2,-38 Z" fill="#FDBA74" />
      <rect x={-9} y={-30} width={4} height={30} fill="#FFFFFF" opacity="0.5" />
    </g>
  )
}

export function Escuadra({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={-4} y={1} ancho={20} />
      <path d="M-24,0 L24,0 L-24,-34 Z" fill="#93C5FD" opacity="0.85" stroke={PALETA.tinta} strokeWidth="1.2" filter="url(#la-sombra)" />
      <path d="M-18,0 L-18,-4 M-12,0 L-12,-4 M-6,0 L-6,-4 M0,0 L0,-4 M6,0 L6,-4 M12,0 L12,-4 M18,0 L18,-4" stroke={PALETA.tinta} strokeWidth="0.8" />
      <path d="M-24,-8 L-20,-8 M-24,-16 L-20,-16 M-24,-24 L-20,-24" stroke={PALETA.tinta} strokeWidth="0.8" />
      <path d="M-20,-3 L-20,-7 L-16,-7" fill="none" stroke={PALETA.tinta} strokeWidth="0.9" />
      <path d="M-22,-28 L-22,-6" stroke="#FFFFFF" strokeWidth="1.6" opacity="0.5" strokeLinecap="round" />
    </g>
  )
}

export function GloboTerraqueo({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={16} />
      <path d="M-13,0 L13,0 L9,-5 L-9,-5 Z" fill="#78350F" />
      <path d="M0,-5 L0,-12" stroke="#78350F" strokeWidth="3" />
      <path d="M17,-32 A19,19 0 1 1 -3,-13" fill="none" stroke="url(#la-metal)" strokeWidth="3.4" strokeLinecap="round" />
      <circle cx={0} cy={-32} r={17} fill="url(#la-agua)" filter="url(#la-sombra)" />
      <path d="M-13,-38 Q-6,-44 0,-40 Q-4,-33 -12,-32 Z" fill="#22C55E" />
      <path d="M4,-30 Q11,-34 14,-27 Q9,-22 4,-25 Z" fill="#22C55E" />
      <path d="M-9,-24 Q-3,-22 0,-18" stroke="#22C55E" strokeWidth="3.4" fill="none" strokeLinecap="round" />
      <path d="M-11,-40 Q-4,-46 4,-44 Q-4,-40 -8,-33 Z" fill="#FFFFFF" opacity="0.35" />
    </g>
  )
}

export function Microscopio({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={18} />
      <path d="M-16,0 L16,0 L12,-6 L-12,-6 Z" fill="#475569" filter="url(#la-sombra)" />
      <path d="M-4,-6 Q10,-14 8,-30" stroke="#64748B" strokeWidth="5" fill="none" strokeLinecap="round" />
      <rect x={-14} y={-20} width={20} height={3.4} rx={1} fill="#334155" />
      <rect x={-8} y={-22} width={9} height={2.4} fill="#E2E8F0" />
      <path d="M2,-32 L14,-46 L20,-41 L8,-28 Z" fill="#334155" />
      <circle cx={17} cy={-44} r={4.4} fill="url(#la-metal)" />
      <path d="M4,-24 L8,-20" stroke="#94A3B8" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M6,-30 Q9,-38 12,-42" stroke="#FFFFFF" strokeWidth="1.4" opacity="0.3" fill="none" strokeLinecap="round" />
    </g>
  )
}

export function Iman({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={18} />
      <path d="M-17,0 L-17,-16 A17,17 0 0 1 17,-16 L17,0 L7,0 L7,-16 A7,7 0 0 0 -7,-16 L-7,0 Z"
        fill="#DC2626" filter="url(#la-sombra)" />
      <rect x={-17} y={-6} width={10} height={6} fill="#CBD5E1" />
      <rect x={7} y={-6} width={10} height={6} fill="#CBD5E1" />
      <path d="M-15,-18 A15,15 0 0 1 -3,-30" stroke="#FFFFFF" strokeWidth="2.4" fill="none" opacity="0.35" strokeLinecap="round" />
    </g>
  )
}

export function Pila({ x, y, s = 1, carga = 0.7 }: Pieza & { carga?: number }) {
  const t = Math.max(0, Math.min(1, carga))
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={11} />
      <rect x={-4} y={-44} width={8} height={5} rx={1.5} fill="url(#la-metal)" />
      <rect x={-11} y={-39} width={22} height={39} rx={3} fill="#1E293B" filter="url(#la-sombra)" />
      <rect x={-8} y={-36} width={16} height={33} rx={2} fill="#334155" />
      <rect x={-8} y={-3 - 33 * t} width={16} height={33 * t} rx={2} fill="#22C55E" />
      <path d="M2,-30 L-4,-18 L1,-18 L-2,-8 L5,-21 L0,-21 Z" fill="#FDE047" />
      <rect x={-11} y={-39} width={4} height={39} fill="#FFFFFF" opacity="0.14" />
    </g>
  )
}

export function Lupa({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={4} y={1} ancho={10} />
      <path d="M8,-14 L18,-2" stroke="#78350F" strokeWidth="6" strokeLinecap="round" />
      <circle cx={-2} cy={-26} r={16} fill="url(#la-vidrio)" stroke="url(#la-metal)" strokeWidth="4" />
      <circle cx={-2} cy={-26} r={13} fill="#DBEAFE" opacity="0.4" />
      <path d="M-12,-32 Q-6,-38 1,-36 Q-6,-32 -9,-25 Z" fill="#FFFFFF" opacity="0.6" />
    </g>
  )
}

export function Cuaderno({ x, y, s = 1, color = '#6366F1' }: Pieza & { color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={16} />
      <rect x={-16} y={-42} width={32} height={42} rx={2} fill={color} filter="url(#la-sombra)" />
      <rect x={-11} y={-38} width={25} height={34} rx={1} fill="url(#la-papel)" />
      <path d="M-7,-32 L10,-32 M-7,-26 L10,-26 M-7,-20 L10,-20 M-7,-14 L4,-14" stroke="#CBD5E1" strokeWidth="1.1" strokeLinecap="round" />
      {[-36, -28, -20, -12].map((sy) => (
        <circle key={sy} cx={-14} cy={sy} r={1.6} fill="#94A3B8" />
      ))}
      <rect x={-16} y={-42} width={4} height={42} fill="#FFFFFF" opacity="0.18" />
    </g>
  )
}

export function Lapiz({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={1} ancho={7} />
      <path d="M-5,-48 L5,-48 L5,-14 L0,-2 L-5,-14 Z" fill="#FBBF24" filter="url(#la-sombra)" />
      <path d="M-5,-14 L5,-14 L0,-2 Z" fill="#F6DDB0" />
      <path d="M-2,-6 L2,-6 L0,-2 Z" fill={PALETA.tinta} />
      <rect x={-5} y={-54} width={10} height={6} fill="#94A3B8" />
      <rect x={-5} y={-60} width={10} height={6} rx={2} fill="#F472B6" />
      <path d="M-3,-46 L-3,-16" stroke="#FFFFFF" strokeWidth="1.8" opacity="0.35" strokeLinecap="round" />
    </g>
  )
}

export function Computadora({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={26} />
      <path d="M-26,0 L26,0 L22,-6 L-22,-6 Z" fill="#94A3B8" filter="url(#la-sombra)" />
      <rect x={-22} y={-38} width={44} height={32} rx={2} fill="#475569" />
      <rect x={-19} y={-35} width={38} height={26} rx={1} fill="#1E3A8A" />
      <path d="M-14,-29 L4,-29 M-14,-24 L10,-24 M-14,-19 L-2,-19" stroke="#93C5FD" strokeWidth="1.4" strokeLinecap="round" opacity="0.8" />
      <path d="M-19,-35 L-6,-35 L-19,-16 Z" fill="#FFFFFF" opacity="0.1" />
    </g>
  )
}

// ── Transporte ─────────────────────────────────────────────────────────────

/** Ruedas con tapacubos: una rueda negra plana se lee como agujero. */
function Rueda({ cx, r = 7 }: { cx: number; r?: number }) {
  return (
    <>
      <circle cx={cx} cy={-r} r={r} fill="#1E293B" />
      <circle cx={cx} cy={-r} r={r * 0.45} fill="#CBD5E1" />
      <circle cx={cx - r * 0.2} cy={-r - r * 0.2} r={r * 0.15} fill="#F8FAFC" opacity="0.7" />
    </>
  )
}

export function Carro({ x, y, s = 1, color = '#DC2626' }: Pieza & { color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={1} ancho={24} />
      <path d="M-26,-10 L-22,-22 Q-14,-30 0,-30 Q14,-30 20,-22 L26,-10 Q26,-5 22,-5 L-22,-5 Q-26,-5 -26,-10 Z" fill={color} filter="url(#la-sombra)" />
      <path d="M-17,-22 Q-12,-27 -2,-27 L-2,-15 L-19,-15 Z" fill="#BFDBFE" />
      <path d="M2,-27 Q12,-27 17,-22 L19,-15 L2,-15 Z" fill="#93C5FD" />
      <circle cx={23} cy={-11} r={2.4} fill="#FDE047" />
      <circle cx={-23} cy={-11} r={2.2} fill="#FCA5A5" />
      <Rueda cx={-14} />
      <Rueda cx={14} />
      <path d="M-20,-24 Q-8,-31 4,-30" stroke="#FFFFFF" strokeWidth="2" opacity="0.28" fill="none" strokeLinecap="round" />
    </g>
  )
}

export function Autobus({ x, y, s = 1, color = '#F59E0B' }: Pieza & { color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={1} ancho={30} />
      <rect x={-32} y={-38} width={64} height={33} rx={5} fill={color} filter="url(#la-sombra)" />
      {[-26, -13, 0, 13].map((bx) => (
        <rect key={bx} x={bx} y={-33} width={11} height={11} rx={1.5} fill="#BFDBFE" />
      ))}
      <rect x={26} y={-33} width={5} height={22} rx={1} fill="#93C5FD" />
      <rect x={-32} y={-14} width={64} height={4} fill="#B45309" opacity="0.5" />
      <circle cx={29} cy={-8} r={2.2} fill="#FDE047" />
      <Rueda cx={-18} r={7} />
      <Rueda cx={16} r={7} />
      <path d="M-28,-35 L20,-35" stroke="#FFFFFF" strokeWidth="2.4" opacity="0.25" strokeLinecap="round" />
    </g>
  )
}

export function Bicicleta({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={1} ancho={22} />
      <circle cx={-15} cy={-12} r={12} fill="none" stroke="#1E293B" strokeWidth="2.6" />
      <circle cx={15} cy={-12} r={12} fill="none" stroke="#1E293B" strokeWidth="2.6" />
      <circle cx={-15} cy={-12} r={2.4} fill="#94A3B8" />
      <circle cx={15} cy={-12} r={2.4} fill="#94A3B8" />
      <path d="M-15,-12 L0,-12 L8,-30 L15,-12 M0,-12 L-4,-30 L8,-30 M-4,-30 L-9,-31" stroke="#DC2626" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8,-30 L14,-33" stroke="#1E293B" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M-9,-31 Q-6,-34 -2,-33" stroke="#1E293B" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <circle cx={0} cy={-12} r={3.4} fill="#94A3B8" />
    </g>
  )
}

export function Barco({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0,-52 L0,-14" stroke="#78350F" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M2,-50 L20,-22 L2,-22 Z" fill="#F8FAFC" filter="url(#la-sombra)" />
      <path d="M-2,-46 L-16,-22 L-2,-22 Z" fill="#E2E8F0" />
      <path d="M-26,-14 L26,-14 L18,-2 L-18,-2 Z" fill="#B91C1C" filter="url(#la-sombra)" />
      <rect x={-26} y={-14} width={52} height={3.4} fill="#FCA5A5" />
      <ellipse cx={0} cy={-1} rx={30} ry={4} fill="url(#la-agua)" opacity="0.6" />
      <path d="M4,-46 L16,-26" stroke="#FFFFFF" strokeWidth="2" opacity="0.6" strokeLinecap="round" />
    </g>
  )
}

export function Avion({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-28,-20 Q-10,-28 24,-24 Q30,-22 24,-18 Q-10,-14 -28,-20 Z" fill="#F1F5F9" filter="url(#la-sombra)" />
      <path d="M-18,-22 L-26,-40 L-16,-38 L-6,-24 Z" fill="#CBD5E1" />
      <path d="M-14,-19 L-20,-6 L-11,-8 L-4,-18 Z" fill="#E2E8F0" />
      <path d="M-26,-21 L-33,-30 L-27,-29 L-22,-22 Z" fill="#94A3B8" />
      {[2, 9, 16].map((cx) => (
        <circle key={cx} cx={cx} cy={-22} r={2} fill="#60A5FA" />
      ))}
      <path d="M20,-24 Q26,-23 24,-20" fill="#93C5FD" />
      <path d="M-20,-23 Q0,-27 18,-25" stroke="#FFFFFF" strokeWidth="1.8" opacity="0.7" fill="none" strokeLinecap="round" />
    </g>
  )
}

export function Tren({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={1} ancho={30} />
      <path d="M-34,-4 L34,-4" stroke="#78350F" strokeWidth="3" strokeLinecap="round" />
      <rect x={-30} y={-26} width={26} height={22} rx={2} fill="#2563EB" filter="url(#la-sombra)" />
      <rect x={-25} y={-22} width={7} height={8} rx={1} fill="#BFDBFE" />
      <rect x={-14} y={-22} width={7} height={8} rx={1} fill="#BFDBFE" />
      <path d="M2,-38 L2,-26 L30,-26 L30,-8 L-2,-8 L-2,-38 Z" fill="#DC2626" filter="url(#la-sombra)" />
      <rect x={6} y={-22} width={9} height={9} rx={1} fill="#BFDBFE" />
      <rect x={-6} y={-44} width={8} height={7} rx={1.5} fill="#475569" />
      <circle cx={-26} cy={-6} r={3.4} fill="#1E293B" />
      <circle cx={-10} cy={-6} r={3.4} fill="#1E293B" />
      <circle cx={10} cy={-6} r={3.4} fill="#1E293B" />
      <circle cx={24} cy={-6} r={3.4} fill="#1E293B" />
      <path d="M-28,-24 L-6,-24" stroke="#FFFFFF" strokeWidth="2" opacity="0.25" strokeLinecap="round" />
    </g>
  )
}

export function Cohete({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-12,-16 Q-20,-8 -18,0 Q-14,-4 -10,-6 Z" fill="#DC2626" />
      <path d="M12,-16 Q20,-8 18,0 Q14,-4 10,-6 Z" fill="#DC2626" />
      <path d="M0,-56 Q12,-40 12,-14 L-12,-14 Q-12,-40 0,-56 Z" fill="#F1F5F9" filter="url(#la-sombra)" />
      <path d="M0,-56 Q7,-46 8,-36 L-8,-36 Q-7,-46 0,-56 Z" fill="#DC2626" />
      <circle cx={0} cy={-28} r={5.4} fill="#60A5FA" stroke="#94A3B8" strokeWidth="1.4" />
      <circle cx={-1.6} cy={-30} r={1.7} fill="#FFFFFF" opacity="0.7" />
      <path d="M-6,-14 Q0,0 6,-14 Q0,-6 -6,-14 Z" fill="#FBBF24" />
      <path d="M-4,-50 Q-7,-42 -7,-34" stroke="#FFFFFF" strokeWidth="1.8" opacity="0.5" fill="none" strokeLinecap="round" />
    </g>
  )
}

export function Camion({ x, y, s = 1, color = '#16A34A' }: Pieza & { color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={1} ancho={30} />
      <rect x={-32} y={-34} width={38} height={26} rx={2} fill="#E2E8F0" filter="url(#la-sombra)" />
      <path d="M8,-26 L20,-26 L30,-16 L30,-8 L8,-8 Z" fill={color} filter="url(#la-sombra)" />
      <path d="M12,-23 L19,-23 L25,-17 L12,-17 Z" fill="#BFDBFE" />
      <circle cx={29} cy={-11} r={2} fill="#FDE047" />
      <rect x={-32} y={-34} width={38} height={4} fill="#F8FAFC" />
      <Rueda cx={-22} r={6.5} />
      <Rueda cx={-6} r={6.5} />
      <Rueda cx={22} r={6.5} />
      <path d="M-28,-30 L0,-30" stroke="#FFFFFF" strokeWidth="2" opacity="0.5" strokeLinecap="round" />
    </g>
  )
}

// ── Lugares ────────────────────────────────────────────────────────────────

export function Escuela({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={30} />
      <path d="M-32,-30 L0,-50 L32,-30 Z" fill="#B91C1C" filter="url(#la-sombra)" />
      <rect x={-28} y={-30} width={56} height={30} fill="#FDE68A" />
      <rect x={-8} y={-20} width={16} height={20} rx={1} fill="#92400E" />
      <circle cx={4} cy={-10} r={1.2} fill="#FDE047" />
      <rect x={-23} y={-25} width={10} height={9} rx={1} fill="#BFDBFE" />
      <rect x={13} y={-25} width={10} height={9} rx={1} fill="#BFDBFE" />
      <rect x={-3} y={-58} width={6} height={9} fill="#F8FAFC" />
      <circle cx={0} cy={-40} r={5} fill="#F8FAFC" stroke="#92400E" strokeWidth="1" />
      <path d="M0,-43 L0,-40 L2,-39" stroke="#92400E" strokeWidth="0.9" fill="none" strokeLinecap="round" />
      <path d="M-28,-28 L-28,-4" stroke="#FFFFFF" strokeWidth="2.4" opacity="0.35" strokeLinecap="round" />
    </g>
  )
}

export function Hospital({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={26} />
      <rect x={-26} y={-52} width={52} height={52} rx={2} fill="#F1F5F9" filter="url(#la-sombra)" />
      <rect x={-26} y={-52} width={52} height={10} fill="#DC2626" />
      <path d="M-4,-50 L4,-50 L4,-47 L7,-47 L7,-45 L-7,-45 L-7,-47 L-4,-47 Z" fill="#FFFFFF" />
      <path d="M-3,-38 L3,-38 L3,-32 L9,-32 L9,-26 L3,-26 L3,-20 L-3,-20 L-3,-26 L-9,-26 L-9,-32 L-3,-32 Z" fill="#DC2626" />
      <rect x={-22} y={-38} width={9} height={9} rx={1} fill="#BFDBFE" />
      <rect x={13} y={-38} width={9} height={9} rx={1} fill="#BFDBFE" />
      <rect x={-8} y={-14} width={16} height={14} rx={1} fill="#94A3B8" />
      <rect x={-26} y={-42} width={5} height={42} fill="#FFFFFF" opacity="0.5" />
    </g>
  )
}

export function Tienda({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={28} />
      <rect x={-28} y={-44} width={56} height={44} rx={2} fill="#FDE68A" filter="url(#la-sombra)" />
      <path d="M-30,-44 L30,-44 L30,-34 L-30,-34 Z" fill="#DC2626" />
      {Array.from({ length: 6 }, (_, i) => (
        <rect key={i} x={-30 + i * 10} y={-44} width={5} height={10} fill="#F8FAFC" />
      ))}
      <rect x={-20} y={-30} width={22} height={18} rx={1} fill="#BFDBFE" />
      <path d="M-20,-24 L2,-24" stroke="#93C5FD" strokeWidth="1.2" />
      <rect x={8} y={-30} width={14} height={30} rx={1} fill="#92400E" />
      <circle cx={11} cy={-15} r={1.2} fill="#FDE047" />
      <path d="M-24,-30 L-24,-4" stroke="#FFFFFF" strokeWidth="2" opacity="0.35" strokeLinecap="round" />
    </g>
  )
}

export function Puente({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-38,-14 Q0,-40 38,-14" fill="none" stroke="#94A3B8" strokeWidth="4" strokeLinecap="round" />
      <rect x={-40} y={-14} width={80} height={6} rx={1} fill="#78350F" filter="url(#la-sombra)" />
      {[-28, -14, 0, 14, 28].map((px) => {
        const h = -14 - (26 - (px * px) / 55)
        return <path key={px} d={`M${px},-14 L${px},${h}`} stroke="#CBD5E1" strokeWidth="1.6" strokeLinecap="round" />
      })}
      <rect x={-32} y={-8} width={6} height={8} fill="#64748B" />
      <rect x={26} y={-8} width={6} height={8} fill="#64748B" />
      <path d="M-36,-16 Q0,-40 36,-16" fill="none" stroke="#FFFFFF" strokeWidth="1.4" opacity="0.3" strokeLinecap="round" />
    </g>
  )
}

export function Rio({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-40,-2 Q-20,-14 0,-6 Q20,2 40,-10 L40,2 Q20,10 0,2 Q-20,-6 -40,6 Z" fill="url(#la-agua)" opacity="0.9" />
      <path d="M-30,-4 Q-20,-9 -10,-6" stroke="#FFFFFF" strokeWidth="1.6" fill="none" opacity="0.5" strokeLinecap="round" />
      <path d="M8,-1 Q18,-5 28,-7" stroke="#FFFFFF" strokeWidth="1.4" fill="none" opacity="0.4" strokeLinecap="round" />
      <ellipse cx={-22} cy={-3} rx={4} ry={2} fill="#94A3B8" />
      <ellipse cx={16} cy={2} rx={3} ry={1.6} fill="#94A3B8" />
    </g>
  )
}

export function Volcan({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={34} />
      <path d="M-36,0 L-10,-40 L10,-40 L36,0 Z" fill="#57534E" filter="url(#la-sombra)" />
      <path d="M-36,0 L-10,-40 L-2,-40 L-14,0 Z" fill="#78716C" />
      <path d="M-10,-40 Q0,-34 10,-40 Q6,-30 0,-28 Q-6,-30 -10,-40 Z" fill="#DC2626" />
      <path d="M-8,-40 Q-14,-26 -20,-14" stroke="#F97316" strokeWidth="3.4" fill="none" strokeLinecap="round" />
      <path d="M7,-40 Q13,-30 16,-20" stroke="#EF4444" strokeWidth="3" fill="none" strokeLinecap="round" />
      <ellipse cx={-4} cy={-50} rx={11} ry={7} fill="#94A3B8" opacity="0.7" />
      <ellipse cx={7} cy={-56} rx={8} ry={5.4} fill="#CBD5E1" opacity="0.6" />
    </g>
  )
}

export function Cerca({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={1} ancho={28} />
      {[-24, -8, 8, 24].map((px) => (
        <path key={px} d={`M${px},0 L${px},-22 L${px + 4},-26 L${px + 8},-22 L${px + 8},0 Z`} fill="url(#la-madera)" />
      ))}
      <rect x={-26} y={-18} width={60} height={4} fill="#A16207" />
      <rect x={-26} y={-9} width={60} height={4} fill="#A16207" />
      <path d="M-23,-20 L-23,-2 M-7,-20 L-7,-2" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.25" strokeLinecap="round" />
    </g>
  )
}

// ── Símbolos del lenguaje ──────────────────────────────────────────────────

/** Bocadillo de diálogo. El rabito decide de quién es lo que se dice. */
export function Bocadillo({ x, y, s = 1, color = '#FFFFFF' }: Pieza & { color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-30,-40 Q-34,-40 -34,-34 L-34,-14 Q-34,-8 -28,-8 L-14,-8 L-18,0 L-6,-8 L28,-8 Q34,-8 34,-14 L34,-34 Q34,-40 28,-40 Z"
        fill={color} stroke={PALETA.tinta} strokeWidth="1.8" strokeLinejoin="round" filter="url(#la-sombra)" />
      <path d="M-24,-30 L18,-30 M-24,-22 L8,-22" stroke={PALETA.gris} strokeWidth="2" strokeLinecap="round" />
    </g>
  )
}

/** Bocadillo de pensamiento: las burbujas lo distinguen del hablado. */
export function Pensamiento({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle cx={-18} cy={-4} r={3} fill="#FFFFFF" stroke={PALETA.tinta} strokeWidth="1.4" />
      <circle cx={-12} cy={-12} r={5} fill="#FFFFFF" stroke={PALETA.tinta} strokeWidth="1.5" />
      <ellipse cx={0} cy={-32} rx={30} ry={16} fill="#FFFFFF" stroke={PALETA.tinta} strokeWidth="1.8" filter="url(#la-sombra)" />
      <path d="M-18,-36 L14,-36 M-18,-28 L4,-28" stroke={PALETA.gris} strokeWidth="2" strokeLinecap="round" />
    </g>
  )
}

export function Interrogacion({ x, y, s = 1, color = PALETA.trazo }: Pieza & { color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={12} />
      <path d="M-11,-38 Q-11,-50 0,-50 Q11,-50 11,-40 Q11,-31 3,-27 Q0,-25 0,-18"
        fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" filter="url(#la-sombra)" />
      <circle cx={0} cy={-6} r={4.4} fill={color} />
      <path d="M-8,-42 Q-6,-47 -1,-47" stroke="#FFFFFF" strokeWidth="2" fill="none" opacity="0.4" strokeLinecap="round" />
    </g>
  )
}

export function Exclamacion({ x, y, s = 1, color = PALETA.acento }: Pieza & { color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={9} />
      <path d="M-5,-50 L5,-50 L3,-18 L-3,-18 Z" fill={color} filter="url(#la-sombra)" />
      <circle cx={0} cy={-6} r={4.4} fill={color} />
      <path d="M-3,-48 L-2,-24" stroke="#FFFFFF" strokeWidth="1.6" opacity="0.4" strokeLinecap="round" />
    </g>
  )
}

/** Tarjeta de letra o sílaba. Para armar palabras moviendo piezas. */
export function TarjetaLetra({ x, y, s = 1, letra = 'a', color = '#FDE68A' }: Pieza & { letra?: string; color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={14} />
      <rect x={-15} y={-30} width={30} height={30} rx={4} fill={color} stroke={PALETA.tinta} strokeWidth="1.4" filter="url(#la-sombra)" />
      <text x={0} y={-8} textAnchor="middle" fontSize="20" fontWeight="700" fill={PALETA.tinta} fontFamily="inherit">{letra}</text>
      <path d="M-15,-30 L15,-30 L15,-25 L-15,-25 Z" fill="#FFFFFF" opacity="0.4" />
    </g>
  )
}

export function Sobre({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={22} />
      <rect x={-24} y={-30} width={48} height={30} rx={2} fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.2" filter="url(#la-sombra)" />
      <path d="M-24,-30 L0,-12 L24,-30" fill="none" stroke="#94A3B8" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M-24,0 L-7,-16 M24,0 L7,-16" stroke="#E2E8F0" strokeWidth="1.2" />
      <rect x={-24} y={-30} width={48} height={4} fill="#FFFFFF" opacity="0.6" />
    </g>
  )
}

export function Megafono({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={-6} y={1} ancho={12} />
      <path d="M-20,-22 L-8,-22 L10,-36 L10,-4 L-8,-18 L-20,-18 Z" fill="#F97316" filter="url(#la-sombra)" />
      <rect x={-24} y={-24} width={6} height={8} rx={2} fill="#EA580C" />
      <path d="M16,-28 Q22,-20 16,-12" stroke={PALETA.trazo} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M21,-33 Q30,-20 21,-7" stroke={PALETA.trazo} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6" />
      <path d="M-6,-21 L8,-33" stroke="#FFFFFF" strokeWidth="1.8" opacity="0.35" strokeLinecap="round" />
    </g>
  )
}
