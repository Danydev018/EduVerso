'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Arrastrar un elemento flotante y recordar dónde lo dejaron.
 *
 * El panel del alumno tiene botones flotantes (la música, Profe Bot) que
 * tapan contenido según la pantalla. En vez de adivinar una posición que le
 * sirva a todos, se deja mover.
 *
 * Dos cosas que hay que resolver sí o sí:
 *
 * 1. ARRASTRE VS. TOQUE. El mismo botón se toca para abrir su panel y se
 *    arrastra para moverlo. Se distinguen por distancia: si el dedo se movió
 *    menos de UMBRAL_PX, fue un toque. Sin esto, cada intento de mover
 *    abriría el panel, y cada toque movería el botón unos píxeles.
 *
 * 2. QUE NO SE PIERDA. Una posición guardada puede quedar fuera de la
 *    pantalla al rotar el teléfono o cambiar de equipo. Se recorta contra el
 *    viewport al leerla y en cada `resize`.
 *
 * Se usan Pointer Events, que cubren dedo, mouse y lápiz con un solo camino.
 */

const UMBRAL_PX = 6

/** Aire mínimo contra los bordes para que el botón nunca quede a ras. */
const MARGEN = 8

export interface Draggable {
  /** Va en el contenedor que se mueve. */
  contenedorRef: React.RefObject<HTMLDivElement>
  /** Va en el elemento del que se agarra (el botón). */
  handleProps: {
    onPointerDown: (e: React.PointerEvent) => void
    style: React.CSSProperties
  }
  /** `null` hasta que lo muevan: ahí manda la posición del CSS. */
  posicion: { x: number; y: number } | null
  /** true mientras se arrastra, para atenuar o resaltar. */
  arrastrando: boolean
  /**
   * Consultar en el `onClick` del botón: si el gesto fue un arrastre, hay que
   * ignorar el clic que el navegador dispara igual al soltar.
   *
   * Consume la marca: la deja en falso al leerla, así solo se traga ESE clic.
   */
  fueArrastre: () => boolean
}

export function useDraggable(claveAlmacenamiento: string): Draggable {
  const contenedorRef = useRef<HTMLDivElement>(null)
  const [posicion, setPosicion] = useState<{ x: number; y: number } | null>(null)
  const [arrastrando, setArrastrando] = useState(false)

  // Datos del gesto en curso. En refs y no en estado: cambian en cada
  // pointermove y no deben provocar renders.
  const inicio = useRef({ puntero: { x: 0, y: 0 }, elemento: { x: 0, y: 0 } })
  const movido = useRef(false)

  const recortar = useCallback((x: number, y: number) => {
    const el = contenedorRef.current
    const ancho = el?.firstElementChild?.getBoundingClientRect().width ?? 44
    const alto = el?.firstElementChild?.getBoundingClientRect().height ?? 44
    return {
      x: Math.min(Math.max(x, MARGEN), window.innerWidth - ancho - MARGEN),
      y: Math.min(Math.max(y, MARGEN), window.innerHeight - alto - MARGEN),
    }
  }, [])

  // Posición guardada. Se lee tras el montaje: en el servidor no hay
  // localStorage ni medidas de ventana contra las que recortar.
  useEffect(() => {
    try {
      const crudo = localStorage.getItem(claveAlmacenamiento)
      if (!crudo) return
      const { x, y } = JSON.parse(crudo)
      if (typeof x === 'number' && typeof y === 'number') setPosicion(recortar(x, y))
    } catch {
      /* sin posición guardada; queda la del CSS */
    }
  }, [claveAlmacenamiento, recortar])

  // Al rotar el teléfono o achicar la ventana, una posición válida puede
  // quedar afuera.
  useEffect(() => {
    if (!posicion) return
    const alRedimensionar = () => setPosicion((p) => (p ? recortar(p.x, p.y) : p))
    window.addEventListener('resize', alRedimensionar)
    return () => window.removeEventListener('resize', alRedimensionar)
  }, [posicion, recortar])

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Solo el botón principal del mouse; el secundario abre el menú
      // contextual y no debe arrastrar.
      if (e.button !== 0) return

      const el = contenedorRef.current
      if (!el) return

      const caja = el.getBoundingClientRect()
      inicio.current = {
        puntero: { x: e.clientX, y: e.clientY },
        elemento: { x: caja.left, y: caja.top },
      }
      movido.current = false

      // Los listeners van en `window`, no en el botón: si fueran del botón,
      // mover el dedo rápido lo dejaría atrás y el arrastre se cortaría a
      // mitad de camino. La captura de puntero es un refuerzo, y va envuelta
      // porque puede fallar (puntero ya liberado, gesto sintético) y una
      // excepción acá abortaría el handler antes de registrar nada: el botón
      // quedaría imposible de mover.
      const objetivo = e.currentTarget as HTMLElement
      try {
        objetivo.setPointerCapture(e.pointerId)
      } catch {
        /* sin captura; los listeners de window alcanzan */
      }

      const alMover = (ev: PointerEvent) => {
        const dx = ev.clientX - inicio.current.puntero.x
        const dy = ev.clientY - inicio.current.puntero.y

        if (!movido.current && Math.hypot(dx, dy) < UMBRAL_PX) return

        if (!movido.current) {
          movido.current = true
          setArrastrando(true)
        }
        setPosicion(recortar(inicio.current.elemento.x + dx, inicio.current.elemento.y + dy))
      }

      const alSoltar = () => {
        window.removeEventListener('pointermove', alMover)
        window.removeEventListener('pointerup', alSoltar)
        window.removeEventListener('pointercancel', alSoltar)
        try {
          objetivo.releasePointerCapture(e.pointerId)
        } catch {
          /* el puntero ya se soltó solo */
        }
        setArrastrando(false)

        // Por si el navegador no dispara el clic posterior: que la marca no
        // quede encendida esperando a un clic que nunca llega.
        const huboMovimiento = movido.current
        setTimeout(() => {
          movido.current = false
        }, 0)

        if (huboMovimiento) {
          setPosicion((p) => {
            if (p) {
              try {
                localStorage.setItem(claveAlmacenamiento, JSON.stringify(p))
              } catch {
                /* no se puede guardar; vale para esta sesión */
              }
            }
            return p
          })
        }
      }

      window.addEventListener('pointermove', alMover)
      window.addEventListener('pointerup', alSoltar)
      window.addEventListener('pointercancel', alSoltar)
    },
    [claveAlmacenamiento, recortar],
  )

  // `fueArrastre` se consulta en el onClick, que corre justo después del
  // pointerup: si hubo movimiento, ese clic no es del usuario queriendo
  // abrir el panel, sino el que el navegador dispara al terminar el gesto.
  //
  // La marca se CONSUME al leerla. Si quedara encendida, anularía también el
  // clic siguiente, y con el teclado eso es peor todavía: Enter y Espacio
  // disparan clic sin ningún `pointerdown` que la reinicie, así que el botón
  // quedaría muerto para quien no usa mouse después de moverlo una vez.
  const fueArrastre = useCallback(() => {
    const hubo = movido.current
    movido.current = false
    return hubo
  }, [])

  return {
    contenedorRef,
    handleProps: {
      onPointerDown,
      // touch-action: none evita que el navegador interprete el gesto como
      // desplazamiento de la página mientras se arrastra el botón.
      style: { touchAction: 'none', cursor: arrastrando ? 'grabbing' : 'grab' },
    },
    posicion,
    arrastrando,
    fueArrastre,
  }
}
