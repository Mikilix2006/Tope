import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserId } from "@/server/auth/session";

const linkBase = "flex min-h-12 items-center justify-center rounded-xl px-5 text-lg font-semibold";

export default async function Home() {
  if (await getUserId()) redirect("/panel");
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-4 py-10">
      <div className="flex flex-col gap-3">
        <h1 className="text-6xl font-black tracking-tight text-accent-strong">Tope</h1>
        <p className="text-2xl font-semibold">Tus rutinas, tus marcas y tu progreso.</p>
        <p className="text-muted">Calistenia, CrossFit y fuerza en un solo sitio. Registra cada serie en pocos toques y mira cómo mejoras.</p>
      </div>
      <div className="flex flex-col gap-3">
        <Link href="/registro" className={`${linkBase} bg-accent text-accent-text hover:brightness-110`}>
          Crear cuenta
        </Link>
        <Link href="/acceso" className={`${linkBase} border border-border hover:bg-surface`}>
          Entrar o probar la demo
        </Link>
      </div>
    </main>
  );
}
