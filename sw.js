// sw.js - Service Worker
const CACHE_NAME = 'askbot-v1.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/chat.html',
  '/styles.css',
  '/script.js',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
