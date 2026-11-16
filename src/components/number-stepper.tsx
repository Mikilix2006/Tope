"use client";

import { useId } from "react";

type Props = {
  label: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  step: number;
  min: number;
  max: number;
  unit?: string;
  integer?: boolean;
  hint?: string;
  invalid?: boolean;
};

const round = (n: number) => Math.round(n * 100) / 100;

// Campo numérico con − y + grandes: ajustar una serie sin abrir el teclado.
export function NumberStepper({ label, name, value, onChange, step, min, max, unit, integer, hint, invalid }: Props) {
  const id = useId();
  const bump = (dir: 1 | -1) => {
    const current = Number(value === "" ? min : value);
    const next = Math.min(max, Math.max(min, round((Number.isFinite(current) ? current : min) + dir * step)));
    onChange(String(next));
  };
  const btn =
    "flex size-12 shrink-0 items-center justify-center rounded-xl border border-border bg-bg text-2xl font-bold hover:border-accent focus-visible:outline-2 focus-visible:outline-accent";

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-muted">
        {label}
        {unit && ` (${unit})`}
      </label>
      <div className="flex items-center gap-1.5">
        <button type="button" className={btn} onClick={() => bump(-1)} aria-label={`Restar ${step} a ${label.toLowerCase()}`}>
          −
        </button>
        <input
          id={id}
          name={name}
          type="number"
          inputMode={integer ? "numeric" : "decimal"}
          step={integer ? 1 : "any"}
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={invalid || undefined}
          aria-describedby={hint ? `${id}-hint` : undefined}
          className="h-12 w-full min-w-0 rounded-xl border border-border bg-surface px-2 text-center text-xl font-bold outline-none focus:border-accent aria-invalid:border-danger"
        />
        <button type="button" className={btn} onClick={() => bump(1)} aria-label={`Sumar ${step} a ${label.toLowerCase()}`}>
          +
        </button>
      </div>
      {hint && (
        <p id={`${id}-hint`} className={`text-sm ${invalid ? "text-danger" : "text-muted"}`}>
          {hint}
        </p>
      )}
    </div>
  );
}
