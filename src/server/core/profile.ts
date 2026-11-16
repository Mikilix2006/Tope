import { prisma } from "@/lib/db";
import type { ProfileInput } from "@/lib/validation";

// Reglas de aislamiento: toda función recibe el userId de la sesión y filtra por él.

export function getProfile(userId: string) {
  return prisma.profile.findUnique({ where: { userId } });
}

export function getAccount(userId: string) {
  return prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true, isDemo: true } });
}

export function updateProfile(userId: string, data: ProfileInput) {
  // Los campos vacíos del formulario se guardan como null (el usuario ha borrado el dato).
  const values = {
    age: data.age ?? null,
    disciplines: data.disciplines,
    level: data.level ?? null,
    daysPerWeek: data.daysPerWeek ?? null,
    sessionMinutes: data.sessionMinutes ?? null,
    equipment: data.equipment ?? null,
    limitations: data.limitations ?? null,
  };
  return prisma.profile.upsert({ where: { userId }, create: { userId, ...values }, update: values });
}
