"use client";

import { useActionState } from "react";
import { Alert, Button, Choice, Field, Group } from "@/components/ui";
import { EQUIPMENT } from "@/lib/labels";
import { createExerciseAction } from "../actions";

export function NewExerciseForm({ slug, metrics }: { slug: string; metrics: { value: string; label: string }[] }) {
  const [state, action, pending] = useActionState(createExerciseAction.bind(null, slug), null);
  const e = state?.errors ?? {};

  return (
    <form action={action} className="flex flex-col gap-5">
      <Field label="Nombre" name="name" required minLength={2} maxLength={60} error={e.name} />
      {metrics.length === 1 ? (
        <input type="hidden" name="metric" value={metrics[0].value} />
      ) : (
        <Group legend="Qué se mide" error={e.metric}>
          {metrics.map((m, i) => (
            <Choice key={m.value} type="radio" name="metric" value={m.value} label={m.label} defaultChecked={i === 0} />
          ))}
        </Group>
      )}
      <Field label="Grupo (opcional)" name="muscle" maxLength={40} placeholder="Piernas, Core…" error={e.muscle} />
      <Group legend="Material (opcional)" error={e.equipment}>
        {Object.entries(EQUIPMENT).map(([value, label]) => (
          <Choice key={value} type="radio" name="equipment" value={value} label={label} defaultChecked={false} />
        ))}
      </Group>
      {state?.message && <Alert tone="ok">{state.message}</Alert>}
      <Button type="submit" disabled={pending}>
        {pending ? "Creando…" : "Crear ejercicio"}
      </Button>
    </form>
  );
}
