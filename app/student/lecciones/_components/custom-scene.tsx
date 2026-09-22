import {
  Defs, Persona, Arbol, Montana, Nube, Sol, Gota, Suelo,
  Vaso, Casa, Edificio, Libro, Bombillo, Panel, Bandera, Papel, Jarra, Balanza,
  Flecha, PALETA,
} from './lesson-art'
import * as AM from './lesson-art-math'
import * as AN from './lesson-art-nature'
import * as AB from './lesson-art-body'
import * as AW from './lesson-art-world'
import type { EscenaDoc, Elemento, NombrePieza, Fondo } from '@/lib/scene-doc'
import { LIENZO, caminoDeTrazo } from '@/lib/scene-doc'

/**
 * Dibuja una escena hecha por el docente.
 *
 * Es el reverso del editor: el editor produce el documento y esto lo pinta.
 * Sin estado ni efectos, para que sirva igual en el panel del alumno (Server
 * Component, cero JavaScript) y dentro del editor como vista previa.
 *
 * Los elementos se dibujan EN ORDEN: el último tapa a los anteriores. Por eso
 * el editor mueve elementos en la lista para cambiar qué queda delante.
 */

/**
 * Las piezas tienen firmas distintas (unas aceptan `nieve`, otras `nivel`).
 * El registro las unifica bajo una firma común: `x`, `y`, `s` los comparten
 * todas, y el resto llega como extras que cada pieza toma o ignora. Es el
 * precio de despachar por nombre en tiempo de ejecución; `sanearEscena` ya
 * garantizó que los valores sean textos o números.
 */
export type ComponentePieza = (p: { x: number; y: number; s?: number } & Record<string, unknown>) => JSX.Element

/**
 * Se exporta para que la paleta del editor dibuje las mismas piezas que el
 * lienzo. Con dos registros, agregar una pieza al kit y olvidarse de uno
 * dejaría la paleta y el dibujo en desacuerdo sin que nada fallara.
 */
export const REGISTRO: Record<NombrePieza, ComponentePieza> = {
  Persona: Persona as unknown as ComponentePieza,
  Arbol: Arbol as unknown as ComponentePieza,
  Montana: Montana as unknown as ComponentePieza,
  Nube: Nube as unknown as ComponentePieza,
  Sol: Sol as unknown as ComponentePieza,
  Gota: Gota as unknown as ComponentePieza,
  Vaso: Vaso as unknown as ComponentePieza,
  Casa: Casa as unknown as ComponentePieza,
  Edificio: Edificio as unknown as ComponentePieza,
  Libro: Libro as unknown as ComponentePieza,
  Bombillo: Bombillo as unknown as ComponentePieza,
  Panel: Panel as unknown as ComponentePieza,
  Bandera: Bandera as unknown as ComponentePieza,
  Papel: Papel as unknown as ComponentePieza,
  Jarra: Jarra as unknown as ComponentePieza,
  Balanza: Balanza as unknown as ComponentePieza,

  Abaco: AM.Abaco as unknown as ComponentePieza,
  BloqueDecena: AM.BloqueDecena as unknown as ComponentePieza,
  CuboUnidad: AM.CuboUnidad as unknown as ComponentePieza,
  RectaNumerica: AM.RectaNumerica as unknown as ComponentePieza,
  Reloj: AM.Reloj as unknown as ComponentePieza,
  Moneda: AM.Moneda as unknown as ComponentePieza,
  Billete: AM.Billete as unknown as ComponentePieza,
  Dado: AM.Dado as unknown as ComponentePieza,
  FraccionCirculo: AM.FraccionCirculo as unknown as ComponentePieza,
  FraccionBarra: AM.FraccionBarra as unknown as ComponentePieza,
  Regla: AM.Regla as unknown as ComponentePieza,
  Termometro: AM.Termometro as unknown as ComponentePieza,
  Grafico: AM.Grafico as unknown as ComponentePieza,
  Calculadora: AM.Calculadora as unknown as ComponentePieza,
  Circulo: AM.Circulo as unknown as ComponentePieza,
  Cuadrado: AM.Cuadrado as unknown as ComponentePieza,
  Rectangulo: AM.Rectangulo as unknown as ComponentePieza,
  Triangulo: AM.Triangulo as unknown as ComponentePieza,
  Pentagono: AM.Pentagono as unknown as ComponentePieza,
  Hexagono: AM.Hexagono as unknown as ComponentePieza,
  Cubo: AM.Cubo as unknown as ComponentePieza,
  Esfera: AM.Esfera as unknown as ComponentePieza,
  Cilindro: AM.Cilindro as unknown as ComponentePieza,
  Piramide: AM.Piramide as unknown as ComponentePieza,
  Flor: AN.Flor as unknown as ComponentePieza,
  Girasol: AN.Girasol as unknown as ComponentePieza,
  Semilla: AN.Semilla as unknown as ComponentePieza,
  Brote: AN.Brote as unknown as ComponentePieza,
  Maceta: AN.Maceta as unknown as ComponentePieza,
  Hoja: AN.Hoja as unknown as ComponentePieza,
  Raiz: AN.Raiz as unknown as ComponentePieza,
  Cactus: AN.Cactus as unknown as ComponentePieza,
  Palmera: AN.Palmera as unknown as ComponentePieza,
  Hierba: AN.Hierba as unknown as ComponentePieza,
  Pez: AN.Pez as unknown as ComponentePieza,
  Pajaro: AN.Pajaro as unknown as ComponentePieza,
  Mariposa: AN.Mariposa as unknown as ComponentePieza,
  Perro: AN.Perro as unknown as ComponentePieza,
  Gato: AN.Gato as unknown as ComponentePieza,
  Vaca: AN.Vaca as unknown as ComponentePieza,
  Gallina: AN.Gallina as unknown as ComponentePieza,
  Caballo: AN.Caballo as unknown as ComponentePieza,
  Tortuga: AN.Tortuga as unknown as ComponentePieza,
  Rana: AN.Rana as unknown as ComponentePieza,
  Hormiga: AN.Hormiga as unknown as ComponentePieza,
  Abeja: AN.Abeja as unknown as ComponentePieza,
  Guacamaya: AN.Guacamaya as unknown as ComponentePieza,
  Delfin: AN.Delfin as unknown as ComponentePieza,
  Oveja: AN.Oveja as unknown as ComponentePieza,
  Cerdo: AN.Cerdo as unknown as ComponentePieza,
  Luna: AN.Luna as unknown as ComponentePieza,
  Estrella: AN.Estrella as unknown as ComponentePieza,
  Arcoiris: AN.Arcoiris as unknown as ComponentePieza,
  Rayo: AN.Rayo as unknown as ComponentePieza,
  CopoNieve: AN.CopoNieve as unknown as ComponentePieza,
  Viento: AN.Viento as unknown as ComponentePieza,
  Lluvia: AN.Lluvia as unknown as ComponentePieza,
  Tormenta: AN.Tormenta as unknown as ComponentePieza,
  Charco: AN.Charco as unknown as ComponentePieza,
  Corazon: AB.Corazon as unknown as ComponentePieza,
  Cerebro: AB.Cerebro as unknown as ComponentePieza,
  Pulmones: AB.Pulmones as unknown as ComponentePieza,
  Diente: AB.Diente as unknown as ComponentePieza,
  Ojo: AB.Ojo as unknown as ComponentePieza,
  Mano: AB.Mano as unknown as ComponentePieza,
  Hueso: AB.Hueso as unknown as ComponentePieza,
  Estomago: AB.Estomago as unknown as ComponentePieza,
  Oido: AB.Oido as unknown as ComponentePieza,
  Manzana: AB.Manzana as unknown as ComponentePieza,
  Banana: AB.Banana as unknown as ComponentePieza,
  Naranja: AB.Naranja as unknown as ComponentePieza,
  Pan: AB.Pan as unknown as ComponentePieza,
  Leche: AB.Leche as unknown as ComponentePieza,
  Huevo: AB.Huevo as unknown as ComponentePieza,
  Queso: AB.Queso as unknown as ComponentePieza,
  Arepa: AB.Arepa as unknown as ComponentePieza,
  Zanahoria: AB.Zanahoria as unknown as ComponentePieza,
  Pescado: AB.Pescado as unknown as ComponentePieza,
  Uvas: AB.Uvas as unknown as ComponentePieza,
  Maiz: AB.Maiz as unknown as ComponentePieza,
  Mochila: AW.Mochila as unknown as ComponentePieza,
  Pizarron: AW.Pizarron as unknown as ComponentePieza,
  Tijeras: AW.Tijeras as unknown as ComponentePieza,
  Pegamento: AW.Pegamento as unknown as ComponentePieza,
  Escuadra: AW.Escuadra as unknown as ComponentePieza,
  GloboTerraqueo: AW.GloboTerraqueo as unknown as ComponentePieza,
  Microscopio: AW.Microscopio as unknown as ComponentePieza,
  Iman: AW.Iman as unknown as ComponentePieza,
  Pila: AW.Pila as unknown as ComponentePieza,
  Lupa: AW.Lupa as unknown as ComponentePieza,
  Cuaderno: AW.Cuaderno as unknown as ComponentePieza,
  Lapiz: AW.Lapiz as unknown as ComponentePieza,
  Computadora: AW.Computadora as unknown as ComponentePieza,
  Carro: AW.Carro as unknown as ComponentePieza,
  Autobus: AW.Autobus as unknown as ComponentePieza,
  Bicicleta: AW.Bicicleta as unknown as ComponentePieza,
  Barco: AW.Barco as unknown as ComponentePieza,
  Avion: AW.Avion as unknown as ComponentePieza,
  Tren: AW.Tren as unknown as ComponentePieza,
  Cohete: AW.Cohete as unknown as ComponentePieza,
  Camion: AW.Camion as unknown as ComponentePieza,
  Escuela: AW.Escuela as unknown as ComponentePieza,
  Hospital: AW.Hospital as unknown as ComponentePieza,
  Tienda: AW.Tienda as unknown as ComponentePieza,
  Puente: AW.Puente as unknown as ComponentePieza,
  Rio: AW.Rio as unknown as ComponentePieza,
  Volcan: AW.Volcan as unknown as ComponentePieza,
  Cerca: AW.Cerca as unknown as ComponentePieza,
  Bocadillo: AW.Bocadillo as unknown as ComponentePieza,
  Pensamiento: AW.Pensamiento as unknown as ComponentePieza,
  Interrogacion: AW.Interrogacion as unknown as ComponentePieza,
  Exclamacion: AW.Exclamacion as unknown as ComponentePieza,
  TarjetaLetra: AW.TarjetaLetra as unknown as ComponentePieza,
  Sobre: AW.Sobre as unknown as ComponentePieza,
  Megafono: AW.Megafono as unknown as ComponentePieza,
}

/**
 * Los ajustes se guardan como texto plano para que sobrevivan al JSON, pero
 * las piezas esperan booleanos. La traducción va acá y no en el editor para
 * que un documento escrito a mano —o por el asistente de IA— también funcione.
 */
function normalizarProps(props: Record<string, string | number> = {}) {
  const salida: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(props)) {
    if (v === 'si') salida[k] = true
    else if (v === 'no') salida[k] = false
    else salida[k] = v
  }
  return salida
}

function Fondo({ fondo }: { fondo: Fondo }) {
  if (fondo === 'blanco') return null

  if (fondo === 'cielo') {
    return (
      <>
        <rect x={0} y={0} width={LIENZO.ancho} height={LIENZO.alto} fill="#DBEAFE" />
        <rect x={0} y={0} width={LIENZO.ancho} height={90} fill="#BFDBFE" opacity="0.6" />
      </>
    )
  }

  if (fondo === 'campo') {
    return (
      <>
        <rect x={0} y={0} width={LIENZO.ancho} height={LIENZO.alto} fill="#DBEAFE" />
        <Suelo y={168} color="#86EFAC" pasto />
      </>
    )
  }

  if (fondo === 'noche') {
    return (
      <>
        <rect x={0} y={0} width={LIENZO.ancho} height={LIENZO.alto} fill="#0F172A" />
        {/* Estrellas con posiciones calculadas, no aleatorias: si cambiaran
            en cada render, el dibujo "parpadearía" al editarlo. */}
        {Array.from({ length: 30 }, (_, i) => (
          <circle
            key={i}
            cx={(i * 71) % 392 + 5}
            cy={(i * 43) % 190 + 8}
            r={i % 4 === 0 ? 1.6 : 1}
            fill="#FFFFFF"
            opacity={0.3 + (i % 5) * 0.14}
          />
        ))}
      </>
    )
  }

  // aula
  return (
    <>
      <rect x={0} y={0} width={LIENZO.ancho} height={LIENZO.alto} fill="#FEF3C7" />
      <rect x={0} y={150} width={LIENZO.ancho} height={70} fill="#D6C3A5" />
      <rect x={28} y={24} width={150} height={92} rx={4} fill="#166534" stroke="#78350F" strokeWidth="4" />
    </>
  )
}

function DibujarElemento({ e }: { e: Elemento }) {
  if (e.tipo === 'pieza') {
    const Pieza = REGISTRO[e.pieza]
    if (!Pieza) return null
    return <Pieza x={e.x} y={e.y} s={e.s} {...normalizarProps(e.props)} />
  }

  if (e.tipo === 'texto') {
    return (
      <text
        x={e.x}
        y={e.y}
        textAnchor={e.anchor}
        fill={e.color}
        fontSize={e.tam}
        fontWeight="700"
        fontFamily="inherit"
      >
        {e.texto}
      </text>
    )
  }

  if (e.tipo === 'trazo') {
    return (
      <path
        d={caminoDeTrazo(e.puntos)}
        fill="none"
        stroke={e.color}
        strokeWidth={e.grosor}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    )
  }

  if (e.tipo === 'flecha') {
    return <Flecha desde={e.desde} hasta={e.hasta} curva={e.curva} color={e.color} />
  }

  if (e.forma === 'elipse') {
    return <ellipse cx={e.x + e.w / 2} cy={e.y + e.h / 2} rx={e.w / 2} ry={e.h / 2} fill={e.color} />
  }
  return <rect x={e.x} y={e.y} width={e.w} height={e.h} rx={8} fill={e.color} />
}

export function CustomScene({ doc }: { doc: EscenaDoc }) {
  return (
    <svg
      viewBox={`0 0 ${LIENZO.ancho} ${LIENZO.alto}`}
      className="w-full h-full"
      role="img"
      aria-hidden="true"
    >
      <Defs />
      <Fondo fondo={doc.fondo} />
      {doc.elementos.map((e) => (
        <DibujarElemento key={e.id} e={e} />
      ))}
    </svg>
  )
}

export { PALETA }
