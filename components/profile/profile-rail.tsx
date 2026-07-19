import Link from 'next/link';
import { ArrowRight, CalendarClock, MessageSquareText, Settings2, Sparkles } from 'lucide-react';
import { profilePageCopy } from '@/lib/i18n/profile-copy';
import type { SiteLocale } from '@/lib/i18n/site-locale';

export function ProfileRailRight({
  latestReportHref,
  chatHref,
  settingsHref,
  hasReport,
  locale = 'zh-CN',
}: {
  latestReportHref: string;
  chatHref: string;
  settingsHref: string;
  hasReport: boolean;
  locale?: SiteLocale;
}) {
  const copy = profilePageCopy(locale).rail;

  return (
    <div className="space-y-3">
      <section className="fb-card p-3.5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[color:var(--ink-4)]">
          {copy.quickResume}
        </div>
        <div className="mt-2.5 space-y-1">
          <Link
            href={latestReportHref}
            className="flex items-center justify-between rounded-[var(--radius)] px-2 py-1.5 text-[13px] font-medium text-[color:var(--brand)] transition hover:bg-[color:var(--bg-sunken)] hover:no-underline"
          >
            {hasReport ? copy.openLatestReport : copy.startFirstAnalyze}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href={chatHref}
            className="flex items-center gap-1.5 rounded-[var(--radius)] px-2 py-1.5 text-[13px] font-medium text-[color:var(--ink-3)] transition hover:bg-[color:var(--bg-sunken)] hover:text-[color:var(--ink-1)] hover:no-underline"
          >
            <MessageSquareText className="h-3.5 w-3.5" strokeWidth={1.75} />
            {hasReport ? copy.openWithReport : copy.askConsultant}
          </Link>
          <Link
            href={settingsHref}
            className="flex items-center gap-1.5 rounded-[var(--radius)] px-2 py-1.5 text-[13px] font-medium text-[color:var(--ink-3)] transition hover:bg-[color:var(--bg-sunken)] hover:text-[color:var(--ink-1)] hover:no-underline"
          >
            <Settings2 className="h-3.5 w-3.5" strokeWidth={1.75} />
            {copy.editChartDetails}
          </Link>
        </div>
      </section>

      <section className="fb-card p-3.5">
        <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[color:var(--ink-1)]">
          <CalendarClock className="h-3.5 w-3.5 text-[color:var(--ink-3)]" strokeWidth={1.75} />
          {copy.verifyAndTools}
        </div>
        <div className="mt-2.5 space-y-1">
          <Link
            href="/events"
            className="block rounded-[var(--radius)] px-2 py-1.5 text-[13px] font-medium text-[color:var(--ink-3)] transition hover:bg-[color:var(--bg-sunken)] hover:text-[color:var(--ink-1)] hover:no-underline"
          >
            {copy.eventCalendar}
          </Link>
          <Link
            href="/tools"
            className="block rounded-[var(--radius)] px-2 py-1.5 text-[13px] font-medium text-[color:var(--ink-3)] transition hover:bg-[color:var(--bg-sunken)] hover:text-[color:var(--ink-1)] hover:no-underline"
          >
            {copy.toolsCenter}
          </Link>
        </div>
      </section>

      <Link
        href="/learn"
        className="fb-card flex items-center gap-2.5 p-3.5 text-[13px] font-medium text-[color:var(--ink-2)] transition hover:border-[color:var(--hairline-strong)] hover:no-underline"
      >
        <Sparkles className="h-4 w-4 text-[color:var(--brand)]" strokeWidth={1.75} />
        {copy.deepLearnMap}
        <ArrowRight className="ml-auto h-3.5 w-3.5 text-[color:var(--ink-4)]" />
      </Link>
    </div>
  );
}
