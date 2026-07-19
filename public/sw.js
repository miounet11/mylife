/* Life K-Line — minimal safe service worker (no Workbox).
 * Bump CACHE_NAME when changing precache list or fetch rules.
 */
const CACHE_NAME = 'lk-shell-v1';

/** Static shell assets only — never put HTML app routes here. */
const PRECACHE_URLS = [
  '/offline.html',
  '/icon.svg',
  '/manifest.webmanifest',
];

/** Paths that must never be cached (API, admin, auth). */
function isNeverCache(pathname) {
  if (pathname.startsWith('/api/')) return true;
  if (pathname.startsWith('/admin/')) return true;
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

  if (isNeverCache(url.pathname)) return;

  // Navigations: network-first, offline fallback page.
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  // Static assets: cache-first.
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Everything else: network only (no cache).
});

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch {
    const cached = await caches.match('/offline.html');
    if (cached) return cached;
    return new Response('网络暂时不可用 · 人生K线', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
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
