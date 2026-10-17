const CACHE = "makina-shell-v2";
const OFFLINE_URL = "/sv/offline";
const LOCALES = ["sv", "en", "ti", "ar", "am", "so"];
const OFFLINE_URLS = LOCALES.map((locale) => `/${locale}/offline`);

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(OFFLINE_URLS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.mode !== "navigate") return;
  if (url.pathname.startsWith("/api/") || url.pathname.includes("/logga-in")) return;
  event.respondWith(
    fetch(event.request).catch(async () => {
      const locale = url.pathname.split("/")[1];
      const supported = LOCALES.includes(locale) ? locale : "sv";
      return (
        (await caches.match(`/${supported}/offline`)) ??
        (await caches.match(OFFLINE_URL))
      );
    }),
  );
});
