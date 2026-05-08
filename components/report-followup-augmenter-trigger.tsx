'use client';

import { useEffect, useRef } from 'react';

// v5-B5 (2026-05-08) 客户端 fire-and-forget 触发 LLM 优化追问
//
// 行为：
// - 用户进入结果页后 ~2s 异步调用一次 /api/report/followup-augment
// - 后端会查 cache（24h TTL），有就返回，没有就调 LLM 优化并持久化
// - 不阻塞渲染，失败也无需告诉用户（首次访问拿到 B4 deterministic，
//   下次访问拿到 LLM 优化版）
// - sessionStorage 同 reportId 一段时间内不重复调（防 React strict mode 双调）

type ReportFollowupAugmenterTriggerProps = {
  reportId: string;
  // 仅在缺失 / 旧版本时触发，否则不浪费 API 调用
  shouldTrigger: boolean;
};

const SESSION_KEY = 'v5-followup-augmented';

export default function ReportFollowupAugmenterTrigger({
  reportId,
  shouldTrigger,
}: ReportFollowupAugmenterTriggerProps) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (!shouldTrigger || firedRef.current) return;
    firedRef.current = true;

    // 防 React strict-mode 双调
    const sessionMarker = `${SESSION_KEY}:${reportId}`;
    try {
      if (typeof window !== 'undefined' && window.sessionStorage.getItem(sessionMarker)) {
        return;
      }
      window.sessionStorage.setItem(sessionMarker, '1');
    } catch {
      // sessionStorage 不可用就跳过去重
    }

    // 用 setTimeout 推迟 1.5s — 让首屏渲染完成后再发请求
    const timer = setTimeout(() => {
      fetch('/api/report/followup-augment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId }),
        // keepalive 保证用户提前关页面也能完成
        keepalive: true,
      }).catch(() => {
        // 失败不需要告诉用户 — 下次访问可重试
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, [reportId, shouldTrigger]);

  return null;
}
