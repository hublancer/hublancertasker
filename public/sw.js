
self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
});

self.addEventListener('fetch', (event) => {
  // We are not adding any offline functionality here.
  // This is just to satisfy the PWA criteria.
  event.respondWith(fetch(event.request));
});
