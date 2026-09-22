/**
 * Contenedores con entrada escalonada para el dashboard de coordinación.
 *
 * Antes usaban framer-motion (`staggerChildren`) — ~50 kB de JS y trabajo de
 * layout en el hilo principal para un fade-in. Ahora son Server Components
 * y el escalonado se hace con `animation-delay` en CSS (ver `.admin-stagger`
 * en globals.css), que corre en el compositor y respeta
 * `prefers-reduced-motion`.
 */
export function AnimatedContainer({ children }: { children: React.ReactNode }) {
  return <div className="space-y-6">{children}</div>
}

export function AnimatedItem({ children }: { children: React.ReactNode }) {
  return <div className="admin-stagger">{children}</div>
}

export function AnimatedGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{children}</div>
}
