'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { AlertBanner } from '@/components/layout/alert-banner';
import ToolHistoryPanel from '@/components/tool-history-panel';
import { buildReportContinueChatHref } from '@/lib/chat-entry';
import {
  historyClientCopy,
  historyDateLocale,
} from '@/lib/i18n/history-copy';
import type { SiteLocale } from '@/lib/i18n/site-locale';
import { buildTeacherChatHref } from '@/lib/teachers';

type HistoryReport = {
  id: string;
  intent: string | null;
  birthAccuracy: string | null;
  createdAt: string;
  birthDate?: string;
  name?: string;
  relation?: string;
  relationLabel?: string;
  source?: 'fortune' | 'membership' | string;
};

type HistoryPayload = {
  success: boolean;
  authenticated?: boolean;
  hasSessionUser?: boolean;
  error?: string;
  reports?: HistoryReport[];
  fortunes?: HistoryReport[];
  savedReports?: HistoryReport[];
  data?: {
    reports?: HistoryReport[];
    fortunes?: HistoryReport[];
    savedReports?: HistoryReport[];
    user?: { email?: string | null; id?: string };
  };
  user?: { email?: string | null; id?: string };
};

function normalizeReports(data: HistoryPayload): HistoryReport[] {
  const merged =
    data.data?.reports ||
    data.reports ||
    [
      ...(data.data?.fortunes || data.fortunes || []),
      ...(data.data?.savedReports || data.savedReports || []),
    ];
  const seen = new Set<string>();
  return (Array.isArray(merged) ? merged : []).filter((item) => {
    if (!item?.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export default function HistoryClient({
  locale = 'zh-CN',
}: {
  locale?: SiteLocale;
}) {
  const copy = useMemo(() => historyClientCopy(locale), [locale]);
  const dateLocale = useMemo(() => historyDateLocale(locale), [locale]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<HistoryReport[]>([]);
  const [authenticated, setAuthenticated] = useState(false);
  const [hasSessionUser, setHasSessionUser] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/history', { cache: 'no-store' });
        const data = (await res.json()) as HistoryPayload;
        if (!res.ok || !data.success) {
          setError(data.error || copy.loadFailed);
          return;
        }
        setAuthenticated(!!data.authenticated);
        setHasSessionUser(!!data.hasSessionUser || !!data.user?.id || !!data.data?.user?.id);
        setReports(normalizeReports(data));
      } catch {
        setError(copy.networkError);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [copy.loadFailed, copy.networkError]);

  const primaryReportId = useMemo(() => reports[0]?.id || null, [reports]);
  const openingHref = useMemo(() => {
    if (primaryReportId) {
      return buildReportContinueChatHref({
        reportId: primaryReportId,
        teacher: 'overview',
        source: 'history_opening',
      });
    }
    return buildTeacherChatHref({
      teacherId: 'overview',
      source: 'history_opening_no_report',
    });
  }, [primaryReportId]);

  if (loading) {
    return (
      <div className="fb-card flex items-center justify-center gap-2 p-10 text-[13px] text-[color:var(--ink-3)]">
        <Loader2 className="h-4 w-4 animate-spin" />
        {copy.loading}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error ? <AlertBanner>{error}</AlertBanner> : null}

      {/* Linear-clean：历史 → 顾问开场 */}
      <section className="border-y border-[color:var(--hairline)] py-3.5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-[color:var(--ink-5)]">
              {copy.consultantEyebrow}
            </div>
            <h2 className="mt-0.5 text-[14px] font-semibold tracking-[-0.01em] text-[color:var(--ink-1)]">
              {primaryReportId
                ? copy.consultantTitleWithReport
                : copy.consultantTitleWithoutReport}
            </h2>
            <p className="mt-1 max-w-xl text-[12px] leading-[1.55] text-[color:var(--ink-5)]">
              {primaryReportId
                ? copy.consultantDescWithReport
                : copy.consultantDescWithoutReport}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
            <Link
              href={openingHref}
              className="font-medium text-[color:var(--ink-1)] underline-offset-2 hover:underline"
            >
              {primaryReportId ? copy.continueChat : copy.overviewOpening}
            </Link>
            <Link
              href="/teachers"
              className="text-[color:var(--ink-3)] underline-offset-2 hover:underline"
            >
              {copy.allTeachers}
            </Link>
          </div>
        </div>
      </section>

      {!authenticated ? (
        <section className="fb-card p-4 md:p-6">
          <p className="text-[13px] leading-[1.6] text-[color:var(--ink-3)]">
            {hasSessionUser || reports.length ? copy.guestHasSession : copy.guestEmpty}
            <Link
              href="/login?next=%2Fhistory"
              className="ml-1 font-semibold text-[color:var(--brand)] hover:no-underline"
            >
              {copy.goLogin}
            </Link>
          </p>
        </section>
      ) : null}

      <section>
        <div className="mb-2 text-[12px] font-bold uppercase tracking-wide text-[color:var(--ink-4)]">
          {copy.reportsSection}
        </div>
        {reports.length ? (
          <div className="fb-card divide-y divide-[color:var(--hairline)] overflow-hidden">
            {reports.map((report) => (
              <div
                key={report.id}
                className="flex flex-col gap-2 px-4 py-3 transition hover:bg-[color:var(--bg-sunken)] md:flex-row md:items-center md:justify-between md:px-5"
              >
                <Link
                  href={`/result/${report.id}?source=history`}
                  className="min-w-0 flex-1 hover:no-underline"
                >
                  <div className="text-[14px] font-bold text-[color:var(--ink-1)]">
                    {/* name + intent are API/user data — leave as-is */}
                    {report.name ? `${report.name} · ` : ''}
                    {report.intent || copy.defaultIntentLabel}
                  </div>
                  <div className="mt-0.5 text-[12px] text-[color:var(--ink-4)]">
                    {report.birthDate ? `${report.birthDate} · ` : ''}
                    {report.createdAt
                      ? new Date(report.createdAt).toLocaleDateString(dateLocale)
                      : ''}
                    {/* birthAccuracy / relation* are API/user data */}
                    {report.birthAccuracy ? ` · ${report.birthAccuracy}` : ''}
                    {report.relationLabel || report.relation
                      ? ` · ${report.relationLabel || report.relation}`
                      : ''}
                    {report.source === 'membership' ? ` · ${copy.membershipArchive}` : ''}
                  </div>
                </Link>
                <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
                  <Link
                    href={buildReportContinueChatHref({
                      reportId: report.id,
                      teacher: 'overview',
                      source: 'history_row_opening',
                    })}
                    className="font-medium text-[color:var(--ink-1)] underline-offset-2 hover:underline"
                  >
                    {copy.openWithChart}
                  </Link>
                  <Link
                    href={`/result/${report.id}?source=history`}
                    className="font-bold text-[color:var(--brand)] hover:no-underline"
                  >
                    {copy.openReport}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="fb-card p-4 md:p-6">
            <p className="text-[13px] leading-[1.6] text-[color:var(--ink-3)]">
              {copy.emptyReports}
            </p>
            <Link
              href="/analyze"
              className="fb-btn fb-btn-primary mt-4 inline-flex h-9 px-4 text-[13px] hover:no-underline"
            >
              {copy.ctaGenerate}
            </Link>
          </div>
        )}
      </section>

      <section>
        <div className="mb-2 text-[12px] font-bold uppercase tracking-wide text-[color:var(--ink-4)]">
          {copy.toolsSection}
        </div>
        <ToolHistoryPanel
          title={copy.toolHistoryTitle}
          description={copy.toolHistoryDescription}
          limit={12}
          showVisits={false}
        />
      </section>
    </div>
  );
}
