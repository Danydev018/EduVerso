'use client'

import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'

// ---------------------------------------------------------------------------
// Aviso de "sin conexión" para cuando el alumno pierde internet DURANTE una
// sesión ya cargada (no al navegar — eso lo cubre el fallback offline de
// next-pwa, ver app/offline/page.tsx). Sin esto, una acción que dependa de
// red (completar un paso, preguntarle al agente) falla en silencio o con un
// error técnico; el banner deja claro que el problema es la conexión.
// ---------------------------------------------------------------------------

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    setIsOffline(!navigator.onLine)

    const handleOffline = () => setIsOffline(true)
    const handleOnline = () => setIsOffline(false)

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)
    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  if (!isOffline) return null

  return (
    <div className="fixed top-0 inset-x-0 z-50 bg-amber-500 text-white text-sm font-medium py-2 px-4 flex items-center justify-center gap-2">
      <WifiOff className="w-4 h-4 flex-shrink-0" />
      Sin conexión a internet — algunas acciones no van a funcionar hasta que vuelva.
    </div>
  )
}
