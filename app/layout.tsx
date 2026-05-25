import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'EduPlay — Aprende Jugando',
  description: 'Sistema de aprendizaje gamificado para educación primaria',
  manifest: '/manifest.json',
  applicationName: 'EduPlay',
  appleWebApp: {
    capable: true,
    title: 'EduPlay',
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
