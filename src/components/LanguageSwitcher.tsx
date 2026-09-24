"use client";

import {
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import { useLocale, useTranslations } from "next-intl";

import { BottomSheet } from "@/components/BottomSheet";
import { usePathname, useRouter } from "@/i18n/navigation";
import { locales, type Locale } from "@/i18n/routing";

export function LanguageSwitcher() {
  const currentLocale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("language");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(
    Math.max(0, locales.indexOf(currentLocale)),
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const desktopItemsRef = useRef<Array<HTMLButtonElement | null>>([]);
  const mobileItemsRef = useRef<Array<HTMLButtonElement | null>>([]);
  const previousPathRef = useRef(pathname);

  function closeMenu({ restoreFocus = false } = {}) {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }

  function openMenu() {
    setActiveIndex(Math.max(0, locales.indexOf(currentLocale)));
    setOpen(true);
  }

  function chooseLocale(locale: Locale) {
    setOpen(false);
    router.replace(pathname, { locale });
  }

  function moveFocus(
    direction: 1 | -1,
    items: Array<HTMLButtonElement | null>,
  ) {
    const next = (activeIndex + direction + locales.length) % locales.length;
    setActiveIndex(next);
    items[next]?.focus();
  }

  useEffect(() => {
    if (!open) return;
    const desktop = window.matchMedia("(min-width: 1024px)").matches;
    const items = desktop ? desktopItemsRef.current : mobileItemsRef.current;
    items[activeIndex]?.focus();
  }, [activeIndex, open]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (
        rootRef.current &&
        !rootRef.current.contains(event.target as Node)
      ) {
        closeMenu();
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && open) {
        event.preventDefault();
        closeMenu({ restoreFocus: true });
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  useEffect(() => {
    if (previousPathRef.current === pathname) return;
    previousPathRef.current = pathname;
    // Route changes are an external navigation event that closes the menu.
    setOpen(false);
  }, [pathname]);

  function options(
    itemsRef: MutableRefObject<Array<HTMLButtonElement | null>>,
  ) {
    return (
      <div
        role="menu"
        aria-label={t("label")}
        className="grid gap-1"
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            moveFocus(
              event.key === "ArrowDown" ? 1 : -1,
              itemsRef.current,
            );
          }
          if (event.key === "Enter") {
            event.preventDefault();
            chooseLocale(locales[activeIndex]);
          }
        }}
      >
        {locales.map((locale, index) => (
          <button
            className={`flex min-h-11 items-center justify-between gap-6 whitespace-nowrap rounded-sm px-3 text-start text-sm font-semibold transition hover:bg-card-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              locale === "ar"
                ? "font-[family-name:var(--font-arabic)]"
                : locale === "ti"
                  ? "font-[family-name:var(--font-ethiopic)]"
                  : ""
            }`}
            key={locale}
            type="button"
            role="menuitem"
            aria-current={currentLocale === locale ? "true" : undefined}
            ref={(element) => {
              itemsRef.current[index] = element;
            }}
            onFocus={() => setActiveIndex(index)}
            onClick={() => chooseLocale(locale)}
          >
            <span lang={locale}>{t(locale)}</span>
            <span
              aria-hidden="true"
              className={currentLocale === locale ? "text-success" : "invisible"}
            >
              ✓
            </span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={(event) => {
          if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
            event.preventDefault();
            openMenu();
          }
        }}
        className="inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-sm border border-surface-soft bg-surface-raised px-3 text-sm font-semibold text-ink-inverse outline-none transition hover:border-ink-muted focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-4 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.2 2.5 3.3 5.5 3.3 9S14.2 18.5 12 21M12 3C9.8 5.5 8.7 8.5 8.7 12S9.8 18.5 12 21" />
        </svg>
        <span className="lg:hidden">{currentLocale.toUpperCase()}</span>
        <span lang={currentLocale} className="hidden lg:inline">
          {t(currentLocale)}
        </span>
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          className={`size-3 shrink-0 transition ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
        >
          <path d="m3 6 5 5 5-5" />
        </svg>
      </button>

      {open ? (
        <>
          <div className="absolute end-0 top-[calc(100%+0.5rem)] z-50 hidden min-w-52 rounded-md border border-border bg-card p-2 text-ink shadow-float lg:block">
            {options(desktopItemsRef)}
          </div>
          <div
            aria-hidden="true"
            className="fixed inset-0 z-40 bg-surface/60 lg:hidden"
            onClick={() => closeMenu()}
          />
          <div className="lg:hidden">
            <BottomSheet title={t("label")}>
              {options(mobileItemsRef)}
            </BottomSheet>
          </div>
        </>
      ) : null}
    </div>
  );
}
