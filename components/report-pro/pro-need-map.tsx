'use client';

import Link from 'next/link';
import { NEED_MAP, buildDimensionHref, type NeedStatus } from '@/lib/need-map';
import { trackProductEvent } from '@/lib/product-analytics';

const STATUS_LABEL: Record<NeedStatus, string> = {
  covered: '可闭环',
  partial: '可深挖',
  building: '已上线',
  out_of_scope: '边界外',
};

/** 人生问题地图 — 文字列表 */
export default function ProNeedMap({
  reportId,
  hehunHref,
}: {
  reportId: string;
  hehunHref?: string;
}) {
  const a = NEED_MAP.filter((n) => n.tier === 'A');
  const b = NEED_MAP.filter((n) => n.tier === 'B');
  const d = NEED_MAP.filter((n) => n.tier === 'D');

  return (
    <section id="pro-need-map" className="scroll-mt-header border-y border-[color:var(--hairline)] py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-[14px] font-semibold text-[color:var(--ink-1)]">人生问题地图</h2>
          <p className="mt-0.5 text-[12px] text-[color:var(--ink-5)]">
            哪些能闭环 · 哪些需深挖 · 哪些明确不做
          </p>
        </div>
        <Link
          href={`/predictions?reportId=${encodeURIComponent(reportId)}`}
          className="text-[12px] text-[color:var(--ink-3)] underline-offset-2 hover:text-[color:var(--ink-1)] hover:underline"
        >
          预测回访
        </Link>
      </div>

      <Block title="主路径" items={a} reportId={reportId} hehunHref={hehunHref} />
      <Block title="场景深挖" items={b} reportId={reportId} hehunHref={hehunHref} />
      <div className="mt-3 border-t border-[color:var(--hairline)] pt-3">
        <div className="text-[11px] font-medium text-[color:var(--ink-5)]">明确边界</div>
        <div className="mt-1.5 text-[12px] text-[color:var(--ink-5)]">
          {d.map((item) => item.title).join(' · ')}
        </div>
        <p className="mt-1 text-[11px] text-[color:var(--ink-5)]">
          医疗诊断、投资保本、法律胜诉等不在承诺范围。
        </p>
      </div>
    </section>
  );
}

function Block({
  title,
  items,
  reportId,
  hehunHref,
}: {
  title: string;
  items: typeof NEED_MAP;
  reportId: string;
  hehunHref?: string;
}) {
  return (
    <div className="mt-3">
      <div className="text-[11px] font-medium text-[color:var(--ink-5)]">{title}</div>
      <ul className="mt-1 divide-y divide-[color:var(--hairline)] border-t border-[color:var(--hairline)]">
        {items.map((item) => {
          const href =
            item.href?.startsWith('#')
              ? item.href
              : item.id === 'hehun' && hehunHref
                ? hehunHref
                : item.href === '/predictions' || item.href === '/events'
                  ? `${item.href}?reportId=${encodeURIComponent(reportId)}`
                  : item.dimensionSlug
                    ? buildDimensionHref(item.dimensionSlug, reportId)
                    : item.href || '#pro-decision';

          return (
            <li key={item.id}>
              <Link
                href={href}
                onClick={() =>
                  trackProductEvent('mass_need_map_click', {
                    reportId,
                    needId: item.id,
                    tier: item.tier,
                    status: item.status,
                  })
                }
                className="flex items-baseline justify-between gap-3 py-2.5 no-underline hover:no-underline"
              >
                <span className="min-w-0">
                  <span className="text-[13px] text-[color:var(--ink-1)] hover:underline">{item.title}</span>
                  <span className="mt-0.5 block text-[11px] text-[color:var(--ink-5)]">{item.question}</span>
                </span>
                <span className="shrink-0 text-[11px] text-[color:var(--ink-5)]">
                  {STATUS_LABEL[item.status]}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
