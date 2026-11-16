"use client";

import { useActionState } from "react";
import { Alert, Button, Field } from "@/components/ui";
import { saveMeasurementAction } from "./actions";

const FIELDS = [
  ["weightKg", "Peso (kg)"],
  ["heightCm", "Altura (cm)"],
  ["waistCm", "Cintura (cm)"],
  ["chestCm", "Pecho (cm)"],
  ["hipCm", "Cadera (cm)"],
  ["armCm", "Brazo (cm)"],
  ["thighCm", "Muslo (cm)"],
] as const;

export function MeasurementForm({ today }: { today: string }) {
  const [state, action, pending] = useActionState(saveMeasurementAction, null);
  const e = state?.errors ?? {};
  const v = state?.values ?? {};

  return (
    <form action={action} className="flex flex-col gap-5">
      <Field label="Fecha" name="date" type="date" required defaultValue={v.date || today} error={e.date} />
      <div className="grid grid-cols-2 gap-3">
        {FIELDS.map(([name, label]) => (
          <Field key={name} label={label} name={name} type="number" inputMode="decimal" step="any" defaultValue={v[name] ?? ""} error={e[name]} />
        ))}
      </div>
      <p className="text-sm text-muted">Rellena solo lo que hayas medido (al menos una). Si ya hay medidas de ese día, se completan.</p>
      {e.form && <Alert>{e.form[0]}</Alert>}
      {state?.ok && <Alert tone="ok">{state.message}</Alert>}
      <Button type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Guardar medidas"}
      </Button>
    </form>
  );
}
