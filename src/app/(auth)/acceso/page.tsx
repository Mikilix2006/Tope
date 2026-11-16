import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

export default function AccesoPage() {
  return (
    <>
      <h1 className="text-3xl font-bold">Entrar</h1>
      <LoginForm />
      <p className="text-muted">
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className="font-semibold text-accent-strong underline">
          Crear cuenta
        </Link>
      </p>
    </>
  );
}
