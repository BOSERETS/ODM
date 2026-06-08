var CACHE = 'odm-v3';
var URLS = [
  '/ODM/',
  '/ODM/index.html',
  '/ODM/manifest.json',
  '/ODM/sw.js'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(c) {
      return c.addAll(URLS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE; })
            .map(function(k){ return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  // On ne gère que les requêtes GET vers notre domaine
  if (e.request.method !== 'GET') return;
  
  e.respondWith(
    caches.open(CACHE).then(function(cache) {
      return cache.match(e.request).then(function(cached) {
        if (cached) {
          // Servi depuis le cache — on tente quand même de mettre à jour en arrière-plan
          fetch(e.request).then(function(response) {
            if (response && response.status === 200) cache.put(e.request, response.clone());
          }).catch(function(){});
          return cached;
        }
        // Pas en cache — on tente le réseau
        return fetch(e.request).then(function(response) {
          if (response && response.status === 200) cache.put(e.request, response.clone());
          return response;
        }).catch(function() {
          // Hors réseau et pas en cache : on renvoie index.html comme fallback
          return cache.match('/ODM/index.html') || cache.match('/ODM/');
        });
      });
    })
  );
});
