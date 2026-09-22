'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { hasSeenIntro } from '../intro/seen-storage'

/**
 * Envía al alumno a la cinemática la primera vez que abre su panel.
 *
 * Vive en el cliente porque la marca está en localStorage, que el servidor no
 * puede leer. No renderiza nada: el dashboard se pinta normal y, si nunca vio
 * la historia, la redirección ocurre en el mismo frame del montaje.
 *
 * `router.replace` en vez de `push` para que el botón "atrás" del teléfono no
 * lo devuelva al dashboard y lo deje rebotando entre las dos pantallas.
 */
export function IntroGate() {
  const router = useRouter()

  useEffect(() => {
    if (!hasSeenIntro()) {
      router.replace('/student/intro')
    }
  }, [router])

  return null
}
