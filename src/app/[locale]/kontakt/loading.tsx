function Pulse({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-md bg-border ${className}`} />;
}

export default function ContactLoading() {
  return (
    <div className="section-shell" aria-hidden="true">
      <div className="site-container grid gap-8 lg:grid-cols-2">
        <Pulse className="h-96" />
        <Pulse className="h-96" />
      </div>
    </div>
  );
}
