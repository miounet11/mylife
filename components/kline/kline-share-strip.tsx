'use client';

import { DownloadShareImageButton } from '@/components/share/download-share-image';
import type { PersonalKlineHighlight } from '@/lib/kline-showcase';

/**
 * 人生 K 线分享条：阶段结论 + 真实 sparkline → 下载分享图。
 */
export default function KlineShareStrip({
  highlight,
  publicName,
  reportId,
  locale,
  sparkline,
  sparklineHereIndex,
}: {
  highlight: PersonalKlineHighlight | null;
  publicName?: string;
  reportId?: string;
  locale?: string | null;
  /** overall scores for real curve on share PNG */
  sparkline?: number[];
  sparklineHereIndex?: number;
}) {
  if (!highlight?.stageHeadline) return null;

  const title = highlight.stageHeadline.slice(0, 48);
  const lines = [
    publicName ? `${publicName} · 人生 K 线` : '我的人生 K 线',
    highlight.currentYearScore != null
      ? `今年综合 ${highlight.currentYearScore}${
          highlight.age != null ? ` · ${highlight.age} 岁` : ''
        }`
      : highlight.spanLabel
        ? `样本 ${highlight.spanLabel}`
        : '',
    highlight.stageAction?.slice(0, 42) ||
      (highlight.peak
        ? `高点参考 ${highlight.peak.year} · 低谷 ${highlight.trough?.year ?? '—'}`
        : ''),
  ].filter(Boolean);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)]/40 px-3 py-2.5">
      <div className="min-w-0 text-[12px] leading-relaxed text-[color:var(--ink-3)]">
        <span className="font-semibold text-[color:var(--ink-1)]">分享人生 K 线</span>
        <span className="text-[color:var(--ink-5)]">
          {' '}
          · 含真实曲线剪影的一张图（结构参考）
        </span>
      </div>
      <DownloadShareImageButton
        title={title}
        lines={lines}
        sparkline={sparkline}
        sparklineHereIndex={sparklineHereIndex}
        pageUrl={
          reportId
            ? `https://www.life-kline.com/result/${encodeURIComponent(reportId)}`
            : 'https://www.life-kline.com/'
        }
        locale={locale}
        label="下载分享图"
        className="shrink-0"
      />
    </div>
  );
}
