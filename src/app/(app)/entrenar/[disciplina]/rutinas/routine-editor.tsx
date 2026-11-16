"use client";

import type { ExerciseMetric } from "@prisma/client";
import { useActionState, useState } from "react";
import { NumberStepper } from "@/components/number-stepper";
import { Alert, Button, Field, FieldError } from "@/components/ui";
import { FIELD_SPECS, fieldsFor, type SetField } from "@/modules/fields";
import { deleteRoutineAction, saveRoutineAction } from "../actions";

export type ExerciseOption = { id: string; name: string; metric: ExerciseMetric; muscle: string | null };
export type EditorItem = { exerciseId: string; sets: number; targets: Partial<Record<SetField, string>> };

type Props = {
  slug: string;
  routineId: string | null;
  fields: readonly SetField[];
  exercises: ExerciseOption[];
  initial: { name: string; notes: string; items: EditorItem[] };
};

let nextKey = 0;

export function RoutineEditor({ slug, routineId, fields, exercises, initial }: Props) {
  const [state, action, pending] = useActionState(saveRoutineAction.bind(null, slug, routineId), null);
  const [name, setName] = useState(initial.name);
  const [notes, setNotes] = useState(initial.notes);
  const [items, setItems] = useState(() => initial.items.map((i) => ({ ...i, key: nextKey++ })));
  const byId = new Map(exercises.map((e) => [e.id, e]));
  const groups = Map.groupBy(exercises, (e) => e.muscle ?? "Otros");
  const e = state?.errors ?? {};

  const update = (key: number, patch: Partial<EditorItem>) => setItems((list) => list.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  const move = (index: number, dir: -1 | 1) =>
    setItems((list) => {
      const next = [...list];
      [next[index], next[index + dir]] = [next[index + dir], next[index]];
      return next;
    });

  const payload = JSON.stringify({
    name,
    notes,
    items: items.map((i) => ({ exerciseId: i.exerciseId, sets: i.sets, ...i.targets })),
  });

  return (
    <div className="flex flex-col gap-6">
      <form action={action} className="flex flex-col gap-6">
        <input type="hidden" name="payload" value={payload} />
        <Field label="Nombre de la rutina" name="name" value={name} onChange={(ev) => setName(ev.target.value)} maxLength={60} error={e.name} />

        <ol className="flex flex-col gap-3">
          {items.map((item, index) => {
            const ex = byId.get(item.exerciseId);
            if (!ex) return null;
            const { shown } = fieldsFor(fields, ex.metric);
            return (
              <li key={item.key} className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-lg font-bold">
                    {index + 1}. {ex.name}
                  </p>
                  <div className="flex shrink-0 gap-1">
                    <IconButton label="Subir" disabled={index === 0} onClick={() => move(index, -1)}>
                      ↑
                    </IconButton>
                    <IconButton label="Bajar" disabled={index === items.length - 1} onClick={() => move(index, 1)}>
                      ↓
                    </IconButton>
                    <IconButton label={`Quitar ${ex.name}`} onClick={() => setItems((l) => l.filter((i) => i.key !== item.key))}>
                      ×
                    </IconButton>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <NumberStepper label="Series" value={String(item.sets)} onChange={(v) => update(item.key, { sets: Number(v) || 1 })} step={1} min={1} max={20} integer />
                  {shown.map((f) => (
                    <NumberStepper
                      key={f}
                      label={`${FIELD_SPECS[f].label} objetivo`}
                      unit={FIELD_SPECS[f].unit}
                      value={item.targets[f] ?? ""}
                      onChange={(v) => update(item.key, { targets: { ...item.targets, [f]: v } })}
                      step={FIELD_SPECS[f].step}
                      min={FIELD_SPECS[f].min}
                      max={FIELD_SPECS[f].max}
                      integer={FIELD_SPECS[f].int}
                    />
                  ))}
                </div>
              </li>
            );
          })}
        </ol>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="add-exercise" className="font-medium">
            Añadir ejercicio
          </label>
          <select
            id="add-exercise"
            value=""
            onChange={(ev) => {
              if (ev.target.value) setItems((l) => [...l, { key: nextKey++, exerciseId: ev.target.value, sets: 3, targets: {} }]);
            }}
            className="min-h-12 rounded-xl border border-border bg-surface px-4 text-lg"
          >
            <option value="">Elige un ejercicio…</option>
            {[...groups].map(([muscle, list]) => (
              <optgroup key={muscle} label={muscle}>
                {list.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <FieldError error={e.items} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="notes" className="font-medium">
            Notas <span className="text-muted">(opcional)</span>
          </label>
          <textarea
            id="notes"
            rows={2}
            maxLength={500}
            value={notes}
            onChange={(ev) => setNotes(ev.target.value)}
            className="rounded-xl border border-border bg-surface px-4 py-3 text-lg outline-none focus:border-accent"
          />
        </div>

        {state?.message && <Alert>{state.message}</Alert>}
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Guardar rutina"}
        </Button>
      </form>

      {routineId && (
        <form
          action={deleteRoutineAction.bind(null, slug, routineId)}
          onSubmit={(ev) => {
            if (!confirm("¿Borrar esta rutina? Las sesiones ya registradas se conservan.")) ev.preventDefault();
          }}
        >
          <Button type="submit" variant="ghost" className="text-danger">
            Borrar rutina
          </Button>
        </form>
      )}
    </div>
  );
}

function IconButton({ label, children, ...props }: { label: string; children: React.ReactNode; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="flex size-12 items-center justify-center rounded-xl border border-border text-xl disabled:opacity-30"
      {...props}
    >
      {children}
    </button>
  );
}
