'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { CustomScene, REGISTRO as REGISTRO_PALETA } from '@/app/student/lecciones/_components/custom-scene'
import {
  LIENZO, PIEZAS, PIEZAS_META, FONDOS, FONDOS_META, nuevoId,
  anclaDe, moverElemento, cajaDe, caminoDeTrazo, caminoDeFlecha, GRUPOS_PIEZAS,
  type EscenaDoc, type Elemento, type NombrePieza, type Fondo,
} from '@/lib/scene-doc'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  MousePointer2, Brush, Type as TypeIcon, Square, ArrowUpRight,
  Trash2, ChevronUp, ChevronDown, ChevronRight, Undo2, Eraser, X, Pencil, Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AsistenteEscena } from './scene-assistant'

/**
 * Lienzo de diseño.
 *
 * Se trabaja en coordenadas del dibujo (400×220), no en píxeles de pantalla:
 * `aPuntoLienzo` convierte lo que toca el dedo. Así el mismo documento se ve
 * igual en el teléfono del docente y en la pantalla grande del alumno, que es
 * la razón de existir del formato.
 *
 * El elemento seleccionado se marca con un recuadro dibujado ENCIMA del SVG,
 * en HTML. Meterlo dentro del SVG obligaría a que cada pieza informara su
 * tamaño real, y las piezas del kit no lo saben: solo conocen su punto de
 * apoyo.
 */

type Herramienta = 'mover' | 'pincel' | 'borrador' | 'texto' | 'forma' | 'flecha'

/** Alto de la barra de controles, en unidades del dibujo. Ver `sitioBarra`. */
const ALTO_BARRA = 40

/** Lo que el borrador puede quitar: solo lo dibujado a mano. */
const BORRABLES = ['trazo', 'forma', 'flecha'] as const

/** Distancia de un punto a un segmento, para saber si el borrador lo tocó. */
function distanciaASegmento(
  px: number, py: number,
  x1: number, y1: number, x2: number, y2: number,
): number {
  const dx = x2 - x1
  const dy = y2 - y1
  const largo = dx * dx + dy * dy
  if (largo === 0) return Math.hypot(px - x1, py - y1)
  // Proyección del punto sobre el segmento, acotada a sus extremos.
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / largo))
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy))
}

/**
 * ¿El borrador, centrado en (px,py), alcanza a este elemento?
 *
 * Solo responde por lo dibujado a mano. Las piezas del kit devuelven `false`
 * siempre: el borrador no las toca, para eso está el botón de eliminar.
 */
function alcanzadoPorBorrador(e: Elemento, px: number, py: number, radio: number): boolean {
  if (e.tipo === 'trazo') {
    for (let i = 0; i < e.puntos.length - 1; i++) {
      const [x1, y1] = e.puntos[i]
      const [x2, y2] = e.puntos[i + 1]
      if (distanciaASegmento(px, py, x1, y1, x2, y2) <= radio + e.grosor / 2) return true
    }
    return false
  }
  if (e.tipo === 'flecha') {
    return distanciaASegmento(px, py, e.desde[0], e.desde[1], e.hasta[0], e.hasta[1]) <= radio + 4
  }
  if (e.tipo === 'forma') {
    return px >= e.x - radio && px <= e.x + e.w + radio && py >= e.y - radio && py <= e.y + e.h + radio
  }
  return false
}

const COLORES = ['#6366F1', '#F97316', '#10B981', '#DC2626', '#312E81', '#FFFFFF']

export function SceneCanvas({
  doc,
  onChange,
  topicId,
  topicName,
}: {
  doc: EscenaDoc
  onChange: (d: EscenaDoc) => void
  topicId: string
  topicName: string
}) {
  const lienzoRef = useRef<HTMLDivElement>(null)
  const [herramienta, setHerramienta] = useState<Herramienta>('mover')
  const [selId, setSelId] = useState<string | null>(null)
  const [color, setColor] = useState(COLORES[0])
  const [grosor, setGrosor] = useState(3)
  const [historial, setHistorial] = useState<EscenaDoc[]>([])

  // Trazo en curso: en ref para no re-renderizar en cada movimiento del dedo.
  const trazando = useRef<[number, number][] | null>(null)
  const [trazoVivo, setTrazoVivo] = useState<[number, number][] | null>(null)
  /**
   * Arrastre en curso. Lleva el documento de ANTES de empezar porque el
   * movimiento se aplica en vivo: para cuando se suelta, `doc` ya trae la
   * pieza en su sitio nuevo y anotar eso en el historial haría que deshacer
   * no devolviera nada.
   */
  const arrastre = useRef<{ id: string; dx: number; dy: number; antes: EscenaDoc } | null>(null)
  /** Id del texto que se está escribiendo directamente sobre el lienzo. */
  const [editandoTexto, setEditandoTexto] = useState<string | null>(null)
  /** Pestillo del cierre de escritura. Ver `cerrarEscritura`. */
  const cerrandoTexto = useRef(false)
  /** Se borra en trazo continuo: hay que recordar si el gesto sigue activo. */
  const borrando = useRef(false)
  /**
   * ¿Hay un gesto en curso? Los refs de arriba no provocan redibujo, y el
   * efecto que engancha los escuchas necesita un valor que sí lo haga.
   */
  const [gesto, setGesto] = useState(false)

  const sel = doc.elementos.find((e) => e.id === selId) ?? null

  /** Guarda el estado anterior antes de cada cambio, para deshacer. */
  const aplicar = useCallback(
    (siguiente: EscenaDoc) => {
      setHistorial((h) => [...h.slice(-29), doc])
      onChange(siguiente)
    },
    [doc, onChange],
  )

  const deshacer = () => {
    // El aviso al padre va FUERA del updater: React corre los updaters en fase
    // de render, y avisar desde ahí es actualizar el editor mientras el lienzo
    // se está dibujando. Se lee el historial del render actual, que es el que
    // el botón tenía a la vista cuando lo tocaron.
    if (historial.length === 0) return
    onChange(historial[historial.length - 1])
    setHistorial((h) => h.slice(0, -1))
    setSelId(null)
  }

  function aPuntoLienzo(e: { clientX: number; clientY: number }): [number, number] {
    const caja = lienzoRef.current?.getBoundingClientRect()
    if (!caja) return [0, 0]
    return [
      ((e.clientX - caja.left) / caja.width) * LIENZO.ancho,
      ((e.clientY - caja.top) / caja.height) * LIENZO.alto,
    ]
  }

  function agregar(el: Elemento) {
    aplicar({ ...doc, elementos: [...doc.elementos, el] })
    setSelId(el.id)
  }

  function actualizar(id: string, cambio: Partial<Elemento>) {
    aplicar({
      ...doc,
      elementos: doc.elementos.map((e) => (e.id === id ? ({ ...e, ...cambio } as Elemento) : e)),
    })
  }

  function borrar(id: string) {
    aplicar({ ...doc, elementos: doc.elementos.filter((e) => e.id !== id) })
    setSelId(null)
  }

  /**
   * Cierra la escritura de un texto.
   *
   * Un texto vacío no se dibuja y no tiene recuadro que tocar: quedaría en el
   * documento sin manera de volver a él ni de quitarlo. Si lo dejaron en
   * blanco, se descarta el elemento.
   */
  function abrirEscritura(id: string) {
    cerrandoTexto.current = false
    setEditandoTexto(id)
  }

  function cerrarEscritura(id: string, texto: string) {
    // Cerrar desmonta el input y el navegador dispara `blur` en el acto: un
    // solo Enter llega acá dos veces. Sin el pestillo, la segunda pasada
    // borraba el elemento mientras React ya redibujaba por la primera, y eso
    // es un setState del padre en pleno render. El pestillo se baja al abrir,
    // no con un temporizador, para no depender de cuándo corren las tareas.
    if (cerrandoTexto.current) return
    cerrandoTexto.current = true
    setEditandoTexto(null)
    if (!texto.trim()) borrar(id)
  }

  /** Mueve en la lista: el orden decide qué tapa a qué. */
  function mover(id: string, delta: number) {
    const i = doc.elementos.findIndex((e) => e.id === id)
    const j = i + delta
    if (i < 0 || j < 0 || j >= doc.elementos.length) return
    const n = [...doc.elementos]
    ;[n[i], n[j]] = [n[j], n[i]]
    aplicar({ ...doc, elementos: n })
  }

  // ── Soltar una pieza de la paleta ────────────────────────────────────────
  function soltar(e: React.DragEvent) {
    e.preventDefault()
    const pieza = e.dataTransfer.getData('text/pieza') as NombrePieza
    if (!pieza || !PIEZAS.includes(pieza)) return
    const [x, y] = aPuntoLienzo(e)
    agregar({ id: nuevoId(), tipo: 'pieza', pieza, x, y, s: 1, props: {} })
  }

  /**
   * Tocar la paleta también agrega, en el centro del lienzo.
   *
   * En una tablet no hay arrastre desde fuera del lienzo: `dragstart` no
   * existe con el dedo. Sin este camino, la paleta sería inútil justo en los
   * equipos donde más se usaría.
   */
  function agregarAlCentro(pieza: NombrePieza) {
    const meta = PIEZAS_META[pieza]
    // Escalonado: si todas cayeran en el mismo punto, tocar tres piezas
    // seguidas dejaría un montón imposible de separar, porque la de arriba
    // tapa el agarre de las de abajo.
    const n = doc.elementos.length
    const paso = 42
    const x = LIENZO.ancho / 2 + ((n % 5) - 2) * paso
    const y = Math.min(LIENZO.alto - 10, 150 + (Math.floor(n / 5) % 2) * 22)
    agregar({
      id: nuevoId(), tipo: 'pieza', pieza,
      x: Math.max(30, Math.min(LIENZO.ancho - 30, x)),
      y: Math.max(meta.alto * 0.6, y),
      s: 1, props: {},
    })
  }

  // ── Gestos sobre el lienzo ───────────────────────────────────────────────
  /** Quita de un golpe todo lo dibujado que toque el punto. */
  function borrarEn(x: number, y: number, conHistorial: boolean) {
    const radio = 10
    const quedan = doc.elementos.filter(
      (e) => !(BORRABLES as readonly string[]).includes(e.tipo) || !alcanzadoPorBorrador(e, x, y, radio),
    )
    if (quedan.length === doc.elementos.length) return
    if (conHistorial) aplicar({ ...doc, elementos: quedan })
    else onChange({ ...doc, elementos: quedan })
  }

  function alPresionar(e: React.PointerEvent) {
    const [x, y] = aPuntoLienzo(e)

    if (herramienta === 'borrador') {
      borrando.current = true
      setGesto(true)
      // El primer toque sí entra al historial; los siguientes del mismo
      // gesto no, o deshacer tendría que pulsarse una vez por trazo borrado.
      borrarEn(x, y, true)
      return
    }

    if (herramienta === 'pincel') {
      trazando.current = [[x, y]]
      setTrazoVivo([[x, y]])
      setGesto(true)
      return
    }
    if (herramienta === 'texto') {
      const id = nuevoId()
      agregar({ id, tipo: 'texto', x, y, texto: 'Escribe aquí', tam: 15, color, anchor: 'middle' })
      setHerramienta('mover')
      // Se abre a escribir de una vez: quien coloca un texto es porque tiene
      // algo que escribir, no para dejar el "Escribe aquí" puesto.
      abrirEscritura(id)
      return
    }
    if (herramienta === 'forma') {
      agregar({ id: nuevoId(), tipo: 'forma', forma: 'rect', x: x - 40, y: y - 25, w: 80, h: 50, color })
      setHerramienta('mover')
      return
    }
    if (herramienta === 'flecha') {
      agregar({ id: nuevoId(), tipo: 'flecha', desde: [x - 40, y], hasta: [x + 40, y], curva: 0, color })
      setHerramienta('mover')
      return
    }
    // Herramienta mover: tocar el fondo deselecciona.
    setSelId(null)
  }

  function alMover(e: { clientX: number; clientY: number }) {
    if (borrando.current) {
      const [x, y] = aPuntoLienzo(e)
      borrarEn(x, y, false)
      return
    }

    if (trazando.current) {
      const [x, y] = aPuntoLienzo(e)
      const ultimo = trazando.current[trazando.current.length - 1]
      // Se descartan los puntos casi pegados: sin esto un trazo corto guarda
      // cientos de puntos y el documento se infla sin mejorar el dibujo.
      if (Math.hypot(x - ultimo[0], y - ultimo[1]) < 2) return
      trazando.current.push([x, y])
      setTrazoVivo([...trazando.current])
      return
    }

    if (arrastre.current) {
      const [x, y] = aPuntoLienzo(e)
      const { id, dx, dy } = arrastre.current
      const el = doc.elementos.find((n) => n.id === id)
      if (!el) return
      // Se recorta el ANCLA, no la figura entera: así una pieza puede asomar
      // por el borde a propósito. Lo mismo vale ahora para trazos y flechas,
      // que se mueven enteros desde su primer punto.
      const nx = Math.max(0, Math.min(LIENZO.ancho, x - dx))
      const ny = Math.max(0, Math.min(LIENZO.alto, y - dy))
      onChange({
        ...doc,
        elementos: doc.elementos.map((n) => (n.id === id ? moverElemento(n, nx, ny) : n)),
      })
    }
  }

  function alSoltar() {
    setGesto(false)

    if (borrando.current) {
      borrando.current = false
      return
    }

    if (trazando.current) {
      const puntos = trazando.current
      trazando.current = null
      setTrazoVivo(null)
      if (puntos.length >= 2) {
        agregar({ id: nuevoId(), tipo: 'trazo', puntos, color, grosor })
      }
      return
    }
    if (arrastre.current) {
      // El movimiento se fue aplicando en vivo; acá solo se cierra el gesto y
      // se anota el documento previo, para deshacer el arrastre entero de una
      // vez en lugar de paso a paso.
      const { antes } = arrastre.current
      setHistorial((h) => [...h.slice(-29), antes])
      arrastre.current = null
    }
  }

  /**
   * Enfoca el recuadro de escritura DESPUÉS de que termine el clic.
   *
   * Con `autoFocus` el navegador enfocaba durante el `pointerdown` —cuando el
   * texto se acaba de crear— y el `mouseup` del mismo clic movía el foco a
   * otra parte: llegaba un `blur`, `cerrarEscritura` cerraba el editor, y
   * colocar un texto dejaba de abrirlo para escribir. No se notaba disparando
   * eventos por código, porque ahí no hay clic real que mueva el foco; lo cazó
   * la prueba de extremo a extremo del editor.
   *
   * En el fotograma siguiente el clic ya terminó y nadie vuelve a robar el
   * foco, así que el recuadro se queda abierto.
   */
  useEffect(() => {
    if (!editandoTexto) return
    const id = requestAnimationFrame(() => {
      const campo = lienzoRef.current?.querySelector('input')
      if (campo) {
        campo.focus()
        campo.select()
      }
    })
    return () => cancelAnimationFrame(id)
  }, [editandoTexto])

  /**
   * Los escuchas del gesto van en `window`, NO en el div del lienzo.
   *
   * Es la misma lección de lib/use-draggable.ts. Con los escuchas en el
   * elemento, un dedo que sale del lienzo —o un `pointerup` que se pierde por
   * cualquier motivo— deja el gesto abierto para siempre: el trazo en curso se
   * queda pegado en pantalla y el pincel no vuelve a funcionar hasta recargar.
   * `setPointerCapture` era el parche, pero puede lanzar, así que no sirve de
   * garantía. En `window` no hay nada de dónde salirse.
   *
   * Los handlers se leen de un ref para que el escucha sea estable y aun así
   * vea el documento del render actual.
   */
  const gestoActual = useRef({ alMover, alSoltar })
  useEffect(() => {
    gestoActual.current = { alMover, alSoltar }
  })

  useEffect(() => {
    if (!gesto) return
    const mover = (e: PointerEvent) => gestoActual.current.alMover(e)
    const soltar = () => gestoActual.current.alSoltar()
    window.addEventListener('pointermove', mover)
    window.addEventListener('pointerup', soltar)
    window.addEventListener('pointercancel', soltar)
    return () => {
      window.removeEventListener('pointermove', mover)
      window.removeEventListener('pointerup', soltar)
      window.removeEventListener('pointercancel', soltar)
    }
  }, [gesto])

  const docVista: EscenaDoc = trazoVivo
    ? { ...doc, elementos: [...doc.elementos, { id: 'vivo', tipo: 'trazo', puntos: trazoVivo, color, grosor }] }
    : doc

  return (
    /*
      Un solo instrumento, no una pila de bandas.

      Antes había cinco filas de controles sobre el lienzo y dos tarjetas
      sueltas debajo. Cada cosa vive ahora junto a lo que modifica: las
      herramientas y los colores pegados al lienzo, el fondo soldado debajo de
      él, y las acciones del documento —deshacer, vaciar— arriba, que es donde
      está el modo.

      El ancho extra que necesita el lienzo se lo da la PÁGINA, no un margen
      negativo: sacar el panel del contenedor lo dejaba medio fuera de la
      tarjeta, flotando sobre el fondo. La página de edición ahora se ensancha
      en pantalla grande y los campos de texto se quedan estrechos por su
      cuenta, que es lo que cada uno necesita.
    */
    <div className="rounded-lg border border-border bg-card/40 overflow-hidden">
      {/* ── Acciones del documento ── */}
      <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 border-b border-border">
        <p className="text-xs text-muted-foreground">
          {doc.elementos.length === 0
            ? 'Lienzo vacío'
            : `${doc.elementos.length} ${doc.elementos.length === 1 ? 'elemento' : 'elementos'}`}
        </p>
        <div className="flex items-center gap-1">
          <Button type="button" size="sm" variant="ghost" onClick={deshacer} disabled={historial.length === 0}>
            <Undo2 className="w-3.5 h-3.5 mr-1.5" />
            Deshacer
          </Button>
          <Button
            type="button" size="sm" variant="ghost"
            onClick={() => aplicar({ ...doc, elementos: [] })}
            disabled={doc.elementos.length === 0}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Vaciar
          </Button>
        </div>
      </div>

      {/* ── Escenario: riel · lienzo · paleta ── */}
      {/*
        El riel solo se pone vertical cuando hay ancho que lo pague. En tablet
        el lienzo se estrecha y el riel de pie (375 px) volvía a ser más alto
        que el dibujo, con el mismo hueco negro debajo que veníamos de quitar.
        Ahí cruza arriba, en horizontal, y la altura de la fila la manda el
        lienzo otra vez.
      */}
      <div className="grid md:grid-cols-[1fr_15rem] lg:grid-cols-[auto_1fr_15rem]">
        {/*
          Riel de herramientas. Lleva icono Y nombre: quien usa esto lo abre
          una vez por lección, no todos los días, y un riel de iconos pelados
          castiga justo a quien menos práctica tiene.
        */}
        <div className="flex lg:flex-col gap-1 p-2 border-b lg:border-b-0 lg:border-r border-border md:col-span-2 lg:col-span-1 overflow-x-auto">
          {([
            ['mover', MousePointer2, 'Mover'],
            ['pincel', Brush, 'Pincel'],
            ['borrador', Eraser, 'Borrador'],
            ['texto', TypeIcon, 'Texto'],
            ['forma', Square, 'Forma'],
            ['flecha', ArrowUpRight, 'Flecha'],
          ] as const).map(([id, Icon, nombre]) => (
            <button
              key={id}
              type="button"
              onClick={() => setHerramienta(id)}
              title={nombre}
              aria-pressed={herramienta === id}
              className={cn(
                'flex lg:w-16 shrink-0 flex-col items-center gap-0.5 rounded-md px-2 py-1.5 text-[10px] transition-colors',
                herramienta === id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="w-4 h-4" />
              {nombre}
            </button>
          ))}

          {/* Los colores pertenecen a las herramientas de dibujo, no a
              Deshacer: la divisoria dice que siguen siendo del mismo grupo. */}
          <div className="hidden lg:block h-px bg-border mx-1 my-1" />
          {/* `lg:w-16` para que quepan en el riel de pie en dos filas de tres.
              Sin el tope, los seis en fila estiraban la columna a 165 px y ese
              ancho se lo quitaban al dibujo. */}
          <div className="flex lg:w-16 shrink-0 flex-wrap items-center justify-center gap-1 ml-1 lg:ml-0">
            {COLORES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setColor(c)
                  if (sel && 'color' in sel) actualizar(sel.id, { color: c } as Partial<Elemento>)
                }}
                aria-label={`Color ${c}`}
                aria-pressed={color === c}
                className={cn(
                  'w-5 h-5 rounded-full border-2 transition-transform',
                  color === c ? 'border-foreground scale-110' : 'border-border',
                )}
                style={{ background: c }}
              />
            ))}
          </div>

          {/*
            Siempre presente, oculto cuando no toca: si aparece y desaparece,
            el riel cambia de alto y el LIENZO SE MUEVE bajo el cursor justo
            al cambiar de herramienta. Reservar el hueco cuesta unos píxeles y
            evita que el dibujo salte.
          */}
          <div
            aria-hidden={herramienta !== 'pincel'}
            className={cn(
              'flex lg:flex-col items-center gap-1 shrink-0 lg:px-1 lg:pt-1 ml-1 lg:ml-0',
              herramienta !== 'pincel' && 'invisible pointer-events-none',
            )}
          >
            <Label className="text-[10px] text-muted-foreground">Grosor</Label>
            <input
              type="range" min={1} max={10} step={1} value={grosor}
              onChange={(e) => setGrosor(Number(e.target.value))}
              tabIndex={herramienta === 'pincel' ? 0 : -1}
              className="w-16 accent-primary"
            />
          </div>
        </div>

        {/* ── Lienzo ──
            Centrado: cuando el riel es más alto que el dibujo, el sobrante se
            reparte arriba y abajo en vez de quedar todo debajo como un hueco. */}
        <div className="p-2 min-w-0 flex items-center justify-center">
        <div
          ref={lienzoRef}
          onDragOver={(e) => e.preventDefault()}
          onDrop={soltar}
          onPointerDown={alPresionar}
          className={cn(
            'relative w-full aspect-[400/220] rounded-lg border-2 border-border bg-white overflow-hidden select-none',
            (herramienta === 'pincel' || herramienta === 'borrador') && 'cursor-crosshair',
          )}
          style={{ touchAction: 'none' }}
          // Ancla para las pruebas. Antes se ubicaba el lienzo buscando
          // `style*="touch-action: none"`, que depende de cómo el navegador
          // serialice el atributo —con espacio o sin él— y falla sin motivo
          // aparente.
          data-lienzo
        >
          <CustomScene doc={docVista} />

          {/*
            Agarre de trazos y flechas: un calco invisible y grueso de la
            propia línea.

            Va en SVG y no en HTML como los demás porque su caja no sirve: la
            de una diagonal larga cubre media escena y taparía todo lo que
            haya debajo. Calcando la línea se agarra justo donde se ve, y el
            camino sale de las mismas funciones que la dibujan, así que no
            pueden desalinearse.
          */}
          <svg
            viewBox={`0 0 ${LIENZO.ancho} ${LIENZO.alto}`}
            className="absolute inset-0 w-full h-full"
            style={{ pointerEvents: 'none' }}
            aria-hidden="true"
            // Lleva el MISMO viewBox que el dibujo, así que sin esta marca un
            // selector como `svg[viewBox="0 0 400 220"] path` encuentra cada
            // trazo dos veces: el pintado y su calco.
            data-calco
          >
            {doc.elementos.map((e) => {
              if (e.tipo !== 'trazo' && e.tipo !== 'flecha') return null
              const d = e.tipo === 'trazo'
                ? caminoDeTrazo(e.puntos)
                : caminoDeFlecha(e.desde, e.hasta, e.curva)
              const grueso = (e.tipo === 'trazo' ? e.grosor : 3) + 14
              return (
                <path
                  key={e.id}
                  d={d}
                  fill="none"
                  // Resaltado suave al estar elegido; si no, solo área de toque.
                  stroke={selId === e.id ? 'rgba(99,102,241,0.35)' : 'transparent'}
                  strokeWidth={grueso}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    // Solo se agarra con la herramienta de mover: con el
                    // pincel o el borrador el dedo tiene que llegar al lienzo.
                    pointerEvents: herramienta === 'mover' && !editandoTexto ? 'stroke' : 'none',
                    cursor: 'grab',
                  }}
                  onPointerDown={(ev) => {
                    ev.stopPropagation()
                    const [px, py] = aPuntoLienzo(ev)
                    const [ax, ay] = anclaDe(e)
                    arrastre.current = { id: e.id, dx: px - ax, dy: py - ay, antes: doc }
                    setSelId(e.id)
                    setGesto(true)
                  }}
                />
              )
            })}
          </svg>

          {/* Zonas de agarre: una por elemento, encima del dibujo. */}
          {doc.elementos.map((e) => {
            const { left, top, ancho, alto } = cajaDe(e, (pieza) => PIEZAS_META[pieza].alto)
            // El trazo y la flecha se agarran con el calco en SVG de arriba,
            // no con un recuadro: su caja taparía lo que tienen debajo. Acá
            // solo se les pone la barra de botones.
            const agarreEnLinea = e.tipo === 'trazo' || e.tipo === 'flecha'

            const elegido = selId === e.id
            const editando = editandoTexto === e.id && e.tipo === 'texto'

            // Dónde cabe la barra de controles. El lienzo recorta lo que se
            // sale (`overflow-hidden`), así que un elemento pegado al borde de
            // arriba se quedaba sin botones: la barra existía pero no se veía.
            // ALTO_BARRA va en unidades del dibujo y por lo alto a propósito:
            // en el lienzo más angosto que soportamos, los 32px de la barra
            // ocupan cerca de 40 unidades, y preferimos voltearla de más.
            const sitioBarra =
              top >= ALTO_BARRA ? 'arriba'
              : top + alto + ALTO_BARRA <= LIENZO.alto ? 'abajo'
              : 'dentro'

            return (
              <div
                key={e.id}
                className="absolute"
                style={{
                  left: `${(left / LIENZO.ancho) * 100}%`,
                  top: `${(top / LIENZO.alto) * 100}%`,
                  width: `${(ancho / LIENZO.ancho) * 100}%`,
                  height: `${(alto / LIENZO.alto) * 100}%`,
                  // En trazos y flechas el envoltorio solo sirve para colocar
                  // la barra: si aceptara toques, la caja de una diagonal se
                  // tragaría todo lo que tiene debajo, incluido el calco que
                  // sí sabe dónde está la línea.
                  ...(agarreEnLinea ? { pointerEvents: 'none' as const } : {}),
                }}
              >
                {!agarreEnLinea && (
                <button
                  type="button"
                  onPointerDown={(ev) => {
                    if (herramienta !== 'mover' || editando) return
                    ev.stopPropagation()
                    const [px, py] = aPuntoLienzo(ev)
                    const [ax, ay] = anclaDe(e)
                    arrastre.current = { id: e.id, dx: px - ax, dy: py - ay, antes: doc }
                    setSelId(e.id)
                    setGesto(true)
                  }}
                  onDoubleClick={() => {
                    // Doble toque en un texto: se escribe ahí mismo. Es el
                    // gesto que la gente ya conoce de cualquier editor.
                    if (e.tipo === 'texto') abrirEscritura(e.id)
                  }}
                  aria-label={`Seleccionar ${e.tipo}`}
                  className={cn(
                    'absolute inset-0 rounded transition-colors',
                    herramienta === 'mover' ? 'cursor-grab' : 'pointer-events-none',
                    elegido ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-primary/5',
                  )}
                />
                )}

                {/* Escribir sobre el lienzo, en el sitio del texto. */}
                {editando && e.tipo === 'texto' && (
                  <input
                    value={e.texto}
                    onChange={(ev) => actualizar(e.id, { texto: ev.target.value } as Partial<Elemento>)}
                    onBlur={() => cerrarEscritura(e.id, e.texto)}
                    onKeyDown={(ev) => {
                      if (ev.key === 'Enter' || ev.key === 'Escape') cerrarEscritura(e.id, e.texto)
                    }}
                    className="absolute inset-0 w-full h-full text-center bg-white text-indigo-950 border-2 border-primary rounded px-1 outline-none"
                    style={{ fontSize: 'clamp(9px, 3.2vw, 15px)' }}
                  />
                )}

                {/* Controles del elemento elegido, ENCIMA del lienzo.
                    Antes solo estaban en el panel de abajo, que en pantallas
                    normales queda fuera de vista al mirar el dibujo: se
                    seleccionaba algo y no pasaba nada visible. */}
                {elegido && !editando && herramienta === 'mover' && (
                  <div
                    style={{ pointerEvents: 'auto' }}
                    /*
                      SIN ESTO LOS BOTONES NO FUNCIONAN CON UN CLIC DE VERDAD.

                      La barra vive dentro del lienzo, así que su `pointerdown`
                      burbujea hasta él; con la herramienta "Mover", tocar el
                      lienzo deselecciona. React desmonta la barra en ese
                      instante y el `click` —que llega después del `pointerup`—
                      ya no encuentra el botón: no pasa nada.

                      No se veía disparando `click` por código, porque ese
                      camino no genera `pointerdown`. Lo cazó la prueba de
                      extremo a extremo con entrada real.
                    */
                    onPointerDown={(ev) => ev.stopPropagation()}
                    className={cn(
                      'absolute left-1/2 -translate-x-1/2 flex items-center gap-0.5 rounded-lg bg-card border border-border shadow-lg px-1 py-0.5 z-10',
                      sitioBarra === 'arriba' && '-top-8',
                      sitioBarra === 'abajo' && 'top-full mt-1',
                      sitioBarra === 'dentro' && 'top-1',
                    )}
                  >
                    {e.tipo === 'texto' && (
                      <button
                        type="button"
                        onClick={() => abrirEscritura(e.id)}
                        aria-label="Escribir el texto"
                        title="Escribir"
                        className="p-1 rounded hover:bg-muted text-foreground"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => mover(e.id, 1)}
                      aria-label="Traer al frente"
                      title="Traer al frente"
                      className="p-1 rounded hover:bg-muted text-foreground"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => mover(e.id, -1)}
                      aria-label="Mandar atrás"
                      title="Mandar atrás"
                      className="p-1 rounded hover:bg-muted text-foreground"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => borrar(e.id)}
                      aria-label="Eliminar este elemento"
                      title="Eliminar"
                      className="p-1 rounded hover:bg-red-500/15 text-red-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )
          })}

          {doc.elementos.length === 0 && (
            <p className="absolute inset-0 grid place-items-center text-sm text-muted-foreground pointer-events-none">
              Arrastra una pieza aquí, o tócala en la lista
            </p>
          )}
        </div>
        </div>

        {/*
          Paleta. La altura la manda el lienzo, no ella.

          El truco del `absolute` en `md`: sin él la paleta medía 512 y el
          lienzo 255, y el editor se quedaba con 257 px de vacío negro debajo
          del dibujo. Al salir del flujo deja de empujar la fila, la celda se
          estira a la altura del lienzo por el `stretch` del grid, y la paleta
          se desplaza por dentro. En móvil no aplica: ahí va apilada y tiene
          que ocupar lo que ocupe.
        */}
        <div className="md:relative border-t md:border-t-0 md:border-l border-border min-w-0">
          {/* Degradado al pie: la paleta casi siempre queda cortada por la
              altura del lienzo, y una pieza seccionada a la mitad parece un
              fallo de dibujo. Difuminada, dice "sigue hacia abajo". */}
          <div className="hidden md:block absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-card to-transparent pointer-events-none z-20" />
          <div
            className="md:absolute md:inset-0 overflow-y-auto p-2 space-y-3"
            // La barra por defecto es clara y en un panel oscuro canta. Va con
            // los tokens del tema para que no destaque más que las piezas.
            style={{ scrollbarWidth: 'thin', scrollbarColor: 'hsl(var(--border)) transparent' }}
          >
          {/*
            Plegadas de entrada. Con catorce categorías y más de cien piezas,
            desplegarlo todo obliga a desplazarse un buen rato para ver qué
            hay; cerrado se lee el índice completo de un vistazo y se abre solo
            lo que hace falta.

            Va con `<details>` y no con estado propio: trae el plegado, el
            teclado y la semántica de fábrica, y no hay nada que sincronizar.
          */}
          {GRUPOS_PIEZAS.map((grupo) => (
            <details key={grupo.nombre} className="group/cat rounded-md border border-border/60 bg-background/40">
              <summary className="flex items-center gap-1.5 px-2 py-1.5 cursor-pointer list-none select-none rounded-md hover:bg-muted/60">
                <ChevronRight className="w-3.5 h-3.5 shrink-0 text-muted-foreground transition-transform group-open/cat:rotate-90" />
                <span className="text-[11px] font-medium text-foreground">{grupo.nombre}</span>
                <span className="ml-auto text-[10px] tabular-nums text-muted-foreground">{grupo.piezas.length}</span>
              </summary>
              <div className="grid grid-cols-3 gap-1.5 p-1.5 pt-0.5">
                {grupo.piezas.map((p) => (
                  <button
                    key={p}
                    type="button"
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('text/pieza', p)}
                    onClick={() => agregarAlCentro(p)}
                    title={`${PIEZAS_META[p].nombre} — arrástrala al dibujo o tócala`}
                    className="group flex flex-col items-center gap-1 rounded-md border border-border bg-card p-1.5 hover:bg-muted hover:border-primary/50 transition-colors cursor-grab active:cursor-grabbing"
                  >
                    <MiniPieza pieza={p} />
                    <span className="text-[10px] leading-tight text-muted-foreground group-hover:text-foreground text-center">
                      {PIEZAS_META[p].nombre}
                    </span>
                  </button>
                ))}
              </div>
            </details>
          ))}
          </div>
        </div>
      </div>

      {/* ── Fondo: es una propiedad del lienzo, así que va pegado a él ── */}
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 border-t border-border overflow-x-auto">
        <Label className="text-xs text-muted-foreground shrink-0">Fondo</Label>
        {FONDOS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => aplicar({ ...doc, fondo: f })}
            aria-pressed={doc.fondo === f}
            className={cn(
              'text-xs rounded-md px-2 py-1 border transition-colors shrink-0',
              doc.fondo === f
                ? 'border-primary bg-primary/10 text-primary font-medium'
                : 'border-transparent text-muted-foreground hover:bg-muted',
            )}
          >
            {FONDOS_META[f]}
          </button>
        ))}
      </div>

      {/* ── Ajustes del elegido, dentro del mismo marco y a la vista ── */}
      {sel && <Ajustes sel={sel} onCambio={(c) => actualizar(sel.id, c)} onBorrar={() => borrar(sel.id)} onMover={(d) => mover(sel.id, d)} />}

      <AsistenteEscena
        doc={doc}
        topicId={topicId}
        topicName={topicName}
        onAplicar={(d) => aplicar(d)}
      />
    </div>
  )
}

/**
 * Marco que contiene a CUALQUIER pieza del kit, con holgura.
 *
 * Se usa hasta que se mide la de verdad. Nunca recorta: lo peor que puede
 * pasar es que por un instante la pieza se vea más pequeña de lo que acabará
 * viéndose.
 */
const MARCO_SEGURO = '-62 -84 124 94'

/**
 * La pieza dibujada de verdad, en miniatura, para la paleta.
 *
 * Un nombre escrito obliga a imaginarse el dibujo; la miniatura se reconoce de
 * un vistazo, que es lo que hace falta cuando se está armando una escena.
 *
 * EL MARCO SE MIDE, NO SE CALCULA. La tentación es armarlo con el `alto` de
 * `PIEZAS_META`, pero ese número es una estimación para COLOCAR la pieza en el
 * lienzo, no su caja real: el sol dice 34 y con los rayos mide 67. Con esa
 * cuenta siete de las dieciséis se salían del marco. `getBBox()` devuelve la
 * caja de verdad, así que esto sigue funcionando si mañana alguien retoca un
 * dibujo o agrega una pieza al kit.
 *
 * El margen cubre la sombra, que `getBBox()` no incluye porque viene de un
 * filtro y no de la geometría.
 *
 * No lleva `<Defs />` propio: los degradados del kit se definen una sola vez,
 * en el `CustomScene` del lienzo, que siempre se dibuja antes que la paleta.
 * Repetirlos acá duplicaría los `id` de la página sin cambiar nada.
 */
function MiniPieza({ pieza }: { pieza: NombrePieza }) {
  const Dibujo = REGISTRO_PALETA[pieza]
  const grupo = useRef<SVGGElement>(null)
  const [marco, setMarco] = useState(MARCO_SEGURO)

  useEffect(() => {
    if (!grupo.current) return
    const caja = grupo.current.getBBox()
    if (caja.width === 0 || caja.height === 0) return
    const m = 5
    setMarco(`${caja.x - m} ${caja.y - m} ${caja.width + m * 2} ${caja.height + m * 2}`)
  }, [pieza])

  return (
    <svg
      viewBox={marco}
      preserveAspectRatio="xMidYMid meet"
      className="w-full h-10 pointer-events-none"
      aria-hidden="true"
    >
      <g ref={grupo}>
        <Dibujo x={0} y={0} s={1} />
      </g>
    </svg>
  )
}

// ── Panel del elemento seleccionado ────────────────────────────────────────

function Ajustes({
  sel,
  onCambio,
  onBorrar,
  onMover,
}: {
  sel: Elemento
  onCambio: (c: Partial<Elemento>) => void
  onBorrar: () => void
  onMover: (d: number) => void
}) {
  const meta = sel.tipo === 'pieza' ? PIEZAS_META[sel.pieza] : null

  return (
    /*
      Franja dentro del marco, no tarjeta aparte.

      Estaba debajo de la paleta, a media pantalla del dibujo: se elegía una
      pieza y sus ajustes aparecían fuera de la vista. Acá cuelga del lienzo y
      los controles van en fila, así que ocupa una línea o dos.
    */
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-2.5 py-2 border-t border-border bg-muted/20">
      <div className="flex items-center gap-2">
        <p className="text-xs font-medium text-foreground">
          {meta ? meta.nombre : sel.tipo === 'texto' ? 'Texto' : sel.tipo === 'trazo' ? 'Trazo' : sel.tipo === 'flecha' ? 'Flecha' : 'Forma'}
        </p>
        <div className="flex gap-0.5">
          <Button type="button" size="icon-xs" variant="ghost" onClick={() => onMover(-1)} aria-label="Mandar atrás">
            <ChevronDown className="w-3 h-3" />
          </Button>
          <Button type="button" size="icon-xs" variant="ghost" onClick={() => onMover(1)} aria-label="Traer al frente">
            <ChevronUp className="w-3 h-3" />
          </Button>
          <Button type="button" size="icon-xs" variant="ghost" onClick={onBorrar} aria-label="Eliminar">
            <Trash2 className="w-3 h-3 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {sel.tipo === 'pieza' && (
        <>
          <Rango etiqueta="Tamaño" valor={sel.s} min={0.4} max={2.5} paso={0.1}
            onCambio={(v) => onCambio({ s: v } as Partial<Elemento>)} />
          {meta?.opciones?.color && (
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">{meta.opciones.color.etiqueta}</Label>
              <div className="flex gap-1.5">
                {meta.opciones.color.valor.map((c) => (
                  <button key={c} type="button"
                    onClick={() => onCambio({ props: { ...sel.props, [meta.opciones!.color!.prop]: c } } as Partial<Elemento>)}
                    aria-label={c}
                    className="w-6 h-6 rounded-full border-2 border-border"
                    style={{ background: c }} />
                ))}
              </div>
            </div>
          )}
          {meta?.opciones?.elegir && (
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground shrink-0">{meta.opciones.elegir.etiqueta}</Label>
              <select
                value={String(sel.props?.[meta.opciones.elegir.prop] ?? meta.opciones.elegir.valor[0])}
                onChange={(e) => onCambio({ props: { ...sel.props, [meta.opciones!.elegir!.prop]: e.target.value } } as Partial<Elemento>)}
                className="flex h-7 rounded-md border border-border bg-background px-2 text-xs text-foreground"
              >
                {meta.opciones.elegir.valor.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          )}
          {meta?.opciones?.texto && (
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground shrink-0">{meta.opciones.texto.etiqueta}</Label>
              <Input
                value={String(sel.props?.[meta.opciones.texto.prop] ?? '')}
                maxLength={meta.opciones.texto.max}
                onChange={(e) =>
                  onCambio({ props: { ...sel.props, [meta.opciones!.texto!.prop]: e.target.value } } as Partial<Elemento>)
                }
                className="h-7 w-16 text-xs text-center"
              />
            </div>
          )}
          {meta?.opciones?.numero && (
            <Rango
              etiqueta={meta.opciones.numero.etiqueta}
              valor={Number(sel.props?.[meta.opciones.numero.prop] ?? meta.opciones.numero.min)}
              min={meta.opciones.numero.min} max={meta.opciones.numero.max} paso={meta.opciones.numero.paso}
              onCambio={(v) => onCambio({ props: { ...sel.props, [meta.opciones!.numero!.prop]: v } } as Partial<Elemento>)}
            />
          )}
        </>
      )}

      {sel.tipo === 'texto' && (
        <>
          <div className="flex items-center gap-2 min-w-[12rem] flex-1">
            <Label className="text-xs text-muted-foreground shrink-0">Texto</Label>
            <Input value={sel.texto} onChange={(e) => onCambio({ texto: e.target.value } as Partial<Elemento>)} className="h-7 text-xs" />
          </div>
          <Rango etiqueta="Tamaño de letra" valor={sel.tam} min={9} max={34} paso={1}
            onCambio={(v) => onCambio({ tam: v } as Partial<Elemento>)} />
        </>
      )}

      {sel.tipo === 'forma' && (
        <>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground shrink-0">Figura</Label>
            <select
              value={sel.forma}
              onChange={(e) => onCambio({ forma: e.target.value as 'rect' | 'elipse' } as Partial<Elemento>)}
              className="flex h-7 rounded-md border border-border bg-background px-2 text-xs text-foreground"
            >
              <option value="rect">Rectángulo</option>
              <option value="elipse">Elipse</option>
            </select>
          </div>
          <Rango etiqueta="Ancho" valor={sel.w} min={10} max={380} paso={5}
            onCambio={(v) => onCambio({ w: v } as Partial<Elemento>)} />
          <Rango etiqueta="Alto" valor={sel.h} min={10} max={200} paso={5}
            onCambio={(v) => onCambio({ h: v } as Partial<Elemento>)} />
        </>
      )}

      {sel.tipo === 'flecha' && (
        <Rango etiqueta="Curva" valor={sel.curva} min={-60} max={60} paso={5}
          onCambio={(v) => onCambio({ curva: v } as Partial<Elemento>)} />
      )}

      {sel.tipo === 'trazo' && (
        <Rango etiqueta="Grosor" valor={sel.grosor} min={1} max={10} paso={1}
          onCambio={(v) => onCambio({ grosor: v } as Partial<Elemento>)} />
      )}
    </div>
  )
}

function Rango({
  etiqueta, valor, min, max, paso, onCambio,
}: {
  etiqueta: string; valor: number; min: number; max: number; paso: number; onCambio: (v: number) => void
}) {
  return (
    /* En línea, no apilado: el inspector es una franja, y un control por fila
       lo estiraba hasta volver a empujar el lienzo fuera de la vista. */
    <div className="flex items-center gap-2">
      <Label className="text-xs text-muted-foreground shrink-0">{etiqueta}</Label>
      <input
        type="range" min={min} max={max} step={paso} value={valor}
        onChange={(e) => onCambio(Number(e.target.value))}
        className="w-28 accent-primary"
      />
      <span className="text-xs text-muted-foreground tabular-nums w-8 shrink-0">{valor}</span>
    </div>
  )
}
