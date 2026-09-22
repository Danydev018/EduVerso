# 09 — Plantillas de Actividad

Las plantillas son predefinidas por el desarrollador. Los docentes no pueden crear ni modificar plantillas — solo crear actividades a partir de ellas. Si se requiere una plantilla nueva, el desarrollador la agrega directamente en la base de datos.

## Estructura de una plantilla (JSONB)

```typescript
type Step = {
  index: number           // posición del paso (0-based)
  type: 'introduction'    // contenido explicativo
       | 'quiz'           // preguntas de opción múltiple o respuesta corta
       | 'challenge'      // ejercicio sin ayuda del agente
  title: string           // título visible al alumno
  description: string     // instrucción o enunciado del paso
  ai_enabled: boolean     // ¿el agente está disponible en este paso?
  ai_question_limit: number // preguntas disponibles (0 si ai_enabled = false)
  xp_reward: number       // XP que se otorga al completar este paso
  duration_minutes: number // tiempo estimado del paso (informativo)
}

type Template = {
  id: string
  name: string
  description: string
  steps: Step[]
}
```

---

## Plantilla 1: Exploración + Quiz

**Nombre:** `Exploración y Comprensión`
**Descripción:** Introduce un tema nuevo con contenido explicativo y valida comprensión con preguntas.
**Metodología:** Introducción espaciada + recuperación activa (Ebbinghaus).

```json
{
  "name": "Exploración y Comprensión",
  "description": "Introduce un tema nuevo y evalúa comprensión básica.",
  "steps": [
    {
      "index": 0,
      "type": "introduction",
      "title": "Exploremos el tema",
      "description": "Lee con atención. Puedes preguntarle a Profe Bot si algo no queda claro.",
      "ai_enabled": true,
      "ai_question_limit": 2,
      "xp_reward": 15,
      "duration_minutes": 5
    },
    {
      "index": 1,
      "type": "quiz",
      "title": "¿Qué aprendiste?",
      "description": "Responde las preguntas sobre lo que acabas de leer. Profe Bot puede darte pistas.",
      "ai_enabled": true,
      "ai_question_limit": 2,
      "xp_reward": 35,
      "duration_minutes": 10
    },
    {
      "index": 2,
      "type": "challenge",
      "title": "Reto final",
      "description": "Demuestra lo que aprendiste. Sin ayuda esta vez — tú puedes.",
      "ai_enabled": false,
      "ai_question_limit": 0,
      "xp_reward": 25,
      "duration_minutes": 5
    }
  ]
}
```

**XP total posible:** 75 + 25 (bonus completitud) = **100 XP**

---

## Plantilla 2: Práctica Guiada

**Nombre:** `Práctica con Guía`
**Descripción:** El agente introduce el proceso, luego el alumno practica con asistencia, y cierra con un ejercicio autónomo.
**Metodología:** Modelado → práctica guiada → práctica independiente (Gradual Release of Responsibility).

```json
{
  "name": "Práctica con Guía",
  "description": "El agente modela el proceso y acompaña la práctica antes del ejercicio autónomo.",
  "steps": [
    {
      "index": 0,
      "type": "introduction",
      "title": "Profe Bot te explica",
      "description": "Profe Bot te mostrará cómo resolver este tipo de problema. Puedes hacerle preguntas.",
      "ai_enabled": true,
      "ai_question_limit": 2,
      "xp_reward": 10,
      "duration_minutes": 5
    },
    {
      "index": 1,
      "type": "quiz",
      "title": "Practiquemos juntos",
      "description": "Resuelve estos ejercicios. Profe Bot puede darte una pista si la necesitas.",
      "ai_enabled": true,
      "ai_question_limit": 2,
      "xp_reward": 40,
      "duration_minutes": 15
    },
    {
      "index": 2,
      "type": "challenge",
      "title": "¡Ahora tú solo!",
      "description": "Un ejercicio final sin ayuda. Confía en lo que aprendiste.",
      "ai_enabled": false,
      "ai_question_limit": 0,
      "xp_reward": 30,
      "duration_minutes": 10
    }
  ]
}
```

**XP total posible:** 80 + 25 (bonus) = **105 XP**

---

## Plantilla 3: Repaso Espaciado

**Nombre:** `Repaso Rápido`
**Descripción:** Revisión de un tema ya visto. Más preguntas, menos explicación. Refuerza la memoria a largo plazo.
**Metodología:** Recuperación espaciada (spaced repetition, Ebbinghaus). Ideal para actividades de repaso 1-2 semanas después de la actividad original.

```json
{
  "name": "Repaso Rápido",
  "description": "Refuerza lo que ya aprendiste con preguntas de repaso y un reto cronometrado.",
  "steps": [
    {
      "index": 0,
      "type": "introduction",
      "title": "Recordemos",
      "description": "Un resumen breve del tema. ¿Lo recuerdas todo?",
      "ai_enabled": false,
      "ai_question_limit": 0,
      "xp_reward": 5,
      "duration_minutes": 3
    },
    {
      "index": 1,
      "type": "quiz",
      "title": "Quiz de repaso",
      "description": "8 preguntas sobre el tema. Profe Bot puede darte una pista si la necesitas.",
      "ai_enabled": true,
      "ai_question_limit": 2,
      "xp_reward": 50,
      "duration_minutes": 12
    },
    {
      "index": 2,
      "type": "challenge",
      "title": "Reto relámpago",
      "description": "El ejercicio más difícil. Sin ayuda. ¡Tú puedes!",
      "ai_enabled": false,
      "ai_question_limit": 0,
      "xp_reward": 20,
      "duration_minutes": 5
    }
  ]
}
```

**XP total posible:** 75 + 25 (bonus) = **100 XP**

---

## SQL para sembrar las plantillas

```sql
insert into activity_templates (name, description, steps) values
(
  'Exploración y Comprensión',
  'Introduce un tema nuevo y evalúa comprensión básica.',
  '[
    {"index":0,"type":"introduction","title":"Exploremos el tema","description":"Lee con atención. Puedes preguntarle a Profe Bot si algo no queda claro.","ai_enabled":true,"ai_question_limit":2,"xp_reward":15,"duration_minutes":5},
    {"index":1,"type":"quiz","title":"¿Qué aprendiste?","description":"Responde las preguntas sobre lo que acabas de leer. Profe Bot puede darte pistas.","ai_enabled":true,"ai_question_limit":2,"xp_reward":35,"duration_minutes":10},
    {"index":2,"type":"challenge","title":"Reto final","description":"Demuestra lo que aprendiste. Sin ayuda esta vez — tú puedes.","ai_enabled":false,"ai_question_limit":0,"xp_reward":25,"duration_minutes":5}
  ]'::jsonb
),
(
  'Práctica con Guía',
  'El agente modela el proceso y acompaña la práctica antes del ejercicio autónomo.',
  '[
    {"index":0,"type":"introduction","title":"Profe Bot te explica","description":"Profe Bot te mostrará cómo resolver este tipo de problema. Puedes hacerle preguntas.","ai_enabled":true,"ai_question_limit":2,"xp_reward":10,"duration_minutes":5},
    {"index":1,"type":"quiz","title":"Practiquemos juntos","description":"Resuelve estos ejercicios. Profe Bot puede darte una pista si la necesitas.","ai_enabled":true,"ai_question_limit":2,"xp_reward":40,"duration_minutes":15},
    {"index":2,"type":"challenge","title":"¡Ahora tú solo!","description":"Un ejercicio final sin ayuda. Confía en lo que aprendiste.","ai_enabled":false,"ai_question_limit":0,"xp_reward":30,"duration_minutes":10}
  ]'::jsonb
),
(
  'Repaso Rápido',
  'Refuerza lo que ya aprendiste con preguntas de repaso y un reto cronometrado.',
  '[
    {"index":0,"type":"introduction","title":"Recordemos","description":"Un resumen breve del tema. ¿Lo recuerdas todo?","ai_enabled":false,"ai_question_limit":0,"xp_reward":5,"duration_minutes":3},
    {"index":1,"type":"quiz","title":"Quiz de repaso","description":"8 preguntas sobre el tema. Profe Bot puede darte una pista si la necesitas.","ai_enabled":true,"ai_question_limit":2,"xp_reward":50,"duration_minutes":12},
    {"index":2,"type":"challenge","title":"Reto relámpago","description":"El ejercicio más difícil. Sin ayuda. ¡Tú puedes!","ai_enabled":false,"ai_question_limit":0,"xp_reward":20,"duration_minutes":5}
  ]'::jsonb
);
```

## Formato de quiz en `activities.ai_context` (Semana 5, provisional)

Todavía no existe una tabla dedicada a preguntas. Mientras tanto, cuando un
paso de tipo `quiz` se renderiza al alumno, el frontend intenta parsear
`activities.ai_context` como opción múltiple con este formato
(`lib/quiz.ts`):

```
P: ¿Cuánto es 2 + 2?
A) 3
B) 4 *
C) 5
D) 6

P: ¿Cuál es la capital de Francia?
A) Madrid
B) París *
C) Roma
```

- Cada pregunta empieza con `P:`.
- Cada opción es una línea `Letra) texto`.
- La opción correcta se marca con un `*` al final.
- Las preguntas se separan con una línea en blanco.

Si `ai_context` no sigue este formato (por ejemplo, es una nota libre para
el agente), el paso se muestra sin preguntas — sigue funcionando como antes,
solo sin la validación de opción múltiple. Los pasos de tipo `challenge`
no leen este formato: se muestran solo con su `description`, sin ícono ni
ayuda del agente (ya que sus plantillas seedeadas siempre tienen
`ai_enabled: false`).

## Cómo agregar una plantilla nueva

1. Definir el arreglo `steps` siguiendo el tipo `Step` definido arriba.
2. Insertar directamente en la base de datos via SQL Editor de Supabase.
3. La nueva plantilla aparece automáticamente en el selector del docente sin cambios en el frontend.
4. Documentar la nueva plantilla en este archivo antes de insertarla.

## Repaso en el repositorio (migración 11)

El repaso "Antes de empezar" vive en `activity_briefing_blocks`, colgado de
una actividad concreta. Eso dejaba un hueco: una evaluación del banco no podía
llevar repaso, así que el docente que la asignaba mandaba al alumno directo a
responder, sin contexto.

`activity_bank.briefing` guarda ahora sus propios párrafos (jsonb, arreglo de
textos) y `assignFromBank()` los copia como bloques de texto de la actividad
nueva. Se copia, no se referencia: el docente puede ajustar el repaso de su
salón sin tocar el banco.

Es un arreglo de textos y no bloques completos porque el contenido semilla no
puede traer imágenes ni audios (no hay archivos que subir), y párrafos es
exactamente lo que hace falta para explicar con ejemplos.

### Forma de los repasos sembrados

Los 78 repasos siguen la misma estructura, que es la que funciona:

1. el concepto en palabras llanas;
2. un ejemplo **resuelto**, con números o frases concretas;
3. el error típico, dicho como advertencia amable.

El objetivo es que el alumno pueda responder solo con leer el repaso. Profe Bot
queda como red de seguridad y no como requisito: un niño sin datos, o con el
agente saturado, tiene que poder resolver igual.

### Cuidado al sembrar contenido por SQL

`getSubjects()` y `getTopics()` están cacheadas una hora (`lib/reference-data.ts`).
Sembrar temas directo en la base **no** dispara `revalidateTag`, así que el
repositorio sigue mostrando el conteo viejo hasta que la caché expire. Se vio
en la práctica: la base tenía 14 evaluaciones para 4to y la página mostraba 9.
No es un error de la caché sino del camino de escritura; al reiniciar el
servidor aparecieron las 14.

## Lecciones ilustradas (migración 12)

El repaso de una actividad son tres párrafos: alcanza para recordar, no para
**entender** algo por primera vez. Los temas con mecanismo detrás (fracciones,
porcentajes, el ciclo del agua, las cadenas alimentarias) necesitan más
espacio y una imagen que se mueva mostrando ese mecanismo.

`topic_lessons` cuelga del TEMA y no de la actividad: el mecanismo de las
fracciones es el mismo sin importar qué evaluación arme el docente, así que se
escribe una vez y la aprovechan todas las actividades de ese tema.

### Cómo está armado

- `pages` es un arreglo de páginas: `{ art, title, body, labels?, values? }`.
- `art` es el **id** de la ilustración, no un componente: la base no puede
  guardar JSX. `lesson-scenes.tsx` traduce ese id al dibujo; un id que no
  exista muestra la página sin imagen en vez de romper la lectura.
- Las 14 escenas son **parametrizables**, así una misma sirve a varias
  lecciones: el diagrama de ciclo vale para el agua y para cualquier proceso
  circular; el de barras, para comparar fracciones y porcentajes.
- Todo el movimiento es CSS y las escenas son Server Components: la lección se
  lee en teléfonos modestos sin costar JavaScript.

### Criterio de redacción

Las páginas se escriben para **leerse seguido**, no para consultarse: cada una
retoma el ejemplo de la anterior. La última página de varias lecciones está
dedicada al error típico (evaporación vs condensación, área vs perímetro,
0,5 vs 0,45), porque es donde se pierde la mayoría.

### Detalle de dibujo que costó

Los rótulos del diagrama circular se montaban sobre los números y el de arriba
se salía del recuadro. La causa: todos los textos iban centrados en un punto a
distancia fija del centro, y las palabras largas se extendían hacia atrás. Se
resolvió anclando el texto **según su lado** (`start` a la derecha, `end` a la
izquierda, `middle` arriba y abajo) y achicando el radio.

## Ilustraciones de las lecciones

Las lecciones (`topic_lessons`) son páginas con texto y una escena SVG. La
escena se nombra por `art` y se resuelve contra el registro de
`lesson-scenes.tsx`. Un `art` desconocido no rompe la lectura: la página se
muestra sin ilustración.

### El kit: `lesson-art.tsx`

Una escena NO se dibuja desde cero. Se compone con piezas ya ilustradas:
`Persona`, `Arbol`, `Montana`, `Sol`, `Vaso`, `Casa`, `Edificio`, `Libro`,
`Bombillo`, `Panel`, `Bandera`, `Papel`, `Jarra`, `Balanza`, más las de
diagramación (`Flecha`, `Pin`, `Panel2`, `Texto`).

Todas reciben `x`/`y` (punto de apoyo) y `s` (escala), así que colocarlas en
el lienzo de 400×220 es como pegar calcomanías:

```tsx
<Marco>
  <Defs />
  <Suelo y={170} pasto />
  <Arbol x={80} y={170} s={1.2} />
  <Persona x={200} y={170} pose="saluda" ropa="#2563EB" />
  <Flecha desde={[120, 140]} hasta={[180, 140]} />
  <Pin x={200} y={110} texto="aquí" hacia={[200, 150]} />
</Marco>
```

`<Defs />` va una vez por escena: ahí viven los degradados y las sombras.

### Por qué las piezas llevan tanto detalle

Un dibujo hecho de rectángulos planos se lee como esquema y el alumno lo
saltea. Cada pieza usa tres recursos baratos que cambian si la figura se
percibe como una COSA o como una forma:

- **volumen**: degradado en vez de color plano;
- **apoyo**: elipse difusa bajo el objeto, para que no flote;
- **brillo**: un reflejo donde daría la luz.

La luz viene siempre de arriba a la izquierda. Una pieza nueva que no respete
esa dirección desentona con el resto.

Detalles concretos que hacen la diferencia: el cuello de `Persona` (sin él la
cabeza parece pegada al torso), el mechón que rompe el círculo de la cabeza,
la copa irregular de `Arbol` (una circular se lee como globo), la banda de
reflejo de `Vaso` (sin ella es un rectángulo azul) y la esquina doblada de
`Papel`.

### Cobertura actual

73 lecciones para 73 temas, 260 páginas, **ninguna sin ilustración**, con 52
escenas registradas y todas en uso.

## El docente arma sus propias lecciones

`/teacher/lecciones` lista los temas de su grado con su lección, o sin ella.
`/teacher/lecciones/[topicId]` es el editor. No hay que escribir código: se
elige una escena del catálogo y se llenan sus campos, con vista previa en vivo.

### Qué hizo falta abrir

- **RLS**: `topic_lessons` solo la escribía coordinación. Ahora también el
  docente, pero acotado por `teaches_topic()` a los temas del grado que dicta.
  Sin ese límite, un docente de 1er grado podría reescribir la lección de 6to.
- **Índice único** por `topic_id`: la página del alumno lee con `maybeSingle()`
  y con dos lecciones para un tema devolvería error en vez de contenido.
- **Bucket `lesson-media`**: para lo que ninguna escena explica (una foto del
  patio, la voz del docente). Va aparte de `activity-media` porque aquel
  decide el permiso leyendo un `activity_id` de la ruta, y una lección cuelga
  de un tema, no de una actividad.

### El catálogo (`scene-catalog.ts`)

Describe cada escena en el idioma del docente: nombre, para qué sirve, y la
pista de cada campo ("Región 1", "Qué hace la raíz"). Vive aparte de
`lesson-scenes.tsx` para que el editor no arrastre las 52 escenas al bundle
solo para mostrar un desplegable.

Cada entrada guarda además su `ejemplo`, y eso NO es decorativo: al elegir una
escena el editor copia esos valores. Pasar `labels: []` parecía equivalente y
no lo es — un arreglo vacío **no** activa los valores por defecto de la
función, así que `labels[0]` quedaba `undefined` y la escena reventaba al
leerlo. El editor crasheaba al elegir cualquier escena hasta que se corrigió.
`Pin` además tolera ahora un rótulo sin definir.

### Vista previa

`/teacher/lecciones/[topicId]/preview` monta el mismo lector del alumno. No se
reutiliza `/student/lecciones/...` porque esa ruta exige rol de alumno y el
docente quedaba rebotado a su panel.

## Lienzo de diseño (escenas propias)

Tercera forma de ilustrar una página, junto a "escena del catálogo" y "foto o
audio". El docente arrastra piezas, dibuja encima y ajusta, sin escribir código.

### El cambio de fondo: escena como DATO

Las 52 del catálogo son **funciones**: alguien las programó. Una escena armada
arrastrando piezas no puede serlo, así que se guarda como documento JSON dentro
de la propia página de la lección (`page.escena`, ver `lib/scene-doc.ts`):

```json
{ "fondo": "campo",
  "elementos": [
    {"id":"a1","tipo":"pieza","pieza":"Sol","x":60,"y":70,"s":1},
    {"id":"a2","tipo":"flecha","desde":[80,90],"hasta":[200,170],"curva":0,"color":"#F97316"}
  ] }
```

`CustomScene` lo dibuja y `SceneCanvas` lo edita. No hizo falta tabla nueva.

**Regla al agregar un tipo de elemento**: todo debe describirse con números y
textos planos. Algo que no sobreviva a `JSON.stringify` se pierde al guardar.

### Decisiones del lienzo

- Se trabaja en coordenadas del dibujo (400×220), no en píxeles: el mismo
  documento se ve igual en el teléfono del docente y en la pantalla del alumno.
- El recuadro de selección va en HTML **encima** del SVG. Meterlo dentro
  obligaría a que cada pieza informara su tamaño real, y las piezas del kit solo
  conocen su punto de apoyo.
- La paleta se puede arrastrar **y** tocar. Con el dedo no existe `dragstart`,
  así que sin el segundo camino la paleta sería inútil en tablet, que es donde
  más se usaría.
- Las piezas añadidas por toque se escalonan: si cayeran todas en el centro, la
  de arriba taparía el agarre de las de abajo y quedarían imposibles de separar.
- El trazo del pincel descarta puntos a menos de 2 unidades del anterior; sin
  eso un trazo corto guarda cientos de puntos y el documento se infla.

### Editar lo que ya está puesto

Tres cosas que faltaban y se agregaron después de probar el lienzo a mano:

**Borrador** (herramienta aparte del pincel). Quita solo lo dibujado —trazos,
formas y flechas—; las piezas del kit no las toca nunca. La decisión está en
`alcanzadoPorBorrador()`, que devuelve `false` para `tipo === 'pieza'` sin
mirar la distancia: es más claro que confiar en que el docente apunte bien.
Para trazos mide la distancia punto-a-segmento tramo por tramo, así que borra
donde se ve la línea y no dentro de su caja envolvente. Un gesto entero cuenta
como UN paso de historial: si cada trazo borrado fuese uno propio, deshacer
habría que pulsarlo una vez por línea.

**Escribir el texto.** Antes solo se podía mover. Ahora al colocarlo se abre
la escritura sola, sobre el lienzo y con el texto de muestra preseleccionado,
porque quien pone un texto es porque tiene algo que escribir. Se vuelve a
abrir con doble toque o con el lápiz de los controles. Un texto que se deja en
blanco se descarta: vacío no se dibuja y no tiene recuadro que tocar, así que
quedaría en el documento sin manera de volver a él ni de quitarlo.

**Controles flotantes sobre el elegido**: lápiz (solo texto), traer al frente,
mandar atrás y eliminar. Antes esos botones vivían solo en el panel de ajustes
de más abajo, que en una pantalla normal queda fuera de vista mientras se mira
el dibujo: se seleccionaba algo y no pasaba nada visible. La barra se coloca
arriba del elemento, y si no cabe —elemento pegado al borde superior— se pasa
abajo o dentro; el lienzo recorta lo que se sale, y sin eso los botones
existían pero no se veían.

### La forma del editor

El editor era una pila de siete bandas: modo, frase de ayuda, herramientas,
colores junto a Deshacer, fondo, la fila lienzo+paleta, y dos tarjetas sueltas
debajo (ajustes y asistente). El lienzo ocupaba el 12 % del área y había
**257 px de vacío negro** bajo él, porque la paleta medía 512 y el dibujo 255.

Ahora es un solo marco con todo dentro, y cada cosa vive junto a lo que
modifica:

- **Riel de herramientas pegado al lienzo**, con los colores debajo de una
  divisoria: los colores modifican lo que dibujan las herramientas, no tenían
  nada que hacer al lado de Deshacer. El riel lleva icono Y nombre; quien usa
  esto lo abre una vez por lección, y un riel de iconos pelados castiga justo
  a quien menos práctica tiene.
- **Deshacer y Vaciar arriba**, con el recuento de elementos: son acciones del
  documento, del mismo rango que el modo.
- **Fondo soldado bajo el lienzo**: es una propiedad de esa superficie.
- **Inspector en una franja horizontal**, no en tarjeta al final. Antes se
  elegía una pieza y sus ajustes salían media pantalla más abajo, fuera de la
  vista.
- **El asistente en tres filas**: una línea de texto con el botón al lado. El
  recuadro de varias líneas ocupaba más alto que el propio lienzo y nadie lo
  llenaba. Ojo: `Enter` ahí dentro **tiene que** cancelarse a mano, o enviaría
  el formulario de la lección y la guardaría a media edición.

Resultado medido: lienzo de 463×255 a 632×347 (86 % más superficie de dibujo),
editor de 1050 px de alto a 640, y el instrumento completo entra en una
pantalla.

#### Tres cosas que costaron un intento fallido

**El ancho lo da la PÁGINA, no un margen negativo.** El primer intento sacó el
panel del `max-w-3xl` con `-mx-28`; como el contenido de la página va alineado
a la izquierda y no centrado, medio editor se salió de la pantalla, y la mitad
que quedaba se veía flotando fuera de su tarjeta. La página de edición se
ensancha en `xl` y los campos de texto se limitan ellos mismos: un editor no
es un artículo, pero un párrafo sigue necesitando renglones legibles.

**La paleta no debe mandar en la altura.** Sale del flujo con `absolute` en
`md+`, así la celda se estira a la altura del lienzo por el `stretch` del grid
y se desplaza por dentro. Eso es lo que quita el vacío. En móvil no aplica:
ahí va apilada y tiene que ocupar lo que ocupe.

**El riel solo se pone de pie si hay ancho que lo pague.** En tablet el lienzo
se estrecha y el riel vertical (375 px) volvía a ser más alto que el dibujo,
con el mismo hueco debajo. Desde `lg` es vertical; por debajo cruza arriba en
horizontal y la altura vuelve a mandarla el lienzo.

#### El lienzo no se mueve

El control de Grosor aparecía solo con el pincel, y al aparecer cambiaba el
alto del riel: **el lienzo saltaba bajo el cursor** justo al cambiar de
herramienta. Ahora el hueco está siempre reservado y el control se oculta.
Comprobado en los siete cambios de herramienta: misma x, misma y, mismo ancho.

### El kit: 131 piezas

De 16 a **131**. Las nuevas viven en cuatro archivos por tema —
`lesson-art-math`, `-nature`, `-body`, `-world` — no porque sean distintas,
sino porque 131 componentes no caben en un archivo legible. El estilo sale
entero de `lesson-art.tsx`: base en y=0, centro en x=0, luz de arriba a la
izquierda, y los tres trucos de siempre (volumen, apoyo, reflejo).

Catorce categorías: personas y lugares, naturaleza, objetos, números y medida,
figuras, plantas, animales, cielo y clima, cuerpo, comida, escuela y objetos,
transporte, lugares, símbolos.

Tres criterios que se repitieron al dibujarlas:

- **Los animales van de perfil.** De frente hay que resolver la simetría de la
  cara y salen caricaturas; de perfil la silueta sola ya dice qué animal es.
- **Los órganos van esquemáticos.** Un corazón anatómico exacto asusta y no
  enseña más que uno reconocible.
- **Los vehículos apoyan las ruedas en y=0**, para que compartan suelo con las
  personas y los árboles. En tres cuartos se ven mejor sueltos pero no se
  alinean con nada.

Dos piezas hubo que rehacerlas tras verlas en pantalla, que es la única prueba
que vale para esto:

- El **corazón** llevaba los vasos como dos trazos finos y largos hacia arriba
  y se leían como antenas. En una figura simplificada, un tubo solo parece tubo
  si tiene grosor parecido al del cuerpo del que sale.
- La **arepa** era un disco amarillo con una raya. Lo que la hace arepa es el
  relleno ASOMANDO por el corte: ahora el queso sale un poco por los lados.

#### Texto dentro de una pieza

`TarjetaLetra`, `Moneda` y `Billete` dibujan texto (la letra, el valor) y ese
texto era una prop sin manera de cambiarla: una tarjeta de letra cuya letra no
puedes escribir no sirve para nada. `PiezaMeta.opciones` ganó un tipo `texto`
y el inspector le pone su campo.

#### Registro en cuatro sitios

Una pieza nueva hay que darla de alta en `PIEZAS`, `PIEZAS_META`,
`GRUPOS_PIEZAS` (los tres en `lib/scene-doc.ts`) y `REGISTRO`
(`custom-scene.tsx`). TypeScript caza tres de los cuatro porque `REGISTRO` es
un `Record<NombrePieza, …>` exhaustivo; el que se escapa es el grupo, así que
conviene comprobar que ninguna pieza se quedó sin categoría.

#### El asistente también tuvo que enterarse

`scene-assistant` lleva su propia copia de la lista, y ahora va **por grupos**:
con más de cien nombres seguidos el modelo se pierde y acaba inventando piezas
parecidas ("Arbolito", "Nube2"). Agrupado ocupa lo mismo y encuentra por tema.
Si la lista de la función y `GRUPOS_PIEZAS` se separan, el síntoma es que el
asistente pide piezas que nunca aparecen: `sanearEscena` las descarta en
silencio.

### La paleta de piezas

Antes era una lista de nombres debajo del lienzo. Ahora va **al lado**, con las
piezas **dibujadas** y agrupadas. Un nombre escrito obliga a imaginarse el
dibujo; la miniatura se reconoce de un vistazo, que es lo que hace falta
mientras se arma una escena.

Se mantienen las dos formas de usarla: arrastrar al punto exacto, o tocar para
que caiga en el centro. Con el dedo no existe `dragstart`, así que sin el
segundo camino la paleta sería inútil en tablet.

**Las categorías van plegadas.** Con catorce y más de cien piezas, todo abierto
obliga a desplazarse un buen rato para ver qué hay; cerrado se lee el índice
completo de un vistazo —cada uno con su recuento— y se abre solo lo que hace
falta. Va con `<details>`, que trae plegado, teclado y semántica de fábrica.
Las piezas se quedan en el DOM aunque estén cerradas, y eso está bien: el
`getBBox()` de las miniaturas mide igual, así que al abrir una categoría las
piezas ya vienen encuadradas y no se ve ningún reajuste.

Los nombres de grupo van en caja baja: las versales seguidas son más lentas de
leer y en una columna estrecha no aportan jerarquía que el tamaño y el color no
den ya.

**Los grupos son por lo que la pieza ES** —Personas y lugares, Naturaleza,
Objetos—, no por materia. El catálogo de escenas sí se agrupa por materia
porque cada escena enseña un tema; una pieza suelta no: la persona aparece lo
mismo en sociales que en naturaleza.

**El marco de cada miniatura se MIDE, no se calcula.** La tentación es armarlo
con el `alto` de `PIEZAS_META`, pero ese número es una estimación para colocar
la pieza en el lienzo, no su caja real: el sol declara 34 y con los rayos mide
67. Con esa cuenta siete de las dieciséis se salían del marco. `getBBox()` da
la caja de verdad, así que la paleta sigue bien si mañana alguien retoca un
dibujo o suma una pieza al kit. Hasta que se mide se usa un marco holgado que
contiene a cualquiera: nunca recorta, a lo sumo se ve pequeña un instante.

La paleta pasa al lado desde tablet (`md`), no desde escritorio: es el tamaño
en el que el docente arma las escenas, y ahí antes quedaba debajo. En teléfono
sigue apilada, que es lo único que cabe.

`REGISTRO` —el mapa de nombre a componente— se exporta desde `CustomScene` y lo
usan las dos. Con dos registros, sumar una pieza al kit y olvidarse de uno
dejaría paleta y dibujo en desacuerdo sin que nada fallara.

### Agarrar un trazo o una flecha

Al principio no se podían seleccionar: se dibujaban, se podían borrar con el
borrador, pero tocarlos no hacía nada. Darles el recuadro de los demás no
servía: **la caja de una diagonal larga cubre media escena** y se habría
tragado todo lo que tuviera debajo.

La solución es un calco: un duplicado invisible y grueso (línea + 14) de la
propia línea, en una capa SVG sobre el dibujo, con `pointer-events: stroke`.
Se agarra justo donde se ve la línea; a dos centímetros ya no. Comprobado:
tocar la diagonal la selecciona, y tocar la esquina de su caja deselecciona,
que es lo correcto.

El camino del calco sale de `caminoDeTrazo()` y `caminoDeFlecha()`, ahora en
`lib/scene-doc.ts` y compartidas con quien las dibuja (`CustomScene` y el
`Flecha` del kit). Si cada uno calculara el suyo, bastaría con tocar una de
las dos fórmulas para que el agarre dejara de coincidir con la línea.

Arrastrarlos mueve la línea entera, que es lo que se espera. Para eso el
arrastre dejó de asumir que todo elemento tiene `x`/`y`: `anclaDe()` da el
punto de referencia de cada tipo —el primer punto en un trazo, `desde` en una
flecha— y `moverElemento()` traslada lo que haga falta. El recorte al borde
sigue aplicándose al ancla, igual que en las piezas.

El envoltorio HTML de estos dos elementos lleva `pointerEvents: 'none'`: existe
solo para colocarles la barra de botones. Si aceptara toques volvería el
problema de la caja gigante que el calco vino a resolver.

### Los escuchas del gesto van en `window`

`pointermove` y `pointerup` se enganchan a `window` mientras dura un gesto, no
al div del lienzo. Es la misma lección que ya estaba anotada en
`lib/use-draggable.ts`, y acá volvió a aparecer: con los escuchas en el
elemento, un dedo que sale del lienzo —o un `pointerup` que se pierde— deja el
gesto abierto para siempre. Se reprodujo: el trazo en curso se quedaba pegado
en pantalla y el pincel no volvía a funcionar hasta recargar la página.
`setPointerCapture` era el parche, pero **puede lanzar**, así que no sirve de
garantía. En `window` no hay de dónde salirse.

Dos fallos más que salieron al revisar esto:

- `deshacer()` avisaba al editor **dentro** del updater de `setHistorial`.
  React corre esos updaters en fase de render, así que era actualizar el padre
  mientras el hijo se dibujaba (aviso de React en consola). El aviso va fuera.
- El arrastre anotaba en el historial el documento **ya movido**, porque el
  movimiento se aplica en vivo. Deshacer no devolvía nada. Ahora el arrastre
  se lleva consigo el documento de antes de empezar.

### El asistente (`scene-assistant`)

El docente escribe qué quiere y la función devuelve el documento ya modificado.
**No dibuja libremente**: recibe un vocabulario cerrado —las piezas del kit, el
lienzo, los tipos de elemento— y responde en JSON con él. Lo que vuelve pasa
por `sanearEscena()` antes de tocar el lienzo, que descarta lo que no encaja en
vez de intentar arreglarlo.

Latencia medida sobre varias corridas: **mediana 8 s** (7-11 s), con un
arranque en frío de la Edge Function que llegó a **34 s**. Es más lento que
los otros asistentes (1-2 s) porque devuelve el documento entero y no una
frase. Sirve para preparar una clase; no conviene prometerlo en vivo frente a
un grupo, sobre todo por el arranque en frío.

### Lo que verificó la auditoría

`sanearEscena()` se probó contra 17 entradas hostiles (pieza inventada, trazo
de un solo punto, `x` no numérico, props con objetos anidados, tipo de
elemento desconocido, `elementos` que no es arreglo): las 17 correctas.

Permisos de la función: 403 para alumno, 401 sin sesión, 400 sin instrucción.

Comportamiento: conserva los elementos previos, respeta el fondo, no saca
nada del lienzo y no inventa nombres de pieza. Una instrucción sin sentido
devuelve la escena intacta en vez de romperla.


### Un detalle del arrastre

El recorte al borde se aplica al PUNTO DE APOYO de la pieza, no a su caja. Una
pieza arrastrada al extremo derecho queda con su ancla dentro pero su mitad
visible fuera del lienzo. Es intencional —permite un sol asomando por la
esquina— pero conviene saberlo: no es un fallo del recorte.

---

## El quiz calificado

Hasta la migración 14 el quiz se corregía **en el navegador**: la página
parseaba `activities.ai_context`, le pasaba al cliente el índice de la
respuesta correcta, y el cliente comparaba. El servidor nunca se enteraba del
resultado, y el XP se otorgaba por completar el paso sin mirar el puntaje.

Eso tenía dos consecuencias. La respuesta viajaba al navegador, y además el
alumno podía pedir `ai_context` por la API con su propio token y leer todas las
respuestas antes de contestar — lo detectó `tests/e2e/seguridad/02-alumno.spec.ts`.

### Lo que cambió

**La clave de respuestas se mudó de columna a tabla.** RLS es por FILA, no por
columna: mientras la clave viviera en `activities.ai_context`, cualquier
política que le dejara ver su actividad se la dejaba ver entera. Ahora está en
`activity_quizzes`, cuya política solo admite coordinación y al docente dueño
del salón. A `ai_context` se le quitaron los asteriscos: conserva las preguntas
—le sirven de contexto al tutor y el alumno las necesita para resolver— sin
revelar cuál es la correcta.

**El parser vive en SQL.** `quiz_parsear()` es el único autoritativo. Podría
haberse duplicado la lógica de `lib/quiz.ts` en la Edge Function, pero entonces
habría dos parsers: el que muestra las opciones y el que corrige. Si se
separaran, el alumno vería una lista y se le calificaría contra otra, y el fallo
sería silencioso.

**La corrección va pregunta por pregunta**, no al cerrar el paso. Se podría
calificar todo junto en una sola llamada, pero la interacción que ya existía
—elegir, comprobar, ver al instante si acertó y cuál era— es justamente lo
formativo del quiz. Calificar al final obligaría a contestar a ciegas. El costo
es un viaje al servidor por pregunta, aceptable con tres o cuatro preguntas y
el alumno ya en línea.

**Solo cuenta el primer intento.** La restricción única de `quiz_results` es lo
que hace que el porcentaje signifique algo: sin ella bastaría insistir hasta
acertar. La función devuelve la corrección aunque la respuesta ya estuviera
registrada, para que recargar la página no rompa la pantalla, pero no la vuelve
a contar. Reintentar en la interfaz sigue permitido —sirve para repasar— y el
servidor simplemente lo ignora.

### La fórmula del XP

```
xp_paso = ceil(xp_reward × (0.4 + 0.6 × acierto))
```

El piso de 0,4 es una decisión, no un descuido. Con piso 0 un niño que se
equivoca en todo se iría con cero y la plataforma lo estaría castigando; con
piso 1 —como estaba— la puntuación no mide nada. El piso reconoce el esfuerzo
de haberlo hecho y el resto premia haberlo entendido.

El bono de 25 XP por cerrar la actividad **no** se pondera: es por llegar al
final.

Ejemplo verificado: paso de 15 XP con 50% de acierto → `ceil(15 × 0.7) = 11`.

El acierto lo calcula la base con `quiz_acierto()` leyendo `quiz_results`. **El
cliente no manda su nota**: solo avisa que terminó el paso.

### Métrica

`quiz_stats` (vista) da respondidas, correctas y porcentaje por alumno y
actividad. Hereda RLS de `quiz_results`: el alumno ve lo suyo, el docente lo de
su salón, coordinación todo.

### Sobre la propuesta del Capítulo I

El §4 promete que las interacciones **no interfieran de manera punitiva con las
calificaciones formales**. Eso sigue siendo cierto: el acierto afecta al XP y a
la métrica interna, no a la nota ante el Ministerio. Conviene no confundir los
dos sentidos de "punitivo" al redactar el capítulo.

### Lo que arrastró el cambio

Mover la clave de columna a tabla rompió cuatro lugares que leían
`ai_context` esperando encontrar marcas. TypeScript cazó uno (el tipo del quiz
perdió `correctIndex`); los otros tres había que buscarlos:

| Dónde | Qué pasaba | Arreglo |
|---|---|---|
| Página del alumno | `parseQuiz(ai_context)` devolvía vacío: **el quiz desaparecía** | Lee por `quiz_para_alumno` |
| Editor del docente | Abría sus preguntas sin ninguna marcada y al guardar perdía la clave | Lee de `activity_quizzes` |
| Vista previa del docente | El quiz no se mostraba | Lee de `activity_quizzes` |
| Las tres acciones que guardan | Volvían a dejar las marcas en `ai_context` | `guardarClaveYLimpiar()` |

El repositorio del banco no se toca: `activity_bank.content` conserva sus
marcas, y al asignar se desdobla como cualquier otra actividad.
