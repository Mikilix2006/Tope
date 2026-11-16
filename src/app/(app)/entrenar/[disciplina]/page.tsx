import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui";
import type { ItemRow } from "@/modules/engine";
import { getModule } from "@/modules/registry";
import { formatSeconds, formatShortDay } from "@/lib/format";
import { requireUserId } from "@/server/auth/session";
import { startSessionAction } from "./actions";

type Props = { params: Promise<{ disciplina: string }> };

// «Sentadilla trasera 4×5», «Plancha 3×1:00», «Remo 2×500 m».
const summary = (i: ItemRow) => {
  const target = i.reps ?? (i.seconds != null ? formatSeconds(i.seconds) : i.meters != null ? `${i.meters} m` : null);
  return `${i.exercise.name} ${i.sets}${target != null ? `×${target}` : " series"}`;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: getModule((await params).disciplina)?.name };
}

export default async function DisciplinaPage({ params }: Props) {
  const mod = getModule((await params).disciplina) ?? notFound();
  const userId = await requireUserId();
  const [routines, sessions] = await Promise.all([mod.listRoutines(userId), mod.listSessions(userId, 10)]);
  const base = `/entrenar/${mod.slug}`;

  return (
    <>
      <div>
        <Link href="/entrenar" className="text-muted underline">
          Entrenar
        </Link>
        <h1 className="text-3xl font-bold">{mod.name}</h1>
      </div>

      <form action={startSessionAction.bind(null, mod.slug, null)}>
        <Button type="submit">Empezar sesión libre</Button>
      </form>

      <section className="flex flex-col gap-3" aria-labelledby="rutinas">
        <div className="flex items-baseline justify-between">
          <h2 id="rutinas" className="text-xl font-bold">
            Mis rutinas
          </h2>
          <Link href={`${base}/rutinas/nueva`} className="flex min-h-12 items-center font-semibold text-accent-strong underline">
            Nueva rutina
          </Link>
        </div>
        {routines.length === 0 ? (
          <p className="text-muted">Aún no tienes rutinas. Crea una o entrena en sesión libre.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {routines.map((r) => (
              <li key={r.id} className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
                <div>
                  <p className="text-lg font-bold">{r.name}</p>
                  <p className="text-muted">
                    {r.items.map(summary).join(" · ")}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <form action={startSessionAction.bind(null, mod.slug, r.id)}>
                    <Button type="submit">Empezar</Button>
                  </form>
                  <Link
                    href={`${base}/rutinas/${r.id}`}
                    className="flex min-h-12 items-center justify-center rounded-xl border border-border text-lg font-semibold hover:bg-bg"
                  >
                    Editar
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="sesiones">
        <h2 id="sesiones" className="text-xl font-bold">
          Últimas sesiones
        </h2>
        {sessions.length === 0 ? (
          <p className="text-muted">Todavía no has registrado ninguna sesión de {mod.name.toLowerCase()}.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border rounded-xl border border-border bg-surface">
            {sessions.map((s) => (
              <li key={s.id}>
                <Link href={`${base}/sesion/${s.id}`} className="flex min-h-14 items-center justify-between gap-3 px-4 py-2 hover:bg-bg">
                  <span>
                    <span className="font-semibold">{formatShortDay(s.date)}</span>
                    <span className="text-muted"> · {s.routine?.name ?? "Sesión libre"}</span>
                  </span>
                  <span className="shrink-0 text-muted">{s._count.sets} series</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link href={`${base}/ejercicios`} className="font-semibold text-accent-strong underline">
        Catálogo de ejercicios
      </Link>
    </>
  );
}
