const CACHE_NAME = 'pixelpad-v1';

// Install event: Force the new service worker to activate immediately
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

// Activate event: Claim control of the app and clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        clients.claim().then(() => {
            return caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            return caches.delete(cacheName);
                        }
                    })
                );
            });
        })
    );
});

// Fetch event: NETWORK FIRST strategy
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                // If the network request is successful, clone the response and update the cache
                return caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                });
            })
            .catch(() => {
                // If the network fails (offline), fall back to the cache
                return caches.match(event.request);
            })
    );
});
