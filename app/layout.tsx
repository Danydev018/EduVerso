import type { Metadata, Viewport } from 'next'
import { Poppins, Open_Sans, Baloo_2, Comic_Neue } from 'next/font/google'
import './globals.css'
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip"

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
}

export const viewport: Viewport = {
  themeColor: '#0891B2',
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
          {children}
        </TooltipProvider>
      </body>
    </html>
  )
}
