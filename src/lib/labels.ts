import type { Discipline, Equipment, GoalDifficulty, Level } from "@prisma/client";
import type { BodyMetric, GoalStatus } from "@/lib/goals";

export const DISCIPLINES: Record<Discipline, string> = { CALISTENIA: "Calistenia", CROSSFIT: "CrossFit", FUERZA: "Fuerza" };
export const LEVELS: Record<Level, string> = { PRINCIPIANTE: "Principiante", INTERMEDIO: "Intermedio", AVANZADO: "Avanzado" };
export const EQUIPMENT: Record<Equipment, string> = {
  SIN_MATERIAL: "Sin material",
  MANCUERNAS: "Mancuernas",
  GIMNASIO: "Gimnasio completo",
};
export const DIFFICULTIES: Record<GoalDifficulty, string> = { FACIL: "Fácil", MEDIO: "Medio", DIFICIL: "Difícil" };
export const GOAL_STATUS: Record<GoalStatus, string> = { EN_CURSO: "En curso", CONSEGUIDO: "Conseguido", VENCIDO: "Vencido" };
export const BODY_METRICS: Record<BodyMetric, string> = {
  PESO_CORPORAL: "Peso corporal",
  CINTURA: "Cintura",
  PECHO: "Pecho",
  CADERA: "Cadera",
  BRAZO: "Brazo",
  MUSLO: "Muslo",
};
