// ── Next Iteration Local AI Help — Service Worker ─────────────────────────
// HTML: network first (changes cascade immediately)
// Static assets: cache first (fast repeat loads)

const CACHE_NAME = 'ni-local-v2';

const PRECACHE_URLS = [
  '/',
  '/services/',
  '/privacy/',
  '/assets/site.css',
  '/assets/favicon.svg',
  '/assets/av.png',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  const isStaticAsset = /\.(css|js|png|jpg|jpeg|svg|ico|woff2?)$/.test(url.pathname);

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then(cached =>
        cached || fetch(request).then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return response;
        })
      )
    );
  } else {
    event.respondWith(
      fetch(request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
  }
});
