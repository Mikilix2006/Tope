import type { ExerciseMetric } from "@prisma/client";
import * as z from "zod";
import { equipmentSchema } from "@/lib/validation"; // importa también los mensajes de Zod en español
import { FIELD_SPECS, fieldsFor, type SetField, type SetValues } from "./fields";

const emptyToUndefined = (v: unknown) => (v === "" || v == null ? undefined : v);

function numberSchema(field: SetField) {
  const s = FIELD_SPECS[field];
  const n = z.coerce.number().min(s.min).max(s.max);
  return s.int ? n.int() : n;
}

// Serie registrada: obligatorios según la métrica; el resto opcional; los campos que no tocan se descartan.
export function setSchema(moduleFields: readonly SetField[], metric: ExerciseMetric) {
  const { shown, required } = fieldsFor(moduleFields, metric);
  return z.object(
    Object.fromEntries(
      shown.map((f) => [f, z.preprocess(emptyToUndefined, required.includes(f) ? numberSchema(f) : numberSchema(f).optional())]),
    ),
  ) as z.ZodType<SetValues>;
}

// Objetivo por serie en una rutina: todo opcional.
export function targetSchema(moduleFields: readonly SetField[]) {
  return z.object(Object.fromEntries(moduleFields.map((f) => [f, z.preprocess(emptyToUndefined, numberSchema(f).nullish())]))) as z.ZodType<SetValues>;
}

const idSchema = z.string().min(1).max(40);

export function exerciseSchema(metrics: readonly ExerciseMetric[]) {
  return z.object({
    name: z.string().trim().min(2, { error: "El nombre debe tener al menos 2 caracteres." }).max(60),
    metric: z.enum(metrics as [ExerciseMetric, ...ExerciseMetric[]], { error: "Elige qué se mide." }),
    muscle: z.preprocess(emptyToUndefined, z.string().trim().max(40).optional()),
    equipment: z.preprocess(emptyToUndefined, equipmentSchema.optional()),
  });
}

export function routineSchema(moduleFields: readonly SetField[]) {
  return z.object({
    name: z.string().trim().min(2, { error: "Ponle un nombre de al menos 2 caracteres." }).max(60),
    notes: z.preprocess(emptyToUndefined, z.string().trim().max(500).optional()),
    items: z
      .array(z.object({ exerciseId: idSchema, sets: z.coerce.number().int().min(1).max(20) }).and(targetSchema(moduleFields)))
      .min(1, { error: "Añade al menos un ejercicio." })
      .max(30),
  });
}

export const sessionStartSchema = z.object({
  routineId: z.preprocess(emptyToUndefined, idSchema.optional()),
  date: z.preprocess(emptyToUndefined, z.iso.date().optional()),
});

export { idSchema };
