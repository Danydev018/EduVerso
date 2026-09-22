/**
 * Marca de "ya vio la cinemática".
 *
 * Se guarda en localStorage y no en la base a propósito: es una preferencia
 * de presentación, no un dato académico. Guardarla en Postgres implicaría una
 * migración, una política RLS y una escritura extra en cada carga del
 * dashboard, para algo que si se pierde solo hace que el alumno vuelva a ver
 * una historia de cinco pantallas con un botón de "Saltar" visible.
 *
 * Todos los accesos van envueltos en try/catch: en modo privado o con el
 * almacenamiento bloqueado, leer o escribir lanza excepción.
 */

const KEY = 'eduverso:intro-visto'

export function hasSeenIntro(): boolean {
  try {
    return window.localStorage.getItem(KEY) === '1'
  } catch {
    // Sin almacenamiento: se asume que ya la vio, para no atrapar al alumno
    // en una redirección a la cinemática en cada carga del dashboard.
    return true
  }
}

export function markIntroSeen(): void {
  try {
    window.localStorage.setItem(KEY, '1')
  } catch {
    // Ignorar: la cinemática ya se mostró en esta sesión de todos modos.
  }
}
