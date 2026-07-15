import Link from 'next/link';
import { ArrowRight, CalendarClock, MessageSquareText, Settings2, Sparkles } from 'lucide-react';

export function ProfileRailRight({
  latestReportHref,
  chatHref,
  settingsHref,
  hasReport,
}: {
  latestReportHref: string;
  chatHref: string;
  settingsHref: string;
  hasReport: boolean;
}) {
  return (
    <div className="space-y-3">
      <section className="fb-card p-3.5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[color:var(--ink-4)]">
          快速恢复
        </div>
        <div className="mt-2.5 space-y-1">
          <Link
            href={latestReportHref}
            className="flex items-center justify-between rounded-[var(--radius)] px-2 py-1.5 text-[13px] font-medium text-[color:var(--brand)] transition hover:bg-[color:var(--bg-sunken)] hover:no-underline"
          >
            {hasReport ? '打开最新报告' : '开始第一次分析'}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href={chatHref}
            className="flex items-center gap-1.5 rounded-[var(--radius)] px-2 py-1.5 text-[13px] font-medium text-[color:var(--ink-3)] transition hover:bg-[color:var(--bg-sunken)] hover:text-[color:var(--ink-1)] hover:no-underline"
          >
            <MessageSquareText className="h-3.5 w-3.5" strokeWidth={1.75} />
            继续追问
          </Link>
          <Link
            href={settingsHref}
            className="flex items-center gap-1.5 rounded-[var(--radius)] px-2 py-1.5 text-[13px] font-medium text-[color:var(--ink-3)] transition hover:bg-[color:var(--bg-sunken)] hover:text-[color:var(--ink-1)] hover:no-underline"
          >
            <Settings2 className="h-3.5 w-3.5" strokeWidth={1.75} />
            编辑测算资料
          </Link>
        </div>
      </section>

      <section className="fb-card p-3.5">
        <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[color:var(--ink-1)]">
          <CalendarClock className="h-3.5 w-3.5 text-[color:var(--ink-3)]" strokeWidth={1.75} />
          验证与工具
        </div>
        <div className="mt-2.5 space-y-1">
          <Link
            href="/events"
            className="block rounded-[var(--radius)] px-2 py-1.5 text-[13px] font-medium text-[color:var(--ink-3)] transition hover:bg-[color:var(--bg-sunken)] hover:text-[color:var(--ink-1)] hover:no-underline"
          >
            事件日历
          </Link>
          <Link
            href="/tools"
            className="block rounded-[var(--radius)] px-2 py-1.5 text-[13px] font-medium text-[color:var(--ink-3)] transition hover:bg-[color:var(--bg-sunken)] hover:text-[color:var(--ink-1)] hover:no-underline"
          >
            工具中心
          </Link>
        </div>
      </section>

      <Link
        href="/learn"
        className="fb-card flex items-center gap-2.5 p-3.5 text-[13px] font-medium text-[color:var(--ink-2)] transition hover:border-[color:var(--hairline-strong)] hover:no-underline"
      >
        <Sparkles className="h-4 w-4 text-[color:var(--brand)]" strokeWidth={1.75} />
        深度学习地图
        <ArrowRight className="ml-auto h-3.5 w-3.5 text-[color:var(--ink-4)]" />
      </Link>
    </div>
  );
}
