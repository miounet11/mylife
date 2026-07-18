'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { AlertBanner } from '@/components/layout/alert-banner';
import ToolHistoryPanel from '@/components/tool-history-panel';
import { buildReportContinueChatHref } from '@/lib/chat-entry';
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

export default function HistoryClient() {
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
          setError(data.error || '加载失败');
          return;
        }
        setAuthenticated(!!data.authenticated);
        setHasSessionUser(!!data.hasSessionUser || !!data.user?.id || !!data.data?.user?.id);
        setReports(normalizeReports(data));
      } catch {
        setError('网络异常，请稍后重试');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  if (loading) {
    return (
      <div className="fb-card flex items-center justify-center gap-2 p-10 text-[13px] text-[color:var(--ink-3)]">
        <Loader2 className="h-4 w-4 animate-spin" />
        正在加载历史记录…
      </div>
    );
  }

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

  return (
    <div className="space-y-4">
      {error ? <AlertBanner>{error}</AlertBanner> : null}

      {/* Linear-clean：历史 → 顾问开场 */}
      <section className="border-y border-[color:var(--hairline)] py-3.5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-[color:var(--ink-5)]">顾问</div>
            <h2 className="mt-0.5 text-[14px] font-semibold tracking-[-0.01em] text-[color:var(--ink-1)]">
              {primaryReportId ? '带最近报告开场' : '直接问顾问'}
            </h2>
            <p className="mt-1 max-w-xl text-[12px] leading-[1.55] text-[color:var(--ink-5)]">
              {primaryReportId
                ? '不预填长问题。老师先开场，再对照你最近一份报告追问'
                : '暂无报告时也可先开场；有盘后建议从报告进入，依据更稳'}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
            <Link
              href={openingHref}
              className="font-medium text-[color:var(--ink-1)] underline-offset-2 hover:underline"
            >
              {primaryReportId ? '继续聊 →' : '总览开场 →'}
            </Link>
            <Link
              href="/teachers"
              className="text-[color:var(--ink-3)] underline-offset-2 hover:underline"
            >
              全部老师
            </Link>
          </div>
        </div>
      </section>

      {!authenticated ? (
        <section className="fb-card p-4 md:p-6">
          <p className="text-[13px] leading-[1.6] text-[color:var(--ink-3)]">
            {hasSessionUser || reports.length
              ? '本浏览器会话内生成的报告已列在下方。登录绑定邮箱后可跨设备找回，并开启订阅提醒。'
              : '本浏览器暂无会话报告。生成后会自动保存在此设备；登录绑定邮箱可跨设备归档。'}
            <Link
              href="/login?next=%2Fhistory"
              className="ml-1 font-semibold text-[color:var(--brand)] hover:no-underline"
            >
              去登录
            </Link>
          </p>
        </section>
      ) : null}

      <section>
        <div className="mb-2 text-[12px] font-bold uppercase tracking-wide text-[color:var(--ink-4)]">
          综合报告
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
                    {report.name ? `${report.name} · ` : ''}
                    {report.intent || '综合判断报告'}
                  </div>
                  <div className="mt-0.5 text-[12px] text-[color:var(--ink-4)]">
                    {report.birthDate ? `${report.birthDate} · ` : ''}
                    {report.createdAt ? new Date(report.createdAt).toLocaleDateString('zh-CN') : ''}
                    {report.birthAccuracy ? ` · ${report.birthAccuracy}` : ''}
                    {report.relationLabel || report.relation
                      ? ` · ${report.relationLabel || report.relation}`
                      : ''}
                    {report.source === 'membership' ? ' · 邮箱归档' : ''}
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
                    带盘开场
                  </Link>
                  <Link
                    href={`/result/${report.id}?source=history`}
                    className="font-bold text-[color:var(--brand)] hover:no-underline"
                  >
                    打开报告 →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="fb-card p-4 md:p-6">
            <p className="text-[13px] leading-[1.6] text-[color:var(--ink-3)]">
              暂无报告。生成后会保存在本浏览器会话中；填写邮箱或登录可跨设备找回。
            </p>
            <Link
              href="/analyze"
              className="fb-btn fb-btn-primary mt-4 inline-flex h-9 px-4 text-[13px] hover:no-underline"
            >
              去生成报告
            </Link>
          </div>
        )}
      </section>

      <section>
        <div className="mb-2 text-[12px] font-bold uppercase tracking-wide text-[color:var(--ink-4)]">
          工具结果
        </div>
        <ToolHistoryPanel
          title="单项工具运行记录"
          description="基于综合报告跑出的工具结论，可直接回看 headline 与建议动作。"
          limit={12}
          showVisits={false}
        />
      </section>
    </div>
  );
}
