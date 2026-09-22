import { caminoDeFlecha } from '@/lib/scene-doc'
/**
 * Kit de piezas ilustradas.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * PARA QUIEN ARME UNA ESCENA NUEVA
 *
 * Una escena no se dibuja desde cero: se compone con las piezas de acá.
 * Todas reciben `x`/`y` (su punto de apoyo) y `s` (escala, 1 = tamaño base),
 * así que se colocan en el lienzo de 400×220 como quien pega calcomanías:
 *
 *   <Marco>
 *     <Suelo y={170} />
 *     <Arbol x={80} y={170} s={1.2} />
 *     <Persona x={200} y={170} pose="saluda" />
 *     <Flecha desde={[120, 140]} hasta={[180, 140]} />
 *     <Pin x={200} y={110} texto="aquí" hacia={[200, 150]} />
 *   </Marco>
 *
 * Hace falta un `<Defs />` una sola vez por escena: ahí viven los degradados
 * y las sombras que usan las piezas.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * POR QUÉ TIENEN TANTO DETALLE
 *
 * Un dibujo hecho de rectángulos planos se lee como un esquema y el alumno lo
 * saltea. Estas piezas llevan volumen (degradado), apoyo (sombra en el piso) y
 * brillo (un reflejo donde daría la luz). Son tres trucos baratos que cambian
 * por completo si la figura se percibe como una COSA o como una forma.
 *
 * La luz viene siempre de arriba a la izquierda. Si agregas una pieza, respeta
 * esa dirección o el conjunto se ve mal armado.
 * ─────────────────────────────────────────────────────────────────────────
 */

export const PALETA = {
  trazo: '#6366F1',
  suave: '#C7D2FE',
  tinta: '#312E81',
  acento: '#F97316',
  verde: '#10B981',
  agua: '#38BDF8',
  tierra: '#92400E',
  piel: '#F5D0A9',
  gris: '#94A3B8',
} as const

/**
 * Degradados y filtros compartidos. Va una vez dentro de cada `<svg>`.
 *
 * Los ids llevan prefijo `la-` (lesson art) para no chocar con los que las
 * escenas definan por su cuenta: en SVG los ids son globales del documento y
 * dos escenas en la misma página se pisarían.
 */
export function Defs() {
  return (
    <defs>
      <linearGradient id="la-metal" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#F1F5F9" />
        <stop offset="45%" stopColor="#CBD5E1" />
        <stop offset="100%" stopColor="#94A3B8" />
      </linearGradient>
      <linearGradient id="la-agua" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#7DD3FC" />
        <stop offset="100%" stopColor="#0284C7" />
      </linearGradient>
      <linearGradient id="la-vidrio" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.75" />
        <stop offset="35%" stopColor="#FFFFFF" stopOpacity="0.12" />
        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.4" />
      </linearGradient>
      <linearGradient id="la-follaje" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#34D399" />
        <stop offset="100%" stopColor="#047857" />
      </linearGradient>
      <linearGradient id="la-roca" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#A5B4FC" />
        <stop offset="100%" stopColor="#4F46E5" />
      </linearGradient>
      <radialGradient id="la-sol">
        <stop offset="55%" stopColor="#FDE047" />
        <stop offset="100%" stopColor="#F59E0B" />
      </radialGradient>
      <linearGradient id="la-papel" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#F1F5F9" />
      </linearGradient>
      <linearGradient id="la-ladrillo" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FCA5A5" />
        <stop offset="100%" stopColor="#B91C1C" />
      </linearGradient>

      {/* Materiales de las piezas nuevas. Mismo criterio que los de arriba:
          claro arriba a la izquierda, oscuro abajo a la derecha, porque la luz
          del kit entero viene de ahí. */}
      <linearGradient id="la-madera" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#D8A55B" />
        <stop offset="100%" stopColor="#8B5A2B" />
      </linearGradient>
      <linearGradient id="la-calido" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FCA5A5" />
        <stop offset="100%" stopColor="#DC2626" />
      </linearGradient>
      <linearGradient id="la-oro" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FEF08A" />
        <stop offset="55%" stopColor="#FBBF24" />
        <stop offset="100%" stopColor="#B45309" />
      </linearGradient>
      <linearGradient id="la-carne" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FB7185" />
        <stop offset="100%" stopColor="#9F1239" />
      </linearGradient>
      <linearGradient id="la-morado" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#C4B5FD" />
        <stop offset="100%" stopColor="#6D28D9" />
      </linearGradient>
      <linearGradient id="la-noche" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#334155" />
        <stop offset="100%" stopColor="#0F172A" />
      </linearGradient>
      <radialGradient id="la-esfera">
        <stop offset="25%" stopColor="#A5B4FC" />
        <stop offset="100%" stopColor="#3730A3" />
      </radialGradient>

      {/* Sombra suave: da la sensación de que la pieza está apoyada y no
          flotando. Se usa con filter="url(#la-sombra)". */}
      <filter id="la-sombra" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="1.5" dy="2.5" stdDeviation="2" floodColor="#1E1B4B" floodOpacity="0.22" />
      </filter>

      <marker id="la-punta" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1 L 9 5 L 0 9 z" fill={PALETA.trazo} />
      </marker>
      <marker id="la-punta-naranja" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1 L 9 5 L 0 9 z" fill={PALETA.acento} />
      </marker>
    </defs>
  )
}

export interface Pieza {
  /** Punto de apoyo horizontal (centro de la pieza). */
  x: number
  /** Punto de apoyo vertical (la BASE de la pieza, no su centro). */
  y: number
  /** Escala. 1 es el tamaño base de cada pieza. */
  s?: number
}

/** Elipse difusa bajo una pieza: la "pega" al piso. */
export function Apoyo({ x, y, ancho = 30, opacidad = 0.18 }: { x: number; y: number; ancho?: number; opacidad?: number }) {
  return <ellipse cx={x} cy={y} rx={ancho} ry={ancho * 0.22} fill="#1E1B4B" opacity={opacidad} />
}

// ── Personas ───────────────────────────────────────────────────────────────

export type Pose = 'quieta' | 'saluda' | 'piensa' | 'senala'

/**
 * Una persona de cuerpo entero.
 *
 * Lo que la hace legible como persona y no como monigote: el cuello, el
 * mechón de pelo que rompe la esfera de la cabeza, y que los brazos salgan
 * del hombro y no de la oreja.
 */
export function Persona({
  x,
  y,
  s = 1,
  ropa = PALETA.trazo,
  piel = PALETA.piel,
  pelo = '#3F2A1D',
  pose = 'quieta',
}: Pieza & { ropa?: string; piel?: string; pelo?: string; pose?: Pose }) {
  const brazoIzq =
    pose === 'saluda' ? 'M-9,-40 L-19,-56' : pose === 'piensa' ? 'M-9,-40 L-4,-48' : 'M-9,-40 L-13,-24'
  const brazoDer =
    pose === 'senala' ? 'M9,-40 L24,-44' : 'M9,-40 L13,-24'

  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={14} />

      {/* Piernas */}
      <path d="M-5,-22 L-6,-2" stroke={PALETA.tinta} strokeWidth="6" strokeLinecap="round" />
      <path d="M5,-22 L6,-2" stroke={PALETA.tinta} strokeWidth="6" strokeLinecap="round" />

      {/* Torso con hombros redondeados */}
      <path d="M-10,-44 Q0,-48 10,-44 L11,-22 Q0,-19 -11,-22 Z" fill={ropa} filter="url(#la-sombra)" />

      <path d={brazoIzq} stroke={ropa} strokeWidth="5.5" strokeLinecap="round" fill="none" />
      <path d={brazoDer} stroke={ropa} strokeWidth="5.5" strokeLinecap="round" fill="none" />

      {/* Cuello: sin él la cabeza parece pegada al torso */}
      <rect x={-3} y={-50} width={6} height={7} fill={piel} />

      <circle cx={0} cy={-58} r={9.5} fill={piel} />
      {/* Mechón: rompe el círculo y hace que se lea como cabeza */}
      <path d="M-9.5,-60 Q-6,-70 0,-68 Q7,-70 9.5,-60 Q5,-64 0,-63 Q-5,-64 -9.5,-60 Z" fill={pelo} />
      <circle cx={-3.2} cy={-58} r={1.3} fill={PALETA.tinta} />
      <circle cx={3.2} cy={-58} r={1.3} fill={PALETA.tinta} />
      <path d="M-2.5,-54 Q0,-52 2.5,-54" stroke={PALETA.tinta} strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </g>
  )
}

// ── Naturaleza ─────────────────────────────────────────────────────────────

/** Árbol con copa irregular: una copa circular perfecta se lee como globo. */
export function Arbol({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={0} ancho={20} />
      <path d="M-4,0 L-3,-26 L3,-26 L4,0 Z" fill={PALETA.tierra} />
      <path d="M-3,-14 L-11,-21" stroke={PALETA.tierra} strokeWidth="3" strokeLinecap="round" />
      <path
        d="M0,-66 Q22,-62 26,-44 Q34,-34 22,-27 Q10,-20 0,-24 Q-10,-20 -22,-27 Q-34,-34 -26,-44 Q-22,-62 0,-66 Z"
        fill="url(#la-follaje)"
        filter="url(#la-sombra)"
      />
      {/* Reflejo arriba a la izquierda: de ahí viene la luz en todo el kit. */}
      <path d="M-14,-52 Q-6,-60 4,-58 Q-6,-54 -11,-46 Z" fill="#FFFFFF" opacity="0.28" />
    </g>
  )
}

/** Montaña con cara iluminada, cara en sombra y nieve. */
export function Montana({ x, y, s = 1, nieve = true }: Pieza & { nieve?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-52,0 L0,-70 L52,0 Z" fill="url(#la-roca)" />
      {/* La mitad derecha más oscura: una sola silueta plana no tiene volumen. */}
      <path d="M0,-70 L52,0 L0,0 Z" fill="#312E81" opacity="0.22" />
      {nieve && <path d="M-16,-48 L0,-70 L16,-48 Q8,-53 0,-49 Q-8,-53 -16,-48 Z" fill="#FFFFFF" />}
    </g>
  )
}

export function Nube({ x, y, s = 1, opacidad = 1 }: Pieza & { opacidad?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={opacidad}>
      <path
        d="M-26,0 Q-34,-2 -32,-10 Q-30,-18 -20,-16 Q-16,-27 -4,-25 Q6,-24 8,-14 Q20,-17 24,-8 Q28,0 16,0 Z"
        fill="#FFFFFF"
        filter="url(#la-sombra)"
      />
      <path d="M-24,-4 Q-14,-10 -2,-9" stroke="#E2E8F0" strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
  )
}

export function Sol({ x, y, s = 1, rayos = true }: Pieza & { rayos?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {rayos && (
        <g className="leccion-pulso">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
            const r = (a * Math.PI) / 180
            return (
              <line
                key={a}
                x1={20 * Math.cos(r)}
                y1={20 * Math.sin(r)}
                x2={29 * Math.cos(r)}
                y2={29 * Math.sin(r)}
                stroke="#FBBF24"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            )
          })}
        </g>
      )}
      <circle cx={0} cy={0} r={17} fill="url(#la-sol)" />
      <circle cx={-5} cy={-6} r={5} fill="#FEF9C3" opacity="0.65" />
    </g>
  )
}

/** Gota con reflejo: sin el brillo se lee como un triángulo redondeado. */
export function Gota({ x, y, s = 1, color = PALETA.agua }: Pieza & { color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0,-14 Q9,-3 9,3 A9,9 0 1,1 -9,3 Q-9,-3 0,-14 Z" fill={color} />
      <ellipse cx={-3} cy={1} rx={2.4} ry={3.4} fill="#FFFFFF" opacity="0.6" />
    </g>
  )
}

/** Franja de suelo con una línea de pasto por encima. */
export function Suelo({ y, color = '#D6C3A5', pasto = false }: { y: number; color?: string; pasto?: boolean }) {
  return (
    <g>
      <rect x={0} y={y} width={400} height={220 - y} fill={color} />
      {pasto && <rect x={0} y={y} width={400} height={7} fill="#65A30D" />}
      <line x1={0} y1={y} x2={400} y2={y} stroke="#A98467" strokeWidth="2.5" />
    </g>
  )
}

// ── Objetos ────────────────────────────────────────────────────────────────

/**
 * Vaso con líquido. `nivel` va de 0 a 1.
 *
 * El detalle que lo vuelve vidrio: la banda de reflejo vertical y la elipse
 * de la superficie del líquido. Sin ellas es un rectángulo azul.
 */
export function Vaso({
  x,
  y,
  s = 1,
  nivel = 0.6,
  liquido = 'url(#la-agua)',
}: Pieza & { nivel?: number; liquido?: string }) {
  const alto = 56
  const ancho = 34
  const hLiq = alto * Math.max(0, Math.min(1, nivel))

  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={18} />
      <path d={`M${-ancho / 2},${-alto} L${-ancho / 2 + 3},0 L${ancho / 2 - 3},0 L${ancho / 2},${-alto} Z`} fill="#E0F2FE" opacity="0.5" />
      {hLiq > 0 && (
        <>
          <path
            d={`M${-ancho / 2 + (alto - hLiq) * 0.055},${-hLiq} L${-ancho / 2 + 3},0 L${ancho / 2 - 3},0 L${ancho / 2 - (alto - hLiq) * 0.055},${-hLiq} Z`}
            fill={liquido}
          />
          <ellipse cx={0} cy={-hLiq} rx={ancho / 2 - (alto - hLiq) * 0.055} ry={2.6} fill="#BAE6FD" opacity="0.9" />
        </>
      )}
      <path d={`M${-ancho / 2},${-alto} L${-ancho / 2 + 3},0 L${ancho / 2 - 3},0 L${ancho / 2},${-alto}`} fill="none" stroke="#7DD3FC" strokeWidth="2.5" strokeLinejoin="round" />
      <path d={`M${-ancho / 2 + 5},${-alto + 6} L${-ancho / 2 + 7},-6`} stroke="#FFFFFF" strokeWidth="3" opacity="0.8" strokeLinecap="round" />
    </g>
  )
}

/** Casa con techo, puerta y ventana iluminada. */
export function Casa({ x, y, s = 1, color = 'url(#la-ladrillo)' }: Pieza & { color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={1} ancho={30} />
      <rect x={-26} y={-40} width={52} height={40} fill={color} filter="url(#la-sombra)" />
      <path d="M-32,-40 L0,-62 L32,-40 Z" fill="#7F1D1D" />
      <rect x={-8} y={-22} width={16} height={22} rx={2} fill="#78350F" />
      <circle cx={4} cy={-11} r={1.6} fill="#FDE047" />
      <rect x={8} y={-34} width={14} height={12} rx={1.5} fill="#FDE047" />
      <path d="M15,-34 L15,-22 M8,-28 L22,-28" stroke="#78350F" strokeWidth="1.5" />
    </g>
  )
}

/** Edificio institucional: columnas y frontón. Sirve para los poderes. */
export function Edificio({ x, y, s = 1, tono = '#E2E8F0' }: Pieza & { tono?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={1} ancho={34} />
      <rect x={-32} y={-6} width={64} height={6} fill="#94A3B8" />
      {[-24, -12, 0, 12, 24].map((cx) => (
        <g key={cx}>
          <rect x={cx - 4} y={-38} width={8} height={32} fill={tono} />
          <rect x={cx - 5.5} y={-40} width={11} height={3} fill="#CBD5E1" />
        </g>
      ))}
      <path d="M-38,-40 L0,-58 L38,-40 Z" fill={tono} filter="url(#la-sombra)" />
      <path d="M-38,-40 L0,-58 L0,-40 Z" fill="#FFFFFF" opacity="0.4" />
    </g>
  )
}

/** Libro abierto con páginas y lomo. */
export function Libro({ x, y, s = 1, color = PALETA.trazo }: Pieza & { color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={30} />
      <path d="M-30,-2 Q-15,-8 0,-3 Q15,-8 30,-2 L30,-30 Q15,-36 0,-31 Q-15,-36 -30,-30 Z" fill="url(#la-papel)" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M0,-31 L0,-3" stroke={color} strokeWidth="2.5" />
      {[-24, -19, -14].map((x0, i) => (
        <line key={i} x1={x0} y1={-26 + i * 5} x2={-6} y2={-26 + i * 5} stroke={PALETA.suave} strokeWidth="1.8" strokeLinecap="round" />
      ))}
      {[6, 11, 16].map((x0, i) => (
        <line key={i} x1={x0} y1={-26 + i * 5} x2={24} y2={-26 + i * 5} stroke={PALETA.suave} strokeWidth="1.8" strokeLinecap="round" />
      ))}
    </g>
  )
}

/** Bombillo con filamento y halo cuando está encendido. */
export function Bombillo({ x, y, s = 1, encendido = true }: Pieza & { encendido?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {encendido && <circle cx={0} cy={-26} r={26} fill="#FDE047" opacity="0.28" className="leccion-pulso" />}
      <path d="M-10,-10 L10,-10 L8,-2 L-8,-2 Z" fill="url(#la-metal)" />
      <line x1={-8} y1={-7} x2={8} y2={-7} stroke="#64748B" strokeWidth="1.5" />
      <circle cx={0} cy={-24} r={15} fill={encendido ? '#FDE047' : '#E2E8F0'} />
      <path d="M-5,-12 L-5,-22 Q0,-28 5,-22 L5,-12" fill="none" stroke={encendido ? '#B45309' : '#94A3B8'} strokeWidth="1.8" />
      <ellipse cx={-5} cy={-29} rx={4} ry={5.5} fill="#FFFFFF" opacity="0.55" />
    </g>
  )
}

/** Panel solar en perspectiva, con celdas. */
export function Panel({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={1} ancho={26} />
      <rect x={-2} y={-18} width={4} height={18} fill="#64748B" />
      <path d="M-30,-22 L28,-30 L34,-18 L-24,-10 Z" fill="#1E3A8A" filter="url(#la-sombra)" />
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M${-22 + i * 18},${-21 - i * 2.2} L${-16 + i * 18},${-9 - i * 2.2}`} stroke="#3B82F6" strokeWidth="1.6" />
      ))}
      <path d="M-28,-21 L26,-29" stroke="#60A5FA" strokeWidth="2" opacity="0.7" />
    </g>
  )
}

/** Bandera de Venezuela: franjas, estrellas en arco y asta. */
export function Bandera({ x, y, s = 1, estrellas = 8 }: Pieza & { estrellas?: number }) {
  const estrella = (cx: number, cy: number, r: number, k: number) => {
    const pts: string[] = []
    for (let i = 0; i < 10; i++) {
      const rad = i % 2 === 0 ? r : r / 2.3
      const a = (i * Math.PI) / 5 - Math.PI / 2
      pts.push(`${cx + rad * Math.cos(a)},${cy + rad * Math.sin(a)}`)
    }
    return <polygon key={k} points={pts.join(' ')} fill="#FFFFFF" />
  }

  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-3} y={-70} width={4} height={70} fill="#78350F" />
      <circle cx={-1} cy={-72} r={3.5} fill="#FCD34D" />
      <g filter="url(#la-sombra)">
        <rect x={1} y={-68} width={84} height={18} fill="#FCD34D" />
        <rect x={1} y={-50} width={84} height={18} fill="#1D4ED8" />
        <rect x={1} y={-32} width={84} height={18} fill="#DC2626" />
      </g>
      {Array.from({ length: estrellas }, (_, i) => {
        const a = Math.PI * (0.22 + (i / (estrellas - 1)) * 0.56)
        return estrella(43 - 30 * Math.cos(a), -34 - 26 * Math.sin(a), 4, i)
      })}
    </g>
  )
}

/** Hoja de papel con renglones; `titulo` pinta una barra superior. */
export function Papel({
  x,
  y,
  s = 1,
  renglones = 5,
  titulo = true,
  color = PALETA.suave,
}: Pieza & { renglones?: number; titulo?: boolean; color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-26} y={-70} width={52} height={70} rx={3} fill="url(#la-papel)" stroke={PALETA.suave} strokeWidth="2" filter="url(#la-sombra)" />
      {/* Esquina doblada: el detalle que lo vuelve una hoja y no un rectángulo. */}
      <path d="M18,-70 L26,-62 L18,-62 Z" fill="#E2E8F0" />
      {titulo && <rect x={-19} y={-62} width={30} height={5} rx={2.5} fill={color} />}
      {Array.from({ length: renglones }, (_, i) => (
        <line key={i} x1={-19} y1={-50 + i * 9} x2={i % 3 === 2 ? 6 : 19} y2={-50 + i * 9} stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
      ))}
    </g>
  )
}

/** Recipiente graduado, para volumen y capacidad. */
export function Jarra({ x, y, s = 1, nivel = 0.7, marcas = 4 }: Pieza & { nivel?: number; marcas?: number }) {
  const alto = 62
  const hLiq = alto * Math.max(0, Math.min(1, nivel))
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={22} />
      <path d="M-20,-62 L-20,-6 Q-20,0 -13,0 L13,0 Q20,0 20,-6 L20,-62 Z" fill="#E0F2FE" opacity="0.55" />
      <path d={`M-20,${-hLiq} L-20,-6 Q-20,0 -13,0 L13,0 Q20,0 20,-6 L20,${-hLiq} Z`} fill="url(#la-agua)" />
      <ellipse cx={0} cy={-hLiq} rx={20} ry={3} fill="#BAE6FD" />
      <path d="M20,-52 Q30,-48 28,-38 Q26,-32 20,-34" fill="none" stroke="#7DD3FC" strokeWidth="3" />
      <path d="M-20,-62 L-20,-6 Q-20,0 -13,0 L13,0 Q20,0 20,-6 L20,-62" fill="none" stroke="#7DD3FC" strokeWidth="2.5" />
      {Array.from({ length: marcas }, (_, i) => (
        <line key={i} x1={8} y1={-10 - i * 13} x2={19} y2={-10 - i * 13} stroke="#0284C7" strokeWidth="1.6" />
      ))}
      <path d="M-15,-56 L-15,-14" stroke="#FFFFFF" strokeWidth="3.5" opacity="0.75" strokeLinecap="round" />
    </g>
  )
}

/** Balanza de dos platos. `inclina` de -1 a 1. */
export function Balanza({ x, y, s = 1, inclina = 0 }: Pieza & { inclina?: number }) {
  const dy = inclina * 10
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={1} ancho={26} />
      <path d="M-18,0 L18,0 L10,-8 L-10,-8 Z" fill="#94A3B8" />
      <rect x={-3} y={-54} width={6} height={46} fill="url(#la-metal)" />
      <g transform={`rotate(${inclina * 9})`}>
        <rect x={-46} y={-57} width={92} height={5} rx={2.5} fill="url(#la-metal)" />
        <circle cx={0} cy={-54.5} r={5} fill="#64748B" />
      </g>
      <g transform={`translate(-42 ${-52 + dy})`}>
        <line x1={0} y1={0} x2={0} y2={12} stroke="#94A3B8" strokeWidth="1.8" />
        <path d="M-14,12 L14,12 L9,22 L-9,22 Z" fill="#CBD5E1" stroke="#64748B" strokeWidth="1.5" />
      </g>
      <g transform={`translate(42 ${-52 - dy})`}>
        <line x1={0} y1={0} x2={0} y2={12} stroke="#94A3B8" strokeWidth="1.8" />
        <path d="M-14,12 L14,12 L9,22 L-9,22 Z" fill="#CBD5E1" stroke="#64748B" strokeWidth="1.5" />
      </g>
    </g>
  )
}

// ── Diagramación ───────────────────────────────────────────────────────────

/** Flecha recta o curva, con punta. */
export function Flecha({
  desde,
  hasta,
  curva = 0,
  color = PALETA.trazo,
  ancho = 3,
  discontinua = false,
  clase,
}: {
  desde: [number, number]
  hasta: [number, number]
  /** Cuánto se arquea. 0 es recta; positivo curva hacia arriba. */
  curva?: number
  color?: string
  ancho?: number
  discontinua?: boolean
  clase?: string
}) {
  const d = caminoDeFlecha(desde, hasta, curva)

  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={ancho}
      strokeLinecap="round"
      strokeDasharray={discontinua ? '6 5' : undefined}
      markerEnd={color === PALETA.acento ? 'url(#la-punta-naranja)' : 'url(#la-punta)'}
      className={clase}
    />
  )
}

/** Etiqueta con línea guía hacia el punto que señala. */
export function Pin({
  x,
  y,
  texto,
  hacia,
  color = PALETA.acento,
  anchor = 'middle',
}: {
  x: number
  y: number
  texto: string
  hacia?: [number, number]
  color?: string
  anchor?: 'start' | 'middle' | 'end'
}) {
  // `texto` puede llegar sin definir si una escena recibe menos rótulos de
  // los que lee. Antes eso tumbaba la lección entera al calcular `.length`;
  // ahora la etiqueta sale vacía y el resto del dibujo se ve igual.
  const contenido = texto ?? ''
  const ancho = Math.max(contenido.length * 6.6 + 16, 34)
  const x0 = anchor === 'start' ? x : anchor === 'end' ? x - ancho : x - ancho / 2

  return (
    <g>
      {hacia && <line x1={x} y1={y} x2={hacia[0]} y2={hacia[1]} stroke={color} strokeWidth="1.8" strokeDasharray="4 3" opacity="0.8" />}
      <rect x={x0} y={y - 12} width={ancho} height={23} rx={11.5} fill="#FFFFFF" stroke={color} strokeWidth="2" filter="url(#la-sombra)" />
      <text x={x0 + ancho / 2} y={y + 5} textAnchor="middle" fill={color} fontSize="12.5" fontWeight="700" fontFamily="inherit">
        {contenido}
      </text>
    </g>
  )
}

/** Panel rotulado, para dividir la escena en zonas comparables. */
export function Panel2({
  x,
  y,
  ancho,
  alto,
  titulo,
  tono = '#EEF2FF',
  borde = PALETA.suave,
}: {
  x: number
  y: number
  ancho: number
  alto: number
  titulo?: string
  tono?: string
  borde?: string
}) {
  return (
    <g>
      <rect x={x} y={y} width={ancho} height={alto} rx={14} fill={tono} stroke={borde} strokeWidth="2" />
      {titulo && (
        <text x={x + ancho / 2} y={y + 20} textAnchor="middle" fill={PALETA.tinta} fontSize="13" fontWeight="700" fontFamily="inherit">
          {titulo}
        </text>
      )}
    </g>
  )
}

/** Texto suelto, con el tamaño y peso del kit. */
export function Texto({
  x,
  y,
  children,
  anchor = 'middle',
  fill = PALETA.tinta,
  tam = 13,
  peso = 600,
}: {
  x: number
  y: number
  children: React.ReactNode
  anchor?: 'start' | 'middle' | 'end'
  fill?: string
  tam?: number
  peso?: number
}) {
  return (
    <text x={x} y={y} textAnchor={anchor} fill={fill} fontSize={tam} fontWeight={peso} fontFamily="inherit">
      {children}
    </text>
  )
}
