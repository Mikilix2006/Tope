import { beforeEach, describe, expect, it } from "vitest";
import { DEMO_USER } from "@/config/demo";
import { verifyCredentials } from "@/server/auth/credentials";
import { MODULES } from "@/modules/registry";
import { listGoals } from "@/server/core/goals";
import { isOnboarded } from "@/server/core/onboarding";
import { seedDemo } from "@/server/seed/demo";
import { prisma, resetDb } from "./db";

describe("seed del usuario demo", () => {
  beforeEach(async () => {
    await resetDb();
    for (const mod of MODULES) await mod.seedCatalog();
  });

  it("es idempotente: dos ejecuciones dejan el mismo usuario y los mismos datos", async () => {
    const id1 = await seedDemo(prisma);
    const counts = async () => [
      await prisma.user.count(),
      await prisma.bodyMeasurement.count(),
      await prisma.trainingDay.count(),
      await prisma.fuerzaRoutine.count(),
      await prisma.fuerzaSession.count(),
      await prisma.fuerzaSet.count(),
      await prisma.calisteniaSession.count(),
      await prisma.calisteniaSet.count(),
      await prisma.goal.count(),
    ];
    const first = await counts();
    const id2 = await seedDemo(prisma);
    expect(id2).toBe(id1);
    expect(await counts()).toEqual(first);
    expect(first[1]).toBeGreaterThan(0);
    expect(first.every((n) => n > 0)).toBe(true);
  });

  it("cada día del calendario de la demo tiene su sesión con series en esa disciplina", async () => {
    const id = await seedDemo(prisma);
    const days = await prisma.trainingDay.findMany({ where: { userId: id } });
    const sessions = [
      ...(await prisma.fuerzaSession.findMany({ where: { userId: id, sets: { some: {} } } })).map((s) => `${s.date.toISOString()}FUERZA`),
      ...(await prisma.calisteniaSession.findMany({ where: { userId: id, sets: { some: {} } } })).map((s) => `${s.date.toISOString()}CALISTENIA`),
    ];
    expect(days.map((d) => `${d.date.toISOString()}${d.discipline}`).sort()).toEqual(sessions.sort());
  });

  it("trae el alta hecha y objetivos en los tres estados, calculados con sus registros", async () => {
    const id = await seedDemo(prisma);
    expect(await isOnboarded(id)).toBe(true);
    const goals = Object.fromEntries((await listGoals(id)).map((g) => [g.title, g]));
    expect(goals["Sentadilla trasera"]).toMatchObject({ status: "CONSEGUIDO", targetValue: 87.5 });
    expect(goals["Cintura"].status).toBe("CONSEGUIDO");
    expect(goals["Press de banca"]).toMatchObject({ status: "EN_CURSO", targetEdited: true });
    expect(goals["Dominadas"].status).toBe("EN_CURSO");
    expect(goals["Peso corporal"].status).toBe("EN_CURSO");
    expect(goals["Plancha"].status).toBe("VENCIDO");
    for (const g of Object.values(goals)) expect(g.current).not.toBe(g.startValue); // ha habido progreso
  });

  it("restaura lo que haya cambiado una visita", async () => {
    const id = await seedDemo(prisma);
    await prisma.bodyMeasurement.deleteMany({ where: { userId: id } });
    await prisma.profile.update({ where: { userId: id }, data: { age: 99 } });
    await seedDemo(prisma);
    expect(await prisma.bodyMeasurement.count({ where: { userId: id } })).toBeGreaterThan(0);
    expect((await prisma.profile.findUnique({ where: { userId: id } }))?.age).toBe(31);
  });

  it("se puede entrar con las credenciales públicas de la demo", async () => {
    await seedDemo(prisma);
    expect(await verifyCredentials({ email: DEMO_USER.email, password: DEMO_USER.password }, "1.1.1.1")).toMatchObject({
      email: DEMO_USER.email,
    });
  });
});
