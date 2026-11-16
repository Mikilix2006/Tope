# Decisiones

Decisiones menores tomadas sin preguntar (la opción más sencilla), con su motivo. Se pueden revisar.

## Fase 1 — Base (2026-11-16)

### Stack y versiones (comprobadas con `npm view` el 2026-11-16)

| Pieza | Versión | Motivo |
|---|---|---|
| Next.js | 16.4.6 | Última estable. |
| TypeScript | 5.9.3 | La 7.0 acaba de salir; Next y eslint-config-next están probados con la 5. |
| Prisma | 6.19.3 | Igual que motogp-stats. Prisma 7 cambia el cliente (adaptadores, `prisma.config.ts`) y la 8 está en RC. Prisma 6 avisa de que `package.json#prisma` está obsoleto: se mantiene porque pasar a `prisma.config.ts` deja de cargar `.env` automáticamente. |
| Auth | next-auth 4.24.15 | Es la versión estable de Auth.js para Next (la v5 sigue en beta). Admite Next 16 y ya usa `await cookies()/headers()`. |
| Tailwind | 4.3 | La que instala create-next-app 16 (motogp-stats usa la 3; aquí no hay nada que migrar). |
| Zod | 4.6.7 | Última estable; mensajes por defecto en español con `z.locales.es()`. |
| bcrypt | bcryptjs 3.0.3, coste 12 | JS puro: no necesita compilar nada nativo ni en Windows ni en el servidor. |
| Tests | Vitest 5.1 | Igual que motogp-stats. |

### Next.js

- **Sin `cacheComponents` ni `partialPrefetching`** (create-next-app 16.4 los activa). Casi todas las pantallas son privadas y por usuario; con caché de componentes cada lectura de sesión exige `<Suspense>`. motogp-stats tampoco lo usa.
- **Sin `proxy.ts` (antes middleware)**: el layout de `(app)` redirige sin sesión y cada página/acción vuelve a pedir `requireUserId()`.

### Autenticación

- **Sesión JWT** (no en base de datos): el proveedor Credentials de next-auth 4 solo admite JWT. Cookie httpOnly, SameSite=Lax, Secure con https, 30 días.
- **Límite de intentos en PostgreSQL** (tabla `LoginAttempt`), no en memoria: sobrevive a reinicios. 5 fallos por email o 20 por IP en 15 minutos; un acierto borra los fallos de ese email. Con el email desconocido también se compara un hash, para no revelar por tiempo qué cuentas existen.
- **IP desde `X-Forwarded-For`**: válido detrás del proxy (Caddy) que lo sobrescribe.
- **El email se guarda en minúsculas** y sin espacios; así el email es único sin distinguir mayúsculas.
- **Contraseña**: 8 a 128 caracteres, sin reglas de composición.
- **Tras registrarse** se entra directamente y se va a `/panel`. En la fase 3 irá al asistente de alta.

### Datos

- **La altura y el peso viven en `BodyMeasurement`** (una fila por usuario y día; guardar otra vez el mismo día completa esa fila). El perfil no los duplica.
- **Se guarda la edad**, no la fecha de nacimiento (es lo que pide el alta). Envejece con el tiempo; se edita en el perfil.
- **`Goal` ya existe** con meta, dificultad, inicio y si la meta se editó; el valor actual, el progreso y el estado se calcularán (fase 3), no se guardan.
- **Objetivos de ejercicio sin clave foránea** al ejercicio (`discipline` + `exerciseId`): cada módulo tiene su propia tabla de ejercicios.
- **Calendario de constancia** como tabla del núcleo (`TrainingDay`): los módulos la marcan al registrar una sesión; así el calendario no tiene que unir las tablas de los tres módulos.
- **Migración inicial generada con `prisma migrate diff`** (sin base de datos disponible en ese momento). Es equivalente a `migrate dev`.

### Usuario demo

- Credenciales públicas en `src/config/demo.ts` (`demo@tope.app` / `demo-tope-2026`) y botón «Probar la demo» en `/acceso`.
- `npm run db:seed` **reinicia** la demo (mismo usuario, datos rehechos), así se deshace lo que cambien las visitas. Datos relativos a la fecha de ejecución para que siempre parezca reciente.

### Interfaz

- **Texto casi negro sobre el naranja** de los botones: el blanco sobre `#ff5a00` no llega al contraste AA.
- **Tema claro/oscuro según el sistema** por ahora; el selector manual llega en la fase 5.
- Panel provisional con dos cifras (días entrenados en 30 días y último peso); las gráficas, en la fase 5.

### Tests

- Base de datos de tests aparte (`tope_test`); los tests se niegan a ejecutarse si la base de `.env.test` no acaba en `_test`. Se rehace con `prisma migrate reset` antes de cada ejecución.
- Tests de integración contra PostgreSQL real (no mocks de Prisma): el aislamiento y el límite de intentos dependen de las consultas reales.

### Agentes

- Los agentes de `.claude/agents/` se cargan cuando Claude Code se abre **en la carpeta de Tope**. La fase 1 se hizo en una sesión abierta desde otro proyecto, sin acceso a ellos: el trabajo se hizo directamente siguiendo sus reglas.

## Fase 2 — Módulos (2026-11-16)

### Modelo

- **Cinco tablas por disciplina** (`<D>Exercise`, `<D>Routine`, `<D>RoutineItem`, `<D>Session`, `<D>Set`), con los mismos nombres de relación. Solo cambian las columnas de serie:
  - **Fuerza:** kg, repeticiones y RPE (kg y repeticiones obligatorios).
  - **Calistenia:** repeticiones, segundos y lastre.
  - **CrossFit:** repeticiones, kg, segundos, metros y calorías.
- **Motor común** (`src/modules/engine.ts`) en vez de tres copias del mismo repositorio. Cada módulo es una definición más su catálogo. El motor usa los delegados de Prisma a través de un tipo mínimo (`Delegate`), con una conversión de tipo. A cambio, TypeScript no comprueba los `where` del motor; lo cubre `tests/modules.test.ts`, que se ejecuta contra los tres módulos.
- **Métrica por ejercicio**, compartida por los tres catálogos (enum `ExerciseMetric`): decide qué campos se piden y cuáles son obligatorios.
  - **Peso:** kg × repeticiones (+ RPE).
  - **Repeticiones:** repeticiones (+ kg de lastre o carga).
  - **Tiempo:** segundos.
  - **Distancia:** metros (+ tiempo).
  - **Calorías:** calorías (+ tiempo).
- **En CrossFit, «tiempo» es tiempo en completar** (WOD por tiempo): menos es mejor (`lowerIsBetter`). En calistenia, «tiempo» es aguantar: más es mejor. Lo usarán los objetivos (fase 3) y las gráficas (fase 5).
- **WODs de referencia como ejercicios del catálogo** de CrossFit (Fran, Grace, Helen, Diane, Karen y Murph por tiempo; Cindy con repeticiones totales en vez de rondas).
- **Material del catálogo**: lo que necesita barra o paralelas (dominadas, fondos, front lever...) se marca como `GIMNASIO` (gimnasio o parque). La kettlebell cuenta como `MANCUERNAS`.
- **Las series no tienen `userId`**: pertenecen al dueño de su sesión y se filtran por `session.userId`.
- **El día entrenado se marca al añadir la primera serie**, no al abrir la sesión. Si se borran todas las series del día (o la sesión), se desmarca. Una sesión vacía no cuenta como entreno.
- **La fecha de una sesión nueva es «hoy» en hora de España** (Europe/Madrid). No se puede cambiar la fecha de una sesión en la v1.
- **Editar una rutina reemplaza todos sus ejercicios.** Las sesiones ya registradas no cambian. Borrar una rutina conserva sus sesiones, que pasan a «Sesión libre».

### Interfaz

- **Valores por defecto de cada ejercicio en la sesión**: los de su última serie (en cualquier sesión) y, si no hay ninguna, el objetivo de la rutina. Tras añadir una serie, los valores se quedan, así que repetirla cuesta un toque.
- **Botones − / + grandes** en cada campo (pasos: 2,5 kg, 1 repetición, 5 s, 100 m, 5 kcal, 0,5 de RPE).
- **El tiempo se introduce en segundos** y debajo se muestra en m:ss (el teclado numérico del móvil no tiene «:»).
- **El logo de la cabecera lleva al panel** y el menú queda en Entrenar · Perfil · Salir, para que quepa en 360 px. La barra inferior para móvil llega en la fase 5.
- **`/entrenar/<disciplina-inexistente>` muestra la página 404, pero con código 200**: es cómo funciona `notFound()` cuando `loading.tsx` ya ha empezado a enviar la página (documentado en Next, que añade `noindex`). No importa en una zona privada.

### Tests

- **`global-setup` usa `prisma migrate deploy`** (aplica las migraciones pendientes) en vez de `migrate reset`. Prisma bloquea `reset` cuando lo lanza un agente de IA sin el consentimiento explícito del usuario, y `deploy` no borra nada. Entre tests se vacía con `resetDb()`.
- **`resetDb()` usa `DELETE FROM "User"` y no `TRUNCATE ... CASCADE`**: el `TRUNCATE` vaciaba también el catálogo global (sus tablas referencian `User`).

### Agentes

- Esta sesión se abrió desde otra carpeta y no tiene cargados los agentes de Tope (los que ve son los de motogp-stats). La fase 2 se hizo directamente, siguiendo las reglas de `.claude/agents/`.

## Fase 3 — Objetivos y medidas (2026-11-16)

### Lógica

- **Sin cambios de esquema**: `Goal` ya tenía todo. La dirección (subir o bajar) no se guarda: en ejercicios la fija el módulo (`lowerIsBetter`: en CrossFit el tiempo baja) y en medidas sale de comparar meta e inicio.
- **Incrementos en `src/config/goals.ts`** y lógica pura en `src/lib/goals.ts` (sin base de datos), la misma en el servidor y en el navegador.
- **Peso levantado**: el incremento (no la meta) se redondea a saltos de 2,5 kg: 80 kg en difícil (+8 kg) → +7,5 → 87,5 kg.
- **Perímetros** (cintura, pecho, cadera, brazo, muslo): la especificación no fija incrementos; se usan 1, 2 y 3 cm, en el mismo archivo de configuración.
- **Sin objetivos sobre ejercicios de calorías**: la especificación no define su incremento y `GoalMetric` no tiene calorías.
- **Valor actual = mejor serie de la última sesión** con ese ejercicio (en la métrica principal: kg, repeticiones, segundos o metros; el menor tiempo si menos es mejor), no la última serie suelta, que puede ser de calentamiento o de descarga. En medidas, la última medida con ese dato.
- **Solo cuentan los registros desde el día en que se creó el objetivo**; sin registros, el valor actual es el inicial.
- **Estado calculado, no guardado**: conseguido si el valor actual alcanza la meta (aunque haya pasado la fecha); vencido si la fecha límite ya pasó (el mismo día aún está en curso); si no, en curso. Si el valor actual vuelve a empeorar, el objetivo deja de estar conseguido.
- **Meta editada**: si se envía una meta distinta de la sugerida, se guarda `targetEdited` y se respeta; sin meta, se usa la sugerida. En ejercicios la meta tiene que mejorar el inicio; en medidas, ser distinta.
- **Editar un objetivo** cambia dificultad, meta y fecha; el inicio, la métrica y el ejercicio no cambian (para eso se borra y se crea otro).
- **El alta se completa una sola vez** y es todo o nada (una transacción): perfil, medida de hoy (altura y peso) y un objetivo por marca, con la meta y la fecha sugeridas. Después todo se edita en el perfil, en medidas y en objetivos. La primera rutina con IA llega en la fase 4.
- **Demo**: seis objetivos creados el día del alta (hace 12 semanas): dos conseguidos, tres en curso (uno con la meta editada) y uno vencido.

### Interfaz

- **Alta en un solo componente de cliente** (`/alta`): los cuatro pasos viven en estado y se envían juntos al terminar como JSON (`payload`) a una única acción que llama a `completeOnboarding`. Cada paso hace una validación ligera al pulsar «Siguiente»; la definitiva es la del servidor, cuyos errores se listan con el nombre del campo. Al terminar va a `/objetivos`. Si ya hizo el alta, `/alta` redirige a `/panel`. Tras registrarse se va a `/alta`.
- **Marcas del alta**: 0 a 10 filas; solo se ofrecen las disciplinas elegidas en el paso 2 (si se quita una, se descartan sus marcas). La meta y la fecha sugeridas se calculan en el navegador con las mismas funciones puras que usa el servidor.
- **Aviso en `/panel`** «Completa tu alta» mientras no se haya hecho.
- **Navegación**: el menú de cabecera no cambia (Entrenar · Perfil · Salir, cabe en 360 px). Objetivos y Medidas son dos botones en `/panel` y en `/perfil`; la barra inferior llega en la fase 5.
- **Selectores de objetivos**: solo ejercicios con métrica de peso, repeticiones, tiempo o distancia (los de calorías no admiten objetivo). El tiempo se escribe en segundos y se muestra en m:ss debajo.
- **Valor inicial prerrellenado**: en ejercicios, la mejor serie de la última sesión (acción `latestStartAction`, se pide al elegir el ejercicio); en medidas, la última medida de ese tipo. Siempre editable.
- **Meta y fecha límite siguen a la sugerida** (dificultad e inicio) hasta que el usuario las toca; la fecha se puede quitar con «Sin fecha límite». Al editar un objetivo, la meta solo se recalcula si no estaba editada, y la fecha se respeta tal cual.
- **Medidas corporales**: dirección por defecto «Bajar» al crear un objetivo de medida (se puede cambiar).
- **Borrar** (objetivos y medidas) pide confirmación con `window.confirm` (`ConfirmButton`).
- **Medidas**: si falla la validación, el formulario conserva lo escrito (la acción devuelve los valores, porque React reinicia los formularios tras cada envío).
- **404 de la zona privada** (`not-found.tsx` en `(app)`), usado por `/objetivos/[id]` si el objetivo no existe o es de otro usuario.
