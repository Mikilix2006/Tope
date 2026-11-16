import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EQUIPMENT } from "@/lib/labels";
import { METRIC_LABELS } from "@/modules/fields";
import { getModule } from "@/modules/registry";
import { requireUserId } from "@/server/auth/session";
import { NewExerciseForm } from "./new-exercise-form";

export const metadata: Metadata = { title: "Catálogo de ejercicios" };

export default async function EjerciciosPage({ params }: { params: Promise<{ disciplina: string }> }) {
  const mod = getModule((await params).disciplina) ?? notFound();
  const userId = await requireUserId();
  const exercises = await mod.listExercises(userId);
  const groups = Map.groupBy(exercises, (e) => e.muscle ?? "Otros");
  const metricLabel = (m: (typeof mod.metrics)[number]) => METRIC_LABELS[m] + (mod.lowerIsBetter.includes(m) ? " (menos es mejor)" : "");

  return (
    <>
      <div>
        <Link href={`/entrenar/${mod.slug}`} className="text-muted underline">
          {mod.name}
        </Link>
        <h1 className="text-3xl font-bold">Catálogo de ejercicios</h1>
      </div>

      {[...groups].map(([muscle, list]) => (
        <section key={muscle} className="flex flex-col gap-2">
          <h2 className="text-xl font-bold">{muscle}</h2>
          <ul className="flex flex-col divide-y divide-border rounded-xl border border-border bg-surface">
            {list.map((e) => (
              <li key={e.id} className="flex flex-col px-4 py-3">
                <span className="font-semibold">
                  {e.name}
                  {e.userId && <span className="ml-2 rounded-md bg-accent px-1.5 py-0.5 text-sm text-accent-text">Propio</span>}
                </span>
                <span className="text-sm text-muted">
                  {metricLabel(e.metric)}
                  {e.equipment && ` · ${EQUIPMENT[e.equipment]}`}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="flex flex-col gap-3 border-t border-border pt-6">
        <h2 className="text-xl font-bold">Crear un ejercicio propio</h2>
        <NewExerciseForm slug={mod.slug} metrics={mod.metrics.map((m) => ({ value: m, label: metricLabel(m) }))} />
      </section>
    </>
  );
}
