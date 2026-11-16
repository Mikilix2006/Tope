import type { ComponentProps, ReactNode } from "react";

// Piezas visuales compartidas. Objetivos táctiles de al menos 48 px.

export function Button({ variant = "primary", className = "", ...props }: ComponentProps<"button"> & { variant?: "primary" | "ghost" }) {
  const styles =
    variant === "primary"
      ? "bg-accent text-accent-text hover:brightness-110"
      : "border border-border text-text hover:bg-surface";
  return (
    <button
      className={`min-h-12 w-full rounded-xl px-5 text-lg font-semibold transition disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${styles} ${className}`}
      {...props}
    />
  );
}

export function Field({ label, error, hint, ...props }: ComponentProps<"input"> & { label: string; error?: string[]; hint?: string }) {
  const id = props.id ?? props.name;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-medium">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="min-h-12 rounded-xl border border-border bg-surface px-4 text-lg outline-none focus:border-accent"
        {...props}
      />
      {hint && !error && <p className="text-sm text-muted">{hint}</p>}
      <FieldError id={`${id}-error`} error={error} />
    </div>
  );
}

export function FieldError({ id, error }: { id?: string; error?: string[] }) {
  if (!error?.length) return null;
  return (
    <p id={id} className="text-sm text-danger">
      {error[0]}
    </p>
  );
}

export function Alert({ tone = "danger", children }: { tone?: "danger" | "ok"; children: ReactNode }) {
  return (
    <p role={tone === "danger" ? "alert" : "status"} className={`rounded-xl border border-border bg-surface px-4 py-3 ${tone === "danger" ? "text-danger" : "text-ok"}`}>
      {children}
    </p>
  );
}

// Opciones grandes y tocables: chips de radio/checkbox en vez de desplegables.
export function Choice({ type, name, value, label, defaultChecked }: { type: "radio" | "checkbox"; name: string; value: string; label: string; defaultChecked: boolean }) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center rounded-xl border border-border bg-surface px-4 font-medium has-checked:border-accent has-checked:bg-accent has-checked:text-accent-text has-focus-visible:outline-2 has-focus-visible:outline-accent">
      <input type={type} name={name} value={value} defaultChecked={defaultChecked} className="sr-only" />
      {label}
    </label>
  );
}

export function Group({ legend, error, children }: { legend: string; error?: string[]; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1.5 font-medium">{legend}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
      <FieldError error={error} />
    </fieldset>
  );
}
