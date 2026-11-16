<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Tope — reglas del proyecto

App web de gimnasio: rutinas personalizadas, registro de entrenos y medidas, objetivos y gráficas de evolución. Disciplinas: calistenia, CrossFit y fuerza. Interfaz en español, unidades métricas, mobile-first.

## Reglas de trabajo

1. **Nunca en `main`.** Se trabaja en `desarrollo` (o ramas que salgan de ella).
2. **Sin commit ni push** salvo que el usuario lo pida.
3. **Tests obligatorios.** Cada fase termina con `npm run test:all` en verde. No se despliega con tests en rojo. Ver [TESTS.md](TESTS.md).
4. **No inventar APIs.** Antes de usar una librería o versión, comprobar que existe (`npm view`) y leer sus tipos o su documentación en `node_modules`. Para Next.js, leer `node_modules/next/dist/docs/`.
5. **No tocar servidores.** El despliegue lo hace el usuario a mano con [DEPLOY.md](DEPLOY.md).
6. **Decisiones menores** se toman (la opción más sencilla) y se anotan en [DECISIONES.md](DECISIONES.md).
7. **Lo que queda fuera de la v1** va a `TODO.md` (local, ignorado por git).
8. **Documentación al día** tras cada cambio notable: `README.md`, `AGENTS.md`, `DEPLOY.md`, `DECISIONES.md`, `TESTS.md` (agente `docs-guardian`).

## Seguridad y datos

- **Aislamiento entre usuarios**: toda función de `src/server/` y `src/modules/` que lee o escribe datos de usuario recibe `userId` como primer argumento y filtra por él, también al borrar o actualizar (`deleteMany`/`updateMany` con `{ id, userId }`). Las tablas hijas (series, ejercicios de rutina) filtran por el dueño del padre (`session: { userId }`). El `userId` sale **siempre** de la sesión (`requireUserId()`), nunca del cliente; los ids ligados a acciones con `.bind()` también son entrada no fiable. Cada repositorio nuevo añade su caso a `tests/isolation.test.ts` o `tests/modules.test.ts`.
- **Validación**: toda entrada del servidor (acciones, rutas API, salida de la IA) pasa por un esquema Zod de `src/lib/validation.ts` (o del módulo correspondiente).
- **Contraseñas**: bcryptjs coste 12. Nunca se devuelve ni se registra `passwordHash`.
- **Secretos** (`NEXTAUTH_SECRET`, clave de Claude) solo en variables de entorno del servidor; nunca con prefijo `NEXT_PUBLIC_`.

## Stack

Next.js 16 (App Router, sin `cacheComponents`), TypeScript estricto, Prisma 6 + PostgreSQL, Tailwind 4, Zod 4, next-auth 4 (Credentials + JWT), Vitest. Versiones exactas en `package.json`; motivos en `DECISIONES.md`.

## Estructura

```
prisma/schema.prisma        esquema (núcleo compartido + módulos por disciplina)
prisma/seed.ts              seed idempotente (catálogos y usuario demo)
src/app/(auth)/             /acceso, /registro (públicas; con sesión redirigen a /panel; tras registrarse se va a /alta)
src/app/(app)/              zona privada: el layout exige sesión; cada página llama a requireUserId()
src/app/(app)/alta/         /alta: asistente de alta en 4 pasos (una sola vez)
src/app/(app)/objetivos/    /objetivos, /objetivos/nuevo, /objetivos/[id]
src/app/(app)/medidas/      /medidas: medidas corporales
src/app/(app)/goal-options.ts  opciones de los selectores de objetivos
src/app/(app)/not-found.tsx 404 de la zona privada
src/app/(app)/entrenar/     /entrenar y /entrenar/[disciplina]/{ejercicios,rutinas/nueva,rutinas/[id],sesion/[id]}: las mismas páginas para las tres disciplinas
src/components/             piezas visuales compartidas (ui.tsx, number-stepper.tsx, goal-bits.tsx, confirm-button.tsx)
src/config/                 constantes ajustables (demo; incrementos de objetivos por dificultad en goals.ts)
src/lib/                    db (Prisma), validation (Zod), labels (textos de enums), format (fechas y tiempos), goals (metas, fechas, progreso y estado; puro, también en el navegador)
src/modules/engine.ts       motor común de los módulos: catálogo, rutinas, sesiones y series
src/modules/fields.ts       campos de serie y qué pide cada métrica (sin dependencias de servidor)
src/modules/schemas.ts      esquemas Zod de ejercicio, rutina, sesión y serie
src/modules/<disciplina>/   definición del módulo y su catálogo (fuerza, calistenia, crossfit)
src/modules/registry.ts     lista de módulos
src/server/auth/            registro, credenciales + límite de intentos, opciones de next-auth, sesión
src/server/core/            repositorios del núcleo: perfil, medidas, calendario, objetivos (con valor actual calculado) y alta (onboarding)
src/server/seed/            lógica del seed (testeable)
tests/                      tests de integración contra la base de datos *_test
```

### Núcleo y módulos

- **Núcleo compartido**: `User`, `Profile`, `BodyMeasurement` (una fila por usuario y día), `Goal`, `TrainingDay` (calendario de constancia), `LoginAttempt`.
- **Un módulo por disciplina**: cinco tablas propias con prefijo de la disciplina (`<D>Exercise`, `<D>Routine`, `<D>RoutineItem`, `<D>Session`, `<D>Set`) con los mismos nombres de relación. Las series y los objetivos de rutina solo tienen las columnas naturales de la disciplina:
  - Fuerza: `weightKg`, `reps`, `rpe`.
  - Calistenia: `reps`, `seconds`, `weightKg` (lastre).
  - CrossFit: `reps`, `weightKg`, `seconds`, `meters`, `calories`.
- La lógica está escrita una vez en `src/modules/engine.ts` (`createModule`). Cada módulo es una definición: campos, métricas admitidas, métricas donde menos es mejor (tiempo en CrossFit), catálogo y delegados de Prisma.
- Cada ejercicio tiene una **métrica** (`PESO`, `REPETICIONES`, `TIEMPO`, `DISTANCIA`, `CALORIAS`) que decide qué campos se piden en la serie (`METRIC_FIELDS` en `fields.ts`).
- Catálogo global: `userId` nulo y `slug` único (`<disciplina>-<ejercicio>`). Ejercicios propios: `userId` y sin slug.
- Al añadir o borrar una serie, el módulo sincroniza el día en `TrainingDay` (marcado si quedan series ese día en esa disciplina).
- **Añadir una disciplina**: copiar las cinco tablas en `schema.prisma` (cambiando prefijo y columnas de serie), copiar una carpeta de `src/modules/`, añadirla a `registry.ts` y a la enum `Discipline`, y migrar. Los tests de `tests/modules.test.ts` la cubren solos.
- Los objetivos de ejercicio guardan `discipline` + `exerciseId` sin clave foránea (cada módulo tiene su tabla de ejercicios).
- **Objetivos**: la dirección (subir/bajar) y el estado no se guardan, se calculan (`src/lib/goals.ts`). El valor actual es la mejor serie de la última sesión desde la creación (`latestBest` en `engine.ts`) o la última medida. Sin objetivos sobre ejercicios de calorías.
- **Alta**: `Profile.onboardedAt` marca que se hizo; `completeOnboarding` es una transacción que solo se ejecuta una vez.

## Agentes (`.claude/agents/`)

| Agente | Terreno |
|---|---|
| `database-guardian` | `schema.prisma`, migraciones, seed, consultas Prisma complejas |
| `frontend-guardian` | páginas, rutas y acciones, conexión con `src/server/`, estados de carga y error |
| `ui-designer` | capa visual: clases Tailwind, tokens de `globals.css`, coherencia y accesibilidad |
| `docs-guardian` | documentación `.md` tras cambios notables |

Los tests los escribe quien implementa cada fase.

## Comandos

```
npm run dev          servidor de desarrollo
npm run db:migrate   crear/aplicar migraciones en desarrollo
npm run db:seed      seed idempotente: catálogos (upsert por slug) y demo (se reinicia)
npm run test:all     lint + tipos + tests
npm run build        compilación de producción
```
