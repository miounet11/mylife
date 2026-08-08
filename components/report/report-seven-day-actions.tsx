import React from 'react';
import Link from 'next/link';
import { CheckCircle2, MessageSquareText } from 'lucide-react';
import { buildReportContinueChatHref } from '@/lib/chat-entry';

export type ReportSevenDayActionsProps = {
  reportId: string;
  /** Structured 7-day actions from analysis.sevenDayActions */
  actions?: string[] | null;
  /** Fallback: parse from summary/explanation when structured field missing (legacy reports) */
  summaryText?: string | null;
  /** Optional locale for chrome (zh default) */
  locale?: string | null;
};

function normalizeActions(actions?: string[] | null): string[] {
  if (!Array.isArray(actions)) return [];
  const out: string[] = [];
  for (const raw of actions) {
    const text = `${raw || ''}`.replace(/\s+/g, ' ').trim();
    if (!text || text.length < 4) continue;
    if (out.some((x) => x === text || x.includes(text) || text.includes(x))) continue;
    out.push(text.length > 96 ? `${text.slice(0, 94)}…` : text);
    if (out.length >= 3) break;
  }
  return out;
}

/** Legacy reports only store the phrase inside summary/explanation */
function parseActionsFromNarrative(text?: string | null): string[] {
  const raw = `${text || ''}`;
  const m = raw.match(/近\s*7\s*天可执行[：:]\s*([^\n]+)/);
  if (!m?.[1]) return [];
  return normalizeActions(
    m[1]
      .split(/[；;]/)
      .map((s) => s.replace(/^[0-9]+[\.、)\s]+/, '').trim())
      .filter(Boolean)
  );
}

/**
 * v6-Q3: Surface executable 7-day actions as a first-class card on the result page.
 * Falls back silently when pipeline has not written analysis.sevenDayActions yet.
 */
export default function ReportSevenDayActions({
  reportId,
  actions,
  summaryText,
  locale,
}: ReportSevenDayActionsProps) {
  const items = (() => {
    const structured = normalizeActions(actions);
    if (structured.length > 0) return structured;
    return parseActionsFromNarrative(summaryText);
  })();
  if (items.length === 0) return null;

  const isEn = `${locale || ''}`.toLowerCase().startsWith('en');
  const title = isEn ? 'Next 7 days — do these first' : '近 7 天可执行';
  const subtitle = isEn
    ? 'Three concrete moves from your chart. Pick one, finish it, then log the result.'
    : '从命盘结构抽出的三件可完成事项。先做一件，做完再回填真实结果。';
  const chatLabel = isEn ? 'Ask how to start' : '问顾问怎么开始';
  const logLabel = isEn ? 'Log an event' : '记录一次事件';

  return (
    <section
      id="seven-day-actions"
      className="scroll-mt-header rounded-[var(--radius-md)] border border-[rgba(47,125,82,0.22)] bg-[rgba(47,125,82,0.06)] p-4 md:p-5"
      aria-label={title}
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[color:var(--data-up)]">
            7D · ACTION
          </div>
          <h3 className="mt-1 text-[16px] font-bold leading-snug text-[color:var(--ink-1)] md:text-[18px]">
            {title}
          </h3>
          <p className="mt-1 max-w-2xl text-[12px] leading-[1.55] text-[color:var(--ink-4)]">
            {subtitle}
          </p>
        </div>
      </div>

      <ol className="mt-4 space-y-2.5">
        {items.map((item, index) => (
          <li
            key={`${index}-${item.slice(0, 24)}`}
            className="flex gap-3 rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--paper)] px-3 py-3"
          >
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[rgba(47,125,82,0.12)] text-[12px] font-bold text-[color:var(--data-up)]">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-2 text-[13px] leading-[1.65] text-[color:var(--ink-1)]">
                <CheckCircle2
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--data-up)] opacity-70"
                  aria-hidden
                />
                <span className="min-w-0 break-words [overflow-wrap:anywhere]">{item}</span>
              </div>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={buildReportContinueChatHref({
            reportId,
            source: 'result_seven_day',
            teacher: 'overview',
          })}
          className="fb-btn fb-btn-primary h-9 px-4 text-[13px] hover:no-underline"
        >
          <MessageSquareText className="h-3.5 w-3.5" />
          {chatLabel}
        </Link>
        <Link
          href={`/events?reportId=${encodeURIComponent(reportId)}`}
          className="fb-btn h-9 px-4 text-[13px] hover:no-underline"
        >
          {logLabel}
        </Link>
      </div>
    </section>
  );
}
