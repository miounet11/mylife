import Link from 'next/link';
import LlmProviderConsole from '@/components/llm-provider-console';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import { requireAdminUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function LlmSettingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ llm?: string }>;
}) {
  await requireAdminUser('/llm');
  const params = await searchParams;
  const mode = params?.llm || 'llm';

  return (
    <div className="page-shell">
      <SiteHeader ctaHref="/admin/content" ctaLabel="内容后台" />
      <main className="page-frame py-10 pb-16 md:py-16 md:pb-20">
        <section className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr]">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">LLM Settings · {mode}</div>
            <h1 className="mt-4 text-4xl font-black text-[color:var(--ink)] md:text-5xl">
              统一配置图片和文章生成模型
            </h1>
            <p className="text-sm leading-7 text-[color:var(--ink-4)] mt-4">
              图片生成和文章生成都从这里读取 Provider 优先级。后台配置优先，现有环境变量作为兜底。
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/admin/content" className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] transition hover:border-[color:var(--brand)]">返回内容后台</Link>
              <Link href="/llm?llm=image" className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] transition hover:border-[color:var(--brand)]">图片配置</Link>
              <Link href="/llm?llm=article" className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] transition hover:border-[color:var(--brand)]">文章配置</Link>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { label: '图片默认', value: 'gpt-image-2-my', helper: '后台主 Provider 优先' },
              { label: '文章默认', value: 'grok-420-fast', helper: '保留现有模型链' },
              { label: '兜底', value: 'Env Provider', helper: '旧配置继续可用' },
            ].map((item) => (
              <div key={item.label} className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] rounded-[1.5rem] p-5">
                <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{item.label}</div>
                <div className="mt-2 text-2xl font-black text-[color:var(--ink)]">{item.value}</div>
                <div className="mt-2 text-sm leading-7 text-[color:var(--ink-4)]">{item.helper}</div>
              </div>
            ))}
          </div>
        </section>
        <div className="mt-10">
          <LlmProviderConsole />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
