import type { GoalDifficulty } from "@prisma/client";

// Incrementos de la meta sugerida según la dificultad. Único sitio donde se ajustan: la lógica (src/lib/goals.ts) no tiene cifras.
// Sin dependencias de servidor: también lo usa el formulario del navegador para mostrar la sugerencia.
export const GOAL_CONFIG = {
  /** Peso levantado: porcentaje sobre el valor inicial, redondeado a saltos de `stepKg` y como mínimo un salto. */
  liftedWeight: { pct: { FACIL: 0.025, MEDIO: 0.05, DIFICIL: 0.1 }, stepKg: 2.5 },
  /** Repeticiones: porcentaje sobre el valor inicial, como mínimo `min`. */
  reps: { pct: { FACIL: 0.25, MEDIO: 0.5, DIFICIL: 1 }, min: 1 },
  /** Tiempo (s) o distancia (m): porcentaje; en los ejercicios donde menos es mejor (WOD por tiempo), se resta. Mínimo `min`. */
  timeOrDistance: { pct: { FACIL: 0.05, MEDIO: 0.1, DIFICIL: 0.2 }, min: 1 },
  /** Peso corporal: kilos a subir o bajar (lo elige el usuario). */
  bodyWeightKg: { FACIL: 1, MEDIO: 3, DIFICIL: 5 },
  /** Perímetros (cintura, pecho...): centímetros a subir o bajar. */
  perimeterCm: { FACIL: 1, MEDIO: 2, DIFICIL: 3 },
  /** Fecha límite sugerida, en semanas desde hoy. */
  deadlineWeeks: { FACIL: 4, MEDIO: 8, DIFICIL: 12 },
} as const satisfies {
  liftedWeight: { pct: Record<GoalDifficulty, number>; stepKg: number };
  reps: { pct: Record<GoalDifficulty, number>; min: number };
  timeOrDistance: { pct: Record<GoalDifficulty, number>; min: number };
  bodyWeightKg: Record<GoalDifficulty, number>;
  perimeterCm: Record<GoalDifficulty, number>;
  deadlineWeeks: Record<GoalDifficulty, number>;
};
