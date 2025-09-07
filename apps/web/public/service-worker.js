const CACHE_NAME = 'v1';
const PRECACHE_URLS = ['/', '/login', '/register', '/forgot-password', '/manifest.json'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Stale-while-revalidate: respond from cache, update cache in background
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const networkFetch = fetch(e.request)
        .then((resp) => {
          if (resp && resp.ok) {
            const respClone = resp.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, respClone));
          }
          return resp;
        })
        .catch(() => null);

      return cached || networkFetch;
    })
  );
});
