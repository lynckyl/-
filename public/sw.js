const CACHE_NAME = 'yuedu-v1.0.1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&display=swap',
  'https://picsum.photos/seed/reader/192/192'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Skip external scripts, webdav api endpoints, non-GET requests to prevent CORS/proxy issues
  if (
    event.request.method !== 'GET' || 
    !event.request.url.startsWith(self.location.origin) ||
    event.request.url.includes('/api/')
  ) {
    return;
  }

  event.respondWith(
    // Network-first strategy for live updates & dev friendliness
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Fallback to cache if network is completely offline/unreachable
        return caches.match(event.request);
      })
  );
});
