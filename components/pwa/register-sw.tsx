'use client';

/**
 * Registers the minimal shell service worker (`/sw.js`) for PWA polish.
 * - Client-only
 * - https (secure context) or localhost
 * - Never throws into the app shell
 */

import { useEffect } from 'react';

function shouldRegisterServiceWorker(): boolean {
  if (typeof window === 'undefined') return false;
  if (!('serviceWorker' in navigator)) return false;

  const { hostname, protocol } = window.location;

  // Secure contexts + local dev
  if (protocol === 'https:') return true;
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]'
  ) {
    return true;
  }

  // Production hostnames even if somehow served oddly
  if (
    hostname === 'life-kline.com' ||
    hostname.endsWith('.life-kline.com')
  ) {
    return true;
  }

  return false;
}

export default function RegisterServiceWorker() {
  useEffect(() => {
    if (!shouldRegisterServiceWorker()) return;

    let cancelled = false;

    const run = async () => {
      try {
        await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        });
        if (cancelled) return;
      } catch {
        // Registration can fail on private mode / blocked SW — ignore.
      }
    };

    // Defer so first paint / hydration is not blocked.
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(() => {
        void run();
      }, { timeout: 4000 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback?.(id);
      };
    }

    const timer = window.setTimeout(() => {
      void run();
    }, 1500);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  return null;
}
