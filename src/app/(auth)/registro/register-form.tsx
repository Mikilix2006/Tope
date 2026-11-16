"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { Alert, Button, Field } from "@/components/ui";
import type { RegisterResult } from "@/server/auth/register";
import { registerAction } from "./actions";

type State = (RegisterResult & { message?: string }) | null;

export function RegisterForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState(async (_prev: State, form: FormData): Promise<State> => {
    try {
      const result = await registerAction(form);
      if (!result.ok) return result;
      const res = await signIn("credentials", { email: form.get("email"), password: form.get("password"), redirect: false });
      // Cuenta creada pero sin sesión (raro): que entre a mano.
      router.replace(res?.ok ? "/alta" : "/acceso");
      router.refresh();
      return result;
    } catch {
      return { ok: false, errors: {}, message: "No se ha podido crear la cuenta. Vuelve a probar en un momento." };
    }
  }, null);

  const errors = state && !state.ok ? state.errors : {};

  return (
    <form action={action} className="flex flex-col gap-5">
      {state?.message && <Alert>{state.message}</Alert>}
      <Field label="Nombre" name="name" autoComplete="given-name" required minLength={2} maxLength={60} error={errors.name} />
      <Field label="Email" name="email" type="email" autoComplete="email" inputMode="email" required error={errors.email} />
      <Field
        label="Contraseña"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        maxLength={128}
        hint="Mínimo 8 caracteres."
        error={errors.password}
      />
      <Button type="submit" disabled={pending}>
        {pending ? "Creando cuenta…" : "Crear cuenta"}
      </Button>
    </form>
  );
}
