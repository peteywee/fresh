const CACHE_NAME = 'v1';
const PRECACHE_URLS = [
  '/', 
  '/login', 
  '/register', 
  '/forgot-password', 
  '/manifest.json',
  '/_next/static/css/',
  '/_next/static/js/',
];

// API endpoints that should be network-first
const API_ENDPOINTS = [
  '/api/session',
  '/api/onboarding',
  '/api/roles',
  '/api/projects'
];

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
  const url = new URL(e.request.url);
  
  // Network-first for API calls
  if (API_ENDPOINTS.some(endpoint => url.pathname.startsWith(endpoint))) {
    e.respondWith(
      fetch(e.request)
        .then(response => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(e.request, responseClone));
          }
          return response;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }
  
  // Cache-first for static assets
  if (url.pathname.startsWith('/_next/static/')) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        return cached || fetch(e.request).then(response => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, responseClone));
          return response;
        });
      })
    );
    return;
  }
  
  // Stale-while-revalidate for everything else
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
