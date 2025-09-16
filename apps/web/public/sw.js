const CACHE_NAME = 'fresh-v2';
const STATIC_CACHE = 'fresh-static-v2';
const DYNAMIC_CACHE = 'fresh-dynamic-v2';

// Resources to cache on install
const STATIC_ASSETS = [
  '/',
  '/login',
  '/register',
  '/onboarding',
  '/dashboard',
  '/team',
  '/calendar',
  '/manifest.json',
  '/favicon.ico',
];

// API routes to cache with stale-while-revalidate
const STALE_WHILE_REVALIDATE_PATTERNS = [
  /^\/api\/dashboard\/stats/,
  /^\/api\/team\/bulk-roles/,
  /^\/api\/schedules/,
];

// Network-first patterns for critical data
const NETWORK_FIRST_PATTERNS = [
  /^\/api\/session/,
  /^\/api\/onboarding/,
  /^\/api\/register/,
  /^\/api\/login/,
];

// Cache-first patterns for static assets
const CACHE_FIRST_PATTERNS = [
  /\/_next\/static/,
  /\.(?:css|js|png|jpg|jpeg|svg|gif|webp|ico|woff|woff2)$/,
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('[SW] Installing v2');
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating v2');
  event.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (!cacheName.includes('v2')) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - implement smart caching
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = request.url;

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip Chrome extension requests
  if (url.includes('chrome-extension:')) return;

  // Determine strategy and respond
  if (NETWORK_FIRST_PATTERNS.some(pattern => pattern.test(url))) {
    event.respondWith(networkFirst(request));
  } else if (CACHE_FIRST_PATTERNS.some(pattern => pattern.test(url))) {
    event.respondWith(cacheFirst(request));
  } else if (STALE_WHILE_REVALIDATE_PATTERNS.some(pattern => pattern.test(url))) {
    event.respondWith(staleWhileRevalidate(request));
  } else {
    event.respondWith(networkWithFallback(request));
  }
});

// Network first - for critical, changing data
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

// Cache first - for static assets
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

// Stale while revalidate - for dynamic content
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  return cached || (await fetchPromise) || new Response('Offline', { status: 503 });
}

// Network with fallback - default strategy
async function networkWithFallback(request) {
  try {
    const response = await fetch(request);
    // Cache successful responses
    if (response.ok && request.url.includes('/api/')) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || caches.match('/') || new Response('Offline', { status: 503 });
  }
}
