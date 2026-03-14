'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, BellRing, RefreshCcw } from 'lucide-react';
import type { UpdatesSummary } from '@/lib/updates-summary';

export type UpdatesStatusSummary = UpdatesSummary;

export default function UpdatesStatusPanel({
  reportId,
  title = '这份报告的后续更新',
  description = '这里直接显示当前订阅、升级任务和最近一次月度更新，不必只靠邮箱回收。',
  compact = false,
  initialSummary,
  initialAuthenticated,
}: {
  reportId?: string;
  title?: string;
  description?: string;
  compact?: boolean;
  initialSummary?: UpdatesSummary;
  initialAuthenticated?: boolean;
}) {
  const derivedReportId = reportId || '';
  const hasInitialState = initialSummary !== undefined || initialAuthenticated !== undefined;
  const didHydrateRef = useRef(false);
  const [loading, setLoading] = useState(!hasInitialState);
  const [error, setError] = useState('');
  const [authenticated, setAuthenticated] = useState(!!initialAuthenticated);
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
            setAuthenticated(false);
            setSummary(null);
          }
          return;
        }

        if (!cancelled) {
          setAuthenticated(!!data.authenticated);
          setSummary(data.data || null);
        }
      } catch {
        if (!cancelled) {
          setError('网络异常，加载更新状态失败');
          setAuthenticated(false);
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
  const ctaHref = authenticated ? '/updates' : '/login?next=%2Fupdates';
  const ctaLabel = authenticated ? '进入更新中心' : '登录查看更新';
  const focusStatus = useMemo(() => {
    if (focusUpgradeStatus === 'running') return '后台增强进行中';
    if (focusUpgradeStatus === 'pending' || focusUpgradeStatus === 'retry') return '后台排队增强中';
    if (focusUpgradeStatus === 'completed') return '报告增强已完成';
    if (focusDigestStatus === 'sent') return '最近月度更新已发送';
    if (focusDigestStatus === 'error') return '最近月度更新发送失败';
    return '当前没有排队中的升级任务';
  }, [focusDigestStatus, focusUpgradeStatus]);

  return (
    <div className={`soft-card rounded-[1.75rem] ${compact ? 'p-5' : 'p-6'}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <BellRing className="h-5 w-5 text-[color:var(--accent-strong)]" />
            <div className="font-semibold text-[color:var(--ink)]">{title}</div>
          </div>
          <div className="mt-2 text-sm leading-7 text-[color:var(--muted)]">{description}</div>
        </div>
        <Link
          href={ctaHref}
          className="inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[color:var(--ink)]"
        >
          {ctaLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {loading ? (
        <div className="mt-4 rounded-[1.4rem] bg-slate-50 px-4 py-4 text-sm leading-7 text-[color:var(--muted)]">
          正在加载这份报告的更新状态...
        </div>
      ) : error ? (
        <div className="mt-4 rounded-[1.4rem] bg-rose-50 px-4 py-4 text-sm leading-7 text-rose-700">
          {error}
        </div>
      ) : !authenticated ? (
        <div className="mt-4 rounded-[1.4rem] bg-slate-50 px-4 py-4 text-sm leading-7 text-[color:var(--muted)]">
          登录后，这里会显示你当前报告的升级任务、月度更新和订阅状态。
        </div>
      ) : (
        <>
          <div className={`mt-4 grid gap-3 ${compact ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
            <StatusTile
              label="订阅状态"
              value={subscriptionActive ? '已激活' : '未激活'}
              helper={summary?.email || '尚未绑定邮箱'}
              tone={subscriptionActive ? 'success' : 'neutral'}
            />
            <StatusTile
              label="当前报告"
              value={focusReport?.reportVersion || '待生成'}
              helper={focusReport?.qualityScore ? `质量 ${focusReport.qualityScore} / ${focusReport.qualityGrade || 'B'}` : '还没有匹配到这份报告摘要'}
              tone={focusReport ? 'accent' : 'neutral'}
            />
            <StatusTile
              label="最近月度更新"
              value={focusDigestLabel}
              helper={mapDigestStatus(focusDigestStatus)}
              tone={focusDigestStatus === 'sent' ? 'success' : focusDigestStatus === 'error' ? 'warning' : 'neutral'}
            />
          </div>

          <div className="mt-4 rounded-[1.4rem] bg-slate-50 px-4 py-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--ink)]">
              <RefreshCcw className="h-4 w-4 text-[color:var(--accent-strong)]" />
              当前进度
            </div>
            <div className="mt-2 text-sm leading-7 text-[color:var(--ink)]">{focusStatus}</div>
            <div className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
              {focusReport?.digest?.reason || focusReport?.upgradeJob?.nextRunAt || '系统会把后续升级、月度变化和提醒状态集中回写到这里。'}
            </div>
          </div>

          {focusReport?.id ? (
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href={`/result/${focusReport.id}`}
                className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-4 py-3 text-sm font-semibold text-white"
              >
                打开这份报告
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={`/chat?reportId=${encodeURIComponent(focusReport.id)}`}
                className="inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--ink)]"
              >
                继续围绕这份报告追问
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
  return (
    <div className={`rounded-[1.4rem] px-4 py-4 ${mapTone(tone)}`}>
      <div className="text-xs tracking-[0.18em]">{label}</div>
      <div className="mt-2 break-all text-2xl font-black">{value}</div>
      <div className="mt-2 text-sm leading-7 opacity-85">{helper}</div>
    </div>
  );
}

function mapTone(tone: 'neutral' | 'accent' | 'success' | 'warning') {
  if (tone === 'accent') return 'bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]';
  if (tone === 'success') return 'bg-emerald-50 text-emerald-700';
  if (tone === 'warning') return 'bg-amber-50 text-amber-700';
  return 'bg-white text-[color:var(--ink)]';
}

function mapDigestStatus(status?: string) {
  if (status === 'sent') return '已发送';
  if (status === 'error') return '发送失败';
  if (status === 'skipped') return '本轮跳过';
  return '暂无记录';
}
