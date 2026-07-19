import Link from 'next/link';
import { requireAdminUser } from '@/lib/auth';
import { getEmailOpsSnapshot } from '@/lib/email/timing-email-stats';
import { AppPage } from '@/components/layout/app-page';

export const dynamic = 'force-dynamic';

const DAY_OPTIONS = [
  { days: 1, label: '1d' },
  { days: 7, label: '7d' },
  { days: 30, label: '30d' },
] as const;

interface PageProps {
  searchParams?: Promise<{ days?: string }>;
}

function parseDays(raw?: string | null): number {
  const n = Number(raw || 7);
  if (!Number.isFinite(n)) return 7;
  if (n <= 1) return 1;
  if (n <= 7) return 7;
  return 30;
}

function Stat({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper?: string;
}) {
  return (
    <div className="rounded-[12px] border border-[#e2e8f0] bg-white p-4">
      <div className="text-[11px] font-bold uppercase tracking-wide text-[#94a3b8]">{label}</div>
      <div className="mt-1 text-2xl font-black tabular-nums text-[#0f172a]">{value}</div>
      {helper ? <div className="mt-1 text-[11px] text-[#94a3b8]">{helper}</div> : null}
    </div>
  );
}

function statusCount(
  byStatus: Array<{ status: string; count: number }>,
  status: string,
): number {
  return byStatus.find((s) => s.status === status)?.count ?? 0;
}

export default async function AdminEmailOpsPage({ searchParams }: PageProps) {
  await requireAdminUser('/admin/email-ops');
  const sp = searchParams ? await searchParams : {};
  const days = parseDays(sp.days);
  const snap = getEmailOpsSnapshot({ days });
  const windowLabel = days === 1 ? '1d' : days === 30 ? '30d' : '7d';

  const sent = statusCount(snap.byStatus, 'sent');
  const error = statusCount(snap.byStatus, 'error');
  const reserved = statusCount(snap.byStatus, 'reserved');
  const lastRun = snap.dailyWindowLastRun;
  const timingLast = snap.timingEmailLastRun;
  const predictionDueLast = snap.predictionDueLastRun;

  return (
    <AppPage header={{ ctaHref: '/admin/dashboard', ctaLabel: '运营看板' }}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6d28d9]">
            Email Delivery Ops
          </div>
          <h1 className="mt-1 text-[20px] font-bold text-[#0f172a]">
            邮件投递统计 · {windowLabel}
          </h1>
          <p className="mt-1 max-w-2xl text-[12px] leading-[1.65] text-[#64748b]">
            基于 <code className="rounded bg-[#f1f5f9] px-1">timing_email_log</code> 的投递计数
            （sent / error / reserved）。无 open-pixel，本页不展示打开率。
            {snap.note ? (
              <span className="ml-1 text-[#b45309]">· note: {snap.note}</span>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[12px] font-semibold text-[#6d28d9]">
          <div className="flex overflow-hidden rounded-[8px] border border-[#e2e8f0] bg-white">
            {DAY_OPTIONS.map((opt) => {
              const active = days === opt.days;
              return (
                <Link
                  key={opt.days}
                  href={`/admin/email-ops?days=${opt.days}`}
                  className={`px-2.5 py-1.5 no-underline hover:no-underline ${
                    active
                      ? 'bg-[#6d28d9] text-white'
                      : 'text-[#64748b] hover:bg-[#f8fafc] hover:text-[#0f172a]'
                  }`}
                >
                  {opt.label}
                </Link>
              );
            })}
          </div>
          <Link href="/admin/dashboard" className="hover:underline">
            ← 运营看板
          </Link>
        </div>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="投递日志总数"
          value={snap.total}
          helper={
            snap.dbAvailable
              ? snap.tablePresent
                ? `近 ${days} 天 · delivery_stats`
                : '表不存在'
              : '本地无 DB（soft-empty）'
          }
        />
        <Stat label="sent" value={sent} helper="成功发出" />
        <Stat label="error" value={error} helper="发送失败" />
        <Stat label="reserved" value={reserved} helper="预留 / 进行中" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-[12px] border border-[#e2e8f0] bg-white p-4">
          <h2 className="text-[14px] font-bold text-[#0f172a]">按类别 × 状态</h2>
          {snap.byCategory.length === 0 ? (
            <p className="mt-2 text-[12px] text-[#94a3b8]">
              暂无投递记录。本地 stub 或尚未跑过 cron 时为空。
            </p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[320px] text-left text-[12px]">
                <thead className="text-[10px] uppercase tracking-wide text-[#94a3b8]">
                  <tr className="border-b border-[#e2e8f0]">
                    <th className="py-2 pr-2">category</th>
                    <th className="py-2 pr-2">sent</th>
                    <th className="py-2 pr-2">error</th>
                    <th className="py-2 pr-2">reserved</th>
                    <th className="py-2">total</th>
                  </tr>
                </thead>
                <tbody>
                  {snap.byCategory.map((row) => (
                    <tr key={row.category} className="border-b border-[#f1f5f9]">
                      <td className="py-2 pr-2 font-mono font-semibold text-[#334155]">
                        {row.category}
                      </td>
                      <td className="py-2 pr-2 tabular-nums">{row.counts.sent || 0}</td>
                      <td className="py-2 pr-2 tabular-nums text-[#b91c1c]">
                        {row.counts.error || 0}
                      </td>
                      <td className="py-2 pr-2 tabular-nums text-[#b45309]">
                        {row.counts.reserved || 0}
                      </td>
                      <td className="py-2 tabular-nums font-bold">{row.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-[12px] border border-[#e2e8f0] bg-white p-4">
          <h2 className="text-[14px] font-bold text-[#0f172a]">Daily-window 上次运行</h2>
          {!lastRun.found || !lastRun.data ? (
            <p className="mt-2 text-[12px] text-[#94a3b8]">
              尚无 last-run 快照（data/ops/daily-window-email-last-run.json）。
            </p>
          ) : (
            <dl className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
              <div>
                <dt className="text-[10px] font-bold uppercase text-[#94a3b8]">mode</dt>
                <dd className="font-semibold text-[#0f172a]">{lastRun.data.mode}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase text-[#94a3b8]">success</dt>
                <dd className="font-semibold text-[#0f172a]">
                  {String(lastRun.data.success ?? '—')}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase text-[#94a3b8]">campaign</dt>
                <dd className="font-mono text-[#334155]">{lastRun.data.campaign || '—'}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase text-[#94a3b8]">sent / skipped</dt>
                <dd className="tabular-nums text-[#0f172a]">
                  {lastRun.data.sentCount ?? 0} / {lastRun.data.skippedCount ?? 0}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-[10px] font-bold uppercase text-[#94a3b8]">timestamp</dt>
                <dd className="font-mono text-[11px] text-[#64748b]">
                  {lastRun.data.timestamp}
                </dd>
              </div>
              {lastRun.data.sample?.subject ? (
                <div className="col-span-2">
                  <dt className="text-[10px] font-bold uppercase text-[#94a3b8]">sample subject</dt>
                  <dd className="text-[#334155]">{lastRun.data.sample.subject}</dd>
                </div>
              ) : null}
            </dl>
          )}
        </section>
      </div>

      <section className="mt-4 rounded-[12px] border border-[#e2e8f0] bg-white p-4">
        <h2 className="text-[14px] font-bold text-[#0f172a]">Timing email 上次运行</h2>
        <p className="mt-1 text-[11px] text-[#94a3b8]">
          monthly / solar_term / daily / major_event 聚合（data/ops/timing-email-last-run.json）
        </p>
        {!timingLast?.found || !timingLast.data ? (
          <p className="mt-2 text-[12px] text-[#94a3b8]">尚无 timing last-run 快照。</p>
        ) : (
          <dl className="mt-3 grid grid-cols-2 gap-2 text-[12px] sm:grid-cols-4">
            <div>
              <dt className="text-[10px] font-bold uppercase text-[#94a3b8]">mode</dt>
              <dd className="font-semibold text-[#0f172a]">{timingLast.data.mode}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase text-[#94a3b8]">daily / skip</dt>
              <dd className="tabular-nums text-[#0f172a]">
                {timingLast.data.dailySent ?? 0} / {timingLast.data.skippedCount ?? 0}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase text-[#94a3b8]">monthly · solar · major</dt>
              <dd className="tabular-nums text-[#0f172a]">
                {timingLast.data.monthlySent ?? 0} · {timingLast.data.solarTermSent ?? 0} ·{' '}
                {timingLast.data.majorEventSent ?? 0}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase text-[#94a3b8]">errors</dt>
              <dd className="tabular-nums text-[#b91c1c]">
                {(timingLast.data.errors || []).length}
              </dd>
            </div>
            <div className="col-span-2 sm:col-span-4">
              <dt className="text-[10px] font-bold uppercase text-[#94a3b8]">timestamp</dt>
              <dd className="font-mono text-[11px] text-[#64748b]">{timingLast.data.timestamp}</dd>
            </div>
            {(timingLast.data.errors || []).length > 0 ? (
              <div className="col-span-2 sm:col-span-4">
                <dt className="text-[10px] font-bold uppercase text-[#94a3b8]">error samples</dt>
                <dd className="mt-1 space-y-0.5 font-mono text-[11px] text-[#b91c1c]">
                  {(timingLast.data.errors || []).slice(0, 5).map((e) => (
                    <div key={e}>{e}</div>
                  ))}
                </dd>
              </div>
            ) : null}
          </dl>
        )}
      </section>

      <section className="mt-4 rounded-[12px] border border-[#e2e8f0] bg-white p-4">
        <h2 className="text-[14px] font-bold text-[#0f172a]">Prediction-due 上次运行</h2>
        <p className="mt-1 text-[11px] text-[#94a3b8]">
          到期预测提醒 cron（data/ops/prediction-due-email-last-run.json）
        </p>
        {!predictionDueLast?.found || !predictionDueLast.data ? (
          <p className="mt-2 text-[12px] text-[#94a3b8]">尚无 prediction-due last-run 快照。</p>
        ) : (
          <dl className="mt-3 grid grid-cols-2 gap-2 text-[12px] sm:grid-cols-4">
            <div>
              <dt className="text-[10px] font-bold uppercase text-[#94a3b8]">campaign</dt>
              <dd className="font-mono text-[#334155]">
                {predictionDueLast.data.campaign || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase text-[#94a3b8]">sent / skipped</dt>
              <dd className="tabular-nums text-[#0f172a]">
                {predictionDueLast.data.sentCount ?? 0} /{' '}
                {predictionDueLast.data.skippedCount ?? 0}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase text-[#94a3b8]">candidates · recipients</dt>
              <dd className="tabular-nums text-[#0f172a]">
                {predictionDueLast.data.candidateRows ?? 0} ·{' '}
                {predictionDueLast.data.recipientCount ?? 0}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase text-[#94a3b8]">errors</dt>
              <dd className="tabular-nums text-[#b91c1c]">
                {(predictionDueLast.data.errors || []).length}
              </dd>
            </div>
            <div className="col-span-2 sm:col-span-4">
              <dt className="text-[10px] font-bold uppercase text-[#94a3b8]">timestamp</dt>
              <dd className="font-mono text-[11px] text-[#64748b]">
                {predictionDueLast.data.timestamp}
              </dd>
            </div>
            {(predictionDueLast.data.errors || []).length > 0 ? (
              <div className="col-span-2 sm:col-span-4">
                <dt className="text-[10px] font-bold uppercase text-[#94a3b8]">error samples</dt>
                <dd className="mt-1 space-y-0.5 font-mono text-[11px] text-[#b91c1c]">
                  {(predictionDueLast.data.errors || []).slice(0, 5).map((e) => (
                    <div key={e}>{e}</div>
                  ))}
                </dd>
              </div>
            ) : null}
          </dl>
        )}
      </section>

      <section className="mt-4 rounded-[12px] border border-[#e2e8f0] bg-white p-4">
        <h2 className="text-[14px] font-bold text-[#0f172a]">错误分类</h2>
        <p className="mt-1 text-[11px] text-[#94a3b8]">
          来自 status=error 行的 meta.error 归类（非打开率）。样例已脱敏，不含收件人邮箱。
        </p>
        {snap.errorReasons.length === 0 ? (
          <p className="mt-2 text-[12px] text-[#94a3b8]">
            {error > 0
              ? '有 error 计数但未解析到 meta（旧行或 meta 为空）。'
              : '当前窗口无投递失败记录。'}
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[420px] text-left text-[12px]">
              <thead className="text-[10px] uppercase tracking-wide text-[#94a3b8]">
                <tr className="border-b border-[#e2e8f0]">
                  <th className="py-2 pr-2">code</th>
                  <th className="py-2 pr-2">label</th>
                  <th className="py-2 pr-2">count</th>
                  <th className="py-2">sample</th>
                </tr>
              </thead>
              <tbody>
                {snap.errorReasons.map((r) => (
                  <tr key={r.code} className="border-b border-[#f1f5f9]">
                    <td className="py-2 pr-2 font-mono text-[11px] font-semibold text-[#b91c1c]">
                      {r.code}
                    </td>
                    <td className="py-2 pr-2 text-[#334155]">{r.label}</td>
                    <td className="py-2 pr-2 tabular-nums font-bold text-[#0f172a]">
                      {r.count}
                    </td>
                    <td
                      className="max-w-[360px] truncate py-2 font-mono text-[11px] text-[#94a3b8]"
                      title={r.sample || undefined}
                    >
                      {r.sample || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-4 rounded-[12px] border border-[#e2e8f0] bg-white p-4">
        <h2 className="text-[14px] font-bold text-[#0f172a]">最近 campaigns</h2>
        {snap.campaigns.length === 0 ? (
          <p className="mt-2 text-[12px] text-[#94a3b8]">暂无 campaign 聚合。</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-[12px]">
              <thead className="text-[10px] uppercase tracking-wide text-[#94a3b8]">
                <tr className="border-b border-[#e2e8f0]">
                  <th className="py-2 pr-2">campaign</th>
                  <th className="py-2 pr-2">category</th>
                  <th className="py-2 pr-2">total</th>
                  <th className="py-2 pr-2">statuses</th>
                  <th className="py-2">last sent</th>
                </tr>
              </thead>
              <tbody>
                {snap.campaigns.map((c) => (
                  <tr
                    key={`${c.category}::${c.campaign}`}
                    className="border-b border-[#f1f5f9]"
                  >
                    <td className="py-2 pr-2 font-mono text-[11px] text-[#334155]">
                      {c.campaign}
                    </td>
                    <td className="py-2 pr-2 font-semibold text-[#475569]">{c.category}</td>
                    <td className="py-2 pr-2 tabular-nums font-bold">{c.total}</td>
                    <td className="py-2 pr-2 font-mono text-[11px] text-[#64748b]">
                      {Object.entries(c.statusCounts)
                        .map(([s, n]) => `${s}:${n}`)
                        .join(' · ')}
                    </td>
                    <td className="py-2 font-mono text-[11px] text-[#94a3b8]">
                      {c.lastSentAt || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-4 rounded-[12px] border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-4 text-[12px] leading-[1.65] text-[#475569]">
        <div className="font-bold text-[#0f172a]">说明</div>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            数据源：SQLite <code>timing_email_log</code>（categories 如 daily_window、prediction_due、timing）
          </li>
          <li>
            指标为<strong>投递状态计数</strong> + meta.error 错误分类，非打开率 / 点击率（站点无 open-pixel）
          </li>
          <li>
            API：<code>GET /api/admin/email-ops/stats?days=7</code> + header{' '}
            <code>x-timing-email-cron-token</code>
          </li>
          <div className="mt-1 text-[11px] text-[#94a3b8]">
            生成于 {snap.timestamp.slice(0, 19).replace('T', ' ')} UTC
          </div>
        </ul>
      </section>
    </AppPage>
  );
}
