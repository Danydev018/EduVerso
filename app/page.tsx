import { redirect } from 'next/navigation'

// El middleware se encarga de redirigir a /login o al dashboard correspondiente.
// Si por algún motivo llega aquí, enviar a /login.
export default function RootPage() {
  redirect('/login')
}
