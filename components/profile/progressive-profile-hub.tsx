'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  PROFILE_SUPPLEMENT_DOMAINS,
  type ProfileSettingsResponse,
  type SupplementDomain,
} from '@/lib/profile-settings-types';
import { buildTeacherChatHref } from '@/lib/teachers';
import { fetchJsonWithTimeout } from '@/lib/utils';

/**
 * 资料库轻量总览：完整度 + 已填项 + 还可补充（链到对应老师）
 * 不暴露内部算法话术
 */
export default function ProgressiveProfileHub({
  fortuneId,
  compact = false,
}: {
  fortuneId?: string | null;
  compact?: boolean;
}) {
  const [settings, setSettings] = useState<ProfileSettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const q = fortuneId ? `?fortuneId=${encodeURIComponent(fortuneId)}` : '';
        const { response, data } = await fetchJsonWithTimeout<ProfileSettingsResponse>(
          `/api/profile/settings${q}`,
          { timeoutMs: 8000, timeoutReason: 'progressive-profile-hub' },
        );
        if (!cancelled && response.ok && data.success) {
          setSettings(data);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fortuneId]);

  const filled = useMemo(() => {
    if (!settings?.supplements) return [] as Array<{ domain: string; label: string; value: string }>;
    const rows: Array<{ domain: string; label: string; value: string }> = [];
    for (const sup of settings.supplements) {
      const domainDef = PROFILE_SUPPLEMENT_DOMAINS[sup.domain as SupplementDomain];
      if (!domainDef) continue;
      for (const [key, value] of Object.entries(sup.fields || {})) {
        if (!`${value || ''}`.trim()) continue;
        const field = domainDef.fields.find((f) => f.key === key);
        rows.push({
          domain: domainDef.label,
          label: field?.label || key,
          value: `${value}`.trim(),
        });
      }
    }
    return rows;
  }, [settings]);

  const missing = settings?.topMissingRecommendations || [];
  const completeness = settings?.completeness ?? 0;
  const chatLog = (settings?.changeLog || []).filter(
    (c) => c.changeType === 'chat_progressive' || /对话/.test(c.summary || ''),
  );

  if (loading) {
    return (
      <div className="py-2 text-[12px] text-[color:var(--ink-5)]">正在读取资料…</div>
    );
  }

  if (!settings) return null;

  return (
    <section className="border-y border-[color:var(--hairline)] py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-[14px] font-semibold text-[color:var(--ink-1)]">我的资料</h2>
          <p className="mt-0.5 text-[12px] text-[color:var(--ink-5)]">
            和老师对话时可逐步补充
          </p>
        </div>
        <Link
          href={
            settings.activeFortuneId
              ? `/profile/settings?fortuneId=${encodeURIComponent(settings.activeFortuneId)}&tab=supplements`
              : '/profile/settings?tab=supplements'
          }
          className="text-[12px] text-[color:var(--ink-3)] underline-offset-2 hover:text-[color:var(--ink-1)] hover:underline"
        >
          编辑全部
        </Link>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-[color:var(--ink-2)]">完整度 {completeness}%</span>
          <span className="text-[11px] text-[color:var(--ink-5)]">
            {completeness >= 80 ? '已较完整' : completeness >= 50 ? '还可再补几项' : '建议补充几项'}
          </span>
        </div>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[color:var(--bg-sunken)]">
          <div
            className="h-full rounded-full bg-[color:var(--ink-1)] transition-all"
            style={{ width: `${Math.max(4, Math.min(100, completeness))}%` }}
          />
        </div>
      </div>

      {filled.length > 0 ? (
        <ul className="mt-3 divide-y divide-[color:var(--hairline)] border-t border-[color:var(--hairline)]">
          {filled.slice(0, compact ? 6 : 12).map((item) => (
            <li
              key={`${item.domain}-${item.label}-${item.value}`}
              className="flex items-baseline justify-between gap-3 py-1.5 text-[12px]"
              title={item.domain}
            >
              <span className="text-[color:var(--ink-3)]">{item.label}</span>
              <span className="truncate text-[color:var(--ink-1)]">{item.value}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-[12px] text-[color:var(--ink-5)]">
          还没有补充信息。可和老师对话补充，或在设置里填写。
        </p>
      )}

      {missing.length > 0 && completeness < 95 ? (
        <div className="mt-3 border-t border-[color:var(--hairline)] pt-3">
          <div className="text-[11px] font-medium text-[color:var(--ink-5)]">还可补充</div>
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
            {missing.slice(0, 4).map((m) => {
              const teacher =
                m.domain === 'career'
                  ? 'career'
                  : m.domain === 'wealth'
                    ? 'wealth'
                    : m.domain === 'relationship'
                      ? 'relationship'
                      : m.domain === 'health'
                        ? 'health'
                        : m.domain === 'residence'
                          ? 'geo'
                          : 'overview';
              const href = buildTeacherChatHref({
                teacherId: teacher,
                reportId: settings.activeFortuneId,
                question: `我想补充：${m.label}`,
                source: 'profile_hub_missing',
              });
              return (
                <Link
                  key={`${m.domain}-${m.fieldKey}`}
                  href={href}
                  className="text-[12px] text-[color:var(--ink-2)] underline-offset-2 hover:underline"
                >
                  {m.label}
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}

      {chatLog.length > 0 && !compact ? (
        <div className="mt-3 border-t border-[color:var(--hairline)] pt-3">
          <div className="text-[11px] font-medium text-[color:var(--ink-5)]">对话中记下的</div>
          <ul className="mt-1.5 space-y-1">
            {chatLog.slice(0, 5).map((item) => (
              <li key={item.id} className="text-[12px] leading-[1.5] text-[color:var(--ink-3)]">
                <span className="mr-1.5 text-[11px] text-[color:var(--ink-5)]">对话</span>
                {item.summary}
                {item.createdAt ? (
                  <span className="ml-1 text-[11px] text-[color:var(--ink-5)]">
                    {item.createdAt.slice(0, 10)}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
        <Link href="/teachers" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
          和老师补充
        </Link>
        <Link href="/events" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
          事件本
        </Link>
        <Link href="/profile/settings" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
          编辑资料
        </Link>
      </div>
    </section>
  );
}
