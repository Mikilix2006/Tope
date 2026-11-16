import type { ExerciseMetric } from "@prisma/client";
import { formatSeconds as time } from "@/lib/format";

// Sin dependencias de servidor: lo usan también los componentes de cliente.
// Campos que puede tener una serie. Cada módulo usa solo los suyos (sus columnas en la base de datos).
export const FIELD_SPECS = {
  weightKg: { label: "Peso", unit: "kg", min: 0, max: 500, step: 2.5, int: false },
  reps: { label: "Repeticiones", unit: "", min: 1, max: 1000, step: 1, int: true },
  seconds: { label: "Tiempo", unit: "s", min: 1, max: 86_400, step: 5, int: true },
  meters: { label: "Distancia", unit: "m", min: 1, max: 100_000, step: 100, int: true },
  calories: { label: "Calorías", unit: "kcal", min: 1, max: 5_000, step: 5, int: true },
  rpe: { label: "RPE", unit: "", min: 1, max: 10, step: 0.5, int: false },
} as const;

export type SetField = keyof typeof FIELD_SPECS;
export type SetValues = Partial<Record<SetField, number | null>>;

// Por métrica: campos que se muestran (en orden) y los obligatorios. Se cruzan con los campos del módulo.
export const METRIC_FIELDS: Record<ExerciseMetric, { show: SetField[]; required: SetField[] }> = {
  PESO: { show: ["weightKg", "reps", "rpe"], required: ["weightKg", "reps"] },
  REPETICIONES: { show: ["reps", "weightKg"], required: ["reps"] },
  TIEMPO: { show: ["seconds"], required: ["seconds"] },
  DISTANCIA: { show: ["meters", "seconds"], required: ["meters"] },
  CALORIAS: { show: ["calories", "seconds"], required: ["calories"] },
};

export const METRIC_LABELS: Record<ExerciseMetric, string> = {
  PESO: "Peso × repeticiones",
  REPETICIONES: "Repeticiones",
  TIEMPO: "Tiempo",
  DISTANCIA: "Distancia",
  CALORIAS: "Calorías",
};

export function fieldsFor(moduleFields: readonly SetField[], metric: ExerciseMetric) {
  const { show, required } = METRIC_FIELDS[metric];
  const shown = show.filter((f) => moduleFields.includes(f));
  return { shown, required: required.filter((f) => shown.includes(f)) };
}

// Texto corto de una serie: «80 kg × 5 · RPE 8», «12 rep + 10 kg», «1:30».
export function formatSet(values: SetValues, metric: ExerciseMetric): string {
  const num = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 });
  const { weightKg: w, reps: r, seconds: t, meters: m, calories: c, rpe } = values;
  const parts: string[] = [];
  if (metric === "PESO") parts.push(`${num.format(w ?? 0)} kg × ${r ?? 0}`);
  if (metric === "REPETICIONES") parts.push(`${r ?? 0} rep${w ? ` + ${num.format(w)} kg` : ""}`);
  if (metric === "TIEMPO" && t != null) parts.push(time(t));
  if (metric === "DISTANCIA") parts.push(`${num.format(m ?? 0)} m${t ? ` en ${time(t)}` : ""}`);
  if (metric === "CALORIAS") parts.push(`${c ?? 0} kcal${t ? ` en ${time(t)}` : ""}`);
  if (rpe != null && metric === "PESO") parts.push(`RPE ${num.format(rpe)}`);
  return parts.join(" · ");
}
