import * as z from "zod";
import type { Discipline, Goal, GoalMetric } from "@prisma/client";
import { prisma } from "@/lib/db";
import { BODY_METRICS } from "@/lib/labels";
import {
  BODY_METRIC_FIELDS,
  isExerciseGoalMetric,
  directionOf,
  goalProgress,
  goalStatus,
  isBodyMetric,
  suggestTarget,
  type Direction,
  type ExerciseGoalMetric,
  type GoalStatus,
} from "@/lib/goals";
import { goalSchema, goalUpdateSchema, type GoalInput } from "@/lib/validation";
import { todayMadrid, type Errors, type Result } from "@/modules/engine";
import { moduleFor } from "@/modules/registry";

// Aislamiento: toda función recibe el userId de la sesión y filtra por él. El valor actual se calcula, nunca llega del cliente.

const fail = (field: string, message: string): { ok: false; errors: Errors } => ({ ok: false, errors: { [field]: [message] } });
const day = (iso?: string) => (iso ? new Date(`${iso}T00:00:00Z`) : null);

const exerciseDirection = (discipline: Discipline, metric: GoalMetric): Direction =>
  (moduleFor(discipline).lowerIsBetter as readonly string[]).includes(metric) ? "BAJAR" : "SUBIR";

// Meta final: la sugerida, o la que escribió el usuario (se respeta y queda marcada como editada).
function pickTarget(metric: GoalMetric, difficulty: Goal["difficulty"], start: number, direction: Direction, typed?: number) {
  const suggested = suggestTarget(metric, difficulty, start, direction);
  return { targetValue: typed ?? suggested, targetEdited: typed != null && typed !== suggested };
}

// Una meta de ejercicio tiene que mejorar el inicio (subir, o bajar si menos es mejor); una de medida, ser distinta.
function badTarget(start: number, target: number, direction: Direction | null) {
  if (target === start) return "La meta tiene que ser distinta del valor inicial.";
  if (direction === "SUBIR" && target < start) return "La meta tiene que ser mayor que el valor inicial.";
  if (direction === "BAJAR" && target > start) return "La meta tiene que ser menor que el valor inicial.";
  return null;
}

type GoalData = Omit<Goal, "id" | "userId" | "createdAt">;

// Valida contra la base de datos (ejercicio visible para el usuario) y calcula la meta. No escribe nada.
export async function resolveGoal(userId: string, input: GoalInput): Promise<{ ok: true; data: GoalData } | { ok: false; errors: Errors }> {
  const deadline = day(input.deadline);
  if (input.kind === "ejercicio") {
    const exercise = await moduleFor(input.discipline).getExercise(userId, input.exerciseId);
    if (!exercise) return fail("exerciseId", "El ejercicio no existe.");
    const metric = exercise.metric;
    if (!isExerciseGoalMetric(metric)) return fail("exerciseId", "Este ejercicio no admite objetivos.");
    const direction = exerciseDirection(input.discipline, metric);
    const target = pickTarget(metric, input.difficulty, input.startValue, direction, input.targetValue);
    const bad = badTarget(input.startValue, target.targetValue, direction);
    if (bad) return fail("targetValue", bad);
    return {
      ok: true,
      data: { title: exercise.name, metric, discipline: input.discipline, exerciseId: exercise.id, difficulty: input.difficulty, startValue: input.startValue, deadline, ...target },
    };
  }
  const target = pickTarget(input.metric, input.difficulty, input.startValue, input.direction, input.targetValue);
  const bad = badTarget(input.startValue, target.targetValue, null);
  if (bad) return fail("targetValue", bad);
  return {
    ok: true,
    data: { title: BODY_METRICS[input.metric], metric: input.metric, discipline: null, exerciseId: null, difficulty: input.difficulty, startValue: input.startValue, deadline, ...target },
  };
}

export async function createGoal(userId: string, input: unknown): Promise<Result> {
  const parsed = goalSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: z.flattenError(parsed.error).fieldErrors };
  const resolved = await resolveGoal(userId, parsed.data);
  if (!resolved.ok) return resolved;
  const goal = await prisma.goal.create({ data: { userId, ...resolved.data }, select: { id: true } });
  return { ok: true, id: goal.id };
}

/** Cambia dificultad, meta y fecha límite. El inicio, la métrica y el ejercicio no cambian. */
export async function updateGoal(userId: string, id: string, input: unknown): Promise<Result> {
  const parsed = goalUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: z.flattenError(parsed.error).fieldErrors };
  const goal = await prisma.goal.findFirst({ where: { id, userId } });
  if (!goal) return fail("form", "El objetivo no existe.");

  const direction = goal.discipline ? exerciseDirection(goal.discipline, goal.metric) : directionOf(goal);
  const target = pickTarget(goal.metric, parsed.data.difficulty, goal.startValue, direction, parsed.data.targetValue);
  const bad = badTarget(goal.startValue, target.targetValue, goal.discipline ? direction : null);
  if (bad) return fail("targetValue", bad);

  await prisma.goal.updateMany({ where: { id, userId }, data: { difficulty: parsed.data.difficulty, deadline: day(parsed.data.deadline), ...target } });
  return { ok: true, id };
}

export async function deleteGoal(userId: string, id: string) {
  return (await prisma.goal.deleteMany({ where: { id, userId } })).count === 1;
}

/** Último registro desde el día en que se creó el objetivo: la mejor serie de la última sesión, o la última medida. */
async function currentValue(userId: string, goal: Goal): Promise<number | null> {
  const since = todayMadrid(goal.createdAt);
  if (isBodyMetric(goal.metric)) {
    const field = BODY_METRIC_FIELDS[goal.metric];
    const row = await prisma.bodyMeasurement.findFirst({
      where: { userId, date: { gte: since }, NOT: { [field]: null } },
      orderBy: { date: "desc" },
    });
    return row?.[field] ?? null;
  }
  if (!goal.discipline || !goal.exerciseId) return null;
  return moduleFor(goal.discipline).latestBest(userId, goal.exerciseId, goal.metric as ExerciseGoalMetric, since);
}

export type GoalView = Goal & { current: number; progress: number; status: GoalStatus };

async function toView(userId: string, g: Goal, today: Date): Promise<GoalView> {
  const current = (await currentValue(userId, g)) ?? g.startValue;
  const view = { ...g, current };
  return { ...view, progress: goalProgress(view), status: goalStatus(view, today) };
}

export async function listGoals(userId: string, today = todayMadrid()): Promise<GoalView[]> {
  const goals = await prisma.goal.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  return Promise.all(goals.map((g) => toView(userId, g, today)));
}

export async function getGoal(userId: string, id: string, today = todayMadrid()): Promise<GoalView | null> {
  const goal = await prisma.goal.findFirst({ where: { id, userId } });
  return goal && toView(userId, goal, today);
}
