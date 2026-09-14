function Pulse({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-sm bg-border ${className}`} />;
}

export default function LarareLoading() {
  return (
    <div className="section-shell" aria-hidden="true">
      <div className="site-container">
        <Pulse className="h-4 w-28" />
        <Pulse className="mt-4 h-10 w-1/2" />
        <Pulse className="mt-4 h-16 w-full max-w-xl" />
        <div className="mt-10 flex flex-wrap gap-2">
          {Array.from({ length: 6 }, (_, index) => (
            <Pulse key={index} className="h-11 w-28" />
          ))}
        </div>
        <Pulse className="mt-8 h-[28rem] w-full rounded-md" />
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="flex gap-4 border-b border-border pb-6">
              <Pulse className="size-20 shrink-0 rounded-full sm:size-24" />
              <div className="min-w-0 flex-1">
                <Pulse className="h-6 w-40" />
                <Pulse className="mt-3 h-4 w-28" />
                <Pulse className="mt-4 h-4 w-56" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
