import {
  Calculator,
  FlaskConical,
  BookOpen,
  Globe2,
  Palette,
  Music,
  Dumbbell,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'

export interface SubjectTheme {
  Icon: LucideIcon
  /** Color de la zona en el mapa del planeta — clases de Tailwind ya resueltas. */
  bg: string
  ring: string
  text: string
  label: string
}

const THEMES: Array<{ match: RegExp; theme: SubjectTheme }> = [
  {
    match: /matem|cálculo|calculo|aritm/i,
    theme: {
      Icon: Calculator,
      bg: 'bg-sky-500',
      ring: 'ring-sky-300',
      text: 'text-sky-600',
      label: 'Zona de Cálculo',
    },
  },
  {
    match: /ciencia|natural|biolog|química|quimica|física|fisica/i,
    theme: {
      Icon: FlaskConical,
      bg: 'bg-emerald-500',
      ring: 'ring-emerald-300',
      text: 'text-emerald-600',
      label: 'Zona Bioverde',
    },
  },
  {
    match: /lengua|literatura|comunicaci|lectura|español|espanol/i,
    theme: {
      Icon: BookOpen,
      bg: 'bg-rose-500',
      ring: 'ring-rose-300',
      text: 'text-rose-600',
      label: 'Zona de Relatos',
    },
  },
  {
    match: /social|historia|geograf|cívic|civic/i,
    theme: {
      Icon: Globe2,
      bg: 'bg-amber-500',
      ring: 'ring-amber-300',
      text: 'text-amber-600',
      label: 'Zona de Mundos',
    },
  },
  {
    match: /arte|dibujo|plástic|plastic/i,
    theme: {
      Icon: Palette,
      bg: 'bg-fuchsia-500',
      ring: 'ring-fuchsia-300',
      text: 'text-fuchsia-600',
      label: 'Zona Creativa',
    },
  },
  {
    match: /música|musica/i,
    theme: {
      Icon: Music,
      bg: 'bg-violet-500',
      ring: 'ring-violet-300',
      text: 'text-violet-600',
      label: 'Zona Sonora',
    },
  },
  {
    match: /educaci[oó]n f[ií]sica|deporte/i,
    theme: {
      Icon: Dumbbell,
      bg: 'bg-orange-500',
      ring: 'ring-orange-300',
      text: 'text-orange-600',
      label: 'Zona de Impulso',
    },
  },
]

const FALLBACK_THEME: SubjectTheme = {
  Icon: Sparkles,
  bg: 'bg-indigo-500',
  ring: 'ring-indigo-300',
  text: 'text-indigo-600',
  label: 'Zona Desconocida',
}

/** Elige un tema visual (ícono + color) para una materia por su nombre. */
export function getSubjectTheme(subjectName: string): SubjectTheme {
  const found = THEMES.find((t) => t.match.test(subjectName))
  return found?.theme ?? FALLBACK_THEME
}
