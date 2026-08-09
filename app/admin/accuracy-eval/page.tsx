import Link from 'next/link';
import { requireAdminUser } from '@/lib/auth';
import { exportAccuracyBadSamples } from '@/lib/accuracy-eval-export';
import { listClientErrors } from '@/lib/client-error-log';
import { AdminFooter, AdminHeader } from '@/components/admin-shell';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams?: Promise<{ days?: string; partial?: string }>;
}

export default async function AdminAccuracyEvalPage({ searchParams }: PageProps) {
  await requireAdminUser('/admin/accuracy-eval');
  const sp = searchParams ? await searchParams : {};
  const days = Math.max(7, Math.min(90, Number(sp.days) || 30));
  const includePartial = sp.partial === '1';
  const snap = exportAccuracyBadSamples({
    limit: 50,
    windowDays: days,
    includePartial,
  });
  const chatErrors = listClientErrors({ days: 7, limit: 30, routeIncludes: 'chat' });
  const allErrors = listClientErrors({ days: 3, limit: 20 });

  return (
    <div className="page-shell min-h-screen bg-[color:var(--bg-sunken)]">
      <AdminHeader />
      <main className="page-frame py-8 pb-16">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[color:var(--brand)]">
              Accuracy Eval
            </div>
            <h1 className="mt-1 text-2xl font-black text-[color:var(--ink-1)] md:text-3xl">
              偏差较大 · 报告样本
            </h1>
            <p className="mt-1 max-w-2xl text-[13px] text-[color:var(--ink-3)]">
              来自报告校准「偏差较大 / 部分准」+ 关联报告摘要。用于 prompt 回归与结构抽检。
              近 {days} 天 · {snap.count} 条 · 已关联报告 {snap.withReport}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-[12px] font-semibold text-[color:var(--brand)]">
            <Link
              href={`/admin/accuracy-eval?days=${days}&partial=0`}
              className={!includePartial ? 'underline' : 'hover:underline'}
            >
              仅偏差较大
            </Link>
            <Link
              href={`/admin/accuracy-eval?days=${days}&partial=1`}
              className={includePartial ? 'underline' : 'hover:underline'}
            >
              含部分准
            </Link>
            <a
              href={`/api/admin/accuracy-eval?format=jsonl&days=${days}&partial=${includePartial ? 1 : 0}`}
              className="hover:underline"
            >
              下载 JSONL
            </a>
            <Link href="/admin/feedback" className="hover:underline">
              ← 反馈
            </Link>
          </div>
        </div>

        <section className="mb-6 rounded-[var(--radius-lg)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4">
          <h2 className="text-[14px] font-bold text-[color:var(--ink-1)]">样本列表</h2>
          {snap.samples.length === 0 ? (
            <p className="mt-3 text-[13px] text-[color:var(--ink-4)]">
              近 {days} 天暂无「偏差较大」反馈。可放宽到「含部分准」或拉长窗口。
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-[color:var(--hairline)]">
              {snap.samples.map((s) => (
                <li key={s.feedbackId} className="py-3">
                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <span className="rounded bg-red-50 px-1.5 py-0.5 font-bold text-red-800">
                      {s.level || 'bad'}
                    </span>
                    <span className="font-mono text-[color:var(--ink-4)]">{s.createdAt}</span>
                    <span className="font-mono text-[color:var(--ink-5)]">{s.status}</span>
                  </div>
                  <p className="mt-1 text-[13px] text-[color:var(--ink-2)]">{s.message}</p>
                  {s.reportId ? (
                    <div className="mt-2 rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] p-3 text-[12px]">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/result/${s.reportId}`}
                          className="font-semibold text-[color:var(--brand)] hover:underline"
                          target="_blank"
                        >
                          {s.reportId}
                        </Link>
                        {s.report?.intent ? (
                          <span className="text-[color:var(--ink-4)]">intent {s.report.intent}</span>
                        ) : null}
                        {s.report?.calibrationScore != null ? (
                          <span className="text-[color:var(--ink-4)]">
                            cal {s.report.calibrationScore}
                          </span>
                        ) : null}
                      </div>
                      {s.report ? (
                        <div className="mt-1.5 space-y-0.5 text-[color:var(--ink-3)]">
                          <div>
                            {s.report.name || '—'} · 日主 {s.report.dayMaster || '—'} · 格局{' '}
                            {s.report.pattern || '—'} · 大运 {s.report.currentDaYun || '—'}
                          </div>
                          {s.report.summary ? (
                            <p className="line-clamp-3 text-[11px] leading-5">{s.report.summary}</p>
                          ) : null}
                        </div>
                      ) : (
                        <p className="mt-1 text-[11px] text-[color:var(--ink-4)]">
                          报告未找到（可能已删或 ID 解析失败）
                        </p>
                      )}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mb-6 rounded-[var(--radius-lg)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4">
          <h2 className="text-[14px] font-bold text-[color:var(--ink-1)]">
            客户端错误 · /chat（7d）
          </h2>
          <p className="mt-1 text-[12px] text-[color:var(--ink-4)]">
            来自 ErrorBoundary / app/error 上报 · data/ops/client-errors/
          </p>
          {chatErrors.length === 0 ? (
            <p className="mt-3 text-[13px] text-[color:var(--ink-4)]">
              尚无 chat 客户端错误记录（部署后新崩溃会出现在此）。
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {chatErrors.map((e) => (
                <li
                  key={e.id}
                  className="rounded-[var(--radius-sm)] border border-[color:var(--hairline)] px-3 py-2 text-[12px]"
                >
                  <div className="font-mono text-[10px] text-[color:var(--ink-4)]">
                    {e.at} · {e.route}
                  </div>
                  <div className="mt-0.5 font-semibold text-[color:var(--ink-1)]">
                    {e.name}: {e.message}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-[var(--radius-lg)] border border-dashed border-[color:var(--hairline-strong)] bg-[color:var(--paper)]/70 p-4">
          <h2 className="text-[14px] font-bold text-[color:var(--ink-1)]">全站客户端错误（3d 抽样）</h2>
          {allErrors.length === 0 ? (
            <p className="mt-2 text-[12px] text-[color:var(--ink-4)]">暂无</p>
          ) : (
            <ul className="mt-2 space-y-1 text-[11px] font-mono text-[color:var(--ink-3)]">
              {allErrors.slice(0, 12).map((e) => (
                <li key={e.id}>
                  {e.at.slice(0, 19)} · {e.route} · {e.message.slice(0, 80)}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <AdminFooter />
    </div>
  );
}
