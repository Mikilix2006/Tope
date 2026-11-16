import type { Metadata } from "next";
import Link from "next/link";
import { BODY_METRIC_FIELDS, toISODate, type BodyMetric } from "@/lib/goals";
import { todayMadrid } from "@/modules/engine";
import { requireUserId } from "@/server/auth/session";
import { listMeasurements } from "@/server/core/measurements";
import { loadGoalExercises } from "../../goal-options";
import { GoalForm } from "../goal-form";

export const metadata: Metadata = { title: "Nuevo objetivo" };

export default async function NuevoObjetivoPage() {
  const userId = await requireUserId();
  const [exercises, measurements] = await Promise.all([loadGoalExercises(userId), listMeasurements(userId)]);

  // Última medida de cada tipo (las filas vienen de la más antigua a la más reciente).
  const latestBody: Partial<Record<BodyMetric, number>> = {};
  for (const m of measurements) {
    for (const [metric, field] of Object.entries(BODY_METRIC_FIELDS)) {
      if (m[field] != null) latestBody[metric as BodyMetric] = m[field];
    }
  }

  return (
    <>
      <div>
        <Link href="/objetivos" className="text-muted underline">
          Objetivos
        </Link>
        <h1 className="text-3xl font-bold">Nuevo objetivo</h1>
      </div>
      <GoalForm exercises={exercises} today={toISODate(todayMadrid())} latestBody={latestBody} />
    </>
  );
}
