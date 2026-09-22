'use client'

// ---------------------------------------------------------------------------
// Formulario reusable para crear/editar evaluaciones presenciales (Client Component)
//
// Usado tanto en la página de creación (/teacher/evaluations/new) como en la
// de edición (/teacher/evaluations/[id]/edit). Recibe las listas de estudiantes
// y categorías, y opcionalmente los datos existentes para pre-llenar el form.
//
// El guardado ocurre en un Server Action (../actions.ts). Antes se escribía
// directo con el SDK de Supabase desde el navegador, lo que metía ~75 kB de
// JS en estas dos páginas. Además los campos ahora son no controlados
// (defaultValue + FormData): no hay un re-render de React por cada tecla,
// que es justo lo que se siente lento en una máquina modesta.
// ---------------------------------------------------------------------------

import Link from 'next/link'
import { useFormState, useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { saveEvaluation, type EvaluationState } from '../actions'

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

const INITIAL: EvaluationState = { error: null }

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
  const [state, action] = useFormState(saveEvaluation, INITIAL)

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="classroom_id" value={classroomId} />
      <input type="hidden" name="teacher_id" value={teacherId} />
      {evaluation?.id && (
        <input type="hidden" name="evaluation_id" value={evaluation.id} />
      )}

      {/* Mensaje de error */}
      {state.error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {/* Select de estudiante */}
      <div className="space-y-1.5">
        <Label htmlFor="student_id">Estudiante</Label>
        {students.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            No hay estudiantes matriculados en tu salón.
          </p>
        ) : (
          <Select
            id="student_id"
            name="student_id"
            defaultValue={evaluation?.student_id ?? ''}
            required
          >
            <option value="" disabled>
              Selecciona un estudiante
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
          <p className="text-sm text-muted-foreground py-2">
            No hay categorías configuradas para tu grado. Contacta a la
            coordinación.
          </p>
        ) : (
          <Select
            id="category_id"
            name="category_id"
            defaultValue={evaluation?.category_id ?? ''}
            required
          >
            <option value="" disabled>
              Selecciona una categoría
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
            name="score"
            type="number"
            step="0.01"
            min="0"
            defaultValue={evaluation?.score?.toString() ?? ''}
            placeholder="Ej: 15"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="max_score">Nota máxima</Label>
          <Input
            id="max_score"
            name="max_score"
            type="number"
            step="0.01"
            min="0.01"
            defaultValue={evaluation?.max_score?.toString() ?? '20'}
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
          name="evaluation_date"
          type="date"
          defaultValue={
            evaluation?.evaluation_date ?? new Date().toISOString().slice(0, 10)
          }
          required
        />
      </div>

      {/* Notas / observaciones */}
      <div className="space-y-1.5">
        <Label htmlFor="notes">Observaciones</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={evaluation?.notes ?? ''}
          placeholder="Observaciones sobre la evaluación (opcional)"
          rows={3}
        />
      </div>

      {/* Botones */}
      <SubmitRow submitLabel={submitLabel} />
    </form>
  )
}

/** Subcomponente: useFormStatus solo funciona dentro del <form>. */
function SubmitRow({ submitLabel }: { submitLabel: string }) {
  const { pending } = useFormStatus()

  return (
    <div className="flex gap-3 pt-2">
      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {submitLabel}
      </Button>
      <Button type="button" variant="outline" asChild>
        <Link href="/teacher/evaluations">Cancelar</Link>
      </Button>
    </div>
  )
}
