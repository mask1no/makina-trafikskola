import { Pulse } from "@/components/Pulse";

export default function TeacherPortalLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8" aria-hidden="true">
      <Pulse className="h-8 w-56" />
      <div className="mt-8 grid gap-4">
        <Pulse className="h-28 w-full" />
        <Pulse className="h-28 w-full" />
        <Pulse className="h-28 w-full" />
      </div>
    </div>
  );
}
