'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ArrowRight, ArrowLeft, Rocket } from 'lucide-react'
import {
  SceneCrash,
  SceneStranded,
  SceneCompanion,
  SceneZones,
  SceneRepair,
  SceneLaunch,
} from './scenes'
import { markIntroSeen } from '../seen-storage'

/**
 * Reproductor de la cinemática de apertura.
 *
 * Avanza por escenas con un click (no con temporizador): un niño que lee
 * despacio no debería pelear con una animación que se le adelanta, y en un
 * teléfono lento un autoplay se desincroniza del texto. El botón dice
 * siempre qué pasa al tocarlo.
 */

const SCENES = [
  {
    art: SceneCrash,
    title: 'Algo salió mal',
    body: 'Tu nave se averió y caíste en un planeta que nadie había explorado. Estás muy lejos de casa.',
    cta: 'Seguir',
  },
  {
    art: SceneStranded,
    title: 'Estás varado',
    body: 'La nave no puede despegar así. Le faltan piezas y no hay repuestos en kilómetros a la redonda.',
    cta: '¿Y ese ruido?',
  },
  {
    // El giro de la historia: el alumno pasa de estar solo a tener un
    // compañero. Se lo presenta con el nombre y los colores exactos de la
    // burbuja del agente para que después la reconozca en las misiones.
    art: SceneCompanion,
    title: 'No estás solo',
    body: 'Profe Bot viajaba contigo. Salió abollado del choque, pero funciona. Te va a acompañar en cada misión: pídele una pista cuando algo se ponga difícil, y cuando sientas que no vas a poder, va a estar ahí para recordarte que sí.',
    cta: 'Gracias, amigo',
  },
  {
    art: SceneZones,
    title: 'El planeta tiene zonas',
    body: 'Cada zona guarda un tipo de conocimiento: números, palabras, seres vivos, el mundo. Ahí están las respuestas que necesitas.',
    cta: '¿Y cómo me sirve?',
  },
  {
    art: SceneRepair,
    title: 'Cada misión repara la nave',
    body: 'Resuelves una misión, recuperas energía estelar y una pieza vuelve a su lugar. Aprender es lo que arregla la nave.',
    cta: '¿Y después?',
  },
  {
    art: SceneLaunch,
    title: 'Hasta llegar a casa',
    body: 'Con la nave reparada saltas al siguiente planeta, cargas provisiones y sigues el viaje. Profe Bot va contigo. Tu grado es tu planeta actual.',
    cta: 'Empezar mi viaje',
  },
] as const

export function IntroPlayer() {
  const [index, setIndex] = useState(0)
  const scene = SCENES[index]
  const Art = scene.art
  const isLast = index === SCENES.length - 1

  function next() {
    if (isLast) return
    setIndex((i) => i + 1)
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#1E1B4B]">
      {/* Saltar: siempre visible. Un alumno que ya vio la historia no debería
          tener que pasar cinco pantallas para llegar a sus misiones. */}
      <div className="flex justify-end p-3">
        <Link
          href="/student/dashboard"
          onClick={markIntroSeen}
          className="text-sm text-indigo-300 hover:text-white transition-colors px-3 py-1.5 rounded-full"
        >
          Saltar
        </Link>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-6">
        <div className="w-full max-w-md">
          <div className="rounded-3xl overflow-hidden border-2 border-indigo-500/30 shadow-lg shadow-indigo-950/50">
            {/* key fuerza el remonte al cambiar de escena: sin eso las
                animaciones de entrada no se reinician. */}
            <Art key={index} />
          </div>

          <div key={`txt-${index}`} className="mt-6 text-center">
            <h1 className="cine-rise cine-rise-1 font-heading text-2xl font-bold text-white">
              {scene.title}
            </h1>
            <p className="cine-rise cine-rise-2 text-indigo-200 mt-2 leading-relaxed">
              {scene.body}
            </p>

            <div className="cine-rise cine-rise-3 mt-6">
              {isLast ? (
                <Button
                  asChild
                  className="clay-btn h-12 px-7 rounded-2xl text-base bg-orange-500 hover:bg-orange-500 text-white"
                  style={{ ['--clay-shadow' as string]: '#C2410C' }}
                >
                  <Link href="/student/dashboard" onClick={markIntroSeen}>
                    <Rocket className="w-4 h-4 mr-1.5" />
                    {scene.cta}
                  </Link>
                </Button>
              ) : (
                <Button
                  onClick={next}
                  className="clay-btn h-12 px-7 rounded-2xl text-base bg-indigo-500 hover:bg-indigo-500 text-white"
                  style={{ ['--clay-shadow' as string]: '#312E81' }}
                >
                  {scene.cta}
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              )}
            </div>
          </div>

          {/* Progreso: puntos clickeables para volver a una escena anterior. */}
          <div className="mt-7 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
              aria-label="Escena anterior"
              className="text-indigo-400 disabled:opacity-25 hover:text-white transition-colors p-1"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              {SCENES.map((s, i) => (
                <button
                  key={s.title}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Escena ${i + 1}: ${s.title}`}
                  aria-current={i === index ? 'step' : undefined}
                  className={cn(
                    'h-2 rounded-full transition-all',
                    i === index ? 'w-6 bg-orange-400' : 'w-2 bg-indigo-600 hover:bg-indigo-400',
                  )}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={next}
              disabled={isLast}
              aria-label="Escena siguiente"
              className="text-indigo-400 disabled:opacity-25 hover:text-white transition-colors p-1"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
