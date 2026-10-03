"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

type BottomSheetProps = {
  title: string;
  children: ReactNode;
  open?: boolean;
  onClose: () => void;
};

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export function BottomSheet({
  title,
  children,
  open = true,
  onClose,
}: BottomSheetProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;

    const returnFocus = document.activeElement as HTMLElement | null;
    const body = document.body;
    const previousOverflow = body.style.overflow;
    const previousPaddingInlineEnd = body.style.paddingInlineEnd;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const currentPadding = Number.parseFloat(
      window.getComputedStyle(body).paddingInlineEnd,
    ) || 0;
    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      body.style.paddingInlineEnd = `${currentPadding + scrollbarWidth}px`;
    }

    const siblings = [...body.children].filter(
      (element): element is HTMLElement =>
        element instanceof HTMLElement &&
        !element.hasAttribute("data-bottom-sheet-layer"),
    );
    const previousInert = siblings.map((element) => [element, element.inert] as const);
    for (const element of siblings) element.inert = true;

    const focusable = [...dialog.querySelectorAll<HTMLElement>(focusableSelector)];
    (focusable[0] ?? dialog).focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const items = [...dialog!.querySelectorAll<HTMLElement>(focusableSelector)];
      if (!items.length) {
        event.preventDefault();
        dialog!.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      for (const [element, inert] of previousInert) element.inert = inert;
      body.style.overflow = previousOverflow;
      body.style.paddingInlineEnd = previousPaddingInlineEnd;
      if (returnFocus?.isConnected) returnFocus.focus();
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <>
      <button
        type="button"
        data-bottom-sheet-layer=""
        aria-label={title}
        onClick={() => onCloseRef.current()}
        className="fixed inset-0 z-40 bg-surface/60"
      />
      <section
        data-bottom-sheet-layer=""
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="fixed bottom-0 start-0 end-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-lg border border-border bg-card p-5 shadow-2xl md:start-auto md:end-6 md:w-[28rem] md:rounded-lg"
      >
        <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-border md:hidden" />
        <h2 id={titleId} className="text-xl font-bold">
          {title}
        </h2>
        <div className="mt-4">{children}</div>
      </section>
    </>,
    document.body,
  );
}
