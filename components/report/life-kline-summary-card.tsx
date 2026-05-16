import { Suspense } from 'react';
import NextDynamic from 'next/dynamic';
import type { ReportLifeKLineSection } from '@/lib/report-types';
import type { FortuneAnalysisResult } from '@/lib/user-types';
import { compactCopy, getLifeKLineMetricToneClasses } from '@/lib/report-page-helpers';

// v5-D5 (2026-05-16) 把原来挤在 result/[id]/page.tsx 里的 trend 区域人生长弧线卡抽出
// Why: 主 page.tsx 1438 行太厚，先把每块 server 子块独立成命名组件，便于阅读 + diff
// How: 接 ReportLifeKLineSection 数据 + 可选 klineData，内部按需懒加载 FortuneChart

const FortuneChart = NextDynamic(() => import('@/components/fortune-kline-chart'), {
  loading: () => <ChartSkeleton />,
});

function ChartSkeleton() {
  return <div className="h-64 bg-[color:var(--bg-sunken)] rounded-[var(--radius)] animate-pulse" />;
}

interface LifeKLineSummaryCardProps {
  section: ReportLifeKLineSection;
  klineData?: FortuneAnalysisResult['klineData'] | null;
}

export default function LifeKLineSummaryCard({ section, klineData }: LifeKLineSummaryCardProps) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] rounded-[var(--radius)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">人生长弧线</div>
          <h3 className="mt-2 text-lg font-bold text-[color:var(--ink)]">
            {section.headline || '人生长弧线'}
          </h3>
        </div>
        {section.arcLabel ? (
          <div className="rounded-full bg-[color:var(--bg-sunken)] px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
            {compactCopy(section.arcLabel, 30)}
          </div>
        ) : null}
      </div>

      {section.summary ? (
        <p className="mt-2 text-xs leading-6 text-[color:var(--muted)]">
          {compactCopy(section.summary, 108)}
        </p>
      ) : null}

      {section.latestMetrics.length > 0 ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {section.latestMetrics.map((item) => {
            const toneClasses = getLifeKLineMetricToneClasses(item.tone);
            return (
              <div key={item.label} className={`rounded-[var(--radius)] border px-4 py-3 ${toneClasses.card}`}>
                <div className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${toneClasses.label}`}>
                  {item.label}
                </div>
                <div className={`mt-2 text-base font-bold ${toneClasses.value}`}>{item.value}</div>
              </div>
            );
          })}
        </div>
      ) : null}

      {klineData && klineData.length > 0 ? (
        <div className="mt-4 rounded-[var(--radius)] border border-[color:var(--line)] bg-[color:var(--paper)] p-3">
          <Suspense fallback={<ChartSkeleton />}>
            <FortuneChart data={klineData} height={320} />
          </Suspense>
        </div>
      ) : (
        <div className="mt-4 rounded-[var(--radius)] bg-[color:var(--bg-elevated)] px-4 py-4 text-xs leading-6 text-[color:var(--muted)]">
          暂无趋势图数据，先结合节奏板与驾驶舱判断推进。
        </div>
      )}
    </div>
  );
}
