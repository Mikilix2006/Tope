"use client";

import type { Discipline, GoalDifficulty, GoalMetric } from "@prisma/client";
import { useActionState, useRef, useState } from "react";
import { ChipGroup, ExerciseSelect, METRIC_INPUT, type ExerciseOption } from "@/components/goal-bits";
import { NumberStepper } from "@/components/number-stepper";
import { Alert, Button, Field } from "@/components/ui";
import { formatGoalValue, suggestDeadline, suggestTarget, toISODate, type BodyMetric, type Direction } from "@/lib/goals";
import { BODY_METRICS, DIFFICULTIES, DISCIPLINES } from "@/lib/labels";
import { createGoalAction, latestStartAction, updateGoalAction } from "./actions";

export type EditableGoal = {
  id: string;
  title: string;
  metric: GoalMetric;
  dir: Direction;
  startValue: number;
  targetValue: number;
  targetEdited: boolean;
  difficulty: GoalDifficulty;
  deadline: string;
};

type Props = {
  exercises: ExerciseOption[];
  today: string;
  /** Última medida de cada tipo, para prerrellenar el valor inicial. */
  latestBody: Partial<Record<BodyMetric, number>>;
  goal?: EditableGoal;
};

const entries = <T extends string>(o: Record<T, string>) => Object.entries(o) as [T, string][];

export function GoalForm({ exercises, today, latestBody, goal }: Props) {
  const [state, action, pending] = useActionState(goal ? updateGoalAction.bind(null, goal.id) : createGoalAction, null);
  const e = state?.errors ?? {};
  const [kind, setKind] = useState("ejercicio");
  const [discipline, setDiscipline] = useState<string>(exercises[0]?.discipline ?? "FUERZA");
  const [exerciseId, setExerciseId] = useState("");
  const [bodyMetric, setBodyMetric] = useState<BodyMetric>("PESO_CORPORAL");
  const [direction, setDirection] = useState<Direction>("BAJAR");
  const [start, setStart] = useState(goal ? "" : String(latestBody.PESO_CORPORAL ?? ""));
  const [difficulty, setDifficulty] = useState<GoalDifficulty>(goal?.difficulty ?? "MEDIO");
  // Mientras no se toquen, la meta y la fecha siguen a la sugerida (dificultad e inicio).
  const [target, setTarget] = useState(String(goal?.targetValue ?? ""));
  const [targetTouched, setTargetTouched] = useState(goal?.targetEdited ?? false);
  const [deadline, setDeadline] = useState(goal?.deadline ?? "");
  const [deadlineTouched, setDeadlineTouched] = useState(!!goal);

  const options = exercises.filter((x) => x.discipline === discipline);
  const ex = options.find((x) => x.id === exerciseId);
  const metric: GoalMetric | undefined = goal ? goal.metric : kind === "ejercicio" ? ex?.metric : bodyMetric;
  const dir: Direction | undefined = goal ? goal.dir : kind === "ejercicio" ? ex?.dir : direction;
  const startNum = goal ? goal.startValue : Number(start);
  const suggested = metric && dir && (goal || start !== "") ? suggestTarget(metric, difficulty, startNum, dir) : null;
  const shownTarget = targetTouched ? target : suggested != null ? String(suggested) : "";
  const shownDeadline = deadlineTouched ? deadline : toISODate(suggestDeadline(difficulty, new Date(`${today}T00:00:00Z`)));
  const input = metric && METRIC_INPUT[metric];

  const lastPick = useRef("");
  const pickExercise = async (id: string) => {
    lastPick.current = id;
    setExerciseId(id);
    setStart("");
    const best = id ? await latestStartAction(discipline, id) : null;
    // Si entretanto se eligió otro ejercicio, esta respuesta llega tarde y se descarta.
    if (best != null && lastPick.current === id) setStart(String(best));
  };
  const pickBody = (m: BodyMetric) => {
    setBodyMetric(m);
    setStart(String(latestBody[m] ?? ""));
  };

  return (
    <form action={action} className="flex flex-col gap-6">
      {goal ? (
        <p className="rounded-xl border border-border bg-surface p-4">
          <span className="font-bold">{goal.title}</span>
          <br />
          <span className="text-muted">Valor inicial: {formatGoalValue(goal.metric, goal.startValue)}</span>
        </p>
      ) : (
        <>
          <ChipGroup name="kind" legend="Tipo de objetivo" options={[["ejercicio", "Ejercicio"], ["medida", "Medida corporal"]]} value={kind} onChange={(k) => { setKind(k); setStart(k === "medida" ? String(latestBody[bodyMetric] ?? "") : ""); }} />
          {kind === "ejercicio" ? (
            <>
              <ChipGroup name="discipline" legend="Disciplina" options={entries(DISCIPLINES)} value={discipline} onChange={(d) => { setDiscipline(d as Discipline); setExerciseId(""); setStart(""); }} />
              <ExerciseSelect name="exerciseId" options={options} value={exerciseId} onChange={pickExercise} error={e.exerciseId} />
            </>
          ) : (
            <>
              <ChipGroup name="metric" legend="Medida" options={entries(BODY_METRICS)} value={bodyMetric} onChange={(m) => pickBody(m as BodyMetric)} error={e.metric} />
              <ChipGroup name="direction" legend="Quiero" options={[["SUBIR", "Subir"], ["BAJAR", "Bajar"]]} value={direction} onChange={(d) => setDirection(d as Direction)} error={e.direction} />
            </>
          )}
          {input && (
            <NumberStepper
              name="startValue"
              label={kind === "medida" ? "Valor actual" : metric === "TIEMPO" ? "Tu mejor tiempo" : "Tu marca actual"}
              unit={input.unit}
              step={input.step}
              min={0}
              max={100_000}
              integer={input.int}
              value={start}
              onChange={setStart}
              invalid={!!e.startValue}
              hint={e.startValue?.[0] ?? (metric && start !== "" ? formatGoalValue(metric, Number(start)) : undefined)}
            />
          )}
        </>
      )}

      <ChipGroup name="difficulty" legend="Dificultad" options={entries(DIFFICULTIES)} value={difficulty} onChange={(d) => setDifficulty(d as GoalDifficulty)} error={e.difficulty} />

      {input && metric && (
        <>
          <NumberStepper
            name="targetValue"
            label="Meta"
            unit={input.unit}
            step={input.step}
            min={0}
            max={100_000}
            integer={input.int}
            value={shownTarget}
            onChange={(v) => { setTarget(v); setTargetTouched(true); }}
            invalid={!!e.targetValue}
            hint={e.targetValue?.[0] ?? (shownTarget !== "" ? `${formatGoalValue(metric, Number(shownTarget))}${targetTouched && suggested != null && String(suggested) !== shownTarget ? ` · sugerida: ${formatGoalValue(metric, suggested)}` : ""}` : undefined)}
          />
          <div className="flex flex-col gap-2">
            <Field label="Fecha límite (opcional)" name="deadline" type="date" value={shownDeadline} onChange={(ev) => { setDeadline(ev.target.value); setDeadlineTouched(true); }} error={e.deadline} />
            {shownDeadline && (
              <Button type="button" variant="ghost" onClick={() => { setDeadline(""); setDeadlineTouched(true); }}>
                Sin fecha límite
              </Button>
            )}
          </div>
        </>
      )}

      {state?.message && <Alert>{state.message}</Alert>}
      <Button type="submit" disabled={pending || !metric}>
        {pending ? "Guardando…" : goal ? "Guardar cambios" : "Crear objetivo"}
      </Button>
    </form>
  );
}
