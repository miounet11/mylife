'use client';

import { useEffect } from 'react';

const RELOAD_MARKER_KEY = 'life-kline:build-version-reloaded';
const CHECK_INTERVAL_MS = 60_000;

export default function BuildVersionGuard({ initialBuildId }: { initialBuildId: string }) {
  useEffect(() => {
    if (typeof window === 'undefined' || !initialBuildId || initialBuildId === 'unknown-build') {
      return;
    }

    let disposed = false;
    let inflight = false;

    const reloadForNewBuild = (nextBuildId: string) => {
      if (!nextBuildId || nextBuildId === initialBuildId) {
        return;
      }

      if (window.sessionStorage.getItem(RELOAD_MARKER_KEY) === nextBuildId) {
        return;
      }

      window.sessionStorage.setItem(RELOAD_MARKER_KEY, nextBuildId);
      window.location.reload();
    };

    const checkBuildVersion = async () => {
      if (disposed || inflight) {
        return;
      }

      inflight = true;
      try {
        const response = await fetch('/api/runtime/build', {
          cache: 'no-store',
          headers: {
            'cache-control': 'no-cache',
          },
        });
        const data = await response.json().catch(() => null);
        if (!response.ok || !data?.success) {
          return;
        }

        reloadForNewBuild(`${data.buildId || ''}`.trim());
      } catch {
        return;
      } finally {
        inflight = false;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void checkBuildVersion();
      }
    };

    const handleFocus = () => {
      void checkBuildVersion();
    };

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void checkBuildVersion();
      }
    }, CHECK_INTERVAL_MS);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      disposed = true;
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [initialBuildId]);

  return null;
}
