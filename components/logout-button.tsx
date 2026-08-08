import { logout } from '@/app/login/actions'

export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="text-sm px-3 py-1.5 rounded-md border border-white/20 text-white hover:bg-white/10 transition-colors cursor-pointer"
      >
        Cerrar sesión
      </button>
    </form>
  )
}
