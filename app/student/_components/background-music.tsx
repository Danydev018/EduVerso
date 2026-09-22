'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Music, VolumeX, Volume1, Volume2, SkipForward, Bell, BellOff } from 'lucide-react'
import { sfxSilenciado, setSfxSilenciado, reproducirSfx } from '@/lib/sfx'
import { useDraggable } from '@/lib/use-draggable'

/**
 * Música de fondo del panel del alumno.
 *
 * Vive en `app/student/layout.tsx` y no en `StudentShell` a propósito: el
 * layout no se vuelve a montar al navegar entre páginas del alumno, así que
 * la música sigue sonando de una pantalla a otra en vez de reiniciarse en
 * cada clic.
 *
 * Solo existe para el alumno. Ni el docente ni la coordinación la tienen:
 * están trabajando, no jugando.
 */

const PISTAS = ['/audio/tema1.mp3', '/audio/tema2.mp3', '/audio/tema3.mp3']

const CLAVE_VOLUMEN = 'eduverso:musica-volumen'
const CLAVE_SILENCIO = 'eduverso:musica-silencio'

/** Volumen inicial bajo: es fondo, no primer plano. */
const VOLUMEN_POR_DEFECTO = 0.35

function leerAlmacenado<T>(clave: string, porDefecto: T, convertir: (v: string) => T): T {
  // localStorage lanza excepción en ventanas privadas y con las cookies de
  // sitio bloqueadas; el panel tiene que abrir igual.
  try {
    const v = localStorage.getItem(clave)
    return v === null ? porDefecto : convertir(v)
  } catch {
    return porDefecto
  }
}

function guardar(clave: string, valor: string) {
  try {
    localStorage.setItem(clave, valor)
  } catch {
    /* sin persistencia; la sesión actual funciona igual */
  }
}

export function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [pista, setPista] = useState(0)
  const [volumen, setVolumen] = useState(VOLUMEN_POR_DEFECTO)
  const [silencio, setSilencio] = useState(false)
  const [sonando, setSonando] = useState(false)
  const [abierto, setAbierto] = useState(false)
  // Hasta que no se leyeron las preferencias no se puede arrancar nada: el
  // estado inicial dice "no silenciada" y arrancar con eso hace sonar la
  // música de un alumno que la había silenciado.
  const [preferenciasListas, setPreferenciasListas] = useState(false)
  // Los efectos del quiz son otra cosa que la música: un alumno puede querer
  // silencio de fondo y aun así oír si acertó.
  const [efectos, setEfectos] = useState(true)

  const arrastre = useDraggable('eduverso:musica-posicion')
  // Con el botón a la derecha, el panel tiene que abrirse hacia la izquierda
  // o se saldría de la pantalla.
  const [aLaDerecha, setALaDerecha] = useState(false)

  useEffect(() => {
    if (!arrastre.posicion) return
    setALaDerecha(arrastre.posicion.x > window.innerWidth / 2)
  }, [arrastre.posicion])

  // Preferencias guardadas. Se leen tras el montaje y no en el useState
  // inicial: en el render del servidor no hay localStorage y la marca
  // resultante no coincidiría con la del cliente.
  useEffect(() => {
    setVolumen(leerAlmacenado(CLAVE_VOLUMEN, VOLUMEN_POR_DEFECTO, (v) => {
      const n = Number(v)
      return Number.isFinite(n) && n >= 0 && n <= 1 ? n : VOLUMEN_POR_DEFECTO
    }))
    setSilencio(leerAlmacenado(CLAVE_SILENCIO, false, (v) => v === '1'))
    setEfectos(!sfxSilenciado())
    setPreferenciasListas(true)
  }, [])

  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    a.volume = silencio ? 0 : volumen
    if (silencio && !a.paused) {
      a.pause()
      setSonando(false)
    }
  }, [volumen, silencio])

  /**
   * Arranque tras el primer gesto del usuario.
   *
   * Los navegadores bloquean la reproducción automática con sonido: un
   * `play()` al cargar la página falla con NotAllowedError. En vez de pedirle
   * al niño que apriete "reproducir", se espera al primer toque en cualquier
   * parte —que llega solo, porque el panel es para navegar— y ahí empieza.
   */
  useEffect(() => {
    if (silencio || !preferenciasListas) return

    let cancelado = false

    const arrancar = () => {
      const a = audioRef.current
      if (!a || cancelado) return
      a.volume = silencio ? 0 : volumen
      a.play().then(
        () => setSonando(true),
        () => {
          /* sigue bloqueado: se reintenta en el próximo gesto */
        },
      )
    }

    // `once: false` porque el primer intento puede fallar igual (por ejemplo
    // si el gesto no cuenta como activación); se limpia al lograrlo.
    const eventos: (keyof DocumentEventMap)[] = ['pointerdown', 'keydown', 'touchstart']
    for (const e of eventos) document.addEventListener(e, arrancar, { passive: true })

    // Si la pestaña ya tenía permiso (el alumno vuelve atrás), no hace falta
    // esperar ningún gesto.
    arrancar()

    return () => {
      cancelado = true
      for (const e of eventos) document.removeEventListener(e, arrancar)
    }
  }, [silencio, volumen, sonando, preferenciasListas])

  const siguiente = useCallback(() => {
    setPista((p) => (p + 1) % PISTAS.length)
  }, [])

  // Al cambiar de pista hay que volver a llamar a play(): cambiar el src
  // detiene la reproducción.
  useEffect(() => {
    const a = audioRef.current
    if (!a || !sonando || silencio) return
    a.play().catch(() => setSonando(false))
  }, [pista, sonando, silencio])

  function alternarSilencio() {
    const nuevo = !silencio
    setSilencio(nuevo)
    guardar(CLAVE_SILENCIO, nuevo ? '1' : '0')

    const a = audioRef.current
    if (!a) return
    if (nuevo) {
      a.pause()
      setSonando(false)
    } else {
      a.volume = volumen
      a.play().then(() => setSonando(true), () => setSonando(false))
    }
  }

  function cambiarVolumen(v: number) {
    setVolumen(v)
    guardar(CLAVE_VOLUMEN, String(v))
    // Subir el volumen desde cero es la forma natural de "quiero oírla".
    if (silencio && v > 0) {
      setSilencio(false)
      guardar(CLAVE_SILENCIO, '0')
    }
  }

  function alternarEfectos() {
    const nuevo = !efectos
    setEfectos(nuevo)
    setSfxSilenciado(!nuevo)
    // Al activarlos suena uno de muestra: así se comprueba en el momento que
    // el volumen del equipo está bien, sin tener que responder una pregunta.
    if (nuevo) reproducirSfx('correcto')
  }

  const VolumenIcon = silencio || volumen === 0 ? VolumeX : volumen < 0.5 ? Volume1 : Volume2

  return (
    <>
      <audio
        ref={audioRef}
        src={PISTAS[pista]}
        onEnded={siguiente}
        preload="none"
        aria-hidden="true"
      />

      {/* El contenedor mide exactamente lo que el botón y el panel va
          posicionado en absoluto. Si el panel formara parte del flujo, al
          abrirlo el contenedor crecería y el botón se correría de lugar; peor
          aún al invertir el orden para que el panel abra hacia la izquierda.
          Así la posición guardada siempre es la del botón. */}
      <div
        ref={arrastre.contenedorRef}
        className={`fixed z-30 w-11 h-11 ${
          arrastre.posicion ? '' : 'bottom-24 md:bottom-5 left-5'
        }`}
        style={
          arrastre.posicion
            ? { left: arrastre.posicion.x, top: arrastre.posicion.y }
            : undefined
        }
      >
        <button
          type="button"
          {...arrastre.handleProps}
          onClick={() => {
            // Al soltar tras arrastrar, el navegador dispara un clic igual;
            // sin este corte, mover el botón abriría el panel.
            if (arrastre.fueArrastre()) return
            setAbierto((v) => !v)
          }}
          aria-expanded={abierto}
          aria-label={abierto ? 'Cerrar el control de música' : 'Abrir el control de música'}
          title="Música — mantén presionado para moverlo"
          className={`w-11 h-11 rounded-full bg-white shadow-lg border border-indigo-100 flex items-center justify-center text-indigo-600 transition-transform ${
            arrastre.arrastrando
              ? 'scale-110 shadow-xl shadow-indigo-900/25'
              : 'shadow-indigo-900/10 hover:scale-105'
          }`}
        >
          <Music className={`w-5 h-5 ${sonando && !silencio ? 'animate-pulse' : ''}`} />
        </button>

        {abierto && (
          <div
            className={`absolute bottom-0 rounded-2xl bg-white shadow-lg shadow-indigo-900/10 border border-indigo-100 p-3 space-y-2 w-56 ${
              aLaDerecha ? 'right-full mr-2' : 'left-full ml-2'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-indigo-950">Música</p>
              <button
                type="button"
                onClick={siguiente}
                aria-label="Cambiar de canción"
                className="text-indigo-400 hover:text-indigo-600"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={alternarSilencio}
                aria-pressed={silencio}
                aria-label={silencio ? 'Activar la música' : 'Silenciar la música'}
                className="text-indigo-600 hover:text-indigo-800 flex-shrink-0"
              >
                <VolumenIcon className="w-5 h-5" />
              </button>

              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={silencio ? 0 : volumen}
                onChange={(e) => cambiarVolumen(Number(e.target.value))}
                aria-label="Volumen de la música"
                className="flex-1 accent-indigo-600 h-6"
              />
            </div>

            <p className="text-xs text-indigo-400">
              {silencio
                ? 'Silenciada'
                : sonando
                  ? `Sonando pista ${pista + 1} de ${PISTAS.length}`
                  : 'Toca la pantalla para empezar'}
            </p>

            <button
              type="button"
              onClick={alternarEfectos}
              aria-pressed={efectos}
              className="flex items-center gap-2 w-full pt-2 border-t border-indigo-100 text-sm text-indigo-950"
            >
              {efectos ? (
                <Bell className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              ) : (
                <BellOff className="w-4 h-4 text-indigo-300 flex-shrink-0" />
              )}
              <span className="flex-1 text-left">Sonidos del juego</span>
              <span
                className={`text-xs font-semibold ${
                  efectos ? 'text-indigo-600' : 'text-indigo-300'
                }`}
              >
                {efectos ? 'Sí' : 'No'}
              </span>
            </button>
          </div>
        )}
      </div>
    </>
  )
}
