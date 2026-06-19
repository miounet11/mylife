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
    <section className="fb-card mt-10 overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-[color:var(--fb-border)] bg-white px-4 py-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="fb-section-title inline-flex items-center gap-1.5">
            <FileQuestion className="h-3.5 w-3.5 text-[color:var(--fb-blue)]" />
            公开内容流
          </div>
          <h2 className="mt-1.5 text-[18px] font-bold leading-tight text-[color:var(--fb-ink-1)]">{title}</h2>
          <p className="mt-1.5 max-w-2xl text-[13px] leading-[1.5] text-[color:var(--fb-ink-2)]">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/reports"
            className="fb-btn inline-flex items-center gap-1.5 px-3"
          >
            查看全部公开内容
          </Link>
          <Link
            href="/analyze"
            className="fb-btn fb-btn-primary inline-flex items-center gap-1.5 px-4"
          >
            生成我的判断
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
        {reports.length > 0 ? (
          <div className="border-b border-[color:var(--fb-border)] p-3 lg:border-b-0 lg:border-r">
            <div className="mb-2 flex items-center gap-2 text-[13px] font-bold text-[color:var(--fb-ink-1)]">
              <Layers3 className="h-4 w-4 text-[color:var(--fb-blue)]" />
              相关匿名报告
            </div>
            <div className="divide-y divide-[color:var(--fb-border)] border border-[color:var(--fb-border)] bg-white">
              {reports.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="group block px-3 py-2.5 hover:bg-[color:var(--fb-action-bg)] hover:no-underline"
                >
                  <div className="flex flex-wrap gap-1.5 text-xs font-semibold text-[color:var(--fb-ink-2)]">
                    <span className="fb-tag-static">{item.patternType}</span>
                    <span className="fb-tag-static">{item.dayMaster}</span>
                  </div>
                  <h3 className="mt-1.5 line-clamp-2 text-[13px] font-bold leading-[1.45] text-[color:var(--fb-ink-1)] group-hover:text-[color:var(--fb-blue-link)]">
                    {item.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-[12px] leading-[1.5] text-[color:var(--fb-ink-2)]">{item.description}</p>
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        {questions.length > 0 ? (
          <div className="p-3">
            <div className="mb-2 flex items-center gap-2 text-[13px] font-bold text-[color:var(--fb-ink-1)]">
              <FileQuestion className="h-4 w-4 text-[color:var(--fb-blue)]" />
              相关公开追问
            </div>
            <div className="divide-y divide-[color:var(--fb-border)] border border-[color:var(--fb-border)] bg-white">
              {questions.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="group block px-3 py-2.5 hover:bg-[color:var(--fb-action-bg)] hover:no-underline"
                >
                  <div className="fb-tag-static inline-flex">
                    {item.contextLabel}
                  </div>
                  <h3 className="mt-1.5 line-clamp-2 text-[13px] font-bold leading-[1.45] text-[color:var(--fb-ink-1)] group-hover:text-[color:var(--fb-blue-link)]">
                    {item.question}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-[12px] leading-[1.5] text-[color:var(--fb-ink-2)]">{item.answerSummary}</p>
                  {item.reportHref ? (
                    <div className="mt-1.5 text-xs font-semibold text-[color:var(--fb-blue-link)]">有关联匿名报告 →</div>
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
