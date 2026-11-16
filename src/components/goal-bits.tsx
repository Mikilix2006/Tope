"use client";

import type { Discipline, GoalMetric } from "@prisma/client";
import { useId } from "react";
import { FieldError } from "@/components/ui";
import type { Direction } from "@/lib/goals";

// Piezas compartidas por el alta y los objetivos (selección de ejercicio y chips controlados).

/** Ejercicio elegible en un objetivo; `dir` es hacia dónde mejora (en CrossFit el tiempo baja). */
export type ExerciseOption = { id: string; name: string; metric: GoalMetric; discipline: Discipline; dir: Direction };

// Unidad, salto del botón +/− y si es entero, por métrica. El tiempo se escribe en segundos.
export const METRIC_INPUT: Record<GoalMetric, { unit: string; step: number; int: boolean }> = {
  PESO: { unit: "kg", step: 2.5, int: false },
  REPETICIONES: { unit: "rep", step: 1, int: true },
  TIEMPO: { unit: "s", step: 5, int: true },
  DISTANCIA: { unit: "m", step: 100, int: true },
  PESO_CORPORAL: { unit: "kg", step: 0.5, int: false },
  CINTURA: { unit: "cm", step: 0.5, int: false },
  PECHO: { unit: "cm", step: 0.5, int: false },
  CADERA: { unit: "cm", step: 0.5, int: false },
  BRAZO: { unit: "cm", step: 0.5, int: false },
  MUSLO: { unit: "cm", step: 0.5, int: false },
};

type ChipProps = { legend: string; name?: string; options: [string, string][]; error?: string[] } & (
  | { multiple?: false; value: string; onChange: (v: string) => void }
  | { multiple: true; value: string[]; onChange: (v: string[]) => void }
);

// Como Group + Choice, pero controlado (el estado vive en el padre).
export function ChipGroup(props: ChipProps) {
  const { legend, name, options, error } = props;
  const isOn = (v: string) => (props.multiple ? props.value.includes(v) : props.value === v);
  const toggle = (v: string) => {
    if (!props.multiple) return props.onChange(v);
    props.onChange(props.value.includes(v) ? props.value.filter((x) => x !== v) : [...props.value, v]);
  };
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1.5 font-medium">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map(([value, label]) => (
          <label
            key={value}
            className="flex min-h-12 cursor-pointer items-center rounded-xl border border-border bg-surface px-4 font-medium has-checked:border-accent has-checked:bg-accent has-checked:text-accent-text has-focus-visible:outline-2 has-focus-visible:outline-accent"
          >
            <input type={props.multiple ? "checkbox" : "radio"} name={name} value={value} checked={isOn(value)} onChange={() => toggle(value)} className="sr-only" />
            {label}
          </label>
        ))}
      </div>
      <FieldError error={error} />
    </fieldset>
  );
}

export function ExerciseSelect({
  options,
  value,
  onChange,
  name,
  error,
}: {
  options: ExerciseOption[];
  value: string;
  onChange: (id: string) => void;
  name?: string;
  error?: string[];
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-medium">
        Ejercicio
      </label>
      <select
        id={id}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="min-h-12 rounded-xl border border-border bg-surface px-3 text-lg outline-none focus:border-accent"
      >
        <option value="">Elige un ejercicio…</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
      <FieldError id={`${id}-error`} error={error} />
    </div>
  );
}
