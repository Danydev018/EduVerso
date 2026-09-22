import { LogOut } from 'lucide-react'
import { logout } from '@/app/login/actions'

/**
 * Cerrar sesión, como ícono.
 *
 * Va en las barras superiores del alumno y del docente, donde el espacio se
 * lo llevan la navegación y los datos de la cuenta. El sidebar de
 * coordinación tiene su propia versión, con texto, porque ahí sí hay lugar.
 *
 * Sin texto visible el ícono necesita nombre accesible sí o sí: `aria-label`
 * para lectores de pantalla y `title` para quien no reconozca el símbolo.
 */
export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        aria-label="Cerrar sesión"
        title="Cerrar sesión"
        // size-9 (36 px) es el mínimo cómodo para tocar con el dedo sin que
        // el ícono desequilibre la barra.
        className="size-9 inline-flex items-center justify-center rounded-md border border-border text-foreground hover:bg-muted transition-colors cursor-pointer"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </form>
  )
}
