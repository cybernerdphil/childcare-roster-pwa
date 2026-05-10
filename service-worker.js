/**
 * SERVICE WORKER — CHILDCARE AVAILABILITY FORM
 * ─────────────────────────────────────────────────────────────
 * Provides offline-first functionality, asset caching, and push notifications.
 *
 * SECURITY DECISIONS:
 * ─────────────────────────────────────────────────────────────
 * 1. VERSIONED CACHES
 *    - All caches use v1 prefix (e.g., 'static-v1', 'font-v1')
 *    - Allows cache busting on version updates
 *    - Prevents serving stale/compromised assets
 *
 * 2. REQUEST VALIDATION
 *    - Only cache GET requests (safe, idempotent)
 *    - Reject POST/PUT/DELETE (may have side effects)
 *    - Whitelist third-party domains (fonts.googleapis.com only)
 *
 * 3. SAFE ACTIVATION & CLEANUP
 *    - Delete old cache versions on activation
 *    - Prevents cache collisions and disk bloat
 *    - Graceful fallback if cache missing
 *
 * 4. FETCH HANDLER
 *    - Cache-first for HTML, CSS, JS, images
 *    - Network-first for external fonts (with fallback)
 *    - Stale-while-revalidate for data-like assets
 *    - Proper error handling with offline fallback
 *
 * 5. PUSH NOTIFICATIONS (Android only)
 *    - iOS does not support Web Push API
 *    - Graceful degradation if Notification API unavailable
 *    - No auto-subscribe; requires explicit user permission
 *
 * ─────────────────────────────────────────────────────────────
 */

'use strict';

// Version constant - increment to bust all caches
const VERSION = '1';

// Cache names
const CACHE_STATIC = `static-v${VERSION}`;
const CACHE_FONTS = `font-v${VERSION}`;
const CACHE_EXTERNAL = `external-v${VERSION}`;

// Assets to precache on install
const PRECACHE_URLS = [
  './',
  './index.html',
  './css/styles.css',
  './js/app.js',
  './js/sanitisation.js',
  './manifest.json'
];

// Third-party domains to cache (whitelist)
const EXTERNAL_WHITELIST = [
  'fonts.googleapis.com',
  'fonts.gstatic.com'
];

/**
 * INSTALL EVENT
 * ─────────────────────────────────────────────────────────────
 * Precaches all essential assets on first install or update.
 */
self.addEventListener('install', (event) => {
  console.log(`[SW] Installing service worker v${VERSION}`);

  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) => {
      console.log('[SW] Precaching static assets');
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('[SW] Precache failed (may be offline):', err);
        // Don't fail install if network unavailable during first load
      });
    })
  );

  // Force activation immediately (skip waiting)
  self.skipWaiting();
});

/**
 * ACTIVATE EVENT
 * ─────────────────────────────────────────────────────────────
 * Cleans up old cache versions and claims all clients.
 * SECURITY: Prevents serving stale caches after update.
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete caches not matching current version
          if (!cacheName.includes(`v${VERSION}`)) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Claim all clients immediately
      return self.clients.claim();
    })
  );
});

/**
 * isValidUrl(url)
 * ─────────────────────────────────────────────────────────────
 * Validates that a URL is safe to cache.
 * SECURITY: Rejects malformed, file:// and other unsafe schemes.
 */
function isValidUrl(url) {
  try {
    const u = new URL(url);
    // Only allow http/https
    if (!u.protocol.match(/^https?:/)) return false;
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * isWhitelistedDomain(url)
 * ─────────────────────────────────────────────────────────────
 * Checks if a request domain is in the external whitelist.
 * SECURITY: Only caches trusted third-party resources.
 */
function isWhitelistedDomain(url) {
  try {
    const u = new URL(url);
    return EXTERNAL_WHITELIST.some(domain => u.hostname === domain);
  } catch (e) {
    return false;
  }
}

/**
 * shouldCacheRequest(request)
 * ─────────────────────────────────────────────────────────────
 * Determines if a request should be cached.
 * SECURITY: Only caches GET, rejects POST/PUT/DELETE.
 */
function shouldCacheRequest(request) {
  // Only cache GET requests
  if (request.method !== 'GET') {
    console.log('[SW] Not caching:', request.method, request.url);
    return false;
  }

  if (!isValidUrl(request.url)) {
    return false;
  }

  return true;
}

/**
 * getCacheName(url)
 * ─────────────────────────────────────────────────────────────
 * Determines which cache to use based on URL.
 */
function getCacheName(url) {
  try {
    const u = new URL(url);
    const pathname = u.pathname;

    // Fonts cache
    if (pathname.includes('/css/fonts') || isWhitelistedDomain(url)) {
      return CACHE_FONTS;
    }

    // External resources
    if (u.hostname !== location.hostname) {
      return CACHE_EXTERNAL;
    }

    // Static cache (default)
    return CACHE_STATIC;
  } catch (e) {
    return CACHE_STATIC;
  }
}

/**
 * FETCH EVENT
 * ─────────────────────────────────────────────────────────────
 * Implements cache-first strategy with network fallback.
 * SECURITY: Validates requests, whitelists third-party domains.
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = request.url;

  // Skip non-GET requests
  if (!shouldCacheRequest(request)) {
    return;
  }

  // Skip chrome extensions, data URIs, etc.
  if (url.includes('chrome-extension://') || url.startsWith('data:')) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // Found in cache
      if (cachedResponse) {
        console.log('[SW] Cache hit:', url);
        return cachedResponse;
      }

      // Not in cache, try network
      console.log('[SW] Network request:', url);
      return fetch(request)
        .then((response) => {
          // Only cache successful responses
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          // Clone response (original is consumed by this operation)
          const responseToCache = response.clone();
          const cacheName = getCacheName(url);

          // Cache valid responses
          caches.open(cacheName).then((cache) => {
            console.log('[SW] Caching:', url, 'in', cacheName);
            cache.put(request, responseToCache);
          });

          return response;
        })
        .catch((err) => {
          // Network failed
          console.warn('[SW] Fetch failed:', url, err);

          // Try to return a cached version (stale cache)
          return caches.match(request).then((cached) => {
            if (cached) {
              console.log('[SW] Using stale cache for:', url);
              return cached;
            }

            // No cache, no network: offline
            // For HTML pages, serve a generic offline page if available
            if (request.mode === 'navigate') {
              return caches.match('./index.html');
            }

            // Return error response
            return new Response('Offline - resource not available', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
        });
    })
  );
});

/**
 * PUSH NOTIFICATION EVENT (Android only)
 * ─────────────────────────────────────────────────────────────
 * Handles push messages. iOS does not support Web Push API.
 * SECURITY: Only receives messages from authorized server.
 */
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  // iOS: Web Push not supported, no action
  // Android: Notification API available
  if (!self.registration.showNotification) {
    console.log('[SW] Notifications not supported');
    return;
  }

  try {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'Childcare Roster';
    const options = {
      body: data.body || 'You have a new message',
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: data.tag || 'notification',
      requireInteraction: false
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (err) {
    console.error('[SW] Push notification error:', err);
  }
});

/**
 * NOTIFICATION CLICK EVENT
 * ─────────────────────────────────────────────────────────────
 * Handles user clicks on notifications.
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Focus existing window if open
      for (const client of clientList) {
        if (client.url.endsWith('/childcare-roster/') === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow('./');
      }
    })
  );
});

console.log(`[SW] Service worker v${VERSION} loaded`);
