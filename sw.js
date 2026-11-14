const CACHE_NAME = "level-up-yourself-shell-v1";
const APP_PREFIX = "level-up-yourself-shell-";

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.add("./");
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter(name => name.startsWith(APP_PREFIX) && name !== CACHE_NAME)
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const scopeUrl = new URL(self.registration.scope);
  if (!url.pathname.startsWith(scopeUrl.pathname)) return;

  event.respondWith((async () => {
    const cached = await caches.match(request);
    try {
      const response = await fetch(request);
      if (response && response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      if (cached) return cached;
      if (request.mode === "navigate") {
        return (await caches.match(new URL("./", self.registration.scope))) || Response.error();
      }
      return Response.error();
    }
  })());
});
