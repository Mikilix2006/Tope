import type { GoalDifficulty, GoalMetric } from "@prisma/client";
import { GOAL_CONFIG as C } from "@/config/goals";
import { formatSeconds } from "@/lib/format";

// Lógica pura de objetivos (sin base de datos): la usan el servidor y el formulario del navegador.

export type Direction = "SUBIR" | "BAJAR";
export type GoalStatus = "EN_CURSO" | "CONSEGUIDO" | "VENCIDO";

// Métricas de medida corporal y su columna en BodyMeasurement.
export const BODY_METRIC_FIELDS = {
  PESO_CORPORAL: "weightKg",
  CINTURA: "waistCm",
  PECHO: "chestCm",
  CADERA: "hipCm",
  BRAZO: "armCm",
  MUSLO: "thighCm",
} as const;
export type BodyMetric = keyof typeof BODY_METRIC_FIELDS;
export const isBodyMetric = (m: GoalMetric): m is BodyMetric => m in BODY_METRIC_FIELDS;

// Métricas de ejercicio que admiten objetivo (las calorías no: no hay incremento definido para ellas).
export const EXERCISE_GOAL_METRICS = ["PESO", "REPETICIONES", "TIEMPO", "DISTANCIA"] as const;
export type ExerciseGoalMetric = (typeof EXERCISE_GOAL_METRICS)[number];
export const isExerciseGoalMetric = (m: string): m is ExerciseGoalMetric => (EXERCISE_GOAL_METRICS as readonly string[]).includes(m);

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Meta sugerida según la dificultad (incrementos en src/config/goals.ts). */
export function suggestTarget(metric: GoalMetric, difficulty: GoalDifficulty, start: number, direction: Direction): number {
  const sign = direction === "SUBIR" ? 1 : -1;
  let delta: number;
  switch (metric) {
    case "PESO": {
      const { pct, stepKg } = C.liftedWeight;
      delta = Math.max(stepKg, Math.round((start * pct[difficulty]) / stepKg) * stepKg);
      break;
    }
    case "REPETICIONES":
      delta = Math.max(C.reps.min, Math.round(start * C.reps.pct[difficulty]));
      break;
    case "TIEMPO":
    case "DISTANCIA":
      delta = Math.max(C.timeOrDistance.min, Math.round(start * C.timeOrDistance.pct[difficulty]));
      break;
    case "PESO_CORPORAL":
      delta = C.bodyWeightKg[difficulty];
      break;
    default:
      delta = C.perimeterCm[difficulty];
  }
  return Math.max(0, round1(start + sign * delta));
}

/** Fecha límite sugerida (día UTC), contando desde `today`. */
export function suggestDeadline(difficulty: GoalDifficulty, today: Date): Date {
  return new Date(today.getTime() + C.deadlineWeeks[difficulty] * 7 * 86_400_000);
}

export const toISODate = (d: Date) => d.toISOString().slice(0, 10);

export const directionOf = (g: { startValue: number; targetValue: number }): Direction => (g.targetValue >= g.startValue ? "SUBIR" : "BAJAR");

type Progress = { startValue: number; targetValue: number; current: number };

/** Porcentaje entre el inicio y la meta, de 0 a 100 (sirve para metas que suben y que bajan). */
export function goalProgress({ startValue, targetValue, current }: Progress): number {
  if (targetValue === startValue) return 100;
  const pct = ((current - startValue) / (targetValue - startValue)) * 100;
  return Math.min(100, Math.max(0, Math.round(pct)));
}

/** Conseguido si el valor actual alcanza la meta; vencido si pasó la fecha límite sin alcanzarla; si no, en curso. */
export function goalStatus(g: Progress & { deadline: Date | null }, today: Date): GoalStatus {
  const reached = directionOf(g) === "SUBIR" ? g.current >= g.targetValue : g.current <= g.targetValue;
  if (reached) return "CONSEGUIDO";
  if (g.deadline && g.deadline < today) return "VENCIDO";
  return "EN_CURSO";
}

const num = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 });

/** «82,5 kg», «8 rep», «1:30», «5000 m», «85 cm». */
export function formatGoalValue(metric: GoalMetric, v: number): string {
  if (metric === "TIEMPO") return formatSeconds(Math.round(v));
  if (metric === "REPETICIONES") return `${num.format(v)} rep`;
  if (metric === "DISTANCIA") return `${num.format(v)} m`;
  if (metric === "PESO" || metric === "PESO_CORPORAL") return `${num.format(v)} kg`;
  return `${num.format(v)} cm`;
}
