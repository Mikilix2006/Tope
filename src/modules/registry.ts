import type { Discipline } from "@prisma/client";
import { calistenia } from "./calistenia";
import { crossfit } from "./crossfit";
import type { Module } from "./engine";
import { fuerza } from "./fuerza";

// Disciplinas disponibles. Para añadir una: copiar sus tablas en schema.prisma, copiar una carpeta de módulo y registrarla aquí.
export const MODULES: readonly Module[] = [calistenia, crossfit, fuerza];

export function getModule(slug: string): Module | null {
  return MODULES.find((m) => m.slug === slug) ?? null;
}

export function moduleFor(discipline: Discipline): Module {
  return MODULES.find((m) => m.discipline === discipline)!;
}
