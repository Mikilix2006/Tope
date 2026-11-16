import * as z from "zod";
import { prisma } from "@/lib/db";
import { suggestDeadline, toISODate } from "@/lib/goals";
import { onboardingSchema } from "@/lib/validation";
import { todayMadrid, type Result } from "@/modules/engine";
import { resolveGoal } from "./goals";

export async function isOnboarded(userId: string) {
  const p = await prisma.profile.findUnique({ where: { userId }, select: { onboardedAt: true } });
  return p?.onboardedAt != null;
}

/**
 * Cierra el asistente de alta: perfil, medida de hoy (altura y peso) y un objetivo por cada marca actual,
 * con la meta y la fecha límite sugeridas por su dificultad. Todo o nada; solo se puede completar una vez.
 */
export async function completeOnboarding(userId: string, input: unknown): Promise<Result<object>> {
  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: z.flattenError(parsed.error).fieldErrors };
  if (await isOnboarded(userId)) return { ok: false, errors: { form: ["Ya completaste el alta. Cambia tus datos en el perfil."] } };

  const { heightCm, weightKg, marks, ...profile } = parsed.data;
  const today = todayMadrid();

  const goals = [];
  for (const m of marks) {
    const r = await resolveGoal(userId, {
      kind: "ejercicio",
      discipline: m.discipline,
      exerciseId: m.exerciseId,
      difficulty: m.difficulty,
      startValue: m.value,
      deadline: toISODate(suggestDeadline(m.difficulty, today)),
    });
    if (!r.ok) return { ok: false, errors: { marks: Object.values(r.errors).flat().filter((e) => e != null) } };
    goals.push({ userId, ...r.data });
  }

  const values = { ...profile, limitations: profile.limitations ?? null, onboardedAt: new Date() };
  await prisma.$transaction([
    prisma.profile.upsert({ where: { userId }, create: { userId, ...values }, update: values }),
    prisma.bodyMeasurement.upsert({
      where: { userId_date: { userId, date: today } },
      create: { userId, date: today, heightCm, weightKg },
      update: { heightCm, weightKg },
    }),
    prisma.goal.createMany({ data: goals }),
  ]);
  return { ok: true };
}
