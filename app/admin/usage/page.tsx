import Link from 'next/link';
import { ArrowRight, Flame, MailCheck, Repeat2, Sparkles } from 'lucide-react';
import { AdminFooter, AdminHeader } from '@/components/admin-shell';
import { requireAdminUser } from '@/lib/auth';
import { getUsageFrequencyDashboard } from '@/lib/usage-frequency';

export const dynamic = 'force-dynamic';

function pct(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function pctColor(value: number, good: number, bad: number) {
  if (value >= good) return 'text-[color:var(--signal-strong)]';
  if (value <= bad) return 'text-[color:var(--accent-strong)]';
  return 'text-[color:var(--ink-1)]';
}

export default async function AdminUsagePage() {
  await requireAdminUser('/admin/usage');
  const { active, frequency, retention, emailFunnel } = getUsageFrequencyDashboard();

  const total = frequency.totalUsers30d || 1;
  const oneDayShare = frequency.oneDay / total;
  const repeatShare = (frequency.twoToThree + frequency.fourToSeven + frequency.eightPlus) / total;

  return (
    <div className="page-shell">
      <AdminHeader />

      <main className="page-frame py-8 pb-16">
        <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-3">
            <h1 className="text-3xl font-black text-[color:var(--ink-1)] md:text-4xl">
              用户使用频率与留存
            </h1>
            <p className="intro-copy max-w-2xl">
              本周期北极星：让用户极致爽用 → 频次 + 留存 → 邮箱长尾。这一页只看「用了几次 / 多少天回来 / 多少留下了邮箱」。
            </p>
            <div className="action-strip flex flex-col gap-3 sm:flex-row">
              <Link href="/admin/analytics" className="action-secondary">
                查看完整经营分析
              </Link>
              <Link href="/admin/content" className="action-secondary">
                内容后台
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="DAU 24h" value={active.dau} helper="不同 user/session" />
            <StatCard label="WAU 7d" value={active.wau} helper="不同 user/session" />
            <StatCard label="MAU 30d" value={active.mau} helper="不同 user/session" />
            <StatCard
              label="DAU / WAU 粘性"
              value={pct(active.stickinessDauWau)}
              helper="行业基准 ≥20%"
              valueClassName={pctColor(active.stickinessDauWau, 0.2, 0.1)}
            />
            <StatCard label="24h 会话" value={active.sessions24h} helper="distinct session_id" />
            <StatCard label="MAU 中合格用户" value={emailFunnel.qualifiedUsers} helper="30d ≥3 天访问" />
          </div>
        </section>

        <section className="mt-8 rounded-[var(--radius-lg)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-5 md:p-6">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
            <Repeat2 className="h-4 w-4" />
            30 天内访问天数分布
          </div>
          <h2 className="mt-2 text-xl font-black text-[color:var(--ink-1)]">用户用了几天就走？</h2>

          <div className="mt-5 grid gap-4 md:grid-cols-4">
            <FrequencyBucket label="只来 1 天" count={frequency.oneDay} total={total} tone="bad" />
            <FrequencyBucket label="2-3 天" count={frequency.twoToThree} total={total} tone="warn" />
            <FrequencyBucket label="4-7 天" count={frequency.fourToSeven} total={total} tone="good" />
            <FrequencyBucket label="8+ 天（核心粉）" count={frequency.eightPlus} total={total} tone="hero" />
          </div>

          <div className="mt-5 grid gap-2 text-xs text-[color:var(--ink-4)]">
            <div>
              一次性访客占比：<span className={pctColor(1 - oneDayShare, 0.4, 0.15)}>{pct(oneDayShare)}</span>
              （目标 ≤60%，越低越好）
            </div>
            <div>
              复访用户占比：<span className={pctColor(repeatShare, 0.4, 0.15)}>{pct(repeatShare)}</span>
              （目标 ≥40%）
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[var(--radius-lg)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-5 md:p-6">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
            <Flame className="h-4 w-4" />
            Cohort 留存 · 最近 30 个队列
          </div>
          <h2 className="mt-2 text-xl font-black text-[color:var(--ink-1)]">每天进来的人，第 1/7/30 天还回来吗？</h2>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-[color:var(--hairline)] text-left text-xs uppercase tracking-[0.12em] text-[color:var(--ink-4)]">
                  <th className="py-2 pr-3">Cohort 日</th>
                  <th className="py-2 pr-3 text-right">规模</th>
                  <th className="py-2 pr-3 text-right">D1</th>
                  <th className="py-2 pr-3 text-right">D1 率</th>
                  <th className="py-2 pr-3 text-right">D7</th>
                  <th className="py-2 pr-3 text-right">D7 率</th>
                  <th className="py-2 pr-3 text-right">D30</th>
                  <th className="py-2 pr-3 text-right">D30 率</th>
                </tr>
              </thead>
              <tbody>
                {retention.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-4 text-center text-[color:var(--ink-4)]">
                      暂无 cohort 数据。
                    </td>
                  </tr>
                ) : (
                  retention.map((r) => (
                    <tr key={r.cohortDay} className="border-b border-[color:var(--hairline)]/60">
                      <td className="py-2 pr-3 font-mono text-xs text-[color:var(--ink-2)]">{r.cohortDay}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{r.cohortSize}</td>
                      <td className="py-2 pr-3 text-right tabular-nums text-[color:var(--ink-3)]">{r.d1}</td>
                      <td className={`py-2 pr-3 text-right tabular-nums ${pctColor(r.d1Rate, 0.2, 0.05)}`}>{pct(r.d1Rate)}</td>
                      <td className="py-2 pr-3 text-right tabular-nums text-[color:var(--ink-3)]">{r.d7}</td>
                      <td className={`py-2 pr-3 text-right tabular-nums ${pctColor(r.d7Rate, 0.1, 0.02)}`}>{pct(r.d7Rate)}</td>
                      <td className="py-2 pr-3 text-right tabular-nums text-[color:var(--ink-3)]">{r.d30}</td>
                      <td className={`py-2 pr-3 text-right tabular-nums ${pctColor(r.d30Rate, 0.05, 0.01)}`}>{pct(r.d30Rate)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-[color:var(--ink-4)]">
            注：D7/D30 在不到 7/30 天的 cohort 上必然是 0，看趋势聚焦在 D1 列。
          </p>
        </section>

        <section className="mt-8 rounded-[var(--radius-lg)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-5 md:p-6">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
            <MailCheck className="h-4 w-4" />
            邮箱捕获漏斗
          </div>
          <h2 className="mt-2 text-xl font-black text-[color:var(--ink-1)]">合格用户里有多少留下了邮箱？</h2>

          <div className="mt-5 grid gap-4 md:grid-cols-4">
            <StatCard label="30d 总用户" value={emailFunnel.totalUsers30d} helper="含匿名 guest" />
            <StatCard
              label="合格用户"
              value={emailFunnel.qualifiedUsers}
              helper="30d ≥3 天访问"
              valueClassName="text-[color:var(--brand-strong)]"
            />
            <StatCard
              label="合格 → 留邮箱"
              value={emailFunnel.qualifiedWithEmail}
              helper={`转化率 ${pct(emailFunnel.qualifiedEmailRate)}`}
              valueClassName={pctColor(emailFunnel.qualifiedEmailRate, 0.3, 0.1)}
            />
            <StatCard
              label="全量留邮箱"
              value={emailFunnel.totalWithEmail}
              helper="不分使用频次"
            />
          </div>

          <div className="mt-5 rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-4 text-sm leading-6 text-[color:var(--ink-3)]">
            <div className="font-black text-[color:var(--ink-1)]">行动判读</div>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                {oneDayShare > 0.6
                  ? `🔴 ${pct(oneDayShare)} 用户只来 1 天，重点是降低首次跳出，简化第一个判断流程。`
                  : `🟢 一次性访客占比 ${pct(oneDayShare)}，可以开始尝试在第 2 次访问触发邮箱请求。`}
              </li>
              <li>
                {emailFunnel.qualifiedEmailRate < 0.1
                  ? `🔴 合格用户邮箱转化仅 ${pct(emailFunnel.qualifiedEmailRate)}，邮箱请求时机/文案需要重新设计。`
                  : `🟢 合格用户邮箱转化 ${pct(emailFunnel.qualifiedEmailRate)}，可以放大请求频次。`}
              </li>
              <li>
                {active.stickinessDauWau < 0.15
                  ? `🔴 DAU/WAU 粘性 ${pct(active.stickinessDauWau)} 偏低（基准 ≥20%），可能是 SEO 一次性涌入用户多。`
                  : `🟢 DAU/WAU 粘性 ${pct(active.stickinessDauWau)} 健康。`}
              </li>
            </ul>
          </div>
        </section>

        <section className="mt-8 rounded-[var(--radius-lg)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-5 md:p-6">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-1 h-5 w-5 shrink-0 text-[color:var(--brand-strong)]" />
            <div>
              <h2 className="text-lg font-black text-[color:var(--ink-1)]">这一页为什么重要</h2>
              <p className="mt-2 text-sm leading-6 text-[color:var(--ink-3)]">
                我们的 GMV 公式 = 用户极致爽用 × 高频回访 × 邮箱长尾。其中：
              </p>
              <ul className="mt-3 grid gap-2 text-sm leading-6 text-[color:var(--ink-3)] list-disc pl-5">
                <li>使用频率分布告诉我们：免登录策略是不是真在留人，而不是「来一次走人」。</li>
                <li>cohort 留存告诉我们：哪一天的产品改动让回访变好或变坏。</li>
                <li>邮箱捕获漏斗告诉我们：什么时候请求邮箱合适——本周期目标是「合格用户 ≥3 天才请求」。</li>
              </ul>
              <Link href="/admin/analytics" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[color:var(--brand-strong)]">
                看完整漏斗与 LLM 健康
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <AdminFooter />
    </div>
  );
}

function StatCard({
  label,
  value,
  helper,
  valueClassName,
}: {
  label: string;
  value: number | string;
  helper?: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-5">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--ink-4)]">{label}</div>
      <div className={`mt-2 text-3xl font-black tabular-nums text-[color:var(--ink-1)] ${valueClassName || ''}`}>{value}</div>
      {helper ? <div className="mt-1 text-xs text-[color:var(--ink-4)]">{helper}</div> : null}
    </div>
  );
}

function FrequencyBucket({
  label,
  count,
  total,
  tone,
}: {
  label: string;
  count: number;
  total: number;
  tone: 'bad' | 'warn' | 'good' | 'hero';
}) {
  const share = total ? count / total : 0;
  const toneClass = {
    bad: 'border-[color:var(--accent-soft)] bg-[color:var(--accent-soft)]/30',
    warn: 'border-[color:var(--hairline-strong)] bg-[color:var(--bg-elevated)]',
    good: 'border-[color:var(--brand-soft)] bg-[color:var(--brand-soft)]/40',
    hero: 'border-[color:var(--signal-soft)] bg-[color:var(--signal-soft)]/40',
  }[tone];
  return (
    <div className={`rounded-[var(--radius-md)] border ${toneClass} p-4`}>
      <div className="text-xs font-semibold text-[color:var(--ink-3)]">{label}</div>
      <div className="mt-1 text-3xl font-black tabular-nums text-[color:var(--ink-1)]">{count}</div>
      <div className="mt-1 text-xs text-[color:var(--ink-4)]">{pct(share)}</div>
    </div>
  );
}
