import * as React from 'react'
import { cn } from '@/lib/utils'

const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    // text-foreground explícito por el mismo motivo que en input.tsx: sin
    // esto, un Label bajo data-theme="student" heredaría el color congelado
    // del tema admin en vez del correcto del alumno.
    className={cn('text-sm font-medium leading-none text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70', className)}
    {...props}
  />
))
Label.displayName = 'Label'

export { Label }
