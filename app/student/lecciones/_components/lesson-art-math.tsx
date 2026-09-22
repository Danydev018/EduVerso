import { PALETA, Apoyo, type Pieza } from './lesson-art'

/**
 * Piezas de números, medida y geometría.
 *
 * Mismas reglas que `lesson-art.tsx`, que es de donde sale el estilo: la pieza
 * se dibuja centrada en x=0 con la base en y=0, la luz viene de arriba a la
 * izquierda, y cada figura lleva volumen (degradado), apoyo (sombra en el
 * piso) y un reflejo. Los degradados viven en el `<Defs />` de aquel archivo.
 *
 * Están aparte por tamaño, no por ser distintas: 16 piezas caben en un archivo
 * y 130 no.
 *
 * SOBRE LA GEOMETRÍA: las figuras planas (círculo, triángulo…) se dibujan con
 * su NOMBRE aparte, no rotuladas dentro, porque la misma pieza sirve para
 * enseñar la forma y para usarla como mancha de color en otra escena. Quien
 * quiera rotularla le pone un texto encima en el editor.
 */

// ── Números y medida ───────────────────────────────────────────────────────

/** Ábaco de tres varillas. Las cuentas se reparten para que se puedan contar. */
export function Abaco({ x, y, s = 1, cuentas = 4 }: Pieza & { cuentas?: number }) {
  const n = Math.max(1, Math.min(7, Math.round(cuentas)))
  const filas = [-40, -28, -16]
  const colores = ['#EF4444', '#3B82F6', '#10B981']
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={28} />
      <rect x={-26} y={-52} width={52} height={52} rx={4} fill="url(#la-madera)" filter="url(#la-sombra)" />
      <rect x={-22} y={-48} width={44} height={44} rx={2} fill="#FDF6E3" />
      {filas.map((fy, i) => (
        <g key={fy}>
          <rect x={-22} y={fy - 1} width={44} height={2} fill={PALETA.gris} />
          {Array.from({ length: n }, (_, k) => (
            <circle key={k} cx={-18 + k * 5.6} cy={fy} r={2.6} fill={colores[i]}>
            </circle>
          ))}
        </g>
      ))}
      <path d="M-26,-52 L26,-52 L26,-48 L-26,-48 Z" fill="#FFFFFF" opacity="0.25" />
    </g>
  )
}

/** Barra de diez: el bloque de decena de toda la vida, con sus diez muescas. */
export function BloqueDecena({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={26} />
      <rect x={-25} y={-14} width={50} height={14} rx={2} fill="#F97316" filter="url(#la-sombra)" />
      {Array.from({ length: 9 }, (_, i) => (
        <path key={i} d={`M${-20 + i * 5},-14 L${-20 + i * 5},0`} stroke="#9A3412" strokeWidth="0.8" />
      ))}
      <rect x={-25} y={-14} width={50} height={4} fill="#FFFFFF" opacity="0.3" />
    </g>
  )
}

/** Cubito de unidad. Va con `BloqueDecena` para armar decenas y unidades. */
export function CuboUnidad({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={1} ancho={8} />
      <rect x={-6} y={-12} width={12} height={12} rx={1.5} fill="#F97316" filter="url(#la-sombra)" />
      <rect x={-6} y={-12} width={12} height={3.5} fill="#FFFFFF" opacity="0.32" />
    </g>
  )
}

/** Recta numérica con marcas y un punto móvil. */
export function RectaNumerica({ x, y, s = 1, punto = 0.5 }: Pieza & { punto?: number }) {
  const t = Math.max(0, Math.min(1, punto))
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-50,-6 L50,-6" stroke={PALETA.tinta} strokeWidth="2.4" strokeLinecap="round" />
      {Array.from({ length: 11 }, (_, i) => (
        <path key={i} d={`M${-50 + i * 10},-6 L${-50 + i * 10},${i % 5 === 0 ? -14 : -10}`} stroke={PALETA.tinta} strokeWidth="1.6" strokeLinecap="round" />
      ))}
      <circle cx={-50 + t * 100} cy={-6} r={5} fill={PALETA.acento} filter="url(#la-sombra)" />
      <circle cx={-51.5 + t * 100} cy={-7.5} r={1.6} fill="#FFFFFF" opacity="0.6" />
    </g>
  )
}

/** Reloj de agujas. La hora se pasa en horas decimales: 7.5 son las siete y media. */
export function Reloj({ x, y, s = 1, hora = 3 }: Pieza & { hora?: number }) {
  const h = ((hora % 12) + 12) % 12
  const angHora = (h / 12) * 360 - 90
  const angMin = ((h % 1) * 360) - 90
  const rad = (a: number) => (a * Math.PI) / 180
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={22} />
      <circle cx={0} cy={-24} r={24} fill="url(#la-metal)" filter="url(#la-sombra)" />
      <circle cx={0} cy={-24} r={20} fill="#FFFDF7" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = rad(i * 30 - 90)
        return (
          <circle key={i} cx={Math.cos(a) * 16} cy={-24 + Math.sin(a) * 16} r={i % 3 === 0 ? 1.6 : 0.9} fill={PALETA.tinta} />
        )
      })}
      <path d={`M0,-24 L${Math.cos(rad(angHora)) * 9},${-24 + Math.sin(rad(angHora)) * 9}`} stroke={PALETA.tinta} strokeWidth="2.8" strokeLinecap="round" />
      <path d={`M0,-24 L${Math.cos(rad(angMin)) * 14},${-24 + Math.sin(rad(angMin)) * 14}`} stroke={PALETA.acento} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx={0} cy={-24} r={1.8} fill={PALETA.tinta} />
      <path d="M-17,-38 Q-8,-46 3,-44 Q-8,-40 -14,-32 Z" fill="#FFFFFF" opacity="0.4" />
    </g>
  )
}

/** Moneda de canto visible, para que no se lea como un círculo plano. */
export function Moneda({ x, y, s = 1, valor = '1' }: Pieza & { valor?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={1} ancho={14} />
      <ellipse cx={0} cy={-4} rx={14} ry={4} fill="#B45309" />
      <ellipse cx={0} cy={-7} rx={14} ry={13} fill="url(#la-oro)" filter="url(#la-sombra)" />
      <ellipse cx={0} cy={-7} rx={10.5} ry={9.5} fill="none" stroke="#B45309" strokeWidth="0.9" opacity="0.6" />
      <text x={0} y={-3} textAnchor="middle" fontSize="11" fontWeight="700" fill="#78350F">{valor}</text>
      <path d="M-10,-14 Q-4,-19 4,-17 Q-4,-14 -8,-9 Z" fill="#FFFFFF" opacity="0.45" />
    </g>
  )
}

/** Billete con una esquina doblada: sin el doblez parece una tarjeta. */
export function Billete({ x, y, s = 1, valor = '10' }: Pieza & { valor?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={26} />
      <rect x={-26} y={-18} width={52} height={20} rx={2} fill="#86EFAC" filter="url(#la-sombra)" />
      <rect x={-23} y={-15} width={46} height={14} rx={1} fill="none" stroke="#15803D" strokeWidth="0.8" />
      <circle cx={-14} cy={-8} r={4.5} fill="#BBF7D0" stroke="#15803D" strokeWidth="0.7" />
      <text x={8} y={-4} textAnchor="middle" fontSize="11" fontWeight="700" fill="#14532D">{valor}</text>
      <path d="M26,-18 L26,-10 L18,-18 Z" fill="#4ADE80" />
      <rect x={-26} y={-18} width={52} height={5} fill="#FFFFFF" opacity="0.28" />
    </g>
  )
}

/** Dado con los puntos de la cara pedida. */
export function Dado({ x, y, s = 1, cara = 5 }: Pieza & { cara?: number }) {
  const n = Math.max(1, Math.min(6, Math.round(cara)))
  const P: Record<number, [number, number][]> = {
    1: [[0, 0]],
    2: [[-6, -6], [6, 6]],
    3: [[-6, -6], [0, 0], [6, 6]],
    4: [[-6, -6], [6, -6], [-6, 6], [6, 6]],
    5: [[-6, -6], [6, -6], [0, 0], [-6, 6], [6, 6]],
    6: [[-6, -7], [6, -7], [-6, 0], [6, 0], [-6, 7], [6, 7]],
  }
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={16} />
      <rect x={-16} y={-32} width={32} height={32} rx={5} fill="#FFFFFF" stroke={PALETA.gris} strokeWidth="1" filter="url(#la-sombra)" />
      {P[n].map(([px, py], i) => (
        <circle key={i} cx={px} cy={-16 + py} r={2.8} fill={PALETA.tinta} />
      ))}
      <path d="M-13,-29 Q-4,-32 6,-30 Q-4,-27 -10,-22 Z" fill="#FFFFFF" opacity="0.5" />
    </g>
  )
}

/** Fracción en círculo: la porción pintada es la parte tomada. */
export function FraccionCirculo({ x, y, s = 1, partes = 4, tomadas = 1 }: Pieza & { partes?: number; tomadas?: number }) {
  const n = Math.max(2, Math.min(12, Math.round(partes)))
  const k = Math.max(0, Math.min(n, Math.round(tomadas)))
  const r = 22
  const sector = (i: number) => {
    const a0 = (i / n) * 2 * Math.PI - Math.PI / 2
    const a1 = ((i + 1) / n) * 2 * Math.PI - Math.PI / 2
    const grande = a1 - a0 > Math.PI ? 1 : 0
    return `M0,-24 L${Math.cos(a0) * r},${-24 + Math.sin(a0) * r} A${r},${r} 0 ${grande} 1 ${Math.cos(a1) * r},${-24 + Math.sin(a1) * r} Z`
  }
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={20} />
      <circle cx={0} cy={-24} r={r} fill="#FFFFFF" filter="url(#la-sombra)" />
      {Array.from({ length: n }, (_, i) => (
        <path key={i} d={sector(i)} fill={i < k ? PALETA.acento : '#FFFFFF'} stroke={PALETA.tinta} strokeWidth="1" />
      ))}
      <path d="M-15,-36 Q-6,-44 5,-42 Q-6,-38 -12,-30 Z" fill="#FFFFFF" opacity="0.3" />
    </g>
  )
}

/** Fracción en barra. Se lee mejor que el círculo para comparar tamaños. */
export function FraccionBarra({ x, y, s = 1, partes = 4, tomadas = 1 }: Pieza & { partes?: number; tomadas?: number }) {
  const n = Math.max(2, Math.min(12, Math.round(partes)))
  const k = Math.max(0, Math.min(n, Math.round(tomadas)))
  const ancho = 60 / n
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={32} />
      <rect x={-30} y={-18} width={60} height={18} rx={2} fill="#FFFFFF" filter="url(#la-sombra)" />
      {Array.from({ length: n }, (_, i) => (
        <rect key={i} x={-30 + i * ancho} y={-18} width={ancho} height={18} fill={i < k ? PALETA.trazo : '#FFFFFF'} stroke={PALETA.tinta} strokeWidth="1" />
      ))}
      <rect x={-30} y={-18} width={60} height={4} fill="#FFFFFF" opacity="0.25" />
    </g>
  )
}

/** Regla graduada con sus números cada cinco. */
export function Regla({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={1} ancho={32} />
      <rect x={-32} y={-12} width={64} height={12} rx={1.5} fill="#FDE68A" filter="url(#la-sombra)" />
      {Array.from({ length: 13 }, (_, i) => (
        <path key={i} d={`M${-29 + i * 5},-12 L${-29 + i * 5},${i % 2 === 0 ? -5 : -8}`} stroke="#92400E" strokeWidth="0.9" />
      ))}
      <rect x={-32} y={-12} width={64} height={3} fill="#FFFFFF" opacity="0.4" />
    </g>
  )
}

/** Termómetro. `nivel` va de 0 (frío) a 1 (caliente). */
export function Termometro({ x, y, s = 1, nivel = 0.6 }: Pieza & { nivel?: number }) {
  const t = Math.max(0, Math.min(1, nivel))
  const alto = 36 * t
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={10} />
      <rect x={-5} y={-54} width={10} height={44} rx={5} fill="url(#la-metal)" filter="url(#la-sombra)" />
      <rect x={-3} y={-52} width={6} height={42} rx={3} fill="#FFFFFF" />
      <circle cx={0} cy={-8} r={8} fill="#DC2626" />
      <rect x={-2} y={-10 - alto} width={4} height={alto + 4} rx={2} fill="#DC2626" />
      {Array.from({ length: 5 }, (_, i) => (
        <path key={i} d={`M3,${-46 + i * 8} L6,${-46 + i * 8}`} stroke={PALETA.tinta} strokeWidth="0.8" />
      ))}
      <circle cx={-2.5} cy={-10.5} r={2} fill="#FFFFFF" opacity="0.45" />
    </g>
  )
}

/** Gráfico de tres barras, para comparar cantidades. */
export function Grafico({ x, y, s = 1, a = 0.4, b = 0.75, c = 0.55 }: Pieza & { a?: number; b?: number; c?: number }) {
  const barras: [number, number, string][] = [
    [-18, a, '#6366F1'],
    [0, b, '#F97316'],
    [18, c, '#10B981'],
  ]
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={30} />
      <path d="M-28,-52 L-28,0 L28,0" stroke={PALETA.tinta} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      {barras.map(([bx, v, col]) => {
        const h = Math.max(4, 46 * Math.max(0, Math.min(1, v)))
        return (
          <g key={bx}>
            <rect x={bx - 7} y={-h} width={14} height={h} rx={2} fill={col} filter="url(#la-sombra)" />
            <rect x={bx - 7} y={-h} width={14} height={Math.min(4, h)} fill="#FFFFFF" opacity="0.3" />
          </g>
        )
      })}
    </g>
  )
}

/** Calculadora con su pantalla y su cuadrícula de teclas. */
export function Calculadora({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={18} />
      <rect x={-17} y={-46} width={34} height={46} rx={4} fill="#475569" filter="url(#la-sombra)" />
      <rect x={-13} y={-42} width={26} height={11} rx={2} fill="#BBF7D0" />
      <path d="M8,-34 L11,-34" stroke="#166534" strokeWidth="1.6" strokeLinecap="round" />
      {Array.from({ length: 12 }, (_, i) => (
        <rect key={i} x={-13 + (i % 3) * 9} y={-27 + Math.floor(i / 3) * 7} width={7} height={5} rx={1} fill="#E2E8F0" />
      ))}
      <rect x={-17} y={-46} width={34} height={5} fill="#FFFFFF" opacity="0.18" />
    </g>
  )
}

// ── Figuras geométricas ────────────────────────────────────────────────────

/**
 * Las planas comparten el mismo trato: relleno con degradado, borde de tinta
 * para que el contorno se lea, y un reflejo arriba a la izquierda. El borde
 * importa más aquí que en las otras piezas, porque en geometría lo que se
 * enseña es justamente la forma del contorno.
 */
function Plana({ d, relleno = 'url(#la-roca)' }: { d: string; relleno?: string }) {
  return (
    <>
      <path d={d} fill={relleno} stroke={PALETA.tinta} strokeWidth="1.6" strokeLinejoin="round" filter="url(#la-sombra)" />
      <path d={d} fill="#FFFFFF" opacity="0.14" transform="translate(-2 -2) scale(0.82)" />
    </>
  )
}

export function Circulo({ x, y, s = 1, color = 'url(#la-roca)' }: Pieza & { color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={20} />
      <circle cx={0} cy={-22} r={22} fill={color} stroke={PALETA.tinta} strokeWidth="1.6" filter="url(#la-sombra)" />
      <path d="M-14,-34 Q-5,-42 6,-40 Q-5,-36 -11,-28 Z" fill="#FFFFFF" opacity="0.35" />
    </g>
  )
}

export function Cuadrado({ x, y, s = 1, color = 'url(#la-roca)' }: Pieza & { color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={22} />
      <Plana d="M-20,-40 L20,-40 L20,0 L-20,0 Z" relleno={color} />
    </g>
  )
}

export function Rectangulo({ x, y, s = 1, color = 'url(#la-roca)' }: Pieza & { color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={30} />
      <Plana d="M-30,-26 L30,-26 L30,0 L-30,0 Z" relleno={color} />
    </g>
  )
}

export function Triangulo({ x, y, s = 1, color = 'url(#la-roca)' }: Pieza & { color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={24} />
      <Plana d="M0,-42 L24,0 L-24,0 Z" relleno={color} />
    </g>
  )
}

export function Pentagono({ x, y, s = 1, color = 'url(#la-roca)' }: Pieza & { color?: string }) {
  const pts = Array.from({ length: 5 }, (_, i) => {
    const a = (i / 5) * 2 * Math.PI - Math.PI / 2
    return `${(Math.cos(a) * 22).toFixed(1)},${(-22 + Math.sin(a) * 22).toFixed(1)}`
  })
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={20} />
      <Plana d={`M${pts.join(' L')} Z`} relleno={color} />
    </g>
  )
}

export function Hexagono({ x, y, s = 1, color = 'url(#la-roca)' }: Pieza & { color?: string }) {
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * 2 * Math.PI - Math.PI / 2
    return `${(Math.cos(a) * 22).toFixed(1)},${(-22 + Math.sin(a) * 22).toFixed(1)}`
  })
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={20} />
      <Plana d={`M${pts.join(' L')} Z`} relleno={color} />
    </g>
  )
}

/** Cubo en perspectiva: tres caras con tres claridades, o no se lee el volumen. */
export function Cubo({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={2} y={2} ancho={22} />
      <path d="M-20,-34 L0,-44 L20,-34 L0,-24 Z" fill="#A5B4FC" stroke={PALETA.tinta} strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M-20,-34 L0,-24 L0,0 L-20,-10 Z" fill="#6366F1" stroke={PALETA.tinta} strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M20,-34 L0,-24 L0,0 L20,-10 Z" fill="#4338CA" stroke={PALETA.tinta} strokeWidth="1.4" strokeLinejoin="round" />
    </g>
  )
}

/** Esfera. El degradado radial y la sombra de apoyo son todo lo que la hace bola. */
export function Esfera({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={20} />
      <circle cx={0} cy={-22} r={22} fill="url(#la-esfera)" stroke={PALETA.tinta} strokeWidth="1.2" />
      <ellipse cx={-8} cy={-31} rx={7} ry={5} fill="#FFFFFF" opacity="0.45" transform="rotate(-25 -8 -31)" />
    </g>
  )
}

export function Cilindro({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={18} />
      <path d="M-17,-38 L-17,-6 A17,7 0 0 0 17,-6 L17,-38 Z" fill="#818CF8" stroke={PALETA.tinta} strokeWidth="1.4" />
      <ellipse cx={0} cy={-38} rx={17} ry={7} fill="#C7D2FE" stroke={PALETA.tinta} strokeWidth="1.4" />
      <path d="M-13,-36 L-13,-9" stroke="#FFFFFF" strokeWidth="3" opacity="0.3" strokeLinecap="round" />
    </g>
  )
}

export function Piramide({ x, y, s = 1 }: Pieza) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Apoyo x={0} y={2} ancho={22} />
      <path d="M0,-46 L22,-4 L0,4 Z" fill="#4338CA" stroke={PALETA.tinta} strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M0,-46 L-22,-4 L0,4 Z" fill="#818CF8" stroke={PALETA.tinta} strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M0,-46 L-9,-22 L0,-18 Z" fill="#FFFFFF" opacity="0.22" />
    </g>
  )
}
