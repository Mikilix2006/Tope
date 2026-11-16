import { prisma } from "../src/lib/db";
import { MODULES } from "../src/modules/registry";
import { seedDemo } from "../src/server/seed/demo";

// Seed idempotente: se puede ejecutar las veces que haga falta sin duplicar datos.
// 1) catálogos de ejercicios de cada módulo (upsert por slug), 2) usuario demo (se reinicia).
async function main() {
  for (const mod of MODULES) {
    await mod.seedCatalog();
    console.log(`Catálogo de ${mod.name}: ${mod.catalog.length} ejercicios.`);
  }
  await seedDemo(prisma);
  console.log("Usuario demo listo.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
