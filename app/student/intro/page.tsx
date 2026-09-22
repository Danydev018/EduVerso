import { requireRole } from '@/lib/auth'
import { IntroPlayer } from './_components/intro-player'

export const metadata = {
  title: 'La historia — EduVerso',
}

/**
 * Cinemática de apertura del panel alumno.
 *
 * Ruta propia (y no un modal sobre el dashboard) por dos motivos: se puede
 * volver a ver cuando el alumno quiera desde un enlace, y al vivir aparte no
 * suma nada al peso del dashboard, que es la pantalla que se abre todos los
 * días.
 *
 * Fuera del StudentShell: la historia ocupa la pantalla completa, sin barra
 * de navegación ni contador de XP que compitan con el relato.
 */
export default async function StudentIntroPage() {
  await requireRole('student')
  return <IntroPlayer />
}
