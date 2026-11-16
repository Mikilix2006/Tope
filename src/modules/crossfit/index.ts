import { prisma } from "@/lib/db";
import { createModule, type CatalogEntry } from "../engine";

// Halterofilia, gimnásticos, cardio y WODs de referencia.
// En CrossFit, TIEMPO es el tiempo en completar (WOD «por tiempo»): menos es mejor.
const ex = (
  slug: string,
  name: string,
  muscle: string,
  metric: CatalogEntry["metric"],
  equipment: CatalogEntry["equipment"] = "GIMNASIO",
): CatalogEntry => ({ slug: `crossfit-${slug}`, name, metric, muscle, equipment });

export const CROSSFIT_CATALOG: CatalogEntry[] = [
  ex("cargada", "Cargada (clean)", "Halterofilia", "PESO"),
  ex("cargada-potencia", "Cargada de potencia (power clean)", "Halterofilia", "PESO"),
  ex("arrancada", "Arrancada (snatch)", "Halterofilia", "PESO"),
  ex("dos-tiempos", "Dos tiempos (clean and jerk)", "Halterofilia", "PESO"),
  ex("thruster", "Thruster", "Halterofilia", "PESO"),
  ex("push-press", "Push press", "Halterofilia", "PESO"),
  ex("sentadilla-overhead", "Sentadilla overhead", "Halterofilia", "PESO"),
  ex("peso-muerto", "Peso muerto", "Halterofilia", "PESO"),
  ex("dominadas-kipping", "Dominadas kipping", "Gimnásticos", "REPETICIONES"),
  ex("chest-to-bar", "Chest to bar", "Gimnásticos", "REPETICIONES"),
  ex("toes-to-bar", "Toes to bar", "Gimnásticos", "REPETICIONES"),
  ex("muscle-up-anillas", "Muscle-up en anillas", "Gimnásticos", "REPETICIONES"),
  ex("hspu", "Flexiones en pino (HSPU)", "Gimnásticos", "REPETICIONES", "SIN_MATERIAL"),
  ex("box-jump", "Salto al cajón (box jump)", "Gimnásticos", "REPETICIONES"),
  ex("wall-ball", "Wall ball", "Gimnásticos", "REPETICIONES"),
  ex("burpees", "Burpees", "Gimnásticos", "REPETICIONES", "SIN_MATERIAL"),
  ex("double-unders", "Dobles de comba (double unders)", "Gimnásticos", "REPETICIONES", "SIN_MATERIAL"),
  ex("kettlebell-swing", "Swing con kettlebell", "Gimnásticos", "REPETICIONES", "MANCUERNAS"),
  ex("remo-ergometro", "Remo en ergómetro", "Cardio", "DISTANCIA"),
  ex("carrera", "Carrera", "Cardio", "DISTANCIA", "SIN_MATERIAL"),
  ex("assault-bike", "Assault bike", "Cardio", "CALORIAS"),
  ex("fran", "Fran (21-15-9 thruster y dominadas)", "WOD de referencia", "TIEMPO"),
  ex("grace", "Grace (30 dos tiempos)", "WOD de referencia", "TIEMPO"),
  ex("helen", "Helen (3 rondas: carrera, swings, dominadas)", "WOD de referencia", "TIEMPO"),
  ex("diane", "Diane (21-15-9 peso muerto y HSPU)", "WOD de referencia", "TIEMPO"),
  ex("karen", "Karen (150 wall balls)", "WOD de referencia", "TIEMPO"),
  ex("murph", "Murph", "WOD de referencia", "TIEMPO"),
  ex("cindy", "Cindy (AMRAP 20 min, repeticiones totales)", "WOD de referencia", "REPETICIONES"),
];

export const crossfit = createModule({
  slug: "crossfit",
  discipline: "CROSSFIT",
  name: "CrossFit",
  description: "Halterofilia, gimnásticos, cardio y WODs: kilos, repeticiones, tiempo, metros y calorías.",
  fields: ["reps", "weightKg", "seconds", "meters", "calories"],
  metrics: ["PESO", "REPETICIONES", "TIEMPO", "DISTANCIA", "CALORIAS"],
  lowerIsBetter: ["TIEMPO"],
  catalog: CROSSFIT_CATALOG,
  db: { exercise: prisma.crossfitExercise, routine: prisma.crossfitRoutine, session: prisma.crossfitSession, set: prisma.crossfitSet },
});
