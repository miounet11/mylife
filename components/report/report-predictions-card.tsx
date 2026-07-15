'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Prediction } from '@/lib/predictions/types';
import { getPredictionsForReport } from '@/lib/predictions/store';
import { SectionHeader } from '@/components/layout/section-header';
import { PredictionsPanel } from '@/components/predictions/predictions-panel';

export default function ReportPredictionsCard({
  predictions: initialPredictions,
  reportId,
}: {
  predictions: Prediction[];
  reportId: string;
}) {
  const [predictions, setPredictions] = useState<Prediction[]>(initialPredictions);

  useEffect(() => {
    setPredictions(initialPredictions);
  }, [initialPredictions]);

  const refresh = () => {
    setPredictions(getPredictionsForReport(reportId));
  };

  if (!predictions.length) return null;

  const pendingCount = predictions.filter((item) => !item.outcome || item.outcome === 'pending').length;

  return (
    <section id="predictions" className="fb-card scroll-mt-header p-5 md:p-6">
      <SectionHeader
        title="未来可验证项"
        description="从各 Agent 输出中抽取的带时间窗判断。到期后回来打分，帮助下一轮判断更准。"
        href="/predictions"
        linkLabel="全部预测"
      />
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-[color:var(--ink-3)]">
        <span className="rounded-full bg-[color:var(--brand-soft)] px-2 py-0.5 font-semibold text-[color:var(--brand)]">
          {predictions.length} 条
        </span>
        <span>{pendingCount} 条待验证</span>
        <Link href="/predictions" className="font-semibold text-[color:var(--brand)] hover:no-underline">
          去回访中心 →
        </Link>
      </div>
      <div className="mt-4">
        <PredictionsPanel predictions={predictions.slice(0, 4)} compact onUpdated={refresh} />
      </div>
    </section>
  );
}