/**
 * Fondo decorativo de los paneles admin (coordinación y docente).
 *
 * Server Component puro y estático a propósito. La versión anterior era un
 * Client Component con framer-motion que mantenía 22 animaciones infinitas
 * simultáneas (2 "blobs" + 20 partículas) y, lo más caro, animaba `scale` y
 * `x/y` sobre dos elementos gigantes con `blur-[120px]` / `blur-[100px]`:
 * animar un elemento con blur de ese radio obliga al navegador a rehacer el
 * desenfoque en cada frame, lo que satura la GPU/CPU de una máquina modesta
 * y deja el panel entero con scroll y clicks lentos.
 *
 * Acá el mismo efecto visual se logra con dos gradientes radiales estáticos
 * pintados por el compositor una sola vez: 0 kB de JS y 0 trabajo por frame.
 */
export default function BackgroundEffects() {
  return (
    <div
      className="fixed inset-0 -z-10 pointer-events-none bg-dot-pattern opacity-90"
      aria-hidden="true"
      style={{
        backgroundImage: [
          'radial-gradient(60% 50% at 12% 0%, hsl(var(--primary) / 0.10), transparent 70%)',
          'radial-gradient(55% 45% at 88% 100%, hsl(217 91% 60% / 0.07), transparent 70%)',
        ].join(','),
      }}
    />
  )
}
