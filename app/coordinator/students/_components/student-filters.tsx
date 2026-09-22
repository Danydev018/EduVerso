'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import { Input } from '@/components/ui/input'

type Grade = { id: number; name: string }

export function StudentFilters({
  grades,
  sections,
}: {
  grades: Grade[]
  sections: string[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      router.replace(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams],
  )

  return (
    <div className="flex flex-wrap gap-3 bg-card p-4 rounded-lg border border-border">
      <Input
        placeholder="Buscar por nombre..."
        defaultValue={searchParams.get('q') ?? ''}
        onChange={(e) => updateParam('q', e.target.value)}
        className="w-52"
      />
      <select
        className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        defaultValue={searchParams.get('grade') ?? ''}
        onChange={(e) => updateParam('grade', e.target.value)}
      >
        <option value="">Todos los grados</option>
        {grades.map((g) => (
          <option key={g.id} value={String(g.id)}>
            {g.name}
          </option>
        ))}
      </select>
      <select
        className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        defaultValue={searchParams.get('section') ?? ''}
        onChange={(e) => updateParam('section', e.target.value)}
      >
        <option value="">Todas las secciones</option>
        {sections.map((s) => (
          <option key={s} value={s}>
            Sección {s}
          </option>
        ))}
      </select>
      <select
        className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        defaultValue={searchParams.get('status') ?? ''}
        onChange={(e) => updateParam('status', e.target.value)}
      >
        <option value="">Todos los estados</option>
        <option value="active">Activos</option>
        <option value="inactive">Inactivos</option>
        <option value="withdrawn">Retirados</option>
      </select>
    </div>
  )
}
