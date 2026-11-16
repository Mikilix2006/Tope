"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Errors } from "@/modules/engine";
import { getModule } from "@/modules/registry";
import { idSchema } from "@/modules/schemas";
import { requireUserId } from "@/server/auth/session";

// Los argumentos ligados con .bind() llegan del cliente: se validan igual que el formulario.
// La propiedad de cada rutina, sesión o serie la comprueba el módulo con el userId de la sesión.

export type FormState = { ok?: boolean; errors?: Errors; message?: string } | null;

async function context(slug: unknown) {
  const userId = await requireUserId();
  const mod = typeof slug === "string" ? getModule(slug) : null;
  if (!mod) throw new Error("Disciplina desconocida.");
  return { userId, mod, base: `/entrenar/${mod.slug}` };
}

const id = (v: unknown) => idSchema.parse(v);

export async function createExerciseAction(slug: string, _prev: FormState, form: FormData): Promise<FormState> {
  const { userId, mod, base } = await context(slug);
  const r = await mod.createExercise(userId, {
    name: form.get("name"),
    metric: form.get("metric") ?? undefined,
    muscle: form.get("muscle"),
    equipment: form.get("equipment"),
  });
  if (!r.ok) return { errors: r.errors };
  revalidatePath(`${base}/ejercicios`);
  return { ok: true, message: "Ejercicio creado." };
}

export async function saveRoutineAction(slug: string, routineId: string | null, _prev: FormState, form: FormData): Promise<FormState> {
  const { userId, mod, base } = await context(slug);
  let payload: unknown;
  try {
    payload = JSON.parse(String(form.get("payload") ?? ""));
  } catch {
    return { message: "No se ha podido leer la rutina." };
  }
  const r = await mod.saveRoutine(userId, payload, routineId ? id(routineId) : undefined);
  if (!r.ok) return { errors: r.errors, message: r.errors.form?.[0] };
  revalidatePath(base);
  redirect(base);
}

export async function deleteRoutineAction(slug: string, routineId: string) {
  const { userId, mod, base } = await context(slug);
  await mod.deleteRoutine(userId, id(routineId));
  revalidatePath(base);
  redirect(base);
}

export async function startSessionAction(slug: string, routineId: string | null) {
  const { userId, mod, base } = await context(slug);
  const r = await mod.startSession(userId, { routineId: routineId ? id(routineId) : undefined });
  // Si la rutina ya no existe, de vuelta a la disciplina.
  redirect(r.ok ? `${base}/sesion/${r.id}` : base);
}

export async function addSetAction(slug: string, sessionId: string, exerciseId: string, _prev: FormState, form: FormData): Promise<FormState> {
  const { userId, mod, base } = await context(slug);
  const values = Object.fromEntries(mod.fields.map((f) => [f, form.get(f)]));
  const r = await mod.addSet(userId, id(sessionId), exerciseId, values);
  if (!r.ok) return { errors: r.errors, message: r.errors.form?.[0] ?? "Revisa los valores de la serie." };
  revalidatePath(`${base}/sesion/${sessionId}`);
  return { ok: true };
}

export async function deleteSetAction(slug: string, sessionId: string, setId: string) {
  const { userId, mod, base } = await context(slug);
  await mod.deleteSet(userId, id(setId));
  revalidatePath(`${base}/sesion/${id(sessionId)}`);
}

export async function deleteSessionAction(slug: string, sessionId: string) {
  const { userId, mod, base } = await context(slug);
  await mod.deleteSession(userId, id(sessionId));
  revalidatePath(base);
  redirect(base);
}
