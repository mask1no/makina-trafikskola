import { Pulse } from "@/components/Pulse";

export default function ProductLoading() {
  return (
    <div className="section-shell" aria-hidden="true">
      <div className="site-container grid gap-8 lg:grid-cols-[minmax(0,1fr)_23rem]">
        <div>
          <Pulse className="h-72 w-full" />
          <Pulse className="mt-8 h-12 w-2/3" />
        </div>
        <Pulse className="h-80 w-full" />
      </div>
    </div>
  );
}
