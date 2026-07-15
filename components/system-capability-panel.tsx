import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Stack } from '@/components/ui/stack';
import { formatCompactCount } from '@/lib/format-count';
import type { SystemCapabilityStats } from '@/lib/system-capability-stats';

type CapabilityRow = {
  key: string;
  label: string;
  value: number;
  href?: string;
  hint?: string;
};

function buildCapabilityRows(stats: SystemCapabilityStats): CapabilityRow[] {
  return [
    {
      key: 'online',
      label: '当前活跃',
      value: stats.onlineNow || 0,
      hint: '近刻站内热度',
    },
    {
      key: 'today',
      label: '今日测算',
      value: stats.calculationsToday || 0,
      hint: '今日完成测算/报告',
    },
    {
      key: 'users',
      label: '注册用户',
      value: stats.registeredUsers || 0,
      hint: '站内账号累计',
    },
    {
      key: 'members',
      label: '会员',
      value: stats.activeMembers || 0,
      href: '/membership',
      hint: '权益会员',
    },
    {
      key: 'subs',
      label: '邮件订阅',
      value: stats.emailSubscribers || 0,
      hint: '节点提醒订阅',
    },
    {
      key: 'cases',
      label: '公开案例库',
      value: stats.publishedCaseCount,
      href: '/cases',
      hint: '已发布案例',
    },
    {
      key: 'knowledge',
      label: '知识入口',
      value: stats.publishedKnowledgeCount,
      href: '/knowledge',
      hint: '百科与方法论',
    },
    {
      key: 'community',
      label: '社区问答',
      value: stats.forumQuestionCount,
      href: '/community',
      hint: `${formatCompactCount(stats.forumAnswerCount)} 条回答`,
    },
  ];
}

function CapabilityValue({ value }: { value: number }) {
  return (
    <span className="font-mono text-sm font-bold tabular-nums text-[color:var(--brand-strong)]">
      {formatCompactCount(value)}
    </span>
  );
}

function CapabilityRowItem({ row }: { row: CapabilityRow }) {
  const content = (
    <>
      <div className="min-w-0">
        <div className="text-xs font-medium text-[color:var(--ink-3)]">{row.label}</div>
        {row.hint ? (
          <div className="mt-0.5 text-[11px] leading-4 text-[color:var(--ink-5)]">{row.hint}</div>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <CapabilityValue value={row.value} />
        {row.href ? (
          <ArrowRight className="h-3.5 w-3.5 text-[color:var(--ink-5)] transition group-hover:translate-x-0.5 group-hover:text-[color:var(--brand-strong)]" />
        ) : null}
      </div>
    </>
  );

  const rowClassName =
    'group flex items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-transparent px-2 py-2 transition hover:border-[color:var(--hairline)] hover:bg-[color:var(--paper)]';

  if (row.href) {
    return (
      <Link href={row.href} className={`${rowClassName} no-underline hover:no-underline`}>
        {content}
      </Link>
    );
  }

  return <div className={rowClassName}>{content}</div>;
}

export default function SystemCapabilityPanel({
  stats,
  className,
}: {
  stats: SystemCapabilityStats;
  className?: string;
}) {
  const rows = buildCapabilityRows(stats);

  return (
    <Card variant="sunken" padding="md" className={className}>
      <Eyebrow tone="muted" className="mb-3">
        站内人气 · 系统能力
      </Eyebrow>
      <Stack gap={1}>
        {rows.map((row) => (
          <CapabilityRowItem key={row.key} row={row} />
        ))}
      </Stack>
      <div className="mt-3 border-t border-[color:var(--hairline)] pt-3 text-[11px] leading-4 text-[color:var(--ink-5)]">
        累计测算 {formatCompactCount(stats.calculationsTotal || 0)}
        <span className="mx-1.5 text-[color:var(--ink-6)]">·</span>
        世界易精选 {formatCompactCount(stats.worldYiContentCount)} 篇
        <span className="mx-1.5 text-[color:var(--ink-6)]">·</span>
        话术 {formatCompactCount(stats.masterPhraseCount)}
      </div>
    </Card>
  );
}

export function SystemCapabilityFooterSignals({ stats }: { stats: SystemCapabilityStats }) {
  const signals = [
    { label: '当前活跃', value: stats.onlineNow || 0 },
    { label: '今日测算', value: stats.calculationsToday || 0 },
    { label: '注册用户', value: stats.registeredUsers || 0 },
    { label: '会员', value: stats.activeMembers || 0 },
    { label: '订阅', value: stats.emailSubscribers || 0 },
    { label: '社区问答', value: stats.forumQuestionCount },
  ];

  return (
    <div className="space-y-2">
      <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[color:var(--ink-4)]">
        站内人气
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[12px] text-[color:var(--ink-3)]">
        {signals.map((signal) => (
          <span key={signal.label} className="inline-flex items-center gap-1">
            <span className="font-mono font-semibold tabular-nums text-[color:var(--brand-strong)]">
              {formatCompactCount(signal.value)}
            </span>
            <span>{signal.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function SystemCapabilityFooterSignalsFallback() {
  return (
    <div className="text-[12px] text-[color:var(--ink-4)]">
      人气数据同步中 · 内容库持续补全
    </div>
  );
}