/**
 * Genera los íconos PNG de la PWA a partir de un SVG.
 *
 * Correr con: `npm run iconos`
 *
 * ───────────────────────────────────────────────────────────────────────────
 * POR QUÉ CHROMIUM Y NO IMAGEMAGICK
 *
 * ImageMagick está instalado y convierte SVG, pero su renderizador interno no
 * resuelve las referencias `url(#id)`: el degradado del fondo salía negro. Se
 * usa el Chromium que ya trae Playwright, que dibuja SVG de verdad.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * POR QUÉ CUATRO ARCHIVOS Y NO DOS
 *
 * El manifiesto declaraba los mismos dos archivos con `purpose: "any
 * maskable"`, y esas dos cosas piden dibujos distintos:
 *
 *   - `maskable` → Android recorta el ícono a la forma del sistema (círculo,
 *     cuadrado redondeado…). Solo el círculo central del 80 % está a salvo, así
 *     que el dibujo tiene que ir metido hacia adentro.
 *   - `any` → se muestra entero, sin recortar. Con el margen del maskable, el
 *     dibujo se ve pequeño y perdido.
 *
 * Un solo archivo para los dos usos sale mal en uno de los dos. Por eso se
 * generan `icon-*.png` (a sangre) e `icon-maskable-*.png` (con zona segura).
 */
import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const SALIDA = path.join(process.cwd(), 'public', 'icons')

/**
 * El dibujo, en un lienzo de 512.
 *
 * La marca es el COHETE porque ya es el motivo de la aplicación: la nave del
 * alumno, el planeta, la energía estelar, la cinemática de apertura. Inventar
 * otra marca para el ícono la dejaría hablando de algo que la app no dice.
 *
 * Colores del sistema de diseño del alumno (design-system/eduverso-student):
 * indigo #4F46E5 de fondo y naranja #F97316 en la llama. Ese naranja no es
 * decoración: a 48 px un cohete indigo sobre indigo desaparece, y el punto
 * cálido es lo que hace que el ícono se distinga de un vistazo en una
 * pantalla llena de aplicaciones.
 *
 * El cohete va INCLINADO. Vertical y centrado se lee como un logotipo quieto;
 * en diagonal se lee como algo que sube, que es lo que la aplicación promete.
 *
 * @param escala 1 = a sangre; 0.78 mete el dibujo en la zona segura del maskable
 */
function svg(escala) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="campo" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#6366F1"/>
      <stop offset="55%" stop-color="#4F46E5"/>
      <stop offset="100%" stop-color="#3730A3"/>
    </linearGradient>
    <linearGradient id="casco" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#C7D2FE"/>
    </linearGradient>
    <linearGradient id="llama" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FDE047"/>
      <stop offset="45%" stop-color="#F97316"/>
      <stop offset="100%" stop-color="#DC2626"/>
    </linearGradient>
  </defs>

  <!-- Fondo a sangre SIEMPRE: en maskable, lo que se recorta debe seguir
       siendo color de marca, no transparencia. -->
  <rect width="512" height="512" fill="url(#campo)"/>

  <g transform="translate(256 256) scale(${escala}) translate(-256 -256)">
    <!-- Estrellas: pocas y asimétricas. En retícula parecerían un patrón. -->
    <circle cx="120" cy="140" r="9" fill="#FFFFFF" opacity="0.85"/>
    <circle cx="392" cy="176" r="6" fill="#FFFFFF" opacity="0.6"/>
    <circle cx="150" cy="376" r="6.5" fill="#FFFFFF" opacity="0.5"/>
    <circle cx="372" cy="360" r="8" fill="#FFFFFF" opacity="0.7"/>
    <circle cx="96"  cy="268" r="4.5" fill="#FFFFFF" opacity="0.45"/>

    <!-- El grupo sube 18 px: con la llama incluida, el dibujo va de y=64 a
         y=478 y su centro cae por debajo del centro del lienzo. -->
    <g transform="rotate(-32 256 256) translate(0 -18)">
      <!-- La llama arranca EN EL BORDE INFERIOR del casco (y=352), no por
           encima: empezándola en 322 quedaba tapada por el propio cohete y el
           ícono perdía su único punto cálido, que es lo que lo hace
           distinguible a 48 px. -->
      <!-- El borde superior de la llama curva hacia ARRIBA (y=330), no hacia
           abajo: con la curva invertida quedaba una media luna de fondo
           asomando entre el casco y el fuego. -->
      <path d="M206,348 Q256,482 306,348 Q256,330 206,348 Z" fill="url(#llama)"/>
      <path d="M228,348 Q256,434 284,348 Q256,336 228,348 Z" fill="#FEF3C7" opacity="0.92"/>

      <!-- Aletas en indigo CLARO: en el tono del fondo se perdían. -->
      <path d="M196,254 L138,344 L196,318 Z" fill="#818CF8"/>
      <path d="M316,254 L374,344 L316,318 Z" fill="#6366F1"/>

      <!-- Casco -->
      <path d="M256,64 Q330,168 330,268 Q330,308 316,330 L196,330 Q182,308 182,268 Q182,168 256,64 Z"
            fill="url(#casco)"/>
      <!-- Reflejo: la luz viene de arriba a la izquierda, igual que en todo
           el kit de ilustraciones. -->
      <path d="M256,74 Q206,164 202,268 Q202,300 210,320 L238,320 Q224,236 256,74 Z"
            fill="#FFFFFF" opacity="0.55"/>

      <circle cx="256" cy="208" r="48" fill="#1E1B4B"/>
      <circle cx="256" cy="208" r="38" fill="#60A5FA"/>
      <path d="M232,188 Q248,176 266,182 Q246,190 238,206 Z" fill="#FFFFFF" opacity="0.75"/>

      <path d="M196,330 L316,330 L306,352 L206,352 Z" fill="#E0E7FF"/>
    </g>
  </g>
</svg>`
}

async function main() {
  fs.mkdirSync(SALIDA, { recursive: true })

  const navegador = await chromium.launch()
  const pagina = await navegador.newPage()

  const trabajos = [
    { archivo: 'icon-192.png', tamano: 192, escala: 1 },
    { archivo: 'icon-512.png', tamano: 512, escala: 1 },
    // 0.78 deja el dibujo dentro del círculo central del 80 %, con un poco de
    // holgura para que el recorte más agresivo tampoco muerda el cohete.
    { archivo: 'icon-maskable-192.png', tamano: 192, escala: 0.78 },
    { archivo: 'icon-maskable-512.png', tamano: 512, escala: 0.78 },
  ]

  for (const { archivo, tamano, escala } of trabajos) {
    await pagina.setViewportSize({ width: tamano, height: tamano })
    await pagina.setContent(
      `<style>html,body{margin:0;padding:0;overflow:hidden}svg{display:block;width:${tamano}px;height:${tamano}px}</style>${svg(escala)}`,
    )
    await pagina.locator('svg').screenshot({ path: path.join(SALIDA, archivo) })
    console.log(`  ${archivo.padEnd(24)} ${tamano}×${tamano}`)
  }

  /*
    iOS IGNORA el manifiesto y busca `apple-touch-icon`. Sin este archivo, un
    iPhone que guarde la aplicación en su pantalla de inicio muestra una
    miniatura de la página en vez del ícono. 180 px es el tamaño que pide
    Safari, y va SIN zona segura: iOS no recorta, redondea.
  */
  await pagina.setViewportSize({ width: 180, height: 180 })
  await pagina.setContent(
    `<style>html,body{margin:0;padding:0;overflow:hidden}svg{display:block;width:180px;height:180px}</style>${svg(1)}`,
  )
  await pagina.locator('svg').screenshot({
    path: path.join(process.cwd(), 'public', 'apple-touch-icon.png'),
  })
  console.log('  apple-touch-icon.png     180×180')

  // El favicon del navegador: el mismo dibujo, en el tamaño que piden las
  // pestañas. Sin él, `/favicon.ico` responde 404 en cada carga.
  await pagina.setViewportSize({ width: 32, height: 32 })
  await pagina.setContent(
    `<style>html,body{margin:0;padding:0;overflow:hidden}svg{display:block;width:32px;height:32px}</style>${svg(1)}`,
  )
  await pagina.locator('svg').screenshot({ path: path.join(process.cwd(), 'public', 'favicon.png') })
  console.log('  favicon.png              32×32')

  await navegador.close()
  console.log('\nListo. Recuerda que el manifiesto los declara por separado: `any` y `maskable`.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
