/**
 * Ilustraciones de la cinemática de apertura.
 *
 * SVG en línea, sin dependencias: no hay imágenes que descargar ni runtime de
 * animación. Cada escena es una función pura, así que Next las incluye en el
 * HTML del servidor y el teléfono no espera ningún asset para verlas.
 *
 * Paleta tomada del tema alumno (design-system/eduverso-student/MASTER.md):
 * índigo #4F46E5 primario, naranja #F97316 de acento, fondo lavanda #EEF2FF.
 */

const INDIGO = '#4F46E5'
const INDIGO_DEEP = '#312E81'
const INDIGO_SOFT = '#C7D2FE'
const ORANGE = '#F97316'
const AMBER = '#FBBF24'
const WHITE = '#FFFFFF'
// Violeta de Profe Bot: los mismos tonos que usa la burbuja del agente en
// app/student/activities/[id]/_components/agent-bubble.tsx (violet-600 /
// violet-100 con distintivo ámbar). El robot de la historia y el ayudante de
// las misiones tienen que verse como el mismo personaje.
const VIOLET = '#7C3AED'
const VIOLET_DEEP = '#4C1D95'
const VIOLET_SOFT = '#DDD6FE'

/** Campo de estrellas de fondo, compartido por todas las escenas. */
function Starfield() {
  // Posiciones fijas (no aleatorias) para que el servidor y el cliente
  // rendericen exactamente lo mismo y no haya error de hidratación.
  const stars = [
    [20, 24, 1.6], [70, 16, 1.1], [118, 40, 2], [160, 22, 1.3], [205, 52, 1.5],
    [250, 18, 1.1], [292, 44, 1.8], [40, 74, 1.2], [96, 96, 1.5], [148, 78, 1.1],
    [196, 104, 1.7], [240, 82, 1.2], [286, 112, 1.4], [12, 120, 1.3], [64, 140, 1.6],
  ]
  return (
    <g className="cine-starfield">
      {[0, 320].map((offset) => (
        <g key={offset} transform={`translate(${offset} 0)`}>
          {stars.map(([x, y, r], i) => (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={r}
              fill={WHITE}
              opacity={0.55}
              className="cine-spark"
              style={{ animationDelay: `${(i % 5) * 0.6}s` }}
            />
          ))}
        </g>
      ))}
    </g>
  )
}

/** Nave averiada del astronauta, con la avería del lado derecho. */
function Ship({ broken = true }: { broken?: boolean }) {
  return (
    <g>
      <ellipse cx="0" cy="0" rx="46" ry="17" fill={INDIGO} />
      <ellipse cx="0" cy="-5" rx="46" ry="15" fill="#6366F1" />
      <circle cx="-12" cy="-7" r="9" fill={INDIGO_SOFT} opacity="0.95" />
      <circle cx="-12" cy="-7" r="5" fill="#EEF2FF" />
      {/* Aleta */}
      <path d="M 30 -4 L 48 -22 L 44 -2 Z" fill={INDIGO_DEEP} />
      {broken ? (
        <>
          {/* Casco roto y chispas */}
          <path d="M 26 2 L 40 -6 L 36 10 Z" fill={INDIGO_DEEP} opacity="0.9" />
          <circle cx="40" cy="-2" r="3" fill={ORANGE} className="cine-spark" />
          <circle cx="46" cy="4" r="2" fill={AMBER} className="cine-spark"
            style={{ animationDelay: '0.7s' }} />
        </>
      ) : (
        <>
          {/* Propulsor encendido */}
          <path d="M 44 -4 L 68 0 L 44 4 Z" fill={ORANGE} className="cine-beam" />
          <circle cx="34" cy="0" r="3" fill={AMBER} className="cine-spark" />
        </>
      )}
    </g>
  )
}

/** Astronauta de pie. */
function Astronaut() {
  return (
    <g>
      {/* Mochila */}
      <rect x="-13" y="-16" width="26" height="26" rx="8" fill={INDIGO_DEEP} />
      {/* Cuerpo */}
      <rect x="-11" y="-14" width="22" height="26" rx="9" fill={WHITE} />
      {/* Casco */}
      <circle cx="0" cy="-22" r="13" fill={WHITE} />
      <circle cx="0" cy="-22" r="9.5" fill={INDIGO_DEEP} />
      <path d="M -6 -26 a 7 7 0 0 1 7 -3" stroke={INDIGO_SOFT} strokeWidth="2"
        fill="none" strokeLinecap="round" />
      {/* Piernas y brazos */}
      <rect x="-9" y="10" width="7" height="12" rx="3.5" fill={WHITE} />
      <rect x="2" y="10" width="7" height="12" rx="3.5" fill={WHITE} />
      <rect x="-18" y="-11" width="7" height="17" rx="3.5" fill={WHITE} />
      <rect x="11" y="-11" width="7" height="17" rx="3.5" fill={WHITE} />
      {/* Distintivo naranja */}
      <circle cx="0" cy="-4" r="3.5" fill={ORANGE} />
    </g>
  )
}

/**
 * Profe Bot: el robot que viajaba en la nave.
 *
 * Flota (no tiene patas) para que se lea como el mismo personaje que la
 * burbuja violeta que acompaña las misiones. El visor ámbar es el distintivo
 * que comparte con el contador de pistas del agente.
 */
function Robot({ dented = false }: { dented?: boolean }) {
  return (
    <g>
      {/* Antena */}
      <line x1="0" y1="-20" x2="0" y2="-27" stroke={VIOLET_SOFT} strokeWidth="2"
        strokeLinecap="round" />
      <circle cx="0" cy="-29" r="3" fill={AMBER} className="cine-spark" />

      {/* Cabeza / cuerpo redondeado */}
      <rect x="-15" y="-20" width="30" height="27" rx="12" fill={VIOLET} />
      <rect x="-15" y="-20" width="30" height="13" rx="6.5" fill="#8B5CF6" />

      {/* Visor con los dos ojos */}
      <rect x="-10" y="-15" width="20" height="11" rx="5.5" fill={VIOLET_DEEP} />
      <circle cx="-4.5" cy="-9.5" r="2.4" fill={AMBER} className="cine-spark" />
      <circle cx="4.5" cy="-9.5" r="2.4" fill={AMBER} className="cine-spark"
        style={{ animationDelay: '0.35s' }} />

      {/* Bracitos */}
      <rect x="-21" y="-9" width="6" height="12" rx="3" fill={VIOLET_DEEP} />
      <rect x="15" y="-9" width="6" height="12" rx="3" fill={VIOLET_DEEP} />

      {dented && (
        // Abolladura: viajaba en la nave que se estrelló, no puede salir intacto.
        <path d="M 9 2 L 15 -1 L 13 6 Z" fill={VIOLET_DEEP} opacity="0.85" />
      )}

      {/* Propulsor de flotación */}
      <ellipse cx="0" cy="10" rx="9" ry="3.5" fill={VIOLET_SOFT} opacity="0.4"
        className="cine-spark" />
    </g>
  )
}

/** Superficie del planeta. */
function Ground({ fill = '#3730A3' }: { fill?: string }) {
  return (
    <>
      <path d="M 0 170 Q 80 140 160 156 T 320 148 L 320 200 L 0 200 Z" fill={fill} />
      <path d="M 0 182 Q 90 166 180 176 T 320 170 L 320 200 L 0 200 Z"
        fill={INDIGO_DEEP} opacity="0.75" />
    </>
  )
}

const SVG_PROPS = {
  viewBox: '0 0 320 200',
  className: 'w-full h-auto',
  role: 'img' as const,
}

/** 1 — La nave cae hacia un planeta desconocido. */
export function SceneCrash() {
  return (
    <svg {...SVG_PROPS} aria-label="Una nave espacial averiada cae hacia un planeta lejano">
      <rect width="320" height="200" fill="#1E1B4B" />
      <Starfield />
      <circle cx="272" cy="176" r="66" fill={INDIGO} opacity="0.35" />
      <circle cx="272" cy="182" r="54" fill={INDIGO} opacity="0.55" />
      <g transform="translate(150 86) scale(0.9)">
        <g className="cine-ship-fall">
          <Ship />
        </g>
      </g>
    </svg>
  )
}

/** 2 — El astronauta, solo, junto a la nave rota. */
export function SceneStranded() {
  return (
    <svg {...SVG_PROPS} aria-label="El astronauta observa su nave averiada en la superficie del planeta">
      <rect width="320" height="200" fill="#1E1B4B" />
      <Starfield />
      <circle cx="44" cy="44" r="16" fill={INDIGO_SOFT} opacity="0.5" />
      <Ground />
      <g transform="translate(214 150) scale(0.85) rotate(8)">
        <Ship />
      </g>
      <g transform="translate(96 138)">
        <g className="cine-bob">
          <Astronaut />
        </g>
      </g>
    </svg>
  )
}

/** 3 — Profe Bot sale de la nave: el astronauta no está solo. */
export function SceneCompanion() {
  return (
    <svg {...SVG_PROPS} aria-label="Un pequeño robot violeta sale de la nave y se acerca al astronauta">
      <rect width="320" height="200" fill="#1E1B4B" />
      <Starfield />
      <Ground />

      {/* Nave al fondo, de donde acaba de salir el robot */}
      <g transform="translate(252 156) scale(0.7) rotate(8)">
        <Ship />
      </g>

      {/* Halo violeta: el robot es la única fuente de luz cálida de la
          escena, para que la mirada vaya ahí y no al astronauta. */}
      <circle cx="188" cy="128" r="34" fill={VIOLET} opacity="0.18" className="cine-spark" />

      <g transform="translate(188 132)">
        <g className="cine-bob">
          <Robot dented />
        </g>
      </g>

      <g transform="translate(112 140)">
        <g className="cine-bob" style={{ animationDelay: '0.8s' }}>
          <Astronaut />
        </g>
      </g>
    </svg>
  )
}

/** 4 — Las zonas del planeta (las materias) se encienden. */
export function SceneZones() {
  const zones: Array<[number, number, string]> = [
    [58, 128, '#38BDF8'],
    [124, 116, '#34D399'],
    [190, 124, '#FB7185'],
    [256, 112, AMBER],
  ]
  return (
    <svg {...SVG_PROPS} aria-label="Cuatro zonas de conocimiento se iluminan sobre el planeta">
      <rect width="320" height="200" fill="#1E1B4B" />
      <Starfield />
      <Ground />
      {zones.map(([x, y, color], i) => (
        <g key={x}>
          <rect x={x - 3} y={y} width="6" height={170 - y} fill={color} opacity="0.28"
            className="cine-beam" style={{ animationDelay: `${i * 0.45}s` }} />
          <circle cx={x} cy={y} r="11" fill={color} opacity="0.25" />
          <circle cx={x} cy={y} r="6" fill={color} className="cine-spark"
            style={{ animationDelay: `${i * 0.45}s` }} />
        </g>
      ))}
      <g transform="translate(146 152) scale(0.72)">
        <g className="cine-bob">
          <Astronaut />
        </g>
      </g>
      <g transform="translate(186 142) scale(0.6)">
        <g className="cine-bob" style={{ animationDelay: '0.8s' }}>
          <Robot dented />
        </g>
      </g>
    </svg>
  )
}

/** 5 — Cada misión completada devuelve una pieza a la nave. */
export function SceneRepair() {
  return (
    <svg {...SVG_PROPS} aria-label="Piezas recuperadas vuelven a la nave y la reparan">
      <rect width="320" height="200" fill="#1E1B4B" />
      <Starfield />
      <Ground />
      <g transform="translate(178 142) scale(0.95)">
        <Ship broken={false} />
      </g>
      {/* Piezas orbitando hacia la nave */}
      {[
        [70, 70, '#38BDF8', 0],
        [104, 46, '#34D399', 0.5],
        [138, 74, '#FB7185', 1],
      ].map(([x, y, color, delay]) => (
        <g key={String(x)} className="cine-spark" style={{ animationDelay: `${delay}s` }}>
          <rect x={Number(x) - 7} y={Number(y) - 7} width="14" height="14" rx="4"
            fill={color as string} />
        </g>
      ))}
      <g transform="translate(64 146) scale(0.72)">
        <g className="cine-bob">
          <Astronaut />
        </g>
      </g>
      <g transform="translate(108 134) scale(0.58)">
        <g className="cine-bob" style={{ animationDelay: '0.6s' }}>
          <Robot dented />
        </g>
      </g>
    </svg>
  )
}

/** 6 — La nave despega rumbo a casa. */
export function SceneLaunch() {
  return (
    <svg {...SVG_PROPS} aria-label="La nave reparada despega del planeta rumbo a casa">
      <rect width="320" height="200" fill="#1E1B4B" />
      <Starfield />
      <Ground />
      <g transform="translate(150 92) rotate(-28)">
        <g className="cine-bob">
          <Ship broken={false} />
        </g>
      </g>
      {/* Profe Bot despega al lado de la nave: se vuelve a casa contigo. */}
      <g transform="translate(228 118) scale(0.62)">
        <g className="cine-bob" style={{ animationDelay: '0.5s' }}>
          <Robot />
        </g>
      </g>
      <circle cx="44" cy="52" r="20" fill={INDIGO_SOFT} opacity="0.45" className="cine-spark" />
      <circle cx="44" cy="52" r="11" fill="#EEF2FF" opacity="0.8" />
    </svg>
  )
}
