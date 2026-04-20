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
      card: 'border-emerald-200 bg-emerald-50/70',
      chip: 'bg-emerald-100 text-emerald-800',
    };
  }
  if (item.statusLabel === '准备') {
    return {
      card: 'border-sky-200 bg-sky-50/70',
      chip: 'bg-sky-100 text-sky-800',
    };
  }
  if (item.statusLabel === '回看') {
    return {
      card: 'border-rose-200 bg-rose-50/70',
      chip: 'bg-rose-100 text-rose-800',
    };
  }
  if (item.status === 'caution') {
    return {
      card: 'border-amber-200 bg-amber-50/70',
      chip: 'bg-amber-100 text-amber-900',
    };
  }
  return {
    card: 'border-[color:var(--line)] bg-white/84',
    chip: 'bg-slate-100 text-[color:var(--muted)]',
  };
}

export default function ReportRhythmTimeline({ section }: ReportRhythmTimelineProps) {
  const items = (section.items || []).slice(0, 12);

  return (
    <section className="soft-card rounded-[1.75rem] p-5" aria-label="未来十二个月节奏板">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">节奏时间板</div>
          <h3 className="mt-2 text-lg font-bold text-[color:var(--ink)]">
            {compactCopy(section.headline, 34) || '未来 12 个月节奏板'}
          </h3>
        </div>
      </div>

      {section.summary ? (
        <p className="mt-2 text-xs leading-6 text-[color:var(--muted)]">{compactCopy(section.summary, 86)}</p>
      ) : null}

      {items.length > 0 ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3" role="list" aria-label="每月节奏项">
          {items.map((item) => {
            const tone = statusTone(item);
            return (
              <article key={`${item.label}-${item.theme}`} role="listitem" className={`rounded-[1.2rem] border px-4 py-4 ${tone.card}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-[color:var(--ink)]">{compactCopy(item.label, 14) || '本月'}</div>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone.chip}`}>
                    {compactCopy(item.statusLabel, 8) || '稳住'}
                  </span>
                </div>
                <div className="mt-2 text-sm font-semibold leading-6 text-[color:var(--ink)]">
                  {compactCopy(item.theme, 30) || '先聚焦一个关键主题。'}
                </div>
                {item.reason ? (
                  <div className="mt-2 text-xs leading-6 text-[color:var(--muted)]">
                    {compactCopy(item.reason, 48)}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-xs leading-6 text-[color:var(--muted)]">
          暂无月度节奏项，先按当前阶段主线执行最小可验证动作。
        </div>
      )}
    </section>
  );
}
