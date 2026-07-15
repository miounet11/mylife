import Link from 'next/link';
import { requireAdminUser } from '@/lib/auth';
import { getProductFunnelSnapshot } from '@/lib/product-analytics-dashboard';
import { AppPage } from '@/components/layout/app-page';

export const dynamic = 'force-dynamic';

export default async function AdminProductFunnelPage() {
  await requireAdminUser('/admin/product-funnel');
  const snap = getProductFunnelSnapshot();

  return (
    <AppPage header={{ ctaHref: '/admin/dashboard', ctaLabel: '运营看板' }}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6d28d9]">
            Product Analytics
          </div>
          <h1 className="mt-1 text-[20px] font-bold text-[#0f172a]">双轨产品漏斗</h1>
          <p className="mt-1 text-[12px] text-[#64748b]">
            大众决策闭环 × 专业开业交付 · 数据来自 analytics_events · 生成于{' '}
            {snap.generatedAt.slice(0, 19).replace('T', ' ')}
          </p>
        </div>
        <Link href="/admin/dashboard" className="text-[12px] font-semibold text-[#6d28d9] hover:underline">
          ← 运营看板
        </Link>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="全站事件 24h" value={snap.totals.events24h} />
        <Stat label="全站事件 7d" value={snap.totals.events7d} />
        <Stat label="双轨事件 24h" value={snap.totals.productEvents24h} accent />
        <Stat label="双轨事件 7d" value={snap.totals.productEvents7d} accent />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Group title="大众主路径" items={snap.mass} />
        <Group title="专业开业" items={snap.expert} />
        <Group title="闭环工具" items={snap.loop} />
      </div>

      <section className="mt-4 rounded-[12px] border border-[#e2e8f0] bg-white p-4">
        <h2 className="text-[14px] font-bold text-[#0f172a]">24h 双轨事件 Top</h2>
        {snap.topProduct24h.length === 0 ? (
          <p className="mt-2 text-[12px] text-[#94a3b8]">
            暂无数据。部署埋点后用户操作会出现在此；本地 stub 数据库可能为空。
          </p>
        ) : (
          <ul className="mt-3 space-y-1.5">
            {snap.topProduct24h.map((row) => (
              <li
                key={row.event_name}
                className="flex items-center justify-between rounded-[8px] bg-[#f8fafc] px-3 py-2 text-[12px]"
              >
                <span className="font-mono text-[#334155]">{row.event_name}</span>
                <span className="font-bold text-[#6d28d9]">{row.c}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-4 rounded-[12px] border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-4 text-[12px] leading-[1.65] text-[#475569]">
        <div className="font-bold text-[#0f172a]">优化解读建议</div>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <strong>决策复制/打印</strong> 高而预测打分低 → 加强回访 CTA 与到期提醒
          </li>
          <li>
            <strong>专业打开</strong> 高而交付复制低 → 把「一键交付」前置到导航
          </li>
          <li>
            <strong>合婚/事件</strong> 打开多、完成少 → 检查预填与保存失败路径
          </li>
          <li>
            <strong>追问锚定</strong> 加载失败多 → 丰富公开报告 API 字段
          </li>
        </ul>
      </section>
    </AppPage>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-[12px] border p-4 ${
        accent ? 'border-[#c4b5fd] bg-[#f5f3ff]' : 'border-[#e2e8f0] bg-white'
      }`}
    >
      <div className="text-[11px] font-semibold text-[#64748b]">{label}</div>
      <div className="mt-1 font-mono text-[22px] font-black text-[#0f172a]">{value}</div>
    </div>
  );
}

function Group({
  title,
  items,
}: {
  title: string;
  items: Array<{ event: string; label: string; count24h: number; count7d: number }>;
}) {
  return (
    <section className="rounded-[12px] border border-[#e2e8f0] bg-white p-4">
      <h2 className="text-[14px] font-bold text-[#0f172a]">{title}</h2>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item.event} className="border-b border-[#f1f5f9] pb-2 last:border-0">
            <div className="text-[12px] font-semibold text-[#334155]">{item.label}</div>
            <div className="mt-0.5 flex justify-between font-mono text-[11px] text-[#94a3b8]">
              <span>24h {item.count24h}</span>
              <span>7d {item.count7d}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
