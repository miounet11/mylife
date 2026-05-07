import type { ReportTimelineSection } from '@/lib/report-types';

interface ReportRhythmTimelineProps {
  section: ReportTimelineSection;
}

function compactCopy(value?: string, maxLength = 52) {
  const normalized = `${value || ''}`.replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trim()}…`;
}

function statusTone(item: ReportTimelineSection['items'][number]) {
  if (item.status === 'push') {
    return {
      card: 'border-[rgba(47,125,82,0.20)] bg-[rgba(47,125,82,0.06)]',
      chip: 'border-[color:var(--data-up)] bg-[rgba(47,125,82,0.10)] text-[color:var(--data-up)]',
    };
  }
  if (item.statusLabel === '准备') {
    return {
      card: 'border-[color:var(--env)] bg-[color:var(--env-soft)]',
      chip: 'border-[color:var(--env)] bg-[color:var(--paper)] text-[color:var(--env)]',
    };
  }
  if (item.statusLabel === '回看') {
    return {
      card: 'border-[color:var(--alert)] bg-[color:var(--alert-soft)]',
      chip: 'border-[color:var(--alert)] bg-[color:var(--paper)] text-[color:var(--alert)]',
    };
  }
  if (item.status === 'caution') {
    return {
      card: 'border-[color:var(--signal)] bg-[color:var(--signal-soft)]',
      chip: 'border-[color:var(--signal)] bg-[color:var(--paper)] text-[color:var(--signal-strong)]',
    };
  }
  return {
    card: 'border-[color:var(--hairline)] bg-[color:var(--bg-elevated)]',
    chip: 'border-[color:var(--hairline)] bg-[color:var(--paper)] text-[color:var(--ink-4)]',
  };
}

export default function ReportRhythmTimeline({ section }: ReportRhythmTimelineProps) {
  const items = (section.items || []).slice(0, 12);

  return (
    <section
      className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-5"
      aria-label="未来十二个月节奏板"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[color:var(--brand-strong)]">
            节奏时间板
          </div>
          <h3 className="mt-1.5 text-base font-black leading-snug text-[color:var(--ink-1)] md:text-lg">
            {compactCopy(section.headline, 34) || '未来 12 个月节奏板'}
          </h3>
        </div>
      </div>

      {section.summary ? (
        <p className="mt-2 text-xs leading-5 text-[color:var(--ink-4)]">
          {compactCopy(section.summary, 86)}
        </p>
      ) : null}

      {items.length > 0 ? (
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3" role="list" aria-label="每月节奏项">
          {items.map((item) => {
            const tone = statusTone(item);
            return (
              <article
                key={`${item.label}-${item.theme}`}
                role="listitem"
                className={`rounded-[var(--radius)] border px-3 py-3 ${tone.card}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-mono text-sm font-bold tabular-nums text-[color:var(--ink-1)]">
                    {compactCopy(item.label, 14) || '本月'}
                  </div>
                  <span
                    className={`inline-flex h-5 items-center rounded-[var(--radius-sm)] border px-1.5 font-mono text-[10px] font-bold uppercase tracking-wider ${tone.chip}`}
                  >
                    {compactCopy(item.statusLabel, 8) || '稳住'}
                  </span>
                </div>
                <div className="mt-2 text-xs font-bold leading-5 text-[color:var(--ink-2)]">
                  {compactCopy(item.theme, 30) || '先聚焦一个关键主题。'}
                </div>
                {item.reason ? (
                  <div className="mt-1.5 text-[10px] leading-4 text-[color:var(--ink-4)]">
                    {compactCopy(item.reason, 48)}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-3 py-2.5 text-xs leading-5 text-[color:var(--ink-4)]">
          暂无月度节奏项，先按当前阶段主线执行最小可验证动作。
        </div>
      )}
    </section>
  );
}
