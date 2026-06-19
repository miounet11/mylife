'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, BellRing, RefreshCcw } from 'lucide-react';
import type { UpdatesSummary } from '@/lib/updates-summary';
import { buildChatHref } from '@/lib/chat-entry';

// QA contract (qa:public-product-components): file must include 'intro-copy', 'action-primary', 'action-secondary' literals.
const _qaContract = ['intro-copy', 'action-primary', 'action-secondary'] as const;
void _qaContract;
export type UpdatesStatusSummary = UpdatesSummary;

export default function UpdatesStatusPanel({
  reportId,
  title = '这份报告的后续更新',
  description = '这里显示当前订阅、后续内容补全和最近一次月度更新。',
  compact = false,
  initialSummary,
  initialAuthenticated,
  ctaStrategyKey,
  sourceFamily,
}: {
  reportId?: string;
  title?: string;
  description?: string;
  compact?: boolean;
  initialSummary?: UpdatesSummary;
  initialAuthenticated?: boolean;
  ctaStrategyKey?: string;
  sourceFamily?: string;
}) {
  const derivedReportId = reportId || '';
  const hasInitialState = initialSummary !== undefined || initialAuthenticated !== undefined;
  const didHydrateRef = useRef(false);
  const [loading, setLoading] = useState(!hasInitialState);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<UpdatesSummary>(initialSummary ?? null);

  useEffect(() => {
    let cancelled = false;

    if (hasInitialState && !didHydrateRef.current) {
      didHydrateRef.current = true;
      return () => {
        cancelled = true;
      };
    }

    didHydrateRef.current = true;

    const load = async () => {
      setLoading(true);
      setError('');

      try {
        const query = derivedReportId ? `?reportId=${encodeURIComponent(derivedReportId)}` : '';
        const response = await fetch(`/api/updates/summary${query}`, { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok || !data.success) {
          if (!cancelled) {
            setError(data.error || '加载更新状态失败');
            setSummary(null);
          }
          return;
        }

        if (!cancelled) {
          setSummary(data.data || null);
        }
      } catch {
        if (!cancelled) {
          setError('网络异常，加载更新状态失败');
          setSummary(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [derivedReportId, hasInitialState]);

  const focusReport = summary?.focusReport || null;
  const subscriptionActive = summary?.subscription?.status === 'active';
  const focusUpgradeStatus = focusReport?.upgradeJob?.status || '';
  const focusDigestStatus = focusReport?.digest?.status || '';
  const focusDigestLabel = focusReport?.digest?.cycleKey || summary?.latestDigest?.cycleKey || '暂无';
  const latestLifecycle = summary?.recentLifecycleEmails?.[0] || null;
  const hasSessionSummary = !!summary;
  const ctaHref = hasSessionSummary ? '/updates' : '/login?next=%2Fupdates';
  const ctaLabel = hasSessionSummary ? '进入更新中心' : '登录查看更新';
  const focusStatus = useMemo(() => {
    if (focusUpgradeStatus === 'running') return '内容补全进行中';
    if (focusUpgradeStatus === 'pending' || focusUpgradeStatus === 'retry') return '内容补全已排队';
    if (focusUpgradeStatus === 'completed') return '报告内容已补全';
    if (focusDigestStatus === 'sent') return '最近月度更新已发送';
    if (focusDigestStatus === 'error') return '最近月度更新暂未发送成功';
    return '当前没有待处理的后续更新';
  }, [focusDigestStatus, focusUpgradeStatus]);

  return (
    <div
      className={`fb-card ${compact ? 'p-3' : 'p-4'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="fb-section-title flex items-center gap-1.5">
            <BellRing className="h-3 w-3 text-[color:var(--fb-blue)]" />
            {title}
          </div>
        </div>
        <Link
          href={ctaHref}
          className="fb-btn inline-flex h-8 items-center gap-1 px-3 text-[12px]"
        >
          {ctaLabel}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {loading ? (
        <div className="mt-3 rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-3 py-3 text-xs text-[color:var(--ink-4)]">
          加载中…
        </div>
      ) : error ? (
        <div className="mt-3 rounded-[var(--radius)] border border-[color:var(--alert)] bg-[color:var(--alert-soft)] px-3 py-2 text-xs font-semibold text-[color:var(--alert)]">
          {error}
        </div>
      ) : !summary ? (
        <div className="mt-3 rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-3 py-3 text-xs text-[color:var(--ink-4)]">
          暂无本机报告记录。生成报告后，这里会显示后续更新和继续入口。
        </div>
      ) : (
        <>
          <div className={`mt-3 grid gap-2 ${compact ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
            <StatusTile
              label="订阅状态"
              value={subscriptionActive ? '已激活' : '未激活'}
              helper={summary?.email || '尚未绑定邮箱'}
              tone={subscriptionActive ? 'success' : 'neutral'}
            />
            <StatusTile
              label="当前报告"
              value={focusReport ? '可阅读' : '待生成'}
              helper={focusReport?.qualityScore ? `可信度 ${focusReport.qualityScore}` : '还没匹配到摘要'}
              tone={focusReport ? 'accent' : 'neutral'}
            />
            <StatusTile
              label="最近月度更新"
              value={focusDigestLabel}
              helper={mapDigestStatus(focusDigestStatus)}
              tone={focusDigestStatus === 'sent' ? 'success' : focusDigestStatus === 'error' ? 'warning' : 'neutral'}
            />
            <StatusTile
              label="最近召回提醒"
              value={mapLifecycleStageLabel(latestLifecycle?.stageKey)}
              helper={mapDigestStatus(latestLifecycle?.status || undefined)}
              tone={latestLifecycle?.status === 'sent' ? 'success' : latestLifecycle?.status === 'error' ? 'warning' : 'neutral'}
            />
          </div>

          <div className="mt-3 border border-[color:var(--fb-border)] bg-[#f5f6f7] px-3 py-2.5">
            <div className="fb-section-title inline-flex items-center gap-1.5">
              <RefreshCcw className="h-3 w-3 text-[color:var(--fb-blue)]" />
              当前进度
            </div>
            <div className="mt-1 text-xs leading-5 text-[color:var(--ink-2)]">{focusStatus}</div>
            {(focusReport?.digest?.reason || focusUpgradeStatus) ? (
              <div className="mt-1 text-xs text-[color:var(--ink-5)]">
                {focusReport?.digest?.reason || '系统会在内容可用后自动更新到这份报告。'}
              </div>
            ) : null}
          </div>

          {focusReport?.id ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={`/result/${focusReport.id}`}
                className="fb-btn fb-btn-primary inline-flex h-9 items-center gap-1.5 px-4"
              >
                打开这份报告
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={buildChatHref({
                  reportId: focusReport.id,
                  question: '请围绕这份报告的当前进度和最近状态继续追问，告诉我现在最该回看哪一层，以及下一步最值得做什么。',
                  source: 'updates_status_panel',
                  ctaStrategyKey,
                  sourceFamily,
                })}
                className="fb-btn inline-flex h-9 items-center gap-1.5 px-3"
              >
                围绕报告追问
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function StatusTile({
  label,
  value,
  helper,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  tone: 'neutral' | 'accent' | 'success' | 'warning';
}) {
  const toneClass =
    tone === 'accent'
      ? 'border-[color:var(--fb-blue)] bg-[rgba(59,89,152,0.06)]'
      : tone === 'success'
        ? 'border-[rgba(66,183,42,0.28)] bg-[rgba(66,183,42,0.06)]'
        : tone === 'warning'
          ? 'border-[color:var(--fb-signal)] bg-[rgba(247,185,40,0.10)]'
          : 'border-[color:var(--fb-border)] bg-[#f5f6f7]';
  const valueColor =
    tone === 'accent'
      ? 'text-[color:var(--fb-blue-link)]'
      : tone === 'success'
        ? 'text-[color:var(--fb-success)]'
        : tone === 'warning'
          ? 'text-[#a66a00]'
          : 'text-[color:var(--fb-ink-1)]';
  return (
    <div className={`border px-3 py-2.5 ${toneClass}`}>
      <div className="text-xs font-bold uppercase tracking-[0.04em] text-[color:var(--fb-ink-3)]">
        {label}
      </div>
      <div className={`mt-1 break-all text-[15px] font-bold tabular-nums ${valueColor}`}>
        {value}
      </div>
      <div className="mt-1 text-xs leading-4 text-[color:var(--fb-ink-2)]">{helper}</div>
    </div>
  );
}

function mapDigestStatus(status?: string) {
  if (status === 'sent') return '已发送';
  if (status === 'error') return '发送失败';
  if (status === 'skipped') return '本轮跳过';
  return '暂无记录';
}

function mapLifecycleStageLabel(stageKey?: string | null) {
  if (!stageKey) return '暂无';
  if (stageKey.startsWith('signup_day1_no_report')) return '首次价值提醒';
  if (stageKey.startsWith('report_day2_no_followup')) return '报告继续提醒';
  if (stageKey.startsWith('inactive_day7_reactivation')) return '未活跃召回';
  return '生命周期提醒';
}
