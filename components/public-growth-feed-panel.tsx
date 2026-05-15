import Link from 'next/link';
import { ArrowRight, FileQuestion, Layers3 } from 'lucide-react';
import {
  listPublicQuestionFeedItems,
  listPublicReportFeedItems,
  type PublicQuestionFeedItem,
  type PublicReportFeedItem,
} from '@/lib/public-growth-feed';

interface PublicGrowthFeedPanelProps {
  title?: string;
  description?: string;
  signals?: string[];
  reportLimit?: number;
  questionLimit?: number;
}

function normalize(value: string) {
  return value.toLowerCase().trim();
}

function hasSignal(text: string, signals: string[]) {
  const normalizedText = normalize(text);
  return signals.some((signal) => {
    const normalizedSignal = normalize(signal);
    return normalizedSignal.length >= 2 && normalizedText.includes(normalizedSignal);
  });
}

function selectRelated<T>(items: T[], signals: string[], limit: number, getText: (item: T) => string) {
  const related = signals.length > 0
    ? items.filter((item) => hasSignal(getText(item), signals))
    : [];
  return (related.length > 0 ? related : items).slice(0, limit);
}

export default function PublicGrowthFeedPanel({
  title = '相关公开查询',
  description = '这里展示真实匿名问题和相关公开报告，你可以顺着别人的场景继续生成自己的判断。',
  signals = [],
  reportLimit = 3,
  questionLimit = 4,
}: PublicGrowthFeedPanelProps) {
  const cleanSignals = Array.from(new Set(signals.map((item) => item.trim()).filter(Boolean))).slice(0, 24);
  const reports = selectRelated<PublicReportFeedItem>(
    listPublicReportFeedItems(Math.max(reportLimit * 4, 12)),
    cleanSignals,
    reportLimit,
    (item) => [item.title, item.description, item.patternType, item.dayMaster].join(' '),
  );
  const questions = selectRelated<PublicQuestionFeedItem>(
    listPublicQuestionFeedItems(Math.max(questionLimit * 4, 16)),
    cleanSignals,
    questionLimit,
    (item) => [item.question, item.contextLabel, item.answerSummary, item.reportSummary].join(' '),
  );

  if (reports.length === 0 && questions.length === 0) {
    return null;
  }

  return (
    <section className="mt-10 rounded-[var(--radius-lg)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-5 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--signal-strong)]">
            <FileQuestion className="h-3.5 w-3.5" />
            公开内容流
          </div>
          <h2 className="mt-2 text-xl font-black text-[color:var(--ink-1)]">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--ink-4)]">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/reports"
            className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--bg-elevated)] px-3 text-sm font-semibold text-[color:var(--ink-3)] hover:border-[color:var(--brand)]"
          >
            查看全部公开内容
          </Link>
          <Link
            href="/analyze"
            className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] bg-[color:var(--brand-strong)] px-4 text-sm font-semibold text-white hover:bg-[color:var(--brand-deep)]"
          >
            生成我的判断
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        {reports.length > 0 ? (
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-black text-[color:var(--ink-1)]">
              <Layers3 className="h-4 w-4 text-[color:var(--brand-strong)]" />
              相关匿名报告
            </div>
            <div className="grid gap-3">
              {reports.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="group rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-4 transition hover:border-[color:var(--brand)]"
                >
                  <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold text-[color:var(--ink-4)]">
                    <span className="rounded-full bg-[color:var(--paper)] px-2 py-0.5">{item.patternType}</span>
                    <span className="rounded-full bg-[color:var(--paper)] px-2 py-0.5">{item.dayMaster}</span>
                  </div>
                  <h3 className="mt-2 line-clamp-2 text-sm font-black leading-6 text-[color:var(--ink-1)] group-hover:text-[color:var(--brand-strong)]">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-[color:var(--ink-4)]">{item.description}</p>
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        {questions.length > 0 ? (
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-black text-[color:var(--ink-1)]">
              <FileQuestion className="h-4 w-4 text-[color:var(--brand-strong)]" />
              相关公开追问
            </div>
            <div className="grid gap-3">
              {questions.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="group rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-4 transition hover:border-[color:var(--brand)]"
                >
                  <div className="inline-flex rounded-full bg-[color:var(--paper)] px-2 py-0.5 text-[11px] font-semibold text-[color:var(--ink-4)]">
                    {item.contextLabel}
                  </div>
                  <h3 className="mt-2 line-clamp-2 text-sm font-black leading-6 text-[color:var(--ink-1)] group-hover:text-[color:var(--brand-strong)]">
                    {item.question}
                  </h3>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-[color:var(--ink-4)]">{item.answerSummary}</p>
                  {item.reportHref ? (
                    <div className="mt-2 text-[11px] font-semibold text-[color:var(--brand-strong)]">有关联匿名报告 →</div>
                  ) : null}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
