function Pulse({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-sm bg-border ${className}`} />;
}

export default function StudentLoading() {
  return (
    <section aria-hidden="true">
      <Pulse className="h-8 w-48" />
      <div className="mt-8 grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
        <Pulse className="h-56 w-full rounded-lg" />
        <div className="grid gap-4">
          <Pulse className="h-32 w-full rounded-md" />
          <Pulse className="h-32 w-full rounded-md" />
        </div>
      </div>
    </section>
  );
}
