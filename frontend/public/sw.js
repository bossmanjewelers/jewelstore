const CACHE_NAME = 'jewelstore-v1';
const STATIC_ASSETS = ['/', '/index.html', '/manifest.json'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(STATIC_ASSETS))); self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.startsWith('/api/')) { e.respondWith(fetch(e.request).then((r) => { caches.open(CACHE_NAME).then((c) => c.put(e.request, r.clone())); return r; }).catch(() => caches.match(e.request))); return; }
  e.respondWith(caches.match(e.request).then((cached) => cached || fetch(e.request).then((r) => { if (r.ok) caches.open(CACHE_NAME).then((c) => c.put(e.request, r.clone())); return r; })).catch(() => caches.match('/index.html')));
});
