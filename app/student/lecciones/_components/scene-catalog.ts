/**
 * Catálogo de escenas para el editor del docente.
 *
 * El docente no escribe código: elige una escena de una lista y llena campos.
 * Para eso hace falta describir, en su idioma, qué dibuja cada una y qué
 * espera en cada ranura. Esa descripción vive acá y no en `lesson-scenes.tsx`
 * para que el editor no arrastre las 52 escenas (y todo su SVG) al bundle
 * solo para mostrar un desplegable.
 *
 * `campos` es la lista de rótulos que la escena lee, en orden. El texto de
 * cada uno es la pista que ve el docente. Si una escena acepta más rótulos de
 * los descritos acá, los de más no se ofrecen: mejor pedir de menos que
 * mostrar un campo que nadie sabe para qué sirve.
 *
 * `numeros` son los `values`, que casi siempre son cantidades a dibujar.
 */

export interface EscenaCatalogo {
  id: string;
  nombre: string;
  /** Para qué sirve, en una línea. */
  para: string;
  grupo: "Números" | "Lengua" | "Naturaleza" | "Sociales" | "General";
  campos: string[];
  numeros?: string[];
  /**
   * Los valores por defecto de la escena.
   *
   * El editor los copia al elegir la escena, por dos motivos: el docente ve
   * de entrada un ejemplo que funciona en vez de un dibujo a medio llenar, y
   * —más importante— la escena nunca recibe un arreglo con huecos. Un
   * `labels: []` NO activa los valores por defecto de la función, así que
   * `labels[0]` quedaría `undefined` y la escena reventaría al leerlo.
   */
  ejemplo?: { labels?: string[]; values?: number[] };
}

export const CATALOGO: EscenaCatalogo[] = [
  // ── Números ──────────────────────────────────────────────────────────────
  {
    id: "decenas",
    nombre: "Torres de diez",
    para: "Valor posicional: decenas y unidades",
    grupo: "Números",
    campos: ["Pie de la imagen (opcional)"],
    numeros: ["Cuántas decenas", "Cuántas unidades"],
    ejemplo: { labels: [], values: [3, 4] },
  },
  {
    id: "juntar",
    nombre: "Juntar dos grupos",
    para: "Sumar: dos grupos que se unen",
    grupo: "Números",
    campos: ["Resultado escrito (opcional)"],
    numeros: ["Primer grupo", "Segundo grupo"],
    ejemplo: { labels: [], values: [7, 5] },
  },
  {
    id: "quitar",
    nombre: "Quitar del grupo",
    para: "Restar: lo que se va queda tachado",
    grupo: "Números",
    campos: ["Resultado escrito (opcional)"],
    numeros: ["Cuántos había", "Cuántos se van"],
    ejemplo: { labels: [], values: [15, 6] },
  },
  {
    id: "agrupar",
    nombre: "Grupos iguales",
    para: "Multiplicar y dividir",
    grupo: "Números",
    campos: ["Pie de la imagen"],
    numeros: ["Cuántos grupos", "Cuántos por grupo"],
    ejemplo: { labels: [], values: [4, 3] },
  },
  {
    id: "reparto",
    nombre: "Torta repartida",
    para: "Fracciones: partes de un entero",
    grupo: "Números",
    campos: [],
    numeros: ["En cuántas partes", "Cuántas se toman"],
    ejemplo: { values: [4, 1] },
  },
  {
    id: "barras",
    nombre: "Dos barras",
    para: "Comparar dos cantidades",
    grupo: "Números",
    campos: ["Nombre de la primera", "Nombre de la segunda"],
    numeros: ["Valor de la primera", "Valor de la segunda"],
    ejemplo: { labels: ["A", "B"], values: [50, 80] },
  },
  {
    id: "recta",
    nombre: "Recta numérica",
    para: "Ubicar un número entre dos extremos",
    grupo: "Números",
    campos: ["Extremo izquierdo", "Extremo derecho"],
    numeros: ["Posición (0 a 1)"],
    ejemplo: { labels: ["0", "1"], values: [0.5] },
  },
  {
    id: "cuadricula",
    nombre: "Cuadrícula",
    para: "Perímetro y área de un rectángulo",
    grupo: "Números",
    campos: [],
    numeros: ["Largo", "Ancho"],
    ejemplo: { values: [6, 4] },
  },
  {
    id: "regla",
    nombre: "Regla y objeto",
    para: "Medir en centímetros desde el cero",
    grupo: "Números",
    campos: ["Qué se mide"],
    numeros: ["Cuántos centímetros"],
    ejemplo: { labels: ["lápiz"], values: [18] },
  },
  {
    id: "recipientes",
    nombre: "Recipientes",
    para: "Capacidad: vaso, jarra y botella",
    grupo: "Números",
    campos: ["Primer recipiente", "Segundo", "Tercero"],
    ejemplo: { labels: ["vaso 250 mL", "jarra 1 L", "botella 2 L"] },
  },
  {
    id: "calendario",
    nombre: "Calendario",
    para: "Días, semanas y meses",
    grupo: "Números",
    campos: ["L", "M", "M", "J", "V", "S", "D"],
    numeros: ["Día a destacar"],
    ejemplo: { labels: ["L", "M", "M", "J", "V", "S", "D"], values: [16] },
  },
  // ── Lengua ───────────────────────────────────────────────────────────────
  {
    id: "letras",
    nombre: "Abecedario",
    para: "Vocales y consonantes",
    grupo: "Lengua",
    campos: ["Vocal 1", "Vocal 2", "Vocal 3", "Vocal 4", "Vocal 5"],
    ejemplo: { labels: ["a", "e", "i", "o", "u"] },
  },
  {
    id: "silabas",
    nombre: "Sílabas",
    para: "Separar en golpes de voz",
    grupo: "Lengua",
    campos: ["Sílaba 1", "Sílaba 2", "Sílaba 3"],
    numeros: ["Cuál suena más fuerte (0, 1 o 2)"],
    ejemplo: { labels: ["ca", "mi", "ÓN"], values: [2] },
  },
  {
    id: "puntuacion",
    nombre: "Oración completa",
    para: "Mayúscula inicial y signo final",
    grupo: "Lengua",
    campos: ["Primera letra", "Resto de la frase", "Signo de cierre (. o ?)"],
    ejemplo: { labels: ["M", "i mamá cocina arepas", "."] },
  },
  {
    id: "coma",
    nombre: "Con coma y sin coma",
    para: "La misma frase cambia de sentido",
    grupo: "Lengua",
    campos: [
      "Frase CON coma",
      "Frase SIN coma",
      "Qué significa la primera",
      "Qué significa la segunda",
    ],
    ejemplo: {
      labels: [
        "Vamos a comer, Pedro",
        "Vamos a comer Pedro",
        "lo invito a comer",
        "¡nos lo comemos a él!",
      ],
    },
  },
  {
    id: "oracion",
    nombre: "Sujeto y predicado",
    para: "Las dos partes de la oración",
    grupo: "Lengua",
    campos: ["Sujeto", "Predicado"],
    ejemplo: { labels: ["Los estudiantes", "cantaron el himno"] },
  },
  {
    id: "describir",
    nombre: "Sustantivo y adjetivos",
    para: "Palabras que describen a otra",
    grupo: "Lengua",
    campos: ["Sustantivo", "Adjetivo 1", "Adjetivo 2", "Adjetivo 3"],
    ejemplo: { labels: ["perro", "negro", "grande", "juguetón"] },
  },
  {
    id: "colectivo",
    nombre: "Individual y colectivo",
    para: "Uno solo frente a muchos",
    grupo: "Lengua",
    campos: [
      "Palabra individual",
      "Palabra colectiva",
      "Rótulo izquierdo",
      "Rótulo derecho",
    ],
    ejemplo: {
      labels: [
        "árbol",
        "bosque",
        "individual: uno solo",
        "colectivo: muchos, en singular",
      ],
    },
  },
  {
    id: "opuestos",
    nombre: "Sinónimos y antónimos",
    para: "Palabras iguales y contrarias",
    grupo: "Lengua",
    campos: ["Palabra base", "Su sinónimo", "Su antónimo"],
    ejemplo: { labels: ["bonito", "hermoso", "feo"] },
  },
  {
    id: "ortografia",
    nombre: "Regla y excepciones",
    para: "Una regla con su lista de excepciones",
    grupo: "Lengua",
    campos: [
      "Ejemplo 1",
      "Ejemplo 2",
      "Ejemplo 3",
      "Excepción 1",
      "Excepción 2",
      "Excepción 3",
      "Título de la regla",
      "Título de las excepciones",
    ],
    ejemplo: {
      labels: [
        "escribir",
        "recibir",
        "subir",
        "hervir",
        "servir",
        "vivir",
        "Terminan en -bir → con B",
        "Menos...",
      ],
    },
  },
  {
    id: "documentos",
    nombre: "Tipos de texto",
    para: "Tres hojas que se distinguen por su forma",
    grupo: "Lengua",
    campos: [
      "Tipo 1",
      "Tipo 2",
      "Tipo 3",
      "Cómo se reconoce el 1",
      "Cómo se reconoce el 2",
      "Cómo se reconoce el 3",
    ],
    ejemplo: {
      labels: [
        "Narrativo",
        "Instructivo",
        "Informativo",
        "cuenta una historia",
        "pasos en orden",
        "datos y fechas",
      ],
    },
  },
  {
    id: "lectura",
    nombre: "Libro con preguntas",
    para: "Qué preguntarle a un texto",
    grupo: "Lengua",
    campos: ["Pregunta 1", "Pregunta 2", "Pregunta 3"],
    ejemplo: { labels: ["¿Quién?", "¿Qué hizo?", "¿Por qué?"] },
  },
  {
    id: "metafora",
    nombre: "Metáfora",
    para: "Una cosa dicha como si fuera otra",
    grupo: "Lengua",
    campos: ["Lo que se describe", "Con qué se compara", "Pista de abajo"],
    ejemplo: {
      labels: [
        "Sus ojos",
        "dos luceros",
        "Sin «como» es metáfora · Con «como» es comparación",
      ],
    },
  },
  {
    id: "escribir",
    nombre: "Tres pasos para escribir",
    para: "Planificar, escribir y revisar",
    grupo: "Lengua",
    campos: ["Paso 1", "Paso 2", "Paso 3"],
    ejemplo: { labels: ["Planificar", "Escribir", "Revisar"] },
  },
  {
    id: "hecho-opinion",
    nombre: "Hecho y opinión",
    para: "Lo que se comprueba y lo que se discute",
    grupo: "Lengua",
    campos: ["Ejemplo de hecho", "Ejemplo de opinión", "Pista de abajo"],
    ejemplo: {
      labels: [
        "Caracas es la capital",
        "El quesillo es el mejor postre",
        "«mejor», «debería», «es evidente» anuncian opinión",
      ],
    },
  },
  // ── Naturaleza ───────────────────────────────────────────────────────────
  {
    id: "vivo",
    nombre: "Vivo y no vivo",
    para: "Nace, crece y se reproduce",
    grupo: "Naturaleza",
    campos: ["Acción 1", "Acción 2", "Acción 3"],
    ejemplo: { labels: ["nace", "crece", "se reproduce"] },
  },
  {
    id: "sentidos",
    nombre: "Los cinco sentidos",
    para: "Una cara con sus cinco puertas",
    grupo: "Naturaleza",
    campos: ["Sentido 1", "Sentido 2", "Sentido 3", "Sentido 4", "Sentido 5"],
    ejemplo: { labels: ["Vista", "Oído", "Olfato", "Gusto", "Tacto"] },
  },
  {
    id: "cuerpo",
    nombre: "Señal por el cuerpo",
    para: "Un mensaje viajando de un órgano a otro",
    grupo: "Naturaleza",
    campos: ["Origen", "Paso intermedio", "Destino"],
    ejemplo: { labels: ["pie", "médula", "cerebro"] },
  },
  {
    id: "planta",
    nombre: "Partes de la planta",
    para: "Raíz, tallo, hoja y flor con su función",
    grupo: "Naturaleza",
    campos: [
      "Parte 1",
      "Parte 2",
      "Parte 3",
      "Parte 4",
      "Qué hace la 1",
      "Qué hace la 2",
      "Qué hace la 3",
      "Qué hace la 4",
    ],
    ejemplo: {
      labels: [
        "raíz",
        "tallo",
        "hoja",
        "flor",
        "toma agua del suelo",
        "sube el agua",
        "hace el alimento",
        "da el fruto",
      ],
    },
  },
  {
    id: "habitat",
    nombre: "Tres hábitats",
    para: "Mar, montaña y llano con su animal",
    grupo: "Naturaleza",
    campos: ["Hábitat 1", "Hábitat 2", "Hábitat 3"],
    ejemplo: { labels: ["Mar", "Montaña", "Llano"] },
  },
  {
    id: "ciclo",
    nombre: "Ciclo de cuatro etapas",
    para: "Un proceso que vuelve al principio",
    grupo: "Naturaleza",
    campos: ["Etapa 1", "Etapa 2", "Etapa 3", "Etapa 4"],
    ejemplo: { labels: ["Uno", "Dos", "Tres", "Cuatro"] },
  },
  {
    id: "estados",
    nombre: "Estados de la materia",
    para: "Partículas en tres densidades",
    grupo: "Naturaleza",
    campos: ["Estado 1", "Estado 2", "Estado 3"],
    ejemplo: { labels: ["Sólido", "Líquido", "Gaseoso"] },
  },
  {
    id: "agua-estados",
    nombre: "Agua en tres vasos",
    para: "Hielo, líquido y vapor",
    grupo: "Naturaleza",
    campos: ["Vaso 1", "Vaso 2", "Vaso 3"],
    ejemplo: { labels: ["Hielo", "Agua", "Vapor"] },
  },
  {
    id: "cadena",
    nombre: "Cadena de cuatro",
    para: "Algo que pasa de un eslabón al siguiente",
    grupo: "Naturaleza",
    campos: ["Eslabón 1", "Eslabón 2", "Eslabón 3", "Eslabón 4"],
    ejemplo: { labels: ["Planta", "Herbívoro", "Carnívoro", "Descomponedor"] },
  },
  {
    id: "transformacion",
    nombre: "Energía que se transforma",
    para: "Sol, panel y bombillo",
    grupo: "Naturaleza",
    campos: ["Origen", "Intermedio", "Destino"],
    ejemplo: { labels: ["Sol", "Panel", "Bombillo"] },
  },
  {
    id: "gotas",
    nombre: "Chorro que gotea",
    para: "Lo que se pierde gota a gota",
    grupo: "Naturaleza",
    campos: ["En cuánto tiempo"],
    numeros: ["Cuántos litros"],
    ejemplo: { labels: ["en un día"], values: [30] },
  },
  {
    id: "dia-noche",
    nombre: "Día y noche",
    para: "La Tierra girando frente al Sol",
    grupo: "Naturaleza",
    campos: ["El Sol", "Lado iluminado", "Lado oscuro"],
    ejemplo: { labels: ["Sol", "de día", "de noche"] },
  },
  {
    id: "orbita",
    nombre: "Órbita",
    para: "Un planeta girando alrededor del Sol",
    grupo: "Naturaleza",
    campos: ["Centro", "Lo que gira"],
    ejemplo: { labels: ["Sol", "Tierra"] },
  },
  {
    id: "escalas",
    nombre: "Escalas del universo",
    para: "Planeta, sistema y galaxia",
    grupo: "Naturaleza",
    campos: ["Escala 1", "Escala 2", "Escala 3"],
    ejemplo: { labels: ["Tierra", "Sistema solar", "Vía Láctea"] },
  },
  // ── Sociales ─────────────────────────────────────────────────────────────
  {
    id: "anidado",
    nombre: "Cajas anidadas",
    para: "Del lugar más grande al más chico",
    grupo: "Sociales",
    campos: ["El más grande", "El siguiente", "El siguiente", "El más chico"],
    ejemplo: { labels: ["Venezuela", "Mi estado", "Mi municipio", "Mi casa"] },
  },
  {
    id: "mapa",
    nombre: "Mapa por regiones",
    para: "Un territorio dividido en zonas",
    grupo: "Sociales",
    campos: ["Región 1", "Región 2", "Región 3", "Región 4"],
    ejemplo: { labels: ["Costa", "Llanos", "Andes", "Guayana"] },
  },
  {
    id: "relieve",
    nombre: "Relieve y clima",
    para: "Cómo cambia la temperatura con la altura",
    grupo: "Sociales",
    campos: ["Nivel bajo", "Nivel medio", "Nivel alto"],
    ejemplo: { labels: ["Costa 33°", "Llano 30°", "Andes 19°"] },
  },
  {
    id: "comunidad",
    nombre: "La comunidad",
    para: "Instituciones y vecinos",
    grupo: "Sociales",
    campos: ["Institución", "La gente", "Otro lugar"],
    ejemplo: { labels: ["Alcalde", "Vecinos", "Escuela"] },
  },
  {
    id: "asamblea",
    nombre: "Solo o en grupo",
    para: "Uno reclama frente a muchos organizados",
    grupo: "Sociales",
    campos: ["Caso de uno solo", "Caso del grupo"],
    ejemplo: { labels: ["Un vecino solo", "Los vecinos juntos"] },
  },
  {
    id: "poderes",
    nombre: "Tres edificios",
    para: "Instituciones que se vigilan entre sí",
    grupo: "Sociales",
    campos: [
      "Poder 1",
      "Poder 2",
      "Poder 3",
      "Qué hace el 1",
      "Qué hace el 2",
      "Qué hace el 3",
    ],
    ejemplo: {
      labels: [
        "Legislativo",
        "Ejecutivo",
        "Judicial",
        "hace las leyes",
        "las aplica",
        "juzga",
      ],
    },
  },
  {
    id: "fuentes",
    nombre: "Fuentes históricas",
    para: "Cómo se averigua el pasado",
    grupo: "Sociales",
    campos: [
      "Fuente 1",
      "Fuente 2",
      "Fuente 3",
      "Dónde se busca la 1",
      "Dónde se busca la 2",
      "Dónde se busca la 3",
    ],
    ejemplo: {
      labels: [
        "Contada",
        "Escrita",
        "Gráfica",
        "pregunta a los mayores",
        "actas y documentos",
        "fotos antiguas",
      ],
    },
  },
  {
    id: "simbolos",
    nombre: "Bandera",
    para: "Los colores y su significado",
    grupo: "Sociales",
    campos: ["Significado 1", "Significado 2", "Significado 3"],
    ejemplo: { labels: ["Riquezas", "El mar", "La sangre"] },
  },
  {
    id: "linea-tiempo",
    nombre: "Línea de tiempo",
    para: "Tres hitos en orden",
    grupo: "Sociales",
    campos: ["Hito 1", "Hito 2", "Hito 3"],
    ejemplo: { labels: ["1810", "1811", "1821"] },
  },
  // ── General ──────────────────────────────────────────────────────────────
  {
    id: "equilibrio",
    nombre: "Balanza",
    para: "Dos cosas que se equilibran",
    grupo: "General",
    campos: ["Lado izquierdo", "Lado derecho"],
    ejemplo: { labels: ["Derechos", "Deberes"] },
  },
  {
    id: "figuras",
    nombre: "Figuras geométricas",
    para: "Círculo, triángulo, cuadrado y rectángulo",
    grupo: "General",
    campos: [
      "Figura 1",
      "Figura 2",
      "Figura 3",
      "Figura 4",
      "Rasgo de la 1",
      "Rasgo de la 2",
      "Rasgo de la 3",
      "Rasgo de la 4",
    ],
    ejemplo: {
      labels: [
        "Círculo",
        "Triángulo",
        "Cuadrado",
        "Rectángulo",
        "sin esquinas",
        "3 lados",
        "4 iguales",
        "2 largos, 2 cortos",
      ],
    },
  },
  {
    id: "turnos",
    nombre: "Desorden y turnos",
    para: "Todos a la vez frente a por turnos",
    grupo: "General",
    campos: ["Lado del desorden", "Lado del orden"],
    ejemplo: { labels: ["Todos a la vez", "Por turnos"] },
  },
  {
    id: "plato",
    nombre: "Plato de comida",
    para: "Grupos de alimentos",
    grupo: "General",
    campos: ["Grupo 1", "Grupo 2", "Grupo 3"],
    ejemplo: { labels: ["Verduras y frutas", "Cereales", "Proteínas"] },
  },
];

export const GRUPOS = [
  "Números",
  "Lengua",
  "Naturaleza",
  "Sociales",
  "General",
] as const;

export function buscarEscena(id: string): EscenaCatalogo | undefined {
  return CATALOGO.find((e) => e.id === id);
}
