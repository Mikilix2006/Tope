import Link from "next/link";

export default function AppNotFound() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">No encontrado</h1>
      <p className="text-muted">Esta página no existe o ya no está disponible.</p>
      <Link href="/panel" className="flex min-h-12 items-center justify-center rounded-xl bg-accent px-5 text-lg font-semibold text-accent-text hover:brightness-110">
        Ir al panel
      </Link>
    </div>
  );
}
