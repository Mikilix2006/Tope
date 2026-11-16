import { notFound } from "next/navigation";
import { getModule } from "@/modules/registry";
import { requireUserId } from "@/server/auth/session";
import type { ExerciseOption } from "./routine-editor";

// Datos comunes de las páginas de nueva rutina y editar rutina.
export async function loadEditor(params: Promise<{ disciplina: string }>) {
  const mod = getModule((await params).disciplina) ?? notFound();
  const userId = await requireUserId();
  const exercises: ExerciseOption[] = (await mod.listExercises(userId)).map(({ id, name, metric, muscle }) => ({ id, name, metric, muscle }));
  return { mod, userId, exercises };
}
