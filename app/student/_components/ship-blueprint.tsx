import Link from 'next/link'
import { shipPartIcon } from '@/lib/ship-parts'
import type { PiezaProgreso, ProgresoNave } from '@/lib/ship-progress'
import { Check, Lock, Wrench } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * La nave del alumno, con sus piezas.
 *
 * Es un Server Component: no hay estado, los estados visuales salen de CSS y
 * cada pieza tocable es un `<Link>`. Cero JavaScript enviado al navegador
 * para una pantalla que es la primera que se abre.
 *
 * DECISIÓN DE ARMADO: el SVG dibuja solo el casco y es decorativo
 * (`aria-hidden`). Las piezas van encima como HTML posicionado en
 * porcentajes, no como formas dentro del SVG. Motivos:
 *  - un `<Link>` de Next dentro de un `<svg>` queda como SVGAElement y la
 *    navegación del lado del cliente se vuelve impredecible;
 *  - las piezas necesitan ícono, etiqueta, contador y foco de teclado, y todo
 *    eso en HTML sale gratis y accesible.
 * Como las posiciones son porcentajes sobre el mismo recuadro que el SVG,
 * quedan pegadas al casco en cualquier tamaño de pantalla.
 */

/** Dónde se ancla cada pieza sobre el casco, en % del recuadro. */
const ANCLAS: Record<string, { x: number; y: number }> = {
  motor: { x: 17, y: 52.5 },
  casco: { x: 46, y: 52 },
  soporte: { x: 73, y: 52 },
  antena: { x: 31, y: 18 },
  navegacion: { x: 50, y: 12 },
  energia: { x: 68, y: 18 },
  bodega: { x: 35, y: 82 },
  sensores: { x: 60, y: 81 },
}

export function ShipBlueprint({ progreso }: { progreso: ProgresoNave }) {
  const { piezas, reparadas, enJuego } = progreso
  const naveLista = enJuego > 0 && reparadas === enJuego

  return (
    <div className="space-y-4">
      <div className="relative mx-auto w-full max-w-[620px] aspect-[400/188]">
        <Casco naveLista={naveLista} />

        {piezas.map((p) => {
          const ancla = ANCLAS[p.id]
          if (!ancla) return null
          return (
            <Pieza
              key={p.id}
              pieza={p}
              style={{ left: `${ancla.x}%`, top: `${ancla.y}%` }}
            />
          )
        })}
      </div>

      <ListaPiezas piezas={piezas} />

      <Leyenda reparadas={reparadas} enJuego={enJuego} naveLista={naveLista} />
    </div>
  )
}

// ── Casco ──────────────────────────────────────────────────────────────────

function Casco({ naveLista }: { naveLista: boolean }) {
  return (
    <svg
      viewBox="0 26 400 188"
      className="absolute inset-0 w-full h-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="nave-cuerpo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EEF2FF" />
          <stop offset="55%" stopColor="#C7D2FE" />
          <stop offset="100%" stopColor="#A5B4FC" />
        </linearGradient>
        <linearGradient id="nave-llama" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor="#FB923C" />
          <stop offset="60%" stopColor="#FBBF24" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#FDE68A" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="nave-aura">
          <stop offset="55%" stopColor="#34D399" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#34D399" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Aura verde solo cuando todo lo asignado está reparado: la nave
          "encendida" es la recompensa visual de terminar. */}
      {naveLista && <ellipse cx="210" cy="124" rx="180" ry="72" fill="url(#nave-aura)" />}

      {/* Puntales: enganchan los nodos de arriba y abajo al fuselaje para que
          no queden flotando sueltos sobre el fondo. */}
      <g stroke="#C7D2FE" strokeWidth="3" strokeLinecap="round">
        <line x1="124" y1="98" x2="124" y2="66" />
        <line x1="200" y1="99" x2="200" y2="54" />
        <line x1="272" y1="101" x2="272" y2="66" />
        <line x1="140" y1="151" x2="140" y2="176" />
        <line x1="240" y1="149" x2="240" y2="174" />
      </g>

      {/* Alerón de cola */}
      <path d="M96 152 L82 192 L146 162 Z" fill="#A5B4FC" opacity="0.5" />

      {/* Toberas y llama, a la izquierda del fuselaje */}
      <path
        className="nave-llama"
        d="M50 110 C 30 113, 16 119, 6 124 C 16 129, 30 135, 50 138 Z"
        fill="url(#nave-llama)"
      />
      <rect x="48" y="104" width="32" height="42" rx="9" fill="#818CF8" />

      {/* Fuselaje: cola recta a la izquierda, morro en punta a la derecha.
          Una sola curva continua para que el morro no se lea como una pieza
          pegada aparte. */}
      <path
        d="M78 96
           L 300 100
           C 336 103, 362 112, 384 124
           C 362 136, 336 145, 300 148
           L 78 152
           Z"
        fill="url(#nave-cuerpo)"
        stroke="#818CF8"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Franja del casco */}
      <path
        d="M104 124 L286 124"
        stroke="#818CF8"
        strokeWidth="2"
        strokeDasharray="10 8"
        opacity="0.45"
      />

      {/* Ventanilla de la cabina, justo delante del nodo de soporte vital */}
      <ellipse cx="342" cy="124" rx="14" ry="9" fill="#FFFFFF" opacity="0.9" />
      <ellipse cx="342" cy="124" rx="14" ry="9" fill="none" stroke="#818CF8" strokeWidth="2" />

    </svg>
  )
}

// ── Una pieza ──────────────────────────────────────────────────────────────

function Pieza({
  pieza,
  style,
}: {
  pieza: PiezaProgreso
  style: React.CSSProperties
}) {
  const Icon = shipPartIcon(pieza.icon)
  const tocable = pieza.estado === 'pendiente' && pieza.actividadId !== null

  const contenido = (
    <>
      <span
        className={cn(
          'relative grid place-items-center rounded-full border-2 transition-transform',
          'w-10 h-10 sm:w-11 sm:h-11',
          pieza.estado === 'reparada' && 'border-emerald-400 bg-emerald-50',
          pieza.estado === 'pendiente' &&
            'border-orange-400 bg-white nave-pendiente group-hover:scale-110 group-focus-visible:scale-110',
          pieza.estado === 'sin_asignar' && 'border-dashed border-indigo-200 bg-white/70',
        )}
      >
        <Icon
          className={cn(
            'w-5 h-5',
            pieza.estado === 'reparada' && 'text-emerald-600',
            pieza.estado === 'pendiente' && pieza.color,
            pieza.estado === 'sin_asignar' && 'text-indigo-200',
          )}
        />

        {pieza.estado === 'reparada' && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 grid place-items-center">
            <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
          </span>
        )}
        {pieza.estado === 'pendiente' && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-500 grid place-items-center">
            <Wrench className="w-2.5 h-2.5 text-white" strokeWidth={3} />
          </span>
        )}
        {pieza.estado === 'sin_asignar' && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-100 grid place-items-center">
            <Lock className="w-2.5 h-2.5 text-indigo-400" strokeWidth={3} />
          </span>
        )}
      </span>

      <span
        className={cn(
          'hidden sm:block mt-1 px-1.5 py-0.5 rounded-md text-[11px] font-semibold leading-tight text-center whitespace-nowrap',
          pieza.estado === 'reparada' && 'bg-emerald-100 text-emerald-800',
          pieza.estado === 'pendiente' && 'bg-orange-100 text-orange-800',
          pieza.estado === 'sin_asignar' && 'bg-indigo-50 text-indigo-300',
        )}
      >
        {pieza.name}
        {pieza.total > 1 && pieza.estado !== 'sin_asignar' && (
          <span className="font-normal"> {pieza.completadas}/{pieza.total}</span>
        )}
      </span>
    </>
  )

  const clases =
    'group absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center'

  if (!tocable) {
    return (
      <span
        className={clases}
        style={style}
        title={
          pieza.estado === 'reparada'
            ? `${pieza.name}: reparada. ${pieza.description}`
            : `${pieza.name}: todavía no hay misión para esta pieza.`
        }
      >
        {contenido}
      </span>
    )
  }

  return (
    <Link
      href={`/student/activities/${pieza.actividadId}`}
      className={cn(
        clases,
        'rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2',
      )}
      style={style}
      title={`${pieza.name}: ${pieza.description}`}
      aria-label={`Reparar ${pieza.name}. Misión: ${pieza.actividadTitulo}`}
    >
      {contenido}
    </Link>
  )
}

// ── Resumen bajo la nave ───────────────────────────────────────────────────

function Leyenda({
  reparadas,
  enJuego,
  naveLista,
}: {
  reparadas: number
  enJuego: number
  naveLista: boolean
}) {
  if (enJuego === 0) {
    return (
      <p className="text-sm text-indigo-400 text-center">
        Tu maestra todavía no asignó misiones para reparar la nave. ¡Pronto
        habrá trabajo!
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-center text-sm text-indigo-500">
        {naveLista ? (
          <span className="font-semibold text-emerald-600">
            ¡La nave está lista para despegar!
          </span>
        ) : (
          <>
            <span className="font-semibold text-indigo-950">
              {reparadas} de {enJuego}
            </span>{' '}
            {enJuego === 1 ? 'pieza reparada' : 'piezas reparadas'}. Toca una
            pieza con llave para arreglarla.
          </>
        )}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-indigo-400">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          Reparada
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
          Te toca
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full border border-dashed border-indigo-300" />
          Sin misión aún
        </span>
      </div>
    </div>
  )
}


/**
 * Las piezas en lista, solo para pantallas chicas.
 *
 * En el teléfono las etiquetas sobre la nave se superponen: no hay ancho para
 * ocho rótulos. La nave sigue mostrándose (es lo que el alumno quiere ver),
 * pero los nombres y el estado se leen acá abajo, donde además el área
 * tocable es mucho más cómoda que un círculo de 40 px.
 */
function ListaPiezas({ piezas }: { piezas: PiezaProgreso[] }) {
  return (
    <ul className="sm:hidden grid grid-cols-2 gap-1.5">
      {piezas.map((p) => {
        const Icon = shipPartIcon(p.icon)
        const tocable = p.estado === 'pendiente' && p.actividadId !== null

        const cuerpo = (
          <>
            <Icon
              className={cn(
                'w-4 h-4 shrink-0',
                p.estado === 'reparada' && 'text-emerald-600',
                p.estado === 'pendiente' && p.color,
                p.estado === 'sin_asignar' && 'text-indigo-300',
              )}
            />
            <span className="truncate">{p.name}</span>
            {p.estado === 'reparada' && (
              <Check className="w-3.5 h-3.5 ml-auto shrink-0 text-emerald-600" strokeWidth={3} />
            )}
            {p.estado === 'pendiente' && (
              <Wrench className="w-3.5 h-3.5 ml-auto shrink-0 text-orange-600" strokeWidth={3} />
            )}
            {p.estado === 'sin_asignar' && (
              <Lock className="w-3.5 h-3.5 ml-auto shrink-0 text-indigo-300" strokeWidth={3} />
            )}
          </>
        )

        const clases = cn(
          'flex items-center gap-1.5 rounded-xl border px-2 py-2 text-xs font-medium min-h-11',
          p.estado === 'reparada' && 'border-emerald-200 bg-emerald-50 text-emerald-800',
          p.estado === 'pendiente' && 'border-orange-300 bg-orange-50 text-orange-900',
          p.estado === 'sin_asignar' && 'border-dashed border-indigo-200 text-indigo-300',
        )

        return (
          <li key={p.id}>
            {tocable ? (
              <Link href={`/student/activities/${p.actividadId}`} className={clases}>
                {cuerpo}
              </Link>
            ) : (
              <span className={clases}>{cuerpo}</span>
            )}
          </li>
        )
      })}
    </ul>
  )
}
