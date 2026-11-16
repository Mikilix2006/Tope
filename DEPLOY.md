# Despliegue

> Borrador de la fase 1. Se completa en la fase 6. El despliegue lo hace el usuario a mano; ningún agente toca servidores.

## Requisitos

- Node 22 y PostgreSQL 16+ en el servidor.
- Un proxy con HTTPS delante (Caddy, como Rebufo) que sobrescriba `X-Forwarded-For`: el límite de intentos de login usa esa cabecera.

## Variables de entorno (producción)

| Variable | Valor |
|---|---|
| `DATABASE_URL` | `postgresql://USUARIO:CONTRASEÑA@HOST:5432/tope?schema=public` |
| `NEXTAUTH_URL` | URL pública con https, p. ej. `https://tope.planetamiguel.com` |
| `NEXTAUTH_SECRET` | secreto largo y aleatorio: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |

## Pasos

1. En local, en la rama que se vaya a desplegar: `npm run test:all` en verde. Si no, no se despliega.
2. En el servidor: `npm ci` (ejecuta `prisma generate`).
3. `npm run build`.
4. `npm run start:prod` (aplica migraciones con `prisma migrate deploy` y arranca en el puerto 3000).
5. Primera vez, cuando cambie un catálogo de ejercicios y cuando se quiera reiniciar la demo: `npm run db:seed` (idempotente; reinicia la demo, incluidos sus seis objetivos).
