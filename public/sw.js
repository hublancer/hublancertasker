// This service worker is intentionally left blank for now.
// It's required for a web app to be installable.
self.addEventListener('install', (event) => {
  console.log('Service worker installing...');
  // Add an empty fetch listener to make the PWA installable.
  self.addEventListener('fetch', () => {});
});

self.addEventListener('fetch', (event) => {
    // Basic network-first strategy
    event.respondWith(
        fetch(event.request).catch(() => {
            // If the network fails, you could try to serve from cache if you have one.
            // For now, it will just result in a network error page.
        })
    );
});
