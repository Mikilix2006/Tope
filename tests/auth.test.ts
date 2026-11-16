import { beforeEach, describe, expect, it } from "vitest";
import { LOGIN_LIMIT, TooManyAttemptsError, clientIp, verifyCredentials } from "@/server/auth/credentials";
import { registerUser } from "@/server/auth/register";
import { createUser, prisma, resetDb } from "./db";

beforeEach(resetDb);

describe("registro", () => {
  it("crea el usuario con la contraseña hasheada con bcrypt y un perfil vacío", async () => {
    const r = await registerUser({ name: "Ana", email: "Ana@Ejemplo.es", password: "contraseña-segura" });
    expect(r.ok).toBe(true);
    const user = await prisma.user.findUniqueOrThrow({ where: { email: "ana@ejemplo.es" }, include: { profile: true } });
    expect(user.passwordHash).not.toContain("contraseña-segura");
    expect(user.passwordHash).toMatch(/^\$2[aby]\$12\$/);
    expect(user.profile).not.toBeNull();
  });

  it("no permite dos cuentas con el mismo email (sin distinguir mayúsculas)", async () => {
    await registerUser({ name: "Ana", email: "ana@ejemplo.es", password: "contraseña-segura" });
    const r = await registerUser({ name: "Otra", email: "ANA@ejemplo.es", password: "otra-contraseña" });
    expect(r).toEqual({ ok: false, errors: { email: ["Ya existe una cuenta con ese email."] } });
    expect(await prisma.user.count()).toBe(1);
  });

  it("devuelve errores de validación sin tocar la base de datos", async () => {
    const r = await registerUser({ name: "Ana", email: "no-es-email", password: "123" });
    expect(r.ok).toBe(false);
    expect(await prisma.user.count()).toBe(0);
  });
});

describe("inicio de sesión", () => {
  beforeEach(async () => {
    await createUser("ana@ejemplo.es", "contraseña-segura");
  });

  it("acepta la contraseña correcta y devuelve el usuario sin el hash", async () => {
    const user = await verifyCredentials({ email: " ANA@ejemplo.es", password: "contraseña-segura" }, "1.1.1.1");
    expect(user).toMatchObject({ email: "ana@ejemplo.es" });
    expect(user).not.toHaveProperty("passwordHash");
  });

  it("rechaza contraseña incorrecta, email desconocido y entrada mal formada", async () => {
    expect(await verifyCredentials({ email: "ana@ejemplo.es", password: "mala" }, "1.1.1.1")).toBeNull();
    expect(await verifyCredentials({ email: "nadie@ejemplo.es", password: "contraseña-segura" }, "1.1.1.1")).toBeNull();
    expect(await verifyCredentials(undefined, "1.1.1.1")).toBeNull();
  });

  it(`bloquea el email tras ${LOGIN_LIMIT.perEmail} fallos, aunque luego la contraseña sea buena`, async () => {
    for (let i = 0; i < LOGIN_LIMIT.perEmail; i++) {
      await verifyCredentials({ email: "ana@ejemplo.es", password: "mala" }, `10.0.0.${i}`);
    }
    await expect(verifyCredentials({ email: "ana@ejemplo.es", password: "contraseña-segura" }, "9.9.9.9")).rejects.toBeInstanceOf(
      TooManyAttemptsError,
    );
  });

  it(`bloquea la IP tras ${LOGIN_LIMIT.perIp} fallos con emails distintos`, async () => {
    await prisma.loginAttempt.createMany({
      data: Array.from({ length: LOGIN_LIMIT.perIp }, (_, i) => ({ email: `x${i}@ejemplo.es`, ip: "6.6.6.6" })),
    });
    await expect(verifyCredentials({ email: "ana@ejemplo.es", password: "contraseña-segura" }, "6.6.6.6")).rejects.toBeInstanceOf(
      TooManyAttemptsError,
    );
    expect(await verifyCredentials({ email: "ana@ejemplo.es", password: "contraseña-segura" }, "1.1.1.1")).not.toBeNull();
  });

  it("los fallos fuera de la ventana no cuentan", async () => {
    const old = new Date(Date.now() - (LOGIN_LIMIT.windowMinutes + 1) * 60_000);
    await prisma.loginAttempt.createMany({
      data: Array.from({ length: LOGIN_LIMIT.perEmail }, () => ({ email: "ana@ejemplo.es", ip: "1.1.1.1", createdAt: old })),
    });
    expect(await verifyCredentials({ email: "ana@ejemplo.es", password: "contraseña-segura" }, "1.1.1.1")).not.toBeNull();
  });

  it("un acierto borra los fallos previos de ese email", async () => {
    await verifyCredentials({ email: "ana@ejemplo.es", password: "mala" }, "1.1.1.1");
    await verifyCredentials({ email: "ana@ejemplo.es", password: "contraseña-segura" }, "1.1.1.1");
    expect(await prisma.loginAttempt.count({ where: { email: "ana@ejemplo.es" } })).toBe(0);
  });
});

describe("clientIp", () => {
  it("toma la primera IP de X-Forwarded-For", () => {
    expect(clientIp({ "x-forwarded-for": "203.0.113.5, 10.0.0.1" })).toBe("203.0.113.5");
    expect(clientIp(undefined)).toBe("desconocida");
  });
});
