import { Suspense } from 'react';
import NextDynamic from 'next/dynamic';
import type { ReportLifeKLineSection } from '@/lib/report-types';
import type { FortuneAnalysisResult } from '@/lib/user-types';
import { compactCopy, getLifeKLineMetricToneClasses } from '@/lib/report-page-helpers';
import { presentReportText } from '@/lib/report-presentation';

// v5-D5 人生长弧线 + 运势曲线：结构摘要与完整 K 线同卡，避免“只有数字没有图”
const FortuneChart = NextDynamic(() => import('@/components/fortune-kline-chart'), {
  loading: () => <ChartSkeleton />,
});

function ChartSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-8 animate-pulse rounded-[8px] bg-[color:var(--bg-sunken)]" />
      <div className="h-64 animate-pulse rounded-[var(--radius)] bg-[color:var(--bg-sunken)]" />
      <div className="grid grid-cols-2 gap-2">
        <div className="h-16 animate-pulse rounded-[8px] bg-[color:var(--bg-sunken)]" />
        <div className="h-16 animate-pulse rounded-[8px] bg-[color:var(--bg-sunken)]" />
      </div>
    </div>
  );
}

interface LifeKLineSummaryCardProps {
  section: ReportLifeKLineSection;
  klineData?: FortuneAnalysisResult['klineData'] | null;
}

export default function LifeKLineSummaryCard({ section, klineData }: LifeKLineSummaryCardProps) {
  const headline = presentReportText(section.headline) || '人生长弧线';
  const summary = presentReportText(section.summary, 160);
  const arcLabel = presentReportText(section.arcLabel, 72);
  const sampleYears = Array.isArray(klineData) ? klineData.length : 0;

  return (
    <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-[color:var(--ink-4)]">
            人生长弧线
          </div>
          <h3 className="mt-1 text-[17px] font-bold leading-snug text-[color:var(--ink-1)] md:text-[18px]">
            {headline}
          </h3>
        </div>
        {arcLabel ? (
          <div className="max-w-full rounded-full bg-[color:var(--bg-sunken)] px-3 py-1 text-[12px] font-semibold leading-snug text-[color:var(--ink-3)]">
            {compactCopy(arcLabel, 40)}
          </div>
        ) : null}
      </div>

      {summary ? (
        <p className="mt-2 max-w-3xl text-[13px] leading-[1.65] text-[color:var(--ink-3)]">
          {summary}
        </p>
      ) : null}

      {section.latestMetrics?.length > 0 ? (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {section.latestMetrics.map((item) => {
            const toneClasses = getLifeKLineMetricToneClasses(item.tone);
            return (
              <div
                key={item.label}
                className={`rounded-[8px] border px-3 py-2.5 ${toneClasses.card}`}
              >
                <div className={`text-[10px] font-bold uppercase tracking-[0.08em] ${toneClasses.label}`}>
                  {item.label}
                </div>
                <div className={`mt-1 text-[16px] font-bold tabular-nums ${toneClasses.value}`}>
                  {item.value}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* 运势曲线：完整样本 + 多维切换 + 高低点解读 */}
      <div className="mt-4">
        {klineData && klineData.length > 0 ? (
          <Suspense fallback={<ChartSkeleton />}>
            <FortuneChart
              data={klineData}
              height={300}
              title="人生 K 线概览"
              subtitle={`${sampleYears} 年趋势样本 · 可切换事业 / 财富 / 关系 / 健康`}
            />
          </Suspense>
        ) : (
          <div className="rounded-[var(--radius)] border border-dashed border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-4 py-5 text-[13px] leading-[1.6] text-[color:var(--ink-4)]">
            暂无趋势图数据。请确认报告已生成 K 线底座；也可先结合下方节奏板与场景判断推进。
          </div>
        )}
      </div>
    </div>
  );
}
