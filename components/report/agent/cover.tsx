'use client';

import { Tag } from '@/components/ui/tag';

const INTENT_LABEL: Record<string, string> = {
  career: '事业专项',
  wealth: '财富专项',
  relationship: '关系专项',
  yearly: '年度流年',
  general: '综合判断',
};

const BIRTH_ACCURACY_LABEL: Record<string, string> = {
  exact: '精确时辰',
  unknown: '时辰未知',
  approximate: '大致时辰',
};

export function ReportCover({
  reportId,
  intent,
  birthAccuracy,
  createdAt,
  calibrated,
}: {
  reportId: string;
  intent?: string | null;
  birthAccuracy?: string | null;
  createdAt?: string | null;
  calibrated?: {
    hitRate: number;
    reportCount: number;
  } | null;
}) {
  const intentLabel = (intent && INTENT_LABEL[intent]) || intent || '综合判断';
  const accuracyLabel = birthAccuracy
    ? BIRTH_ACCURACY_LABEL[birthAccuracy] || birthAccuracy
    : null;

  return (
    <section className="fb-card p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="lk-section-eyebrow">判断报告</div>
          <h1 className="mt-1.5 text-[22px] font-semibold tracking-[-0.02em] text-[color:var(--ink-1)] md:text-[26px]">
            {intentLabel}
          </h1>
          {createdAt ? (
            <p className="mt-2 text-[13px] text-[color:var(--ink-4)]">
              生成于 {new Date(createdAt).toLocaleString('zh-CN')}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {calibrated ? (
            <Tag tone="brand" variant="solid" size="sm">
              可信用户·已校准 {Math.round(calibrated.hitRate * 100)}%
            </Tag>
          ) : null}
          <Tag tone="brand" variant="soft" size="sm">{intentLabel}</Tag>
          {accuracyLabel ? (
            <Tag tone="neutral" variant="soft" size="sm">{accuracyLabel}</Tag>
          ) : null}
        </div>
      </div>
      {calibrated ? (
        <p className="mt-4 text-[13px] leading-[1.55] text-[color:var(--ink-3)]">
          基于你 {calibrated.reportCount} 次报告反馈校准 · 已解锁按月细读时间窗
        </p>
      ) : null}
      <p className="mt-4 font-mono text-[11px] text-[color:var(--ink-4)]">ID: {reportId}</p>
    </section>
  );
}
