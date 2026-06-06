'use client';

// v5-D38 报告页底部「继续探索」导航卡
// 当前 result/[id] 底部有 6 个 mt-16 平铺的一级板块（验证/专项/订阅/下一步/工具/延伸），
// 视觉上是 6 屏顺序滚动 = 信息混乱。本组件不删除底部内容（保留 SEO + 埋点 + 现有 Deferred
// 渲染节奏），而是在主报告读完处插入一张导航卡，把 6 个目的地浓缩成一个网格，
// 让用户「按需跳转」而不是「被动滚动」。

import Link from 'next/link';
import {
  CheckSquare,
  BellRing,
  ListChecks,
  Wrench,
  BookOpen,
  Users,
  ArrowRight,
} from 'lucide-react';
import { trackClientEvent } from '@/lib/analytics-client';

interface Item {
  id: string;
  hash: string;
  label: string;
  desc: string;
  Icon: typeof CheckSquare;
}

const ITEMS: Item[] = [
  {
    id: 'validation',
    hash: '#validation',
    label: '验证回路',
    desc: '把这份报告放回真实事件中复盘',
    Icon: CheckSquare,
  },
  // v5-D57 (2026-05-21): 移除「专项服务」C 端入口
  {
    id: 'subscription',
    hash: '#subscription',
    label: '订阅 / 更新',
    desc: '后续月度提醒和邮件留存',
    Icon: BellRing,
  },
  {
    id: 'next-step',
    hash: '#next-step',
    label: '下一步行动',
    desc: '把判断转为可执行清单',
    Icon: ListChecks,
  },
  {
    id: 'tools',
    hash: '#tool-recommendations',
    label: '单项工具',
    desc: '基于结构和重点继续细化',
    Icon: Wrench,
  },
  {
    id: 'related',
    hash: '#related-content',
    label: '延伸阅读',
    desc: '相关知识、案例和后续阅读',
    Icon: BookOpen,
  },
  {
    id: 'world-yi-v2',
    hash: '/world-yi',
    label: 'World Yi v2 教义脊柱',
    desc: 'Yixue/Bazi 判断框架与报告 primitives 直连（schedulePublishedAt 自动上线）',
    Icon: BookOpen,
  },
  {
    id: 'add-fortune',
    hash: '/?source=continue_exploration_add#analysis-form',
    label: '算关心的人',
    desc: '家人 / 伴侣 / 孩子的命格',
    Icon: Users,
  },
];

interface Props {
  reportId: string;
}

export default function ReportContinueExplorationNav({ reportId }: Props) {
  return (
    <section
      aria-label="继续探索"
      className="rounded-[var(--radius-md)] border border-[color:var(--brand-soft-2)] bg-gradient-to-br from-[color:var(--brand-tint)] via-white to-[color:var(--bg-sunken)] p-5 shadow-sm md:p-6"
    >
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
            继续探索
          </div>
          <h2 className="mt-1 text-lg font-black text-[color:var(--ink-1)] md:text-xl">
            主报告读完了，按你的需要继续
          </h2>
          <p className="mt-1 text-sm text-[color:var(--ink-3)]">
            点击下方任一卡片直接跳到对应板块，不必逐屏滚动。
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {ITEMS.map(({ id, hash, label, desc, Icon }) => (
          <Link
            key={id}
            href={hash}
            onClick={() => {
              try {
                trackClientEvent({
                  eventName: 'result_cta_clicked',
                  page: `/result/${reportId}`,
                  meta: {
                    reportId,
                    target: `continue_exploration:${id}`,
                  },
                });
              } catch {
                // 埋点失败不阻断跳转
              }
            }}
            className="group flex items-start gap-3 rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-white/85 p-3 backdrop-blur transition hover:-translate-y-0.5 hover:border-[color:var(--brand-strong)] hover:shadow-md"
          >
            <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--brand-soft)] text-[color:var(--brand-strong)]">
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-bold text-[color:var(--ink-1)]">{label}</div>
                <ArrowRight className="h-4 w-4 shrink-0 text-[color:var(--ink-4)] transition group-hover:translate-x-0.5 group-hover:text-[color:var(--brand-strong)]" />
              </div>
              <div className="mt-1 line-clamp-2 text-xs leading-5 text-[color:var(--ink-3)]">
                {desc}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
