const CACHE = "makina-shell-v1";
const OFFLINE_URL = "/sv/offline";
const OFFLINE_URLS = ["sv", "en", "ti", "ar", "so"].map(
  (locale) => `/${locale}/offline`,
);

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
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    fetch(event.request).catch(async () => {
      const locale = new URL(event.request.url).pathname.split("/")[1];
      const supported = ["sv", "en", "ti", "ar", "so"].includes(locale)
        ? locale
        : "sv";
      return (
        (await caches.match(`/${supported}/offline`)) ??
        (await caches.match(OFFLINE_URL))
      );
    }),
  );
});
