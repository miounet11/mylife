'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import type { ProReportView } from '@/lib/report-pro-view';
import { buildReportLearningPath } from '@/lib/report-learning-path';
import type { KnowledgeNode } from '@/lib/knowledge-ladder';
import { trackProductEvent } from '@/lib/product-analytics';

/**
 * 报告内相关阅读（用户只看到推荐内容，不暴露内部阶梯/运营逻辑）
 */
export default function ProLearningPath({
  view,
  reportId,
}: {
  view: ProReportView;
  reportId: string;
}) {
  const path = useMemo(() => buildReportLearningPath(view, { reportId }), [view, reportId]);

  return (
    <section id="pro-learn" className="scroll-mt-header border-y border-[color:var(--hairline)] py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-[14px] font-semibold text-[color:var(--ink-1)]">相关阅读</h2>
          <p className="mt-0.5 text-[12px] text-[color:var(--ink-5)]">结合本盘用神与议题挑选</p>
        </div>
        <Link
          href={`/learn?source=report:${encodeURIComponent(reportId)}`}
          onClick={() => trackProductEvent('mass_learn_path_click', { reportId, target: 'map' })}
          className="text-[12px] text-[color:var(--ink-3)] underline-offset-2 hover:text-[color:var(--ink-1)] hover:underline"
        >
          更多专题
        </Link>
      </div>

      <ul className="mt-2 divide-y divide-[color:var(--hairline)] border-t border-[color:var(--hairline)]">
        {path.recommended.map((node) => (
          <NodeRow key={node.id} node={node} reportId={reportId} />
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
        <Link
          href={`/learn/intro?source=report:${encodeURIComponent(reportId)}`}
          onClick={() => trackProductEvent('mass_learn_path_click', { reportId, target: 'intro' })}
          className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
        >
          入门专题
        </Link>
        {path.focusTopicKey ? (
          <Link
            href={`/learn/${path.focusTopicKey === 'marriage' ? 'relationship' : path.focusTopicKey}?source=report:${encodeURIComponent(reportId)}`}
            onClick={() =>
              trackProductEvent('mass_learn_path_click', {
                reportId,
                target: path.focusTopicKey || 'topic',
              })
            }
            className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
          >
            相关专题
          </Link>
        ) : null}
        <Link
          href={`/predictions?reportId=${encodeURIComponent(reportId)}`}
          className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
        >
          预测回访
        </Link>
      </div>
    </section>
  );
}

function NodeRow({ node, reportId }: { node: KnowledgeNode; reportId: string }) {
  return (
    <li>
      <Link
        href={`${node.href}${node.href.includes('?') ? '&' : '?'}source=report:${encodeURIComponent(reportId)}`}
        onClick={() =>
          trackProductEvent('mass_learn_path_click', { reportId, target: node.id, level: node.level })
        }
        className="flex items-baseline justify-between gap-3 py-2.5 no-underline hover:no-underline"
      >
        <span className="text-[13px] text-[color:var(--ink-1)] hover:underline">{node.title}</span>
        {node.readMinutes ? (
          <span className="shrink-0 text-[11px] text-[color:var(--ink-5)]">约 {node.readMinutes} 分</span>
        ) : null}
      </Link>
    </li>
  );
}
