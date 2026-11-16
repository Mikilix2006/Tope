import type { Discipline } from "@prisma/client";
import { prisma } from "@/lib/db";

export function listTrainingDays(userId: string, from?: Date) {
  return prisma.trainingDay.findMany({
    where: { userId, ...(from && { date: { gte: from } }) },
    orderBy: { date: "asc" },
  });
}

// Días distintos entrenados en los últimos `lastDays` días (un día con dos disciplinas cuenta una vez).
export async function countTrainedDays(userId: string, lastDays: number) {
  const since = new Date(Date.now() - lastDays * 86_400_000);
  const rows = await prisma.trainingDay.findMany({
    where: { userId, date: { gte: since } },
    distinct: ["date"],
    select: { date: true },
  });
  return rows.length;
}

// Los módulos lo llaman al registrar una sesión. Idempotente: marcar dos veces el mismo día no duplica.
export function markTrainingDay(userId: string, date: Date, discipline: Discipline) {
  return prisma.trainingDay.upsert({
    where: { userId_date_discipline: { userId, date, discipline } },
    create: { userId, date, discipline },
    update: {},
  });
}

export function unmarkTrainingDay(userId: string, date: Date, discipline: Discipline) {
  return prisma.trainingDay.deleteMany({ where: { userId, date, discipline } });
}
