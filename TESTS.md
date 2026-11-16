# Tests

**Regla:** no se despliega sin `npm run test:all` en verde (lint + tipos + tests).

## Preparación (una vez)

1. PostgreSQL en local.
2. `.env.test` (copia de `.env.example`) con `DATABASE_URL` apuntando a una base cuyo nombre **acabe en `_test`**, p. ej. `.../tope_test?schema=public`. Si no acaba en `_test`, los tests se niegan a ejecutarse: vacían la base de datos.

Antes de cada ejecución, `tests/global-setup.ts` lanza `prisma migrate deploy` contra ella (aplica las migraciones pendientes; no borra nada). Cada test vacía los usuarios con `resetDb()` (`DELETE`, que conserva el catálogo global de ejercicios).

## Ejecutar

```bash
npm test             # solo tests (Vitest)
npm run test:all     # lint + typecheck + tests
npx vitest run tests/auth.test.ts   # un archivo
```

Los archivos se ejecutan uno detrás de otro (comparten base de datos). Total: 7 archivos, 102 tests.

## Qué cubre cada archivo

| Archivo | Tipo | Cubre |
|---|---|---|
| `src/lib/validation.test.ts` | unitario | Zod: registro (normaliza email, longitudes, mensajes en español), login (rechaza tipos no texto), perfil (vacío = sin dato, rangos, enums), medidas (al menos una, fechas reales, rangos) |
| `tests/auth.test.ts` | integración | registro con hash bcrypt y perfil vacío, email duplicado sin distinguir mayúsculas, validación sin tocar la BD; login correcto sin devolver el hash, contraseña mala / email desconocido / entrada rota; límite por email (bloquea aunque luego acierte), por IP, ventana de 15 min, el acierto limpia fallos; IP desde X-Forwarded-For |
| `tests/isolation.test.ts` | integración | aislamiento entre usuarios: cuenta, perfil, medidas, último peso, calendario y contador de días solo devuelven lo propio; no se borra la medida de otro conociendo su id; actualizar el perfil propio no toca el ajeno; una medida por día |
| `src/lib/goals.test.ts` | unitario | metas sugeridas por dificultad y redondeos, fechas sugeridas, progreso, estado y formato de valores |
| `tests/goals.test.ts` | integración | crear objetivos de ejercicio y de medida, meta editada respetada, dirección en WOD por tiempo, validación (ejercicio de otro usuario o módulo, calorías), valor actual = mejor serie de la última sesión y solo desde la creación, medidas, vencido, editar recalcula o respeta, aislamiento entre usuarios, asistente de alta (guarda todo, una sola vez, todo o nada, marcas opcionales) |
| `tests/seed.test.ts` | integración | seed demo idempotente (mismo id y mismos recuentos de medidas, calendario, rutinas, sesiones, series y objetivos), alta hecha y objetivos de la demo en los tres estados, cada día del calendario tiene su sesión con series, restaura lo cambiado por visitas, se puede entrar con las credenciales públicas |
| `tests/modules.test.ts` | integración | **se ejecuta igual para fuerza, calistenia y CrossFit**: registro de módulos (búsqueda segura por slug); catálogo de 25–30 con slugs únicos y métricas del módulo, seed idempotente, ejercicios propios solo para su dueño, métricas ajenas rechazadas; rutinas en orden con solo los objetivos del módulo, validación, sin ejercicios inexistentes ni propios de otro, editar reemplaza, otro usuario no lee/edita/borra; series validadas por la métrica, el día se marca y se desmarca al borrar la última serie o la sesión, sesión desde rutina solo propia, otro usuario no ve/añade/borra, última serie por ejercicio, resumen de sesiones; el catálogo sobrevive a vaciar usuarios |

## Por fases

| Fase | Tests nuevos |
|---|---|
| 1. Base | los cuatro archivos de arriba |
| 2. Módulos | `tests/modules.test.ts` y ampliación de `tests/seed.test.ts` |
| 3. Objetivos y medidas | `src/lib/goals.test.ts`, `tests/goals.test.ts` y ampliación de `tests/seed.test.ts` |
| 4. IA | (pendiente) límite mensual, validación contra catálogo, API de Claude simulada |

## Problemas conocidos

- **Windows: «failed to find the runner» o «Cannot read properties of undefined (reading 'config')».** Vitest falla si la terminal arranca con la unidad en minúscula (`c:\...`, como hace la terminal de VS Code). Lánzalo desde la ruta con la unidad en mayúscula: `Set-Location C:\Users\...\tope` (PowerShell) o `cd /C/Users/.../tope` (bash).
