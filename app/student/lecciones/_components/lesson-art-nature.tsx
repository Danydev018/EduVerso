import { PALETA, Apoyo, type Pieza } from './lesson-art'

/**
 * Plantas, animales y clima.
 *
 * Mismas reglas de estilo que `lesson-art.tsx`: base en y=0, centro en x=0,
 * luz de arriba a la izquierda, volumen + apoyo + reflejo.
 *
 * SOBRE LOS ANIMALES: van de perfil, no de frente. De frente hay que resolver
 * la simetría de la cara y salen caricaturas; de perfil la silueta sola ya
 * dice qué animal es, que es lo que el niño necesita para reconocerlo.
 */

// ── Plantas ────────────────────────────────────────────────────────────────

/** Flor de cinco pétalos. El centro más oscuro le da hondura. */
export function Flor({ x, y, s = 1, color = '#F472B6' }: Pieza & { color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={1} ancho={9} />
      <path d="M0,0 L0,-26" stroke="#15803D" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M0,-14 Q-10,-18 -12,-10 Q-4,-8 0,-14 Z" fill="#22C55E" />
      {Array.from({ length: 5 }, (_, i) => {
        const a = (i / 5) * 360
        return <ellipse key={i} cx={0} cy={-38} rx={5} ry={9} fill={color} transform={`rotate(${a} 0 -30)`} />
      })}
      <circle cx={0} cy={-30} r={5} fill="#FBBF24" />
      <circle cx={-1.5} cy={-31.5} r={1.8} fill="#FEF3C7" opacity="0.8" />
    </g>
  )
}

/** Girasol: cabeza grande y tallo grueso, que es lo que lo distingue. */
export function Girasol({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={1} ancho={10} />
      <path d="M0,0 L0,-34" stroke="#166534" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M0,-16 Q-13,-22 -15,-11 Q-5,-9 0,-16 Z" fill="#22C55E" />
      <path d="M0,-24 Q13,-30 15,-19 Q5,-17 0,-24 Z" fill="#16A34A" />
      {Array.from({ length: 12 }, (_, i) => (
        <ellipse key={i} cx={0} cy={-58} rx={4} ry={9} fill="#FBBF24" transform={`rotate(${i * 30} 0 -46)`} />
      ))}
      <circle cx={0} cy={-46} r={9} fill="#78350F" />
      <circle cx={0} cy={-46} r={6} fill="#92400E" />
      <circle cx={-3} cy={-49} r={2} fill="#FBBF24" opacity="0.35" />
    </g>
  )
}

/** Semilla partida: se ve la cáscara y lo de dentro. */
export function Semilla({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={1} ancho={8} />
      <ellipse cx={0} cy={-8} rx={7} ry={9} fill="#A16207" filter="url(#la-sombra)" />
      <path d="M0,-17 Q6,-12 6,-4 Q0,-1 0,-17 Z" fill="#CA8A04" />
      <ellipse cx={-2} cy={-11} rx={2} ry={3} fill="#FEF3C7" opacity="0.5" />
    </g>
  )
}

/** Brote: semilla abierta con el primer par de hojas. Sirve para germinación. */
export function Brote({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={1} ancho={10} />
      <path d="M0,0 L0,-16" stroke="#22C55E" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M0,-14 Q-11,-20 -12,-9 Q-4,-8 0,-14 Z" fill="#4ADE80" />
      <path d="M0,-16 Q11,-23 12,-12 Q4,-10 0,-16 Z" fill="#22C55E" />
      <path d="M-7,-16 Q-9,-12 -5,-11" stroke="#FFFFFF" strokeWidth="0.9" fill="none" opacity="0.5" />
    </g>
  )
}

/** Planta en maceta. La maceta se ve más ancha arriba, o parece un cubo. */
export function Maceta({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={16} />
      <path d="M0,-26 L0,-48" stroke="#15803D" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M0,-38 Q-13,-44 -15,-32 Q-5,-31 0,-38 Z" fill="#22C55E" />
      <path d="M0,-44 Q13,-50 15,-38 Q5,-37 0,-44 Z" fill="#16A34A" />
      <path d="M-15,-26 L15,-26 L11,0 L-11,0 Z" fill="url(#la-ladrillo)" filter="url(#la-sombra)" />
      <rect x={-16} y={-29} width={32} height={5} rx={1.5} fill="#EF4444" />
      <path d="M-13,-25 L-10,-2" stroke="#FFFFFF" strokeWidth="2" opacity="0.25" strokeLinecap="round" />
    </g>
  )
}

/** Hoja con su nervadura. Sin nervadura es una gota verde. */
export function Hoja({ x, y, s = 1, color = '#22C55E' }: Pieza & { color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={1} ancho={10} />
      <path d="M0,-2 Q-16,-12 -12,-26 Q0,-34 12,-26 Q16,-12 0,-2 Z" fill={color} filter="url(#la-sombra)" />
      <path d="M0,-2 L0,-30" stroke="#166534" strokeWidth="1.2" />
      {[-8, -14, -20].map((ny) => (
        <g key={ny}>
          <path d={`M0,${ny} L-7,${ny - 4}`} stroke="#166534" strokeWidth="0.8" />
          <path d={`M0,${ny} L7,${ny - 4}`} stroke="#166534" strokeWidth="0.8" />
        </g>
      ))}
      <path d="M-8,-22 Q-4,-28 2,-28 Q-4,-24 -6,-18 Z" fill="#FFFFFF" opacity="0.28" />
    </g>
  )
}

/** Raíces bajo tierra, con la línea del suelo marcada. */
export function Raiz({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-22,-18 L22,-18" stroke="#92400E" strokeWidth="2" strokeLinecap="round" />
      <path d="M0,-30 L0,-18" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" />
      <path d="M0,-18 L0,-4 M0,-14 L-10,-2 M0,-12 L9,-3 M0,-8 L-5,0 M0,-9 L5,0"
        stroke="#A16207" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M0,-30 Q-9,-35 -11,-27 Q-4,-26 0,-30 Z" fill="#4ADE80" />
    </g>
  )
}

/** Cactus de brazos. Las costillas verticales lo delatan enseguida. */
export function Cactus({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={14} />
      <path d="M-7,0 L-7,-38 Q0,-45 7,-38 L7,0 Z" fill="#15803D" filter="url(#la-sombra)" />
      <path d="M-7,-24 Q-17,-26 -17,-16 L-17,-10" stroke="#15803D" strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M7,-30 Q16,-32 16,-22 L16,-16" stroke="#15803D" strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M-3,-38 L-3,-2 M3,-38 L3,-2" stroke="#166534" strokeWidth="0.9" />
      <path d="M-5,-36 L-5,-6" stroke="#FFFFFF" strokeWidth="1.6" opacity="0.22" strokeLinecap="round" />
    </g>
  )
}

/** Palmera: el tronco curvo es lo que la separa de un árbol cualquiera. */
export function Palmera({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={16} />
      <path d="M0,0 Q-4,-24 2,-48" stroke="url(#la-madera)" strokeWidth="7" fill="none" strokeLinecap="round" />
      {[-40, -15, 15, 40, 90, -90].map((a, i) => (
        <path key={i} d="M2,-48 Q18,-56 30,-46 Q16,-50 2,-44 Z" fill={i % 2 ? '#15803D' : '#22C55E'} transform={`rotate(${a} 2 -48)`} />
      ))}
      <circle cx={0} cy={-46} r={3} fill="#A16207" />
      <circle cx={5} cy={-44} r={2.6} fill="#92400E" />
      <path d="M-1,-30 Q1,-38 3,-44" stroke="#FFFFFF" strokeWidth="1.4" opacity="0.2" fill="none" strokeLinecap="round" />
    </g>
  )
}

/** Mata de hierba. Va bien en grupos para vestir el suelo. */
export function Hierba({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0,0 Q-3,-9 -8,-14" stroke="#16A34A" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M0,0 Q0,-10 -1,-18" stroke="#22C55E" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M0,0 Q4,-9 9,-13" stroke="#16A34A" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M0,0 Q6,-6 12,-7" stroke="#4ADE80" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </g>
  )
}

// ── Animales ───────────────────────────────────────────────────────────────

export function Pez({ x, y, s = 1, color = '#F97316' }: Pieza & { color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-6,-12 Q8,-24 22,-12 Q8,0 -6,-12 Z" fill={color} filter="url(#la-sombra)" />
      <path d="M-6,-12 L-18,-20 L-18,-4 Z" fill={color} opacity="0.85" />
      <path d="M8,-19 L10,-25 L15,-18 Z" fill={color} opacity="0.7" />
      <circle cx={16} cy={-14} r={2} fill="#FFFFFF" />
      <circle cx={16.5} cy={-14} r={1} fill={PALETA.tinta} />
      <path d="M2,-18 Q10,-21 18,-16" stroke="#FFFFFF" strokeWidth="1.4" fill="none" opacity="0.4" strokeLinecap="round" />
    </g>
  )
}

export function Pajaro({ x, y, s = 1, color = '#3B82F6' }: Pieza & { color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={1} ancho={9} />
      <path d="M-4,-4 L-4,0 M4,-4 L4,0" stroke="#F59E0B" strokeWidth="1.6" strokeLinecap="round" />
      <ellipse cx={0} cy={-13} rx={12} ry={9} fill={color} filter="url(#la-sombra)" />
      <path d="M-12,-14 Q-22,-20 -18,-8 Z" fill={color} opacity="0.8" />
      <path d="M-2,-14 Q4,-19 8,-13 Q3,-9 -2,-14 Z" fill="#FFFFFF" opacity="0.28" />
      <circle cx={8} cy={-20} r={7} fill={color} />
      <circle cx={10} cy={-21} r={1.7} fill="#FFFFFF" />
      <circle cx={10.4} cy={-21} r={0.9} fill={PALETA.tinta} />
      <path d="M15,-20 L21,-18 L15,-16 Z" fill="#F59E0B" />
    </g>
  )
}

export function Mariposa({ x, y, s = 1, color = '#A855F7' }: Pieza & { color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-2,-22 Q-20,-34 -16,-18 Q-12,-8 -2,-14 Z" fill={color} filter="url(#la-sombra)" />
      <path d="M2,-22 Q20,-34 16,-18 Q12,-8 2,-14 Z" fill={color} filter="url(#la-sombra)" />
      <circle cx={-11} cy={-24} r={2.6} fill="#FFFFFF" opacity="0.5" />
      <circle cx={11} cy={-24} r={2.6} fill="#FFFFFF" opacity="0.5" />
      <rect x={-1.6} y={-26} width={3.2} height={16} rx={1.6} fill={PALETA.tinta} />
      <path d="M-1,-26 Q-5,-33 -8,-34 M1,-26 Q5,-33 8,-34" stroke={PALETA.tinta} strokeWidth="1" fill="none" strokeLinecap="round" />
    </g>
  )
}

export function Perro({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={18} />
      <path d="M-12,-10 L-12,0 M-4,-10 L-4,0 M6,-10 L6,0 M13,-10 L13,0" stroke="#92400E" strokeWidth="4" strokeLinecap="round" />
      <path d="M-16,-22 Q0,-28 16,-22 L16,-9 Q0,-5 -16,-9 Z" fill="#C2872B" filter="url(#la-sombra)" />
      <path d="M-16,-20 Q-26,-26 -24,-14" stroke="#C2872B" strokeWidth="3.4" fill="none" strokeLinecap="round" />
      <circle cx={19} cy={-27} r={8.5} fill="#D9A441" />
      <path d="M13,-33 Q10,-40 16,-38 Z" fill="#92400E" />
      <path d="M25,-33 Q28,-40 22,-38 Z" fill="#92400E" />
      <circle cx={17} cy={-28} r={1.3} fill={PALETA.tinta} />
      <circle cx={22} cy={-28} r={1.3} fill={PALETA.tinta} />
      <ellipse cx={25} cy={-24} rx={2.6} ry={2} fill={PALETA.tinta} />
      <path d="M-13,-21 Q0,-25 12,-22" stroke="#FFFFFF" strokeWidth="1.8" opacity="0.22" fill="none" strokeLinecap="round" />
    </g>
  )
}

export function Gato({ x, y, s = 1, color = '#94A3B8' }: Pieza & { color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={16} />
      <path d="M-10,-9 L-10,0 M-2,-9 L-2,0 M7,-9 L7,0 M13,-9 L13,0" stroke={color} strokeWidth="3.6" strokeLinecap="round" />
      <path d="M-14,-20 Q0,-26 15,-20 L15,-8 Q0,-4 -14,-8 Z" fill={color} filter="url(#la-sombra)" />
      <path d="M-14,-18 Q-26,-24 -22,-36" stroke={color} strokeWidth="3.2" fill="none" strokeLinecap="round" />
      <circle cx={17} cy={-26} r={8} fill={color} />
      <path d="M11,-31 L10,-39 L17,-33 Z" fill={color} />
      <path d="M23,-31 L25,-39 L18,-33 Z" fill={color} />
      <path d="M12,-32 L11.5,-37 L15.5,-33.5 Z" fill="#F9A8D4" />
      <circle cx={15} cy={-27} r={1.3} fill={PALETA.tinta} />
      <circle cx={20} cy={-27} r={1.3} fill={PALETA.tinta} />
      <path d="M17.5,-24 L16,-22 M17.5,-24 L19,-22" stroke={PALETA.tinta} strokeWidth="0.9" strokeLinecap="round" />
      <path d="M22,-25 L28,-26 M22,-23 L28,-22" stroke={PALETA.tinta} strokeWidth="0.7" strokeLinecap="round" />
    </g>
  )
}

export function Vaca({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={22} />
      <path d="M-14,-12 L-14,0 M-5,-12 L-5,0 M8,-12 L8,0 M16,-12 L16,0" stroke="#4B5563" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M-20,-30 Q0,-37 20,-30 L20,-11 Q0,-6 -20,-11 Z" fill="#F8FAFC" filter="url(#la-sombra)" />
      <ellipse cx={-6} cy={-24} rx={7} ry={5} fill="#334155" />
      <ellipse cx={11} cy={-17} rx={5} ry={4} fill="#334155" />
      <path d="M-20,-27 Q-30,-32 -27,-18" stroke="#F8FAFC" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx={24} cy={-34} r={9} fill="#F8FAFC" />
      <path d="M17,-41 Q14,-47 20,-44 Z M31,-41 Q34,-47 28,-44 Z" fill="#CBD5E1" />
      <circle cx={21} cy={-36} r={1.3} fill={PALETA.tinta} />
      <circle cx={27} cy={-36} r={1.3} fill={PALETA.tinta} />
      <ellipse cx={26} cy={-29} rx={5} ry={3.6} fill="#F9A8D4" />
      <circle cx={24.5} cy={-29.5} r={0.9} fill="#BE185D" />
      <circle cx={27.5} cy={-29.5} r={0.9} fill="#BE185D" />
    </g>
  )
}

export function Gallina({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={1} ancho={11} />
      <path d="M-3,-6 L-3,0 M4,-6 L4,0" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" />
      <ellipse cx={0} cy={-16} rx={13} ry={11} fill="#FFFFFF" filter="url(#la-sombra)" />
      <path d="M-13,-18 Q-24,-24 -20,-10 Z" fill="#F1F5F9" />
      <circle cx={9} cy={-27} r={7} fill="#FFFFFF" />
      <path d="M5,-33 Q7,-39 10,-34 Q13,-39 14,-33 Z" fill="#DC2626" />
      <path d="M15,-26 L21,-24 L15,-22 Z" fill="#F59E0B" />
      <path d="M11,-22 Q13,-17 9,-18 Z" fill="#DC2626" />
      <circle cx={11} cy={-28} r={1.2} fill={PALETA.tinta} />
      <path d="M-6,-21 Q2,-25 9,-21" stroke="#E2E8F0" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </g>
  )
}

export function Caballo({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={22} />
      <path d="M-15,-14 L-15,0 M-6,-14 L-6,0 M8,-14 L8,0 M16,-14 L16,0" stroke="#7C4A15" strokeWidth="4.2" strokeLinecap="round" />
      <path d="M-20,-32 Q0,-39 19,-32 L19,-13 Q0,-8 -20,-13 Z" fill="url(#la-madera)" filter="url(#la-sombra)" />
      <path d="M-20,-30 Q-31,-24 -28,-8" stroke="#5C3A10" strokeWidth="3.4" fill="none" strokeLinecap="round" />
      <path d="M19,-30 Q30,-40 28,-52 L21,-46 Z" fill="url(#la-madera)" />
      <path d="M22,-50 Q16,-40 14,-32" stroke="#5C3A10" strokeWidth="3.4" fill="none" strokeLinecap="round" />
      <path d="M27,-53 L26,-59 L31,-54 Z" fill="#8B5A2B" />
      <circle cx={26} cy={-47} r={1.3} fill={PALETA.tinta} />
      <path d="M-14,-30 Q0,-35 12,-31" stroke="#FFFFFF" strokeWidth="1.8" opacity="0.2" fill="none" strokeLinecap="round" />
    </g>
  )
}

export function Tortuga({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={1} ancho={16} />
      <path d="M-11,-6 L-11,-1 M7,-6 L7,-1" stroke="#65A30D" strokeWidth="4" strokeLinecap="round" />
      <path d="M-18,-8 A18,13 0 0 1 18,-8 Z" fill="#4D7C0F" filter="url(#la-sombra)" />
      <path d="M-11,-10 L-7,-18 L0,-21 L7,-18 L11,-10" fill="none" stroke="#365314" strokeWidth="1.1" />
      <path d="M0,-21 L0,-8 M-9,-13 L9,-13" stroke="#365314" strokeWidth="1.1" />
      <circle cx={21} cy={-11} r={5.5} fill="#84CC16" />
      <circle cx={23} cy={-12} r={1.2} fill={PALETA.tinta} />
      <path d="M-12,-14 Q-6,-19 0,-19" stroke="#FFFFFF" strokeWidth="1.6" opacity="0.2" fill="none" strokeLinecap="round" />
    </g>
  )
}

export function Rana({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={1} ancho={14} />
      <path d="M-14,-4 Q-19,-12 -12,-13 M14,-4 Q19,-12 12,-13" stroke="#16A34A" strokeWidth="4.5" fill="none" strokeLinecap="round" />
      <ellipse cx={0} cy={-12} rx={15} ry={12} fill="#22C55E" filter="url(#la-sombra)" />
      <circle cx={-7} cy={-23} r={5} fill="#22C55E" />
      <circle cx={7} cy={-23} r={5} fill="#22C55E" />
      <circle cx={-7} cy={-24} r={2.6} fill="#FFFFFF" />
      <circle cx={7} cy={-24} r={2.6} fill="#FFFFFF" />
      <circle cx={-6.5} cy={-24} r={1.3} fill={PALETA.tinta} />
      <circle cx={7.5} cy={-24} r={1.3} fill={PALETA.tinta} />
      <path d="M-6,-8 Q0,-4 6,-8" stroke="#166534" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <ellipse cx={-6} cy={-18} rx={4} ry={2.6} fill="#FFFFFF" opacity="0.25" />
    </g>
  )
}

export function Hormiga({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={1} ancho={10} />
      <path d="M-4,-7 L-9,-1 M0,-8 L0,-1 M4,-7 L9,-1" stroke="#431407" strokeWidth="1.3" strokeLinecap="round" />
      <ellipse cx={-9} cy={-9} rx={6} ry={5} fill="#7C2D12" filter="url(#la-sombra)" />
      <ellipse cx={0} cy={-9} rx={4} ry={3.4} fill="#7C2D12" />
      <circle cx={8} cy={-10} r={4.4} fill="#7C2D12" />
      <path d="M10,-13 Q14,-19 16,-18 M11,-12 Q16,-15 18,-14" stroke="#431407" strokeWidth="0.9" fill="none" strokeLinecap="round" />
      <circle cx={10} cy={-11} r={1} fill="#FDE68A" />
      <ellipse cx={-10} cy={-11} rx={2.4} ry={1.6} fill="#FFFFFF" opacity="0.25" />
    </g>
  )
}

export function Abeja({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={-4} cy={-24} rx={8} ry={6} fill="#FFFFFF" opacity="0.55" transform="rotate(-25 -4 -24)" />
      <ellipse cx={5} cy={-25} rx={8} ry={6} fill="#FFFFFF" opacity="0.55" transform="rotate(20 5 -25)" />
      <ellipse cx={0} cy={-14} rx={11} ry={8} fill="#FBBF24" filter="url(#la-sombra)" />
      <path d="M-3,-21 L-3,-7 M4,-21 L4,-7" stroke="#78350F" strokeWidth="3" />
      <circle cx={11} cy={-16} r={5} fill="#78350F" />
      <circle cx={13} cy={-17} r={1.2} fill="#FEF3C7" />
      <path d="M-11,-15 L-16,-12" stroke="#78350F" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12,-20 Q14,-25 17,-25" stroke="#78350F" strokeWidth="0.9" fill="none" strokeLinecap="round" />
    </g>
  )
}

/** Guacamaya: el ave de Venezuela. Va con los tres colores de la bandera. */
export function Guacamaya({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={1} ancho={10} />
      <path d="M-3,-6 L-3,0 M4,-6 L4,0" stroke="#78350F" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M-4,-14 Q-16,-4 -26,10 Q-10,0 -4,-8 Z" fill="#1D4ED8" />
      <path d="M-2,-14 Q-10,-2 -18,10 Q-6,2 -2,-8 Z" fill="#FBBF24" />
      <ellipse cx={0} cy={-18} rx={11} ry={13} fill="#DC2626" filter="url(#la-sombra)" />
      <path d="M-9,-20 Q-18,-26 -14,-12 Z" fill="#1D4ED8" opacity="0.9" />
      <circle cx={6} cy={-32} r={7.5} fill="#DC2626" />
      <path d="M12,-33 Q20,-31 14,-25 Q9,-26 10,-31 Z" fill="#F1F5F9" />
      <path d="M12,-31 Q17,-30 13,-26" fill="#1E293B" />
      <circle cx={7} cy={-34} r={2.4} fill="#FFFFFF" />
      <circle cx={7.5} cy={-34} r={1.2} fill={PALETA.tinta} />
      <path d="M-4,-24 Q2,-28 7,-25" stroke="#FFFFFF" strokeWidth="1.4" opacity="0.28" fill="none" strokeLinecap="round" />
    </g>
  )
}

export function Delfin({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-20,-12 Q-4,-26 16,-18 Q24,-16 26,-12 Q18,-8 12,-10 Q-4,-2 -20,-12 Z" fill="#60A5FA" filter="url(#la-sombra)" />
      <path d="M-2,-22 L2,-32 L10,-20 Z" fill="#3B82F6" />
      <path d="M-20,-12 L-30,-20 L-28,-6 Z" fill="#3B82F6" />
      <path d="M0,-10 Q6,-4 14,-6" stroke="#3B82F6" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M-10,-12 Q4,-6 18,-11" fill="#DBEAFE" opacity="0.8" />
      <circle cx={19} cy={-16} r={1.4} fill={PALETA.tinta} />
      <path d="M22,-13 Q25,-12 26,-12" stroke={PALETA.tinta} strokeWidth="0.9" fill="none" strokeLinecap="round" />
      <path d="M-8,-20 Q2,-24 12,-19" stroke="#FFFFFF" strokeWidth="1.8" opacity="0.4" fill="none" strokeLinecap="round" />
    </g>
  )
}

export function Oveja({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={16} />
      <path d="M-9,-10 L-9,0 M-2,-10 L-2,0 M6,-10 L6,0 M12,-10 L12,0" stroke="#4B5563" strokeWidth="3" strokeLinecap="round" />
      {[[-13, -20], [-5, -25], [4, -25], [12, -20], [-9, -14], [2, -14], [10, -14]].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={7.5} fill="#F8FAFC" />
      ))}
      <circle cx={19} cy={-24} r={6.5} fill="#475569" />
      <path d="M13,-28 Q9,-33 15,-31 Z M25,-28 Q29,-33 23,-31 Z" fill="#334155" />
      <circle cx={17.5} cy={-25} r={1.1} fill="#F8FAFC" />
      <circle cx={21.5} cy={-25} r={1.1} fill="#F8FAFC" />
      <circle cx={-6} cy={-26} r={3} fill="#FFFFFF" opacity="0.7" />
    </g>
  )
}

export function Cerdo({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={17} />
      <path d="M-10,-9 L-10,0 M-2,-9 L-2,0 M7,-9 L7,0 M13,-9 L13,0" stroke="#F9A8D4" strokeWidth="4" strokeLinecap="round" />
      <path d="M-16,-24 Q0,-30 15,-24 L15,-8 Q0,-4 -16,-8 Z" fill="#F9A8D4" filter="url(#la-sombra)" />
      <path d="M-16,-20 Q-23,-24 -21,-18 Q-18,-16 -16,-18" stroke="#EC4899" strokeWidth="1.6" fill="none" />
      <circle cx={19} cy={-21} r={8} fill="#FBCFE8" />
      <path d="M13,-28 Q11,-33 17,-30 Z M25,-28 Q27,-33 21,-30 Z" fill="#F472B6" />
      <circle cx={17} cy={-22} r={1.2} fill={PALETA.tinta} />
      <circle cx={22} cy={-22} r={1.2} fill={PALETA.tinta} />
      <ellipse cx={24} cy={-17} rx={4} ry={3.2} fill="#F472B6" />
      <circle cx={23} cy={-17} r={0.8} fill="#BE185D" />
      <circle cx={25.5} cy={-17} r={0.8} fill="#BE185D" />
      <path d="M-12,-23 Q0,-27 10,-24" stroke="#FFFFFF" strokeWidth="1.8" opacity="0.3" fill="none" strokeLinecap="round" />
    </g>
  )
}

// ── Cielo y clima ──────────────────────────────────────────────────────────

export function Luna({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0,-34 A17,17 0 1 0 8,-3 A13,13 0 1 1 0,-34 Z" fill="#FDE68A" filter="url(#la-sombra)" />
      <circle cx={-4} cy={-24} r={2.6} fill="#FCD34D" opacity="0.7" />
      <circle cx={-1} cy={-13} r={1.8} fill="#FCD34D" opacity="0.6" />
      <circle cx={-7} cy={-17} r={1.2} fill="#FCD34D" opacity="0.5" />
    </g>
  )
}

export function Estrella({ x, y, s = 1, color = '#FBBF24' }: Pieza & { color?: string }) {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 === 0 ? 18 : 7.5
    const a = (i / 10) * 2 * Math.PI - Math.PI / 2
    return `${(Math.cos(a) * r).toFixed(1)},${(-18 + Math.sin(a) * r).toFixed(1)}`
  })
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d={`M${pts.join(' L')} Z`} fill={color} filter="url(#la-sombra)" />
      <path d="M0,-36 L4,-25 L0,-22 L-4,-25 Z" fill="#FFFFFF" opacity="0.4" />
    </g>
  )
}

export function Arcoiris({ x, y, s = 1 }: Pieza) {
  const colores = ['#DC2626', '#F97316', '#FBBF24', '#22C55E', '#3B82F6', '#7C3AED']
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {colores.map((c, i) => (
        <path key={c} d={`M${-36 + i * 4},0 A${36 - i * 4},${36 - i * 4} 0 0 1 ${36 - i * 4},0`} fill="none" stroke={c} strokeWidth="4" strokeLinecap="round" />
      ))}
      <path d="M-30,-14 A30,30 0 0 1 -14,-28" fill="none" stroke="#FFFFFF" strokeWidth="2" opacity="0.35" strokeLinecap="round" />
    </g>
  )
}

export function Rayo({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M4,-44 L-12,-16 L-1,-16 L-6,0 L14,-24 L2,-24 Z" fill="#FBBF24" stroke="#B45309" strokeWidth="1.2" strokeLinejoin="round" filter="url(#la-sombra)" />
      <path d="M2,-40 L-7,-20 L0,-20 Z" fill="#FEF3C7" opacity="0.7" />
    </g>
  )
}

export function CopoNieve({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {Array.from({ length: 6 }, (_, i) => (
        <g key={i} transform={`rotate(${i * 60} 0 -18)`}>
          <path d="M0,-18 L0,-36" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" />
          <path d="M0,-30 L-5,-34 M0,-30 L5,-34 M0,-24 L-4,-27 M0,-24 L4,-27" stroke="#93C5FD" strokeWidth="1.4" strokeLinecap="round" />
        </g>
      ))}
      <circle cx={0} cy={-18} r={3} fill="#DBEAFE" />
    </g>
  )
}

export function Viento({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-26,-26 L10,-26 Q20,-26 20,-33 Q20,-39 13,-38" stroke="#94A3B8" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M-26,-16 L18,-16 Q30,-16 30,-9 Q30,-2 22,-3" stroke="#CBD5E1" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M-20,-6 L4,-6 Q12,-6 12,-1" stroke="#E2E8F0" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </g>
  )
}

export function Lluvia({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={-10} cy={-34} rx={15} ry={11} fill="#CBD5E1" />
      <ellipse cx={8} cy={-30} rx={13} ry={10} fill="#E2E8F0" />
      <ellipse cx={0} cy={-27} rx={20} ry={9} fill="#F1F5F9" filter="url(#la-sombra)" />
      {[-14, -5, 4, 13].map((dx, i) => (
        <path key={dx} d={`M${dx},${-16 + (i % 2) * 4} L${dx - 2},${-6 + (i % 2) * 4}`} stroke={PALETA.agua} strokeWidth="2.2" strokeLinecap="round" />
      ))}
      <ellipse cx={-14} cy={-36} rx={6} ry={4} fill="#FFFFFF" opacity="0.6" />
    </g>
  )
}

export function Tormenta({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={-10} cy={-38} rx={15} ry={11} fill="#64748B" />
      <ellipse cx={8} cy={-34} rx={13} ry={10} fill="#94A3B8" />
      <ellipse cx={0} cy={-31} rx={20} ry={9} fill="#475569" filter="url(#la-sombra)" />
      <path d="M2,-22 L-8,-6 L-1,-6 L-5,4 L9,-10 L1,-10 Z" fill="#FBBF24" stroke="#B45309" strokeWidth="1" strokeLinejoin="round" />
      <ellipse cx={-14} cy={-40} rx={6} ry={4} fill="#94A3B8" opacity="0.7" />
    </g>
  )
}

export function Charco({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={0} cy={-4} rx={26} ry={8} fill="url(#la-agua)" opacity="0.85" />
      <ellipse cx={0} cy={-5} rx={26} ry={8} fill="none" stroke="#0369A1" strokeWidth="1" opacity="0.5" />
      <ellipse cx={-9} cy={-6} rx={8} ry={2.2} fill="#FFFFFF" opacity="0.45" />
      <ellipse cx={11} cy={-3} rx={4} ry={1.4} fill="#FFFFFF" opacity="0.3" />
    </g>
  )
}
