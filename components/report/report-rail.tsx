import Link from 'next/link';
import { ArrowRight, BookOpen, MessageSquareText, Wrench } from 'lucide-react';
import ReportAnchorRail from '@/components/report/report-anchor-rail';
import { buildReportContinueChatHref } from '@/lib/chat-entry';

export function ReportRailRight({
  reportId,
  showChat = true,
}: {
  reportId: string;
  showChat?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="sticky top-[calc(var(--site-header-offset)+0.75rem)] space-y-3">
        <ReportAnchorRail />

        {showChat ? (
          <section className="fb-card p-3.5">
            <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[color:var(--ink-1)]">
              <MessageSquareText className="h-3.5 w-3.5 text-[color:var(--ink-3)]" strokeWidth={1.75} />
              继续追问
            </div>
            <Link
              href={buildReportContinueChatHref({ reportId: reportId, source: 'result_rail', teacher: 'overview' })}
              className="mt-2.5 inline-flex items-center gap-1 text-[13px] font-medium text-[color:var(--brand)] transition hover:text-[color:var(--brand-strong)] hover:no-underline"
            >
              基于报告追问 <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </section>
        ) : null}

        <section className="fb-card p-3.5">
          <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[color:var(--ink-1)]">
            <Wrench className="h-3.5 w-3.5 text-[color:var(--ink-3)]" strokeWidth={1.75} />
            相关工具
          </div>
          <Link
            href="/tools"
            className="mt-2.5 inline-flex items-center gap-1 text-[13px] font-medium text-[color:var(--brand)] transition hover:text-[color:var(--brand-strong)] hover:no-underline"
          >
            工具中心 <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </section>

        <Link
          href="/world-yi"
          className="fb-card flex items-center gap-2.5 p-3.5 text-[13px] font-medium text-[color:var(--ink-2)] transition hover:border-[color:var(--hairline-strong)] hover:no-underline"
        >
          <BookOpen className="h-4 w-4 text-[color:var(--brand)]" strokeWidth={1.75} />
          世界易学说
          <ArrowRight className="ml-auto h-3.5 w-3.5 text-[color:var(--ink-4)]" />
        </Link>
      </div>
    </div>
  );
}
