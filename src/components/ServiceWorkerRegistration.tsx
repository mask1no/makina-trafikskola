"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js").catch(() => {
      // iOS can refuse or drop the worker. Booking and login stay on the network.
    });
  }, []);

  return null;
}
