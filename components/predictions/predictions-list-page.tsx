'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import type { Prediction } from '@/lib/predictions/types';
import {
  getAccuracyStats,
  getAllPredictions,
  getDuePredictions,
  getUpcomingPredictions,
  hydratePredictionsFromServer,
} from '@/lib/predictions/store';
import {
  dimensionLabel,
  filterPredictionsByDimension,
  groupPredictionStatsByDimension,
  resolvePredictionDimensionSlug,
} from '@/lib/predictions/dimension-source';
import { PredictionsPanel } from '@/components/predictions/predictions-panel';
import RelatedDimensionsPanel from '@/components/dimensions/related-dimensions-panel';
import { listDimensionsSorted } from '@/lib/dimensions/config';

const CATEGORY_LABELS: Record<Prediction['category'], string> = {
  career: '事业',
  wealth: '财富',
  marriage: '关系',
  health: '健康',
  timing: '时序',
};

export default function PredictionsListPage() {
  const searchParams = useSearchParams();
  const dimensionFromQuery = searchParams.get('dimension') || 'all';
  const [loading, setLoading] = useState(true);
  const [dimensionFilter, setDimensionFilter] = useState(dimensionFromQuery);
  const [upcoming, setUpcoming] = useState<Prediction[]>([]);
  const [due, setDue] = useState<Prediction[]>([]);
  const [history, setHistory] = useState<Prediction[]>([]);
  const [all, setAll] = useState<Prediction[]>([]);
  const [stats, setStats] = useState({ total: 0, hitRate: 0, byCategory: {} as Record<string, number> });
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    setDimensionFilter(dimensionFromQuery);
  }, [dimensionFromQuery]);

  const refresh = useCallback(() => {
    const nextAll = getAllPredictions();
    setAll(nextAll);
    setUpcoming(filterPredictionsByDimension(getUpcomingPredictions(7), dimensionFilter));
    setDue(filterPredictionsByDimension(getDuePredictions(), dimensionFilter));
    setHistory(
      filterPredictionsByDimension(
        nextAll
          .filter((item) => item.outcome && item.outcome !== 'pending')
          .sort((a, b) => b.dueDate.localeCompare(a.dueDate)),
        dimensionFilter,
      ),
    );
    setStats(getAccuracyStats());
  }, [dimensionFilter]);

  useEffect(() => {
    const load = async () => {
      await hydratePredictionsFromServer();
      refresh();
      setLoading(false);
    };
    void load();
  }, [refresh]);

  const dimensionStats = useMemo(() => groupPredictionStatsByDimension(all), [all]);
  const dimensionOptions = useMemo(() => {
    const fromData = dimensionStats
      .filter((item) => item.slug !== 'report')
      .map((item) => ({ slug: item.slug, title: item.title, total: item.total }));
    if (fromData.length) return fromData;
    return listDimensionsSorted()
      .filter((item) => item.priority === 'p0')
      .map((item) => ({ slug: item.slug, title: item.title, total: 0 }));
  }, [dimensionStats]);

  if (loading) {
    return (
      <div className="fb-card flex items-center justify-center gap-2 p-10 text-[13px] text-[color:var(--ink-3)]">
        <Loader2 className="h-4 w-4 animate-spin" />
        正在加载预测清单…
      </div>
    );
  }

  const hasAny = upcoming.length + due.length + history.length > 0 || all.length > 0;
  const filterLabel =
    dimensionFilter === 'all' ? '全部来源' : dimensionLabel(dimensionFilter);

  return (
    <div className="space-y-4">
      {stats.total > 0 || all.length > 0 ? (
        <section className="fb-card p-4 md:p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="lk-section-eyebrow">命中率</div>
              <div className="mt-1 text-[22px] font-bold text-[color:var(--ink-1)]">
                {Math.round(stats.hitRate * 100)}%
              </div>
              <p className="mt-1 text-[12px] text-[color:var(--ink-3)]">
                已反馈 {stats.total} 条 · 当前筛选：{filterLabel}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.byCategory).map(([category, rate]) => (
                <span
                  key={category}
                  className="rounded-full border border-[color:var(--hairline)] px-2 py-1 text-[11px] text-[color:var(--ink-3)]"
                >
                  {CATEGORY_LABELS[category as Prediction['category']] || category}{' '}
                  {Math.round(rate * 100)}%
                </span>
              ))}
            </div>
          </div>

          {dimensionStats.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {dimensionStats.map((item) => (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => setDimensionFilter(item.slug)}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                    dimensionFilter === item.slug
                      ? 'border-[color:var(--brand)] bg-[color:var(--brand-soft)] text-[color:var(--brand)]'
                      : 'border-[color:var(--hairline)] text-[color:var(--ink-3)] hover:border-[color:var(--brand)]'
                  }`}
                >
                  {item.title} {item.total}
                  {item.hitRate > 0 ? ` · ${Math.round(item.hitRate * 100)}%` : ''}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setDimensionFilter('all')}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                  dimensionFilter === 'all'
                    ? 'border-[color:var(--brand)] bg-[color:var(--brand-soft)] text-[color:var(--brand)]'
                    : 'border-[color:var(--hairline)] text-[color:var(--ink-3)]'
                }`}
              >
                全部
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="fb-card p-3 md:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[12px] font-semibold text-[color:var(--ink-3)]">按维度筛选</span>
          <select
            value={dimensionFilter}
            onChange={(event) => setDimensionFilter(event.target.value)}
            className="h-8 rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-white px-2 text-[12px]"
          >
            <option value="all">全部来源</option>
            <option value="report">完整报告</option>
            {dimensionOptions.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.title}
                {item.total ? ` (${item.total})` : ''}
              </option>
            ))}
          </select>
          <Link href="/dimensions" className="text-[12px] font-bold text-[color:var(--brand)] hover:underline">
            去十维度生成更多预测 →
          </Link>
        </div>
      </section>

      {!hasAny ? (
        <section className="fb-card p-4 md:p-6">
          <p className="text-[13px] leading-[1.6] text-[color:var(--ink-3)]">
            还没有可回访的预测项。可先生成完整报告，或进入十维度场景研判（会自动同步预测）。
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/dimensions" className="fb-btn fb-btn-primary h-9 px-4 text-sm hover:no-underline">
              十维度研判
            </Link>
            <Link href="/analyze" className="fb-btn h-9 px-4 text-sm hover:no-underline">
              生成完整报告
            </Link>
          </div>
        </section>
      ) : upcoming.length + due.length + history.length === 0 ? (
        <section className="fb-card p-4">
          <p className="text-[13px] text-[color:var(--ink-3)]">
            当前筛选「{filterLabel}」下没有预测项。
            <button
              type="button"
              className="ml-1 font-semibold text-[color:var(--brand)]"
              onClick={() => setDimensionFilter('all')}
            >
              查看全部
            </button>
          </p>
        </section>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <section className="fb-card p-4 md:p-5">
            <div className="lk-section-eyebrow">即将到期</div>
            <h2 className="mt-1 text-[16px] font-bold text-[color:var(--ink-1)]">7 天内</h2>
            <p className="mt-1 text-[12px] text-[color:var(--ink-3)]">提前对照清单，记录现实变化。</p>
            <div className="mt-4">
              <PredictionsPanel predictions={upcoming} showProgress onUpdated={refresh} />
            </div>
          </section>

          <section className="fb-card border-t-2 border-[color:var(--brand)] p-4 md:p-5">
            <div className="lk-section-eyebrow">已到期未反馈</div>
            <h2 className="mt-1 text-[16px] font-bold text-[color:var(--ink-1)]">待你验证</h2>
            <p className="mt-1 text-[12px] text-[color:var(--ink-3)]">点击命中 / 部分 / 未命中，帮助系统校准。</p>
            <div className="mt-4">
              <PredictionsPanel predictions={due} onUpdated={refresh} />
            </div>
          </section>

          <section className="fb-card p-4 md:p-5">
            <button
              type="button"
              onClick={() => setHistoryOpen((open) => !open)}
              className="flex w-full items-center justify-between text-left"
            >
              <div>
                <div className="lk-section-eyebrow">历史已反馈</div>
                <h2 className="mt-1 text-[16px] font-bold text-[color:var(--ink-1)]">{history.length} 条</h2>
              </div>
              <span className="text-[12px] text-[color:var(--ink-4)]">{historyOpen ? '收起' : '展开'}</span>
            </button>

            {historyOpen ? (
              <div className="mt-4 opacity-80">
                <PredictionsPanel predictions={history} compact onUpdated={refresh} />
              </div>
            ) : (
              <p className="mt-3 text-[12px] text-[color:var(--ink-4)]">已反馈记录默认折叠，点击展开查看。</p>
            )}
          </section>
        </div>
      )}

      <RelatedDimensionsPanel
        title="继续场景研判"
        description="维度预测会自动进入本页；优先打磨运势节奏、工作行业、投资理财。"
        limit={3}
        compact
      />
    </div>
  );
}

// re-export helper usage for tests / tooling
export { resolvePredictionDimensionSlug };
