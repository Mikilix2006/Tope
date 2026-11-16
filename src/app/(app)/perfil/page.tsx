import type { Metadata } from "next";
import Link from "next/link";
import { requireUserId } from "@/server/auth/session";
import { getAccount, getProfile } from "@/server/core/profile";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Perfil" };

export default async function PerfilPage() {
  const userId = await requireUserId();
  const [account, profile] = await Promise.all([getAccount(userId), getProfile(userId)]);

  return (
    <>
      <div>
        <h1 className="text-3xl font-bold">Perfil</h1>
        <p className="text-muted">{account?.email}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Link href="/objetivos" className="flex min-h-12 items-center justify-center rounded-xl border border-border px-5 text-lg font-semibold hover:bg-surface">
          Objetivos
        </Link>
        <Link href="/medidas" className="flex min-h-12 items-center justify-center rounded-xl border border-border px-5 text-lg font-semibold hover:bg-surface">
          Medidas
        </Link>
      </div>
      <ProfileForm
        profile={{
          age: profile?.age ?? null,
          disciplines: profile?.disciplines ?? [],
          level: profile?.level ?? null,
          daysPerWeek: profile?.daysPerWeek ?? null,
          sessionMinutes: profile?.sessionMinutes ?? null,
          equipment: profile?.equipment ?? null,
          limitations: profile?.limitations ?? null,
        }}
      />
    </>
  );
}
