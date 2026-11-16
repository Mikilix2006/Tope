# Especificación de Tope (v1)

Encargo original del usuario (2026-11-16). Es la fuente de verdad del alcance; las decisiones tomadas al aplicarla están en [DECISIONES.md](DECISIONES.md) y el estado por fases en [README.md](README.md).

Trabaja de forma autónoma: no hagas preguntas al empezar. Si dudas de algo menor, elige la opción más sencilla, anótala en `DECISIONES.md` y sigue. **Para al final de cada fase y pide validación antes de pasar a la siguiente.**

## 1. Qué es Tope
Una app donde cada usuario controla sus rutinas personalizadas, registra sus entrenos y medidas corporales, define objetivos y ve su evolución en gráficas. Abarca varias disciplinas (calistenia, CrossFit y fuerza). Irá alojada junto a los proyectos del portfolio, como motogp-stats (Rebufo).

## 2. Reglas de trabajo (obligatorias)
- Trabaja en una rama distinta de `main` (`desarrollo`). Nunca en `main`.
- **No hagas commit ni push** salvo que el usuario lo pida.
- Tests obligatorios: cada fase termina con sus tests pasando (lógica de objetivos, límites de IA, validación, autenticación, aislamiento entre usuarios). `TESTS.md` explica cómo ejecutarlos. No se despliega sin tests en verde.
- Antes de usar una librería o versión, verifica que existe y cómo se usa. No inventes APIs.
- Mantén la documentación al día: `README.md`, `AGENTS.md`, `DEPLOY.md`, `DECISIONES.md`.
- Agentes en `.claude/agents/` y delegar en ellos: `database-guardian` (esquema, migraciones, seed), `frontend-guardian` (componentes, rutas, API, estados de carga y error), `ui-designer` (capa visual y coherencia), `docs-guardian` (documentación tras cambios notables). Los tests los escribe cada fase.
- No toques ningún servidor. El despliegue lo hace el usuario a mano con `DEPLOY.md`.
- `TODO.md` con lo que queda fuera de la v1, en `.gitignore`.

## 3. Stack y plataforma
- Next.js (última estable), TypeScript estricto, Prisma, PostgreSQL, Tailwind. Mismo stack que motogp-stats.
- Zod para validar toda entrada del servidor.
- Interfaz en **español**, unidades **métricas** (kg, cm), sin selector de idioma ni de unidades.
- **Mobile-first**, instalable como **PWA**, sin modo offline en la v1. Registrar una serie debe costar pocos toques.
- Tema claro y oscuro, acento **naranja eléctrico**, tipografía grande y legible para usar con el móvil entre series. Sin Figma ni Higgsfield en la v1: se diseña directamente en código con `ui-designer`.

## 4. Usuarios y autenticación
- Registro e inicio de sesión con email y contraseña (Auth.js), hash con bcrypt, cookie `httpOnly`, límite de intentos de login, validación con Zod.
- Los datos de cada usuario están aislados: ninguna consulta devuelve datos de otro usuario. Hay un test que lo comprueba.
- Un **usuario demo** con datos de ejemplo para enseñar la app en el portfolio.
- Sin verificación ni recuperación de contraseña por correo en la v1 (va a `TODO.md`).

## 5. Alta (asistente de 4 pasos)
Tras registrarse, un asistente corto pide:
1. Altura, peso y edad.
2. Disciplinas (calistenia, CrossFit, fuerza), nivel (principiante, intermedio, avanzado), días por semana y duración de la sesión.
3. Material disponible (sin material, mancuernas, gimnasio completo) y lesiones o limitaciones (texto libre opcional).
4. Marcas actuales (por ejemplo «4 dominadas», «10 kg»), que serán el valor inicial de los objetivos.

Después se crean los objetivos y se genera la primera rutina. Todo es editable luego en el perfil.

## 6. Modelo de datos
**Núcleo compartido**: usuario y perfil, medidas corporales (altura, peso y opcionales como cintura), objetivos, calendario de entrenos.
**Un módulo independiente por disciplina** (calistenia, CrossFit, fuerza), cada uno con sus propias tablas: catálogo de ejercicios, rutinas, sesiones y registro de series, con las métricas naturales de esa disciplina. Añadir una disciplina nueva debe ser copiar el patrón del módulo. El usuario puede crear ejercicios propios dentro de cada módulo.

**Seed idempotente** (repetible sin duplicar): 25 a 30 ejercicios por disciplina, en español.

## 7. Objetivos
- Meta numérica sobre una métrica de ejercicio o de medida corporal, con valor inicial, valor actual y valor objetivo.
- El valor actual se calcula solo del último registro; el usuario no lo escribe.
- Progreso = porcentaje entre inicio y meta. Fecha límite opcional. Estado automático: en curso, conseguido o vencido.
- **Dificultad** elegida por el usuario: fácil, medio, difícil. Fija la meta sugerida (editable; si el usuario la edita, se respeta) y la fecha límite sugerida (aprox. 4, 8 y 12 semanas).
- Incrementos iniciales, **todos en un único archivo de configuración** para ajustarlos sin tocar la lógica:
  - **Peso levantado**: fácil +2,5 %, medio +5 %, difícil +10 %, redondeado a saltos de 2,5 kg, con mínimo de un salto.
  - **Repeticiones**: fácil +25 %, medio +50 %, difícil +100 % del valor actual, con mínimo +1.
  - **Tiempo o distancia**: fácil +5 %, medio +10 %, difícil +20 %.
  - **Peso corporal**: el usuario elige subir o bajar; fácil 1 kg, medio 3 kg, difícil 5 kg.

## 8. Rutinas con IA
- Se generan llamando a la API de Claude **desde el servidor** con el modelo `claude-sonnet-5-5`. La clave va en una variable de entorno y nunca llega al navegador.
- Entrada: perfil, nivel, disciplinas, disponibilidad, material, limitaciones, marcas actuales y objetivos con su dificultad.
- La salida se **valida contra el catálogo** del módulo (solo ejercicios existentes) y con Zod. Si falla la validación, no cuenta como uso.
- **Límite: 3 generaciones por usuario y mes**, contado en el servidor, con contador visible y límite configurable por variable de entorno. Editar la rutina a mano no tiene límite.
- Muestra un aviso de que no sustituye a un profesional.
- Tests con la API de Claude simulada (mock): sin llamadas reales en los tests.

## 9. Mapa de progreso (gráficas)
Con rango de fechas seleccionable (1 mes, 3 meses, todo):
1. Evolución por ejercicio (mejor marca por sesión), por disciplina.
2. Peso y medidas corporales.
3. Barra de progreso de cada objetivo.
4. Volumen semanal (series totales por semana).
5. Lista de récords personales.
6. Calendario de constancia con los días entrenados.

El panel general muestra constancia, peso corporal y objetivos. Sin comparativas entre usuarios.

## 10. Fases (parar y esperar validación al acabar cada una)
1. **Base**: repositorio, rama, `AGENTS.md`, agentes, Prisma, autenticación, perfil, usuario demo, núcleo compartido, tests.
2. **Módulos**: calistenia, CrossFit y fuerza (catálogo + seed, rutinas manuales, registro de series), tests.
3. **Objetivos y medidas**: alta de 4 pasos, objetivos con dificultad, medidas corporales, tests.
4. **IA**: generación de rutinas, límite mensual, validación, tests con mock.
5. **Progreso e interfaz**: las seis gráficas, PWA, tema claro y oscuro, pulido móvil.
6. **Cierre**: `DEPLOY.md`, `TESTS.md`, `TODO.md`, revisión final con `docs-guardian`.

## 11. Fuera de la v1 (solo en `TODO.md`)
Verificación y recuperación de contraseña por correo, fotos de progreso, social o compartir, notificaciones, wearables, planes de nutrición, Figma y Higgsfield, más disciplinas.

## 12. Cómo informar
Al final de cada fase: qué se ha hecho, qué tests pasan, qué decisiones menores se han tomado (también en `DECISIONES.md`) y qué falta. Breve y exacto. Si algo falla o se ha saltado, decirlo claramente.
