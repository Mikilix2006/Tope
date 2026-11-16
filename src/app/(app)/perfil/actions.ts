"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { profileSchema } from "@/lib/validation";
import { requireUserId } from "@/server/auth/session";
import { updateProfile } from "@/server/core/profile";

export type ProfileState = { ok: boolean; errors?: Record<string, string[] | undefined>; message?: string } | null;

export async function saveProfileAction(_prev: ProfileState, form: FormData): Promise<ProfileState> {
  const userId = await requireUserId();
  const parsed = profileSchema.safeParse({
    age: form.get("age"),
    disciplines: form.getAll("disciplines"),
    level: form.get("level") || undefined,
    daysPerWeek: form.get("daysPerWeek"),
    sessionMinutes: form.get("sessionMinutes"),
    equipment: form.get("equipment") || undefined,
    limitations: form.get("limitations"),
  });
  if (!parsed.success) return { ok: false, errors: z.flattenError(parsed.error).fieldErrors };

  await updateProfile(userId, parsed.data);
  revalidatePath("/perfil");
  return { ok: true, message: "Perfil guardado." };
}
