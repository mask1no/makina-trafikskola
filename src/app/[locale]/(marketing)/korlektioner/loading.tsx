function Pulse({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-md bg-border ${className}`} />;
}

export default function LessonsLoading() {
  return (
    <div className="section-shell" aria-hidden="true">
      <div className="site-container">
        <Pulse className="h-10 w-64" />
        <Pulse className="mt-4 h-6 w-full max-w-xl" />
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Pulse className="h-80" />
          <Pulse className="h-80" />
          <Pulse className="h-80" />
        </div>
      </div>
    </div>
  );
}
