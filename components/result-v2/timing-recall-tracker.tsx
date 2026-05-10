'use client';

import { useEffect, useRef } from 'react';

interface Props {
  reportId: string;
}

/**
 * 邮件落地追踪 + highlight 锚点滚动
 * 接 ?utm_*&highlight=... → 调召回 API + 滚动到对应时点
 */
export default function TimingRecallTracker({ reportId }: Props) {
  const startedAt = useRef<number>(0);
  const pagesViewed = useRef<number>(1);

  useEffect(() => {
    startedAt.current = performance.now();
    const params = new URLSearchParams(window.location.search);
    const utm_source = params.get('utm_source');
    const utm_medium = params.get('utm_medium');
    const utm_campaign = params.get('utm_campaign');
    const highlight = params.get('highlight');
    const email = params.get('email') || undefined;

    // 落地动作
    if (utm_source === 'email' && utm_campaign) {
      void fetch('/api/timing/recall', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'returned_to_site',
          reportId,
          pointId: highlight || undefined,
          utm_source,
          utm_medium,
          utm_campaign,
          email,
        }),
      }).catch(() => {});
    }

    // highlight 锚点滚动
    if (highlight) {
      // 等渲染完
      setTimeout(() => {
        const el = document.querySelector(`[data-timing-point-id="${CSS.escape(highlight)}"]`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('animate-pulse', 'ring-4', 'ring-amber-300', 'ring-offset-2');
          setTimeout(() => {
            el.classList.remove('animate-pulse');
          }, 3000);
        }
      }, 300);
    }

    // session_end 上报
    const reportSessionEnd = () => {
      if (utm_source !== 'email' || !utm_campaign) return;
      const durationMs = Math.round(performance.now() - startedAt.current);
      const action = durationMs >= 60_000 ? 'completed_view' : 'session_end';
      const payload = JSON.stringify({
        action,
        reportId,
        utm_source,
        utm_medium,
        utm_campaign,
        email,
        sessionDurationMs: durationMs,
        pagesViewed: pagesViewed.current,
      });
      // 用 sendBeacon 避免被卡掉
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/timing/recall', payload);
      } else {
        void fetch('/api/timing/recall', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') reportSessionEnd();
    };
    window.addEventListener('beforeunload', reportSessionEnd);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('beforeunload', reportSessionEnd);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [reportId]);

  return null;
}
