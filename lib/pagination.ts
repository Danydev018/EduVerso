/**
 * Utilidades de paginación del lado del servidor.
 *
 * Se pagina en Postgres con `.range()`, no en memoria: traer el padrón
 * completo para mostrar 15 filas desperdicia ancho de banda y memoria del
 * navegador, que es justo lo que se siente lento en las máquinas de la
 * institución.
 */

/** Filas por página. 15 entra sin scroll en una pantalla de 768 px de alto. */
export const PAGE_SIZE = 15

export interface PageRange {
  /** Página actual, 1-indexada y ya saneada. */
  page: number
  /** Índice inicial para `.range()` (0-indexado). */
  from: number
  /** Índice final para `.range()` (inclusivo). */
  to: number
}

/**
 * Traduce el parámetro `?page=` de la URL a un rango para PostgREST.
 * Cualquier valor inválido (0, negativo, texto, ausente) cae a la página 1.
 */
export function getPageRange(pageParam: string | undefined, pageSize = PAGE_SIZE): PageRange {
  const parsed = Number.parseInt(pageParam ?? '1', 10)
  const page = Number.isFinite(parsed) && parsed > 0 ? parsed : 1
  const from = (page - 1) * pageSize
  return { page, from, to: from + pageSize - 1 }
}

/** Cantidad total de páginas para un total de filas dado (mínimo 1). */
export function getTotalPages(totalRows: number | null, pageSize = PAGE_SIZE): number {
  return Math.max(1, Math.ceil((totalRows ?? 0) / pageSize))
}
