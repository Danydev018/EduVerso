/**
 * Efectos de sonido del panel del alumno.
 *
 * Se sintetizan con Web Audio en vez de descargar archivos. Son tonos simples
 * —no hacen falta samples— y así no se suman más megas a la carga inicial ni
 * hay que esperar a que un archivo llegue para que suene la respuesta. En una
 * escuela con conexión lenta eso es la diferencia entre un sonido inmediato y
 * uno que llega tarde, cuando el niño ya pasó a la siguiente pregunta.
 *
 * Los tonos son suaves a propósito: un error no debe sonar a castigo.
 */

export type Sfx = 'correcto' | 'incorrecto' | 'exito' | 'regular' | 'fracaso'

const CLAVE_SILENCIO = 'eduverso:sfx-silencio'

/** Notas en Hz, para leer las melodías como música y no como números. */
const NOTA = {
  sol3: 196.0,
  do4: 261.63,
  mi4: 329.63,
  sol4: 392.0,
  la4: 440.0,
  do5: 523.25,
  mi5: 659.25,
  sol5: 783.99,
} as const

type Nota = { hz: number; enSegundo: number; duracion: number; volumen?: number }

/**
 * Cada efecto como una secuencia de notas.
 *
 * - correcto: dos notas que suben, la señal universal de "bien".
 * - incorrecto: dos notas graves y cortas, sin disonancia agresiva.
 * - exito: arpegio mayor ascendente (do-mi-sol-do), festivo.
 * - regular: dos notas iguales, ni arriba ni abajo: "lo lograste, con roces".
 * - fracaso: descenso suave; anima a reintentar, no reprende.
 */
const MELODIAS: Record<Sfx, { ondas: OscillatorType; notas: Nota[] }> = {
  correcto: {
    ondas: 'sine',
    notas: [
      { hz: NOTA.mi5, enSegundo: 0, duracion: 0.1 },
      { hz: NOTA.sol5, enSegundo: 0.09, duracion: 0.16 },
    ],
  },
  incorrecto: {
    ondas: 'triangle',
    notas: [
      { hz: NOTA.do4, enSegundo: 0, duracion: 0.12, volumen: 0.5 },
      { hz: NOTA.sol3, enSegundo: 0.11, duracion: 0.2, volumen: 0.5 },
    ],
  },
  exito: {
    ondas: 'sine',
    notas: [
      { hz: NOTA.do5, enSegundo: 0, duracion: 0.13 },
      { hz: NOTA.mi5, enSegundo: 0.12, duracion: 0.13 },
      { hz: NOTA.sol5, enSegundo: 0.24, duracion: 0.13 },
      { hz: NOTA.do5 * 2, enSegundo: 0.36, duracion: 0.34 },
    ],
  },
  regular: {
    ondas: 'sine',
    notas: [
      { hz: NOTA.do5, enSegundo: 0, duracion: 0.14 },
      { hz: NOTA.la4, enSegundo: 0.16, duracion: 0.14 },
      { hz: NOTA.do5, enSegundo: 0.32, duracion: 0.22 },
    ],
  },
  fracaso: {
    ondas: 'triangle',
    notas: [
      { hz: NOTA.sol4, enSegundo: 0, duracion: 0.15, volumen: 0.55 },
      { hz: NOTA.mi4, enSegundo: 0.14, duracion: 0.15, volumen: 0.55 },
      { hz: NOTA.do4, enSegundo: 0.28, duracion: 0.32, volumen: 0.55 },
    ],
  },
}

let contexto: AudioContext | null = null

function obtenerContexto(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    if (!contexto) {
      const Ctor = window.AudioContext ?? (window as unknown as {
        webkitAudioContext?: typeof AudioContext
      }).webkitAudioContext
      if (!Ctor) return null
      contexto = new Ctor()
    }
    // El navegador suspende el contexto hasta que hay un gesto del usuario;
    // como estos sonidos siempre nacen de un toque, reanudarlo acá alcanza.
    if (contexto.state === 'suspended') void contexto.resume()
    return contexto
  } catch {
    return null
  }
}

export function sfxSilenciado(): boolean {
  try {
    return localStorage.getItem(CLAVE_SILENCIO) === '1'
  } catch {
    return false
  }
}

export function setSfxSilenciado(valor: boolean) {
  try {
    localStorage.setItem(CLAVE_SILENCIO, valor ? '1' : '0')
  } catch {
    /* sin persistencia; la sesión actual funciona igual */
  }
}

/**
 * Reproduce un efecto. Nunca lanza: si el navegador no soporta Web Audio o el
 * contexto está bloqueado, simplemente no suena — un efecto de sonido jamás
 * debe romper la respuesta a una pregunta.
 */
export function reproducirSfx(efecto: Sfx, volumenGeneral = 0.35) {
  if (sfxSilenciado()) return

  const ctx = obtenerContexto()
  if (!ctx) return

  try {
    const { ondas, notas } = MELODIAS[efecto]
    const ahora = ctx.currentTime

    for (const nota of notas) {
      const osc = ctx.createOscillator()
      const ganancia = ctx.createGain()

      osc.type = ondas
      osc.frequency.value = nota.hz

      const inicio = ahora + nota.enSegundo
      const fin = inicio + nota.duracion
      const pico = volumenGeneral * (nota.volumen ?? 1)

      // Ataque y caída suaves: un valor puesto de golpe produce un chasquido
      // audible al principio y al final de cada nota.
      ganancia.gain.setValueAtTime(0.0001, inicio)
      ganancia.gain.exponentialRampToValueAtTime(pico, inicio + 0.015)
      ganancia.gain.exponentialRampToValueAtTime(0.0001, fin)

      osc.connect(ganancia).connect(ctx.destination)
      osc.start(inicio)
      osc.stop(fin + 0.02)
    }
  } catch {
    /* sin sonido, sin drama */
  }
}
