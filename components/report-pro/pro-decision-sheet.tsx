'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { DecisionSheet } from '@/lib/report-decision-sheet';
import { formatDecisionSheetPlain } from '@/lib/report-decision-sheet';
import { buildReportContinueChatHref } from '@/lib/chat-entry';
import KnowledgeBaseStamp from '@/components/knowledge-base-stamp';
import { trackProductEvent } from '@/lib/product-analytics';

/** 普通人首屏：30 秒决策一页通 + 复制/打印 */
export default function ProDecisionSheet({
  sheet,
  reportId,
  birthTimeUncertain = false,
  publicName,
}: {
  sheet: DecisionSheet;
  reportId: string;
  birthTimeUncertain?: boolean;
  publicName?: string;
}) {
  const [copied, setCopied] = useState(false);
  const continueHref = buildReportContinueChatHref({
    reportId,
    teacher: 'overview',
    source: `report:${reportId}:decision-sheet:opening`,
  });

  async function copyPlain() {
    const text = formatDecisionSheetPlain(sheet, { name: publicName, reportId });
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      trackProductEvent('mass_decision_copied', { reportId });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  function printSheet() {
    if (typeof window === 'undefined') return;
    trackProductEvent('mass_decision_printed', { reportId });
    document.body.classList.add('print-decision-only');
    const cleanup = () => {
      document.body.classList.remove('print-decision-only');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
    setTimeout(cleanup, 1500);
  }

  return (
    <section
      id="pro-decision"
      className="pro-decision-print-root scroll-mt-header border-y border-[color:var(--hairline)]"
    >
      <style>{`
        @media print {
          body.print-decision-only * { visibility: hidden !important; }
          body.print-decision-only .pro-decision-print-root,
          body.print-decision-only .pro-decision-print-root * { visibility: visible !important; }
          body.print-decision-only .pro-decision-print-root {
            position: absolute; left: 0; top: 0; width: 100%;
            border: none !important; box-shadow: none !important;
          }
          body.print-decision-only .no-print { display: none !important; }
        }
      `}</style>

      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[color:var(--hairline)] py-3">
        <div>
          <div className="text-[12px] font-medium text-[color:var(--ink-5)]">决策一页通</div>
          <div className="mt-0.5 text-[14px] font-semibold text-[color:var(--ink-1)]">
            {publicName ? `${publicName} · ` : ''}综合 {sheet.overallScore10}/10
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
          <KnowledgeBaseStamp />
          <div className="no-print flex flex-wrap gap-x-3">
            <button
              type="button"
              onClick={() => void copyPlain()}
              className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
            >
              {copied ? '已复制' : '复制摘要'}
            </button>
            <button
              type="button"
              onClick={printSheet}
              className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
            >
              打印 / PDF
            </button>
          </div>
        </div>
      </div>

      {birthTimeUncertain ? (
        <div className="border-b border-[color:var(--hairline)] py-2 text-[12px] leading-[1.55] text-[color:var(--ink-5)]">
          <span className="text-[color:var(--ink-3)]">时辰不确定：</span>
          已降低婚期、流时等短窗口表述的确定性。结构与大运仍可参考。
        </div>
      ) : null}

      <div className="grid gap-0 md:grid-cols-2">
        <Cell label="① 我是怎样的结构" body={sheet.structureLine} why={sheet.whyStructure} />
        <Cell label="② 现在处在什么阶段" body={sheet.stageLine} why={sheet.whyStage} />
        <Cell label="③ 未来 30 天怎么做" list={sheet.next30Days} />
        <Cell label="④ 风险与不宜" list={sheet.risks} />
      </div>

      {sheet.howToRead ? (
        <div className="border-t border-[color:var(--hairline)] py-2.5 text-[12px] leading-[1.55] text-[color:var(--ink-5)]">
          <span className="text-[color:var(--ink-3)]">怎么读：</span>
          {sheet.howToRead}
        </div>
      ) : null}

      <div className="flex flex-col gap-2 border-t border-[color:var(--hairline)] py-3 sm:flex-row sm:items-baseline sm:justify-between">
        <p className="text-[12px] text-[color:var(--ink-5)]">
          <span className="text-[color:var(--ink-3)]">下次回来：</span>
          {sheet.revisitWhen}
        </p>
        <div className="no-print flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
          <Link
            href={`/predictions?reportId=${encodeURIComponent(reportId)}`}
            className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
          >
            预测回访
          </Link>
          <Link
            href={`/events?reportId=${encodeURIComponent(reportId)}`}
            className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
          >
            事件本
          </Link>
          <Link href={continueHref} className="text-[color:var(--ink-1)] underline-offset-2 hover:underline">
            继续问
          </Link>
        </div>
      </div>
    </section>
  );
}

function Cell({
  label,
  body,
  list,
  why,
}: {
  label: string;
  body?: string;
  list?: string[];
  why?: string;
}) {
  return (
    <div className="border-b border-[color:var(--hairline)] py-3.5 md:border-r md:px-4 md:first:pl-0 md:odd:pr-4 md:even:pl-4 md:even:border-r-0">
      <div className="text-[11px] font-medium text-[color:var(--ink-5)]">{label}</div>
      {body ? (
        <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-[1.65] text-[color:var(--ink-1)]">
          {body}
        </p>
      ) : null}
      {why ? (
        <p className="mt-1.5 text-[12px] leading-[1.55] text-[color:var(--ink-5)]">
          <span className="text-[color:var(--ink-3)]">为什么：</span>
          {why}
        </p>
      ) : null}
      {list?.length ? (
        <ul className="mt-1.5 space-y-1">
          {list.map((item) => (
            <li key={item} className="text-[13px] leading-[1.55] text-[color:var(--ink-2)]">
              · {item}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
