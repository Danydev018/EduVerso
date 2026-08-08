'use client'

// ---------------------------------------------------------------------------
// Formulario reusable para crear/editar evaluaciones presenciales (Client Component)
//
// Usado tanto en la página de creación (/teacher/evaluations/new) como en la
// de edición (/teacher/evaluations/[id]/edit). Recibe las listas de estudiantes
// y categorías, y opcionalmente los datos existentes para pre-llenar el form.
// ---------------------------------------------------------------------------

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface StudentOption {
  student_id: string
  full_name: string
}

export interface CategoryOption {
  id: string
  name: string
}

export interface EvaluationData {
  id?: string
  student_id: string
  category_id: string
  score: number
  max_score: number
  evaluation_date: string
  notes?: string
}

export interface EvaluationFormProps {
  /** ID del salón del docente (requerido para insertar) */
  classroomId: string
  /** ID del docente autenticado (requerido para insertar) */
  teacherId: string
  /** Lista de estudiantes disponibles (solo los del salón del docente) */
  students: StudentOption[]
  /** Lista de categorías disponibles (solo las del grado del salón) */
  categories: CategoryOption[]
  /** Datos existentes de la evaluación (solo para edición) */
  evaluation?: EvaluationData
  /** Texto del botón de submit */
  submitLabel?: string
  /** Acción a ejecutar: 'create' o 'edit' */
  mode?: 'create' | 'edit'
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function EvaluationForm({
  students,
  categories,
  evaluation,
  classroomId,
  teacherId,
  submitLabel = 'Registrar evaluación',
  mode = 'create',
}: EvaluationFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Campos del formulario (pre-llenados si es edición)
  const [studentId, setStudentId] = useState(evaluation?.student_id ?? '')
  const [categoryId, setCategoryId] = useState(evaluation?.category_id ?? '')
  const [score, setScore] = useState(evaluation?.score?.toString() ?? '')
  const [maxScore, setMaxScore] = useState(
    evaluation?.max_score?.toString() ?? '20',
  )
  const [date, setDate] = useState(
    evaluation?.evaluation_date ??
      new Date().toISOString().slice(0, 10),
  )
  const [notes, setNotes] = useState(evaluation?.notes ?? '')

  // Validación básica
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // Validar campos requeridos
    if (!studentId) {
      setError('Seleccioná un estudiante.')
      return
    }
    if (!categoryId) {
      setError('Seleccioná una categoría de evaluación.')
      return
    }

    const scoreNum = parseFloat(score)
    const maxScoreNum = parseFloat(maxScore)

    if (isNaN(scoreNum) || scoreNum < 0) {
      setError('La nota debe ser un número positivo.')
      return
    }
    if (isNaN(maxScoreNum) || maxScoreNum <= 0) {
      setError('La nota máxima debe ser mayor a 0.')
      return
    }
    if (scoreNum > maxScoreNum) {
      setError(`La nota (${scoreNum}) no puede superar la nota máxima (${maxScoreNum}).`)
      return
    }
    if (!date) {
      setError('Seleccioná una fecha de evaluación.')
      return
    }

    setLoading(true)

    const supabase = createClient()

    if (mode === 'create') {
      const { error: insertError } = await supabase
        .from('presential_evaluations')
        .insert({
          student_id: studentId,
          category_id: categoryId,
          classroom_id: classroomId,
          teacher_id: teacherId,
          score: scoreNum,
          max_score: maxScoreNum,
          evaluation_date: date,
          notes: notes.trim() || null,
        })

      if (insertError) {
        setError(insertError.message)
        setLoading(false)
        return
      }
    } else {
      // Modo edición
      const { error: updateError } = await supabase
        .from('presential_evaluations')
        .update({
          student_id: studentId,
          category_id: categoryId,
          score: scoreNum,
          max_score: maxScoreNum,
          evaluation_date: date,
          notes: notes.trim() || null,
        })
        .eq('id', evaluation?.id ?? '')

      if (updateError) {
        setError(updateError.message)
        setLoading(false)
        return
      }
    }

    // Redirigir a la lista de evaluaciones
    router.push('/teacher/evaluations')
    router.refresh()
  }

  // --- Vista ---
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Mensaje de error */}
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Select de estudiante */}
      <div className="space-y-1.5">
        <Label htmlFor="student_id">Estudiante</Label>
        {students.length === 0 ? (
          <p className="text-sm text-gray-400 py-2">
            No hay estudiantes matriculados en tu salón.
          </p>
        ) : (
          <Select
            id="student_id"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            required
          >
            <option value="" disabled>
              Seleccioná un estudiante
            </option>
            {students.map((s) => (
              <option key={s.student_id} value={s.student_id}>
                {s.full_name}
              </option>
            ))}
          </Select>
        )}
      </div>

      {/* Select de categoría */}
      <div className="space-y-1.5">
        <Label htmlFor="category_id">Categoría de evaluación</Label>
        {categories.length === 0 ? (
          <p className="text-sm text-gray-400 py-2">
            No hay categorías configuradas para tu grado. Contactá a la
            coordinación.
          </p>
        ) : (
          <Select
            id="category_id"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
          >
            <option value="" disabled>
              Seleccioná una categoría
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        )}
      </div>

      {/* Nota y nota máxima en la misma fila */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="score">Nota</Label>
          <Input
            id="score"
            type="number"
            step="0.01"
            min="0"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            placeholder="Ej: 15"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="max_score">Nota máxima</Label>
          <Input
            id="max_score"
            type="number"
            step="0.01"
            min="0.01"
            value={maxScore}
            onChange={(e) => setMaxScore(e.target.value)}
            placeholder="20"
            required
          />
        </div>
      </div>

      {/* Fecha */}
      <div className="space-y-1.5">
        <Label htmlFor="evaluation_date">Fecha de evaluación</Label>
        <Input
          id="evaluation_date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      {/* Notas / observaciones */}
      <div className="space-y-1.5">
        <Label htmlFor="notes">Observaciones</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Observaciones sobre la evaluación (opcional)"
          rows={3}
        />
      </div>

      {/* Botones */}
      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {submitLabel}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/teacher/evaluations">Cancelar</Link>
        </Button>
      </div>
    </form>
  )
}
