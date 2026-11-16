import { prisma } from "@/lib/db";
import type { MeasurementInput } from "@/lib/validation";

export function listMeasurements(userId: string, from?: Date) {
  return prisma.bodyMeasurement.findMany({
    where: { userId, ...(from && { date: { gte: from } }) },
    orderBy: { date: "asc" },
  });
}

export function latestWeight(userId: string) {
  return prisma.bodyMeasurement.findFirst({
    where: { userId, weightKg: { not: null } },
    orderBy: { date: "desc" },
    select: { date: true, weightKg: true },
  });
}

// Una fila por día: si ya hay medidas ese día, se completan con las nuevas.
export function saveMeasurement(userId: string, { date, ...values }: MeasurementInput) {
  const day = new Date(`${date}T00:00:00Z`);
  return prisma.bodyMeasurement.upsert({
    where: { userId_date: { userId, date: day } },
    create: { userId, date: day, ...values },
    update: values,
  });
}

// deleteMany con userId: borrar la medida de otro usuario no hace nada.
export async function deleteMeasurement(userId: string, id: string) {
  const { count } = await prisma.bodyMeasurement.deleteMany({ where: { id, userId } });
  return count === 1;
}
