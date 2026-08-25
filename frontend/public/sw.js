/**
 * UG Clinic Portal — Enhanced Service Worker
 *
 * Implements advanced caching strategies:
 * - Cache-First for static assets (JS, CSS, fonts, images)
 * - Network-First with background sync for API data
 * - Stale-While-Revalidate for HTML pages
 * - Offline fallback support
 * - Background sync for failed requests
 *
 * Registered from: src/components/providers/ServiceWorkerProvider.tsx
 * Installed at: /sw.js (via public/sw.js)
 *
 * Cache namespaces:
 *   ug-static-v2   — Next.js built assets (immutable, 1-year)
 *   ug-pages-v2    — HTML pages (stale-while-revalidate)
 *   ug-assets-v2   — Images, fonts, public files (24h)
 *   ug-api-v2      — API responses (short-term cache)
 *   ug-offline-v2  — Offline fallback pages
 */

const STATIC_CACHE = "ug-static-v2";
const PAGES_CACHE = "ug-pages-v2";
const ASSETS_CACHE = "ug-assets-v2";
const API_CACHE = "ug-api-v2";
const OFFLINE_CACHE = "ug-offline-v2";

const ALL_CACHES = [STATIC_CACHE, PAGES_CACHE, ASSETS_CACHE, API_CACHE, OFFLINE_CACHE];

// Background sync queue for failed requests
const SYNC_QUEUE_NAME = 'ug-sync-queue';

// ── Install: pre-cache app shell and offline fallback ─────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      // Cache essential app shell
      caches.open(STATIC_CACHE).then((cache) =>
        cache.addAll([
          "/",
          "/logo.svg",
          "/favicon.ico",
        ])
      ),
      // Cache offline fallback page
      caches.open(OFFLINE_CACHE).then((cache) =>
        cache.addAll([
          // You can add offline-specific pages here
          // For now, we'll generate a basic offline response dynamically
        ])
      ),
    ])
  );
  // Immediately activate so we don't wait for existing tabs to close
  self.skipWaiting();
});

// ── Activate: clean up old caches ───────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !ALL_CACHES.includes(key))
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: enhanced routing strategy ─────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only intercept same-origin requests
  if (url.origin !== self.location.origin) return;

  // ── 1. Next.js static assets → Cache-First (immutable) ─────────────────
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // ── 2. API GET requests → Network-First with short cache ────────────────
  if (url.pathname.startsWith("/api/") && request.method === "GET") {
    event.respondWith(networkFirstWithCache(request, API_CACHE, 300)); // 5 min cache
    return;
  }

  // ── 3. API POST/PUT/DELETE → Network-Only with background sync ────────
  if (url.pathname.startsWith("/api/") && request.method !== "GET") {
    event.respondWith(networkWithBackgroundSync(request));
    return;
  }

  // ── 4. Images, fonts, public assets → Cache-First with revalidation ─────
  if (/\.(png|jpg|jpeg|gif|webp|avif|svg|ico|woff2?|ttf|otf|mp4|webm)$/.test(url.pathname)) {
    event.respondWith(cacheFirst(request, ASSETS_CACHE, 86400));
    return;
  }

  // ── 5. HTML pages → Stale-While-Revalidate ──────────────────────────────
  if (request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(staleWhileRevalidate(request, PAGES_CACHE));
    return;
  }
});

// ── Strategy: Cache-First ─────────────────────────────────────────────────────
async function cacheFirst(request, cacheName, maxAgeSeconds = Infinity) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    // Check if the cached response is still fresh
    const cachedDate = cached.headers.get("date");
    if (maxAgeSeconds !== Infinity && cachedDate) {
      const age = (Date.now() - new Date(cachedDate).getTime()) / 1000;
      if (age > maxAgeSeconds) {
        // Stale — fetch fresh in background, return stale for now
        fetchAndCache(request, cache);
        return cached;
      }
    }
    return cached;
  }

  return fetchAndCache(request, cache);
}

// ── Strategy: Stale-While-Revalidate ─────────────────────────────────────────
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetchAndCache(request, cache);

  return cached ?? fetchPromise;
}

// ── Helper: fetch + cache ─────────────────────────────────────────────────────
async function fetchAndCache(request, cache) {
  try {
    const response = await fetch(request);
    // Only cache successful responses
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Return a basic offline fallback for HTML navigation
    return getOfflineFallback();
  }
}

// ── Strategy: Network-First with Cache ─────────────────────────────────────────
async function networkFirstWithCache(request, cacheName, maxAgeSeconds = 300) {
  const cache = await caches.open(cacheName);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache the successful response
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Check if cached response is still fresh
      const cachedDate = cachedResponse.headers.get("date");
      if (cachedDate) {
        const age = (Date.now() - new Date(cachedDate).getTime()) / 1000;
        if (age <= maxAgeSeconds) {
          return cachedResponse;
        }
      }
      return cachedResponse; // Return stale data if network fails
    }
    
    // No cache available, return offline fallback
    return getOfflineFallback();
  }
}

// ── Strategy: Network with Background Sync ───────────────────────────────────
async function networkWithBackgroundSync(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    // Network failed, queue for background sync
    await queueForBackgroundSync(request);
    
    // Return error response
    return new Response(
      JSON.stringify({ 
        error: "Offline", 
        message: "Request queued for background sync" 
      }),
      { 
        status: 503,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}

// ── Background Sync Queue ───────────────────────────────────────────────────
async function queueForBackgroundSync(request) {
  // Store request details for later sync
  const syncData = {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: request.body ? await request.text() : null,
    timestamp: Date.now(),
  };

  // Store in IndexedDB (simplified - in production, use proper IndexedDB)
  const queue = JSON.parse(localStorage.getItem(SYNC_QUEUE_NAME) || "[]");
  queue.push(syncData);
  localStorage.setItem(SYNC_QUEUE_NAME, JSON.stringify(queue));

  // Register background sync if available
  if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
    await self.registration.sync.register(SYNC_QUEUE_NAME);
  }
}

// ── Handle Background Sync Event ────────────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_QUEUE_NAME) {
    event.waitUntil(processSyncQueue());
  }
});

async function processSyncQueue() {
  const queue = JSON.parse(localStorage.getItem(SYNC_QUEUE_NAME) || "[]");
  
  for (const item of queue) {
    try {
      await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.body,
      });
    } catch (error) {
      console.error('[SW] Background sync failed for:', item.url);
    }
  }
  
  // Clear processed items
  localStorage.setItem(SYNC_QUEUE_NAME, JSON.stringify([]));
}

// ── Offline Fallback Response ───────────────────────────────────────────────
function getOfflineFallback() {
  return new Response(
    `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Offline - UG Clinic Portal</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        .container {
          text-align: center;
          padding: 2rem;
          max-width: 500px;
        }
        h1 { margin: 0 0 1rem 0; font-size: 2rem; }
        p { margin: 0 0 2rem 0; opacity: 0.9; }
        .button {
          background: white;
          color: #667eea;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
        }
        .button:hover { opacity: 0.9; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>You're Offline</h1>
        <p>Please check your internet connection and try again. Some features may still be available.</p>
        <button onclick="window.location.reload()" class="button">Try Again</button>
      </div>
    </body>
    </html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}
