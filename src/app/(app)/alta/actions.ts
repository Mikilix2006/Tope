"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Errors } from "@/modules/engine";
import { requireUserId } from "@/server/auth/session";
import { completeOnboarding } from "@/server/core/onboarding";

export type OnboardingState = { errors?: Errors; message?: string } | null;

// El asistente envía todo junto al terminar; el servidor valida con onboardingSchema (dentro de completeOnboarding).
export async function completeOnboardingAction(_prev: OnboardingState, form: FormData): Promise<OnboardingState> {
  const userId = await requireUserId();
  let payload: unknown;
  try {
    payload = JSON.parse(String(form.get("payload") ?? ""));
  } catch {
    return { message: "No se han podido leer los datos del alta." };
  }
  const r = await completeOnboarding(userId, payload);
  if (!r.ok) return { errors: r.errors, message: r.errors.form?.[0] };
  revalidatePath("/", "layout");
  // shortcut: aquí irá la generación de la primera rutina con IA (fase 4); de momento se va a los objetivos recién creados.
  redirect("/objetivos");
}
