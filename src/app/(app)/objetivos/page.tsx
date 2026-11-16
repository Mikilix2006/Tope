import type { Metadata } from "next";
import Link from "next/link";
import { ConfirmButton } from "@/components/confirm-button";
import { formatDay } from "@/lib/format";
import { formatGoalValue } from "@/lib/goals";
import { DIFFICULTIES, DISCIPLINES, GOAL_STATUS } from "@/lib/labels";
import { requireUserId } from "@/server/auth/session";
import { listGoals } from "@/server/core/goals";
import { deleteGoalAction } from "./actions";

export const metadata: Metadata = { title: "Objetivos" };

const linkButton = "flex min-h-12 items-center justify-center rounded-xl px-5 text-lg font-semibold";
// Estado = icono + texto + forma del borde (no solo color): en curso discontinuo, conseguido relleno, vencido tachado.
const STATUS_STYLE = {
  EN_CURSO: { icon: "◔", cls: "border-border text-text" },
  CONSEGUIDO: { icon: "✓", cls: "border-ok bg-ok/15 text-ok" },
  VENCIDO: { icon: "✕", cls: "border-danger text-danger line-through" },
} as const;

export default async function ObjetivosPage() {
  const userId = await requireUserId();
  const goals = await listGoals(userId);

  return (
    <>
      <h1 className="text-3xl font-bold">Objetivos</h1>
      <Link href="/objetivos/nuevo" className={`${linkButton} bg-accent text-accent-text hover:brightness-110`}>
        Nuevo objetivo
      </Link>

      {goals.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface p-4 text-lg">Todavía no tienes objetivos. Crea el primero: elige un ejercicio o una medida y te sugerimos una meta.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {goals.map((g) => (
            <li key={g.id} className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">{g.title}</h2>
                  <p className="text-sm text-muted">
                    {g.discipline ? `${DISCIPLINES[g.discipline]} · ` : ""}
                    {DIFFICULTIES[g.difficulty]}
                  </p>
                </div>
                <span className={`shrink-0 whitespace-nowrap rounded-full border-2 px-3 py-0.5 text-sm font-bold ${STATUS_STYLE[g.status].cls}`}>
                  <span aria-hidden="true">{STATUS_STYLE[g.status].icon} </span>
                  {GOAL_STATUS[g.status]}
                </span>
              </div>
              <p className="text-lg">
                {formatGoalValue(g.metric, g.startValue)} → <strong>{formatGoalValue(g.metric, g.current)}</strong> → {formatGoalValue(g.metric, g.targetValue)}
                {g.targetEdited && <span className="text-sm text-muted"> (meta editada)</span>}
              </p>
              <div className="flex items-center gap-3">
                <div role="progressbar" aria-label={`Progreso de ${g.title}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={g.progress} aria-valuetext={`${g.progress} %`} className="h-3 flex-1 overflow-hidden rounded-full bg-border">
                  <div className="h-full bg-accent" style={{ width: `${g.progress}%` }} />
                </div>
                <span className="w-12 text-right font-bold">{g.progress} %</span>
              </div>
              <p className="text-sm text-muted">{g.deadline ? `Fecha límite: ${formatDay(g.deadline)}` : "Sin fecha límite"}</p>
              <div className="grid grid-cols-2 gap-3">
                <Link href={`/objetivos/${g.id}`} className={`${linkButton} border border-border hover:bg-bg`}>
                  Editar
                </Link>
                <form action={deleteGoalAction.bind(null, g.id)}>
                  <ConfirmButton message="¿Borrar este objetivo?">Borrar</ConfirmButton>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
