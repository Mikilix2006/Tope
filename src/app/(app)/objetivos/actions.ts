"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { disciplineSchema } from "@/lib/validation";
import type { Errors } from "@/modules/engine";
import { moduleFor } from "@/modules/registry";
import { idSchema } from "@/modules/schemas";
import { requireUserId } from "@/server/auth/session";
import { createGoal, deleteGoal, updateGoal } from "@/server/core/goals";

// El userId sale de la sesión; los ids y valores del cliente los validan los esquemas de createGoal/updateGoal.

export type GoalState = { errors?: Errors; message?: string } | null;

const get = (form: FormData, ...keys: string[]) => Object.fromEntries(keys.map((k) => [k, form.get(k)]));

export async function createGoalAction(_prev: GoalState, form: FormData): Promise<GoalState> {
  const userId = await requireUserId();
  const r = await createGoal(userId, get(form, "kind", "discipline", "exerciseId", "metric", "direction", "difficulty", "startValue", "targetValue", "deadline"));
  if (!r.ok) return { errors: r.errors, message: r.errors.form?.[0] };
  revalidatePath("/objetivos");
  redirect("/objetivos");
}

export async function updateGoalAction(id: string, _prev: GoalState, form: FormData): Promise<GoalState> {
  const userId = await requireUserId();
  const r = await updateGoal(userId, idSchema.parse(id), get(form, "difficulty", "targetValue", "deadline"));
  if (!r.ok) return { errors: r.errors, message: r.errors.form?.[0] };
  revalidatePath("/objetivos");
  redirect("/objetivos");
}

export async function deleteGoalAction(id: string) {
  const userId = await requireUserId();
  await deleteGoal(userId, idSchema.parse(id));
  revalidatePath("/objetivos");
}

/** Mejor serie de la última sesión de un ejercicio, para rellenar el valor inicial. null si no hay registros. */
export async function latestStartAction(discipline: string, exerciseId: string): Promise<number | null> {
  const userId = await requireUserId();
  const d = disciplineSchema.safeParse(discipline);
  if (!d.success) return null;
  const mod = moduleFor(d.data);
  const exercise = await mod.getExercise(userId, idSchema.parse(exerciseId));
  return exercise ? mod.latestBest(userId, exercise.id, exercise.metric, new Date(0)) : null;
}
