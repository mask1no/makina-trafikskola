"use client";

import { useEffect } from "react";

/**
 * Syncs CSS vars from visualViewport so sticky CTAs, bottom sheets and the
 * focused field stay above the soft keyboard and mobile chrome.
 */
export function VisualViewportSync() {
  useEffect(() => {
    const root = document.documentElement;
    const vv = window.visualViewport;
    if (!vv) {
      root.style.setProperty(
        "--sticky-bottom",
        "calc(var(--tab-bar-height) + var(--safe-bottom))",
      );
      return;
    }

    let frame = 0;

    function publish() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const keyboard = Math.max(
          0,
          Math.round(window.innerHeight - vv!.height - vv!.offsetTop),
        );
        root.style.setProperty("--keyboard-inset", `${keyboard}px`);
        root.style.setProperty("--vv-height", `${Math.round(vv!.height)}px`);
        root.style.setProperty("--vv-offset-top", `${Math.round(vv!.offsetTop)}px`);
        // When the keyboard is open it covers the tab bar; dock to the keyboard.
        root.style.setProperty(
          "--sticky-bottom",
          keyboard > 40
            ? `${keyboard}px`
            : "calc(var(--tab-bar-height) + var(--safe-bottom))",
        );
        root.style.setProperty(
          "scroll-padding-bottom",
          keyboard > 40
            ? `${keyboard + 16}px`
            : "calc(var(--tab-bar-height) + var(--safe-bottom))",
        );
      });
    }

    function onFocusIn(event: FocusEvent) {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const tag = target.tagName;
      if (tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT" && !target.isContentEditable) {
        return;
      }
      window.setTimeout(() => {
        target.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
      }, 280);
    }

    publish();
    vv.addEventListener("resize", publish);
    vv.addEventListener("scroll", publish);
    window.addEventListener("focusin", onFocusIn);
    return () => {
      cancelAnimationFrame(frame);
      vv.removeEventListener("resize", publish);
      vv.removeEventListener("scroll", publish);
      window.removeEventListener("focusin", onFocusIn);
      root.style.removeProperty("--keyboard-inset");
      root.style.removeProperty("--vv-height");
      root.style.removeProperty("--vv-offset-top");
      root.style.removeProperty("--sticky-bottom");
    };
  }, []);

  return null;
}
