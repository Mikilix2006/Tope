export default function Loading() {
  return (
    <div role="status" className="flex flex-col gap-4" aria-label="Cargando">
      <div className="h-9 w-2/3 animate-pulse rounded-lg bg-surface" />
      <div className="h-24 animate-pulse rounded-xl bg-surface" />
      <div className="h-24 animate-pulse rounded-xl bg-surface" />
    </div>
  );
}
