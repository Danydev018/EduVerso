import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // text-foreground explícito (no solo heredado): body fija su propio
        // `color` a partir del --foreground de :root (siempre el tema
        // "admin", porque <body> nunca tiene data-theme). Ese valor ya
        // resuelto es lo que se hereda hacia abajo, sin reevaluar la
        // variable en el punto de uso — así que en cualquier Input dentro
        // de data-theme="student" el texto tipiado heredaba el color casi
        // blanco del admin en vez del oscuro correcto del alumno. Una clase
        // explícita fuerza la reevaluación local de --foreground.
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base text-foreground transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
