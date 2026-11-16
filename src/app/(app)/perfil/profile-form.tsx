"use client";

import type { Discipline, Equipment, Level } from "@prisma/client";
import { useActionState } from "react";
import { Alert, Button, Choice, Field, FieldError, Group } from "@/components/ui";
import { DISCIPLINES, EQUIPMENT, LEVELS } from "@/lib/labels";
import { saveProfileAction } from "./actions";

type Props = {
  profile: {
    age: number | null;
    disciplines: Discipline[];
    level: Level | null;
    daysPerWeek: number | null;
    sessionMinutes: number | null;
    equipment: Equipment | null;
    limitations: string | null;
  };
};

export function ProfileForm({ profile }: Props) {
  const [state, action, pending] = useActionState(saveProfileAction, null);
  const e = state?.errors ?? {};

  return (
    <form action={action} className="flex flex-col gap-6">
      <Field label="Edad" name="age" type="number" inputMode="numeric" min={12} max={100} defaultValue={profile.age ?? ""} error={e.age} />

      <Group legend="Disciplinas" error={e.disciplines}>
        {Object.entries(DISCIPLINES).map(([value, label]) => (
          <Choice key={value} type="checkbox" name="disciplines" value={value} label={label} defaultChecked={profile.disciplines.includes(value as Discipline)} />
        ))}
      </Group>

      <Group legend="Nivel" error={e.level}>
        {Object.entries(LEVELS).map(([value, label]) => (
          <Choice key={value} type="radio" name="level" value={value} label={label} defaultChecked={profile.level === value} />
        ))}
      </Group>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Días por semana" name="daysPerWeek" type="number" inputMode="numeric" min={1} max={7} defaultValue={profile.daysPerWeek ?? ""} error={e.daysPerWeek} />
        <Field label="Minutos por sesión" name="sessionMinutes" type="number" inputMode="numeric" min={10} max={240} defaultValue={profile.sessionMinutes ?? ""} error={e.sessionMinutes} />
      </div>

      <Group legend="Material disponible" error={e.equipment}>
        {Object.entries(EQUIPMENT).map(([value, label]) => (
          <Choice key={value} type="radio" name="equipment" value={value} label={label} defaultChecked={profile.equipment === value} />
        ))}
      </Group>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="limitations" className="font-medium">
          Lesiones o limitaciones <span className="text-muted">(opcional)</span>
        </label>
        <textarea
          id="limitations"
          name="limitations"
          rows={3}
          maxLength={500}
          defaultValue={profile.limitations ?? ""}
          className="rounded-xl border border-border bg-surface px-4 py-3 text-lg outline-none focus:border-accent"
        />
        <FieldError error={e.limitations} />
      </div>

      {state?.message && <Alert tone={state.ok ? "ok" : "danger"}>{state.message}</Alert>}
      <Button type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Guardar perfil"}
      </Button>
    </form>
  );
}
