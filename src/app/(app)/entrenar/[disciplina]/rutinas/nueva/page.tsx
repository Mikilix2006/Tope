import type { Metadata } from "next";
import Link from "next/link";
import { loadEditor } from "../load";
import { RoutineEditor } from "../routine-editor";

export const metadata: Metadata = { title: "Nueva rutina" };

export default async function NuevaRutinaPage({ params }: { params: Promise<{ disciplina: string }> }) {
  const { mod, exercises } = await loadEditor(params);
  return (
    <>
      <div>
        <Link href={`/entrenar/${mod.slug}`} className="text-muted underline">
          {mod.name}
        </Link>
        <h1 className="text-3xl font-bold">Nueva rutina</h1>
      </div>
      <RoutineEditor slug={mod.slug} routineId={null} fields={mod.fields} exercises={exercises} initial={{ name: "", notes: "", items: [] }} />
    </>
  );
}
