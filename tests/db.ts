import { prisma } from "@/lib/db";
import { hashPassword } from "@/server/auth/password";
import { assertTestDatabase } from "./global-setup";

assertTestDatabase(process.env.DATABASE_URL);

export { prisma };

// Borra todos los usuarios (en cascada: perfil, medidas, objetivos, calendario, rutinas, sesiones, series y ejercicios propios).
// DELETE y no TRUNCATE ... CASCADE: este vaciaría también el catálogo global de ejercicios (sus tablas referencian User).
export async function resetDb() {
  await prisma.$executeRawUnsafe('DELETE FROM "User"');
  await prisma.$executeRawUnsafe('DELETE FROM "LoginAttempt"');
}

export async function createUser(email: string, password = "contraseña-segura") {
  return prisma.user.create({
    data: { email, name: email.split("@")[0], passwordHash: await hashPassword(password), profile: { create: {} } },
  });
}
