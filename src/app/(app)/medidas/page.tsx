import type { Metadata } from "next";
import { ConfirmButton } from "@/components/confirm-button";
import { formatDay } from "@/lib/format";
import { toISODate } from "@/lib/goals";
import { todayMadrid } from "@/modules/engine";
import { requireUserId } from "@/server/auth/session";
import { listMeasurements } from "@/server/core/measurements";
import { deleteMeasurementAction } from "./actions";
import { MeasurementForm } from "./measurement-form";

export const metadata: Metadata = { title: "Medidas" };

const num = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 });

export default async function MedidasPage() {
  const userId = await requireUserId();
  const rows = (await listMeasurements(userId)).reverse(); // más reciente primero

  return (
    <>
      <h1 className="text-3xl font-bold">Medidas</h1>
      <MeasurementForm today={toISODate(todayMadrid())} />

      <section className="flex flex-col gap-3">
        <h2 className="text-2xl font-bold">Historial</h2>
        {rows.length === 0 ? (
          <p className="rounded-xl border border-border bg-surface p-4 text-lg">Todavía no hay medidas. Guarda la primera con el formulario de arriba.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {rows.map((m) => {
              const parts = [
                m.weightKg != null && `Peso ${num.format(m.weightKg)} kg`,
                m.heightCm != null && `Altura ${num.format(m.heightCm)} cm`,
                m.waistCm != null && `Cintura ${num.format(m.waistCm)} cm`,
                m.chestCm != null && `Pecho ${num.format(m.chestCm)} cm`,
                m.hipCm != null && `Cadera ${num.format(m.hipCm)} cm`,
                m.armCm != null && `Brazo ${num.format(m.armCm)} cm`,
                m.thighCm != null && `Muslo ${num.format(m.thighCm)} cm`,
              ].filter(Boolean);
              return (
                <li key={m.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4">
                  <div>
                    <p className="font-bold first-letter:uppercase">{formatDay(m.date)}</p>
                    <p className="text-muted">{parts.join(" · ")}</p>
                  </div>
                  <form action={deleteMeasurementAction.bind(null, m.id)}>
                    <ConfirmButton message="¿Borrar estas medidas?">
                      Borrar
                    </ConfirmButton>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
