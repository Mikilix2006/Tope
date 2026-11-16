import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function RegistroPage() {
  return (
    <>
      <h1 className="text-3xl font-bold">Crear cuenta</h1>
      <RegisterForm />
      <p className="text-muted">
        ¿Ya tienes cuenta?{" "}
        <Link href="/acceso" className="font-semibold text-accent-strong underline">
          Entrar
        </Link>
      </p>
    </>
  );
}
