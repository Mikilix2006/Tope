"use client";

import { Button } from "@/components/ui";

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Algo ha fallado</h1>
      <p className="text-muted">No se han podido cargar tus datos. Vuelve a probar en un momento.</p>
      <Button onClick={reset}>Reintentar</Button>
    </div>
  );
}
