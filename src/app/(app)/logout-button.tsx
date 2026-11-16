"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="min-h-12 rounded-lg px-3 font-medium text-muted hover:bg-surface"
    >
      Salir
    </button>
  );
}
