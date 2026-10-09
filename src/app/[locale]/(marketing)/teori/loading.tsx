import { Pulse } from "@/components/Pulse";

export default function TeoriLoading() {
  return (
    <div className="section-shell" aria-hidden="true">
      <div className="site-container max-w-6xl">
        <Pulse className="h-4 w-24" />
        <Pulse className="mt-4 h-10 w-1/2" />
        <Pulse className="mt-4 h-16 max-w-2xl" />
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 8 }, (_, index) => (
            <Pulse key={index} className="min-h-44 w-full rounded-md" />
          ))}
        </div>
      </div>
    </div>
  );
}
