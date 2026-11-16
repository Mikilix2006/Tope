import { prisma } from "@/lib/db";
import { createModule, type CatalogEntry } from "../engine";

// Barra, máquinas y mancuernas: siempre peso × repeticiones, con RPE opcional.
const G = "GIMNASIO" as const;
const M = "MANCUERNAS" as const;
const ex = (slug: string, name: string, muscle: string, equipment: CatalogEntry["equipment"] = G): CatalogEntry => ({
  slug: `fuerza-${slug}`,
  name,
  metric: "PESO",
  muscle,
  equipment,
});

export const FUERZA_CATALOG: CatalogEntry[] = [
  ex("sentadilla-trasera", "Sentadilla trasera", "Piernas"),
  ex("sentadilla-frontal", "Sentadilla frontal", "Piernas"),
  ex("prensa", "Prensa de piernas", "Piernas"),
  ex("zancadas-mancuernas", "Zancadas con mancuernas", "Piernas", M),
  ex("sentadilla-goblet", "Sentadilla goblet", "Piernas", M),
  ex("extension-cuadriceps", "Extensión de cuádriceps", "Piernas"),
  ex("curl-femoral", "Curl femoral", "Piernas"),
  ex("gemelos", "Elevación de gemelos", "Piernas"),
  ex("peso-muerto", "Peso muerto", "Cadena posterior"),
  ex("peso-muerto-rumano", "Peso muerto rumano", "Cadena posterior"),
  ex("hip-thrust", "Hip thrust", "Cadena posterior"),
  ex("press-banca", "Press de banca", "Pecho"),
  ex("press-inclinado", "Press de banca inclinado", "Pecho"),
  ex("press-mancuernas", "Press de banca con mancuernas", "Pecho", M),
  ex("fondos-lastrados", "Fondos lastrados", "Pecho"),
  ex("press-militar", "Press militar", "Hombros"),
  ex("press-hombro-mancuernas", "Press de hombro con mancuernas", "Hombros", M),
  ex("elevaciones-laterales", "Elevaciones laterales", "Hombros", M),
  ex("face-pull", "Face pull", "Hombros"),
  ex("remo-barra", "Remo con barra", "Espalda"),
  ex("remo-mancuerna", "Remo con mancuerna", "Espalda", M),
  ex("dominadas-lastradas", "Dominadas lastradas", "Espalda"),
  ex("jalon-pecho", "Jalón al pecho", "Espalda"),
  ex("remo-polea", "Remo en polea baja", "Espalda"),
  ex("curl-barra", "Curl de bíceps con barra", "Brazos"),
  ex("curl-mancuernas", "Curl de bíceps con mancuernas", "Brazos", M),
  ex("triceps-polea", "Extensión de tríceps en polea", "Brazos"),
  ex("press-frances", "Press francés", "Brazos"),
];

export const fuerza = createModule({
  slug: "fuerza",
  discipline: "FUERZA",
  name: "Fuerza",
  description: "Barra, mancuernas y máquinas: kilos, repeticiones y RPE.",
  fields: ["weightKg", "reps", "rpe"],
  metrics: ["PESO"],
  lowerIsBetter: [],
  catalog: FUERZA_CATALOG,
  db: { exercise: prisma.fuerzaExercise, routine: prisma.fuerzaRoutine, session: prisma.fuerzaSession, set: prisma.fuerzaSet },
});
