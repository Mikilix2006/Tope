import { describe, expect, it } from "vitest";
import { GOAL_CONFIG } from "@/config/goals";
import { formatGoalValue, goalProgress, goalStatus, suggestDeadline, suggestTarget, toISODate } from "./goals";

describe("meta sugerida por dificultad", () => {
  it("peso levantado: +2,5 / 5 / 10 % en saltos de 2,5 kg, mínimo un salto", () => {
    expect(suggestTarget("PESO", "FACIL", 100, "SUBIR")).toBe(102.5);
    expect(suggestTarget("PESO", "MEDIO", 100, "SUBIR")).toBe(105);
    expect(suggestTarget("PESO", "DIFICIL", 100, "SUBIR")).toBe(110);
    expect(suggestTarget("PESO", "DIFICIL", 80, "SUBIR")).toBe(87.5); // 8 kg → 3 saltos
    expect(suggestTarget("PESO", "FACIL", 20, "SUBIR")).toBe(22.5); // 0,5 kg → mínimo un salto
    expect(suggestTarget("PESO", "FACIL", 0, "SUBIR")).toBe(2.5);
  });

  it("repeticiones: +25 / 50 / 100 %, mínimo +1", () => {
    expect(suggestTarget("REPETICIONES", "FACIL", 4, "SUBIR")).toBe(5);
    expect(suggestTarget("REPETICIONES", "MEDIO", 4, "SUBIR")).toBe(6);
    expect(suggestTarget("REPETICIONES", "DIFICIL", 4, "SUBIR")).toBe(8);
    expect(suggestTarget("REPETICIONES", "FACIL", 1, "SUBIR")).toBe(2);
    expect(suggestTarget("REPETICIONES", "DIFICIL", 0, "SUBIR")).toBe(1); // aún sin ninguna
  });

  it("tiempo y distancia: +5 / 10 / 20 %; si menos es mejor, se resta", () => {
    expect(suggestTarget("TIEMPO", "FACIL", 60, "SUBIR")).toBe(63);
    expect(suggestTarget("TIEMPO", "MEDIO", 60, "SUBIR")).toBe(66);
    expect(suggestTarget("DISTANCIA", "DIFICIL", 5000, "SUBIR")).toBe(6000);
    expect(suggestTarget("TIEMPO", "MEDIO", 300, "BAJAR")).toBe(270); // Fran en 5:00 → 4:30
    expect(suggestTarget("TIEMPO", "FACIL", 10, "SUBIR")).toBe(11); // mínimo 1
  });

  it("peso corporal: 1 / 3 / 5 kg hacia donde elija el usuario; perímetros en cm", () => {
    expect(suggestTarget("PESO_CORPORAL", "FACIL", 80, "BAJAR")).toBe(79);
    expect(suggestTarget("PESO_CORPORAL", "MEDIO", 80, "SUBIR")).toBe(83);
    expect(suggestTarget("PESO_CORPORAL", "DIFICIL", 78.4, "BAJAR")).toBe(73.4);
    expect(suggestTarget("CINTURA", "DIFICIL", 90, "BAJAR")).toBe(90 - GOAL_CONFIG.perimeterCm.DIFICIL);
  });

  it("fecha límite sugerida a 4, 8 y 12 semanas", () => {
    const today = new Date("2026-11-16T00:00:00Z");
    expect(toISODate(suggestDeadline("FACIL", today))).toBe("2026-12-14");
    expect(toISODate(suggestDeadline("MEDIO", today))).toBe("2027-01-11");
    expect(toISODate(suggestDeadline("DIFICIL", today))).toBe("2027-02-08");
  });
});

describe("progreso y estado", () => {
  const today = new Date("2026-11-16T00:00:00Z");

  it("porcentaje entre inicio y meta, limitado a 0–100, también en metas que bajan", () => {
    expect(goalProgress({ startValue: 4, targetValue: 8, current: 6 })).toBe(50);
    expect(goalProgress({ startValue: 4, targetValue: 8, current: 3 })).toBe(0);
    expect(goalProgress({ startValue: 4, targetValue: 8, current: 12 })).toBe(100);
    expect(goalProgress({ startValue: 82, targetValue: 77, current: 79.5 })).toBe(50);
    expect(goalProgress({ startValue: 300, targetValue: 270, current: 290 })).toBe(33);
  });

  it("conseguido al alcanzar la meta (aunque haya vencido), vencido sin alcanzarla, si no en curso", () => {
    const past = new Date("2026-11-15T00:00:00Z");
    expect(goalStatus({ startValue: 4, targetValue: 8, current: 8, deadline: past }, today)).toBe("CONSEGUIDO");
    expect(goalStatus({ startValue: 4, targetValue: 8, current: 7, deadline: past }, today)).toBe("VENCIDO");
    expect(goalStatus({ startValue: 4, targetValue: 8, current: 7, deadline: today }, today)).toBe("EN_CURSO"); // vence al acabar el día
    expect(goalStatus({ startValue: 4, targetValue: 8, current: 7, deadline: null }, today)).toBe("EN_CURSO");
    expect(goalStatus({ startValue: 82, targetValue: 77, current: 76.8, deadline: null }, today)).toBe("CONSEGUIDO");
    expect(goalStatus({ startValue: 82, targetValue: 77, current: 77.2, deadline: null }, today)).toBe("EN_CURSO");
  });

  it("formatea los valores con su unidad", () => {
    expect(formatGoalValue("PESO", 82.5)).toBe("82,5 kg");
    expect(formatGoalValue("REPETICIONES", 8)).toBe("8 rep");
    expect(formatGoalValue("TIEMPO", 90)).toBe("1:30");
    expect(formatGoalValue("CINTURA", 86)).toBe("86 cm");
  });
});
