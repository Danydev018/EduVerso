/**
 * Escenas hechas por el docente, como DATOS.
 *
 * Las 52 escenas del catálogo son funciones: alguien las programó. Una escena
 * que el docente arma arrastrando piezas no puede serlo, así que se guarda
 * como un documento con la lista de lo que hay en el lienzo y dónde está.
 * `CustomScene` lo dibuja y el editor lo edita; las dos leen de acá.
 *
 * El lienzo es el mismo 400×220 de las escenas programadas, para que ambas
 * convivan en la misma lección sin saltos de tamaño.
 *
 * REGLA AL AGREGAR UN TIPO DE ELEMENTO: todo lo que se dibuje tiene que poder
 * describirse con números y textos planos. Nada de funciones ni de referencias
 * a componentes: el documento viaja como JSON dentro de la página de la
 * lección, y algo que no sobreviva a `JSON.stringify` se pierde al guardar.
 */

export const LIENZO = { ancho: 400, alto: 220 } as const

/** Piezas del kit que se pueden soltar en el lienzo. */
export const PIEZAS = [
  // Las dieciséis originales
  'Persona', 'Arbol', 'Montana', 'Nube', 'Sol', 'Gota',
  'Vaso', 'Casa', 'Edificio', 'Libro', 'Bombillo', 'Panel',
  'Bandera', 'Papel', 'Jarra', 'Balanza',
  // El resto del kit, por temas. Ver lesson-art-*.tsx
  'Abaco', 'BloqueDecena', 'CuboUnidad', 'RectaNumerica', 'Reloj', 'Moneda',
  'Billete', 'Dado', 'FraccionCirculo', 'FraccionBarra', 'Regla', 'Termometro',
  'Grafico', 'Calculadora', 'Circulo', 'Cuadrado', 'Rectangulo', 'Triangulo',
  'Pentagono', 'Hexagono', 'Cubo', 'Esfera', 'Cilindro', 'Piramide',
  'Flor', 'Girasol', 'Semilla', 'Brote', 'Maceta', 'Hoja',
  'Raiz', 'Cactus', 'Palmera', 'Hierba', 'Pez', 'Pajaro',
  'Mariposa', 'Perro', 'Gato', 'Vaca', 'Gallina', 'Caballo',
  'Tortuga', 'Rana', 'Hormiga', 'Abeja', 'Guacamaya', 'Delfin',
  'Oveja', 'Cerdo', 'Luna', 'Estrella', 'Arcoiris', 'Rayo',
  'CopoNieve', 'Viento', 'Lluvia', 'Tormenta', 'Charco', 'Corazon',
  'Cerebro', 'Pulmones', 'Diente', 'Ojo', 'Mano', 'Hueso',
  'Estomago', 'Oido', 'Manzana', 'Banana', 'Naranja', 'Pan',
  'Leche', 'Huevo', 'Queso', 'Arepa', 'Zanahoria', 'Pescado',
  'Uvas', 'Maiz', 'Mochila', 'Pizarron', 'Tijeras', 'Pegamento',
  'Escuadra', 'GloboTerraqueo', 'Microscopio', 'Iman', 'Pila', 'Lupa',
  'Cuaderno', 'Lapiz', 'Computadora', 'Carro', 'Autobus', 'Bicicleta',
  'Barco', 'Avion', 'Tren', 'Cohete', 'Camion', 'Escuela',
  'Hospital', 'Tienda', 'Puente', 'Rio', 'Volcan', 'Cerca',
  'Bocadillo', 'Pensamiento', 'Interrogacion', 'Exclamacion', 'TarjetaLetra', 'Sobre',
  'Megafono',
] as const

export type NombrePieza = (typeof PIEZAS)[number]

/** Cómo se presenta cada pieza en la paleta y qué ajustes admite. */
export interface PiezaMeta {
  nombre: string
  /** Alto aproximado en unidades del lienzo, para colocarla sin que se salga. */
  alto: number
  /** Ajustes propios además de posición y tamaño. */
  opciones?: {
    color?: { etiqueta: string; prop: string; valor: string[] }
    elegir?: { etiqueta: string; prop: string; valor: string[] }
    numero?: { etiqueta: string; prop: string; min: number; max: number; paso: number }
    /**
     * Texto libre y corto que se dibuja DENTRO de la pieza: la letra de una
     * tarjeta, el valor de una moneda. Sin esto esas piezas quedaban con su
     * texto de muestra para siempre y no servían para nada.
     */
    texto?: { etiqueta: string; prop: string; max: number }
  }
}

export const PIEZAS_META: Record<NombrePieza, PiezaMeta> = {
  Persona: {
    nombre: 'Persona', alto: 70,
    opciones: {
      color: { etiqueta: 'Ropa', prop: 'ropa', valor: ['#6366F1', '#DC2626', '#16A34A', '#D97706', '#DB2777'] },
      elegir: { etiqueta: 'Pose', prop: 'pose', valor: ['quieta', 'saluda', 'piensa', 'senala'] },
    },
  },
  Arbol: { nombre: 'Árbol', alto: 66 },
  Montana: {
    nombre: 'Montaña', alto: 70,
    opciones: { elegir: { etiqueta: 'Nieve', prop: 'nieve', valor: ['si', 'no'] } },
  },
  Nube: { nombre: 'Nube', alto: 27 },
  Sol: {
    nombre: 'Sol', alto: 34,
    opciones: { elegir: { etiqueta: 'Rayos', prop: 'rayos', valor: ['si', 'no'] } },
  },
  Gota: {
    nombre: 'Gota', alto: 24,
    opciones: { color: { etiqueta: 'Color', prop: 'color', valor: ['#38BDF8', '#F97316', '#10B981'] } },
  },
  Vaso: {
    nombre: 'Vaso', alto: 56,
    opciones: { numero: { etiqueta: 'Cuánto tiene', prop: 'nivel', min: 0, max: 1, paso: 0.1 } },
  },
  Casa: { nombre: 'Casa', alto: 62 },
  Edificio: { nombre: 'Edificio', alto: 58 },
  Libro: { nombre: 'Libro', alto: 36 },
  Bombillo: {
    nombre: 'Bombillo', alto: 40,
    opciones: { elegir: { etiqueta: 'Encendido', prop: 'encendido', valor: ['si', 'no'] } },
  },
  Panel: { nombre: 'Panel solar', alto: 30 },
  Bandera: { nombre: 'Bandera', alto: 72 },
  Papel: { nombre: 'Hoja', alto: 70 },
  Jarra: {
    nombre: 'Jarra', alto: 62,
    opciones: { numero: { etiqueta: 'Cuánto tiene', prop: 'nivel', min: 0, max: 1, paso: 0.1 } },
  },
  Balanza: {
    nombre: 'Balanza', alto: 58,
    opciones: { numero: { etiqueta: 'Inclinación', prop: 'inclina', min: -1, max: 1, paso: 0.25 } },
  },

  Abaco: { nombre: 'Ábaco', alto: 54,
    opciones: { numero: { etiqueta: 'Cuentas', prop: 'cuentas', min: 1, max: 7, paso: 1 } } },
  BloqueDecena: { nombre: 'Barra de diez', alto: 14 },
  CuboUnidad: { nombre: 'Cubo de uno', alto: 12 },
  RectaNumerica: { nombre: 'Recta numérica', alto: 14,
    opciones: { numero: { etiqueta: 'Dónde va el punto', prop: 'punto', min: 0, max: 1, paso: 0.05 } } },
  Reloj: { nombre: 'Reloj', alto: 48,
    opciones: { numero: { etiqueta: 'Hora', prop: 'hora', min: 0, max: 12, paso: 0.25 } } },
  Moneda: { nombre: 'Moneda', alto: 20,
    opciones: { texto: { etiqueta: 'Valor', prop: 'valor', max: 4 } } },
  Billete: { nombre: 'Billete', alto: 20,
    opciones: { texto: { etiqueta: 'Valor', prop: 'valor', max: 5 } } },
  Dado: { nombre: 'Dado', alto: 32,
    opciones: { numero: { etiqueta: 'Cara', prop: 'cara', min: 1, max: 6, paso: 1 } } },
  FraccionCirculo: { nombre: 'Fracción en torta', alto: 48,
    opciones: { numero: { etiqueta: 'Partes tomadas', prop: 'tomadas', min: 0, max: 12, paso: 1 } } },
  FraccionBarra: { nombre: 'Fracción en barra', alto: 18,
    opciones: { numero: { etiqueta: 'Partes tomadas', prop: 'tomadas', min: 0, max: 12, paso: 1 } } },
  Regla: { nombre: 'Regla', alto: 12 },
  Termometro: { nombre: 'Termómetro', alto: 56,
    opciones: { numero: { etiqueta: 'Temperatura', prop: 'nivel', min: 0, max: 1, paso: 0.05 } } },
  Grafico: { nombre: 'Gráfico de barras', alto: 52,
    opciones: { numero: { etiqueta: 'Barra del medio', prop: 'b', min: 0, max: 1, paso: 0.05 } } },
  Calculadora: { nombre: 'Calculadora', alto: 46 },
  Circulo: { nombre: 'Círculo', alto: 44,
    opciones: { color: { etiqueta: 'Color', prop: 'color', valor: ['url(#la-roca)', '#DC2626', '#16A34A', '#F59E0B', '#DB2777'] } } },
  Cuadrado: { nombre: 'Cuadrado', alto: 40,
    opciones: { color: { etiqueta: 'Color', prop: 'color', valor: ['url(#la-roca)', '#DC2626', '#16A34A', '#F59E0B', '#DB2777'] } } },
  Rectangulo: { nombre: 'Rectángulo', alto: 26,
    opciones: { color: { etiqueta: 'Color', prop: 'color', valor: ['url(#la-roca)', '#DC2626', '#16A34A', '#F59E0B', '#DB2777'] } } },
  Triangulo: { nombre: 'Triángulo', alto: 42,
    opciones: { color: { etiqueta: 'Color', prop: 'color', valor: ['url(#la-roca)', '#DC2626', '#16A34A', '#F59E0B', '#DB2777'] } } },
  Pentagono: { nombre: 'Pentágono', alto: 44 },
  Hexagono: { nombre: 'Hexágono', alto: 44 },
  Cubo: { nombre: 'Cubo', alto: 44 },
  Esfera: { nombre: 'Esfera', alto: 44 },
  Cilindro: { nombre: 'Cilindro', alto: 45 },
  Piramide: { nombre: 'Pirámide', alto: 50 },
  Flor: { nombre: 'Flor', alto: 48,
    opciones: { color: { etiqueta: 'Color', prop: 'color', valor: ['#F472B6', '#DC2626', '#A855F7', '#FBBF24', '#FFFFFF'] } } },
  Girasol: { nombre: 'Girasol', alto: 68 },
  Semilla: { nombre: 'Semilla', alto: 18 },
  Brote: { nombre: 'Brote', alto: 24 },
  Maceta: { nombre: 'Planta en maceta', alto: 52 },
  Hoja: { nombre: 'Hoja', alto: 34,
    opciones: { color: { etiqueta: 'Color', prop: 'color', valor: ['#22C55E', '#16A34A', '#F59E0B', '#DC2626'] } } },
  Raiz: { nombre: 'Raíces', alto: 36 },
  Cactus: { nombre: 'Cactus', alto: 45 },
  Palmera: { nombre: 'Palmera', alto: 58 },
  Hierba: { nombre: 'Hierba', alto: 18 },
  Pez: { nombre: 'Pez', alto: 26,
    opciones: { color: { etiqueta: 'Color', prop: 'color', valor: ['#F97316', '#3B82F6', '#FBBF24', '#EF4444', '#A855F7'] } } },
  Pajaro: { nombre: 'Pájaro', alto: 28,
    opciones: { color: { etiqueta: 'Color', prop: 'color', valor: ['#3B82F6', '#EF4444', '#FBBF24', '#22C55E'] } } },
  Mariposa: { nombre: 'Mariposa', alto: 34,
    opciones: { color: { etiqueta: 'Color', prop: 'color', valor: ['#A855F7', '#F97316', '#3B82F6', '#EC4899'] } } },
  Perro: { nombre: 'Perro', alto: 42 },
  Gato: { nombre: 'Gato', alto: 40,
    opciones: { color: { etiqueta: 'Color', prop: 'color', valor: ['#94A3B8', '#F59E0B', '#1E293B', '#FFFFFF'] } } },
  Vaca: { nombre: 'Vaca', alto: 45 },
  Gallina: { nombre: 'Gallina', alto: 36 },
  Caballo: { nombre: 'Caballo', alto: 60 },
  Tortuga: { nombre: 'Tortuga', alto: 22 },
  Rana: { nombre: 'Rana', alto: 28 },
  Hormiga: { nombre: 'Hormiga', alto: 18 },
  Abeja: { nombre: 'Abeja', alto: 30 },
  Guacamaya: { nombre: 'Guacamaya', alto: 42 },
  Delfin: { nombre: 'Delfín', alto: 32 },
  Oveja: { nombre: 'Oveja', alto: 34 },
  Cerdo: { nombre: 'Cerdo', alto: 36 },
  Luna: { nombre: 'Luna', alto: 34 },
  Estrella: { nombre: 'Estrella', alto: 36,
    opciones: { color: { etiqueta: 'Color', prop: 'color', valor: ['#FBBF24', '#F8FAFC', '#60A5FA', '#F472B6'] } } },
  Arcoiris: { nombre: 'Arcoíris', alto: 38 },
  Rayo: { nombre: 'Rayo', alto: 44 },
  CopoNieve: { nombre: 'Copo de nieve', alto: 36 },
  Viento: { nombre: 'Viento', alto: 40 },
  Lluvia: { nombre: 'Lluvia', alto: 46 },
  Tormenta: { nombre: 'Tormenta', alto: 50 },
  Charco: { nombre: 'Charco', alto: 12 },
  Corazon: { nombre: 'Corazón', alto: 52 },
  Cerebro: { nombre: 'Cerebro', alto: 44 },
  Pulmones: { nombre: 'Pulmones', alto: 48 },
  Diente: { nombre: 'Diente', alto: 40 },
  Ojo: { nombre: 'Ojo', alto: 34,
    opciones: { color: { etiqueta: 'Color', prop: 'color', valor: ['#3B82F6', '#78350F', '#16A34A', '#64748B'] } } },
  Mano: { nombre: 'Mano', alto: 44 },
  Hueso: { nombre: 'Hueso', alto: 22 },
  Estomago: { nombre: 'Estómago', alto: 48 },
  Oido: { nombre: 'Oído', alto: 38 },
  Manzana: { nombre: 'Manzana', alto: 46,
    opciones: { color: { etiqueta: 'Color', prop: 'color', valor: ['#DC2626', '#16A34A', '#FBBF24'] } } },
  Banana: { nombre: 'Cambur', alto: 22 },
  Naranja: { nombre: 'Naranja', alto: 38 },
  Pan: { nombre: 'Pan', alto: 26 },
  Leche: { nombre: 'Leche', alto: 50 },
  Huevo: { nombre: 'Huevo', alto: 34 },
  Queso: { nombre: 'Queso', alto: 26 },
  Arepa: { nombre: 'Arepa', alto: 38 },
  Zanahoria: { nombre: 'Zanahoria', alto: 54 },
  Pescado: { nombre: 'Pescado', alto: 28 },
  Uvas: { nombre: 'Uvas', alto: 50 },
  Maiz: { nombre: 'Maíz', alto: 48 },
  Mochila: { nombre: 'Mochila', alto: 46,
    opciones: { color: { etiqueta: 'Color', prop: 'color', valor: ['#3B82F6', '#DC2626', '#16A34A', '#A855F7'] } } },
  Pizarron: { nombre: 'Pizarrón', alto: 48 },
  Tijeras: { nombre: 'Tijeras', alto: 44 },
  Pegamento: { nombre: 'Pegamento', alto: 46 },
  Escuadra: { nombre: 'Escuadra', alto: 34 },
  GloboTerraqueo: { nombre: 'Globo terráqueo', alto: 52 },
  Microscopio: { nombre: 'Microscopio', alto: 48 },
  Iman: { nombre: 'Imán', alto: 34 },
  Pila: { nombre: 'Pila', alto: 46,
    opciones: { numero: { etiqueta: 'Carga', prop: 'carga', min: 0, max: 1, paso: 0.1 } } },
  Lupa: { nombre: 'Lupa', alto: 44 },
  Cuaderno: { nombre: 'Cuaderno', alto: 42,
    opciones: { color: { etiqueta: 'Color', prop: 'color', valor: ['#6366F1', '#DC2626', '#16A34A', '#F59E0B'] } } },
  Lapiz: { nombre: 'Lápiz', alto: 62 },
  Computadora: { nombre: 'Computadora', alto: 40 },
  Carro: { nombre: 'Carro', alto: 32,
    opciones: { color: { etiqueta: 'Color', prop: 'color', valor: ['#DC2626', '#3B82F6', '#16A34A', '#F8FAFC', '#1E293B'] } } },
  Autobus: { nombre: 'Autobús', alto: 40,
    opciones: { color: { etiqueta: 'Color', prop: 'color', valor: ['#F59E0B', '#DC2626', '#3B82F6', '#16A34A'] } } },
  Bicicleta: { nombre: 'Bicicleta', alto: 36 },
  Barco: { nombre: 'Barco', alto: 54 },
  Avion: { nombre: 'Avión', alto: 42 },
  Tren: { nombre: 'Tren', alto: 46 },
  Cohete: { nombre: 'Cohete', alto: 58 },
  Camion: { nombre: 'Camión', alto: 36,
    opciones: { color: { etiqueta: 'Color', prop: 'color', valor: ['#16A34A', '#DC2626', '#3B82F6', '#F59E0B'] } } },
  Escuela: { nombre: 'Escuela', alto: 60 },
  Hospital: { nombre: 'Hospital', alto: 54 },
  Tienda: { nombre: 'Tienda', alto: 46 },
  Puente: { nombre: 'Puente', alto: 42 },
  Rio: { nombre: 'Río', alto: 18 },
  Volcan: { nombre: 'Volcán', alto: 60 },
  Cerca: { nombre: 'Cerca', alto: 28 },
  Bocadillo: { nombre: 'Globo de diálogo', alto: 42,
    opciones: { color: { etiqueta: 'Color', prop: 'color', valor: ['#FFFFFF', '#FDE68A', '#BFDBFE', '#BBF7D0'] } } },
  Pensamiento: { nombre: 'Globo de pensar', alto: 50 },
  Interrogacion: { nombre: 'Signo de pregunta', alto: 52,
    opciones: { color: { etiqueta: 'Color', prop: 'color', valor: ['#6366F1', '#DC2626', '#F97316', '#16A34A'] } } },
  Exclamacion: { nombre: 'Signo de admiración', alto: 52,
    opciones: { color: { etiqueta: 'Color', prop: 'color', valor: ['#F97316', '#DC2626', '#6366F1', '#16A34A'] } } },
  TarjetaLetra: { nombre: 'Tarjeta de letra', alto: 32,
    opciones: { texto: { etiqueta: 'Letra o sílaba', prop: 'letra', max: 4 } } },
  Sobre: { nombre: 'Sobre', alto: 32 },
  Megafono: { nombre: 'Megáfono', alto: 38 },
}

/**
 * Cómo se agrupan las piezas en la paleta.
 *
 * Por lo que SON, no por materia. El catálogo de escenas sí se agrupa por
 * materia (Lengua, Números…) porque cada escena enseña un tema concreto; una
 * pieza suelta no: la persona aparece lo mismo en una clase de sociales que
 * en una de naturaleza, así que agruparla por materia no ayudaría a
 * encontrarla.
 *
 * El orden es el de la paleta, y cada pieza va en un solo grupo.
 */
export const GRUPOS_PIEZAS: { nombre: string; piezas: NombrePieza[] }[] = [
  { nombre: 'Personas y lugares', piezas: ['Persona', 'Casa', 'Edificio', 'Bandera'] },
  { nombre: 'Naturaleza', piezas: ['Sol', 'Nube', 'Arbol', 'Montana', 'Gota'] },
  { nombre: 'Objetos', piezas: ['Libro', 'Papel', 'Vaso', 'Jarra', 'Balanza', 'Bombillo', 'Panel'] },
  { nombre: 'Números y medida', piezas: ['Abaco', 'BloqueDecena', 'CuboUnidad', 'RectaNumerica', 'Reloj', 'Moneda', 'Billete', 'Dado', 'FraccionCirculo', 'FraccionBarra', 'Regla', 'Termometro', 'Grafico', 'Calculadora'] },
  { nombre: 'Figuras', piezas: ['Circulo', 'Cuadrado', 'Rectangulo', 'Triangulo', 'Pentagono', 'Hexagono', 'Cubo', 'Esfera', 'Cilindro', 'Piramide'] },
  { nombre: 'Plantas', piezas: ['Flor', 'Girasol', 'Semilla', 'Brote', 'Maceta', 'Hoja', 'Raiz', 'Cactus', 'Palmera', 'Hierba'] },
  { nombre: 'Animales', piezas: ['Pez', 'Pajaro', 'Mariposa', 'Perro', 'Gato', 'Vaca', 'Gallina', 'Caballo', 'Tortuga', 'Rana', 'Hormiga', 'Abeja', 'Guacamaya', 'Delfin', 'Oveja', 'Cerdo'] },
  { nombre: 'Cielo y clima', piezas: ['Luna', 'Estrella', 'Arcoiris', 'Rayo', 'CopoNieve', 'Viento', 'Lluvia', 'Tormenta', 'Charco'] },
  { nombre: 'Cuerpo', piezas: ['Corazon', 'Cerebro', 'Pulmones', 'Diente', 'Ojo', 'Mano', 'Hueso', 'Estomago', 'Oido'] },
  { nombre: 'Comida', piezas: ['Manzana', 'Banana', 'Naranja', 'Pan', 'Leche', 'Huevo', 'Queso', 'Arepa', 'Zanahoria', 'Pescado', 'Uvas', 'Maiz'] },
  { nombre: 'Escuela y objetos', piezas: ['Mochila', 'Pizarron', 'Tijeras', 'Pegamento', 'Escuadra', 'GloboTerraqueo', 'Microscopio', 'Iman', 'Pila', 'Lupa', 'Cuaderno', 'Lapiz', 'Computadora'] },
  { nombre: 'Transporte', piezas: ['Carro', 'Autobus', 'Bicicleta', 'Barco', 'Avion', 'Tren', 'Cohete', 'Camion'] },
  { nombre: 'Lugares', piezas: ['Escuela', 'Hospital', 'Tienda', 'Puente', 'Rio', 'Volcan', 'Cerca'] },
  { nombre: 'Símbolos', piezas: ['Bocadillo', 'Pensamiento', 'Interrogacion', 'Exclamacion', 'TarjetaLetra', 'Sobre', 'Megafono'] },
]

export const FONDOS = ['blanco', 'cielo', 'campo', 'noche', 'aula'] as const
export type Fondo = (typeof FONDOS)[number]

export const FONDOS_META: Record<Fondo, string> = {
  blanco: 'Blanco',
  cielo: 'Cielo',
  campo: 'Campo',
  noche: 'Noche',
  aula: 'Salón',
}

export type Elemento =
  | {
      id: string
      tipo: 'pieza'
      pieza: NombrePieza
      x: number
      y: number
      s: number
      /** Ajustes propios de la pieza. Solo textos y números. */
      props?: Record<string, string | number>
    }
  | {
      id: string
      tipo: 'texto'
      x: number
      y: number
      texto: string
      tam: number
      color: string
      anchor: 'start' | 'middle' | 'end'
    }
  | {
      id: string
      tipo: 'trazo'
      /** Puntos del pincel, en pares [x, y]. */
      puntos: [number, number][]
      color: string
      grosor: number
    }
  | {
      id: string
      tipo: 'flecha'
      desde: [number, number]
      hasta: [number, number]
      curva: number
      color: string
    }
  | {
      id: string
      tipo: 'forma'
      forma: 'rect' | 'elipse'
      x: number
      y: number
      w: number
      h: number
      color: string
    }

export interface EscenaDoc {
  fondo: Fondo
  elementos: Elemento[]
}

export const ESCENA_VACIA: EscenaDoc = { fondo: 'blanco', elementos: [] }

/**
 * Camino SVG de un trazo a mano.
 *
 * Vive acá y no en el renderizador porque el editor necesita EXACTAMENTE el
 * mismo camino para el área de agarre: si cada uno lo calculara por su lado,
 * tocar la línea dejaría de seleccionarla en cuanto una de las dos fórmulas
 * cambiara.
 *
 * Se curva por los puntos medios; unir los puntos crudos con rectas deja el
 * trazo anguloso y se nota que fue hecho con el dedo.
 */
export function caminoDeTrazo(puntos: [number, number][]): string {
  if (puntos.length === 0) return ''
  if (puntos.length === 1) return `M${puntos[0][0]},${puntos[0][1]}`
  let d = `M${puntos[0][0]},${puntos[0][1]}`
  for (let i = 1; i < puntos.length - 1; i++) {
    const mx = (puntos[i][0] + puntos[i + 1][0]) / 2
    const my = (puntos[i][1] + puntos[i + 1][1]) / 2
    d += ` Q${puntos[i][0]},${puntos[i][1]} ${mx},${my}`
  }
  const fin = puntos[puntos.length - 1]
  return `${d} L${fin[0]},${fin[1]}`
}

/** Camino SVG de una flecha. Mismo motivo que `caminoDeTrazo`. */
export function caminoDeFlecha(
  desde: [number, number],
  hasta: [number, number],
  curva: number,
): string {
  const [x1, y1] = desde
  const [x2, y2] = hasta
  if (curva === 0) return `M${x1},${y1} L${x2},${y2}`
  return `M${x1},${y1} Q${(x1 + x2) / 2},${(y1 + y2) / 2 - curva} ${x2},${y2}`
}

/**
 * Punto de referencia para mover un elemento.
 *
 * Cada tipo mide distinto: la pieza se apoya en `y`, el texto tiene ahí su
 * línea base, y el trazo y la flecha no tienen un punto propio, así que se
 * toma el primero. Sirve para que el arrastre trate a todos por igual.
 */
export function anclaDe(e: Elemento): [number, number] {
  if (e.tipo === 'trazo') return e.puntos[0] ?? [0, 0]
  if (e.tipo === 'flecha') return e.desde
  return [e.x, e.y]
}

/** Devuelve el elemento movido para que su ancla quede en (x, y). */
export function moverElemento(e: Elemento, x: number, y: number): Elemento {
  if (e.tipo === 'trazo') {
    const [ax, ay] = anclaDe(e)
    const ddx = x - ax
    const ddy = y - ay
    return { ...e, puntos: e.puntos.map(([px, py]) => [px + ddx, py + ddy] as [number, number]) }
  }
  if (e.tipo === 'flecha') {
    const ddx = x - e.desde[0]
    const ddy = y - e.desde[1]
    return {
      ...e,
      desde: [e.desde[0] + ddx, e.desde[1] + ddy],
      hasta: [e.hasta[0] + ddx, e.hasta[1] + ddy],
    }
  }
  return { ...e, x, y }
}

/**
 * Caja que envuelve al elemento, en unidades del dibujo.
 *
 * Es para COLOCAR cosas —el recuadro de selección, la barra de botones—, no
 * para saber si el dedo tocó el elemento: la caja de una diagonal larga cubre
 * media escena. Para acertar el toque en trazos y flechas se usa un calco de
 * la propia línea.
 */
export function cajaDe(e: Elemento, altoPieza: (p: NombrePieza) => number) {
  if (e.tipo === 'pieza') {
    const ancho = 46 * e.s
    const alto = altoPieza(e.pieza) * e.s
    return { left: e.x - ancho / 2, top: e.y - alto, ancho, alto }
  }
  if (e.tipo === 'texto') {
    const ancho = Math.max(e.texto.length * e.tam * 0.55, 30)
    return { left: e.x - ancho / 2, top: e.y - e.tam, ancho, alto: e.tam * 1.4 }
  }
  if (e.tipo === 'forma') {
    return { left: e.x, top: e.y, ancho: e.w, alto: e.h }
  }

  const puntos: [number, number][] =
    e.tipo === 'trazo'
      ? e.puntos
      : // En una curva cuadrática el punto más alto no es el de control sino
        // el del medio del recorrido; sin él la caja se queda corta.
        [e.desde, e.hasta, [(e.desde[0] + e.hasta[0]) / 2, (e.desde[1] + e.hasta[1]) / 2 - e.curva / 2]]

  const xs = puntos.map((p) => p[0])
  const ys = puntos.map((p) => p[1])
  const left = Math.min(...xs)
  const top = Math.min(...ys)
  return { left, top, ancho: Math.max(...xs) - left, alto: Math.max(...ys) - top }
}

/** Id corto y único dentro del documento. */
export function nuevoId(): string {
  return Math.random().toString(36).slice(2, 9)
}

/**
 * Valida un documento que viene de fuera (la base, o el asistente de IA).
 *
 * Se descarta lo que no encaja en vez de intentar arreglarlo: un elemento a
 * medias dibujaría mal y sería difícil de rastrear. Devolver un documento
 * siempre válido deja al renderizador sin ramas defensivas.
 */
export function sanearEscena(crudo: unknown): EscenaDoc {
  if (!crudo || typeof crudo !== 'object') return ESCENA_VACIA
  const d = crudo as Partial<EscenaDoc>

  const fondo: Fondo = FONDOS.includes(d.fondo as Fondo) ? (d.fondo as Fondo) : 'blanco'
  const lista = Array.isArray(d.elementos) ? d.elementos : []

  const num = (v: unknown, pordefecto = 0) =>
    typeof v === 'number' && Number.isFinite(v) ? v : pordefecto

  const elementos: Elemento[] = []
  for (const e of lista) {
    if (!e || typeof e !== 'object') continue
    const base = e as Record<string, unknown>
    const id = typeof base.id === 'string' ? base.id : nuevoId()

    if (base.tipo === 'pieza' && PIEZAS.includes(base.pieza as NombrePieza)) {
      const props: Record<string, string | number> = {}
      if (base.props && typeof base.props === 'object') {
        for (const [k, v] of Object.entries(base.props as Record<string, unknown>)) {
          if (typeof v === 'string' || typeof v === 'number') props[k] = v
        }
      }
      elementos.push({
        id, tipo: 'pieza', pieza: base.pieza as NombrePieza,
        x: num(base.x, 200), y: num(base.y, 180), s: num(base.s, 1) || 1, props,
      })
    } else if (base.tipo === 'texto' && typeof base.texto === 'string') {
      const anchor = base.anchor
      elementos.push({
        id, tipo: 'texto', x: num(base.x, 200), y: num(base.y, 110),
        texto: base.texto, tam: num(base.tam, 14) || 14,
        color: typeof base.color === 'string' ? base.color : '#312E81',
        anchor: anchor === 'start' || anchor === 'end' ? anchor : 'middle',
      })
    } else if (base.tipo === 'trazo' && Array.isArray(base.puntos)) {
      const puntos = (base.puntos as unknown[])
        .filter((p): p is [number, number] => Array.isArray(p) && p.length === 2 && p.every((n) => typeof n === 'number'))
      if (puntos.length >= 2) {
        elementos.push({
          id, tipo: 'trazo', puntos,
          color: typeof base.color === 'string' ? base.color : '#6366F1',
          grosor: num(base.grosor, 3) || 3,
        })
      }
    } else if (base.tipo === 'flecha' && Array.isArray(base.desde) && Array.isArray(base.hasta)) {
      elementos.push({
        id, tipo: 'flecha',
        desde: [num((base.desde as number[])[0]), num((base.desde as number[])[1])],
        hasta: [num((base.hasta as number[])[0], 100), num((base.hasta as number[])[1])],
        curva: num(base.curva, 0),
        color: typeof base.color === 'string' ? base.color : '#6366F1',
      })
    } else if (base.tipo === 'forma' && (base.forma === 'rect' || base.forma === 'elipse')) {
      elementos.push({
        id, tipo: 'forma', forma: base.forma,
        x: num(base.x, 150), y: num(base.y, 80),
        w: num(base.w, 100) || 100, h: num(base.h, 60) || 60,
        color: typeof base.color === 'string' ? base.color : '#C7D2FE',
      })
    }
  }

  return { fondo, elementos }
}
