// Minimal service worker — exists for PWA installability, not offline caching.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))
self.addEventListener('fetch', () => {
  // Intentionally a no-op pass-through: this app always wants fresh data,
  // never a cached response, per the no-auto-refresh/explicit-data design.
})
