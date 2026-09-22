/**
 * Ilustraciones animadas de las lecciones.
 *
 * Cada escena es un SVG que muestra el MECANISMO del tema, no un adorno: el
 * reparto que parte un entero, el ciclo que da la vuelta, la cadena que pasa
 * la energía. Si la imagen no explica nada, sobra.
 *
 * Son parametrizables (`labels`, `values`) para que una misma escena sirva a
 * varias lecciones: el diagrama de ciclo vale para el agua y para cualquier
 * proceso circular; el de barras, para comparar fracciones y porcentajes.
 *
 * Server Components: no hay estado, todo el movimiento es CSS. La lección se
 * lee en teléfonos modestos y no debería costar JavaScript.
 */

import {
  Defs,
  Apoyo,
  Persona,
  Arbol,
  Montana,
  Nube,
  Sol,
  Gota,
  Suelo,
  Vaso,
  Casa,
  Edificio,
  Libro,
  Bombillo,
  Panel,
  Bandera,
  Papel,
  Jarra,
  Balanza,
  Flecha,
  Pin,
  Panel2,
  Texto,
  PALETA,
} from './lesson-art'

export interface SceneProps {
  labels?: string[]
  values?: number[]
}

const TRAZO = '#6366F1'
const SUAVE = '#C7D2FE'
const TINTA = '#312E81'
const ACENTO = '#F97316'
const VERDE = '#10B981'

/** Marco común: mismo tamaño y respiración para todas las escenas. */
function Marco({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 400 220" className="w-full h-full" role="img" aria-hidden="true">
      {children}
    </svg>
  )
}

function Rotulo({
  x,
  y,
  children,
  anchor = 'middle',
  fill = TINTA,
}: {
  x: number
  y: number
  children: React.ReactNode
  anchor?: 'start' | 'middle' | 'end'
  fill?: string
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fill={fill}
      fontSize="13"
      fontWeight="600"
      fontFamily="inherit"
    >
      {children}
    </text>
  )
}

// ── Reparto: un entero partido en partes iguales que se van llenando ───────
function Reparto({ values = [4, 1] }: SceneProps) {
  const [partes, tomadas] = values
  const r = 68
  const cx = 200
  const cy = 105

  const sector = (i: number) => {
    const a0 = (i / partes) * 2 * Math.PI - Math.PI / 2
    const a1 = ((i + 1) / partes) * 2 * Math.PI - Math.PI / 2
    const x0 = cx + r * Math.cos(a0)
    const y0 = cy + r * Math.sin(a0)
    const x1 = cx + r * Math.cos(a1)
    const y1 = cy + r * Math.sin(a1)
    const largo = a1 - a0 > Math.PI ? 1 : 0
    return `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${largo} 1 ${x1} ${y1} Z`
  }

  return (
    <Marco>
      {Array.from({ length: partes }, (_, i) => (
        <path
          key={i}
          d={sector(i)}
          fill={i < tomadas ? ACENTO : '#FFFFFF'}
          stroke={TRAZO}
          strokeWidth="2.5"
          className={i < tomadas ? 'leccion-aparece' : undefined}
          style={i < tomadas ? { animationDelay: `${i * 0.35}s` } : undefined}
        />
      ))}
      <Rotulo x={200} y={205}>
        {`${tomadas} de ${partes} partes iguales = ${tomadas}/${partes}`}
      </Rotulo>
    </Marco>
  )
}

// ── Barras: comparar dos cantidades ────────────────────────────────────────
function Barras({ labels = ['A', 'B'], values = [50, 80] }: SceneProps) {
  const max = Math.max(...values, 1)
  return (
    <Marco>
      {values.map((v, i) => {
        const ancho = (v / max) * 250
        const y = 50 + i * 70
        return (
          <g key={i}>
            <rect x={95} y={y} width={250} height={38} rx={8} fill="#EEF2FF" />
            <rect
              x={95}
              y={y}
              width={ancho}
              height={38}
              rx={8}
              fill={i === 0 ? TRAZO : ACENTO}
              className="leccion-crece"
              style={{ animationDelay: `${i * 0.4}s`, transformOrigin: '95px center' }}
            />
            <Rotulo x={88} y={y + 25} anchor="end">
              {labels[i] ?? ''}
            </Rotulo>
          </g>
        )
      })}
    </Marco>
  )
}

// ── Recta numérica: un punto que se ubica ──────────────────────────────────
function Recta({ labels = ['0', '1'], values = [0.5] }: SceneProps) {
  const x0 = 60
  const x1 = 340
  const pos = x0 + (values[0] ?? 0.5) * (x1 - x0)
  return (
    <Marco>
      <line x1={x0} y1={110} x2={x1} y2={110} stroke={TRAZO} strokeWidth="3" strokeLinecap="round" />
      {Array.from({ length: 11 }, (_, i) => {
        const x = x0 + (i / 10) * (x1 - x0)
        return <line key={i} x1={x} y1={102} x2={x} y2={118} stroke={SUAVE} strokeWidth="2" />
      })}
      <line x1={x0} y1={96} x2={x0} y2={124} stroke={TRAZO} strokeWidth="3" />
      <line x1={x1} y1={96} x2={x1} y2={124} stroke={TRAZO} strokeWidth="3" />
      <Rotulo x={x0} y={148}>{labels[0] ?? '0'}</Rotulo>
      <Rotulo x={x1} y={148}>{labels[1] ?? '1'}</Rotulo>

      <g className="leccion-desliza" style={{ ['--destino' as string]: `${pos - x0}px` }}>
        <circle cx={x0} cy={110} r={11} fill={ACENTO} stroke="#FFFFFF" strokeWidth="3" />
      </g>
      <Rotulo x={pos} y={78} fill={ACENTO}>{labels[2] ?? ''}</Rotulo>
    </Marco>
  )
}

// ── Ciclo: cuatro etapas en círculo, iluminándose por turnos ───────────────
function Ciclo({ labels = ['Uno', 'Dos', 'Tres', 'Cuatro'] }: SceneProps) {
  const cx = 200
  const cy = 112
  const r = 58
  const n = labels.length

  return (
    <Marco>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={SUAVE} strokeWidth="3" strokeDasharray="7 7" />
      {labels.map((t, i) => {
        const a = (i / n) * 2 * Math.PI - Math.PI / 2
        const cos = Math.cos(a)
        const sin = Math.sin(a)
        const x = cx + r * cos
        const y = cy + r * sin

        // El rótulo se ancla SEGÚN su lado: a la derecha del círculo empieza
        // el texto, a la izquierda termina. Con todos centrados, las palabras
        // largas se montaban encima del número.
        const aLaDerecha = cos > 0.3
        const aLaIzquierda = cos < -0.3
        const anchor = aLaDerecha ? 'start' : aLaIzquierda ? 'end' : 'middle'
        const lx = x + (aLaDerecha ? 24 : aLaIzquierda ? -24 : 0)
        const ly = anchor === 'middle' ? y + (sin < 0 ? -26 : 32) : y + 5

        return (
          <g key={i}>
            <circle
              cx={x}
              cy={y}
              r={15}
              fill={TRAZO}
              className="leccion-pulso"
              style={{ animationDelay: `${i * 0.7}s` }}
            />
            <text x={x} y={y + 5} textAnchor="middle" fill="#FFF" fontSize="13" fontWeight="700">
              {i + 1}
            </text>
            <Rotulo x={lx} y={ly} anchor={anchor}>{t}</Rotulo>
          </g>
        )
      })}
    </Marco>
  )
}

// ── Órbita: el Sol, un planeta que gira y rota ─────────────────────────────
function Orbita({ labels = ['Sol', 'Tierra'] }: SceneProps) {
  return (
    <Marco>
      <ellipse cx={200} cy={110} rx={120} ry={62} fill="none" stroke={SUAVE} strokeWidth="2.5" strokeDasharray="6 6" />
      <circle cx={200} cy={110} r={30} fill="#FBBF24" />
      <circle cx={200} cy={110} r={30} fill="none" stroke={ACENTO} strokeWidth="2.5" />
      <Rotulo x={200} y={116} fill="#92400E">{labels[0] ?? 'Sol'}</Rotulo>

      <g className="leccion-orbita" style={{ transformOrigin: '200px 110px' }}>
        <g transform="translate(320,110)">
          <circle r={15} fill="#60A5FA" />
          <circle r={15} fill="none" stroke={TRAZO} strokeWidth="2.5" />
          {/* La mitad oscura muestra que siempre hay un lado sin luz. */}
          <path d="M0,-15 A 15 15 0 0 1 0,15 Z" fill={TINTA} opacity="0.55" />
        </g>
      </g>
      <Rotulo x={200} y={205}>{labels[1] ?? 'La Tierra gira y a la vez da la vuelta'}</Rotulo>
    </Marco>
  )
}

// ── Estados de la materia: partículas a tres densidades ────────────────────
function Estados({ labels = ['Sólido', 'Líquido', 'Gaseoso'] }: SceneProps) {
  const cajas = [
    { x: 25, filas: 4, cols: 4, mov: 'leccion-vibra' },
    { x: 150, filas: 3, cols: 4, mov: 'leccion-fluye' },
    { x: 275, filas: 2, cols: 3, mov: 'leccion-dispersa' },
  ]
  return (
    <Marco>
      {cajas.map((c, ci) => (
        <g key={ci}>
          <rect x={c.x} y={35} width={100} height={110} rx={10} fill="#F8FAFC" stroke={TRAZO} strokeWidth="2.5" />
          {Array.from({ length: c.filas * c.cols }, (_, i) => {
            const f = Math.floor(i / c.cols)
            const col = i % c.cols
            const paso = ci === 2 ? 30 : ci === 1 ? 24 : 22
            return (
              <circle
                key={i}
                cx={c.x + 20 + col * paso}
                cy={50 + f * paso}
                r={7}
                fill={TRAZO}
                className={c.mov}
                style={{ animationDelay: `${(i % 5) * 0.18}s` }}
              />
            )
          })}
          <Rotulo x={c.x + 50} y={168}>{labels[ci] ?? ''}</Rotulo>
        </g>
      ))}
    </Marco>
  )
}

// ── Cadena: la energía pasando de un eslabón al siguiente ──────────────────
function Cadena({ labels = ['Planta', 'Herbívoro', 'Carnívoro', 'Descomponedor'] }: SceneProps) {
  const n = labels.length
  const paso = 340 / n
  return (
    <Marco>
      {labels.map((t, i) => {
        const x = 30 + paso * i + paso / 2
        return (
          <g key={i}>
            <circle
              cx={x}
              cy={92}
              r={26}
              fill={i === 0 ? VERDE : TRAZO}
              opacity="0.15"
            />
            <circle
              cx={x}
              cy={92}
              r={26}
              fill="none"
              stroke={i === 0 ? VERDE : TRAZO}
              strokeWidth="3"
              className="leccion-pulso"
              style={{ animationDelay: `${i * 0.6}s` }}
            />
            <text x={x} y={98} textAnchor="middle" fontSize="18">
              {['🌿', '🐄', '🐆', '🍄'][i] ?? '•'}
            </text>
            <text
              x={x}
              y={150}
              textAnchor="middle"
              fill={TINTA}
              fontSize="11"
              fontWeight="600"
            >
              {t}
            </text>
            {i < n - 1 && (
              <g className="leccion-fluye-flecha" style={{ animationDelay: `${i * 0.6}s` }}>
                <path
                  d={`M ${x + 30} 92 L ${x + paso - 30} 92`}
                  stroke={ACENTO}
                  strokeWidth="3"
                  markerEnd="url(#punta)"
                />
              </g>
            )}
          </g>
        )
      })}
      <defs>
        <marker id="punta" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill={ACENTO} />
        </marker>
      </defs>
    </Marco>
  )
}

// ── Cuadrícula: borde vs superficie ────────────────────────────────────────
function Cuadricula({ values = [6, 4] }: SceneProps) {
  const [ancho, alto] = values
  const celda = Math.min(160 / ancho, 110 / alto, 24)
  const x0 = 200 - (ancho * celda) / 2
  const y0 = 95 - (alto * celda) / 2

  return (
    <Marco>
      {Array.from({ length: ancho * alto }, (_, i) => {
        const c = i % ancho
        const f = Math.floor(i / ancho)
        return (
          <rect
            key={i}
            x={x0 + c * celda}
            y={y0 + f * celda}
            width={celda}
            height={celda}
            fill={ACENTO}
            opacity="0.22"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            className="leccion-aparece"
            style={{ animationDelay: `${i * 0.035}s` }}
          />
        )
      })}
      <rect
        x={x0}
        y={y0}
        width={ancho * celda}
        height={alto * celda}
        fill="none"
        stroke={TRAZO}
        strokeWidth="4"
      />
      <Rotulo x={200} y={y0 + alto * celda + 30} fill={TRAZO}>
        {`Borde (perímetro): ${2 * (ancho + alto)}`}
      </Rotulo>
      <Rotulo x={200} y={y0 + alto * celda + 50} fill={ACENTO}>
        {`Adentro (área): ${ancho * alto}`}
      </Rotulo>
    </Marco>
  )
}

// ── Agrupar: conjuntos iguales (multiplicación, valor posicional) ──────────
function Agrupar({ values = [4, 3], labels = [] }: SceneProps) {
  const [grupos, porGrupo] = values
  return (
    <Marco>
      {Array.from({ length: grupos }, (_, g) => (
        <g key={g}>
          <rect
            x={22 + g * (356 / grupos)}
            y={45}
            width={356 / grupos - 14}
            height={95}
            rx={12}
            fill="#EEF2FF"
            stroke={TRAZO}
            strokeWidth="2.5"
            strokeDasharray="5 4"
          />
          {Array.from({ length: porGrupo }, (_, i) => (
            <circle
              key={i}
              cx={22 + g * (356 / grupos) + 22 + (i % 3) * 22}
              cy={68 + Math.floor(i / 3) * 24}
              r={8}
              fill={ACENTO}
              className="leccion-aparece"
              style={{ animationDelay: `${(g * porGrupo + i) * 0.09}s` }}
            />
          ))}
        </g>
      ))}
      <Rotulo x={200} y={175}>
        {labels[0] ?? `${grupos} grupos de ${porGrupo} = ${grupos * porGrupo}`}
      </Rotulo>
    </Marco>
  )
}

// ── Sílabas: la fuerza de la voz ───────────────────────────────────────────
function Silabas({ labels = ['ca', 'mi', 'ÓN'], values = [2] }: SceneProps) {
  const fuerte = values[0] ?? labels.length - 1
  const ancho = 300 / labels.length
  return (
    <Marco>
      {labels.map((s, i) => (
        <g key={i}>
          <rect
            x={50 + i * ancho}
            y={i === fuerte ? 55 : 70}
            width={ancho - 10}
            height={i === fuerte ? 70 : 50}
            rx={10}
            fill={i === fuerte ? ACENTO : SUAVE}
            className={i === fuerte ? 'leccion-pulso' : undefined}
          />
          <text
            x={50 + i * ancho + (ancho - 10) / 2}
            y={i === fuerte ? 98 : 102}
            textAnchor="middle"
            fill={i === fuerte ? '#FFFFFF' : TINTA}
            fontSize={i === fuerte ? 24 : 19}
            fontWeight="700"
          >
            {s}
          </text>
        </g>
      ))}
      <Rotulo x={200} y={165}>{labels[labels.length] ?? 'La sílaba naranja suena más fuerte'}</Rotulo>
    </Marco>
  )
}

// ── Oración: sujeto y predicado ────────────────────────────────────────────
function Oracion({ labels = ['Los estudiantes', 'cantaron el himno'] }: SceneProps) {
  return (
    <Marco>
      <rect x={30} y={70} width={165} height={54} rx={12} fill={TRAZO} opacity="0.18" />
      <rect x={30} y={70} width={165} height={54} rx={12} fill="none" stroke={TRAZO} strokeWidth="3" />
      <text x={112} y={102} textAnchor="middle" fill={TINTA} fontSize="13" fontWeight="600">
        {labels[0]}
      </text>
      <Rotulo x={112} y={148} fill={TRAZO}>SUJETO</Rotulo>
      <Rotulo x={112} y={166} fill={TRAZO}>quién</Rotulo>

      <rect x={205} y={70} width={165} height={54} rx={12} fill={ACENTO} opacity="0.18" />
      <rect x={205} y={70} width={165} height={54} rx={12} fill="none" stroke={ACENTO} strokeWidth="3" />
      <text x={287} y={102} textAnchor="middle" fill={TINTA} fontSize="13" fontWeight="600">
        {labels[1]}
      </text>
      <Rotulo x={287} y={148} fill={ACENTO}>PREDICADO</Rotulo>
      <Rotulo x={287} y={166} fill={ACENTO}>qué hace</Rotulo>
    </Marco>
  )
}

// ── Cuerpo: una señal viajando ─────────────────────────────────────────────
function Cuerpo({ labels = ['pie', 'médula', 'cerebro'] }: SceneProps) {
  return (
    <Marco>
      <path
        d="M200 38 a16 16 0 1 1 0.1 0 M200 54 L200 130 M200 72 L168 100 M200 72 L232 100 M200 130 L176 186 M200 130 L224 186"
        fill="none"
        stroke={SUAVE}
        strokeWidth="9"
        strokeLinecap="round"
      />
      <path
        id="ruta-senal"
        d="M176 186 L200 130 L200 54"
        fill="none"
        stroke={ACENTO}
        strokeWidth="3.5"
        strokeDasharray="8 10"
        className="leccion-senal"
      />
      <circle cx={200} cy={38} r={17} fill="none" stroke={TRAZO} strokeWidth="3" className="leccion-pulso" />
      <Rotulo x={280} y={192} anchor="start">{labels[0]}</Rotulo>
      <Rotulo x={280} y={126} anchor="start">{labels[1]}</Rotulo>
      <Rotulo x={280} y={44} anchor="start">{labels[2]}</Rotulo>
    </Marco>
  )
}

// ── Línea de tiempo: hitos que se encienden ────────────────────────────────
function LineaTiempo({ labels = ['1810', '1811', '1821'] }: SceneProps) {
  const n = labels.length
  const x0 = 45
  const x1 = 355
  return (
    <Marco>
      <line x1={x0} y1={105} x2={x1} y2={105} stroke={SUAVE} strokeWidth="5" strokeLinecap="round" />
      {labels.map((t, i) => {
        const x = n === 1 ? (x0 + x1) / 2 : x0 + (i / (n - 1)) * (x1 - x0)
        const arriba = i % 2 === 0
        return (
          <g key={i}>
            <line x1={x} y1={105} x2={x} y2={arriba ? 74 : 136} stroke={TRAZO} strokeWidth="2.5" />
            <circle
              cx={x}
              cy={105}
              r={10}
              fill={ACENTO}
              className="leccion-pulso"
              style={{ animationDelay: `${i * 0.6}s` }}
            />
            <Rotulo x={x} y={arriba ? 66 : 154}>{t}</Rotulo>
          </g>
        )
      })}
    </Marco>
  )
}

// ── Relieve: altura y temperatura ──────────────────────────────────────────
function Relieve({ labels = ['Costa 33°', 'Llano 30°', 'Andes 19°'] }: SceneProps) {
  return (
    <Marco>
      <path
        d="M20 180 L110 172 L190 140 L260 70 L330 132 L380 175 L380 190 L20 190 Z"
        fill="#A5B4FC"
        opacity="0.45"
        stroke={TRAZO}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M236 96 L260 70 L284 96 Z" fill="#FFFFFF" stroke={TRAZO} strokeWidth="2" />
      <circle cx={60} cy={172} r={7} fill={ACENTO} className="leccion-pulso" />
      <Rotulo x={60} y={158}>{labels[0]}</Rotulo>
      <circle cx={175} cy={146} r={7} fill={ACENTO} className="leccion-pulso" style={{ animationDelay: '0.5s' }} />
      <Rotulo x={175} y={132}>{labels[1]}</Rotulo>
      <circle cx={260} cy={70} r={7} fill={TRAZO} className="leccion-pulso" style={{ animationDelay: '1s' }} />
      <Rotulo x={260} y={56} fill={TRAZO}>{labels[2]}</Rotulo>
    </Marco>
  )
}


// ═══════════════════════════════════════════════════════════════════════════
// Escenas de primero y segundo grado.
//
// Las de arriba explican procesos (ciclos, cadenas, sistemas). A un niño de
// seis años hay que mostrarle OBJETOS QUE SE CUENTAN: cubos que se agrupan de
// diez, fichas que se juntan, fichas que se tachan. La ilustración acá no
// acompaña al texto, lo sustituye: quien todavía lee con dificultad tiene que
// poder entender el dibujo solo.
// ═══════════════════════════════════════════════════════════════════════════

/** Un cubito de la base diez. */
function Cubo({ x, y, relleno = TRAZO }: { x: number; y: number; relleno?: string }) {
  return <rect x={x} y={y} width={13} height={13} rx={2.5} fill={relleno} stroke="#FFFFFF" strokeWidth="1.5" />
}

// ── Decenas: barras de diez y unidades sueltas ─────────────────────────────
function Decenas({ values = [3, 4], labels = [] }: SceneProps) {
  const [decenas, unidades] = values
  const total = decenas * 10 + unidades

  return (
    <Marco>
      {/* Cada barra es una decena: diez cubos pegados. Se ve de un vistazo
          que "3 decenas" son treinta cosas y no el dígito 3. */}
      {Array.from({ length: decenas }, (_, d) => (
        <g
          key={d}
          className="leccion-aparece"
          style={{ animationDelay: `${d * 0.18}s` }}
        >
          <rect x={26 + d * 30} y={30} width={19} height={73} rx={4} fill="#EEF2FF" stroke={TRAZO} strokeWidth="2" />
          {Array.from({ length: 10 }, (_, i) => (
            <Cubo key={i} x={29 + d * 30} y={33 + i * 7} />
          ))}
        </g>
      ))}

      {Array.from({ length: unidades }, (_, u) => (
        <g
          key={u}
          className="leccion-aparece"
          style={{ animationDelay: `${(decenas + u) * 0.18}s` }}
        >
          <Cubo x={40 + decenas * 30 + (u % 5) * 18} y={30 + Math.floor(u / 5) * 18} relleno={ACENTO} />
        </g>
      ))}

      <Rotulo x={26} y={130} anchor="start" fill={TRAZO}>
        {`${decenas} ${decenas === 1 ? 'decena' : 'decenas'}`}
      </Rotulo>
      <Rotulo x={34 + decenas * 30} y={130} anchor="start" fill={ACENTO}>
        {`${unidades} ${unidades === 1 ? 'unidad' : 'unidades'}`}
      </Rotulo>

      <line x1={26} y1={148} x2={374} y2={148} stroke={SUAVE} strokeWidth="2" />
      <text x={200} y={188} textAnchor="middle" fill={TINTA} fontSize="30" fontWeight="800" fontFamily="inherit">
        {total}
      </text>
      {labels[0] && <Rotulo x={200} y={210}>{labels[0]}</Rotulo>}
    </Marco>
  )
}

// ── Juntar: dos grupos que se suman ────────────────────────────────────────
function Juntar({ values = [7, 5], labels = [] }: SceneProps) {
  const [a, b] = values
  const ficha = (x: number, y: number, color: string, i: number) => (
    <circle
      key={`${color}-${i}`}
      cx={x}
      cy={y}
      r={9}
      fill={color}
      className="leccion-aparece"
      style={{ animationDelay: `${i * 0.08}s` }}
    />
  )

  const fila = (n: number, x0: number, y0: number, color: string) =>
    Array.from({ length: n }, (_, i) =>
      ficha(x0 + (i % 5) * 24, y0 + Math.floor(i / 5) * 24, color, i),
    )

  return (
    <Marco>
      <rect x={20} y={28} width={140} height={78} rx={14} fill="#EEF2FF" />
      {fila(a, 42, 50, TRAZO)}
      <Rotulo x={90} y={122} fill={TRAZO}>{String(a)}</Rotulo>

      <text x={200} y={78} textAnchor="middle" fill={TINTA} fontSize="30" fontWeight="800" fontFamily="inherit">+</text>

      <rect x={240} y={28} width={140} height={78} rx={14} fill="#FFF7ED" />
      {fila(b, 262, 50, ACENTO)}
      <Rotulo x={310} y={122} fill={ACENTO}>{String(b)}</Rotulo>

      {/* Las dos flechas convergen: sumar es JUNTAR, no una cuenta abstracta. */}
      <path d="M90 132 Q 150 160 190 166" stroke={SUAVE} strokeWidth="3" fill="none" strokeLinecap="round" className="leccion-desliza" />
      <path d="M310 132 Q 250 160 210 166" stroke={SUAVE} strokeWidth="3" fill="none" strokeLinecap="round" className="leccion-desliza" />

      <rect x={130} y={162} width={140} height={44} rx={14} fill={VERDE} className="leccion-crece" />
      <text x={200} y={192} textAnchor="middle" fill="#FFFFFF" fontSize="24" fontWeight="800" fontFamily="inherit">
        {labels[0] ?? `${a} + ${b} = ${a + b}`}
      </text>
    </Marco>
  )
}

// ── Quitar: fichas que se van ──────────────────────────────────────────────
function Quitar({ values = [15, 6], labels = [] }: SceneProps) {
  const [total, quitados] = values
  const quedan = total - quitados

  return (
    <Marco>
      {Array.from({ length: total }, (_, i) => {
        const seVa = i >= quedan
        const x = 44 + (i % 8) * 40
        const y = 46 + Math.floor(i / 8) * 46
        return (
          <g key={i}>
            <circle
              cx={x}
              cy={y}
              r={15}
              fill={seVa ? '#FFFFFF' : TRAZO}
              stroke={seVa ? '#CBD5E1' : TRAZO}
              strokeWidth="2.5"
              strokeDasharray={seVa ? '4 4' : undefined}
            />
            {/* Lo que se quita no desaparece: queda tachado. Así el niño ve
                cuántos había, cuántos se fueron y cuántos quedan, todo junto. */}
            {seVa && (
              <g
                className="leccion-aparece"
                style={{ animationDelay: `${(i - quedan) * 0.2}s` }}
                stroke="#EF4444"
                strokeWidth="3"
                strokeLinecap="round"
              >
                <line x1={x - 8} y1={y - 8} x2={x + 8} y2={y + 8} />
                <line x1={x + 8} y1={y - 8} x2={x - 8} y2={y + 8} />
              </g>
            )}
          </g>
        )
      })}

      <Rotulo x={200} y={168} fill="#EF4444">{`se van ${quitados}`}</Rotulo>
      <text x={200} y={202} textAnchor="middle" fill={TINTA} fontSize="24" fontWeight="800" fontFamily="inherit">
        {labels[0] ?? `${total} − ${quitados} = ${quedan}`}
      </text>
    </Marco>
  )
}

// ── Figuras: lados y esquinas contados ─────────────────────────────────────
function Figuras({
  // 0-3: nombre de cada figura. 4-7: su rasgo distintivo, en el mismo orden.
  labels = ['Círculo', 'Triángulo', 'Cuadrado', 'Rectángulo', 'sin esquinas', '3 lados', '4 iguales', '2 largos, 2 cortos'],
}: SceneProps) {
  const vertice = (x: number, y: number, i: number) => (
    <circle key={i} cx={x} cy={y} r={4.5} fill={ACENTO} className="leccion-aparece" style={{ animationDelay: `${0.3 + i * 0.12}s` }} />
  )

  return (
    <Marco>
      <g fill="#FFFFFF" stroke={TRAZO} strokeWidth="3">
        <circle cx={54} cy={70} r={32} />
        <polygon points="150,40 182,102 118,102" />
        <rect x={218} y={40} width={62} height={62} rx={3} />
        <rect x={314} y={51} width={68} height={40} rx={3} />
      </g>

      {[[150, 40], [182, 102], [118, 102]].map(([x, y], i) => vertice(x, y, i))}
      {[[218, 40], [280, 40], [280, 102], [218, 102]].map(([x, y], i) => vertice(x, y, i + 3))}

      <Rotulo x={54} y={126}>{labels[0]}</Rotulo>
      <Rotulo x={150} y={126}>{labels[1]}</Rotulo>
      <Rotulo x={249} y={126}>{labels[2]}</Rotulo>
      <Rotulo x={348} y={126}>{labels[3]}</Rotulo>

      <Rotulo x={54} y={146} fill={ACENTO}>{labels[4] ?? 'sin esquinas'}</Rotulo>
      <Rotulo x={150} y={146} fill={ACENTO}>{labels[5] ?? '3 lados'}</Rotulo>
      <Rotulo x={249} y={146} fill={ACENTO}>{labels[6] ?? '4 iguales'}</Rotulo>
      <Rotulo x={348} y={146} fill={ACENTO}>{labels[7] ?? '2 largos, 2 cortos'}</Rotulo>

      {/* La diferencia que más cuesta: cuadrado y rectángulo tienen los
          mismos 4 lados; lo que cambia es que midan igual o no. */}
      <rect x={116} y={162} width={268} height={44} rx={12} fill="#FFF7ED" />
      <Rotulo x={250} y={182} fill={ACENTO}>Los dos tienen 4 lados.</Rotulo>
      <Rotulo x={250} y={198} fill={ACENTO}>El cuadrado los tiene todos del mismo largo</Rotulo>
    </Marco>
  )
}

// ── Letras: vocales entre consonantes ──────────────────────────────────────
function Letras({ labels = ['a', 'e', 'i', 'o', 'u'] }: SceneProps) {
  const abc = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('')
  const vocales = new Set(['A', 'E', 'I', 'O', 'U'])

  return (
    <Marco>
      {abc.map((l, i) => {
        const x = 24 + (i % 14) * 26
        const y = 42 + Math.floor(i / 14) * 40
        const esVocal = vocales.has(l)
        return (
          <g key={l} className={esVocal ? 'leccion-pulso' : undefined} style={esVocal ? { animationDelay: `${i * 0.1}s` } : undefined}>
            <rect x={x - 11} y={y - 17} width={23} height={30} rx={6} fill={esVocal ? ACENTO : '#EEF2FF'} />
            <text x={x} y={y + 5} textAnchor="middle" fill={esVocal ? '#FFFFFF' : TINTA} fontSize="16" fontWeight="700" fontFamily="inherit">
              {l}
            </text>
          </g>
        )
      })}

      <Rotulo x={200} y={140} fill={ACENTO}>{`Las 5 vocales: ${labels.join('  ')}`}</Rotulo>
      <Rotulo x={200} y={166}>Las demás son consonantes</Rotulo>
      <Rotulo x={200} y={196} fill={TRAZO}>La Ñ va justo después de la N</Rotulo>
    </Marco>
  )
}

// ── Vivo: lo que hace un ser vivo y una cosa no ────────────────────────────
function Vivo({ labels = ['nace', 'crece', 'se reproduce'] }: SceneProps) {
  return (
    <Marco>
      <rect x={16} y={24} width={180} height={168} rx={16} fill="#ECFDF5" />
      <rect x={204} y={24} width={180} height={168} rx={16} fill="#F1F5F9" />

      {/* Izquierda: una semilla que se vuelve planta y da semillas. */}
      <g className="leccion-aparece">
        <circle cx={52} cy={100} r={9} fill="#92400E" />
        <Rotulo x={52} y={128} fill={VERDE}>{labels[0]}</Rotulo>
      </g>
      <g className="leccion-aparece" style={{ animationDelay: '0.5s' }}>
        <path d="M106 112 L106 76" stroke={VERDE} strokeWidth="4" strokeLinecap="round" />
        <ellipse cx={95} cy={82} rx={13} ry={7} fill={VERDE} />
        <ellipse cx={117} cy={90} rx={13} ry={7} fill={VERDE} />
        <Rotulo x={106} y={128} fill={VERDE}>{labels[1]}</Rotulo>
      </g>
      <g className="leccion-aparece" style={{ animationDelay: '1s' }}>
        <path d="M160 112 L160 66" stroke={VERDE} strokeWidth="4" strokeLinecap="round" />
        <circle cx={160} cy={58} r={11} fill={ACENTO} />
        <circle cx={146} cy={96} r={4} fill="#92400E" />
        <circle cx={174} cy={100} r={4} fill="#92400E" />
        <Rotulo x={160} y={128} fill={VERDE}>{labels[2]}</Rotulo>
      </g>
      <Rotulo x={106} y={176} fill={VERDE}>Está VIVO</Rotulo>

      {/* Derecha: una piedra que no hace nada de eso. */}
      <path d="M262 108 Q 276 76 308 82 Q 340 88 336 112 Q 330 130 294 128 Q 264 126 262 108 Z" fill="#94A3B8" />
      <g stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round">
        <line x1={250} y1={150} x2={340} y2={150} />
      </g>
      <Rotulo x={294} y={172} fill="#64748B">No nace, no crece,</Rotulo>
      <Rotulo x={294} y={190} fill="#64748B">no se reproduce</Rotulo>
    </Marco>
  )
}

// ── Sentidos: la cara y sus cinco puertas ──────────────────────────────────
function Sentidos({ labels = ['Vista', 'Oído', 'Olfato', 'Gusto', 'Tacto'] }: SceneProps) {
  const puerta = (x: number, y: number, texto: string, i: number) => (
    <g key={texto} className="leccion-aparece" style={{ animationDelay: `${i * 0.25}s` }}>
      <line x1={200} y1={100} x2={x} y2={y} stroke={SUAVE} strokeWidth="2.5" />
      <rect x={x - 42} y={y - 15} width={84} height={30} rx={10} fill={ACENTO} />
      <text x={x} y={y + 5} textAnchor="middle" fill="#FFFFFF" fontSize="13" fontWeight="700" fontFamily="inherit">{texto}</text>
    </g>
  )

  return (
    <Marco>
      <circle cx={200} cy={100} r={52} fill="#FEF3C7" stroke={TRAZO} strokeWidth="3" />
      <circle cx={184} cy={88} r={6} fill={TINTA} />
      <circle cx={216} cy={88} r={6} fill={TINTA} />
      <path d="M200 96 L200 112" stroke={TINTA} strokeWidth="3" strokeLinecap="round" />
      <path d="M182 126 Q 200 138 218 126" stroke={TINTA} strokeWidth="3" fill="none" strokeLinecap="round" />

      {puerta(74, 44, labels[0], 0)}
      {puerta(326, 44, labels[1], 1)}
      {puerta(62, 110, labels[2], 2)}
      {puerta(338, 110, labels[3], 3)}
      {puerta(200, 192, labels[4], 4)}
    </Marco>
  )
}

// ── Turnos: el desorden y la fila ──────────────────────────────────────────
function Turnos({ labels = ['Todos a la vez', 'Por turnos'] }: SceneProps) {
  const nino = (x: number, y: number, color: string, i: number) => (
    <g key={i}>
      <circle cx={x} cy={y} r={11} fill={color} />
      <path d={`M${x - 11} ${y + 32} Q ${x} ${y + 12} ${x + 11} ${y + 32} Z`} fill={color} />
    </g>
  )

  return (
    <Marco>
      <rect x={16} y={20} width={180} height={150} rx={16} fill="#FEF2F2" />
      <rect x={204} y={20} width={180} height={150} rx={16} fill="#ECFDF5" />

      {/* Amontonados y encimados: se ve el choque sin necesidad de leerlo. */}
      <g className="leccion-vibra">
        {nino(78, 74, '#EF4444', 0)}
        {nino(96, 82, '#F87171', 1)}
        {nino(112, 70, '#DC2626', 2)}
        {nino(88, 100, '#FCA5A5', 3)}
      </g>
      <rect x={140} y={60} width={16} height={64} rx={4} fill="#94A3B8" />
      <Rotulo x={106} y={152} fill="#DC2626">{labels[0]}</Rotulo>

      {/* Separados y en orden, apuntando al mismo tobogán. */}
      {[0, 1, 2, 3].map((i) => nino(238 + i * 30, 74, VERDE, i + 4))}
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M${254 + i * 30} 74 L${262 + i * 30} 74`} stroke={VERDE} strokeWidth="2.5" markerEnd="" strokeLinecap="round" />
      ))}
      <rect x={358} y={60} width={16} height={64} rx={4} fill="#94A3B8" />
      <Rotulo x={294} y={152} fill={VERDE}>{labels[1]}</Rotulo>

      <Rotulo x={200} y={192}>La norma no te quita el turno: te lo asegura</Rotulo>
    </Marco>
  )
}

// ── Puntuación: dónde empieza y dónde termina una oración ──────────────────
function Puntuacion({ labels = ['M', 'i mamá cocina arepas', '.'], values = [] }: SceneProps) {
  // El signo de cierre sale del rótulo, no de un número aparte: antes
  // `labels[2]` se enviaba y se ignoraba en silencio, que es justo el error
  // que tenía `Coma`. `values[0] = 1` sigue funcionando como anulación por si
  // una lección vieja lo usa.
  const cierre = labels[2] ?? '.'
  const esPregunta = values[0] === 1 || cierre === '?'

  return (
    <Marco>
      <rect x={24} y={46} width={352} height={72} rx={16} fill="#FFFFFF" stroke={SUAVE} strokeWidth="2.5" />

      {/* La mayúscula y el punto se destacan en naranja: son lo único que
          hay que mirar, y están justo en los dos extremos. */}
      {esPregunta && (
        <text x={48} y={94} fill={ACENTO} fontSize="34" fontWeight="800" fontFamily="inherit" className="leccion-pulso">¿</text>
      )}
      <text x={esPregunta ? 72 : 48} y={92} fill={ACENTO} fontSize="30" fontWeight="800" fontFamily="inherit" className="leccion-pulso">
        {labels[0]}
      </text>
      <text x={esPregunta ? 96 : 72} y={92} fill={TINTA} fontSize="21" fontWeight="600" fontFamily="inherit">
        {labels[1]}
      </text>

      <g className="leccion-pulso" style={{ animationDelay: '0.8s' }}>
        <circle cx={348} cy={86} r={13} fill={ACENTO} />
        <text x={348} y={94} textAnchor="middle" fill="#FFFFFF" fontSize="20" fontWeight="800" fontFamily="inherit">
          {cierre}
        </text>
      </g>

      <path d="M48 118 L48 142" stroke={ACENTO} strokeWidth="2.5" strokeDasharray="4 4" />
      <path d="M348 104 L348 142" stroke={ACENTO} strokeWidth="2.5" strokeDasharray="4 4" />
      <Rotulo x={64} y={160} anchor="start" fill={ACENTO}>
        {esPregunta ? 'abre con ¿' : 'empieza con MAYÚSCULA'}
      </Rotulo>
      <Rotulo x={348} y={160} anchor="end" fill={ACENTO}>
        {esPregunta ? `cierra con ${cierre}` : `termina con ${cierre === '.' ? 'PUNTO' : cierre}`}
      </Rotulo>
      <Rotulo x={200} y={196}>Así se sabe dónde empieza y dónde termina</Rotulo>
    </Marco>
  )
}

// ── Día y noche: la Tierra girando frente al Sol ───────────────────────────
function DiaNoche({ labels = ['Sol', 'de día', 'de noche'] }: SceneProps) {
  return (
    <Marco>
      <g className="leccion-pulso">
        <circle cx={58} cy={104} r={34} fill="#FBBF24" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
          const r = (a * Math.PI) / 180
          return (
            <line
              key={a}
              x1={58 + 40 * Math.cos(r)}
              y1={104 + 40 * Math.sin(r)}
              x2={58 + 50 * Math.cos(r)}
              y2={104 + 50 * Math.sin(r)}
              stroke="#FBBF24"
              strokeWidth="4"
              strokeLinecap="round"
            />
          )
        })}
      </g>
      <Rotulo x={58} y={172} fill="#B45309">{labels[0]}</Rotulo>

      {/* Rayos que cruzan: dejan claro que la luz viene de un solo lado. */}
      {[78, 104, 130].map((y, i) => (
        <path key={y} d={`M116 ${y} L212 ${y}`} stroke="#FDE68A" strokeWidth="4" strokeLinecap="round" className="leccion-fluye" style={{ animationDelay: `${i * 0.4}s` }} />
      ))}

      <g>
        <circle cx={278} cy={104} r={54} fill="#1E1B4B" />
        {/* Media esfera iluminada: la mitad que mira al Sol. */}
        <path d="M278 50 A 54 54 0 0 0 278 158 Z" fill="#38BDF8" />
        <circle cx={278} cy={104} r={54} fill="none" stroke={TRAZO} strokeWidth="3" />
        <path d="M278 50 L278 158" stroke={TRAZO} strokeWidth="2" strokeDasharray="5 5" />
      </g>

      <Rotulo x={244} y={108} fill="#0C4A6E">{labels[1]}</Rotulo>
      <Rotulo x={316} y={108} fill="#E0E7FF">{labels[2]}</Rotulo>

      <g className="leccion-orbita" style={{ transformOrigin: '278px 104px' }}>
        <circle cx={278} cy={50} r={6} fill={ACENTO} />
      </g>
      <Rotulo x={278} y={188}>La Tierra gira: por eso cambia de día a noche</Rotulo>
    </Marco>
  )
}

// ── Regla: medir empezando en el cero ──────────────────────────────────────
function Regla({ values = [18], labels = ['lápiz'] }: SceneProps) {
  const cm = values[0]
  const x0 = 40
  const paso = 16

  return (
    <Marco>
      {/* El lápiz arranca exactamente en el 0, que es el error que más se
          comete: medir desde el borde de la regla. */}
      <g className="leccion-desliza">
        <rect x={x0} y={52} width={cm * paso} height={22} rx={4} fill="#FCD34D" stroke={TINTA} strokeWidth="2" />
        <polygon points={`${x0 + cm * paso},52 ${x0 + cm * paso + 22},63 ${x0 + cm * paso},74`} fill="#FDE68A" stroke={TINTA} strokeWidth="2" />
        <rect x={x0} y={52} width={14} height={22} rx={3} fill="#F87171" />
      </g>

      <rect x={x0 - 8} y={98} width={340} height={46} rx={6} fill="#EEF2FF" stroke={TRAZO} strokeWidth="2" />
      {Array.from({ length: 21 }, (_, i) => (
        <g key={i}>
          <line x1={x0 + i * paso} y1={98} x2={x0 + i * paso} y2={i % 5 === 0 ? 122 : 112} stroke={TRAZO} strokeWidth={i % 5 === 0 ? 2.5 : 1.5} />
          {i % 5 === 0 && (
            <text x={x0 + i * paso} y={138} textAnchor="middle" fill={TINTA} fontSize="11" fontWeight="700" fontFamily="inherit">{i}</text>
          )}
        </g>
      ))}

      <circle cx={x0} cy={86} r={6} fill={VERDE} className="leccion-pulso" />
      <Rotulo x={x0} y={42} fill={VERDE}>empieza en el 0</Rotulo>

      <Rotulo x={200} y={170} fill={ACENTO}>{`El ${labels[0]} mide ${cm} centímetros`}</Rotulo>
      <Rotulo x={200} y={196}>100 centímetros son 1 metro</Rotulo>
    </Marco>
  )
}

// ── Describir: el sustantivo y los adjetivos que se le pegan ───────────────
function Describir({ labels = ['perro', 'negro', 'grande', 'juguetón'] }: SceneProps) {
  const [nombre, ...adjetivos] = labels

  return (
    <Marco>
      <rect x={140} y={82} width={120} height={56} rx={16} fill={TRAZO} />
      <text x={200} y={110} textAnchor="middle" fill="#FFFFFF" fontSize="20" fontWeight="800" fontFamily="inherit">{nombre}</text>
      <text x={200} y={128} textAnchor="middle" fill="#C7D2FE" fontSize="11" fontWeight="600" fontFamily="inherit">sustantivo</text>

      {/* Los adjetivos llegan y se enganchan: describen a alguien, no viven
          solos. La flecha va SIEMPRE hacia el sustantivo. */}
      {adjetivos.map((a, i) => {
        const pos = [
          { x: 66, y: 48 },
          { x: 334, y: 48 },
          { x: 200, y: 176 },
        ][i] ?? { x: 200, y: 176 }
        return (
          <g key={a} className="leccion-aparece" style={{ animationDelay: `${0.4 + i * 0.3}s` }}>
            <line x1={pos.x} y1={pos.y} x2={200} y2={110} stroke={ACENTO} strokeWidth="2.5" strokeDasharray="5 4" />
            <rect x={pos.x - 48} y={pos.y - 16} width={96} height={32} rx={11} fill="#FFF7ED" stroke={ACENTO} strokeWidth="2" />
            <text x={pos.x} y={pos.y + 5} textAnchor="middle" fill={ACENTO} fontSize="14" fontWeight="700" fontFamily="inherit">{a}</text>
          </g>
        )
      })}

      <Rotulo x={200} y={210}>El adjetivo dice CÓMO es el sustantivo</Rotulo>
    </Marco>
  )
}

// ── Planta: sus partes y el agua subiendo ──────────────────────────────────
function Planta({
  // 0-3: nombres de las partes. 4-7: qué hace cada una, en el mismo orden.
  labels = ['raíz', 'tallo', 'hoja', 'flor', 'toma agua del suelo', 'sube el agua', 'hace el alimento', 'da el fruto'],
}: SceneProps) {
  // La planta va corrida a la izquierda para dejar la mitad derecha libre a
  // los rótulos: centrada, "hoja: hace alimento" se salía del recuadro.
  const eje = 142

  return (
    <Marco>
      <rect x={0} y={150} width={400} height={70} fill="#D6C3A5" />
      <line x1={0} y1={150} x2={400} y2={150} stroke="#A98467" strokeWidth="3" />

      <g stroke="#92400E" strokeWidth="3.5" strokeLinecap="round" fill="none">
        <path d={`M${eje} 150 L${eje} 196`} />
        <path d={`M${eje} 168 L${eje - 28} 194`} />
        <path d={`M${eje} 168 L${eje + 28} 194`} />
      </g>

      <path d={`M${eje} 150 L${eje} 62`} stroke={VERDE} strokeWidth="6" strokeLinecap="round" />
      <ellipse cx={eje - 38} cy={112} rx={28} ry={13} fill={VERDE} transform={`rotate(-18 ${eje - 38} 112)`} />
      <ellipse cx={eje + 38} cy={96} rx={28} ry={13} fill={VERDE} transform={`rotate(18 ${eje + 38} 96)`} />

      <g className="leccion-pulso">
        <circle cx={eje} cy={54} r={14} fill={ACENTO} />
        {[0, 72, 144, 216, 288].map((a) => {
          const r = (a * Math.PI) / 180
          const px = eje + 21 * Math.cos(r)
          const py = 54 + 21 * Math.sin(r)
          return <ellipse key={a} cx={px} cy={py} rx={10} ry={6.5} fill="#FDBA74" transform={`rotate(${a} ${px} ${py})`} />
        })}
      </g>

      {/* Gotas subiendo por el tallo: el agua entra por la raíz y sube. */}
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={eje} cy={140} r={4} fill="#38BDF8" className="leccion-fluye" style={{ animationDelay: `${i * 1.1}s` }} />
      ))}

      <g stroke={SUAVE} strokeWidth="2" strokeDasharray="4 4">
        <line x1={eje} y1={186} x2={228} y2={186} />
        <line x1={eje} y1={124} x2={228} y2={124} />
        <line x1={eje + 60} y1={94} x2={228} y2={80} />
        <line x1={eje + 16} y1={54} x2={228} y2={40} />
      </g>

      {/* Nombre y función en dos líneas: una sola no entra sin achicar la
          letra, y en primer grado achicar la letra no es opción. */}
      <Rotulo x={236} y={38} anchor="start" fill={ACENTO}>{labels[3]}</Rotulo>
      <Rotulo x={236} y={54} anchor="start">{labels[7] ?? 'da el fruto'}</Rotulo>

      <Rotulo x={236} y={78} anchor="start" fill={VERDE}>{labels[2]}</Rotulo>
      <Rotulo x={236} y={94} anchor="start">{labels[6] ?? 'hace el alimento'}</Rotulo>

      <Rotulo x={236} y={122} anchor="start" fill={VERDE}>{labels[1]}</Rotulo>
      <Rotulo x={236} y={138} anchor="start">{labels[5] ?? 'sube el agua'}</Rotulo>

      <Rotulo x={236} y={184} anchor="start" fill="#92400E">{labels[0]}</Rotulo>
      <Rotulo x={236} y={200} anchor="start">{labels[4] ?? 'toma agua del suelo'}</Rotulo>
    </Marco>
  )
}

// ── Hábitat: cada animal en el lugar que le sirve ──────────────────────────
function Habitat({ labels = ['Mar', 'Montaña', 'Llano'] }: SceneProps) {
  return (
    <Marco>
      {/* Mar */}
      <rect x={14} y={38} width={116} height={116} rx={14} fill="#BAE6FD" />
      <path d="M14 120 Q 44 110 72 120 Q 100 130 130 120 L130 154 L14 154 Z" fill="#38BDF8" />
      <g className="leccion-desliza">
        <ellipse cx={72} cy={92} rx={26} ry={12} fill="#0284C7" />
        <polygon points="46,92 30,80 34,98" fill="#0284C7" />
        <path d="M72 80 L80 66 L88 80 Z" fill="#0284C7" />
      </g>
      <Rotulo x={72} y={176}>{labels[0]}</Rotulo>

      <rect x={142} y={38} width={116} height={116} rx={14} fill="#E0E7FF" />
      <polygon points="150,150 196,66 242,150" fill="#A5B4FC" />
      <polygon points="180,96 196,66 212,96" fill="#FFFFFF" />
      <g className="leccion-pulso">
        <ellipse cx={200} cy={128} rx={20} ry={14} fill="#78350F" />
        <circle cx={182} cy={118} r={9} fill="#78350F" />
        <circle cx={179} cy={114} r={2.5} fill="#FFFFFF" />
      </g>
      <Rotulo x={200} y={176}>{labels[1]}</Rotulo>

      <rect x={270} y={38} width={116} height={116} rx={14} fill="#FEF9C3" />
      <rect x={270} y={118} width={116} height={36} fill="#BEF264" />
      <g className="leccion-desliza">
        <ellipse cx={330} cy={104} rx={26} ry={16} fill="#D97706" />
        <rect x={312} y={116} width={6} height={20} rx={3} fill="#D97706" />
        <rect x={342} y={116} width={6} height={20} rx={3} fill="#D97706" />
        <circle cx={356} cy={94} r={11} fill="#D97706" />
      </g>
      <Rotulo x={328} y={176}>{labels[2]}</Rotulo>

      <Rotulo x={200} y={206} fill={ACENTO}>Su cuerpo sirve para el lugar donde vive</Rotulo>
    </Marco>
  )
}

// ── Gotas: lo que se pierde por un chorro que gotea ────────────────────────
function Gotas({ values = [30], labels = ['en un día'] }: SceneProps) {
  return (
    <Marco>
      <rect x={110} y={26} width={64} height={18} rx={6} fill="#94A3B8" />
      <rect x={128} y={44} width={22} height={30} rx={4} fill="#64748B" />
      <circle cx={139} cy={24} r={10} fill="#475569" />

      {[0, 1, 2].map((i) => (
        <circle key={i} cx={139} cy={84} r={6} fill="#38BDF8" className="leccion-fluye" style={{ animationDelay: `${i * 0.9}s` }} />
      ))}

      {/* El tobo casi lleno traduce "una gotita" a algo que se ve. */}
      <path d="M96 118 L182 118 L172 196 L106 196 Z" fill="#E2E8F0" stroke={TRAZO} strokeWidth="2.5" />
      <path d="M102 140 L176 140 L172 196 L106 196 Z" fill="#38BDF8" className="leccion-crece" style={{ transformOrigin: 'bottom' }} />

      <Rotulo x={139} y={212} fill={TRAZO}>un tobo lleno</Rotulo>

      <line x1={206} y1={60} x2={206} y2={180} stroke={SUAVE} strokeWidth="2" strokeDasharray="5 5" />
      <text x={296} y={104} textAnchor="middle" fill={ACENTO} fontSize="38" fontWeight="800" fontFamily="inherit">{`${values[0]} L`}</text>
      <Rotulo x={296} y={130} fill={ACENTO}>{labels[0]}</Rotulo>
      <Rotulo x={296} y={166}>Una gota por segundo</Rotulo>
      <Rotulo x={296} y={186}>parece poquito...</Rotulo>
    </Marco>
  )
}

// ── Anidado: cajas dentro de cajas, de la casa al país ─────────────────────
function Anidado({ labels = ['Venezuela', 'Mi estado', 'Mi municipio', 'Mi casa'] }: SceneProps) {
  const cajas = labels.slice(0, 4).filter(Boolean)
  const colores = ['#EEF2FF', '#C7D2FE', '#A5B4FC', ACENTO]

  // Los pasos son distintos en cada eje: 26 a los lados y 24 arriba/abajo.
  // Con un paso único la caja más interna terminaba con alto NEGATIVO y no se
  // dibujaba, y su rótulo caía encima del de la caja anterior.
  const PASO_X = 26
  const PASO_Y = 24

  return (
    <Marco>
      {cajas.map((nombre, i) => {
        const x = 24 + i * PASO_X
        const y = 12 + i * PASO_Y
        const w = 352 - i * PASO_X * 2
        const h = 170 - i * (PASO_Y + 6)
        const ultimo = i === cajas.length - 1

        return (
          <g key={nombre} className="leccion-aparece" style={{ animationDelay: `${i * 0.3}s` }}>
            <rect x={x} y={y} width={w} height={h} rx={16} fill={colores[i]} stroke={TRAZO} strokeWidth="2.5" />
            {/* El rótulo del último va centrado porque no tiene nada dentro;
                los demás van arriba, donde queda el borde visible. */}
            <text
              x={200}
              y={ultimo ? y + h / 2 + 6 : y + 20}
              textAnchor="middle"
              fill={i >= 3 ? '#FFFFFF' : TINTA}
              fontSize={ultimo ? 16 : 13}
              fontWeight="700"
              fontFamily="inherit"
            >
              {nombre}
            </text>
          </g>
        )
      })}
      <Rotulo x={200} y={206}>Tu casa está dentro de todas las demás</Rotulo>
    </Marco>
  )
}

// ── Calendario: la semana dentro del mes ───────────────────────────────────
function Calendario({ values = [16], labels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'] }: SceneProps) {
  const hoy = values[0]

  return (
    <Marco>
      {labels.map((d, i) => (
        <text key={i} x={56 + i * 48} y={36} textAnchor="middle" fill={TRAZO} fontSize="13" fontWeight="800" fontFamily="inherit">
          {d}
        </text>
      ))}

      {Array.from({ length: 28 }, (_, i) => {
        const dia = i + 1
        const col = i % 7
        const fila = Math.floor(i / 7)
        const esHoy = dia === hoy
        // La semana de hoy se resalta entera: así se ve que siete días
        // seguidos forman una semana, y cuatro semanas un mes.
        const suSemana = Math.floor((hoy - 1) / 7) === fila
        return (
          <g key={dia}>
            <rect
              x={56 + col * 48 - 20}
              y={48 + fila * 34}
              width={40}
              height={29}
              rx={8}
              fill={esHoy ? ACENTO : suSemana ? '#FFF7ED' : '#F8FAFC'}
              stroke={suSemana ? ACENTO : SUAVE}
              strokeWidth={suSemana ? 2 : 1.5}
            />
            <text
              x={56 + col * 48}
              y={68 + fila * 34}
              textAnchor="middle"
              fill={esHoy ? '#FFFFFF' : TINTA}
              fontSize="13"
              fontWeight={esHoy ? '800' : '600'}
              fontFamily="inherit"
            >
              {dia}
            </text>
          </g>
        )
      })}

      <Rotulo x={200} y={206} fill={ACENTO}>7 días = 1 semana · 4 semanas = 1 mes</Rotulo>
    </Marco>
  )
}


// ═══════════════════════════════════════════════════════════════════════════
// Escenas armadas con el kit (`lesson-art.tsx`).
//
// Estas no dibujan figuras a mano: colocan piezas ya ilustradas. Una escena
// nueva es, casi siempre, elegir un fondo, poner dos o tres piezas y rotular.
// Ese es el camino que debería seguir un docente cuando arme las suyas.
//
// Todas abren con <Defs/> porque las piezas usan sus degradados y sombras.
// ═══════════════════════════════════════════════════════════════════════════

// ── Plato: los grupos de alimentos ─────────────────────────────────────────
function Plato({ labels = ['Verduras y frutas', 'Cereales', 'Proteínas'] }: SceneProps) {
  const sector = (i: number, n: number, r: number) => {
    const a0 = (i / n) * 2 * Math.PI - Math.PI / 2
    const a1 = ((i + 1) / n) * 2 * Math.PI - Math.PI / 2
    const cx = 128
    const cy = 106
    return `M${cx},${cy} L${cx + r * Math.cos(a0)},${cy + r * Math.sin(a0)} A${r},${r} 0 0 1 ${cx + r * Math.cos(a1)},${cy + r * Math.sin(a1)} Z`
  }
  const tonos = ['#22C55E', '#F59E0B', '#EF4444']

  return (
    <Marco>
      <Defs />
      <Apoyo x={128} y={168} ancho={68} />
      <circle cx={128} cy={106} r={70} fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="3" />
      {tonos.map((c, i) => (
        <path key={i} d={sector(i, 3, 60)} fill={c} opacity="0.88" className="leccion-aparece" style={{ animationDelay: `${i * 0.25}s` }} />
      ))}
      <circle cx={128} cy={106} r={70} fill="none" stroke="#94A3B8" strokeWidth="2" />
      {/* Brillo del plato: lo separa de un gráfico de torta. */}
      <path d="M78,78 Q100,52 140,46" stroke="#FFFFFF" strokeWidth="6" fill="none" opacity="0.5" strokeLinecap="round" />

      <Pin x={318} y={54} texto={labels[0]} hacia={[168, 82]} color="#16A34A" />
      <Pin x={318} y={106} texto={labels[1]} hacia={[168, 130]} color="#D97706" />
      <Pin x={318} y={158} texto={labels[2]} hacia={[100, 160]} color="#DC2626" />
    </Marco>
  )
}

// ── Estados en vasos de verdad ─────────────────────────────────────────────
function AguaEstados({ labels = ['Hielo', 'Agua', 'Vapor'] }: SceneProps) {
  return (
    <Marco>
      <Defs />
      <Suelo y={176} color="#E2E8F0" />

      <Vaso x={72} y={176} nivel={0} />
      <g className="leccion-aparece">
        <rect x={58} y={142} width={13} height={13} rx={2} fill="#BAE6FD" stroke="#7DD3FC" strokeWidth="1.5" />
        <rect x={72} y={146} width={13} height={13} rx={2} fill="#E0F2FE" stroke="#7DD3FC" strokeWidth="1.5" />
        <rect x={65} y={128} width={13} height={13} rx={2} fill="#BAE6FD" stroke="#7DD3FC" strokeWidth="1.5" />
      </g>
      <Texto x={72} y={202}>{labels[0]}</Texto>

      <Vaso x={200} y={176} nivel={0.62} />
      <Texto x={200} y={202}>{labels[1]}</Texto>

      <Vaso x={328} y={176} nivel={0.12} />
      {[0, 1, 2].map((i) => (
        <g key={i} className="leccion-fluye" style={{ animationDelay: `${i * 0.8}s` }}>
          <circle cx={318 + i * 10} cy={130} r={5 + i} fill="#BAE6FD" opacity="0.75" />
        </g>
      ))}
      <Texto x={328} y={202}>{labels[2]}</Texto>

      <Flecha desde={[104, 150]} hasta={[164, 150]} curva={16} color={PALETA.acento} />
      <Texto x={134} y={128} fill={PALETA.acento} tam={11}>calor</Texto>
      <Flecha desde={[232, 150]} hasta={[292, 150]} curva={16} color={PALETA.acento} />
      <Texto x={262} y={128} fill={PALETA.acento} tam={11}>más calor</Texto>
    </Marco>
  )
}

// ── Bandera y símbolos ─────────────────────────────────────────────────────
function Simbolos({ labels = ['Riquezas', 'El mar', 'La sangre'] }: SceneProps) {
  return (
    <Marco>
      <Defs />
      <Bandera x={62} y={190} s={1.25} />
      <Pin x={300} y={52} texto={labels[0]} hacia={[170, 62]} color="#D97706" />
      <Pin x={300} y={104} texto={labels[1]} hacia={[170, 84]} color="#1D4ED8" />
      <Pin x={300} y={156} texto={labels[2]} hacia={[170, 106]} color="#DC2626" />
      <Texto x={200} y={212} tam={12} fill={PALETA.trazo}>Las estrellas son las provincias que firmaron el Acta</Texto>
    </Marco>
  )
}

// ── Balanza: dos cosas que se equilibran ───────────────────────────────────
function Equilibrio({ labels = ['Derechos', 'Deberes'] }: SceneProps) {
  return (
    <Marco>
      <Defs />
      <Balanza x={200} y={176} s={1.5} inclina={0} />
      <Pin x={137} y={44} texto={labels[0]} color={PALETA.verde} />
      <Pin x={263} y={44} texto={labels[1]} color={PALETA.acento} />
      <Texto x={200} y={208}>Van siempre en pareja: uno sostiene al otro</Texto>
    </Marco>
  )
}

// ── Opuestos: dos palabras tirando en sentidos contrarios ──────────────────
function Opuestos({ labels = ['bonito', 'hermoso', 'feo'] }: SceneProps) {
  const [base, sinonimo, antonimo] = labels
  return (
    <Marco>
      <Defs />
      <Panel2 x={18} y={40} ancho={160} alto={96} titulo="Sinónimos" tono="#ECFDF5" borde="#6EE7B7" />
      <Texto x={98} y={82} tam={17} fill={PALETA.verde}>{base}</Texto>
      <Flecha desde={[70, 98]} hasta={[126, 98]} color={PALETA.verde} ancho={2.5} />
      <Texto x={98} y={124} tam={17} fill={PALETA.verde}>{sinonimo}</Texto>

      <Panel2 x={222} y={40} ancho={160} alto={96} titulo="Antónimos" tono="#FEF2F2" borde="#FCA5A5" />
      <Texto x={302} y={82} tam={17} fill="#DC2626">{base}</Texto>
      <g stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round">
        <path d="M280,98 L262,98" markerEnd="url(#la-punta-naranja)" />
        <path d="M324,98 L342,98" markerEnd="url(#la-punta-naranja)" />
      </g>
      <Texto x={302} y={124} tam={17} fill="#DC2626">{antonimo}</Texto>

      <Texto x={200} y={168}>Significan casi lo mismo · Significan lo contrario</Texto>
      <Texto x={200} y={196} tam={12} fill={PALETA.trazo}>Cámbiala en la frase y fíjate si la idea se mantiene</Texto>
    </Marco>
  )
}

// ── Lectura: el texto y las preguntas que se le hacen ──────────────────────
function Lectura({ labels = ['¿Quién?', '¿Qué hizo?', '¿Por qué?'] }: SceneProps) {
  return (
    <Marco>
      <Defs />
      <Libro x={108} y={150} s={1.9} />
      <Pin x={306} y={44} texto={labels[0]} hacia={[166, 90]} />
      <Pin x={306} y={96} texto={labels[1]} hacia={[166, 110]} />
      <Pin x={306} y={148} texto={labels[2]} hacia={[166, 128]} color={PALETA.acento} />
      <Texto x={200} y={200} tam={12} fill={PALETA.trazo}>Si no puedes responderlas, hay que volver a leer</Texto>
    </Marco>
  )
}

// ── Documentos: cada texto con su forma ────────────────────────────────────
function Documentos({
  // 0-2: tipo de texto. 3-5: en qué se reconoce cada uno.
  labels = ['Narrativo', 'Instructivo', 'Informativo', 'cuenta una historia', 'pasos en orden', 'datos y fechas'],
}: SceneProps) {
  return (
    <Marco>
      <Defs />
      <Papel x={78} y={150} s={1.15} color={PALETA.trazo} />
      <Texto x={78} y={176}>{labels[0]}</Texto>
      <Texto x={78} y={196} tam={11} fill={PALETA.trazo}>{labels[3] ?? 'cuenta una historia'}</Texto>

      <g>
        <Papel x={200} y={150} s={1.15} color={PALETA.acento} renglones={4} />
        {/* Los pasos numerados son la marca visual del instructivo. */}
        {[0, 1, 2, 3].map((i) => (
          <circle key={i} cx={178} cy={94 + i * 10.4} r={3.4} fill={PALETA.acento} />
        ))}
      </g>
      <Texto x={200} y={176}>{labels[1]}</Texto>
      <Texto x={200} y={196} tam={11} fill={PALETA.acento}>{labels[4] ?? 'pasos en orden'}</Texto>

      <Papel x={322} y={150} s={1.15} color={PALETA.verde} renglones={6} />
      <Texto x={322} y={176}>{labels[2]}</Texto>
      <Texto x={322} y={196} tam={11} fill={PALETA.verde}>{labels[5] ?? 'datos y fechas'}</Texto>

      <Texto x={200} y={30} tam={14}>Mira la forma antes de leer</Texto>
    </Marco>
  )
}

// ── Transformación de energía ──────────────────────────────────────────────
function Transformacion({ labels = ['Sol', 'Panel', 'Bombillo'] }: SceneProps) {
  return (
    <Marco>
      <Defs />
      <Suelo y={178} color="#E7E5E4" />
      <Sol x={56} y={60} s={1.15} />
      <Texto x={56} y={104}>{labels[0]}</Texto>

      <Panel x={190} y={178} s={1.5} />
      <Texto x={190} y={204}>{labels[1]}</Texto>

      <Bombillo x={334} y={178} s={1.6} />
      <Texto x={334} y={204}>{labels[2]}</Texto>

      <Flecha desde={[88, 78]} hasta={[152, 128]} color={PALETA.acento} clase="leccion-fluye" />
      <Texto x={110} y={122} tam={11} fill={PALETA.acento}>luz</Texto>
      <Flecha desde={[232, 150]} hasta={[300, 150]} color={PALETA.acento} clase="leccion-fluye" />
      <Texto x={266} y={140} tam={11} fill={PALETA.acento}>electricidad</Texto>
    </Marco>
  )
}

// ── Poderes públicos: tres edificios con su función ────────────────────────
function Poderes({
  // 0-2: nombre del poder. 3-5: qué hace cada uno.
  labels = ['Legislativo', 'Ejecutivo', 'Judicial', 'hace las leyes', 'las aplica', 'juzga'],
}: SceneProps) {
  const pie = [labels[3] ?? 'hace las leyes', labels[4] ?? 'las aplica', labels[5] ?? 'juzga']
  return (
    <Marco>
      <Defs />
      <Suelo y={168} color="#E7E5E4" />
      {[76, 200, 324].map((x, i) => (
        <g key={x} className="leccion-aparece" style={{ animationDelay: `${i * 0.25}s` }}>
          <Edificio x={x} y={168} s={1.05} tono={i === 1 ? '#FED7AA' : '#E2E8F0'} />
          <Texto x={x} y={190}>{labels[i]}</Texto>
          <Texto x={x} y={208} tam={11} fill={PALETA.trazo}>{pie[i]}</Texto>
        </g>
      ))}
      {/* Se vigilan entre sí: por eso las flechas van en los dos sentidos. */}
      <Flecha desde={[112, 112]} hasta={[164, 112]} curva={14} color={PALETA.acento} ancho={2.2} />
      <Flecha desde={[236, 112]} hasta={[288, 112]} curva={14} color={PALETA.acento} ancho={2.2} />
      <Flecha desde={[288, 132]} hasta={[112, 132]} curva={-26} color={PALETA.acento} ancho={2.2} />
    </Marco>
  )
}

// ── Hecho y opinión ────────────────────────────────────────────────────────
function HechoOpinion({
  labels = [
    'Caracas es la capital',
    'El quesillo es el mejor postre',
    '«mejor», «debería», «es evidente» anuncian opinión',
  ],
}: SceneProps) {
  return (
    <Marco>
      <Defs />
      <Panel2 x={16} y={34} ancho={176} alto={128} titulo="HECHO" tono="#ECFDF5" borde="#6EE7B7" />
      <Persona x={62} y={148} s={0.82} ropa={PALETA.verde} pose="senala" />
      <Pin x={140} y={92} texto="se comprueba" color={PALETA.verde} />
      <Texto x={104} y={176} tam={11} fill={PALETA.verde}>{labels[0]}</Texto>

      <Panel2 x={208} y={34} ancho={176} alto={128} titulo="OPINIÓN" tono="#FFF7ED" borde="#FDBA74" />
      <Persona x={254} y={148} s={0.82} ropa={PALETA.acento} pose="piensa" />
      <Pin x={332} y={92} texto="se discute" color={PALETA.acento} />
      <Texto x={296} y={176} tam={11} fill={PALETA.acento}>{labels[1]}</Texto>

      {/* Ranura con respaldo, no texto fijo: la pista de abajo depende de los
          ejemplos que ponga el docente arriba. Ver la regla del encabezado. */}
      <Texto x={200} y={206} tam={12} fill={PALETA.trazo}>
        {labels[2] ?? '«mejor», «debería», «es evidente» anuncian opinión'}
      </Texto>
    </Marco>
  )
}

// ── Escalas del universo ───────────────────────────────────────────────────
function Escalas({ labels = ['Tierra', 'Sistema solar', 'Vía Láctea'] }: SceneProps) {
  return (
    <Marco>
      <Defs />
      <rect x={0} y={0} width={400} height={220} fill="#0F172A" rx={0} />
      {Array.from({ length: 34 }, (_, i) => (
        <circle key={i} cx={(i * 71) % 390 + 6} cy={(i * 43) % 200 + 10} r={i % 4 === 0 ? 1.6 : 1} fill="#FFFFFF" opacity={0.3 + (i % 5) * 0.14} />
      ))}

      <circle cx={66} cy={98} r={22} fill="#2563EB" />
      <path d="M50,92 Q60,84 72,88 Q84,92 80,102 Q66,110 54,104 Z" fill="#22C55E" />
      <ellipse cx={59} cy={90} rx={7} ry={4} fill="#FFFFFF" opacity="0.35" />
      <Texto x={66} y={140} fill="#E0E7FF">{labels[0]}</Texto>

      <g>
        <circle cx={200} cy={98} r={11} fill="url(#la-sol)" />
        {[26, 38, 50].map((r, i) => (
          <g key={r}>
            <circle cx={200} cy={98} r={r} fill="none" stroke="#475569" strokeWidth="1" />
            <circle cx={200 + r} cy={98} r={i === 1 ? 4.5 : 3.2} fill={i === 1 ? '#2563EB' : '#94A3B8'} />
          </g>
        ))}
      </g>
      <Texto x={200} y={168} fill="#E0E7FF">{labels[1]}</Texto>

      <g className="leccion-orbita" style={{ transformOrigin: '330px 98px' }}>
        <ellipse cx={330} cy={98} rx={52} ry={16} fill="none" stroke="#818CF8" strokeWidth="9" opacity="0.4" />
        <ellipse cx={330} cy={98} rx={34} ry={10} fill="none" stroke="#C7D2FE" strokeWidth="7" opacity="0.55" />
        <circle cx={330} cy={98} r={8} fill="#FDE68A" />
      </g>
      <circle cx={356} cy={92} r={2} fill={PALETA.acento} />
      <Texto x={330} y={168} fill="#E0E7FF">{labels[2]}</Texto>

      <Flecha desde={[96, 98]} hasta={[142, 98]} color="#C7D2FE" ancho={2.2} />
      <Flecha desde={[256, 98]} hasta={[276, 98]} color="#C7D2FE" ancho={2.2} />
      <Texto x={200} y={204} fill="#A5B4FC" tam={12}>Cada uno vive dentro del siguiente</Texto>
    </Marco>
  )
}

// ── Metáfora: lo que se dice y lo que se compara ───────────────────────────
function Metafora({
  labels = ['Sus ojos', 'dos luceros', 'Sin «como» es metáfora · Con «como» es comparación'],
}: SceneProps) {
  return (
    <Marco>
      <Defs />
      <circle cx={104} cy={94} r={44} fill={PALETA.piel} filter="url(#la-sombra)" />
      <path d="M60,90 Q72,58 104,56 Q136,58 148,90 Q132,76 104,74 Q76,76 60,90 Z" fill="#3F2A1D" />
      <ellipse cx={88} cy={96} rx={9} ry={7} fill="#FFFFFF" />
      <ellipse cx={120} cy={96} rx={9} ry={7} fill="#FFFFFF" />
      <circle cx={88} cy={96} r={4} fill={PALETA.tinta} />
      <circle cx={120} cy={96} r={4} fill={PALETA.tinta} />
      <path d="M92,118 Q104,126 116,118" stroke={PALETA.tinta} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <Texto x={104} y={162}>{labels[0]}</Texto>

      <Flecha desde={[160, 96]} hasta={[218, 96]} color={PALETA.acento} />
      <Texto x={189} y={82} tam={13} fill={PALETA.acento}>son</Texto>

      <g className="leccion-pulso">
        {[[262, 76], [316, 100]].map(([cx, cy], k) => {
          const pts: string[] = []
          for (let i = 0; i < 10; i++) {
            const rad = i % 2 === 0 ? 22 : 9
            const a = (i * Math.PI) / 5 - Math.PI / 2
            pts.push(`${cx + rad * Math.cos(a)},${cy + rad * Math.sin(a)}`)
          }
          return <polygon key={k} points={pts.join(' ')} fill="#FDE047" stroke="#F59E0B" strokeWidth="2" />
        })}
      </g>
      <Texto x={292} y={162}>{labels[1]}</Texto>

      {/* Misma razón que en HechoOpinion: la pista sale de una ranura. */}
      <Texto x={200} y={200} tam={12} fill={PALETA.trazo}>
        {labels[2] ?? 'Sin «como» es metáfora · Con «como» es comparación'}
      </Texto>
    </Marco>
  )
}

// ── Escribir: planificar, escribir, revisar ────────────────────────────────
function Escribir({ labels = ['Planificar', 'Escribir', 'Revisar'] }: SceneProps) {
  return (
    <Marco>
      <Defs />
      {[76, 200, 324].map((x, i) => (
        <g key={x} className="leccion-aparece" style={{ animationDelay: `${i * 0.3}s` }}>
          <circle cx={x} cy={62} r={25} fill={i === 2 ? PALETA.verde : PALETA.trazo} filter="url(#la-sombra)" />
          <text x={x} y={70} textAnchor="middle" fill="#FFFFFF" fontSize="21" fontWeight="800" fontFamily="inherit">{i + 1}</text>
          <Texto x={x} y={108}>{labels[i]}</Texto>
        </g>
      ))}

      <Papel x={76} y={196} s={0.82} renglones={2} titulo={false} />
      <Papel x={200} y={196} s={0.82} renglones={5} />
      <g>
        <Papel x={324} y={196} s={0.82} renglones={5} />
        {/* Marcas rojas de corrección: es lo que hace reconocible "revisar". */}
        <g stroke="#DC2626" strokeWidth="2" strokeLinecap="round">
          <path d="M310,160 L320,160" />
          <path d="M306,172 L316,172" />
          <path d="M330,152 L336,158 M336,152 L330,158" />
        </g>
      </g>

      <Flecha desde={[108, 62]} hasta={[168, 62]} color={PALETA.suave} ancho={2.5} />
      <Flecha desde={[232, 62]} hasta={[292, 62]} color={PALETA.suave} ancho={2.5} />
    </Marco>
  )
}

// ── Recipientes: capacidad comparada ───────────────────────────────────────
function Recipientes({ labels = ['vaso 250 mL', 'jarra 1 L', 'botella 2 L'] }: SceneProps) {
  return (
    <Marco>
      <Defs />
      <Suelo y={180} color="#E2E8F0" />
      <Vaso x={72} y={180} s={0.85} nivel={0.75} />
      <Texto x={72} y={204}>{labels[0]}</Texto>

      <Jarra x={196} y={180} s={1.05} nivel={0.78} />
      <Texto x={196} y={204}>{labels[1]}</Texto>

      <g>
        <Apoyo x={322} y={181} ancho={24} />
        <path d="M306,-0 L306,-88 Q306,-96 314,-98 L314,-106 L330,-106 L330,-98 Q338,-96 338,-88 L338,0 Z" transform="translate(0 180)" fill="#E0F2FE" opacity="0.6" />
        <path d="M306,180 L306,112 L338,112 L338,180 Z" fill="url(#la-agua)" />
        <path d="M306,180 L306,92 Q306,84 314,82 L314,74 L330,74 L330,82 Q338,84 338,92 L338,180" fill="none" stroke="#7DD3FC" strokeWidth="2.5" />
        <rect x={312} y={70} width={20} height={8} rx={2} fill="#0284C7" />
      </g>
      <Texto x={322} y={204}>{labels[2]}</Texto>

      <Texto x={200} y={34} tam={14}>1 litro = 1.000 mililitros</Texto>
    </Marco>
  )
}

// ── Mapa: regiones de un territorio ────────────────────────────────────────
function Mapa({ labels = ['Costa', 'Llanos', 'Andes', 'Guayana'] }: SceneProps) {
  return (
    <Marco>
      <Defs />
      <rect x={0} y={0} width={400} height={220} fill="#DBEAFE" />
      {/* Silueta libre, no un mapa exacto: alcanza para ubicar las regiones. */}
      <path d="M52,60 Q120,36 200,46 Q280,36 346,64 L352,104 Q330,128 340,168 Q280,196 200,186 Q120,196 66,166 Q52,120 52,60 Z" fill="#FDE68A" stroke="#A16207" strokeWidth="2.5" filter="url(#la-sombra)" />
      <path d="M52,60 Q120,36 200,46 Q280,36 346,64 L340,84 Q270,62 200,70 Q130,62 56,86 Z" fill="#FCA5A5" opacity="0.85" />
      <path d="M62,150 Q140,132 216,140 Q290,148 340,168 Q280,196 200,186 Q120,196 66,166 Z" fill="#86EFAC" opacity="0.9" />
      <path d="M60,88 Q84,120 76,158 Q62,140 56,104 Z" fill="#C4B5FD" />
      <path d="M250,110 Q310,104 344,128 Q320,154 262,148 Q242,130 250,110 Z" fill="#A3E635" opacity="0.9" />

      <Pin x={128} y={62} texto={labels[0]} color="#B91C1C" />
      <Pin x={168} y={166} texto={labels[1]} color="#15803D" />
      <Pin x={52} y={122} texto={labels[2]} color="#6D28D9" anchor="start" />
      <Pin x={302} y={128} texto={labels[3]} color="#4D7C0F" />
    </Marco>
  )
}

// ── Comunidad: la gente que la hace funcionar ──────────────────────────────
function Comunidad({ labels = ['Alcalde', 'Vecinos', 'Escuela'] }: SceneProps) {
  return (
    <Marco>
      <Defs />
      <Suelo y={172} color="#E7E5E4" pasto />
      <Edificio x={78} y={172} s={0.85} tono="#FED7AA" />
      <Texto x={78} y={196}>{labels[0]}</Texto>

      <Persona x={176} y={172} s={0.95} ropa="#2563EB" pose="saluda" />
      <Persona x={212} y={172} s={0.95} ropa="#DB2777" />
      <Persona x={246} y={172} s={0.95} ropa="#16A34A" pose="senala" />
      <Texto x={210} y={196}>{labels[1]}</Texto>

      <Casa x={334} y={172} s={0.82} color="#FCD34D" />
      <Texto x={334} y={196}>{labels[2]}</Texto>

      <Texto x={200} y={30} tam={14}>Nos organizamos para lo que nadie puede solo</Texto>
    </Marco>
  )
}

// ── Asamblea: participar en lo que es de todos ─────────────────────────────
function Asamblea({ labels = ['Un vecino solo', 'Los vecinos juntos'] }: SceneProps) {
  return (
    <Marco>
      <Defs />
      <Panel2 x={16} y={30} ancho={172} alto={140} tono="#FEF2F2" borde="#FCA5A5" />
      <Persona x={102} y={140} s={1} ropa="#DC2626" pose="saluda" />
      <Pin x={102} y={52} texto="no pasa nada" color="#DC2626" />
      <Texto x={102} y={190}>{labels[0]}</Texto>

      <Panel2 x={212} y={30} ancho={172} alto={140} tono="#ECFDF5" borde="#6EE7B7" />
      {[246, 276, 306, 336].map((x, i) => (
        <Persona key={x} x={x} y={148 - (i % 2) * 6} s={0.78} ropa={['#16A34A', '#2563EB', '#DB2777', '#D97706'][i]} pose={i === 1 ? 'saluda' : 'quieta'} />
      ))}
      <Pin x={298} y={52} texto="se logra" color={PALETA.verde} />
      <Texto x={298} y={190}>{labels[1]}</Texto>
    </Marco>
  )
}

// ── Fuentes: cómo se averigua el pasado ────────────────────────────────────
function Fuentes({
  // 0-2: tipo de fuente. 3-5: dónde se busca cada una.
  labels = ['Contada', 'Escrita', 'Gráfica', 'pregunta a los mayores', 'actas y documentos', 'fotos antiguas'],
}: SceneProps) {
  return (
    <Marco>
      <Defs />
      <g>
        <Persona x={72} y={148} s={1.05} ropa="#7C3AED" pose="piensa" pelo="#9CA3AF" />
        <path d="M96,86 q18,-10 30,2 q10,12 -4,18 l-4,8 l-8,-7 q-18,1 -18,-11 z" fill="#FFFFFF" stroke={PALETA.suave} strokeWidth="2" />
        <Texto x={72} y={176}>{labels[0]}</Texto>
        <Texto x={72} y={194} tam={11} fill={PALETA.trazo}>{labels[3] ?? 'pregunta a los mayores'}</Texto>
      </g>

      <Papel x={200} y={150} s={1.15} color="#A16207" renglones={5} />
      <Texto x={200} y={176}>{labels[1]}</Texto>
      <Texto x={200} y={194} tam={11} fill={PALETA.trazo}>{labels[4] ?? 'actas y documentos'}</Texto>

      <g>
        <rect x={296} y={92} width={62} height={52} rx={3} fill="#FFFFFF" stroke="#A16207" strokeWidth="2.5" filter="url(#la-sombra)" />
        <rect x={302} y={98} width={50} height={34} fill="#FDE68A" />
        <circle cx={316} cy={110} r={5} fill="#F59E0B" />
        <path d="M302,132 L320,114 L332,126 L342,118 L352,132 Z" fill="#A16207" opacity="0.65" />
        <Texto x={327} y={176}>{labels[2]}</Texto>
        <Texto x={327} y={194} tam={11} fill={PALETA.trazo}>{labels[5] ?? 'fotos antiguas'}</Texto>
      </g>
    </Marco>
  )
}

// ── Ortografía: la regla y sus excepciones ─────────────────────────────────
function Ortografia({
  // 0-2: palabras de la regla. 3-5: las excepciones. 6-7: los dos títulos.
  labels = ['escribir', 'recibir', 'subir', 'hervir', 'servir', 'vivir', 'Terminan en -bir → con B', 'Menos...'],
}: SceneProps) {
  // Índice con respaldo, no slice: la lección de 4to manda solo 4 rótulos y
  // un slice(3,6) dejaría la lista de excepciones con un solo elemento,
  // borrando "servir" y "vivir" sin que nadie lo pidiera.
  const regla = [labels[0] ?? 'escribir', labels[1] ?? 'recibir', labels[2] ?? 'subir']
  const excepciones = [labels[3] ?? 'hervir', labels[4] ?? 'servir', labels[5] ?? 'vivir']
  return (
    <Marco>
      <Defs />
      <Panel2 x={18} y={36} ancho={236} alto={118} titulo={labels[6] ?? 'Terminan en -bir → con B'} tono="#EEF2FF" borde={PALETA.suave} />
      {regla.map((w, i) => (
        <g key={w} className="leccion-aparece" style={{ animationDelay: `${i * 0.2}s` }}>
          <rect x={38} y={66 + i * 28} width={196} height={24} rx={8} fill="#FFFFFF" stroke={PALETA.suave} strokeWidth="1.8" />
          <text x={136} y={83 + i * 28} textAnchor="middle" fill={PALETA.tinta} fontSize="15" fontWeight="700" fontFamily="inherit">
            {w.slice(0, -3)}
            <tspan fill={PALETA.trazo} fontSize="18">bir</tspan>
          </text>
        </g>
      ))}

      <Panel2 x={272} y={36} ancho={112} alto={118} titulo={labels[7] ?? 'Menos...'} tono="#FFF7ED" borde="#FDBA74" />
      {excepciones.map((w, i) => (
        <text key={w} x={328} y={82 + i * 26} textAnchor="middle" fill={PALETA.acento} fontSize="15" fontWeight="700" fontFamily="inherit">
          {w.slice(0, -3)}
          <tspan fontSize="18">vir</tspan>
        </text>
      ))}

      <Texto x={200} y={182}>Después de m va B · Después de n va V</Texto>
      <Texto x={200} y={204} tam={12} fill={PALETA.trazo}>hoMBre, caMBio · iNVierno, eNViar</Texto>
    </Marco>
  )
}

// ── Colectivo: una palabra que nombra a muchos ─────────────────────────────
function Colectivo({
  // 0-1: las dos palabras. 2-3: cómo se llama cada caso.
  labels = ['árbol', 'bosque', 'individual: uno solo', 'colectivo: muchos, en singular'],
}: SceneProps) {
  return (
    <Marco>
      <Defs />
      <Suelo y={168} color="#D9F99D" />
      <Panel2 x={16} y={22} ancho={150} alto={150} tono="#FFFFFF" borde={PALETA.suave} />
      <Arbol x={90} y={160} s={0.92} />
      <Texto x={90} y={190} tam={15}>{labels[0]}</Texto>
      <Texto x={90} y={40} tam={11} fill={PALETA.trazo}>{labels[2] ?? 'individual: uno solo'}</Texto>

      <Panel2 x={204} y={22} ancho={180} alto={150} tono="#FFFFFF" borde={PALETA.acento} />
      {[238, 268, 298, 328, 358].map((x, i) => (
        <Arbol key={x} x={x} y={162 - (i % 2) * 6} s={0.58} />
      ))}
      <Texto x={294} y={190} tam={15} fill={PALETA.acento}>{labels[1]}</Texto>
      <Texto x={294} y={40} tam={11} fill={PALETA.acento}>{labels[3] ?? 'colectivo: muchos, en singular'}</Texto>
    </Marco>
  )
}

// ── Coma: la misma frase con y sin coma ────────────────────────────────────
function Coma({
  labels = ['Vamos a comer, Pedro', 'Vamos a comer Pedro', 'lo invito a comer', '¡nos lo comemos a él!'],
}: SceneProps) {
  const [conComa, sinComa, sentidoA, sentidoB] = labels

  /**
   * Parte la frase en la coma para poder pintarla grande y en color.
   * Se busca la coma en el TEXTO recibido en vez de escribirla aparte: así
   * la escena sirve para cualquier par de frases que el docente proponga,
   * que era justamente lo que antes no hacía.
   */
  const partir = (frase: string) => {
    const i = frase.indexOf(',')
    return i === -1 ? [frase, ''] : [frase.slice(0, i), frase.slice(i + 1)]
  }
  const [antes, despues] = partir(conComa)

  // El texto se achica si la frase es larga, para que no se salga del marco.
  const tam = (t: string) => (t.length > 26 ? 15 : t.length > 20 ? 17 : 19)

  return (
    <Marco>
      <Defs />
      <Panel2 x={16} y={30} ancho={368} alto={70} tono="#ECFDF5" borde="#6EE7B7" />
      <text x={200} y={66} textAnchor="middle" fill={TINTA} fontSize={tam(conComa)} fontWeight="700" fontFamily="inherit">
        {antes}
        {despues !== '' && (
          <>
            <tspan fill={PALETA.verde} fontSize={tam(conComa) + 7} fontWeight="800">,</tspan>
            <tspan>{despues}</tspan>
          </>
        )}
      </text>
      <Texto x={200} y={88} tam={11} fill={PALETA.verde}>{sentidoA}</Texto>

      <Panel2 x={16} y={116} ancho={368} alto={70} tono="#FEF2F2" borde="#FCA5A5" />
      <text x={200} y={152} textAnchor="middle" fill={TINTA} fontSize={tam(sinComa)} fontWeight="700" fontFamily="inherit">
        {sinComa}
      </text>
      <Texto x={200} y={174} tam={11} fill="#DC2626">{sentidoB}</Texto>

      <Texto x={200} y={208} tam={12} fill={PALETA.trazo}>La misma frase cambia según dónde va la coma</Texto>
    </Marco>
  )
}

/**
 * REGLA AL AGREGAR UNA ESCENA
 *
 * Todo texto que se vea en pantalla tiene que salir de `labels` o `values`.
 * Si se escribe literal en el JSX, la escena queda amarrada a una lección:
 * el docente le pasa otros rótulos, no pasa nada, y no hay ningún error que
 * lo avise. Eso ocurrió con `Coma`, que dibujaba siempre la misma frase
 * aunque su lección le pasaba tres pares distintos.
 *
 * Se exceptúan las frases de cierre que explican el concepto en general
 * ("La misma frase cambia según dónde va la coma"): esas sí son parte de la
 * escena y no del contenido.
 *
 * Las ranuras que se agregan después van SIEMPRE con respaldo
 * (`labels[4] ?? 'texto anterior'`) para que las lecciones ya escritas sigan
 * viéndose igual. Y con índice, nunca con `slice`: un slice sobre un arreglo
 * más corto del esperado devuelve menos elementos y borra contenido en
 * silencio, que fue lo que pasó al abrir `ortografia`.
 *
 * Registro de escenas. La lección guarda el id como texto; acá se traduce.
 * Un id desconocido devuelve null y la página se muestra sin ilustración,
 * que es preferible a romper la lectura entera.
 */
const ESCENAS: Record<string, (p: SceneProps) => JSX.Element> = {
  reparto: Reparto,
  barras: Barras,
  recta: Recta,
  ciclo: Ciclo,
  orbita: Orbita,
  estados: Estados,
  cadena: Cadena,
  cuadricula: Cuadricula,
  agrupar: Agrupar,
  silabas: Silabas,
  oracion: Oracion,
  cuerpo: Cuerpo,
  'linea-tiempo': LineaTiempo,
  relieve: Relieve,

  // Primero y segundo grado
  decenas: Decenas,
  juntar: Juntar,
  quitar: Quitar,
  figuras: Figuras,
  letras: Letras,
  vivo: Vivo,
  sentidos: Sentidos,
  turnos: Turnos,
  puntuacion: Puntuacion,
  'dia-noche': DiaNoche,
  regla: Regla,
  describir: Describir,
  planta: Planta,
  habitat: Habitat,
  gotas: Gotas,
  anidado: Anidado,
  calendario: Calendario,

  // Tercero a sexto, armadas con el kit de lesson-art.tsx
  plato: Plato,
  'agua-estados': AguaEstados,
  simbolos: Simbolos,
  equilibrio: Equilibrio,
  opuestos: Opuestos,
  lectura: Lectura,
  documentos: Documentos,
  transformacion: Transformacion,
  poderes: Poderes,
  'hecho-opinion': HechoOpinion,
  escalas: Escalas,
  metafora: Metafora,
  escribir: Escribir,
  recipientes: Recipientes,
  mapa: Mapa,
  comunidad: Comunidad,
  asamblea: Asamblea,
  fuentes: Fuentes,
  ortografia: Ortografia,
  colectivo: Colectivo,
  coma: Coma,
}

export function LessonScene({ art, labels, values }: { art: string } & SceneProps) {
  const Escena = ESCENAS[art]
  if (!Escena) return null
  return (
    <div className="w-full aspect-[400/220]">
      <Escena labels={labels} values={values} />
    </div>
  )
}

export const SCENE_IDS = Object.keys(ESCENAS)
