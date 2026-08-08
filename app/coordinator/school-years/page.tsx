import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { NewYearForm } from './_components/new-year-form'
import { ActivateYearButton } from './_components/activate-year-button'

export default async function SchoolYearsPage() {
  await requireRole('coordinator')
  const supabase = createClient()

  const { data: years } = await supabase
    .from('school_years')
    .select('id, name, start_date, end_date, is_current')
    .order('start_date', { ascending: false })

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Año Escolar</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Gestiona los períodos escolares de la institución</p>
      </div>

      <div className="glass-card overflow-x-auto">
        <div className="px-4 py-3 border-b border-[hsl(var(--border))]">
          <h2 className="font-semibold text-[hsl(var(--foreground))]">Años registrados</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[hsl(var(--border))]">
              <th className="text-left px-4 py-3 font-medium text-[hsl(var(--muted-foreground))]">Nombre</th>
              <th className="text-left px-4 py-3 font-medium text-[hsl(var(--muted-foreground))]">Inicio</th>
              <th className="text-left px-4 py-3 font-medium text-[hsl(var(--muted-foreground))]">Fin</th>
              <th className="text-left px-4 py-3 font-medium text-[hsl(var(--muted-foreground))]">Estado</th>
              <th className="text-right px-4 py-3 font-medium text-[hsl(var(--muted-foreground))]">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[hsl(var(--border))]">
            {(years ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-[hsl(var(--muted-foreground))]">
                  No hay años escolares registrados
                </td>
              </tr>
            )}
            {(years ?? []).map((year) => (
              <tr key={year.id} className="hover:bg-[hsl(var(--primary)/0.03)] transition-colors">
                <td className="px-4 py-3 font-medium text-[hsl(var(--foreground))]">{year.name}</td>
                <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">
                  {new Date(year.start_date).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">
                  {new Date(year.end_date).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-4 py-3">
                  {year.is_current ? (
                    <Badge variant="success">Activo</Badge>
                  ) : (
                    <Badge variant="secondary">Inactivo</Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {!year.is_current && (
                    <ActivateYearButton id={year.id} name={year.name} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="glass-card p-6">
        <h2 className="font-semibold text-[hsl(var(--foreground))] mb-4">Crear nuevo año escolar</h2>
        <NewYearForm />
      </div>
    </div>
  )
}
