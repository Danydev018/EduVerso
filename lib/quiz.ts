// ---------------------------------------------------------------------------
// Parser de quiz en texto estructurado.
//
// Las preguntas de opción múltiple del paso "quiz" viven como texto en
// `activities.ai_context`, y las del repositorio en `activity_bank.content`
// con el mismo formato (asignar una del banco copia el texto tal cual). El
// docente también puede escribirlas a mano con este formato:
//
//   P: ¿Cuánto es 2 + 2?
//   A) 3
//   B) 4 *
//   C) 5
//   D) 6
//
//   P: ¿Cuál es la capital de Francia?
//   A) Madrid
//   B) París *
//   C) Roma
//
// Cada pregunta empieza con "P:", cada opción es una línea "Letra) texto",
// y la opción correcta se marca con un "*" al final. Las preguntas se
// separan por una línea en blanco. Si el texto no sigue este formato (por
// ejemplo, el docente solo escribió una nota libre para el agente), se
// interpreta como "sin quiz" y el paso se muestra sin preguntas.
// ---------------------------------------------------------------------------

export interface QuizQuestion {
  question: string
  options: string[]
  correctIndex: number
}

const QUESTION_PREFIX = /^P:\s*/i
const OPTION_LINE = /^[A-Za-z][).]\s*(.+)$/

export function parseQuiz(text: string | null | undefined): QuizQuestion[] | null {
  if (!text) return null

  const blocks = text
    .split(/\r?\n\s*\r?\n/)
    .map((b) => b.trim())
    .filter(Boolean)

  const questions: QuizQuestion[] = []

  for (const block of blocks) {
    const lines = block
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)

    if (lines.length < 3) continue // pregunta + al menos 2 opciones
    if (!QUESTION_PREFIX.test(lines[0])) continue

    const question = lines[0].replace(QUESTION_PREFIX, '').trim()
    const options: string[] = []
    let correctIndex = -1

    for (let i = 1; i < lines.length; i++) {
      const match = lines[i].match(OPTION_LINE)
      if (!match) continue

      let optionText = match[1].trim()
      const isCorrect = /\*\s*$/.test(optionText)
      if (isCorrect) {
        optionText = optionText.replace(/\*\s*$/, '').trim()
        correctIndex = options.length
      }
      options.push(optionText)
    }

    if (question && options.length >= 2 && correctIndex >= 0) {
      questions.push({ question, options, correctIndex })
    }
  }

  return questions.length > 0 ? questions : null
}

/**
 * Convierte preguntas al texto que guarda `ai_context`. Inverso de `parseQuiz`.
 *
 * Lo usa el editor del docente: adentro trabaja con objetos (agregar opción,
 * marcar la correcta) y al guardar vuelve al formato de texto, que es el que
 * entienden tanto el paso de quiz como el prompt de Profe Bot.
 */
export function serializeQuiz(questions: QuizQuestion[]): string {
  const LETRAS = 'ABCDEFGH'
  return questions
    .map((q) => {
      const opciones = q.options.map(
        (o, i) => `${LETRAS[i]}) ${o}${i === q.correctIndex ? ' *' : ''}`,
      )
      return [`P: ${q.question}`, ...opciones].join('\n')
    })
    .join('\n\n')
}

/**
 * Separa el contenido en preguntas y notas libres.
 *
 * `ai_context` cumple dos funciones a la vez: de ahí salen las preguntas del
 * paso de quiz y también el contexto que recibe Profe Bot. Un docente puede
 * haber escrito solo notas, solo preguntas, o ambas. Como `parseQuiz` ignora
 * los bloques que no empiezan con "P:", las notas pueden convivir con las
 * preguntas en el mismo campo sin estorbarse.
 */
export function splitQuizAndNotes(text: string | null | undefined): {
  questions: QuizQuestion[]
  notes: string
} {
  if (!text) return { questions: [], notes: '' }

  const notas = text
    .split(/\r?\n\s*\r?\n/)
    .map((b) => b.trim())
    .filter((b) => b && !QUESTION_PREFIX.test(b.split(/\r?\n/)[0].trim()))

  return {
    questions: parseQuiz(text) ?? [],
    notes: notas.join('\n\n'),
  }
}

/**
 * Quita las marcas de respuesta correcta de un texto de quiz.
 *
 * La clave de respuestas vive en `activity_quizzes`, que el alumno no puede
 * leer; `activities.ai_context` guarda el MISMO texto sin los asteriscos,
 * porque esa columna sí le llega al alumno junto con su actividad y antes le
 * revelaba todas las respuestas (ver migración 14).
 *
 * El asterisco se quita solo al final de renglón, que es donde significa
 * "esta es la correcta". Uno en medio de una frase —«2 * 3»— se respeta.
 */
export function quitarMarcas(text: string | null | undefined): string | null {
  if (!text) return null
  const limpio = text
    .split(/\r?\n/)
    .map((linea) => linea.replace(/[ \t]*\*[ \t]*$/, ''))
    .join('\n')
  return limpio.trim() || null
}
