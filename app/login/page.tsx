import { login } from './actions'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  const errorMessage = mapError(searchParams.error)

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-muted">
      <div className="w-full max-w-md bg-white rounded-lg shadow-sm border p-6">
        <header className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-foreground">EduPlay</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ingresa con tus credenciales
          </p>
        </header>

        <form action={login} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Correo electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {errorMessage && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground py-2 rounded-md font-medium hover:bg-primary/90 transition-colors"
          >
            Ingresar
          </button>
        </form>
      </div>
    </main>
  )
}

function mapError(code: string | undefined): string | null {
  switch (code) {
    case 'invalid':
      return 'Correo o contraseña incorrectos.'
    case 'no_profile':
      return 'Tu cuenta no tiene perfil asignado. Contacta a coordinación.'
    case 'inactive':
      return 'Tu cuenta está desactivada. Contacta a coordinación.'
    default:
      return null
  }
}
