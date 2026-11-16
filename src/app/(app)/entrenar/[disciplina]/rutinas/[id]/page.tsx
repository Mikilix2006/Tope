import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadEditor } from "../load";
import { RoutineEditor } from "../routine-editor";

export const metadata: Metadata = { title: "Editar rutina" };

export default async function EditarRutinaPage({ params }: { params: Promise<{ disciplina: string; id: string }> }) {
  const { id } = await params;
  const { mod, userId, exercises } = await loadEditor(params);
  const routine = (await mod.getRoutine(userId, id)) ?? notFound();

  const items = routine.items.map((i) => ({
    exerciseId: i.exerciseId,
    sets: i.sets,
    targets: Object.fromEntries(mod.fields.flatMap((f) => (i[f] != null ? [[f, String(i[f])]] : []))),
  }));

  return (
    <>
      <div>
        <Link href={`/entrenar/${mod.slug}`} className="text-muted underline">
          {mod.name}
        </Link>
        <h1 className="text-3xl font-bold">Editar rutina</h1>
      </div>
      <RoutineEditor
        slug={mod.slug}
        routineId={routine.id}
        fields={mod.fields}
        exercises={exercises}
        initial={{ name: routine.name, notes: routine.notes ?? "", items }}
      />
    </>
  );
}
