import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  CACHE_TAGS,
  getGrades,
  getEvaluationCategories,
} from '@/lib/reference-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Trash2 } from 'lucide-react'

// ---------------------------------------------------------------------------
// Tipos internos
// ---------------------------------------------------------------------------

interface GradeRow {
  id: number
  name: string
}

interface CategoryRow {
  id: string
  grade_id: number
  name: string
}

// ---------------------------------------------------------------------------
// Acciones del servidor (server actions)
// ---------------------------------------------------------------------------

async function createCategory(formData: FormData) {
  'use server'

  await requireRole('coordinator')

  const admin = createAdminClient()
  const gradeId = parseInt(formData.get('grade_id') as string)
  const name = (formData.get('name') as string)?.trim()

  if (!gradeId || isNaN(gradeId)) {
    return
  }

  if (!name) {
    return
  }

  await admin.from('evaluation_categories').insert({
    grade_id: gradeId,
    name,
  })

  // Las categorías están cacheadas globalmente (lib/reference-data.ts) y las
  // consume el formulario de evaluaciones del docente, no solo esta página.
  revalidateTag(CACHE_TAGS.evaluationCategories)
  revalidatePath('/coordinator/evaluation-categories')
  redirect('/coordinator/evaluation-categories')
}

async function deleteCategory(formData: FormData) {
  'use server'

  await requireRole('coordinator')

  const admin = createAdminClient()
  const categoryId = formData.get('category_id') as string

  if (!categoryId) return

  // Eliminar la categoría (las evaluaciones que la referencian quedarán con
  // category_id = null; se podría mejorar con ON DELETE SET NULL pero
  // la FK ya está definida sin acción restrictiva)
  await admin
    .from('evaluation_categories')
    .delete()
    .eq('id', categoryId)

  // Las categorías están cacheadas globalmente (lib/reference-data.ts) y las
  // consume el formulario de evaluaciones del docente, no solo esta página.
  revalidateTag(CACHE_TAGS.evaluationCategories)
  revalidatePath('/coordinator/evaluation-categories')
  redirect('/coordinator/evaluation-categories')
}

// ---------------------------------------------------------------------------
// Página de gestión de categorías de evaluación (Server Component)
// ---------------------------------------------------------------------------

export default async function EvaluationCategoriesPage() {
  await requireRole('coordinator')

  // --- 1. Obtener grados y categorías en paralelo ---
  const [gradesData, categoriesData] = await Promise.all([
    getGrades(),
    getEvaluationCategories(),
  ])

  const grades = gradesData as GradeRow[]
  const categories = categoriesData as CategoryRow[]

  // --- 2. Agrupar categorías por grado ---
  const gradeMap = new Map<number, string>()
  for (const g of grades) {
    gradeMap.set(g.id, g.name)
  }

  const categoriesByGrade = new Map<number, CategoryRow[]>()
  for (const c of categories) {
    const list = categoriesByGrade.get(c.grade_id) ?? []
    list.push(c)
    categoriesByGrade.set(c.grade_id, list)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Categorías de Evaluación
        </h1>
        <p className="text-[hsl(var(--muted-foreground))] mt-1">
          Administrá las categorías disponibles para las evaluaciones
          presenciales de cada grado.
        </p>
      </div>

      {/* Lista de categorías agrupadas por grado */}
      {grades.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-8 text-center">
            <p className="text-[hsl(var(--muted-foreground))]">
              No hay grados configurados. Ejecutá las migraciones primero.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {grades.map((grade) => {
            const gradeCategories = categoriesByGrade.get(grade.id) ?? []

            return (
              <Card key={grade.id} className="glass-card">
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    {grade.name}
                    <Badge variant="secondary">
                      {gradeCategories.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {gradeCategories.length === 0 ? (
                    <p className="text-sm text-[hsl(var(--muted-foreground))] py-2 text-center">
                      Sin categorías
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {gradeCategories.map((cat) => (
                        <li
                          key={cat.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-foreground">{cat.name}</span>
                          <form action={deleteCategory}>
                            <input
                              type="hidden"
                              name="category_id"
                              value={cat.id}
                            />
                            <Button
                              type="submit"
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              title={`Eliminar ${cat.name}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </form>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Formulario para crear nueva categoría */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base">Crear nueva categoría</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createCategory} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Select de grado */}
              <div className="space-y-1.5">
                <Label htmlFor="grade_id">Grado</Label>
                <Select id="grade_id" name="grade_id" required>
                  <option value="" disabled>
                    Selecciona un grado
                  </option>
                  {grades.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Nombre de la categoría */}
              <div className="space-y-1.5">
                <Label htmlFor="name">Nombre de la categoría</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Ej: Educación Física"
                  required
                />
              </div>
            </div>

            <Button type="submit">Crear categoría</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
