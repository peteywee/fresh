self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open('fresh-v1');
    await cache.addAll([
      '/',
      '/login',
      '/register', 
      '/onboarding',
      '/dashboard',
      '/favicon.ico',
      '/manifest.webmanifest'
    ]);
  })());
});

self.addEventListener('fetch', (event) => {
  event.respondWith((async () => {
    try {
      return await fetch(event.request);
    } catch {
      const cache = await caches.open('fresh-v1');
      const match = await cache.match(event.request, { ignoreSearch: true });
      if (match) return match;
      return caches.match('/');
    }
  })());
});
