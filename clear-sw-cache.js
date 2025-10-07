// Script to clear service worker cache and reload the application
// Run this in the browser console to clear service worker cache

console.log('Clearing service worker cache...');

// Clear all caches
if ('caches' in window) {
  caches.keys().then(function(cacheNames) {
    console.log('Found caches:', cacheNames);
    return Promise.all(
      cacheNames.map(function(cacheName) {
        console.log('Deleting cache:', cacheName);
        return caches.delete(cacheName);
      })
    );
  }).then(function() {
    console.log('All caches cleared');
  }).catch(function(error) {
    console.error('Error clearing caches:', error);
  });
}

// Unregister all service workers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    console.log('Found service worker registrations:', registrations.length);
    return Promise.all(
      registrations.map(function(registration) {
        console.log('Unregistering service worker:', registration.scope);
        return registration.unregister();
      })
    );
  }).then(function() {
    console.log('All service workers unregistered');
    console.log('Reloading page in 2 seconds...');
    setTimeout(function() {
      window.location.reload(true);
    }, 2000);
  }).catch(function(error) {
    console.error('Error unregistering service workers:', error);
  });
} else {
  console.log('Service workers not supported');
  window.location.reload(true);
}