/* Life K-Line — minimal safe service worker (no Workbox).
 * Bump CACHE_NAME when changing precache list or fetch rules.
 * Manual bump: bash scripts/bump-sw-cache.sh  (lk-shell-vN → vN+1)
 */
const CACHE_NAME = 'lk-shell-v2';

/** Static shell assets only — never put HTML app routes or /api here. */
const PRECACHE_URLS = [
  '/offline.html',
  '/icon.svg',
  '/manifest.webmanifest',
];

/**
 * Paths that must never be cached (API, auth, admin, membership checkout).
 * SW leaves these to the network (no respondWith).
 * Note: /api/* already covers all API routes; explicit prefixes keep intent clear.
 */
function isNeverCache(pathname) {
  // All API routes — auth, admin, membership, checkout, etc.
  if (pathname.startsWith('/api/')) return true;

  // Admin UI
  if (pathname.startsWith('/admin')) return true;

  // Auth / session pages
  if (
    pathname === '/login' ||
    pathname.startsWith('/login/') ||
    pathname === '/logout' ||
    pathname.startsWith('/logout/') ||
    pathname === '/auth' ||
    pathname.startsWith('/auth/') ||
    pathname === '/register' ||
    pathname.startsWith('/register/') ||
    pathname === '/signin' ||
    pathname.startsWith('/signin/') ||
    pathname === '/signup' ||
    pathname.startsWith('/signup/')
  ) {
    return true;
  }

  // Membership & payment / checkout flows (page shell + deep links)
  if (
    pathname === '/membership' ||
    pathname.startsWith('/membership/') ||
    pathname === '/checkout' ||
    pathname.startsWith('/checkout/') ||
    pathname === '/pay' ||
    pathname.startsWith('/pay/') ||
    pathname === '/payment' ||
    pathname.startsWith('/payment/')
  ) {
    return true;
  }

  return false;
}

/** Same-origin static assets eligible for cache-first. */
function isStaticAsset(url) {
  if (url.origin !== self.location.origin) return false;
  const p = url.pathname;
  return (
    p.startsWith('/_next/static/') ||
    p.startsWith('/images/') ||
    p === '/icon.svg'
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        Promise.all(
          PRECACHE_URLS.map((url) =>
            cache.add(url).catch(() => {
              // Asset may be missing in some envs; do not fail install.
            })
          )
        )
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  // Cross-origin: leave to browser (no caching).
  if (url.origin !== self.location.origin) return;

  // Sensitive / dynamic: never intercept (no cache, no offline HTML).
  if (isNeverCache(url.pathname)) return;

  // Navigations: network-first; only offline.html on navigate failure.
  // App HTML routes are never written into CACHE_NAME.
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  // Static assets: cache-first.
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Everything else (HTML fragments, data, etc.): network only — no cache.
});

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    // Do not put HTML app responses into cache.
    return response;
  } catch {
    const cached = await caches.match('/offline.html');
    if (cached) return cached;
    return new Response(
      '网络暂时不可用 · You are offline\n人生K线 · Life K-Line',
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      }
    );
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(CACHE_NAME);
      // Clone before consuming body.
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  } catch {
    return (
      (await caches.match(request)) ||
      new Response('', { status: 504, statusText: 'Gateway Timeout' })
    );
  }
}
