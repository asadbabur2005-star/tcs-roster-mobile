// TCS Roster Mobile Service Worker - Basic Offline Support

const CACHE_NAME = 'tcs-roster-mobile-v1';
const API_CACHE = 'tcs-api-cache-v1';

// Static resources to cache
const urlsToCache = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js',
  '/manifest.json'
];

// API endpoints to cache
const apiEndpoints = [
  '/api/roster/current',
  '/health'
];

// Install event - cache static resources
self.addEventListener('install', function(event) {
  console.log('[SW] Installing service worker');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('[SW] Caching static resources');
        return cache.addAll(urlsToCache);
      })
      .catch(function(error) {
        console.log('[SW] Cache install failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', function(event) {
  console.log('[SW] Activating service worker');

  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', function(event) {
  const requestUrl = new URL(event.request.url);

  // Handle API requests with network-first strategy
  if (requestUrl.pathname.startsWith('/api/')) {
    event.respondWith(
      handleAPIRequest(event.request)
    );
    return;
  }

  // Handle static resources with cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Return cached version if available
        if (response) {
          console.log('[SW] Serving from cache:', event.request.url);
          return response;
        }

        // Fetch from network and cache the response
        return fetch(event.request)
          .then(function(response) {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response since it can only be consumed once
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(function() {
            // Return a generic offline page for navigation requests
            if (event.request.destination === 'document') {
              return caches.match('/');
            }
          });
      })
  );
});

// Handle API requests with caching for offline support
async function handleAPIRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Cache successful API responses
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
      console.log('[SW] Cached API response:', request.url);
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);

    // Try cache as fallback
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      console.log('[SW] Serving API from cache:', request.url);
      return cachedResponse;
    }

    // Return a basic offline response for API requests
    return new Response(
      JSON.stringify({
        success: false,
        error: 'No network connection and no cached data available',
        offline: true
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

// Handle background sync for when connection returns
self.addEventListener('sync', function(event) {
  console.log('[SW] Background sync triggered:', event.tag);

  if (event.tag === 'roster-sync') {
    event.waitUntil(syncRosterData());
  }
});

// Sync roster data when connection is restored
async function syncRosterData() {
  console.log('[SW] Syncing roster data...');

  try {
    // This would sync any pending roster changes
    // For now, just clear old cache to force fresh data
    const cache = await caches.open(API_CACHE);
    const keys = await cache.keys();

    for (const request of keys) {
      if (request.url.includes('/api/roster')) {
        await cache.delete(request);
      }
    }

    console.log('[SW] Roster sync completed');
  } catch (error) {
    console.error('[SW] Roster sync failed:', error);
  }
}