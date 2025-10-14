// Service worker to handle message passing and prevent async listener errors
self.addEventListener('install', function(event) {
  console.log('Service Worker installing.');
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  console.log('Service Worker activating.');
  event.waitUntil(self.clients.claim());
});

// Handle messages from clients
self.addEventListener('message', function(event) {
  console.log('Service Worker received message:', event.data);
  
  // Always respond to prevent "message channel closed" errors
  if (event.ports && event.ports[0]) {
    event.ports[0].postMessage({ status: 'received', data: event.data });
  }
});

// Fetch event handler removed to prevent "no-op fetch handler" warning
// If you need to intercept fetch requests in the future, add the handler back