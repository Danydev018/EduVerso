import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Controles de paginación.
 *
 * Server Component a propósito: son enlaces `<Link>` normales que solo
 * cambian `?page=`, así que no agregan JavaScript al bundle ni requieren
 * estado en el cliente. En una máquina modesta esto se nota.
 *
 * No renderiza nada cuando hay una sola página, así que puede colocarse
 * debajo de cualquier tabla sin ensuciar los listados cortos.
 */
export function Pagination({
  page,
  totalPages,
  totalRows,
  basePath,
  searchParams,
  itemLabel = 'registros',
}: {
  page: number
  totalPages: number
  totalRows: number
  /** Ruta de la página, ej. "/coordinator/students". */
  basePath: string
  /** searchParams actuales, para conservar los filtros al cambiar de página. */
  searchParams: Record<string, string | undefined>
  /** Palabra en plural para el contador ("alumnos", "evaluaciones"). */
  itemLabel?: string
}) {
  if (totalPages <= 1) return null

  const hrefFor = (target: number) => {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(searchParams)) {
      if (value && key !== 'page') params.set(key, value)
    }
    if (target > 1) params.set('page', String(target))
    const qs = params.toString()
    return qs ? `${basePath}?${qs}` : basePath
  }

  return (
    <nav
      className="flex items-center justify-between gap-3 px-1 pt-2"
      aria-label="Paginación"
    >
      <p className="text-xs text-muted-foreground">
        Página {page} de {totalPages} · {totalRows} {itemLabel}
      </p>

      <div className="flex items-center gap-1">
        <PageLink
          href={hrefFor(page - 1)}
          disabled={page <= 1}
          label="Página anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </PageLink>

        {buildPageList(page, totalPages).map((entry, i) =>
          entry === 'gap' ? (
            <span key={`gap-${i}`} className="px-1 text-xs text-muted-foreground">
              ···
            </span>
          ) : (
            <Link
              key={entry}
              href={hrefFor(entry)}
              aria-current={entry === page ? 'page' : undefined}
              className={cn(
                'min-w-8 h-8 px-2 rounded-md text-sm flex items-center justify-center transition-colors',
                entry === page
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {entry}
            </Link>
          ),
        )}

        <PageLink
          href={hrefFor(page + 1)}
          disabled={page >= totalPages}
          label="Página siguiente"
        >
          <ChevronRight className="w-4 h-4" />
        </PageLink>
      </div>
    </nav>
  )
}

function PageLink({
  href,
  disabled,
  label,
  children,
}: {
  href: string
  disabled: boolean
  label: string
  children: React.ReactNode
}) {
  // Deshabilitado se renderiza como <span>, no como <Link> inerte: un enlace
  // que no lleva a ningún lado confunde a la navegación por teclado.
  if (disabled) {
    return (
      <span
        aria-disabled="true"
        className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground/40"
      >
        {children}
      </span>
    )
  }

  return (
    <Link
      href={href}
      aria-label={label}
      className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
    >
      {children}
    </Link>
  )
}

/**
 * Ventana de números de página con elipsis, para que la barra no crezca
 * indefinidamente: 1 … 4 [5] 6 … 20
 */
function buildPageList(page: number, totalPages: number): Array<number | 'gap'> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const pages = new Set<number>([1, totalPages, page])
  if (page - 1 > 1) pages.add(page - 1)
  if (page + 1 < totalPages) pages.add(page + 1)

  const sorted = Array.from(pages).sort((a, b) => a - b)
  const result: Array<number | 'gap'> = []

  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('gap')
    result.push(sorted[i])
  }

  return result
}
