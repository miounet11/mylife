'use client';

import { useEffect, useMemo, useState } from 'react';
import { formatCompactCount } from '@/lib/format-count';
import type { SystemCapabilityStats } from '@/lib/system-capability-stats';
import {
  OFFICIAL_GITHUB_LABEL,
  OFFICIAL_GITHUB_URL,
  OFFICIAL_TELEGRAM_HANDLE,
  OFFICIAL_TELEGRAM_URL,
} from '@/lib/site-social';
import { cn } from '@/lib/utils';

type AtmosphereStat = {
  key: string;
  label: string;
  value: number;
  live?: boolean;
  hint?: string;
};

function buildAtmosphereStats(stats: SystemCapabilityStats): AtmosphereStat[] {
  return [
    {
      key: 'online',
      label: '当前活跃',
      value: stats.onlineNow,
      live: true,
      hint: '近刻访问与测算热度',
    },
    {
      key: 'today',
      label: '今日测算',
      value: stats.calculationsToday,
      hint: '今日完成的报告/测算',
    },
    {
      key: 'users',
      label: '注册用户',
      value: stats.registeredUsers,
      hint: '站内账号累计',
    },
    {
      key: 'members',
      label: '会员',
      value: Math.max(stats.activeMembers, 0),
      hint: '权益会员（含免费活动）',
    },
    {
      key: 'subs',
      label: '邮件订阅',
      value: stats.emailSubscribers,
      hint: '节点提醒与订阅',
    },
    {
      key: 'community',
      label: '社区问答',
      value: stats.forumQuestionCount,
      hint: `${formatCompactCount(stats.forumAnswerCount)} 条回答`,
    },
  ];
}

export function SiteLiveAtmosphere({
  initialStats,
  className,
  compact = false,
}: {
  initialStats?: SystemCapabilityStats | null;
  className?: string;
  compact?: boolean;
}) {
  const [stats, setStats] = useState<SystemCapabilityStats | null>(initialStats || null);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetch('/api/system-capability-stats', { cache: 'no-store' })
        .then((response) => (response.ok ? response.json() : null))
        .then((payload: SystemCapabilityStats | null) => {
          if (!cancelled && payload) setStats(payload);
        })
        .catch(() => {});
    };
    load();
    const timer = window.setInterval(load, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const items = useMemo(
    () => (stats ? buildAtmosphereStats(stats) : []),
    [stats],
  );

  if (!stats || items.length === 0) {
    return (
      <div className={cn('py-2 text-[12px] text-[color:var(--ink-5)]', className)}>
        正在同步站内数据…
      </div>
    );
  }

  return (
    <section
      className={cn('border-y border-[color:var(--hairline)]', className)}
      aria-label="站内数据"
    >
      <div
        className={cn(
          'flex flex-wrap items-baseline justify-between gap-2',
          compact ? 'py-2' : 'py-2.5',
        )}
      >
        <div className="text-[12px] font-medium text-[color:var(--ink-5)]">站内此刻</div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-[color:var(--ink-3)]">
          <a
            href={OFFICIAL_TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-2 hover:text-[color:var(--ink-1)] hover:underline"
          >
            {OFFICIAL_TELEGRAM_HANDLE}
          </a>
          <a
            href={OFFICIAL_GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-2 hover:text-[color:var(--ink-1)] hover:underline"
          >
            {OFFICIAL_GITHUB_LABEL}
          </a>
        </div>
      </div>
      <dl
        className={cn(
          'grid gap-x-4 gap-y-2 border-t border-[color:var(--hairline)] py-3',
          compact ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
        )}
      >
        {items.map((item) => (
          <div key={item.key} title={item.hint}>
            <dt className="text-[11px] text-[color:var(--ink-5)]">
              {item.live ? '· ' : ''}
              {item.label}
            </dt>
            <dd className="mt-0.5 font-mono text-[15px] tabular-nums text-[color:var(--ink-1)]">
              {formatCompactCount(item.value)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default SiteLiveAtmosphere;
