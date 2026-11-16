import { beforeEach, describe, expect, it } from "vitest";
import { countTrainedDays, listTrainingDays, markTrainingDay } from "@/server/core/calendar";
import { deleteMeasurement, latestWeight, listMeasurements, saveMeasurement } from "@/server/core/measurements";
import { getAccount, getProfile, updateProfile } from "@/server/core/profile";
import { createUser, prisma, resetDb } from "./db";

// Ninguna consulta del núcleo devuelve ni modifica datos de otro usuario.
describe("aislamiento entre usuarios", () => {
  let ana: string;
  let bea: string;

  beforeEach(async () => {
    await resetDb();
    ana = (await createUser("ana@ejemplo.es")).id;
    bea = (await createUser("bea@ejemplo.es")).id;
    await saveMeasurement(ana, { date: "2026-11-01", weightKg: 60 });
    await saveMeasurement(bea, { date: "2026-11-02", weightKg: 90 });
    await updateProfile(ana, { age: 30, disciplines: ["CALISTENIA"] });
    await updateProfile(bea, { age: 40, disciplines: ["FUERZA"] });
    await markTrainingDay(ana, new Date("2026-11-01"), "CALISTENIA");
    await markTrainingDay(bea, new Date("2026-11-02"), "FUERZA");
  });

  it("el contador de días entrenados no suma los de otro usuario y no duplica disciplinas del mismo día", async () => {
    const hoy = new Date(new Date().toISOString().slice(0, 10));
    await markTrainingDay(ana, hoy, "CALISTENIA");
    await markTrainingDay(ana, hoy, "FUERZA");
    await markTrainingDay(ana, hoy, "FUERZA");
    await markTrainingDay(bea, hoy, "FUERZA");
    expect(await countTrainedDays(ana, 1)).toBe(1);
  });

  it("cuenta, perfil, medidas y calendario solo devuelven lo propio", async () => {
    expect((await getAccount(ana))?.email).toBe("ana@ejemplo.es");
    expect((await getProfile(ana))?.age).toBe(30);
    expect((await listMeasurements(ana)).map((m) => m.weightKg)).toEqual([60]);
    expect((await latestWeight(ana))?.weightKg).toBe(60);
    expect((await listTrainingDays(ana)).map((d) => d.discipline)).toEqual(["CALISTENIA"]);
    expect((await listMeasurements(bea)).every((m) => m.userId === bea)).toBe(true);
  });

  it("no se puede borrar la medida de otro usuario conociendo su id", async () => {
    const [deBea] = await listMeasurements(bea);
    expect(await deleteMeasurement(ana, deBea.id)).toBe(false);
    expect(await prisma.bodyMeasurement.count({ where: { userId: bea } })).toBe(1);
    expect(await deleteMeasurement(bea, deBea.id)).toBe(true);
  });

  it("actualizar el perfil propio no toca el de otro", async () => {
    await updateProfile(ana, { age: 31, disciplines: [] });
    expect((await getProfile(bea))?.age).toBe(40);
  });

  it("guardar dos veces la misma fecha completa la medida del día, no la duplica", async () => {
    await saveMeasurement(ana, { date: "2026-11-01", waistCm: 70 });
    const rows = await listMeasurements(ana);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ weightKg: 60, waistCm: 70 });
  });
});
