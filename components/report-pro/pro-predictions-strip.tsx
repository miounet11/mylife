'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Prediction } from '@/lib/predictions/types';
import type { ProReportView } from '@/lib/report-pro-view';
import {
  getPredictionsForReport,
  hydratePredictionsFromServer,
  savePredictions,
} from '@/lib/predictions/store';
import { extractPredictionsFromProView } from '@/lib/predictions/from-pro-view';
import { trackProductEvent } from '@/lib/product-analytics';

const CAT_LABEL: Record<string, string> = {
  career: '事业',
  wealth: '财富',
  marriage: '关系',
  health: '健康',
  timing: '时序',
};

/** 默认报告内：可验证预测 + 回访入口；空时从报告结构种子生成 */
export default function ProPredictionsStrip({
  reportId,
  view,
}: {
  reportId: string;
  view?: ProReportView | null;
}) {
  const [items, setItems] = useState<Prediction[]>([]);
  const [seeded, setSeeded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await hydratePredictionsFromServer();
      if (cancelled) return;

      let list = getPredictionsForReport(reportId);
      if (!list.length && view) {
        const seeds = extractPredictionsFromProView(view, reportId);
        if (seeds.length) {
          savePredictions(seeds);
          list = getPredictionsForReport(reportId);
          if (!cancelled) {
            setSeeded(true);
            trackProductEvent('mass_prediction_seed_shown', {
              reportId,
              count: seeds.length,
            });
          }
        }
      }
      if (!cancelled) {
        setItems(list.slice(0, 4));
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reportId, view]);

  return (
    <section id="pro-predictions" className="scroll-mt-header border-y border-[color:var(--hairline)] py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-[14px] font-semibold text-[color:var(--ink-1)]">可验证预测</h2>
          <p className="mt-0.5 text-[12px] text-[color:var(--ink-5)]">
            {seeded
              ? '已从本报告结构生成种子预测；到期回来打分即可校准'
              : '到期回来打分，判断会更贴近你的现实'}
          </p>
        </div>
        <Link
          href={`/predictions?reportId=${encodeURIComponent(reportId)}`}
          className="text-[12px] text-[color:var(--ink-3)] underline-offset-2 hover:text-[color:var(--ink-1)] hover:underline"
        >
          全部 / 回访
        </Link>
      </div>

      {loading ? (
        <p className="mt-3 text-[12px] text-[color:var(--ink-5)]">加载预测…</p>
      ) : items.length ? (
        <ul className="mt-3 divide-y divide-[color:var(--hairline)] border-t border-[color:var(--hairline)]">
          {items.map((p) => (
            <li key={p.id} className="py-2.5 text-[12px] leading-[1.55] text-[color:var(--ink-2)]">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[11px] text-[color:var(--ink-5)]">
                <span>{CAT_LABEL[p.category] || p.category}</span>
                {p.window ? <span>· {p.window}</span> : null}
                <span className="font-mono">到期 {p.dueDate}</span>
              </div>
              <p className="mt-1 text-[13px] text-[color:var(--ink-1)]">{p.statement}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-[12px] leading-[1.55] text-[color:var(--ink-5)]">
          暂无已同步预测。可先做
          <Link
            href={`/dimensions/fortune-rhythm?reportId=${encodeURIComponent(reportId)}`}
            className="mx-1 text-[color:var(--ink-2)] underline-offset-2 hover:underline"
          >
            运势节奏
          </Link>
          或
          <Link
            href={`/dimensions/career-industry?reportId=${encodeURIComponent(reportId)}`}
            className="mx-1 text-[color:var(--ink-2)] underline-offset-2 hover:underline"
          >
            工作行业
          </Link>
          深挖。
        </p>
      )}

      {items.length ? (
        <p className="mt-2 text-[11px] text-[color:var(--ink-5)]">
          在
          <Link href="/predictions" className="mx-0.5 text-[color:var(--ink-3)] underline-offset-2 hover:underline">
            预测回访
          </Link>
          标记命中；也可在
          <Link
            href={`/events?reportId=${encodeURIComponent(reportId)}`}
            className="mx-0.5 text-[color:var(--ink-3)] underline-offset-2 hover:underline"
          >
            事件本
          </Link>
          记录现实结果。
        </p>
      ) : null}
    </section>
  );
}
