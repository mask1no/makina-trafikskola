import { Pulse } from "@/components/Pulse";

export default function AdminLoading() {
  return (
    <section aria-hidden="true">
      <Pulse className="h-4 w-32" />
      <Pulse className="mt-3 h-8 w-56" />
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Pulse key={index} className="h-40 w-full rounded-md" />
        ))}
      </div>
    </section>
  );
}
