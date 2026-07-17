import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  Bot,
  Mail,
  Sparkles,
  Users,
  Wrench,
} from 'lucide-react';
import { AdminFooter, AdminHeader } from '@/components/admin-shell';
import { requireAdminUser } from '@/lib/auth';
import { getAdminOpsDashboardSnapshot } from '@/lib/admin-ops-dashboard';

export const dynamic = 'force-dynamic';

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
    <div className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4">
      <div className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--ink-4)]">{label}</div>
      <div className="mt-1 text-2xl font-black tabular-nums text-[color:var(--ink-1)]">{value}</div>
      {helper ? <div className="mt-1 text-[11px] text-[color:var(--ink-4)]">{helper}</div> : null}
    </div>
  );
}

function Section({
  title,
  children,
  href,
  linkLabel,
}: {
  title: string;
  children: React.ReactNode;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-5 md:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-black text-[color:var(--ink-1)]">{title}</h2>
        {href ? (
          <Link href={href} className="inline-flex items-center gap-1 text-[12px] font-semibold text-[color:var(--brand)] hover:no-underline">
            {linkLabel || '查看全部'}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export default async function AdminDashboardPage() {
  const admin = await requireAdminUser('/admin/dashboard');
  const snap = getAdminOpsDashboardSnapshot();

  let llmProviders: Array<{ id: string; name: string; purpose: string; enabled: boolean; model: string }> = [];
  try {
    const mod = await import('@/lib/llm-provider-configs');
    mod.ensureDefaultLlmProviderConfigs?.(admin.id);
    llmProviders = (mod.listMaskedLlmProviderConfigs?.() || []).map((p: {
      id: string;
      name: string;
      purpose: string;
      enabled: boolean;
      model: string;
    }) => ({
      id: p.id,
      name: p.name,
      purpose: p.purpose,
      enabled: !!p.enabled,
      model: p.model,
    }));
  } catch {
    llmProviders = [];
  }

  const llmFailRate =
    snap.analytics.llmAttempts24h > 0
      ? `${((snap.analytics.llmFail24h / snap.analytics.llmAttempts24h) * 100).toFixed(1)}%`
      : '—';

  return (
    <div className="page-shell min-h-screen bg-[color:var(--bg-sunken)]">
      <AdminHeader />
      <main className="page-frame mx-auto max-w-7xl px-4 py-8 pb-16 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[color:var(--brand)]">
              Ops Dashboard
            </div>
            <h1 className="mt-1 text-3xl font-black text-[color:var(--ink-1)]">运营总览看板</h1>
            <p className="mt-1 max-w-2xl text-[13px] leading-6 text-[color:var(--ink-3)]">
              用户（注册 / 临时）、邮箱、测算、工具与 LLM 一页总览。数据 60 秒缓存，仅管理员可访问。
            </p>
          </div>
          <div className="text-[11px] text-[color:var(--ink-4)]">
            生成于 {new Date(snap.generatedAt).toLocaleString('zh-CN')}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="用户总数" value={snap.users.total} helper={`注册 ${snap.users.registered} · Guest ${snap.users.guests}`} />
          <Stat label="24h 新用户" value={snap.users.new24h} helper={`其中 guest ${snap.users.guestNew24h}`} />
          <Stat label="24h 新报告" value={snap.fortunes.d24h} helper={`7d ${snap.fortunes.d7d} · 全量 ${snap.fortunes.total}`} />
          <Stat label="24h 事件/会话" value={`${snap.analytics.events24h}/${snap.analytics.sessions24h}`} helper={`7d 事件 ${snap.analytics.events7d}`} />
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="有邮箱用户" value={snap.users.withEmail} helper={`订阅 ${snap.email.subscriptions}（24h +${snap.email.subscriptions24h}）`} />
          <Stat label="工具会话" value={snap.tools.sessionsTotal} helper={`24h ${snap.tools.sessions24h} · 7d ${snap.tools.sessions7d}`} />
          <Stat label="LLM 调用 24h" value={snap.analytics.llmAttempts24h} helper={`失败 ${snap.analytics.llmFail24h}（${llmFailRate}）`} />
          <Stat label="管理员账号" value={snap.users.admins} helper="role=admin" />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Section title="注册用户（最近）" href="/admin/users?kind=registered" linkLabel="用户管理">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-[12px]">
                <thead className="text-[10px] uppercase tracking-wide text-[color:var(--ink-4)]">
                  <tr className="border-b border-[color:var(--hairline)]">
                    <th className="py-2 pr-2">邮箱</th>
                    <th className="py-2 pr-2">角色</th>
                    <th className="py-2">注册时间</th>
                  </tr>
                </thead>
                <tbody>
                  {snap.recent.registeredUsers.length === 0 ? (
                    <tr><td colSpan={3} className="py-4 text-[color:var(--ink-4)]">暂无注册用户</td></tr>
                  ) : (
                    snap.recent.registeredUsers.map((u) => (
                      <tr key={u.id} className="border-b border-[color:var(--hairline)]/70">
                        <td className="py-2 pr-2 font-semibold text-[color:var(--ink-1)]">{u.email || '—'}</td>
                        <td className="py-2 pr-2 text-[color:var(--ink-3)]">{u.role || 'user'}</td>
                        <td className="py-2 text-[color:var(--ink-4)]">{u.created_at}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="临时用户 Guest（最近）" href="/admin/users?kind=guest" linkLabel="查看 Guest">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-[12px]">
                <thead className="text-[10px] uppercase tracking-wide text-[color:var(--ink-4)]">
                  <tr className="border-b border-[color:var(--hairline)]">
                    <th className="py-2 pr-2">ID</th>
                    <th className="py-2 pr-2">名称</th>
                    <th className="py-2">创建时间</th>
                  </tr>
                </thead>
                <tbody>
                  {snap.recent.guestUsers.length === 0 ? (
                    <tr><td colSpan={3} className="py-4 text-[color:var(--ink-4)]">暂无 guest</td></tr>
                  ) : (
                    snap.recent.guestUsers.map((u) => (
                      <tr key={u.id} className="border-b border-[color:var(--hairline)]/70">
                        <td className="max-w-[220px] truncate py-2 pr-2 font-mono text-[11px] text-[color:var(--ink-2)]">{u.id}</td>
                        <td className="py-2 pr-2">{u.name || '访客'}</td>
                        <td className="py-2 text-[color:var(--ink-4)]">{u.created_at}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="最近测算报告" href="/admin/users" linkLabel="按用户查">
            <ul className="space-y-2">
              {snap.recent.fortunes.map((f) => (
                <li key={f.id} className="rounded-[var(--radius-sm)] border border-[color:var(--hairline)] px-3 py-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-bold text-[color:var(--ink-1)]">
                        {f.name || '访客'} · {f.intent || '综合'}
                      </div>
                      <div className="mt-0.5 truncate font-mono text-[10px] text-[color:var(--ink-4)]">
                        {f.id} · {f.user_id}
                      </div>
                    </div>
                    <div className="shrink-0 text-[10px] text-[color:var(--ink-4)]">{f.created_at}</div>
                  </div>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="工具运行 / 事件 Top" href="/admin/usage" linkLabel="频率留存">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="mb-2 text-[11px] font-bold uppercase text-[color:var(--ink-4)]">热门工具</div>
                <ul className="space-y-1.5 text-[12px]">
                  {snap.tools.topTools7d.map((t) => (
                    <li key={t.tool_slug} className="flex justify-between gap-2 border-b border-[color:var(--hairline)]/60 py-1">
                      <span className="truncate font-semibold text-[color:var(--ink-2)]">{t.tool_slug}</span>
                      <span className="tabular-nums text-[color:var(--ink-4)]">{t.c}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="mb-2 text-[11px] font-bold uppercase text-[color:var(--ink-4)]">24h 事件</div>
                <ul className="space-y-1.5 text-[12px]">
                  {snap.analytics.topEvents24h.map((e) => (
                    <li key={e.event_name} className="flex justify-between gap-2 border-b border-[color:var(--hairline)]/60 py-1">
                      <span className="truncate text-[color:var(--ink-2)]">{e.event_name}</span>
                      <span className="tabular-nums text-[color:var(--ink-4)]">{e.c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {snap.fortunes.byIntent7d.length ? (
              <div className="mt-4">
                <div className="mb-2 text-[11px] font-bold uppercase text-[color:var(--ink-4)]">7d 测算意图</div>
                <div className="flex flex-wrap gap-2">
                  {snap.fortunes.byIntent7d.map((i) => (
                    <span key={i.intent} className="rounded-full border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-2.5 py-1 text-[11px] font-semibold">
                      {i.intent}: {i.c}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </Section>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Section title="LLM 提供商" href="/admin/llm" linkLabel="设置">
            {llmProviders.length === 0 ? (
              <p className="text-[13px] text-[color:var(--ink-3)]">暂无配置或模块未同步。可进入 LLM 设置页检查。</p>
            ) : (
              <ul className="space-y-2">
                {llmProviders.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2 rounded-[var(--radius-sm)] border border-[color:var(--hairline)] px-3 py-2 text-[12px]">
                    <div>
                      <div className="font-bold text-[color:var(--ink-1)]">{p.name}</div>
                      <div className="text-[color:var(--ink-4)]">{p.purpose} · {p.model}</div>
                    </div>
                    <span className={p.enabled ? 'font-semibold text-[color:var(--signal-strong)]' : 'text-[color:var(--ink-4)]'}>
                      {p.enabled ? '启用' : '停用'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3 text-[11px] text-[color:var(--ink-4)]">
              24h LLM 调用 {snap.analytics.llmAttempts24h}，失败 {snap.analytics.llmFail24h}（{llmFailRate}）
            </div>
          </Section>

          <Section title="快捷入口">
            <div className="grid gap-2">
              {[
                { href: '/admin/users', label: '用户 / Guest / 邮箱', icon: Users },
                { href: '/admin/llm', label: 'LLM 设置', icon: Bot },
                { href: '/admin/usage', label: '频率与留存', icon: Activity },
                { href: '/admin/analytics', label: '经营分析', icon: Sparkles },
                { href: '/admin/product-funnel', label: '双轨漏斗', icon: Sparkles },
                { href: '/admin/chat-ops', label: '对话运营', icon: Sparkles },
                { href: '/admin/content', label: '内容后台', icon: Mail },
                { href: '/tools', label: '前台工具中心', icon: Wrench },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="inline-flex items-center justify-between rounded-[var(--radius)] border border-[color:var(--hairline)] px-3 py-2.5 text-[13px] font-semibold text-[color:var(--ink-2)] transition hover:border-[color:var(--brand)] hover:no-underline"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Icon className="h-4 w-4 text-[color:var(--brand)]" />
                      {item.label}
                    </span>
                    <ArrowRight className="h-4 w-4 text-[color:var(--ink-4)]" />
                  </Link>
                );
              })}
            </div>
          </Section>
        </div>
      </main>
      <AdminFooter />
    </div>
  );
}
