import { execSync } from "node:child_process";
import { loadEnv } from "vite";

// Antes de los tests: aplica las migraciones pendientes a la base de tests (la crea si no existe).
// Cada test vacía las tablas con resetDb(); no se usa `migrate reset` (Prisma lo bloquea si lo lanza un agente).
export default function setup() {
  const { DATABASE_URL } = loadEnv("test", process.cwd(), "");
  assertTestDatabase(DATABASE_URL);
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL },
  });
}

// Salvaguarda: los tests borran datos; solo se permite una base de datos cuyo nombre acabe en _test.
export function assertTestDatabase(url: string | undefined) {
  const name = url ? new URL(url).pathname.slice(1) : "";
  if (!name.endsWith("_test")) {
    throw new Error(`Los tests necesitan DATABASE_URL en .env.test apuntando a una base *_test (ahora: "${name || "sin definir"}").`);
  }
}
