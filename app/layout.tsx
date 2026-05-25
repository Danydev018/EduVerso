import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'EduVerso — Aprende Jugando',
  description: 'Sistema de aprendizaje gamificado para educación primaria',
  manifest: '/manifest.json',
  applicationName: 'EduVerso',
  appleWebApp: {
    capable: true,
    title: 'EduVerso',
    statusBarStyle: 'default',
  },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
