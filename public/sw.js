// The name of the cache for our app shell and assets.
const CACHE_NAME = 'hublancer-cache-v1';

// The URLs of the files we want to cache.
// This includes the main page, critical CSS, and key JavaScript files.
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  // Key components and pages. Add more as needed.
  // Note: These paths must be exact and accessible from the root.
  // Next.js build output paths might be different, so adjust accordingly.
  // For a real app, you'd integrate this with your build process.
];

// The install event is fired when the service worker is first installed.
self.addEventListener('install', (event) => {
  // We extend the install event until our pre-caching is complete.
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Pre-caching app shell');
        return cache.addAll(PRECACHE_URLS);
      })
      .catch(error => {
        console.error('[Service Worker] Pre-caching failed:', error);
      })
  );
});

// The activate event is fired when the service worker becomes active.
// This is a good time to clean up old caches.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // If a cache is not our current one, we delete it.
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// The fetch event is fired for every network request the page makes.
// We can intercept these requests and respond with cached assets if they exist.
self.addEventListener('fetch', (event) => {
  // We only want to handle GET requests.
  if (event.request.method !== 'GET') {
    return;
  }
  
  // For navigation requests (i.e., for HTML pages), use a network-first strategy.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // If the network request is successful, cache the response.
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
        .catch(() => {
          // If the network fails, serve the main page from the cache.
          return caches.match('/');
        })
    );
    return;
  }

  // For all other requests (CSS, JS, images), use a cache-first strategy.
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // If we have a match in the cache, return it.
        if (response) {
          return response;
        }

        // Otherwise, fetch from the network.
        return fetch(event.request).then(
          (networkResponse) => {
            // If the fetch is successful, cache the new response.
            if (networkResponse && networkResponse.status === 200) {
              return caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse.clone());
                return networkResponse;
              });
            }
            return networkResponse;
          }
        ).catch(error => {
          // The fetch failed, but we don't have a cache entry either.
          // This would be a good place to return a fallback image or asset if you have one.
          console.log('[Service Worker] Fetch failed; returning offline fallback if available.', error);
        });
      })
  );
});
