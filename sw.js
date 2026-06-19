/* ============================================================
   sw.js — Service Worker (offline + mises à jour propres)

   - VERSION est remplacée à chaque déploiement par la CI :
     le fichier change donc d'octet → le navigateur détecte
     la nouvelle version et propose de recharger.
   - On NE force PAS skipWaiting automatiquement : le nouveau
     worker attend que l'utilisateur clique « Recharger »
     (bandeau côté app), ce qui évite un rechargement surprise.
   - Stratégie réseau : stale-while-revalidate (réponse rapide
     depuis le cache, mise à jour en arrière-plan).
   ============================================================ */
const VERSION = '__BUILD_VERSION__';
const CACHE = `darija-arabe-${VERSION}`;
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
  // Pré-cache la coquille de l'app. Pas de skipWaiting : on attend l'utilisateur.
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('activate', (event) => {
  // Supprime les anciens caches versionnés.
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
});

// L'app envoie ce message quand l'utilisateur clique « Recharger ».
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE).then((cache) =>
      cache.match(request).then((cached) => {
        const network = fetch(request)
          .then((resp) => {
            if (resp && resp.ok) cache.put(request, resp.clone());
            return resp;
          })
          .catch(() => cached || (request.mode === 'navigate' ? cache.match('./index.html') : undefined));
        // Réponse rapide depuis le cache si dispo, sinon on attend le réseau.
        return cached || network;
      })
    )
  );
});
