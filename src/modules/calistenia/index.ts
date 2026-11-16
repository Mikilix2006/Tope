import { prisma } from "@/lib/db";
import { createModule, type CatalogEntry } from "../engine";

// Peso corporal: repeticiones (con lastre opcional) o segundos aguantando en los estáticos.
// Lo que necesita barra o paralelas se marca como GIMNASIO (gimnasio o parque).
const ex = (
  slug: string,
  name: string,
  muscle: string,
  metric: CatalogEntry["metric"] = "REPETICIONES",
  equipment: CatalogEntry["equipment"] = "SIN_MATERIAL",
): CatalogEntry => ({ slug: `calistenia-${slug}`, name, metric, muscle, equipment });

const BARRA = "GIMNASIO" as const;

export const CALISTENIA_CATALOG: CatalogEntry[] = [
  ex("flexiones", "Flexiones", "Empuje"),
  ex("flexiones-diamante", "Flexiones diamante", "Empuje"),
  ex("flexiones-pica", "Flexiones en pica", "Empuje"),
  ex("flexiones-arquero", "Flexiones arquero", "Empuje"),
  ex("flexiones-pino", "Flexiones en pino contra la pared", "Empuje"),
  ex("fondos-banco", "Fondos en banco", "Empuje"),
  ex("fondos-paralelas", "Fondos en paralelas", "Empuje", "REPETICIONES", BARRA),
  ex("dominadas", "Dominadas", "Tirón", "REPETICIONES", BARRA),
  ex("dominadas-supinas", "Dominadas supinas", "Tirón", "REPETICIONES", BARRA),
  ex("dominadas-arquero", "Dominadas arquero", "Tirón", "REPETICIONES", BARRA),
  ex("remo-australiano", "Remo australiano", "Tirón", "REPETICIONES", BARRA),
  ex("muscle-up", "Muscle-up", "Tirón", "REPETICIONES", BARRA),
  ex("sentadillas", "Sentadillas", "Piernas"),
  ex("sentadilla-bulgara", "Sentadilla búlgara", "Piernas"),
  ex("sentadilla-pistol", "Sentadilla pistol", "Piernas"),
  ex("zancadas", "Zancadas", "Piernas"),
  ex("puente-gluteo", "Puente de glúteo", "Piernas"),
  ex("curl-nordico", "Curl nórdico", "Piernas"),
  ex("elevaciones-piernas", "Elevaciones de piernas colgado", "Core", "REPETICIONES", BARRA),
  ex("burpees", "Burpees", "Core"),
  ex("plancha", "Plancha", "Core", "TIEMPO"),
  ex("plancha-lateral", "Plancha lateral", "Core", "TIEMPO"),
  ex("hollow-hold", "Hollow hold", "Core", "TIEMPO"),
  ex("l-sit", "L-sit", "Estáticos", "TIEMPO"),
  ex("pino", "Pino (handstand)", "Estáticos", "TIEMPO"),
  ex("planche-tuck", "Planche tuck", "Estáticos", "TIEMPO"),
  ex("front-lever-tuck", "Front lever tuck", "Estáticos", "TIEMPO", BARRA),
  ex("colgado-barra", "Colgado en barra (dead hang)", "Estáticos", "TIEMPO", BARRA),
];

export const calistenia = createModule({
  slug: "calistenia",
  discipline: "CALISTENIA",
  name: "Calistenia",
  description: "Tu peso corporal: repeticiones, lastre y segundos en los estáticos.",
  fields: ["reps", "seconds", "weightKg"],
  metrics: ["REPETICIONES", "TIEMPO"],
  lowerIsBetter: [],
  catalog: CALISTENIA_CATALOG,
  db: {
    exercise: prisma.calisteniaExercise,
    routine: prisma.calisteniaRoutine,
    session: prisma.calisteniaSession,
    set: prisma.calisteniaSet,
  },
});
