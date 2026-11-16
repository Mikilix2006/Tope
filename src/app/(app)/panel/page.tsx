import type { Metadata } from "next";
import Link from "next/link";
import { requireUserId } from "@/server/auth/session";
import { getAccount } from "@/server/core/profile";
import { latestWeight } from "@/server/core/measurements";
import { countTrainedDays } from "@/server/core/calendar";
import { isOnboarded } from "@/server/core/onboarding";

export const metadata: Metadata = { title: "Panel" };

const kg = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 });
const fecha = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", timeZone: "UTC" });

// shortcut: panel provisional (constancia y peso en cifras); las gráficas y objetivos llegan en las fases 3 y 5.
export default async function PanelPage() {
  const userId = await requireUserId();
  const [account, weight, trained, onboarded] = await Promise.all([getAccount(userId), latestWeight(userId), countTrainedDays(userId, 30), isOnboarded(userId)]);

  return (
    <>
      <h1 className="text-3xl font-bold">Hola, {account?.name}</h1>
      {!onboarded && (
        <Link href="/alta" className="rounded-xl border border-accent bg-surface px-4 py-3 text-lg font-semibold text-accent-strong underline">
          Completa tu alta para fijar tus objetivos
        </Link>
      )}
      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-muted">Días entrenados (30 días)</p>
          <p className="text-4xl font-black text-accent-strong">{trained}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-muted">Peso corporal</p>
          {weight?.weightKg != null ? (
            <>
              <p className="text-4xl font-black">{kg.format(weight.weightKg)} kg</p>
              <p className="text-sm text-muted">{fecha.format(weight.date)}</p>
            </>
          ) : (
            <p className="mt-2 text-muted">Sin medidas todavía</p>
          )}
        </div>
      </section>
      <Link href="/entrenar" className="flex min-h-12 items-center justify-center rounded-xl bg-accent px-5 text-lg font-semibold text-accent-text hover:brightness-110">
        Entrenar
      </Link>
      <div className="grid grid-cols-2 gap-3">
        <Link href="/objetivos" className="flex min-h-12 items-center justify-center rounded-xl border border-border px-5 text-lg font-semibold hover:bg-surface">
          Objetivos
        </Link>
        <Link href="/medidas" className="flex min-h-12 items-center justify-center rounded-xl border border-border px-5 text-lg font-semibold hover:bg-surface">
          Medidas
        </Link>
      </div>
      <Link href="/perfil" className="font-semibold text-accent-strong underline">
        Editar mi perfil
      </Link>
    </>
  );
}
