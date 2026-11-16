import type { Discipline, PrismaClient } from "@prisma/client";
import { DEMO_USER } from "@/config/demo";
import { suggestTarget } from "@/lib/goals";
import { hashPassword } from "@/server/auth/password";

const DAY = 86_400_000;

function utcDay(daysAgo: number, now: Date) {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return new Date(d.getTime() - daysAgo * DAY);
}

/**
 * Crea o reinicia el usuario demo. Idempotente: el usuario se conserva (mismo id) y sus datos se rehacen,
 * así que ejecutarlo varias veces deja siempre lo mismo y deshace lo que hayan cambiado las visitas.
 * Datos deterministas (sin aleatorios), relativos a `now` para que la demo siempre parezca reciente.
 * Requiere los catálogos de ejercicios ya sembrados (ver prisma/seed.ts).
 */
export async function seedDemo(prisma: PrismaClient, now = new Date()) {
  const passwordHash = await hashPassword(DEMO_USER.password);
  const user = await prisma.user.upsert({
    where: { email: DEMO_USER.email },
    create: { email: DEMO_USER.email, name: DEMO_USER.name, passwordHash, isDemo: true },
    update: { name: DEMO_USER.name, passwordHash, isDemo: true },
  });
  const userId = user.id;

  const profile = {
    age: 31,
    disciplines: ["CALISTENIA", "FUERZA"] as Discipline[],
    level: "INTERMEDIO" as const,
    daysPerWeek: 4,
    sessionMinutes: 60,
    equipment: "GIMNASIO" as const,
    limitations: "Molestia leve en el hombro izquierdo",
    onboardedAt: utcDay(84, now),
  };

  // 12 semanas: peso de 82 a ~78,7 kg y cintura de 90 a ~86,7 cm, una medida por semana.
  const measurements = Array.from({ length: 13 }, (_, w) => ({
    userId,
    date: utcDay((12 - w) * 7, now),
    weightKg: Math.round((82 - w * 0.275) * 10) / 10,
    waistCm: Math.round((90 - w * 0.275) * 10) / 10,
    heightCm: w === 0 ? 178 : null,
  }));

  // Lunes/martes/jueves/sábado aproximados: 4 días por semana, alternando disciplinas; algunas semanas se salta uno.
  const trainingDays = Array.from({ length: 84 }, (_, i) => i)
    .filter((i) => [0, 1, 3, 5].includes(i % 7) && !(i % 7 === 5 && i % 21 === 5))
    .map((i) => ({
      userId,
      date: utcDay(84 - i, now),
      discipline: (i % 7 < 2 ? "FUERZA" : "CALISTENIA") as Discipline,
    }));

  await prisma.$transaction([
    prisma.profile.upsert({ where: { userId }, create: { userId, ...profile }, update: profile }),
    prisma.bodyMeasurement.deleteMany({ where: { userId } }),
    prisma.trainingDay.deleteMany({ where: { userId } }),
    prisma.goal.deleteMany({ where: { userId } }),
    prisma.fuerzaSession.deleteMany({ where: { userId } }),
    prisma.fuerzaRoutine.deleteMany({ where: { userId } }),
    prisma.calisteniaSession.deleteMany({ where: { userId } }),
    prisma.calisteniaRoutine.deleteMany({ where: { userId } }),
    prisma.bodyMeasurement.createMany({ data: measurements }),
    prisma.trainingDay.createMany({ data: trainingDays }),
  ]);

  await seedDemoWorkouts(prisma, userId, trainingDays);
  await seedDemoGoals(prisma, userId, now);
  return userId;
}

// Progresión lineal entre `from` y `to` a lo largo de las 12 semanas (p de 0 a 1), redondeada a `step`.
const prog = (from: number, to: number, p: number, step = 1) => Math.round((from + (to - from) * p) / step) * step;

/** Una rutina por disciplina y una sesión con sus series en cada día entrenado. Necesita los catálogos ya sembrados. */
async function seedDemoWorkouts(prisma: PrismaClient, userId: string, days: { date: Date; discipline: Discipline }[]) {
  const fz = await idsBySlug(prisma.fuerzaExercise.findMany({ where: { slug: { startsWith: "fuerza-" } } }));
  const ca = await idsBySlug(prisma.calisteniaExercise.findMany({ where: { slug: { startsWith: "calistenia-" } } }));

  const fuerzaRoutine = await prisma.fuerzaRoutine.create({
    data: {
      userId,
      name: "Fuerza: pierna y empuje",
      items: {
        create: [
          { position: 0, exerciseId: fz("fuerza-sentadilla-trasera"), sets: 4, reps: 5, weightKg: 90 },
          { position: 1, exerciseId: fz("fuerza-press-banca"), sets: 4, reps: 5, weightKg: 65 },
          { position: 2, exerciseId: fz("fuerza-remo-barra"), sets: 3, reps: 8, weightKg: 55 },
        ],
      },
    },
  });
  const calisteniaRoutine = await prisma.calisteniaRoutine.create({
    data: {
      userId,
      name: "Calistenia: tirón y core",
      items: {
        create: [
          { position: 0, exerciseId: ca("calistenia-dominadas"), sets: 4, reps: 8 },
          { position: 1, exerciseId: ca("calistenia-fondos-paralelas"), sets: 3, reps: 12 },
          { position: 2, exerciseId: ca("calistenia-plancha"), sets: 3, seconds: 60 },
        ],
      },
    },
  });

  const first = days[0].date.getTime();
  const span = days[days.length - 1].date.getTime() - first || 1;
  for (const { date, discipline } of days) {
    const p = (date.getTime() - first) / span;
    const rep = <T,>(n: number, set: T) => Array.from({ length: n }, () => set);
    if (discipline === "FUERZA") {
      await prisma.fuerzaSession.create({
        data: {
          userId,
          date,
          routineId: fuerzaRoutine.id,
          sets: {
            create: [
              ...rep(4, { exerciseId: fz("fuerza-sentadilla-trasera"), reps: 5, weightKg: prog(80, 95, p, 2.5), rpe: 8 }),
              ...rep(4, { exerciseId: fz("fuerza-press-banca"), reps: 5, weightKg: prog(60, 70, p, 2.5), rpe: 8 }),
              ...rep(3, { exerciseId: fz("fuerza-remo-barra"), reps: 8, weightKg: prog(50, 60, p, 2.5) }),
            ],
          },
        },
      });
    } else {
      await prisma.calisteniaSession.create({
        data: {
          userId,
          date,
          routineId: calisteniaRoutine.id,
          sets: {
            create: [
              ...rep(4, { exerciseId: ca("calistenia-dominadas"), reps: prog(6, 10, p) }),
              ...rep(3, { exerciseId: ca("calistenia-fondos-paralelas"), reps: prog(8, 14, p) }),
              ...rep(3, { exerciseId: ca("calistenia-plancha"), seconds: prog(45, 75, p, 5) }),
            ],
          },
        },
      });
    }
  }
}

/** Objetivos creados al darse de alta (hace 12 semanas): dos conseguidos, tres en curso y uno vencido. */
async function seedDemoGoals(prisma: PrismaClient, userId: string, now: Date) {
  const fz = await idsBySlug(prisma.fuerzaExercise.findMany({ where: { slug: { startsWith: "fuerza-" } } }));
  const ca = await idsBySlug(prisma.calisteniaExercise.findMany({ where: { slug: { startsWith: "calistenia-" } } }));
  const createdAt = utcDay(84, now);
  const base = { userId, createdAt, targetEdited: false };
  await prisma.goal.createMany({
    data: [
      // Conseguido: 80 → 87,5 kg (la sentadilla llega a 95).
      { ...base, title: "Sentadilla trasera", metric: "PESO", discipline: "FUERZA", exerciseId: fz("fuerza-sentadilla-trasera"), difficulty: "DIFICIL", startValue: 80, targetValue: suggestTarget("PESO", "DIFICIL", 80, "SUBIR"), deadline: utcDay(0, now) },
      // En curso con meta editada: 60 → 80 kg (va por 70).
      { ...base, title: "Press de banca", metric: "PESO", discipline: "FUERZA", exerciseId: fz("fuerza-press-banca"), difficulty: "MEDIO", startValue: 60, targetValue: 80, targetEdited: true, deadline: utcDay(-28, now) },
      // En curso: 6 → 12 dominadas (va por 10).
      { ...base, title: "Dominadas", metric: "REPETICIONES", discipline: "CALISTENIA", exerciseId: ca("calistenia-dominadas"), difficulty: "DIFICIL", startValue: 6, targetValue: suggestTarget("REPETICIONES", "DIFICIL", 6, "SUBIR"), deadline: utcDay(-14, now) },
      // Vencido: plancha de 45 a 90 s en 4 semanas (va por 75).
      { ...base, title: "Plancha", metric: "TIEMPO", discipline: "CALISTENIA", exerciseId: ca("calistenia-plancha"), difficulty: "DIFICIL", startValue: 45, targetValue: 90, targetEdited: true, deadline: utcDay(56, now) },
      // Conseguido: cintura de 90 a 87 cm. En curso: peso de 82 a 77 kg.
      { ...base, title: "Cintura", metric: "CINTURA", difficulty: "DIFICIL", startValue: 90, targetValue: suggestTarget("CINTURA", "DIFICIL", 90, "BAJAR"), deadline: null },
      { ...base, title: "Peso corporal", metric: "PESO_CORPORAL", difficulty: "DIFICIL", startValue: 82, targetValue: suggestTarget("PESO_CORPORAL", "DIFICIL", 82, "BAJAR"), deadline: utcDay(-21, now) },
    ],
  });
}

async function idsBySlug(rows: Promise<{ id: string; slug: string | null }[]>) {
  const map = new Map((await rows).map((r) => [r.slug, r.id]));
  return (slug: string) => {
    const id = map.get(slug);
    if (!id) throw new Error(`Falta el ejercicio ${slug} en el catálogo: ejecuta antes el seed de catálogos.`);
    return id;
  };
}
