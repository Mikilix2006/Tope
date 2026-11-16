"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { measurementSchema } from "@/lib/validation";
import type { Errors } from "@/modules/engine";
import { idSchema } from "@/modules/schemas";
import { requireUserId } from "@/server/auth/session";
import { deleteMeasurement, saveMeasurement } from "@/server/core/measurements";

const MEASURE_FIELDS = ["weightKg", "heightCm", "waistCm", "chestCm", "hipCm", "armCm", "thighCm"] as const;

export type MeasurementState = { ok?: boolean; errors?: Errors; message?: string; values?: Record<string, string> } | null;

export async function saveMeasurementAction(_prev: MeasurementState, form: FormData): Promise<MeasurementState> {
  const userId = await requireUserId();
  const values = Object.fromEntries(["date", ...MEASURE_FIELDS].map((k) => [k, String(form.get(k) ?? "")]));
  const parsed = measurementSchema.safeParse(values);
  // Se devuelven los valores escritos: el formulario se reinicia tras cada envío y no deben perderse al fallar.
  if (!parsed.success) {
    const errors = z.flattenError(parsed.error);
    return { errors: { ...errors.fieldErrors, form: errors.formErrors }, values };
  }
  await saveMeasurement(userId, parsed.data);
  revalidatePath("/medidas");
  return { ok: true, message: "Medida guardada." };
}

export async function deleteMeasurementAction(id: string) {
  const userId = await requireUserId();
  await deleteMeasurement(userId, idSchema.parse(id));
  revalidatePath("/medidas");
}
