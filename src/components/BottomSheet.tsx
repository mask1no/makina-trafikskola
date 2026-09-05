import type { ReactNode } from "react";

type BottomSheetProps = {
  title: string;
  children: ReactNode;
  open?: boolean;
};

export function BottomSheet({ title, children, open = true }: BottomSheetProps) {
  if (!open) return null;

  return (
    <section
      role="dialog"
      aria-modal="true"
      aria-labelledby="bottom-sheet-title"
      className="fixed bottom-0 start-0 end-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-lg border border-border bg-card p-5 shadow-2xl md:start-auto md:end-6 md:w-[28rem] md:rounded-lg"
    >
      <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-border md:hidden" />
      <h2 id="bottom-sheet-title" className="text-xl font-bold">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
