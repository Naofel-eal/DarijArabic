/* ============================================================
   sw.js — Service Worker pour usage hors-ligne
   Stratégie : cache-first sur les fichiers de l'app (app shell).
   ============================================================ */
const CACHE = 'darija-arabe-v1';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/db.js',
  './js/app.js',
  './manifest.webmanifest',
  './icons/icon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((resp) => {
          // Met en cache les nouvelles ressources de même origine
          if (resp.ok && new URL(request.url).origin === self.location.origin) {
            const copy = resp.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return resp;
        })
        .catch(() => {
          // Repli : page d'accueil pour les navigations hors-ligne
          if (request.mode === 'navigate') return caches.match('./index.html');
        });
    })
  );
});
