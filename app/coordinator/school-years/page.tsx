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
        <h1 className="text-2xl font-bold text-gray-900">Año Escolar</h1>
        <p className="text-sm text-gray-500">Gestiona los períodos escolares de la institución</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <h2 className="font-semibold text-gray-700">Años registrados</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Inicio</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Fin</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(years ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-400">
                  No hay años escolares registrados
                </td>
              </tr>
            )}
            {(years ?? []).map((year) => (
              <tr key={year.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{year.name}</td>
                <td className="px-4 py-3 text-gray-600">
                  {new Date(year.start_date).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-4 py-3 text-gray-600">
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

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-700 mb-4">Crear nuevo año escolar</h2>
        <NewYearForm />
      </div>
    </div>
  )
}
