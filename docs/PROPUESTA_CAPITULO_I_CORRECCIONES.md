# Secciones corregidas de la Propuesta — Capítulo I

Documento de trabajo para comparar contra `PROPUESTA_CAPITULO_I_EDUVERSO.md`.
Solo se reescriben las secciones 2, 3 y 5; las secciones 1 y 4 se mantienen,
salvo los dos ajustes puntuales indicados al final.

Criterio de la corrección: **el documento debe describir el sistema que existe.**
Donde el producto creció más allá de lo declarado, se amplía el alcance; donde
el documento promete fundamentos que el producto no implementa, se retira la
cita en lugar de fingir la función.

---

## 2. PROBLEMA OBJETO (PLANTEAMIENTO DEL PROBLEMA)

En el contexto global contemporáneo, la transformación digital de las
instituciones educativas ha dejado de ser una innovación opcional para
convertirse en una exigencia estructural. La Organización de las Naciones
Unidas para la Educación, la Ciencia y la Cultura (Unesco, [AÑO — ver nota 1])
señala que existe una creciente presión por el acceso y la modernización de la
educación en Latinoamérica y el Caribe, destacando la necesidad de integrar las
tecnologías de la información como catalizadores del proceso formativo. En el
ámbito nacional, Vidal ([AÑO — ver nota 2]) menciona que en Venezuela se ha
vivido un proceso histórico de expansión educativa en todos sus niveles, el cual
demanda hoy en día herramientas tecnológicas que acompañen el volumen y la
complejidad de la gestión académica moderna.

A pesar de este panorama, los paradigmas de enseñanza y administración en muchas
escuelas de educación primaria continúan anclados a metodologías tradicionales.
Desde la perspectiva pedagógica, la literatura especializada evidencia que la
falta de estímulos adecuados en el hogar reduce el compromiso del estudiante, y
que el material de refuerzo disponible suele reducirse a texto sin apoyo visual.
Mayer (2009), en su teoría cognitiva del aprendizaje multimedia, sostiene que el
estudiante construye representaciones más duraderas cuando la palabra y la
imagen se presentan de forma integrada y coordinada, y que todo elemento ajeno
al objetivo de aprendizaje compite por una capacidad de procesamiento limitada.
En la misma línea, Sweller (2011) advierte que fragmentar el contenido en
unidades mínimas —una idea por pantalla— reduce la carga cognitiva extrínseca y
libera recursos para la comprensión. Complementariamente, Kapp (2012) argumenta
que la aplicación de mecánicas de gamificación educativa resulta fundamental
para despertar la motivación intrínseca del estudiante, transformando el
cumplimiento de asignaciones extraescolares en una práctica sostenida. Por
último, la asistencia que el sistema ofrece durante la resolución de ejercicios
se fundamenta en la noción de andamiaje derivada de la zona de desarrollo
próximo de Vygotsky (1978): el apoyo debe orientar al estudiante hacia la
respuesta sin sustituir su razonamiento, y retirarse a medida que gana autonomía.

En la institución educativa abordada en la presente investigación, esta brecha
tecnológica y metodológica se manifiesta a través de deficiencias operativas
concretas que consumen recursos valiosos. La gestión de datos es un proceso
enteramente manual y vulnerable a errores; el control del ciclo de vida
académico del estudiante —ingreso, matrícula, promoción y egreso— se realiza
mediante registros físicos, sin trazabilidad ni consulta inmediata. De igual
forma, el equipo docente adolece de una plataforma digital unificada que le
permita elaborar material de refuerzo ilustrado y asignar actividades
extraescolares, mientras que el departamento de coordinación carece de
analíticas consolidadas que permitan evaluar, de forma cuantitativa y en tiempo
real, el desempeño global de la población estudiantil.

Para solventar esta problemática, se propone el desarrollo de EduVerso, una
solución tecnológica concebida bajo la arquitectura de Aplicaciones Web
Progresivas (PWA), diseñada para ofrecer una experiencia instalable desde
navegadores móviles sin los altos costos de infraestructura de las aplicaciones
nativas. Este sistema integrará módulos de gestión administrativa con un entorno
de aprendizaje gamificado y un módulo de contenido ilustrado elaborado por el
propio cuerpo docente. Además, incorporará capacidades de inteligencia
artificial generativa, a través de Modelos de Lenguaje Grandes (LLMs),
implementando técnicas de ingeniería de instrucciones ("prompt engineering") en
dos agentes de propósito acotado y separado: un tutor contextual dirigido al
estudiante, restringido a orientar sin entregar respuestas y sin capacidad de
alterar sus propias reglas, y un asistente de diseño dirigido al docente, cuyo
vocabulario de salida se limita a un catálogo cerrado de componentes gráficos
validado por el sistema antes de aplicarse.

En virtud de los argumentos expuestos, la presente investigación se orienta a
dar respuesta a la siguiente interrogante principal. ¿Cómo optimizar los
procesos de gestión administrativa, la elaboración de material de refuerzo
ilustrado y el seguimiento del refuerzo académico extraescolar mediante la
implementación de una aplicación web progresiva, gamificada y asistida por
inteligencia artificial en la institución?

---

## 3. OBJETIVOS DE LA INVESTIGACIÓN

**Objetivo General**

Desarrollar una aplicación web progresiva (PWA) con mecánicas de gamificación e
inteligencia artificial para la optimización de la gestión administrativa, la
elaboración de material de refuerzo ilustrado y el seguimiento del refuerzo
académico de estudiantes de educación primaria.

**Objetivos Específicos**

Para materializar el objetivo general, el proceso de desarrollo se desglosa en
una serie de metas técnicas y operativas. En una primera etapa, se procederá a
diagnosticar los procesos actuales de gestión de matrícula, control de salones y
asignación de actividades extraescolares vigentes en la institución,
estableciendo los requerimientos funcionales del sistema. Seguidamente, se
diseñará la arquitectura de software, el modelo de base de datos relacional y
las interfaces de usuario, asegurando que la experiencia interactiva esté
adaptada de forma ergonómica a los perfiles de coordinación, docente y alumno.

Superada la fase de diseño, se implementarán los módulos de gestión
administrativa, garantizando el control íntegro y trazable del ciclo de vida del
estudiante —desde su ingreso y matrícula hasta su promoción o egreso— junto con
la derivación automática de los datos dependientes del calendario, como la edad
a partir de la fecha de nacimiento. De manera simultánea, se desarrollará el
motor lógico de actividades gamificadas, incorporando métricas cuantificables
mediante puntos de experiencia (XP), un sistema de progresión por niveles de
usuario y tablas de clasificación dinámicas que fomenten la participación
continua del alumnado.

En una tercera etapa se construirá el módulo de material de refuerzo ilustrado.
Para ello se desarrollará un catálogo de componentes gráficos vectoriales
reutilizables, organizado por categorías temáticas, junto con un editor visual
que permita al docente componer sus propias ilustraciones mediante arrastre y
soltado, complementarlas con texto o recursos multimedia propios, y estructurar
la lección en unidades mínimas de una idea por página, conforme a los principios
de carga cognitiva adoptados como fundamento. Este módulo incluirá la
persistencia de la ilustración como documento de datos, de modo que el material
elaborado por el docente sea editable con posterioridad y reutilizable entre
lecciones.

En una fase tecnológica avanzada, se integrarán dos agentes basados en
inteligencia artificial, con ámbitos deliberadamente separados. El primero, un
tutor dirigido al estudiante, estará programado de forma estricta para
proporcionar asistencia contextual y pedagógica durante la resolución de los
ejercicios, restringiendo la entrega de respuestas directas y operando bajo un
tope contabilizado de consultas. El segundo, un asistente de diseño dirigido al
docente, traducirá instrucciones en lenguaje natural a composiciones gráficas,
limitando su salida a un vocabulario cerrado de componentes del catálogo, que el
sistema valida y depura antes de incorporarla a la escena.

Para concluir el ciclo de desarrollo, se realizarán pruebas exhaustivas de
integración, seguridad a nivel de datos y usabilidad del sistema. Estas pruebas
validarán el correcto funcionamiento de la plataforma en dispositivos móviles con
sistema operativo Android —incluida su instalabilidad como aplicación web
progresiva— y bajo las condiciones de conectividad residencial que caracterizan
a la población estudiantil.

---

## 5. DELIMITACIÓN Y ALCANCE

El despliegue investigativo y tecnológico de este proyecto se encuentra
circunscrito demográficamente a la población de estudiantes, cuerpo docente y
personal administrativo de la escuela primaria seleccionada. A nivel temporal,
la ingeniería, implementación y validación del producto de software se planifican
para ser ejecutadas en un lapso establecido de doce semanas. En el ámbito
tecnológico, EduVerso será liberado como una Aplicación Web Progresiva (PWA),
con sus interfaces y lógicas de rediseño optimizadas prioritariamente para
garantizar fluidez e instalabilidad en teléfonos inteligentes bajo el ecosistema
Android.

El producto final abarcará funcionalidades estructuradas en tres entornos
principales, protegidos por políticas de seguridad de bases de datos a nivel de
filas (Row-Level Security) para garantizar la privacidad de los menores según
normativas legales. El panel de coordinación proveerá las herramientas necesarias
para la gestión centralizada del ciclo de vida académico, el manejo de plantillas
de personal, y la creación y activación de años escolares, quedando la promoción
individual de cada estudiante como una decisión registrada por su docente. El
entorno docente habilitará la consulta de analíticas agregadas de desempeño, el
registro de evaluaciones presenciales, la instanciación de actividades digitales
a partir de plantillas pedagógicas predefinidas, y la elaboración del material de
refuerzo ilustrado de los temas correspondientes a su grado, mediante un editor
visual que opera sobre un catálogo cerrado de componentes gráficos y admite,
como alternativa, la incorporación de imágenes o audio propios. Por su parte, el
entorno del alumno ofrecerá la experiencia gamificada inmersiva, contabilizando
su progresión en puntos de experiencia, la lectura del material ilustrado
correspondiente a cada tema, y el acceso al agente tutor de inteligencia
artificial bajo un límite estricto de consultas contabilizado por cada paso de
la actividad.

Por consiguiente, quedan excluidos del alcance de este trabajo el desarrollo de
clientes nativos independientes para ecosistemas iOS y sistemas operativos de
escritorio, considerándose suficiente la compatibilidad universal que brinda el
estándar PWA. De igual manera, no se contempla la vinculación del sistema con el
registro de calificaciones formales ante el Ministerio de Educación,
preservándose su naturaleza de refuerzo no punitivo. Tampoco se incluirán módulos
de mensajería sincrónica entre usuarios.

En cuanto a las capacidades de inteligencia artificial, la delimitación opera
sobre el ámbito de cada agente y no sobre la autoría del contenido. El agente
tutor del estudiante mantiene sus lineamientos fijados en el motor del sistema:
ni el docente ni el alumno podrán modificar sus reglas de comportamiento,
ampliar su tope de consultas ni habilitarlo para entregar respuestas directas.
El asistente de diseño del docente, por su parte, no genera texto pedagógico ni
evalúa al estudiante: su salida se restringe a la disposición de componentes de
un catálogo cerrado sobre un lienzo de dimensiones fijas, y es depurada por el
sistema antes de aplicarse, de modo que toda pieza no reconocida se descarta. La
redacción del material de refuerzo permanece, en todos los casos, bajo la
autoría y la responsabilidad del docente, quien revisa y aprueba el resultado
antes de publicarlo a su salón.

---

## Ajustes puntuales a secciones que no se reescriben

**Sección 1 (Título).** Si se acoge la ampliación de alcance, el título gana
precisión incorporando el material de refuerzo:

> EduVerso: Aplicación Web Progresiva con Gamificación e Inteligencia Artificial
> para la Gestión Administrativa y la Elaboración de Material de Refuerzo
> Académico en Educación Primaria.

**Sección 4 (Justificación).** Dos correcciones:

1. El párrafo científico-tecnológico afirma limitar alucinaciones *"mediante
   contextos sembrados estáticamente"*. Conviene precisar que el control opera
   por dos vías distintas: contexto sembrado e instrucciones fijas en el tutor
   del estudiante, y **validación de la salida contra un vocabulario cerrado**
   en el asistente del docente. Son mecanismos diferentes y el segundo es el
   aporte más defendible.
2. La afirmación de despliegue en Vercel está redactada en presente. Verificar
   que el despliegue exista antes de la entrega, o redactarla como previsión.

---

## Notas sobre las citas

**Nota 1 — Unesco.** La fuente original consigna 2011. Para sostener el
*"contexto global contemporáneo"* conviene una publicación reciente del
organismo; no se sustituye aquí porque elegir la referencia exige consultar el
repositorio de Unesco, y no corresponde inventar un dato bibliográfico.

**Nota 2 — Vidal.** En el original figura como *"autores como Vidal Y.
mencionan"*: sin año, con la inicial suelta y el verbo en plural para un solo
autor. Debe completarse con apellido, inicial, año y entrada en la bibliografía.

**Citas retiradas y su motivo.** Se eliminaron dos referencias del planteamiento
porque sostenían funciones que el sistema no implementa, y dejarlas expondría la
propuesta a una objeción directa en la defensa:

| Cita retirada | Lo que afirmaba | Estado real en el sistema |
|---|---|---|
| Ebbinghaus (1885) | Necesidad de un sistema de repetición espaciada (SRS) | No existe SRS: no hay intervalos, ni reprogramación por olvido, ni fecha de próxima revisión |
| Skinner (refuerzo de razón variable) | Refuerzo intermitente como motor del hábito | El XP es fijo y determinista: `xp_reward` declarado por paso en la plantilla, sumado por `award_xp()` |

**Citas incorporadas y lo que respaldan.** Las tres describen mecanismos que el
sistema sí implementa:

| Cita incorporada | Qué respalda en el producto |
|---|---|
| Mayer (2009) — aprendizaje multimedia | Material de refuerzo con imagen y texto integrados en cada página; catálogo gráfico de lenguaje visual uniforme |
| Sweller (2011) — carga cognitiva | Estructura de una idea por página en el editor de lecciones |
| Vygotsky (1978) — andamiaje / ZDP | Tutor que orienta con pistas contextuales y no entrega la respuesta |

Kapp (2012) se conserva sin cambios: respalda XP, niveles y tablas de
clasificación, que están implementados.
