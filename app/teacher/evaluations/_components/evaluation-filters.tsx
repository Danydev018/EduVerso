'use client'

// ---------------------------------------------------------------------------
// Filtros de la lista de evaluaciones (Client Component)
//
// Selects controlados que reflejan su estado en la URL (?student=&category=)
// para que el listado, filtrable por servidor, se mantenga en un enlace
// compartible y sobreviva a un refresh de página.
// ---------------------------------------------------------------------------

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

export interface FilterOption {
  id: string
  name: string
}

export interface EvaluationFiltersProps {
  students: FilterOption[]
  categories: FilterOption[]
}

export function EvaluationFilters({
  students,
  categories,
}: EvaluationFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentStudent = searchParams.get('student') ?? ''
  const currentCategory = searchParams.get('category') ?? ''
  const hasFilters = currentStudent !== '' || currentCategory !== ''

  function updateParam(key: 'student' | 'category', value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-end gap-3">
      <div className="space-y-1.5 flex-1">
        <Label htmlFor="filter_student">Estudiante</Label>
        <Select
          id="filter_student"
          value={currentStudent}
          onChange={(e) => updateParam('student', e.target.value)}
        >
          <option value="">Todos los estudiantes</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-1.5 flex-1">
        <Label htmlFor="filter_category">Categoría</Label>
        <Select
          id="filter_category"
          value={currentCategory}
          onChange={(e) => updateParam('category', e.target.value)}
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      {hasFilters && (
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(pathname)}
          className="gap-2 sm:w-auto"
        >
          <X className="w-4 h-4" />
          Limpiar filtros
        </Button>
      )}
    </div>
  )
}
