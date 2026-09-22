'use client'

import { useEffect, useState } from 'react'

/**
 * Anillo de reparación de la nave: un aro SVG que se llena una sola vez al
 * montar (de 0 al valor real), como si vieras los sistemas de la nave
 * encendiéndose. El retraso de un frame es necesario para que el navegador
 * pinte el estado inicial (offset completo) antes de animar al valor final;
 * sin eso la transición de CSS no tiene "desde dónde" animar.
 */
export function RepairRing({
  pct,
  size = 128,
  strokeWidth = 10,
  children,
}: {
  pct: number
  size?: number
  strokeWidth?: number
  children?: React.ReactNode
}) {
  const [filled, setFilled] = useState(false)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setFilled(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - (filled ? pct : 0) / 100)

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--accent))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="repair-ring-fill"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  )
}
