// Firebase messaging service worker
// Loads firebase compat libraries, then lazily fetches public config from
// a runtime endpoint to avoid hard-coding secrets / keys in the worker file.
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

let messaging = null;
let initPromise = null;

async function ensureInitialized() {
  if (messaging) return messaging;
  if (!initPromise) {
    initPromise = fetch('/api/public/firebase-config')
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Config fetch failed')))
      .then(cfg => {
        if (!cfg || !cfg.apiKey) throw new Error('Invalid Firebase config');
        if (!firebase.apps.length) {
          firebase.initializeApp(cfg);
        }
        messaging = firebase.messaging();
        return messaging;
      })
      .catch(err => {
        console.error('[firebase-messaging-sw] init error', err);
        return null;
      });
  }
  return initPromise;
}

// Background message handler registration (waits for init)
self.addEventListener('push', (event) => {
  event.waitUntil((async () => {
    const m = await ensureInitialized();
    // If Firebase messaging is initialized, it will also trigger its own handlers
    // This manual push listener is a fallback for custom payloads.
  })());
});

// Firebase native background messages
ensureInitialized().then(m => {
  if (!m) return;
  m.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw] background message', payload);
    const notificationTitle = payload.notification?.title || 'New message';
    const notificationOptions = {
      body: payload.notification?.body || 'You have a new message',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      tag: 'team-chat',
      data: {
        click_action: '/team',
        ...payload.data
      }
    };
    self.registration.showNotification(notificationTitle, notificationOptions);
  });
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.click_action || '/team'));
});