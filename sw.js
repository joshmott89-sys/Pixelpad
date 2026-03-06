const CACHE = 'pixelpad-v1';

const PRECACHE = [
  './index.html',
  './manifest.json',
  './icon.svg',
  'https://cdnjs.cloudflare.com/ajax/libs/ace/1.32.3/ace.js',
  'https://cdnjs.cloudflare.com/ajax/libs/ace/1.32.3/theme-monokai.js',
  'https://cdnjs.cloudflare.com/ajax/libs/ace/1.32.3/mode-python.js',
  'https://cdnjs.cloudflare.com/ajax/libs/ace/1.32.3/mode-html.js',
  'https://cdnjs.cloudflare.com/ajax/libs/ace/1.32.3/mode-javascript.js',
  'https://cdnjs.cloudflare.com/ajax/libs/ace/1.32.3/mode-css.js',
  'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap'
];

// Install — cache all core assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      // Cache what we can, don't fail install if CDN assets are unavailable
      return Promise.allSettled(
        PRECACHE.map(url => cache.add(url).catch(() => {}))
      );
    }).then(() => self.skipWaiting())
  );
});

// Activate — clean up old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — cache-first for same-origin, network-first for CDN
self.addEventListener('fetch', e => {
  // Skip non-GET and chrome-extension requests
  if (e.request.method !== 'GET') return;
  if (e.request.url.startsWith('chrome-extension')) return;
  // Skip Pyodide — too large to cache (hundreds of MB)
  if (e.request.url.includes('pyodide')) return;
  // Skip Gemini/Claude API calls
  if (e.request.url.includes('googleapis.com') || e.request.url.includes('anthropic.com')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        // Cache valid responses
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback for navigation requests
        if (e.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
