import type { ReportActionBoardSection } from '@/lib/report-types';
import { presentReportLines, presentReportText } from '@/lib/report-presentation';
import {
  reportActionBoardCopy,
  resolveReportChromeLocale,
} from '@/lib/i18n/report-chrome-copy';

interface ReportActionBoardProps {
  section: ReportActionBoardSection;
  /** UI locale — English chrome when en; default zh-CN */
  locale?: string | null;
}

type Lane = {
  key: string;
  label: string;
  sub: string;
  items: string[];
  tone: 'now' | 'd30' | 'd90' | 'avoid';
};

const TONE_STYLES: Record<
  Lane['tone'],
  { bar: string; badge: string; card: string }
> = {
  now: {
    bar: 'border-l-[3px] border-l-[color:var(--data-up)]',
    badge: 'bg-[rgba(47,125,82,0.12)] text-[color:var(--data-up)]',
    card: 'bg-[rgba(47,125,82,0.04)]',
  },
  d30: {
    bar: 'border-l-[3px] border-l-[color:var(--env)]',
    badge: 'bg-[color:var(--env-soft)] text-[color:var(--env)]',
    card: 'bg-[color:var(--env-soft)]/40',
  },
  d90: {
    bar: 'border-l-[3px] border-l-[color:var(--ink-4)]',
    badge: 'bg-[color:var(--bg-elevated)] text-[color:var(--ink-3)]',
    card: 'bg-[color:var(--bg-elevated)]/60',
  },
  avoid: {
    bar: 'border-l-[3px] border-l-[color:var(--alert)]',
    badge: 'bg-[color:var(--alert-soft)] text-[color:var(--alert)]',
    card: 'bg-[color:var(--alert-soft)]/50',
  },
};

export default function ReportActionBoard({ section, locale }: ReportActionBoardProps) {
  const copy = reportActionBoardCopy(resolveReportChromeLocale(locale));
  const lanes: Lane[] = [
    {
      key: 'now',
      label: copy.laneNow,
      sub: 'NOW',
      items: presentReportLines(section.now, { limit: 3, maxLen: 96 }),
      tone: 'now',
    },
    {
      key: 'd30',
      label: copy.lane30,
      sub: '30D',
      items: presentReportLines(section.next30Days, { limit: 3, maxLen: 96 }),
      tone: 'd30',
    },
    {
      key: 'd90',
      label: copy.lane90,
      sub: '90D',
      items: presentReportLines(section.next90Days, { limit: 3, maxLen: 96 }),
      tone: 'd90',
    },
    {
      key: 'avoid',
      label: copy.laneAvoid,
      sub: 'AVOID',
      items: presentReportLines(section.avoidList, { limit: 3, maxLen: 96 }),
      tone: 'avoid',
    },
  ].map((lane) => ({
    ...lane,
    items:
      lane.items.length > 0
        ? lane.items
        : [lane.key === 'avoid' ? copy.emptyAvoid : copy.emptyDefault],
  }));

  const focusSummary = presentReportText(section.focusSummary, 140);

  return (
    <section
      className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4 md:p-5"
      aria-label={copy.ariaLabel}
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[color:var(--brand-strong)]">
            {copy.eyebrow}
          </div>
          <h3 className="mt-1 text-[16px] font-bold leading-snug text-[color:var(--ink-1)] md:text-[18px]">
            {copy.title}
          </h3>
        </div>
      </div>

      {focusSummary ? (
        <p className="mt-2 max-w-3xl text-[13px] leading-[1.6] text-[color:var(--ink-3)]">
          {focusSummary}
        </p>
      ) : null}

      {/* 行式布局：左侧时间标签 + 右侧完整横排中文，杜绝竖排挤字 */}
      <div className="mt-4 space-y-2.5">
        {lanes.map((lane) => {
          const tone = TONE_STYLES[lane.tone];
          return (
            <article
              key={lane.key}
              className={`rounded-[var(--radius)] border border-[color:var(--hairline)] ${tone.card} ${tone.bar} px-3 py-3 md:px-4`}
            >
              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:gap-4">
                <div className="sm:w-[88px] sm:shrink-0">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-bold ${tone.badge}`}
                  >
                    <span className="font-mono text-[10px] opacity-80">{lane.sub}</span>
                    {lane.label}
                  </span>
                </div>
                <ul className="min-w-0 flex-1 space-y-1.5">
                  {lane.items.map((item, index) => (
                    <li
                      key={`${lane.key}-${index}`}
                      className="flex gap-2 text-[13px] leading-[1.65] text-[color:var(--ink-1)]"
                    >
                      <span
                        className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--ink-4)]"
                        aria-hidden
                      />
                      <span className="min-w-0 break-words [overflow-wrap:anywhere]">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
