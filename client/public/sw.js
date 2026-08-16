// Deliberately minimal: this does NOT cache the API or product data (which
// changes weekly) — it only shows a friendly offline page instead of the
// browser's default error when a navigation fails with no network.
const OFFLINE_URL = "/offline.html";
const CACHE_NAME = "nsp-club-offline-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_URL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    fetch(event.request).catch(() => caches.match(OFFLINE_URL))
  );
});
