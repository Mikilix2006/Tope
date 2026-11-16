import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDay } from "@/lib/format";
import { formatSet, type SetValues } from "@/modules/fields";
import { getModule } from "@/modules/registry";
import { requireUserId } from "@/server/auth/session";
import { SessionLogger, type LoggerData } from "./session-logger";

export const metadata: Metadata = { title: "Sesión" };

export default async function SesionPage({ params }: { params: Promise<{ disciplina: string; id: string }> }) {
  const { disciplina, id } = await params;
  const mod = getModule(disciplina) ?? notFound();
  const userId = await requireUserId();
  const session = (await mod.getSession(userId, id)) ?? notFound();
  const exercises = await mod.listExercises(userId);
  const last = await mod.lastSets(userId, exercises.map((e) => e.id));

  const pick = (v: SetValues) => Object.fromEntries(mod.fields.flatMap((f) => (v[f] != null ? [[f, v[f]]] : []))) as SetValues;
  const planned = session.routine?.items ?? [];

  const data: LoggerData = {
    exercises: exercises.map(({ id, name, metric, muscle }) => ({ id, name, metric, muscle })),
    order: [...new Set([...planned.map((i) => i.exerciseId), ...session.sets.map((s) => s.exerciseId)])],
    planned: Object.fromEntries(planned.map((i) => [i.exerciseId, i.sets])),
    // Valores iniciales: la última serie registrada de ese ejercicio; si no hay, el objetivo de la rutina.
    defaults: Object.fromEntries(
      exercises.map((e) => {
        const prev = last.get(e.id);
        const item = planned.find((i) => i.exerciseId === e.id);
        return [e.id, prev ? pick(prev) : item ? pick(item) : {}];
      }),
    ),
    sets: session.sets.map((s) => ({ id: s.id, exerciseId: s.exerciseId, label: formatSet(s, s.exercise.metric) })),
  };

  return (
    <>
      <div>
        <Link href={`/entrenar/${mod.slug}`} className="text-muted underline">
          {mod.name}
        </Link>
        <h1 className="text-3xl font-bold">{session.routine?.name ?? "Sesión libre"}</h1>
        <p className="text-muted first-letter:uppercase">{formatDay(session.date)}</p>
      </div>
      <SessionLogger slug={mod.slug} sessionId={session.id} fields={mod.fields} data={data} />
    </>
  );
}
