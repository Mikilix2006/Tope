"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { Alert, Button, Field } from "@/components/ui";
import { DEMO_USER } from "@/config/demo";

async function login(email: string, password: string): Promise<string | null> {
  try {
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.ok && !res.error) return null;
    return res?.error === "DEMASIADOS_INTENTOS"
      ? "Demasiados intentos fallidos. Espera 15 minutos y vuelve a probar."
      : "Email o contraseña incorrectos.";
  } catch {
    return "No se ha podido conectar. Revisa tu conexión y vuelve a probar.";
  }
}

export function LoginForm() {
  const router = useRouter();
  const [error, action, pending] = useActionState(async (_prev: string | null, form: FormData) => {
    const demo = form.get("demo") === "1";
    const err = demo
      ? await login(DEMO_USER.email, DEMO_USER.password)
      : await login(String(form.get("email") ?? ""), String(form.get("password") ?? ""));
    if (!err) {
      router.replace("/panel");
      router.refresh();
    }
    return err;
  }, null);

  return (
    <form action={action} className="flex flex-col gap-5">
      {error && <Alert>{error}</Alert>}
      <Field label="Email" name="email" type="email" autoComplete="email" inputMode="email" />
      <Field label="Contraseña" name="password" type="password" autoComplete="current-password" />
      <Button type="submit" disabled={pending}>
        {pending ? "Entrando…" : "Entrar"}
      </Button>
      <Button type="submit" name="demo" value="1" variant="ghost" disabled={pending} formNoValidate>
        Probar la demo
      </Button>
    </form>
  );
}
