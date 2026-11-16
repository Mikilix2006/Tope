import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getUserId } from "@/server/auth/session";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  if (await getUserId()) redirect("/panel");
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-4 py-10">
      <Link href="/" className="text-3xl font-black tracking-tight text-accent-strong">
        Tope
      </Link>
      {children}
    </main>
  );
}
