import { Pulse } from "@/components/Pulse";

export function PageSkeleton() {
  return (
    <div className="site-container max-w-5xl py-8 sm:py-12" aria-hidden="true">
      <Pulse className="h-4 w-24" />
      <Pulse className="mt-4 h-10 w-2/3" />
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <Pulse key={index} className="h-24 w-full" />
        ))}
      </div>
    </div>
  );
}
