'use client';

/**
 * 人生数据底座 — 多源参数完整度中枢
 * 样式：全站 Linear 浅色（paper / ink / hairline / brand）
 */

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { trackClientEvent } from '@/lib/analytics-client';
import type {
  FoundationItemStatus,
  FoundationLayer,
  FoundationLayerId,
  LifeFoundationSnapshot,
} from '@/lib/life-foundation/types';
import { fetchJsonWithTimeout } from '@/lib/utils';
import { FoundationQaWizard } from '@/components/profile/foundation-qa-wizard';

type ApiResponse = {
  success: boolean;
  foundation?: LifeFoundationSnapshot;
  error?: string;
};

const LAYER_ORDER: FoundationLayerId[] = [
  'birth',
  'astro',
  'body',
  'life_qa',
  'interact',
  'tools',
];

function statusDot(status: FoundationItemStatus) {
  if (status === 'done') return 'bg-[color:var(--ink-1)]';
  if (status === 'partial') return 'bg-[color:var(--brand)]';
  if (status === 'optional') return 'bg-[color:var(--ink-5)]';
  return 'bg-[color:var(--hairline-strong)]';
}

function statusLabel(status: FoundationItemStatus) {
  if (status === 'done') return '已齐';
  if (status === 'partial') return '部分';
  if (status === 'optional') return '选填';
  return '待补';
}

export default function LifeFoundationHub({
  initialFortuneId = '',
  openWizard = false,
}: {
  initialFortuneId?: string;
  openWizard?: boolean;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [foundation, setFoundation] = useState<LifeFoundationSnapshot | null>(null);
  const [activeLayer, setActiveLayer] = useState<FoundationLayerId | 'all'>('all');
  const [wizardOpen, setWizardOpen] = useState(openWizard);
  /** Soft status: fills auto-persist via wizard/API; no manual Save button. */
  const [autoSaveHint, setAutoSaveHint] = useState<string>('填写即记录 · 无需手动保存');

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = Boolean(opts?.silent);
    if (!silent) {
      setLoading(true);
      setError('');
    }
    try {
      const q = initialFortuneId
        ? `?fortuneId=${encodeURIComponent(initialFortuneId)}`
        : '';
      const { response, data } = await fetchJsonWithTimeout<ApiResponse>(
        `/api/profile/foundation${q}`,
        { timeoutMs: 12_000, timeoutReason: 'life-foundation' },
      );
      if (!response.ok || !data.success || !data.foundation) {
        if (!silent) setError(data.error || '读取失败');
        return false;
      }
      setFoundation(data.foundation);
      setError('');
      return true;
    } catch {
      if (!silent) setError('网络超时，请刷新重试');
      return false;
    } finally {
      if (!silent) setLoading(false);
    }
  }, [initialFortuneId]);

  useEffect(() => {
    void load();
    void trackClientEvent({ eventName: 'foundation_page_viewed', page: '/profile/foundation' });
  }, [load]);

  const layers = useMemo(() => {
    if (!foundation) return [] as FoundationLayer[];
    const map = new Map(foundation.layers.map((l) => [l.id, l]));
    return LAYER_ORDER.map((id) => map.get(id)).filter(Boolean) as FoundationLayer[];
  }, [foundation]);

  const visibleLayers = useMemo(() => {
    if (activeLayer === 'all') return layers;
    return layers.filter((l) => l.id === activeLayer);
  }, [layers, activeLayer]);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-[color:var(--hairline)] bg-white p-5 shadow-card">
          <div className="text-[11px] font-medium text-[color:var(--ink-5)]">人生数据底座</div>
          <h2 className="mt-1 text-[16px] font-semibold text-[color:var(--ink-1)]">正在汇总六层参数</h2>
          <p className="mt-1 text-[12px] leading-relaxed text-[color:var(--ink-4)]">
            生辰 → 星座 → 面相手相 → 生活问答 → 互动校准 → 工具信号。汇总完成后显示完整度与下一步。
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {['生辰', '星座', '体貌', '问答', '互动', '工具'].map((label) => (
              <div
                key={label}
                className="rounded-lg border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-2.5 py-2 text-[11px] font-medium text-[color:var(--ink-3)]"
              >
                {label} · 汇总中
              </div>
            ))}
          </div>
        </div>
        <p className="text-center text-[12px] text-[color:var(--ink-5)]">
          正在汇总生辰、星座、相学、问答与工具信号…
        </p>
      </div>
    );
  }

  if (error || !foundation) {
    return (
      <div className="rounded-xl border border-[color:var(--hairline)] bg-white p-6 shadow-card">
        <div className="text-[11px] font-medium text-[color:var(--ink-5)]">人生数据底座</div>
        <h2 className="mt-1 text-[16px] font-semibold text-[color:var(--ink-1)]">
          {error ? '暂时读不到底座' : '还没有可汇总的盘'}
        </h2>
        <p className="mt-1 text-[13px] leading-relaxed text-[color:var(--ink-3)]">
          {error || '多数访客会先从事业结构开盘，再补合婚 / 流年；游客也可直接测算。'}
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={() => {
              void trackClientEvent({
                eventName: 'foundation_empty_retry',
                page: '/profile/foundation',
                meta: { hasError: Boolean(error) },
              });
              void load();
            }}
            className="inline-flex items-center justify-center rounded-md border border-[color:var(--hairline)] bg-white px-3 py-2 text-[12px] font-medium text-[color:var(--ink-1)] hover:bg-[color:var(--bg-sunken)]"
          >
            重试加载
          </button>
          <Link
            href="/analyze?intent=career&source=foundation_empty"
            onClick={() =>
              void trackClientEvent({
                eventName: 'foundation_empty_cta',
                page: '/profile/foundation',
                meta: { path: 'career' },
              })
            }
            className="inline-flex items-center justify-center rounded-md bg-slate-900 px-3 py-2 text-[12px] font-medium text-white hover:bg-slate-800"
          >
            先看事业结构
          </Link>
          <Link
            href="/hehun?source=foundation_empty"
            onClick={() =>
              void trackClientEvent({
                eventName: 'foundation_empty_cta',
                page: '/profile/foundation',
                meta: { path: 'hehun' },
              })
            }
            className="inline-flex items-center justify-center rounded-md border border-[color:var(--hairline)] bg-white px-3 py-2 text-[12px] font-medium text-[color:var(--ink-1)] hover:bg-[color:var(--bg-sunken)]"
          >
            合婚双盘
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Score hero */}
      <section className="rounded-xl border border-[color:var(--hairline)] bg-white p-5 shadow-card md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
              <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  stroke="var(--bg-sunken)"
                  strokeWidth="3"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  stroke="var(--ink-1)"
                  strokeWidth="3"
                  strokeDasharray={`${(foundation.overall / 100) * 97.4} 97.4`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-[18px] font-semibold tabular-nums text-[color:var(--ink-1)]">
                {foundation.overall}
              </span>
            </div>
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wide text-[color:var(--ink-5)]">
                人生数据底座
              </div>
              <h2 className="mt-0.5 text-[18px] font-semibold text-[color:var(--ink-1)]">
                {foundation.gradeLabel}
              </h2>
              <p className="mt-1 text-[12px] leading-relaxed text-[color:var(--ink-4)]">
                {foundation.fortuneName
                  ? `当前档案：${foundation.fortuneName}`
                  : '尚未绑定命盘'}
                {' · '}
                核心项 {foundation.stats.filledItems}/{foundation.stats.totalCoreItems}
                {' · '}
                工具 {foundation.stats.toolRunCount} 次
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={
                foundation.fortuneId
                  ? `/analyze?intent=career&source=foundation_hub_primary&fortuneId=${encodeURIComponent(foundation.fortuneId)}`
                  : '/analyze?intent=career&source=foundation_hub_primary'
              }
              onClick={() =>
                void trackClientEvent({
                  eventName: 'foundation_primary_cta_click',
                  page: '/profile/foundation',
                  meta: {
                    path: 'career',
                    fortuneId: foundation.fortuneId || null,
                    overall: foundation.overall,
                  },
                })
              }
              className="rounded-lg bg-slate-900 px-4 py-2 text-[13px] font-medium text-white hover:bg-slate-800"
            >
              先看事业结构
            </Link>
            <Link
              href="/hehun?source=foundation_hub_secondary"
              onClick={() =>
                void trackClientEvent({
                  eventName: 'foundation_secondary_cta_click',
                  page: '/profile/foundation',
                  meta: {
                    path: 'hehun',
                    fortuneId: foundation.fortuneId || null,
                  },
                })
              }
              className="rounded-lg border border-[color:var(--hairline)] bg-white px-4 py-2 text-[13px] font-medium text-[color:var(--ink-1)] hover:bg-[color:var(--bg-sunken)]"
            >
              合婚双盘
            </Link>
            <button
              type="button"
              onClick={() => {
                setWizardOpen(true);
                void trackClientEvent({
                  eventName: 'foundation_wizard_opened',
                  page: '/profile/foundation',
                  meta: {
                    fortuneId: foundation.fortuneId || null,
                    overall: foundation.overall,
                  },
                });
              }}
              className="rounded-lg border border-[color:var(--hairline)] bg-white px-4 py-2 text-[13px] font-medium text-[color:var(--ink-1)] hover:bg-[color:var(--bg-sunken)]"
            >
              快速问答
            </button>
          </div>
        </div>

        {/* Auto-save product rule: fill → record; no manual save step */}
        <div className="mt-4 flex flex-col gap-2 rounded-xl border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[12px] font-medium text-[color:var(--ink-1)]">{autoSaveHint}</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-[color:var(--ink-5)]">
              向导、合婚、事业测算中的填写会自动写入底座，后续报告与对话会直接用。
            </p>
          </div>
          <span
            aria-live="polite"
            className="inline-flex shrink-0 items-center rounded-full border border-[color:var(--hairline)] bg-white px-2.5 py-1 text-[11px] font-medium text-[color:var(--ink-3)]"
          >
            自动保存已开
          </span>
        </div>

        {/* Guest-heavy funnel: soft save/login strip (prod ~10k guests / ~24 emails) */}
        <div className="mt-3 flex flex-col gap-2 rounded-xl border border-dashed border-[color:var(--brand)]/30 bg-[color:var(--brand-soft)] px-3 py-2.5 shadow-card sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[12px] font-medium text-[color:var(--ink-1)]">
              {foundation.fortuneId ? '结果已生成 · 登录跨设备保留' : '游客可先算 · 登录后不丢进度'}
            </p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-[color:var(--ink-3)]">
              {foundation.fortuneId
                ? '登录或绑定邮箱后，底座、合婚与事业测算可跨设备回看，避免换机丢失。'
                : '先完成测算也没关系。想长期留存时，登录 / 绑定邮箱即可。'}
            </p>
          </div>
          <Link
            href="/login?source=foundation_save_strip&next=%2Fprofile%2Ffoundation"
            onClick={() =>
              void trackClientEvent({
                eventName: 'foundation_save_strip_click',
                page: '/profile/foundation',
                meta: {
                  fortuneId: foundation.fortuneId || null,
                  overall: foundation.overall,
                  next: '/profile/foundation',
                },
              })
            }
            className="inline-flex shrink-0 items-center justify-center rounded-md bg-[color:var(--brand)] px-3 py-1.5 text-[12px] font-medium text-white no-underline hover:bg-[color:var(--brand-strong)] hover:no-underline"
          >
            登录 / 绑定邮箱
          </Link>
        </div>

        {/* Layer mini scores */}
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {layers.map((layer) => (
            <button
              key={layer.id}
              type="button"
              onClick={() => setActiveLayer(layer.id === activeLayer ? 'all' : layer.id)}
              className={`rounded-lg border px-2.5 py-2 text-left transition ${
                activeLayer === layer.id
                  ? 'border-[color:var(--ink-1)] bg-[color:var(--bg-sunken)]'
                  : 'border-[color:var(--hairline)] bg-white hover:border-[color:var(--ink-4)]'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="truncate text-[11px] text-[color:var(--ink-3)]">{layer.title}</span>
                <span className="text-[12px] font-semibold tabular-nums text-[color:var(--ink-1)]">
                  {layer.score}
                </span>
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[color:var(--bg-sunken)]">
                <div
                  className="h-full rounded-full bg-[color:var(--ink-1)]"
                  style={{ width: `${Math.max(3, layer.score)}%` }}
                />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Usage-driven quick paths: prod 1d/7d = guest-heavy, career > relationship/hehun > yearly */}
      <section
        aria-label="热门路径"
        className="rounded-xl border border-[color:var(--hairline)] bg-white p-5 shadow-card sm:p-5"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h3 className="text-[14px] font-semibold text-[color:var(--ink-1)]">热门路径</h3>
            <p className="mt-0.5 text-[12px] text-[color:var(--ink-5)]">
              多数访客先看事业结构，再补合婚 / 流年；无需登录即可开始（站内日活以游客为主）
            </p>
          </div>
          {!foundation.fortuneId && (
            <span className="rounded-full border border-[color:var(--hairline)] bg-white px-2 py-0.5 text-[11px] text-[color:var(--ink-4)]">
              游客可先测算
            </span>
          )}
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {(
            [
              {
                key: 'career',
                label: '事业结构',
                hint: '24h 最热意图',
                href: foundation.fortuneId
                  ? `/analyze?intent=career&source=foundation_hotpath&fortuneId=${encodeURIComponent(foundation.fortuneId)}`
                  : '/analyze?intent=career&source=foundation_hotpath',
              },
              {
                key: 'hehun',
                label: '合婚双盘',
                hint: '周工具 Top',
                href: '/hehun?source=foundation_hotpath',
              },
              {
                key: 'yearly',
                label: '流年窗口',
                hint: '时机与节奏',
                href: foundation.fortuneId
                  ? `/analyze?intent=yearly&source=foundation_hotpath&fortuneId=${encodeURIComponent(foundation.fortuneId)}`
                  : '/analyze?intent=yearly&source=foundation_hotpath',
              },
            ] as const
          ).map((item) => (
            <Link
              key={item.key}
              href={item.href}
              onClick={() =>
                void trackClientEvent({
                  eventName: 'foundation_hotpath_click',
                  page: '/profile/foundation',
                  meta: {
                    path: item.key,
                    fortuneId: foundation.fortuneId || null,
                    overall: foundation.overall,
                  },
                })
              }
              className="group flex items-center justify-between gap-2 rounded-lg border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-3 py-3 transition hover:border-[color:var(--ink-4)] hover:bg-white"
            >
              <div className="min-w-0">
                <div className="text-[13px] font-medium text-[color:var(--ink-1)]">{item.label}</div>
                <div className="mt-0.5 text-[11px] text-[color:var(--ink-5)]">{item.hint}</div>
              </div>
              <span
                aria-hidden
                className="shrink-0 text-[14px] text-[color:var(--ink-4)] transition group-hover:text-[color:var(--ink-1)]"
              >
                →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Next steps */}
      {foundation.nextSteps.length > 0 && (
        <section className="rounded-xl border border-[color:var(--hairline)] bg-white p-5 shadow-card">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-[14px] font-semibold text-[color:var(--ink-1)]">建议下一步</h3>
            <button
              type="button"
              onClick={() => setActiveLayer('all')}
              className="text-[11px] text-[color:var(--ink-5)] hover:text-[color:var(--ink-2)]"
            >
              看全部层
            </button>
          </div>
          <ol className="mt-3 divide-y divide-[color:var(--hairline)]">
            {foundation.nextSteps.slice(0, 5).map((step, idx) => (
              <li
                key={`${step.itemId}-${idx}`}
                className="flex flex-col gap-2 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[color:var(--bg-sunken)] text-[11px] font-medium text-[color:var(--ink-3)]">
                      {idx + 1}
                    </span>
                    <span className="truncate text-[13px] font-medium text-[color:var(--ink-1)]">
                      {step.title}
                    </span>
                  </div>
                  <p className="mt-0.5 pl-7 text-[12px] text-[color:var(--ink-5)]">{step.reason}</p>
                </div>
                <Link
                  href={step.href}
                  onClick={() =>
                    void trackClientEvent({
                      eventName: 'foundation_step_clicked',
                      page: '/profile/foundation',
                      meta: { itemId: step.itemId, layerId: step.layerId },
                    })
                  }
                  className="inline-flex w-full shrink-0 items-center justify-center rounded-md bg-slate-900 px-3 py-2 text-[12px] font-medium text-white hover:bg-slate-800 sm:w-auto sm:py-1.5"
                >
                  {step.ctaLabel}
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Milestones */}
      {foundation.milestones?.length > 0 && (
        <section className="rounded-xl border border-[color:var(--hairline)] bg-white p-5 shadow-card">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h3 className="text-[14px] font-semibold text-[color:var(--ink-1)]">完整度里程碑</h3>
              <p className="mt-0.5 text-[12px] text-[color:var(--ink-5)]">
                已达成 {foundation.milestoneProgress?.done ?? 0}/
                {foundation.milestoneProgress?.total ?? foundation.milestones.length}
                {foundation.milestoneProgress ? ` · ${foundation.milestoneProgress.percent}%` : ''}
              </p>
            </div>
            <Link
              href="/membership?source=foundation_milestones"
              className="text-[12px] font-medium text-[color:var(--ink-2)] underline-offset-2 hover:underline"
            >
              会员与深度服务
            </Link>
          </div>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {foundation.milestones.map((m) => (
              <li
                key={m.id}
                className={`rounded-lg border px-3 py-2.5 ${
                  m.done
                    ? 'border-[color:var(--hairline)] bg-[color:var(--bg-sunken)]'
                    : 'border-[color:var(--hairline)] bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          m.done ? 'bg-[color:var(--ink-1)]' : 'bg-[color:var(--hairline-strong)]'
                        }`}
                      />
                      <span className="text-[13px] font-medium text-[color:var(--ink-1)]">{m.label}</span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-[color:var(--ink-5)]">{m.description}</p>
                    <p className="mt-0.5 text-[11px] text-[color:var(--ink-4)]">{m.rewardHint}</p>
                  </div>
                  <Link
                    href={m.href}
                    onClick={() =>
                      void trackClientEvent({
                        eventName: 'foundation_step_clicked',
                        page: '/profile/foundation',
                        meta: { itemId: `milestone_${m.id}`, done: m.done },
                      })
                    }
                    className={`shrink-0 rounded-md px-2.5 py-1 text-[11px] font-medium ${
                      m.done
                        ? 'border border-[color:var(--hairline)] text-[color:var(--ink-3)]'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    {m.ctaLabel}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Apps result cards — always show hehun entry (7d tool top) even before first writeback */}
      <section className="rounded-xl border border-[color:var(--hairline)] bg-white p-5 shadow-card">
        <h3 className="text-[14px] font-semibold text-[color:var(--ink-1)]">
          {foundation.appsHighlights?.hehun ||
          foundation.appsHighlights?.dimension ||
          foundation.appsHighlights?.naming ||
          foundation.appsHighlights?.space ||
          foundation.appsHighlights?.lastTool
            ? '已沉淀的工具结果'
            : '工具入口'}
        </h3>
        <p className="mt-0.5 text-[12px] text-[color:var(--ink-5)]">
          {foundation.appsHighlights?.hehun
            ? '对话与报告会引用这些摘要（不作恐吓定命）'
            : '合婚为周侧最高频工具；跑完后会写回底座，供报告与对话引用'}
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {foundation.appsHighlights.hehun?.headline ? (
              <div className="rounded-lg border border-[color:var(--hairline)] p-3">
                <div className="text-[11px] font-medium text-[color:var(--ink-5)]">合婚双盘</div>
                <p className="mt-1 text-[13px] font-medium text-[color:var(--ink-1)]">
                  {foundation.appsHighlights.hehun.headline}
                </p>
                <p className="mt-1 text-[11px] text-[color:var(--ink-4)]">
                  {[
                    foundation.appsHighlights.hehun.score != null
                      ? `${foundation.appsHighlights.hehun.score} 分`
                      : null,
                    foundation.appsHighlights.hehun.band,
                    foundation.appsHighlights.hehun.partner,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
                <Link
                  href="/hehun?source=foundation_apps_card"
                  onClick={() => {
                    void trackClientEvent({
                      eventName: 'foundation_apps_cta_click',
                      page: '/profile/foundation',
                      meta: {
                        app: 'hehun',
                        fortuneId: foundation.fortuneId || null,
                        score: foundation.appsHighlights.hehun.score ?? null,
                        mode: 'review',
                      },
                    });
                  }}
                  className="mt-2 inline-block text-[12px] text-[color:var(--ink-2)] underline-offset-2 hover:underline"
                >
                  复看合婚
                </Link>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] p-3">
                <div className="text-[11px] font-medium text-[color:var(--ink-5)]">合婚双盘</div>
                <p className="mt-1 text-[13px] font-medium text-[color:var(--ink-1)]">
                  尚未写回底座
                </p>
                <p className="mt-1 text-[11px] text-[color:var(--ink-4)]">
                  完成一次双盘后，分数与摘要会出现在这里
                </p>
                <Link
                  href="/hehun?source=foundation_apps_empty"
                  onClick={() => {
                    void trackClientEvent({
                      eventName: 'foundation_apps_cta_click',
                      page: '/profile/foundation',
                      meta: {
                        app: 'hehun',
                        fortuneId: foundation.fortuneId || null,
                        mode: 'first_run',
                      },
                    });
                  }}
                  className="mt-2 inline-flex rounded-md bg-slate-900 px-2.5 py-1 text-[12px] font-medium text-white hover:bg-slate-800"
                >
                  去合婚
                </Link>
              </div>
            )}
            {foundation.appsHighlights.dimension?.title && (
              <div className="rounded-lg border border-[color:var(--hairline)] p-3">
                <div className="text-[11px] font-medium text-[color:var(--ink-5)]">十维度</div>
                <p className="mt-1 text-[13px] font-medium text-[color:var(--ink-1)]">
                  {foundation.appsHighlights.dimension.title}
                </p>
                {foundation.appsHighlights.dimension.summary && (
                  <p className="mt-1 line-clamp-2 text-[12px] text-[color:var(--ink-4)]">
                    {foundation.appsHighlights.dimension.summary}
                  </p>
                )}
                <Link
                  href={
                    foundation.appsHighlights.dimension.slug
                      ? `/dimensions/${foundation.appsHighlights.dimension.slug}?source=foundation_apps_card`
                      : '/dimensions?source=foundation_apps_card'
                  }
                  className="mt-2 inline-block text-[12px] text-[color:var(--ink-2)] underline-offset-2 hover:underline"
                >
                  打开维度
                </Link>
              </div>
            )}
            {foundation.appsHighlights.naming?.top && (
              <div className="rounded-lg border border-[color:var(--hairline)] p-3">
                <div className="text-[11px] font-medium text-[color:var(--ink-5)]">起名</div>
                <p className="mt-1 text-[13px] font-medium text-[color:var(--ink-1)]">
                  领先「{foundation.appsHighlights.naming.top}」
                  {foundation.appsHighlights.naming.score
                    ? ` · ${foundation.appsHighlights.naming.score} 分`
                    : ''}
                </p>
                <Link
                  href="/tools/naming?source=foundation_apps_card"
                  className="mt-2 inline-block text-[12px] text-[color:var(--ink-2)] underline-offset-2 hover:underline"
                >
                  继续起名
                </Link>
              </div>
            )}
            {foundation.appsHighlights.space?.summary && (
              <div className="rounded-lg border border-[color:var(--hairline)] p-3">
                <div className="text-[11px] font-medium text-[color:var(--ink-5)]">空间场</div>
                <p className="mt-1 line-clamp-2 text-[13px] font-medium text-[color:var(--ink-1)]">
                  {foundation.appsHighlights.space.summary}
                </p>
                <Link
                  href="/tools/fengshui-space?source=foundation_apps_card"
                  className="mt-2 inline-block text-[12px] text-[color:var(--ink-2)] underline-offset-2 hover:underline"
                >
                  打开空间场
                </Link>
              </div>
            )}
            {(foundation.appsHighlights.lastTool?.title ||
              foundation.appsHighlights.lastTool?.summary) && (
              <div className="rounded-lg border border-[color:var(--hairline)] p-3">
                <div className="text-[11px] font-medium text-[color:var(--ink-5)]">最近工具</div>
                <p className="mt-1 text-[13px] font-medium text-[color:var(--ink-1)]">
                  {foundation.appsHighlights.lastTool.title ||
                    foundation.appsHighlights.lastTool.slug ||
                    '通用工具'}
                </p>
                {foundation.appsHighlights.lastTool.summary && (
                  <p className="mt-1 line-clamp-2 text-[12px] text-[color:var(--ink-4)]">
                    {foundation.appsHighlights.lastTool.summary}
                  </p>
                )}
                <Link
                  href={
                    foundation.appsHighlights.lastTool.slug
                      ? `/tools/${encodeURIComponent(
                          foundation.appsHighlights.lastTool.slug,
                        )}?source=foundation_apps_card`
                      : '/tools?source=foundation_apps_card'
                  }
                  className="mt-2 inline-block text-[12px] text-[color:var(--ink-2)] underline-offset-2 hover:underline"
                >
                  打开工具
                </Link>
              </div>
            )}
          </div>
        </section>

      {/* Astro strip */}
      {(foundation.astro.sunSign || foundation.astro.chineseZodiac) && (
        <section className="rounded-xl border border-[color:var(--hairline)] bg-white px-5 py-4 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-[11px] font-medium text-[color:var(--ink-5)]">星座 · 生肖速览</div>
              <p className="mt-1 text-[14px] font-medium text-[color:var(--ink-1)]">
                {[
                  foundation.astro.sunSign,
                  foundation.astro.chineseZodiac ? `${foundation.astro.chineseZodiac}肖` : null,
                  foundation.astro.moonSign ? `月 ${foundation.astro.moonSign}` : null,
                  foundation.astro.risingSign ? `升 ${foundation.astro.risingSign}` : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              <p className="mt-1 text-[11px] text-[color:var(--ink-5)]">
                对话与结构报告会读取本层参数作表达对齐；四柱真值仍以排盘引擎为准。
              </p>
            </div>
            <Link
              href={`/tools/zodiac?source=foundation_strip${
                foundation.fortuneId ? `&fortuneId=${encodeURIComponent(foundation.fortuneId)}` : ''
              }`}
              className="text-[12px] font-medium text-[color:var(--ink-2)] underline-offset-2 hover:underline"
            >
              打开星座工具
            </Link>
          </div>
        </section>
      )}

      {/* Layer detail cards */}
      {visibleLayers.map((layer) => (
        <section
          key={layer.id}
          className="rounded-xl border border-[color:var(--hairline)] bg-white p-5 shadow-card"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-[15px] font-semibold text-[color:var(--ink-1)]">{layer.title}</h3>
              <p className="mt-0.5 text-[12px] text-[color:var(--ink-5)]">{layer.subtitle}</p>
            </div>
            <div className="text-right">
              <div className="text-[18px] font-semibold tabular-nums text-[color:var(--ink-1)]">
                {layer.score}
                <span className="text-[12px] font-normal text-[color:var(--ink-5)]"> / 100</span>
              </div>
              <div className="text-[11px] text-[color:var(--ink-5)]">{statusLabel(layer.status)}</div>
            </div>
          </div>

          <ul className="mt-4 divide-y divide-[color:var(--hairline)] border-t border-[color:var(--hairline)]">
            {layer.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-start gap-2.5">
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${statusDot(item.status)}`}
                    title={statusLabel(item.status)}
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13px] font-medium text-[color:var(--ink-1)]">
                        {item.label}
                      </span>
                      {item.fixed && (
                        <span className="rounded bg-[color:var(--bg-sunken)] px-1.5 py-0.5 text-[10px] text-[color:var(--ink-4)]">
                          固定参数
                        </span>
                      )}
                      {item.status === 'optional' && (
                        <span className="rounded bg-[color:var(--bg-sunken)] px-1.5 py-0.5 text-[10px] text-[color:var(--ink-4)]">
                          选填
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[12px] text-[color:var(--ink-5)]">{item.description}</p>
                    {item.valueSummary && (
                      <p className="mt-1 truncate text-[12px] text-[color:var(--ink-2)]">
                        {item.valueSummary}
                      </p>
                    )}
                  </div>
                </div>
                <Link
                  href={item.href}
                  onClick={() =>
                    void trackClientEvent({
                      eventName: 'foundation_step_clicked',
                      page: '/profile/foundation',
                      meta: { itemId: item.id, layerId: layer.id },
                    })
                  }
                  className={`shrink-0 rounded-md px-3 py-1.5 text-[12px] font-medium ${
                    item.status === 'done'
                      ? 'border border-[color:var(--hairline)] text-[color:var(--ink-2)] hover:bg-[color:var(--bg-sunken)]'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {item.ctaLabel}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {/* Tool signals */}
      {foundation.toolSignals.length > 0 && (
        <section className="rounded-xl border border-[color:var(--hairline)] bg-white p-5 shadow-card">
          <h3 className="text-[14px] font-semibold text-[color:var(--ink-1)]">最近工具使用</h3>
          <ul className="mt-3 space-y-2">
            {foundation.toolSignals.map((sig) => (
              <li
                key={sig.toolSlug}
                className="flex items-center justify-between gap-2 text-[12px]"
              >
                <span className="text-[color:var(--ink-2)]">
                  {sig.title}
                  <span className="ml-2 text-[color:var(--ink-5)]">×{sig.count}</span>
                </span>
                <Link
                  href={`${sig.href}?source=foundation_history`}
                  className="text-[color:var(--ink-3)] underline-offset-2 hover:underline"
                >
                  打开
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="px-1 text-[11px] leading-relaxed text-[color:var(--ink-5)]">
        数据底座用于让结构报告、对话与工具共享同一套固定参数。面相/手相非医学诊断；星座为民用分界，精确上升需准确时辰。
      </p>

      {wizardOpen && (
        <FoundationQaWizard
          fortuneId={foundation.fortuneId}
          onClose={() => {
            setWizardOpen(false);
            setAutoSaveHint('已自动记录 · 正在同步底座…');
            void trackClientEvent({
              eventName: 'foundation_wizard_closed',
              page: '/profile/foundation',
              meta: {
                fortuneId: foundation.fortuneId || null,
                autosave: true,
              },
            });
            // Silent reload so QA scores/CTAs update without full-page loading flash.
            void load({ silent: true }).then((ok) => {
              setAutoSaveHint(
                ok
                  ? '填写已自动保存 · 后续报告可直接用'
                  : '本地已记录 · 同步稍后再试',
              );
            });
          }}
        />
      )}
    </div>
  );
}
