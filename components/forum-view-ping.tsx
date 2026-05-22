// v5-D69 详情页客户端 view ping
'use client';

import { useEffect } from 'react';

export default function ForumViewPing({ slug }: { slug: string }) {
  useEffect(() => {
    if (!slug) return;
    // 防爬虫与 dev double-fetch
    const key = `fvp:${slug}`;
    const last = Number(sessionStorage.getItem(key) || '0');
    if (Date.now() - last < 30 * 60_000) return;
    sessionStorage.setItem(key, String(Date.now()));

    const url = `/api/forum/${encodeURIComponent(slug)}/view`;
    // 用 sendBeacon 不阻塞页面，失败也不报错
    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([''], { type: 'application/json' });
        navigator.sendBeacon(url, blob);
        return;
      }
    } catch {
      /* fallthrough */
    }
    fetch(url, { method: 'POST', keepalive: true }).catch(() => {});
  }, [slug]);

  return null;
}
