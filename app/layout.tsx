import type { Metadata, Viewport } from 'next'
import { Poppins, Open_Sans, Baloo_2, Comic_Neue } from 'next/font/google'
import './globals.css'
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip"
import { OfflineBanner } from "@/components/offline-banner"

/* Admin theme — Poppins (headings) + Open Sans (body) */
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-heading',
  display: 'swap',
})

const openSans = Open_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
})

/* Student theme — Baloo 2 (headings) + Comic Neue (body) */
const baloo2 = Baloo_2({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
})

const comicNeue = Comic_Neue({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  variable: '--font-fun',
  display: 'swap',
})

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
  // Se declaran aquí y no con el archivo `app/icon.png` porque los genera
  // `npm run iconos` dentro de `public/`, y así los dos sitios que los
  // nombran —este y el manifiesto— apuntan a las mismas rutas.
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png', sizes: '32x32' },
      { url: '/icons/icon-192.png', type: 'image/png', sizes: '192x192' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
}

export const viewport: Viewport = {
  // #4F46E5 es el primario del sistema de diseño del alumno
  // (design-system/eduverso-student). Antes acá decía #0891B2 y el manifiesto
  // #2563eb: tres colores de marca distintos en tres archivos, ninguno el
  // real. Este es el que pinta la barra de estado en Android.
  themeColor: '#4F46E5',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={cn(poppins.variable, openSans.variable, baloo2.variable, comicNeue.variable, "font-sans")}
    >
      <body>
        <TooltipProvider>
          <OfflineBanner />
          {children}
        </TooltipProvider>
      </body>
    </html>
  )
}
