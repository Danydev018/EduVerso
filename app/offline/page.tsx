import { WifiOff } from 'lucide-react'

// ---------------------------------------------------------------------------
// Página de fallback offline — mostrada por el service worker (next-pwa,
// ver next.config.mjs → fallbacks.document) cuando el alumno navega a una
// ruta no cacheada sin conexión, en vez de una pantalla en blanco.
// ---------------------------------------------------------------------------

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 p-6">
      <div className="max-w-sm w-full text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-white shadow-sm flex items-center justify-center">
          <WifiOff className="w-8 h-8 text-gray-400" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">
          Revisa tu conexión a internet
        </h1>
        <p className="text-sm text-gray-600">
          No pudimos cargar esta página porque no hay conexión disponible.
          Cuando vuelvas a tener internet, intentá de nuevo.
        </p>
      </div>
    </div>
  )
}
