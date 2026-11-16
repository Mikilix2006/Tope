import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { directionOf, isBodyMetric, toISODate } from "@/lib/goals";
import { moduleFor } from "@/modules/registry";
import { todayMadrid } from "@/modules/engine";
import { requireUserId } from "@/server/auth/session";
import { getGoal } from "@/server/core/goals";
import { GoalForm } from "../goal-form";

export const metadata: Metadata = { title: "Editar objetivo" };

export default async function EditarObjetivoPage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  const goal = (await getGoal(userId, (await params).id)) ?? notFound();
  // En objetivos de ejercicio la dirección la fija el módulo; en medidas, la que eligió el usuario.
  const dir =
    goal.discipline && !isBodyMetric(goal.metric)
      ? (moduleFor(goal.discipline).lowerIsBetter as readonly string[]).includes(goal.metric)
        ? "BAJAR"
        : "SUBIR"
      : directionOf(goal);

  return (
    <>
      <div>
        <Link href="/objetivos" className="text-muted underline">
          Objetivos
        </Link>
        <h1 className="text-3xl font-bold">Editar objetivo</h1>
      </div>
      <GoalForm
        exercises={[]}
        latestBody={{}}
        today={toISODate(todayMadrid())}
        goal={{
          id: goal.id,
          title: goal.title,
          metric: goal.metric,
          dir,
          startValue: goal.startValue,
          targetValue: goal.targetValue,
          targetEdited: goal.targetEdited,
          difficulty: goal.difficulty,
          deadline: goal.deadline ? toISODate(goal.deadline) : "",
        }}
      />
    </>
  );
}
