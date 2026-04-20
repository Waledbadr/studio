// Placeholder service worker for Firebase Cloud Messaging.
// You can extend this to handle background messages.

self.addEventListener('install', () => {
  // skip waiting to activate immediately
  self.skipWaiting?.();
});

self.addEventListener('activate', (event) => {
  event.waitUntil?.(self.clients.claim());
});
