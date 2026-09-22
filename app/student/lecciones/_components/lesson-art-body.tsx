import { PALETA, Apoyo, type Pieza } from './lesson-art'

/**
 * Cuerpo, salud y comida.
 *
 * Mismas reglas de estilo que `lesson-art.tsx`: base en y=0, centro en x=0,
 * luz de arriba a la izquierda, volumen + apoyo + reflejo.
 *
 * SOBRE LOS ÓRGANOS: van esquemáticos a propósito. Un corazón anatómico exacto
 * asusta y no enseña más que uno reconocible; lo que el niño tiene que sacar
 * es dónde está y para qué sirve, no su forma exacta.
 */

// ── Cuerpo ─────────────────────────────────────────────────────────────────

/**
 * Corazón.
 *
 * Los vasos van GRUESOS y CORTOS, saliendo por detrás del músculo. En la
 * primera versión eran dos trazos finos y largos hacia arriba y se leían como
 * antenas, no como venas: en una figura simplificada, un tubo solo parece
 * tubo si tiene grosor parecido al del cuerpo del que sale.
 */
export function Corazon({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={16} />
      <path d="M-9,-40 Q-13,-50 -6,-52 Q-1,-52 -1,-44 Z" fill="#9F1239" />
      <path d="M7,-40 Q11,-51 17,-47 Q19,-42 13,-38 Z" fill="#BE123C" />
      <path d="M0,-36 Q-18,-50 -18,-30 Q-18,-14 0,-2 Q18,-14 18,-30 Q18,-50 0,-36 Z" fill="url(#la-carne)" filter="url(#la-sombra)" />
      <path d="M0,-36 Q-5,-28 -4,-14 Q-1,-8 0,-3" stroke="#9F1239" strokeWidth="1.4" fill="none" opacity="0.55" />
      <path d="M-12,-32 Q-8,-40 -2,-38 Q-8,-34 -10,-26 Z" fill="#FFFFFF" opacity="0.35" />
    </g>
  )
}

/** Cerebro: los surcos son lo único que lo hace legible. */
export function Cerebro({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={18} />
      <path d="M-20,-16 Q-24,-34 -8,-38 Q0,-44 10,-38 Q24,-34 20,-16 Q16,-4 0,-4 Q-16,-4 -20,-16 Z" fill="#FDA4AF" filter="url(#la-sombra)" />
      <path d="M0,-42 L0,-5" stroke="#BE185D" strokeWidth="1.2" opacity="0.5" />
      <path d="M-14,-30 Q-6,-26 -12,-18 Q-6,-14 -13,-9" stroke="#BE185D" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.7" />
      <path d="M13,-31 Q5,-27 11,-19 Q5,-15 12,-10" stroke="#BE185D" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.7" />
      <path d="M-6,-6 Q0,-2 6,-6 L6,-1 Q0,2 -6,-1 Z" fill="#F43F5E" />
      <path d="M-14,-32 Q-7,-38 0,-37 Q-8,-33 -11,-26 Z" fill="#FFFFFF" opacity="0.35" />
    </g>
  )
}

export function Pulmones({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={18} />
      <path d="M0,-48 L0,-34" stroke="#F1F5F9" strokeWidth="4" strokeLinecap="round" />
      <path d="M0,-42 L-6,-38 M0,-42 L6,-38" stroke="#F1F5F9" strokeWidth="3" strokeLinecap="round" />
      <path d="M-3,-38 Q-20,-34 -20,-16 Q-20,-2 -8,-2 Q-3,-4 -3,-16 Z" fill="#FDA4AF" filter="url(#la-sombra)" />
      <path d="M3,-38 Q20,-34 20,-16 Q20,-2 8,-2 Q3,-4 3,-16 Z" fill="#FB7185" filter="url(#la-sombra)" />
      <path d="M-9,-32 L-9,-10 M-14,-26 L-14,-12" stroke="#BE185D" strokeWidth="1" opacity="0.5" />
      <path d="M9,-32 L9,-10 M14,-26 L14,-12" stroke="#BE185D" strokeWidth="1" opacity="0.5" />
      <path d="M-16,-30 Q-10,-35 -5,-34 Q-11,-30 -14,-24 Z" fill="#FFFFFF" opacity="0.3" />
    </g>
  )
}

export function Diente({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={12} />
      <path d="M-13,-32 Q0,-40 13,-32 Q15,-18 9,-2 Q4,2 2,-12 Q0,-16 -2,-12 Q-4,2 -9,-2 Q-15,-18 -13,-32 Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" filter="url(#la-sombra)" />
      <path d="M-9,-30 Q-3,-34 2,-33 Q-4,-29 -7,-20 Z" fill="#F8FAFC" />
      <path d="M-10,-28 Q-5,-32 0,-31" stroke="#FFFFFF" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </g>
  )
}

export function Ojo({ x, y, s = 1, color = '#3B82F6' }: Pieza & { color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-24,-14 Q0,-30 24,-14 Q0,2 -24,-14 Z" fill="#FFFFFF" stroke={PALETA.tinta} strokeWidth="1.6" filter="url(#la-sombra)" />
      <circle cx={0} cy={-14} r={9} fill={color} />
      <circle cx={0} cy={-14} r={4.2} fill={PALETA.tinta} />
      <circle cx={-3} cy={-17} r={2.4} fill="#FFFFFF" opacity="0.85" />
      <path d="M-24,-14 Q0,-30 24,-14" fill="none" stroke={PALETA.tinta} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M-18,-22 L-21,-27 M0,-27 L0,-33 M18,-22 L21,-27" stroke={PALETA.tinta} strokeWidth="1.6" strokeLinecap="round" />
    </g>
  )
}

export function Mano({ x, y, s = 1, piel = PALETA.piel }: Pieza & { piel?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={12} />
      <rect x={-5} y={-14} width={10} height={14} rx={4} fill={piel} />
      <path d="M-12,-20 Q-14,-38 -9,-38 Q-5,-38 -6,-20 Z" fill={piel} />
      <path d="M-5,-22 Q-6,-44 -1,-44 Q3,-44 1,-22 Z" fill={piel} />
      <path d="M2,-22 Q2,-43 7,-42 Q11,-41 8,-21 Z" fill={piel} />
      <path d="M8,-20 Q9,-37 13,-35 Q17,-33 13,-19 Z" fill={piel} />
      <path d="M-11,-18 Q-20,-24 -21,-18 Q-22,-12 -13,-10 Z" fill={piel} />
      <path d="M-13,-22 Q0,-28 14,-20 L14,-10 Q0,-4 -13,-10 Z" fill={piel} filter="url(#la-sombra)" />
      <path d="M-10,-20 Q0,-25 10,-19" stroke="#E9B584" strokeWidth="1.2" fill="none" opacity="0.7" />
      <path d="M-10,-18 Q-4,-22 2,-21" stroke="#FFFFFF" strokeWidth="1.6" fill="none" opacity="0.3" strokeLinecap="round" />
    </g>
  )
}

export function Hueso({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={1} ancho={20} />
      <path d="M-22,-16 A6,6 0 1 1 -16,-6 L16,-6 A6,6 0 1 1 22,-16 A6,6 0 1 1 16,-22 L-16,-22 A6,6 0 1 1 -22,-16 Z"
        fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.2" filter="url(#la-sombra)" />
      <path d="M-14,-19 L12,-19" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" opacity="0.9" />
    </g>
  )
}

export function Estomago({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={16} />
      <path d="M-10,-46 Q-6,-38 -12,-32" stroke="#F472B6" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M-14,-32 Q-22,-22 -16,-10 Q-8,0 4,-4 Q16,-10 14,-24 Q12,-34 2,-34 Q-6,-36 -14,-32 Z" fill="url(#la-carne)" filter="url(#la-sombra)" />
      <path d="M14,-22 Q22,-18 20,-8" stroke="#F472B6" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M-11,-26 Q-16,-18 -12,-11" stroke="#9F1239" strokeWidth="1.2" fill="none" opacity="0.6" />
      <path d="M-8,-28 Q-2,-32 4,-31 Q-3,-27 -6,-21 Z" fill="#FFFFFF" opacity="0.32" />
    </g>
  )
}

export function Oido({ x, y, s = 1, piel = PALETA.piel }: Pieza & { piel?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={12} />
      <path d="M8,-36 Q-14,-40 -14,-18 Q-14,-2 -2,-2 Q6,-2 4,-12 Q2,-20 10,-20" fill={piel} stroke="#D9A06B" strokeWidth="1.4" filter="url(#la-sombra)" />
      <path d="M2,-30 Q-7,-30 -7,-18 Q-7,-11 -3,-11" fill="none" stroke="#D9A06B" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M-2,-34 Q-10,-32 -11,-24" stroke="#FFFFFF" strokeWidth="1.8" fill="none" opacity="0.4" strokeLinecap="round" />
      <path d="M14,-30 Q20,-24 14,-18" stroke={PALETA.trazo} strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.7" />
      <path d="M19,-34 Q28,-24 19,-14" stroke={PALETA.trazo} strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.45" />
    </g>
  )
}

// ── Comida ─────────────────────────────────────────────────────────────────

export function Manzana({ x, y, s = 1, color = '#DC2626' }: Pieza & { color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={14} />
      <path d="M0,-34 Q3,-42 9,-44" stroke="#78350F" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M2,-38 Q12,-46 15,-38 Q8,-34 2,-38 Z" fill="#22C55E" />
      <path d="M0,-32 Q-16,-38 -16,-18 Q-16,-2 0,-2 Q16,-2 16,-18 Q16,-38 0,-32 Z" fill={color} filter="url(#la-sombra)" />
      <path d="M-11,-26 Q-5,-32 1,-31 Q-6,-27 -9,-19 Z" fill="#FFFFFF" opacity="0.35" />
    </g>
  )
}

export function Banana({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={1} ancho={18} />
      <path d="M-20,-20 Q-16,-4 0,-4 Q16,-4 22,-20 Q18,-12 8,-10 Q-8,-8 -14,-18 Z" fill="#FACC15" filter="url(#la-sombra)" />
      <path d="M-20,-20 Q-22,-24 -19,-25 Q-16,-24 -17,-20 Z" fill="#78350F" />
      <path d="M22,-20 Q24,-24 21,-25 Q18,-24 19,-20 Z" fill="#65A30D" />
      <path d="M-15,-19 Q-6,-10 6,-11" stroke="#FEF08A" strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.8" />
    </g>
  )
}

export function Naranja({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={15} />
      <circle cx={0} cy={-17} r={17} fill="#F97316" filter="url(#la-sombra)" />
      <path d="M0,-34 Q6,-40 12,-37 Q6,-33 0,-33 Z" fill="#22C55E" />
      <circle cx={-6} cy={-24} r={0.8} fill="#EA580C" />
      <circle cx={3} cy={-27} r={0.8} fill="#EA580C" />
      <circle cx={6} cy={-14} r={0.8} fill="#EA580C" />
      <circle cx={-8} cy={-12} r={0.8} fill="#EA580C" />
      <path d="M-11,-25 Q-5,-31 2,-30 Q-5,-26 -8,-18 Z" fill="#FFFFFF" opacity="0.32" />
    </g>
  )
}

export function Pan({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={22} />
      <path d="M-22,-6 Q-22,-26 0,-26 Q22,-26 22,-6 Q22,0 0,0 Q-22,0 -22,-6 Z" fill="#D8A55B" filter="url(#la-sombra)" />
      <path d="M-14,-22 Q-11,-27 -8,-22 M-3,-25 Q0,-30 3,-25 M8,-22 Q11,-27 14,-22" stroke="#92400E" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <path d="M-18,-14 Q-8,-22 2,-21" stroke="#F6DDB0" strokeWidth="2.4" fill="none" strokeLinecap="round" opacity="0.6" />
    </g>
  )
}

export function Leche({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={14} />
      <path d="M-13,-38 L13,-38 L13,0 L-13,0 Z" fill="#F1F5F9" filter="url(#la-sombra)" />
      <path d="M-13,-38 L0,-50 L13,-38 Z" fill="#E2E8F0" />
      <rect x={-9} y={-30} width={18} height={16} rx={2} fill="#60A5FA" />
      <path d="M-5,-24 Q0,-28 5,-24 Q5,-19 0,-19 Q-5,-19 -5,-24 Z" fill="#FFFFFF" opacity="0.85" />
      <rect x={-13} y={-38} width={4} height={38} fill="#FFFFFF" opacity="0.45" />
    </g>
  )
}

export function Huevo({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={1} ancho={11} />
      <path d="M0,-34 Q13,-24 13,-11 Q13,-1 0,-1 Q-13,-1 -13,-11 Q-13,-24 0,-34 Z" fill="#FFFBEB" stroke="#FDE68A" strokeWidth="0.9" filter="url(#la-sombra)" />
      <ellipse cx={-4} cy={-21} rx={3.4} ry={5} fill="#FFFFFF" opacity="0.8" transform="rotate(-20 -4 -21)" />
    </g>
  )
}

export function Queso({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={20} />
      <path d="M-20,-4 L-20,-16 L18,-26 L18,-14 Z" fill="#FCD34D" />
      <path d="M-20,-16 L18,-26 L20,-24 L-18,-14 Z" fill="#FDE68A" />
      <path d="M-20,-4 L-18,-14 L20,-24 L20,-12 Q0,-2 -20,-4 Z" fill="#FBBF24" filter="url(#la-sombra)" />
      <circle cx={-8} cy={-10} r={2.6} fill="#F59E0B" />
      <circle cx={6} cy={-14} r={2} fill="#F59E0B" />
      <circle cx={13} cy={-18} r={1.4} fill="#F59E0B" />
    </g>
  )
}

/**
 * Arepa abierta y rellena.
 *
 * Lo que la hace arepa y no un disco amarillo es el relleno ASOMANDO por el
 * corte: el queso sale un poco por los lados. Con el corte dibujado dentro del
 * contorno solo se veía una raya. Los tostados de la cara terminan de sacarla
 * de "círculo plano".
 */
export function Arepa({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={20} />
      {/* Mitad de abajo */}
      <path d="M-19,-16 A19,19 0 0 0 19,-16 Z" fill="#F3C969" stroke="#C68B3C" strokeWidth="1.3" filter="url(#la-sombra)" />
      {/* Relleno, más ancho que el pan para que se vea salir */}
      <path d="M-21,-17 Q0,-24 21,-17 Q16,-11 0,-12 Q-16,-11 -21,-17 Z" fill="#FFFBEB" stroke="#E7C26B" strokeWidth="0.9" />
      {/* Mitad de arriba */}
      <path d="M-19,-18 A19,19 0 0 1 19,-18 Z" fill="#FDE68A" stroke="#C68B3C" strokeWidth="1.3" />
      <circle cx={-7} cy={-26} r={1.6} fill="#D8A55B" opacity="0.55" />
      <circle cx={5} cy={-29} r={1.2} fill="#D8A55B" opacity="0.5" />
      <circle cx={9} cy={-22} r={1} fill="#D8A55B" opacity="0.45" />
      <path d="M-13,-26 Q-5,-32 4,-31 Q-5,-27 -10,-21 Z" fill="#FFFFFF" opacity="0.32" />
    </g>
  )
}

export function Zanahoria({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={1} ancho={10} />
      <path d="M0,-42 Q-8,-50 -12,-44 Q-6,-42 -2,-38 Z" fill="#22C55E" />
      <path d="M0,-42 Q0,-54 4,-52 Q4,-46 2,-40 Z" fill="#16A34A" />
      <path d="M0,-42 Q9,-49 12,-43 Q6,-41 2,-38 Z" fill="#4ADE80" />
      <path d="M-9,-38 L9,-38 L2,-2 Q0,1 -2,-2 Z" fill="#F97316" filter="url(#la-sombra)" />
      <path d="M-6,-32 L5,-32 M-5,-24 L4,-24 M-3,-16 L3,-16" stroke="#C2410C" strokeWidth="1" strokeLinecap="round" />
      <path d="M-6,-36 L-3,-8" stroke="#FFFFFF" strokeWidth="1.6" opacity="0.28" strokeLinecap="round" />
    </g>
  )
}

export function Pescado({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={1} ancho={20} />
      <path d="M-8,-12 Q6,-26 22,-12 Q6,2 -8,-12 Z" fill="#94A3B8" filter="url(#la-sombra)" />
      <path d="M-8,-12 L-22,-21 L-22,-3 Z" fill="#64748B" />
      <path d="M6,-20 L8,-27 L14,-18 Z" fill="#64748B" />
      <path d="M2,-12 Q8,-7 16,-10" stroke="#64748B" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx={17} cy={-14} r={1.9} fill="#FFFFFF" />
      <circle cx={17.4} cy={-14} r={1} fill={PALETA.tinta} />
      <path d="M0,-19 Q9,-22 17,-17" stroke="#CBD5E1" strokeWidth="1.6" fill="none" opacity="0.7" strokeLinecap="round" />
    </g>
  )
}

export function Uvas({ x, y, s = 1 }: Pieza) {
  const bolas: [number, number][] = [
    [0, -12], [-7, -18], [7, -18], [-13, -25], [0, -25], [13, -25],
    [-7, -32], [7, -32], [0, -39],
  ]
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={1} ancho={14} />
      <path d="M0,-40 Q2,-48 8,-50" stroke="#78350F" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M3,-46 Q12,-52 15,-45 Q8,-42 3,-46 Z" fill="#22C55E" />
      {bolas.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={6.4} fill="url(#la-morado)" />
      ))}
      {bolas.map(([cx, cy], i) => (
        <circle key={`b${i}`} cx={cx - 2} cy={cy - 2.4} r={1.7} fill="#FFFFFF" opacity="0.4" />
      ))}
    </g>
  )
}

export function Maiz({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={1} ancho={11} />
      <path d="M-12,-14 Q-22,-30 -14,-40 Q-10,-28 -8,-18 Z" fill="#22C55E" />
      <path d="M12,-14 Q22,-30 14,-40 Q10,-28 8,-18 Z" fill="#16A34A" />
      <path d="M0,-46 Q11,-38 11,-18 Q11,-2 0,-2 Q-11,-2 -11,-18 Q-11,-38 0,-46 Z" fill="#FACC15" filter="url(#la-sombra)" />
      {Array.from({ length: 5 }, (_, r) =>
        Array.from({ length: 4 }, (_, c) => (
          <circle key={`${r}-${c}`} cx={-6 + c * 4} cy={-38 + r * 8} r={1.7} fill="#EAB308" />
        )),
      )}
      <path d="M-7,-36 Q-9,-22 -7,-10" stroke="#FEF08A" strokeWidth="2" fill="none" opacity="0.55" strokeLinecap="round" />
    </g>
  )
}
