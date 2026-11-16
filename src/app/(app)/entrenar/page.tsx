import type { Metadata } from "next";
import Link from "next/link";
import { MODULES } from "@/modules/registry";
import { requireUserId } from "@/server/auth/session";
import { getProfile } from "@/server/core/profile";

export const metadata: Metadata = { title: "Entrenar" };

export default async function EntrenarPage() {
  const userId = await requireUserId();
  const mine = (await getProfile(userId))?.disciplines ?? [];
  // Primero las disciplinas del perfil.
  const modules = [...MODULES].sort((a, b) => Number(mine.includes(b.discipline)) - Number(mine.includes(a.discipline)));

  return (
    <>
      <h1 className="text-3xl font-bold">Entrenar</h1>
      <ul className="flex flex-col gap-3">
        {modules.map((m) => (
          <li key={m.slug}>
            <Link href={`/entrenar/${m.slug}`} className="flex flex-col gap-1 rounded-xl border border-border bg-surface p-4 hover:border-accent">
              <span className="text-2xl font-bold">{m.name}</span>
              <span className="text-muted">{m.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
