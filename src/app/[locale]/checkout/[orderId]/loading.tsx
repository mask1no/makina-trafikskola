function Pulse({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-md bg-border ${className}`} />;
}

export default function CheckoutLoading() {
  return (
    <div className="section-shell" aria-hidden="true">
      <div className="site-container max-w-xl">
        <Pulse className="h-8 w-48" />
        <Pulse className="mt-6 h-64 w-full" />
      </div>
    </div>
  );
}
