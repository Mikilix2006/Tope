import Link from "next/link";
import type { ReactNode } from "react";
import { requireUserId } from "@/server/auth/session";
import { LogoutButton } from "./logout-button";

// Primer control: sin sesión, a /acceso. Cada página vuelve a pedir el userId (el layout no se re-ejecuta al navegar).
export default async function AppLayout({ children }: { children: ReactNode }) {
  await requireUserId();
  return (
    <>
      <header className="sticky top-0 z-10 border-b border-border bg-bg/90 backdrop-blur">
        <nav className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-2">
          {/* shortcut: menú en cabecera (el logo lleva al panel); barra inferior para móvil en la fase 5. */}
          <Link href="/panel" aria-label="Tope: ir al panel" className="mr-auto text-2xl font-black tracking-tight text-accent-strong">
            Tope
          </Link>
          <Link href="/entrenar" className="flex min-h-12 items-center rounded-lg px-3 font-medium hover:bg-surface">
            Entrenar
          </Link>
          <Link href="/perfil" className="flex min-h-12 items-center rounded-lg px-3 font-medium hover:bg-surface">
            Perfil
          </Link>
          <LogoutButton />
        </nav>
      </header>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-6">{children}</main>
    </>
  );
}
