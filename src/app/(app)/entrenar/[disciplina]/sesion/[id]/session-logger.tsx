"use client";

import type { ExerciseMetric } from "@prisma/client";
import { useActionState, useState } from "react";
import { NumberStepper } from "@/components/number-stepper";
import { Alert, Button } from "@/components/ui";
import { formatSeconds } from "@/lib/format";
import { FIELD_SPECS, fieldsFor, type SetField, type SetValues } from "@/modules/fields";
import { addSetAction, deleteSessionAction, deleteSetAction } from "../../actions";

type Exercise = { id: string; name: string; metric: ExerciseMetric; muscle: string | null };

export type LoggerData = {
  exercises: Exercise[];
  /** Ejercicios de la rutina y los que ya tienen series, en orden. */
  order: string[];
  /** Series planificadas por ejercicio (si viene de rutina). */
  planned: Record<string, number>;
  defaults: Record<string, SetValues>;
  sets: { id: string; exerciseId: string; label: string }[];
};

type Props = { slug: string; sessionId: string; fields: readonly SetField[]; data: LoggerData };

export function SessionLogger({ slug, sessionId, fields, data }: Props) {
  const [added, setAdded] = useState<string[]>([]);
  const byId = new Map(data.exercises.map((e) => [e.id, e]));
  const order = [...new Set([...data.order, ...added])].filter((id) => byId.has(id));
  const groups = Map.groupBy(
    data.exercises.filter((e) => !order.includes(e.id)),
    (e) => e.muscle ?? "Otros",
  );

  return (
    <div className="flex flex-col gap-6">
      {order.length === 0 && <p className="text-muted">Elige el primer ejercicio para empezar a registrar series.</p>}

      {order.map((id) => (
        <ExerciseCard
          key={id}
          slug={slug}
          sessionId={sessionId}
          fields={fields}
          exercise={byId.get(id)!}
          planned={data.planned[id]}
          defaults={data.defaults[id] ?? {}}
          sets={data.sets.filter((s) => s.exerciseId === id)}
        />
      ))}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="add-exercise" className="font-medium">
          Añadir ejercicio a la sesión
        </label>
        <select
          id="add-exercise"
          value=""
          onChange={(ev) => ev.target.value && setAdded((a) => [...a, ev.target.value])}
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
      </div>

      <form
        action={deleteSessionAction.bind(null, slug, sessionId)}
        onSubmit={(ev) => {
          if (!confirm("¿Borrar esta sesión y todas sus series?")) ev.preventDefault();
        }}
        className="border-t border-border pt-6"
      >
        <Button type="submit" variant="ghost" className="text-danger">
          Borrar sesión
        </Button>
      </form>
    </div>
  );
}

function ExerciseCard({
  slug,
  sessionId,
  fields,
  exercise,
  planned,
  defaults,
  sets,
}: Omit<Props, "data"> & { exercise: Exercise; planned?: number; defaults: SetValues; sets: LoggerData["sets"] }) {
  const { shown, required } = fieldsFor(fields, exercise.metric);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(shown.map((f) => [f, defaults[f] != null ? String(defaults[f]) : ""])),
  );
  const [state, action, pending] = useActionState(addSetAction.bind(null, slug, sessionId, exercise.id), null);
  const done = planned != null && sets.length >= planned;

  return (
    <section aria-label={exercise.name} className={`flex flex-col gap-4 rounded-xl border bg-surface p-4 ${done ? "border-ok" : "border-border"}`}>
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-xl font-bold">{exercise.name}</h2>
        <span className={`shrink-0 font-semibold ${done ? "text-ok" : "text-muted"}`}>
          {sets.length}
          {planned != null && `/${planned}`} series
        </span>
      </div>

      {sets.length > 0 && (
        <ol className="flex flex-col gap-1">
          {sets.map((s, i) => (
            <li key={s.id} className="flex items-center justify-between gap-2">
              <span className="text-lg">
                <span className="mr-2 text-muted">{i + 1}.</span>
                {s.label}
              </span>
              <form action={deleteSetAction.bind(null, slug, sessionId, s.id)}>
                <button type="submit" aria-label={`Borrar serie ${i + 1}`} className="flex size-12 items-center justify-center rounded-xl text-xl text-muted hover:text-danger">
                  ×
                </button>
              </form>
            </li>
          ))}
        </ol>
      )}

      <form action={action} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          {shown.map((f) => {
            const spec = FIELD_SPECS[f];
            const v = values[f] ?? "";
            return (
              <NumberStepper
                key={f}
                name={f}
                label={spec.label + (required.includes(f) ? "" : " (opcional)")}
                unit={f === "weightKg" && exercise.metric === "REPETICIONES" ? "kg de lastre" : spec.unit}
                value={v}
                onChange={(nv) => setValues((s) => ({ ...s, [f]: nv }))}
                step={spec.step}
                min={spec.min}
                max={spec.max}
                integer={spec.int}
                invalid={!!state?.errors?.[f]}
                hint={f === "seconds" && v !== "" && Number(v) >= 60 ? `= ${formatSeconds(Number(v))}` : undefined}
              />
            );
          })}
        </div>
        {state?.message && <Alert>{state.message}</Alert>}
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Añadir serie"}
        </Button>
      </form>
    </section>
  );
}
