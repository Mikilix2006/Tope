import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { todayMadrid } from "@/modules/engine";
import { MODULES, moduleFor } from "@/modules/registry";
import { saveMeasurement } from "@/server/core/measurements";
import { createGoal, deleteGoal, getGoal, listGoals, updateGoal } from "@/server/core/goals";
import { completeOnboarding, isOnboarded } from "@/server/core/onboarding";
import { createUser, prisma, resetDb } from "./db";

const fuerza = moduleFor("FUERZA");
const calistenia = moduleFor("CALISTENIA");
const crossfit = moduleFor("CROSSFIT");
const slugId = async (slug: string) => {
  const mod = MODULES.find((m) => slug.startsWith(m.slug))!;
  return (await mod.listExercises("nadie")).find((e) => e.slug === slug)!.id;
};
const ok = <T extends { ok: boolean }>(r: T) => {
  if (!r.ok) throw new Error(JSON.stringify(r));
  return r as Extract<T, { ok: true }>;
};
const today = todayMadrid();
const iso = (d: Date) => d.toISOString().slice(0, 10);

let ana: string;
let bea: string;
beforeAll(async () => {
  for (const m of MODULES) await m.seedCatalog();
});
beforeEach(async () => {
  await resetDb();
  ana = (await createUser("ana@ejemplo.es")).id;
  bea = (await createUser("bea@ejemplo.es")).id;
});

async function logSets(userId: string, mod = fuerza, exerciseId: string, sets: object[]) {
  const s = ok(await mod.startSession(userId, { date: iso(today) }));
  for (const v of sets) ok(await mod.addSet(userId, s.id, exerciseId, v));
  return s.id;
}

describe("crear objetivos", () => {
  it("de ejercicio: título del ejercicio, meta sugerida y valor actual = valor inicial sin registros", async () => {
    const sq = await slugId("fuerza-sentadilla-trasera");
    const { id } = ok(await createGoal(ana, { kind: "ejercicio", discipline: "FUERZA", exerciseId: sq, difficulty: "MEDIO", startValue: "100" }));
    const g = (await getGoal(ana, id))!;
    expect(g).toMatchObject({ title: "Sentadilla trasera", metric: "PESO", startValue: 100, targetValue: 105, targetEdited: false, current: 100, progress: 0, status: "EN_CURSO", deadline: null });
  });

  it("respeta la meta que escribe el usuario y la marca como editada", async () => {
    const sq = await slugId("fuerza-sentadilla-trasera");
    const edited = ok(await createGoal(ana, { kind: "ejercicio", discipline: "FUERZA", exerciseId: sq, difficulty: "MEDIO", startValue: 100, targetValue: 120 }));
    const same = ok(await createGoal(ana, { kind: "ejercicio", discipline: "FUERZA", exerciseId: sq, difficulty: "MEDIO", startValue: 100, targetValue: 105 }));
    expect(await getGoal(ana, edited.id)).toMatchObject({ targetValue: 120, targetEdited: true });
    expect(await getGoal(ana, same.id)).toMatchObject({ targetValue: 105, targetEdited: false });
  });

  it("en un WOD por tiempo la meta baja y no se admite una meta peor que el inicio", async () => {
    const fran = await slugId("crossfit-fran");
    const { id } = ok(await createGoal(ana, { kind: "ejercicio", discipline: "CROSSFIT", exerciseId: fran, difficulty: "MEDIO", startValue: 300 }));
    expect((await getGoal(ana, id))?.targetValue).toBe(270);
    const worse = await createGoal(ana, { kind: "ejercicio", discipline: "CROSSFIT", exerciseId: fran, difficulty: "MEDIO", startValue: 300, targetValue: 320 });
    expect(worse).toMatchObject({ ok: false, errors: { targetValue: [expect.stringMatching(/menor/)] } });
    const sq = await slugId("fuerza-sentadilla-trasera");
    expect((await createGoal(ana, { kind: "ejercicio", discipline: "FUERZA", exerciseId: sq, difficulty: "MEDIO", startValue: 100, targetValue: 90 })).ok).toBe(false);
  });

  it("de medida corporal: sube o baja según elija el usuario", async () => {
    const down = ok(await createGoal(ana, { kind: "medida", metric: "PESO_CORPORAL", direction: "BAJAR", difficulty: "MEDIO", startValue: 80 }));
    const up = ok(await createGoal(ana, { kind: "medida", metric: "BRAZO", direction: "SUBIR", difficulty: "FACIL", startValue: 35, deadline: "2027-01-31" }));
    expect(await getGoal(ana, down.id)).toMatchObject({ title: "Peso corporal", targetValue: 77, discipline: null, exerciseId: null });
    expect(await getGoal(ana, up.id)).toMatchObject({ title: "Brazo", targetValue: 36, deadline: new Date("2027-01-31T00:00:00Z") });
  });

  it("valida la entrada: tipo, dificultad, números, ejercicio inexistente, de otro usuario o de calorías", async () => {
    const sq = await slugId("fuerza-sentadilla-trasera");
    const base = { kind: "ejercicio", discipline: "FUERZA", exerciseId: sq, difficulty: "MEDIO", startValue: 100 };
    expect((await createGoal(ana, { ...base, kind: "otro" })).ok).toBe(false);
    expect((await createGoal(ana, { ...base, difficulty: "EXTREMO" })).ok).toBe(false);
    expect((await createGoal(ana, { ...base, startValue: "abc" })).ok).toBe(false);
    expect((await createGoal(ana, { ...base, startValue: -5 })).ok).toBe(false);
    expect((await createGoal(ana, { ...base, deadline: "2026-02-30" })).ok).toBe(false);
    expect((await createGoal(ana, { ...base, exerciseId: "no-existe" })).ok).toBe(false);
    // Ejercicio de calistenia pedido como fuerza: no está en ese catálogo.
    expect((await createGoal(ana, { ...base, exerciseId: await slugId("calistenia-dominadas") })).ok).toBe(false);
    const own = ok(await fuerza.createExercise(bea, { name: "Press de Bea", metric: "PESO" }));
    expect((await createGoal(ana, { ...base, exerciseId: own.id })).ok).toBe(false);
    const cal = await slugId("crossfit-assault-bike");
    expect(await createGoal(ana, { ...base, discipline: "CROSSFIT", exerciseId: cal })).toMatchObject({ ok: false, errors: { exerciseId: expect.any(Array) } });
    expect(await prisma.goal.count()).toBe(0);
  });

  it("un usuario puede poner objetivos sobre sus ejercicios propios", async () => {
    const own = ok(await fuerza.createExercise(ana, { name: "Press de Ana", metric: "PESO" }));
    expect((await createGoal(ana, { kind: "ejercicio", discipline: "FUERZA", exerciseId: own.id, difficulty: "FACIL", startValue: 40 })).ok).toBe(true);
  });
});

describe("valor actual, progreso y estado", () => {
  it("el valor actual es la mejor serie de la última sesión, solo del dueño", async () => {
    const sq = await slugId("fuerza-sentadilla-trasera");
    const { id } = ok(await createGoal(ana, { kind: "ejercicio", discipline: "FUERZA", exerciseId: sq, difficulty: "MEDIO", startValue: 100 }));
    // Bea levanta más, pero no cuenta para Ana.
    await logSets(bea, fuerza, sq, [{ weightKg: 150, reps: 1 }]);
    expect((await getGoal(ana, id))?.current).toBe(100);

    await logSets(ana, fuerza, sq, [{ weightKg: 102.5, reps: 5 }, { weightKg: 105, reps: 3 }, { weightKg: 95, reps: 8 }]);
    expect(await getGoal(ana, id)).toMatchObject({ current: 105, progress: 100, status: "CONSEGUIDO" });

    // Una sesión posterior más floja pasa a ser el valor actual («del último registro»).
    await logSets(ana, fuerza, sq, [{ weightKg: 102.5, reps: 5 }]);
    expect(await getGoal(ana, id)).toMatchObject({ current: 102.5, progress: 50, status: "EN_CURSO" });
  });

  it("no cuentan los registros anteriores a la creación del objetivo", async () => {
    const pullups = await slugId("calistenia-dominadas");
    const old = ok(await calistenia.startSession(ana, { date: "2026-01-10" }));
    ok(await calistenia.addSet(ana, old.id, pullups, { reps: 20 }));
    const { id } = ok(await createGoal(ana, { kind: "ejercicio", discipline: "CALISTENIA", exerciseId: pullups, difficulty: "DIFICIL", startValue: 4 }));
    expect(await getGoal(ana, id)).toMatchObject({ current: 4, targetValue: 8, status: "EN_CURSO" });
    await logSets(ana, calistenia, pullups, [{ reps: 6 }]);
    expect(await getGoal(ana, id)).toMatchObject({ current: 6, progress: 50 });
  });

  it("en un WOD por tiempo cuenta el mejor tiempo (el menor)", async () => {
    const fran = await slugId("crossfit-fran");
    const { id } = ok(await createGoal(ana, { kind: "ejercicio", discipline: "CROSSFIT", exerciseId: fran, difficulty: "MEDIO", startValue: 300 }));
    await logSets(ana, crossfit, fran, [{ seconds: 290 }, { seconds: 285 }]);
    expect(await getGoal(ana, id)).toMatchObject({ current: 285, progress: 50, status: "EN_CURSO" });
  });

  it("las medidas usan la última medida con ese dato, solo del dueño", async () => {
    const { id } = ok(await createGoal(ana, { kind: "medida", metric: "PESO_CORPORAL", direction: "BAJAR", difficulty: "MEDIO", startValue: 80 }));
    await saveMeasurement(bea, { date: iso(today), weightKg: 70 });
    expect((await getGoal(ana, id))?.current).toBe(80);
    await saveMeasurement(ana, { date: iso(today), weightKg: 78.5, waistCm: 85 });
    expect(await getGoal(ana, id)).toMatchObject({ current: 78.5, progress: 50 });
    await saveMeasurement(ana, { date: iso(new Date(today.getTime() + 86_400_000)), waistCm: 84 }); // sin peso: no cambia
    expect((await getGoal(ana, id))?.current).toBe(78.5);
  });

  it("vencido si pasó la fecha límite sin alcanzar la meta", async () => {
    const { id } = ok(await createGoal(ana, { kind: "medida", metric: "CINTURA", direction: "BAJAR", difficulty: "FACIL", startValue: 90, deadline: "2026-01-01" }));
    expect((await getGoal(ana, id))?.status).toBe("VENCIDO");
  });
});

describe("editar y borrar", () => {
  it("cambiar la dificultad recalcula la meta si no se escribe; una meta escrita se respeta", async () => {
    const sq = await slugId("fuerza-sentadilla-trasera");
    const { id } = ok(await createGoal(ana, { kind: "ejercicio", discipline: "FUERZA", exerciseId: sq, difficulty: "FACIL", startValue: 100 }));
    ok(await updateGoal(ana, id, { difficulty: "DIFICIL" }));
    expect(await getGoal(ana, id)).toMatchObject({ difficulty: "DIFICIL", targetValue: 110, targetEdited: false });
    ok(await updateGoal(ana, id, { difficulty: "DIFICIL", targetValue: 130, deadline: "2027-03-01" }));
    expect(await getGoal(ana, id)).toMatchObject({ targetValue: 130, targetEdited: true, deadline: new Date("2027-03-01T00:00:00Z") });
    expect((await updateGoal(ana, id, { difficulty: "MEDIO", targetValue: 100 })).ok).toBe(false);
    ok(await updateGoal(ana, id, { difficulty: "MEDIO" })); // sin fecha: se quita
    expect(await getGoal(ana, id)).toMatchObject({ targetValue: 105, deadline: null });
  });

  it("una medida conserva su dirección al cambiar de dificultad", async () => {
    const { id } = ok(await createGoal(ana, { kind: "medida", metric: "PESO_CORPORAL", direction: "BAJAR", difficulty: "FACIL", startValue: 80 }));
    ok(await updateGoal(ana, id, { difficulty: "DIFICIL" }));
    expect((await getGoal(ana, id))?.targetValue).toBe(75);
  });
});

describe("aislamiento de objetivos", () => {
  it("otro usuario no ve, edita ni borra un objetivo ajeno", async () => {
    const { id } = ok(await createGoal(ana, { kind: "medida", metric: "PESO_CORPORAL", direction: "BAJAR", difficulty: "MEDIO", startValue: 80 }));
    expect(await listGoals(bea)).toEqual([]);
    expect(await getGoal(bea, id)).toBeNull();
    expect((await updateGoal(bea, id, { difficulty: "DIFICIL", targetValue: 50 })).ok).toBe(false);
    expect(await deleteGoal(bea, id)).toBe(false);
    expect(await getGoal(ana, id)).toMatchObject({ targetValue: 77, difficulty: "MEDIO" });
    expect((await listGoals(ana)).map((g) => g.id)).toEqual([id]);
    expect(await deleteGoal(ana, id)).toBe(true);
    expect(await listGoals(ana)).toEqual([]);
  });
});

describe("asistente de alta", () => {
  const valid = async () => ({
    heightCm: "178",
    weightKg: "80.5",
    age: "30",
    disciplines: ["FUERZA", "CALISTENIA"],
    level: "INTERMEDIO",
    daysPerWeek: "4",
    sessionMinutes: "60",
    equipment: "GIMNASIO",
    limitations: "",
    marks: [
      { discipline: "CALISTENIA", exerciseId: await slugId("calistenia-dominadas"), value: "4", difficulty: "MEDIO" },
      { discipline: "FUERZA", exerciseId: await slugId("fuerza-press-banca"), value: "10", difficulty: "FACIL" },
    ],
  });

  it("guarda perfil, altura y peso de hoy y crea un objetivo por marca con meta y fecha sugeridas", async () => {
    expect(await isOnboarded(ana)).toBe(false);
    ok(await completeOnboarding(ana, await valid()));
    expect(await isOnboarded(ana)).toBe(true);
    expect(await prisma.profile.findUnique({ where: { userId: ana } })).toMatchObject({ age: 30, level: "INTERMEDIO", daysPerWeek: 4, equipment: "GIMNASIO", limitations: null });
    expect(await prisma.bodyMeasurement.findMany({ where: { userId: ana } })).toMatchObject([{ date: today, heightCm: 178, weightKg: 80.5 }]);
    const goals = await listGoals(ana);
    const byTitle = Object.fromEntries(goals.map((g) => [g.title, g]));
    expect(byTitle["Dominadas"]).toMatchObject({ startValue: 4, targetValue: 6, current: 4, deadline: new Date(today.getTime() + 8 * 7 * 86_400_000) });
    expect(byTitle["Press de banca"]).toMatchObject({ startValue: 10, targetValue: 12.5, deadline: new Date(today.getTime() + 4 * 7 * 86_400_000) });
    // Sin objetivos de otro usuario.
    expect(await listGoals(bea)).toEqual([]);
  });

  it("solo se completa una vez (no duplica objetivos)", async () => {
    ok(await completeOnboarding(ana, await valid()));
    expect((await completeOnboarding(ana, await valid())).ok).toBe(false);
    expect(await prisma.goal.count({ where: { userId: ana } })).toBe(2);
  });

  it("todo o nada: con un dato inválido o una marca imposible no guarda nada", async () => {
    const v = await valid();
    for (const bad of [
      { ...v, heightCm: "" },
      { ...v, disciplines: [] },
      { ...v, level: "EXPERTO" },
      { ...v, marks: [{ ...v.marks[0], discipline: "CROSSFIT" }] }, // disciplina no elegida
      { ...v, marks: [{ ...v.marks[1], exerciseId: v.marks[0].exerciseId }] }, // ejercicio de otro módulo
    ]) {
      expect((await completeOnboarding(ana, bad)).ok).toBe(false);
    }
    expect(await isOnboarded(ana)).toBe(false);
    expect(await prisma.bodyMeasurement.count({ where: { userId: ana } })).toBe(0);
    expect(await prisma.goal.count({ where: { userId: ana } })).toBe(0);
  });

  it("las marcas son opcionales", async () => {
    ok(await completeOnboarding(ana, { ...(await valid()), marks: [] }));
    expect(await isOnboarded(ana)).toBe(true);
  });
});
