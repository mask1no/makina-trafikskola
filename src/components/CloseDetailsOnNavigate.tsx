"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function closeHeaderMenus() {
  document
    .querySelectorAll<HTMLDetailsElement>("details[data-header-menu]")
    .forEach((menu) => menu.removeAttribute("open"));
}

export function CloseDetailsOnNavigate() {
  const pathname = usePathname();

  useEffect(() => {
    closeHeaderMenus();
  }, [pathname]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeHeaderMenus();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return null;
}
