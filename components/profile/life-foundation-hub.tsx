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

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const q = initialFortuneId
        ? `?fortuneId=${encodeURIComponent(initialFortuneId)}`
        : '';
      const { response, data } = await fetchJsonWithTimeout<ApiResponse>(
        `/api/profile/foundation${q}`,
        { timeoutMs: 12_000, timeoutReason: 'life-foundation' },
      );
      if (!response.ok || !data.success || !data.foundation) {
        setError(data.error || '读取失败');
        return;
      }
      setFoundation(data.foundation);
    } catch {
      setError('网络超时，请刷新重试');
    } finally {
      setLoading(false);
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
      <div className="rounded-xl border border-[color:var(--hairline)] bg-white p-6 text-[13px] text-[color:var(--ink-5)]">
        正在汇总生辰、星座、相学、问答与工具信号…
      </div>
    );
  }

  if (error || !foundation) {
    return (
      <div className="rounded-xl border border-[color:var(--hairline)] bg-white p-6">
        <p className="text-[13px] text-[color:var(--ink-3)]">{error || '暂无数据'}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-3 text-[13px] font-medium text-[color:var(--ink-1)] underline-offset-2 hover:underline"
        >
          重试
        </button>
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
            <button
              type="button"
              onClick={() => setWizardOpen(true)}
              className="rounded-lg bg-slate-900 px-4 py-2 text-[13px] font-medium text-white hover:bg-slate-800"
            >
              快速问答向导
            </button>
            <Link
              href={
                foundation.fortuneId
                  ? `/analyze?source=foundation_hub&fortuneId=${encodeURIComponent(foundation.fortuneId)}`
                  : '/analyze?source=foundation_hub'
              }
              className="rounded-lg border border-[color:var(--hairline)] bg-white px-4 py-2 text-[13px] font-medium text-[color:var(--ink-1)] hover:bg-[color:var(--bg-sunken)]"
            >
              {foundation.hasReport ? '更新结构报告' : '生成结构报告'}
            </Link>
          </div>
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

      {/* Next steps */}
      {foundation.nextSteps.length > 0 && (
        <section className="rounded-xl border border-[color:var(--hairline)] bg-white p-5">
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
              <li key={`${step.itemId}-${idx}`} className="flex items-center justify-between gap-3 py-2.5">
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
                  className="shrink-0 rounded-md bg-slate-900 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-slate-800"
                >
                  {step.ctaLabel}
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Astro strip */}
      {(foundation.astro.sunSign || foundation.astro.chineseZodiac) && (
        <section className="rounded-xl border border-[color:var(--hairline)] bg-white px-5 py-4">
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
          className="rounded-xl border border-[color:var(--hairline)] bg-white p-5"
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
        <section className="rounded-xl border border-[color:var(--hairline)] bg-white p-5">
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
            void load();
          }}
        />
      )}
    </div>
  );
}
