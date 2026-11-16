import type { ExerciseMetric } from "@prisma/client";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { listTrainingDays } from "@/server/core/calendar";
import type { ExerciseRow, Module } from "@/modules/engine";
import { fieldsFor, type SetValues } from "@/modules/fields";
import { MODULES, getModule } from "@/modules/registry";
import { createUser, prisma, resetDb } from "./db";

const VALID: Required<Record<keyof SetValues, number>> = { weightKg: 50, reps: 5, seconds: 60, meters: 1000, calories: 20, rpe: 8 };

// Valores válidos mínimos para una serie de esa métrica en ese módulo.
function validSet(mod: Module, metric: ExerciseMetric): SetValues {
  return Object.fromEntries(fieldsFor(mod.fields, metric).required.map((f) => [f, VALID[f]]));
}

describe("registro de módulos", () => {
  it("las tres disciplinas, con slug único y búsqueda segura", () => {
    expect(MODULES.map((m) => m.discipline).sort()).toEqual(["CALISTENIA", "CROSSFIT", "FUERZA"]);
    expect(getModule("fuerza")?.name).toBe("Fuerza");
    expect(getModule("toString")).toBeNull();
    expect(getModule("yoga")).toBeNull();
  });
});

describe.each(MODULES.map((m) => [m.name, m] as const))("módulo %s", (_, mod) => {
  let ana: string;
  let bea: string;
  let catalog: ExerciseRow[];
  const date = new Date("2026-11-10T00:00:00Z");

  beforeAll(async () => {
    await mod.seedCatalog();
  });

  beforeEach(async () => {
    await resetDb();
    ana = (await createUser("ana@ejemplo.es")).id;
    bea = (await createUser("bea@ejemplo.es")).id;
    catalog = await mod.listExercises(ana);
  });

  const first = () => catalog[0];
  const startAt = async (userId: string, routineId?: string) => {
    const r = await mod.startSession(userId, { date: "2026-11-10", routineId });
    if (!r.ok) throw new Error(JSON.stringify(r.errors));
    return r.id;
  };

  describe("catálogo", () => {
    it("tiene entre 25 y 30 ejercicios con slugs únicos y métricas del módulo", () => {
      expect(mod.catalog.length).toBeGreaterThanOrEqual(25);
      expect(mod.catalog.length).toBeLessThanOrEqual(30);
      expect(new Set(mod.catalog.map((e) => e.slug)).size).toBe(mod.catalog.length);
      for (const e of mod.catalog) expect(mod.metrics).toContain(e.metric);
    });

    it("el seed es idempotente", async () => {
      await mod.seedCatalog();
      await mod.seedCatalog();
      expect(await mod.listExercises(ana)).toHaveLength(mod.catalog.length);
    });

    it("los ejercicios propios solo los ve su dueño", async () => {
      const r = await mod.createExercise(ana, { name: "Mi ejercicio", metric: mod.metrics[0], muscle: "Otro" });
      expect(r.ok).toBe(true);
      expect(await mod.listExercises(ana)).toHaveLength(mod.catalog.length + 1);
      expect(await mod.listExercises(bea)).toHaveLength(mod.catalog.length);
      if (r.ok) expect(await mod.getExercise(bea, r.id)).toBeNull();
    });

    it("rechaza métricas que no son del módulo y nombres vacíos", async () => {
      const ajena = (["PESO", "REPETICIONES", "TIEMPO", "DISTANCIA", "CALORIAS"] as const).find((m) => !mod.metrics.includes(m));
      if (ajena) expect((await mod.createExercise(ana, { name: "X ejercicio", metric: ajena })).ok).toBe(false);
      expect((await mod.createExercise(ana, { name: " ", metric: mod.metrics[0] })).ok).toBe(false);
    });
  });

  describe("rutinas", () => {
    it("crea una rutina con sus ejercicios en orden y solo guarda objetivos del módulo", async () => {
      const [a, b] = catalog;
      const r = await mod.saveRoutine(ana, {
        name: "Día A",
        items: [
          { exerciseId: b.id, sets: 3, ...validSet(mod, b.metric) },
          { exerciseId: a.id, sets: 4, otraCosa: 1 },
        ],
      });
      expect(r.ok).toBe(true);
      const routine = r.ok ? await mod.getRoutine(ana, r.id) : null;
      expect(routine?.items.map((i) => [i.exercise.id, i.sets])).toEqual([
        [b.id, 3],
        [a.id, 4],
      ]);
      expect(routine?.items[1]).not.toHaveProperty("otraCosa");
    });

    it("valida: nombre y al menos un ejercicio", async () => {
      const r = await mod.saveRoutine(ana, { name: "", items: [] });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(["items", "name"]);
    });

    it("no admite ejercicios inexistentes ni los propios de otro usuario", async () => {
      const deBea = await mod.createExercise(bea, { name: "Secreto de Bea", metric: mod.metrics[0] });
      if (!deBea.ok) throw new Error();
      expect((await mod.saveRoutine(ana, { name: "Robo", items: [{ exerciseId: deBea.id, sets: 3 }] })).ok).toBe(false);
      expect((await mod.saveRoutine(ana, { name: "Nada", items: [{ exerciseId: "no-existe", sets: 3 }] })).ok).toBe(false);
    });

    it("editar reemplaza los ejercicios; otro usuario no puede leerla, editarla ni borrarla", async () => {
      const r = await mod.saveRoutine(ana, { name: "Día A", items: [{ exerciseId: catalog[0].id, sets: 3 }] });
      if (!r.ok) throw new Error();
      expect((await mod.saveRoutine(ana, { name: "Día A2", items: [{ exerciseId: catalog[1].id, sets: 5 }] }, r.id)).ok).toBe(true);
      const edited = await mod.getRoutine(ana, r.id);
      expect(edited?.name).toBe("Día A2");
      expect(edited?.items.map((i) => i.exerciseId)).toEqual([catalog[1].id]);

      expect(await mod.getRoutine(bea, r.id)).toBeNull();
      expect(await mod.listRoutines(bea)).toEqual([]);
      expect((await mod.saveRoutine(bea, { name: "Hackeada", items: [{ exerciseId: catalog[0].id, sets: 1 }] }, r.id)).ok).toBe(false);
      expect(await mod.deleteRoutine(bea, r.id)).toBe(false);
      expect((await mod.getRoutine(ana, r.id))?.name).toBe("Día A2");
      expect(await mod.deleteRoutine(ana, r.id)).toBe(true);
    });
  });

  describe("sesiones y series", () => {
    it("registra series validadas por la métrica del ejercicio y marca el día en el calendario", async () => {
      const s = await startAt(ana);
      const ex = first();
      expect((await mod.addSet(ana, s, ex.id, {})).ok).toBe(false); // faltan obligatorios
      const key = fieldsFor(mod.fields, ex.metric).required[0];
      expect((await mod.addSet(ana, s, ex.id, { ...validSet(mod, ex.metric), [key]: -3 })).ok).toBe(false);
      expect(await listTrainingDays(ana)).toEqual([]);

      const r = await mod.addSet(ana, s, ex.id, validSet(mod, ex.metric));
      expect(r.ok).toBe(true);
      const session = await mod.getSession(ana, s);
      expect(session?.sets).toHaveLength(1);
      expect((await listTrainingDays(ana)).map((d) => [d.date, d.discipline])).toEqual([[date, mod.discipline]]);
    });

    it("borrar la última serie o la sesión desmarca el día", async () => {
      const s = await startAt(ana);
      const r = await mod.addSet(ana, s, first().id, validSet(mod, first().metric));
      if (!r.ok) throw new Error(JSON.stringify(r.errors));
      expect(await mod.deleteSet(ana, r.id)).toBe(true);
      expect(await listTrainingDays(ana)).toEqual([]);

      await mod.addSet(ana, s, first().id, validSet(mod, first().metric));
      expect(await mod.deleteSession(ana, s)).toBe(true);
      expect(await listTrainingDays(ana)).toEqual([]);
    });

    it("sesión desde rutina: solo con rutinas propias", async () => {
      const r = await mod.saveRoutine(bea, { name: "De Bea", items: [{ exerciseId: first().id, sets: 3 }] });
      if (!r.ok) throw new Error();
      expect((await mod.startSession(ana, { routineId: r.id })).ok).toBe(false);
      const s = await startAt(bea, r.id);
      expect((await mod.getSession(bea, s))?.routine?.items).toHaveLength(1);
    });

    it("otro usuario no puede ver, añadir series, borrar series ni borrar la sesión", async () => {
      const s = await startAt(ana);
      const r = await mod.addSet(ana, s, first().id, validSet(mod, first().metric));
      if (!r.ok) throw new Error();

      expect(await mod.getSession(bea, s)).toBeNull();
      expect(await mod.listSessions(bea)).toEqual([]);
      expect((await mod.addSet(bea, s, first().id, validSet(mod, first().metric))).ok).toBe(false);
      expect(await mod.deleteSet(bea, r.id)).toBe(false);
      expect(await mod.deleteSession(bea, s)).toBe(false);
      expect((await mod.getSession(ana, s))?.sets).toHaveLength(1);
      expect((await mod.lastSets(bea, [first().id])).size).toBe(0);
    });

    it("lastSets devuelve la última serie de cada ejercicio", async () => {
      const s = await startAt(ana);
      const ex = first();
      const base = validSet(mod, ex.metric);
      const key = fieldsFor(mod.fields, ex.metric).required[0];
      await mod.addSet(ana, s, ex.id, base);
      await mod.addSet(ana, s, ex.id, { ...base, [key]: (base[key] ?? 0) + 1 });
      const last = (await mod.lastSets(ana, [ex.id])).get(ex.id);
      expect(last?.[key]).toBe((base[key] ?? 0) + 1);
    });

    it("listSessions resume con el número de series", async () => {
      const s = await startAt(ana);
      await mod.addSet(ana, s, first().id, validSet(mod, first().metric));
      expect((await mod.listSessions(ana)).map((x) => [x.id, x._count.sets])).toEqual([[s, 1]]);
    });
  });
});

it("los catálogos de los tres módulos siguen ahí tras vaciar usuarios", async () => {
  await resetDb();
  expect(await prisma.fuerzaExercise.count({ where: { userId: null } })).toBeGreaterThan(0);
});
