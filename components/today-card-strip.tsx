'use client';

// v5-D39 多档案今日卡条带
//
// 张一鸣定调："多档案不是功能，是使用频次的杠杆。老李 4 个家人 = 老李每天可能打开 4 次。"
//
// UI 反模式必须避免（卡帕西）：
//   - ❌ 全局 tab 切换（切了所有页面状态丢）
//   - ❌ 下拉选择器（隐藏全貌）
//   - ❌ 左侧 sidebar 树（移动端废）
//
// 正确做法：主卡 + N 张 mini 卡横滑。点 mini → 切主卡，仅本组件局部状态，零全局污染。

import { useState } from 'react';
import Link from 'next/link';
import { Plus, AlertTriangle, Sun, Compass } from 'lucide-react';
import TodayCard from '@/components/today-card';
import type { TodayCardData } from '@/lib/today-card';
import type { FortuneRecord } from '@/lib/user-types';
import { describeRelation, getRelationBadge } from '@/lib/relation';
import { trackClientEvent } from '@/lib/analytics-client';

interface FortuneWithCard {
  fortune: Pick<FortuneRecord, 'id' | 'name' | 'relation' | 'relationLabel'>;
  card: TodayCardData;
}

interface Props {
  /** SSR 预算的多档案今日卡数据，已按 self → others 排序 */
  items: FortuneWithCard[];
  /** 埋点 page */
  page?: string;
}

const TONE_DOT = {
  auspicious: { color: '#16A34A', icon: Sun, label: '吉' },
  neutral: { color: '#94A3B8', icon: Compass, label: '平' },
  caution: { color: '#E11D48', icon: AlertTriangle, label: '慎' },
} as const;

export default function TodayCardStrip({ items, page = '/' }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);

  if (items.length === 0) return null;

  const active = items[Math.min(activeIdx, items.length - 1)];

  // 副档案中是否有 caution
  const cautionOthers = items
    .map((it, idx) => ({ ...it, idx }))
    .filter((it) => it.idx !== activeIdx && it.card.toneLabel === 'caution');

  return (
    <div>
      {/* 主卡 */}
      <TodayCard
        fortuneId={active.fortune.id}
        displayName={describeRelation(active.fortune)}
        card={active.card}
        page={page}
      />

      {/* 副档案 mini 横滑（≥2 档案才显示） */}
      {items.length >= 2 && (
        <div className="-mt-2 mb-6 overflow-x-auto">
          <div
            role="tablist"
            aria-label="切换档案"
            className="flex gap-2 px-1 pb-2"
          >
            {items.map((it, idx) => {
              const selected = idx === activeIdx;
              const display = describeRelation(it.fortune);
              const badge = getRelationBadge(it.fortune);
              const tone = TONE_DOT[it.card.toneLabel];
              const ToneIcon = tone.icon;
              return (
                <button
                  key={it.fortune.id}
                  role="tab"
                  aria-selected={selected}
                  type="button"
                  onClick={() => {
                    setActiveIdx(idx);
                    try {
                      trackClientEvent({
                        eventName: 'today_card_cta_clicked',
                        page,
                        meta: {
                          fortuneId: it.fortune.id,
                          target: 'today_strip_switch',
                          relation: it.fortune.relation || 'self',
                          tone: it.card.toneLabel,
                          position: idx,
                        },
                      });
                    } catch {}
                  }}
                  className={`group flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 transition ${
                    selected
                      ? 'border-[color:var(--brand-strong)] bg-white shadow-sm'
                      : 'border-[color:var(--hairline)] bg-[color:var(--paper)] hover:border-[color:var(--brand-soft-2)]'
                  }`}
                  title={display}
                >
                  <span
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black"
                    style={{ background: badge.bg, color: badge.fg }}
                  >
                    {badge.initial}
                  </span>
                  <span className="text-xs font-bold text-[color:var(--ink-2)]">
                    {display}
                  </span>
                  <span
                    className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: `${tone.color}22`, color: tone.color }}
                    aria-label={`今日：${tone.label}`}
                  >
                    <ToneIcon className="h-3 w-3" />
                  </span>
                </button>
              );
            })}

            {/* 添加关心的人 */}
            <Link
              href="/?source=today_strip_add#analysis-form"
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-dashed border-[color:var(--brand-soft-2)] bg-[color:var(--brand-tint)] px-3 py-1.5 text-xs font-bold text-[color:var(--brand-strong)] hover:bg-[color:var(--brand-soft)]"
              onClick={() => {
                try {
                  trackClientEvent({
                    eventName: 'today_card_cta_clicked',
                    page,
                    meta: { target: 'today_strip_add' },
                  });
                } catch {}
              }}
            >
              <Plus className="h-3 w-3" />
              添加关心的人
            </Link>
          </div>
        </div>
      )}

      {/* 副档案 caution 提示（轻量钩子） */}
      {cautionOthers.length > 0 && (
        <div className="-mt-3 mb-6 rounded-[var(--radius-md)] border border-rose-200/70 bg-rose-50/70 px-4 py-2.5 text-xs leading-5 text-rose-800">
          ⚠ 今天{' '}
          {cautionOthers
            .slice(0, 3)
            .map((it) => describeRelation(it.fortune))
            .join('、')}{' '}
          要小心，
          <button
            type="button"
            className="ml-1 font-bold underline-offset-2 hover:underline"
            onClick={() => {
              const first = cautionOthers[0];
              if (first) setActiveIdx(first.idx);
              try {
                trackClientEvent({
                  eventName: 'today_card_cta_clicked',
                  page,
                  meta: { target: 'today_strip_caution_hop', toCount: cautionOthers.length },
                });
              } catch {}
            }}
          >
            看看 →
          </button>
        </div>
      )}

      {/* 仅一个档案时也展示 add 按钮（钩子） */}
      {items.length === 1 && (
        <div className="-mt-2 mb-6 px-1">
          <Link
            href="/?source=today_strip_add#analysis-form"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[color:var(--ink-4)] hover:text-[color:var(--brand-strong)]"
          >
            <Plus className="h-3 w-3" />
            算一个你关心的人
          </Link>
        </div>
      )}
    </div>
  );
}
