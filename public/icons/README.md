# Íconos de la PWA

**No los edites a mano.** Los genera `npm run iconos` desde el SVG que vive en
`scripts/generar-iconos.mjs`. Para cambiar el dibujo, cambia ese archivo y
vuelve a correr el comando.

## Qué se genera

| Archivo | Tamaño | Para qué |
|---|---|---|
| `icon-192.png`, `icon-512.png` | 192, 512 | `purpose: any` — se muestran enteros |
| `icon-maskable-192.png`, `icon-maskable-512.png` | 192, 512 | `purpose: maskable` — Android los recorta |
| `../apple-touch-icon.png` | 180 | iOS, que ignora el manifiesto |
| `../favicon.png` | 32 | pestaña del navegador |

## Por qué hay dos juegos y no uno

El manifiesto declaraba antes los mismos dos archivos como `"any maskable"`, y
esas dos cosas piden dibujos distintos:

- **maskable**: Android recorta el ícono a la forma del sistema —círculo,
  cuadrado redondeado, gota—. Solo está a salvo el círculo central del 80 %, así
  que el dibujo va metido hacia adentro (escala 0,78).
- **any**: se muestra completo, sin recortar. Con el margen del maskable, el
  dibujo se vería pequeño y perdido en su propio cuadro.

Un solo archivo sirviendo para los dos usos sale mal en uno de los dos.

## Por qué el fondo va siempre a sangre

Lo que Android recorta del maskable tiene que seguir siendo color de marca. Si
el fondo tuviera transparencia, el recorte dejaría bordes vacíos.

## Sobre el dibujo

La marca es el cohete porque **ya es el motivo de la aplicación**: la nave del
alumno, el planeta, la energía estelar, la cinemática de apertura. Los colores
salen de `design-system/eduverso-student`: indigo `#4F46E5` de fondo, naranja
`#F97316` en la llama.

Ese naranja no es adorno. A 48 px —el tamaño real en una pantalla de inicio— un
cohete indigo sobre fondo indigo desaparece; el punto cálido es lo que hace que
el ícono se distinga entre las demás aplicaciones del teléfono.

El cohete va inclinado: vertical y centrado se lee como un logotipo quieto.
