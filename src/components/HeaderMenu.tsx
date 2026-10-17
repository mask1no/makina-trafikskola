"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";

import { announcePopover, subscribePopover } from "@/lib/ui/popover";
import { lockScroll } from "@/lib/ui/scroll-lock";

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

type PanelBox = {
  top: number;
  left: number | null;
  right: number | null;
};

export function HeaderMenu({
  label,
  closeLabel,
  trigger,
  children,
  className = "",
}: {
  label: string;
  closeLabel: string;
  trigger: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const panelId = useId();
  const pathname = usePathname();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [box, setBox] = useState<PanelBox | null>(null);
  const [mounted, setMounted] = useState(false);

  function place() {
    const node = triggerRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const rtl = document.documentElement.dir === "rtl";
    setBox({
      top: rect.bottom + 8,
      left: rtl ? rect.left : null,
      right: rtl ? null : window.innerWidth - rect.right,
    });
  }

  function close({ restoreFocus = false } = {}) {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }

  function openMenu() {
    announcePopover("header");
    place();
    setOpen(true);
  }

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => subscribePopover("header", () => setOpen(false)), []);

  useEffect(() => {
    if (!open) return;
    place();
    const header = document.querySelector<HTMLElement>("[data-site-header]");
    if (header) header.style.zIndex = "60";
    const unlock = lockScroll();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close({ restoreFocus: true });
        return;
      }
      if (event.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const items = [...panel.querySelectorAll<HTMLElement>(focusableSelector)];
      if (!items.length) {
        event.preventDefault();
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

    function onResize() {
      place();
    }

    const first = panelRef.current?.querySelector<HTMLElement>(focusableSelector);
    first?.focus();
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
    return () => {
      if (header) header.style.zIndex = "";
      unlock();
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => (open ? close() : openMenu())}
        className="outline-none ring-offset-surface focus-visible:ring-2 focus-visible:ring-accent"
      >
        {trigger}
      </button>
      {mounted && open && box
        ? createPortal(
            <>
              <button
                type="button"
                aria-label={closeLabel}
                onClick={() => close({ restoreFocus: true })}
                className="fixed inset-0 z-50 bg-[color-mix(in_srgb,var(--surface)_50%,transparent)] lg:bg-transparent"
              />
              <div
                ref={panelRef}
                id={panelId}
                role="menu"
                aria-label={label}
                className="fixed z-[70] max-h-[min(70vh,calc(100dvh-5rem))] w-[min(20rem,calc(100vw-2rem))] overflow-y-auto rounded-md border border-border bg-card p-2 text-small text-ink shadow-float"
                style={{
                  top: box.top,
                  left: box.left ?? undefined,
                  right: box.right ?? undefined,
                }}
              >
                {children}
              </div>
            </>,
            document.body,
          )
        : null}
    </div>
  );
}
