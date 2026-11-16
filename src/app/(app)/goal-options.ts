import type { Discipline } from "@prisma/client";
import { isExerciseGoalMetric } from "@/lib/goals";
import type { ExerciseOption } from "@/components/goal-bits";
import { MODULES } from "@/modules/registry";

// Ejercicios que admiten objetivo (sin calorías) de las tres disciplinas, para los selectores del alta y de objetivos.
export async function loadGoalExercises(userId: string): Promise<ExerciseOption[]> {
  const lists = await Promise.all(
    MODULES.map(async (m) =>
      (await m.listExercises(userId))
        .flatMap((e): ExerciseOption[] =>
          isExerciseGoalMetric(e.metric)
            ? [{ id: e.id, name: e.name, metric: e.metric, discipline: m.discipline as Discipline, dir: (m.lowerIsBetter as readonly string[]).includes(e.metric) ? "BAJAR" : "SUBIR" }]
            : [],
        ),
    ),
  );
  return lists.flat();
}
