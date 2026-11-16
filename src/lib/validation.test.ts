import { describe, expect, it } from "vitest";
import { loginSchema, measurementSchema, profileSchema, registerSchema } from "./validation";

describe("registerSchema", () => {
  it("normaliza el email (espacios y mayúsculas) antes de validarlo", () => {
    const r = registerSchema.parse({ name: "  Ana ", email: "  Ana@Ejemplo.ES ", password: "12345678" });
    expect(r).toEqual({ name: "Ana", email: "ana@ejemplo.es", password: "12345678" });
  });

  it.each([
    ["email inválido", { name: "Ana", email: "ana", password: "12345678" }, "email"],
    ["contraseña corta", { name: "Ana", email: "a@b.es", password: "1234567" }, "password"],
    ["contraseña larga", { name: "Ana", email: "a@b.es", password: "x".repeat(129) }, "password"],
    ["nombre corto", { name: " A ", email: "a@b.es", password: "12345678" }, "name"],
  ])("rechaza %s", (_, input, field) => {
    const r = registerSchema.safeParse(input);
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].path).toEqual([field]);
  });

  it("da los mensajes en español", () => {
    const r = registerSchema.safeParse({ name: "Ana", email: "a@b.es", password: "corta" });
    expect(r.error?.issues[0].message).toBe("La contraseña debe tener al menos 8 caracteres.");
  });
});

describe("loginSchema", () => {
  it("rechaza tipos que no son texto", () => {
    expect(loginSchema.safeParse({ email: ["a@b.es"], password: "x" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "a@b.es", password: { $ne: "" } }).success).toBe(false);
  });
});

describe("profileSchema", () => {
  it("convierte los campos del formulario y trata vacío como sin dato", () => {
    const r = profileSchema.parse({ age: "31", daysPerWeek: "", sessionMinutes: "60", disciplines: ["FUERZA"], limitations: "   " });
    expect(r).toEqual({ age: 31, daysPerWeek: undefined, sessionMinutes: 60, disciplines: ["FUERZA"], limitations: undefined });
  });

  it("rechaza valores fuera de rango y enums desconocidos", () => {
    expect(profileSchema.safeParse({ daysPerWeek: "8" }).success).toBe(false);
    expect(profileSchema.safeParse({ age: "5" }).success).toBe(false);
    expect(profileSchema.safeParse({ disciplines: ["YOGA"] }).success).toBe(false);
    expect(profileSchema.safeParse({ level: "EXPERTO" }).success).toBe(false);
  });
});

describe("measurementSchema", () => {
  it("acepta una fecha y al menos una medida", () => {
    expect(measurementSchema.parse({ date: "2026-11-16", weightKg: "78.5" })).toMatchObject({ weightKg: 78.5 });
  });

  it("exige al menos una medida y una fecha real", () => {
    expect(measurementSchema.safeParse({ date: "2026-11-16", weightKg: "" }).success).toBe(false);
    expect(measurementSchema.safeParse({ date: "2026-02-30", weightKg: "80" }).success).toBe(false);
  });

  it("rechaza medidas imposibles", () => {
    expect(measurementSchema.safeParse({ date: "2026-11-16", weightKg: "5" }).success).toBe(false);
    expect(measurementSchema.safeParse({ date: "2026-11-16", waistCm: "-1" }).success).toBe(false);
  });
});
