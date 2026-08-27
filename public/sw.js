// FastBite PWA Service Worker
const CACHE_NAME = 'fastbite-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/icon-192x192.png',
        '/icon-512x512.png',
        '/manifest.json'
      ]).catch(() => {
        // Fallback gracefully if any asset fails to cache
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Let network handle dynamic API / Firestore requests
  if (event.request.method !== 'GET' || event.request.url.includes('firestore') || event.request.url.includes('googleapis')) {
    return;
  }
  
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
