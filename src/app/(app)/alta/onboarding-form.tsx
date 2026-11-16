"use client";

import type { Discipline, GoalDifficulty } from "@prisma/client";
import { useActionState, useState } from "react";
import { ChipGroup, ExerciseSelect, METRIC_INPUT, type ExerciseOption } from "@/components/goal-bits";
import { NumberStepper } from "@/components/number-stepper";
import { Alert, Button, Field } from "@/components/ui";
import { formatShortDay } from "@/lib/format";
import { formatGoalValue, suggestDeadline, suggestTarget } from "@/lib/goals";
import { DIFFICULTIES, DISCIPLINES, EQUIPMENT, LEVELS } from "@/lib/labels";
import { completeOnboardingAction } from "./actions";

type Mark = { key: number; discipline: Discipline; exerciseId: string; value: string; difficulty: GoalDifficulty };

const STEPS = ["Tus medidas", "Tu entrenamiento", "Material y salud", "Tus marcas"];
const MAX_MARKS = 10;
const FIELD_LABELS: Record<string, string> = { heightCm: "Altura", weightKg: "Peso", age: "Edad", disciplines: "Disciplinas", level: "Nivel", daysPerWeek: "Días por semana", sessionMinutes: "Minutos por sesión", equipment: "Material", limitations: "Limitaciones", marks: "Marcas" };

const inRange = (v: string, min: number, max: number) => v !== "" && Number(v) >= min && Number(v) <= max;
const entries = <T extends string>(o: Record<T, string>) => Object.entries(o) as [T, string][];

export function OnboardingForm({ exercises, today }: { exercises: ExerciseOption[]; today: string }) {
  const [state, action, pending] = useActionState(completeOnboardingAction, null);
  const [step, setStep] = useState(0);
  const [problem, setProblem] = useState<string | null>(null);
  const [heightCm, setHeight] = useState("");
  const [weightKg, setWeight] = useState("");
  const [age, setAge] = useState("");
  const [disciplines, setDisciplines] = useState<string[]>([]);
  const [level, setLevel] = useState("");
  const [daysPerWeek, setDays] = useState("3");
  const [sessionMinutes, setMinutes] = useState("60");
  const [equipment, setEquipment] = useState("");
  const [limitations, setLimitations] = useState("");
  const [marks, setMarks] = useState<Mark[]>([]);
  const [nextKey, setNextKey] = useState(1);
  const todayDate = new Date(`${today}T00:00:00Z`);

  // Validación ligera por paso; la de verdad la hace el servidor.
  const check = (s: number): string | null => {
    if (s === 0) {
      if (!inRange(heightCm, 80, 250)) return "La altura tiene que estar entre 80 y 250 cm.";
      if (!inRange(weightKg, 20, 400)) return "El peso tiene que estar entre 20 y 400 kg.";
      if (!inRange(age, 12, 100)) return "La edad tiene que estar entre 12 y 100 años.";
    }
    if (s === 1) {
      if (!disciplines.length) return "Elige al menos una disciplina.";
      if (!level) return "Elige tu nivel.";
      if (!inRange(daysPerWeek, 1, 7)) return "Los días por semana van de 1 a 7.";
      if (!inRange(sessionMinutes, 10, 240)) return "La sesión dura entre 10 y 240 minutos.";
    }
    if (s === 2 && !equipment) return "Elige el material que tienes.";
    if (s === 3 && marks.some((m) => !m.exerciseId || m.value === "")) return "Completa el ejercicio y el valor de cada marca, o quita la fila.";
    return null;
  };

  const go = (to: number) => {
    const error = to > step ? check(step) : null;
    setProblem(error);
    if (!error) setStep(to);
  };

  const setDisciplineList = (list: string[]) => {
    setDisciplines(list);
    setMarks((ms) => ms.filter((m) => list.includes(m.discipline))); // sin marcas de disciplinas descartadas
  };
  const patchMark = (key: number, patch: Partial<Mark>) => setMarks((ms) => ms.map((m) => (m.key === key ? { ...m, ...patch } : m)));
  const addMark = () => {
    setMarks((ms) => [...ms, { key: nextKey, discipline: disciplines[0] as Discipline, exerciseId: "", value: "", difficulty: "MEDIO" }]);
    setNextKey(nextKey + 1);
  };

  const payload = JSON.stringify({
    heightCm, weightKg, age, disciplines, level, daysPerWeek, sessionMinutes, equipment, limitations,
    marks: marks.map(({ discipline, exerciseId, value, difficulty }) => ({ discipline, exerciseId, value, difficulty })),
  });
  const serverErrors = Object.entries(state?.errors ?? {}).flatMap(([k, msgs]) => (msgs ?? []).map((m) => (k === "form" ? m : `${FIELD_LABELS[k] ?? k}: ${m}`)));

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="payload" value={payload} />
      <div>
        <p className="font-semibold text-accent-strong">
          Paso {step + 1} de {STEPS.length}
        </p>
        <h2 className="text-2xl font-bold">{STEPS[step]}</h2>
      </div>

      {step === 0 && (
        <>
          <Field label="Altura (cm)" type="number" inputMode="numeric" min={80} max={250} value={heightCm} onChange={(e) => setHeight(e.target.value)} />
          <Field label="Peso (kg)" type="number" inputMode="decimal" step="any" min={20} max={400} value={weightKg} onChange={(e) => setWeight(e.target.value)} />
          <Field label="Edad" type="number" inputMode="numeric" min={12} max={100} value={age} onChange={(e) => setAge(e.target.value)} />
        </>
      )}

      {step === 1 && (
        <>
          <ChipGroup multiple legend="Disciplinas" options={entries(DISCIPLINES)} value={disciplines} onChange={setDisciplineList} />
          <ChipGroup legend="Nivel" options={entries(LEVELS)} value={level} onChange={setLevel} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Días por semana" type="number" inputMode="numeric" min={1} max={7} value={daysPerWeek} onChange={(e) => setDays(e.target.value)} />
            <Field label="Minutos por sesión" type="number" inputMode="numeric" min={10} max={240} value={sessionMinutes} onChange={(e) => setMinutes(e.target.value)} />
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <ChipGroup legend="Material disponible" options={entries(EQUIPMENT)} value={equipment} onChange={setEquipment} />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="limitations" className="font-medium">
              Lesiones o limitaciones <span className="text-muted">(opcional)</span>
            </label>
            <textarea
              id="limitations"
              rows={3}
              maxLength={500}
              value={limitations}
              onChange={(e) => setLimitations(e.target.value)}
              className="rounded-xl border border-border bg-surface px-4 py-3 text-lg outline-none focus:border-accent"
            />
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <p className="text-muted">Tus marcas actuales, por ejemplo «4 dominadas» o «60 kg en press banca». Serán el punto de partida de tus objetivos. Puedes saltarte este paso.</p>
          {marks.map((m, i) => {
            const options = exercises.filter((e) => e.discipline === m.discipline);
            const ex = options.find((e) => e.id === m.exerciseId);
            const input = ex && METRIC_INPUT[ex.metric];
            const target = ex && m.value !== "" ? suggestTarget(ex.metric, m.difficulty, Number(m.value), ex.dir) : null;
            return (
              <section key={m.key} aria-label={`Marca ${i + 1}`} className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4">
                <ChipGroup
                  legend="Disciplina"
                  options={disciplines.map((d) => [d, DISCIPLINES[d as Discipline]])}
                  value={m.discipline}
                  onChange={(d) => patchMark(m.key, { discipline: d as Discipline, exerciseId: "", value: "" })}
                />
                <ExerciseSelect options={options} value={m.exerciseId} onChange={(id) => patchMark(m.key, { exerciseId: id, value: "" })} />
                {ex && input && (
                  <NumberStepper
                    label={ex.metric === "TIEMPO" ? "Tu mejor tiempo" : "Tu marca actual"}
                    unit={input.unit}
                    step={input.step}
                    min={0}
                    max={100_000}
                    integer={input.int}
                    value={m.value}
                    onChange={(v) => patchMark(m.key, { value: v })}
                    hint={m.value !== "" ? formatGoalValue(ex.metric, Number(m.value)) : undefined}
                  />
                )}
                <ChipGroup legend="Dificultad del objetivo" options={entries(DIFFICULTIES)} value={m.difficulty} onChange={(d) => patchMark(m.key, { difficulty: d as GoalDifficulty })} />
                {ex && target != null && (
                  <p className="font-medium">
                    Meta sugerida: <span className="text-accent-strong">{formatGoalValue(ex.metric, target)}</span> antes del {formatShortDay(suggestDeadline(m.difficulty, todayDate))}
                  </p>
                )}
                <Button type="button" variant="ghost" onClick={() => setMarks((ms) => ms.filter((x) => x.key !== m.key))}>
                  Quitar marca
                </Button>
              </section>
            );
          })}
          {marks.length < MAX_MARKS && (
            <Button type="button" variant="ghost" onClick={addMark}>
              Añadir marca
            </Button>
          )}
        </>
      )}

      {problem && <Alert>{problem}</Alert>}
      {serverErrors.length > 0 && (
        <Alert>
          {serverErrors.map((e) => (
            <span key={e} className="block">
              {e}
            </span>
          ))}
        </Alert>
      )}
      {state?.message && !serverErrors.length && <Alert>{state.message}</Alert>}

      <div className="flex gap-3">
        {step > 0 && (
          <Button type="button" variant="ghost" onClick={() => go(step - 1)}>
            Atrás
          </Button>
        )}
        {step < STEPS.length - 1 ? (
          <Button type="button" onClick={() => go(step + 1)}>
            Siguiente
          </Button>
        ) : (
          <Button type="submit" disabled={pending} onClick={(e) => { const error = check(step); setProblem(error); if (error) e.preventDefault(); }}>
            {pending ? "Guardando…" : "Terminar"}
          </Button>
        )}
      </div>
    </form>
  );
}
