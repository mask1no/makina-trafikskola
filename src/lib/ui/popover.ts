export const POPOVER_EVENT = "makina:popover";

export function announcePopover(id: string) {
  if (typeof document === "undefined") return;
  document.dispatchEvent(new CustomEvent(POPOVER_EVENT, { detail: id }));
}

export function subscribePopover(id: string, close: () => void) {
  function onEvent(event: Event) {
    if ((event as CustomEvent<string>).detail === id) return;
    close();
  }
  document.addEventListener(POPOVER_EVENT, onEvent);
  return () => document.removeEventListener(POPOVER_EVENT, onEvent);
}
