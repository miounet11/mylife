import type { Metadata } from 'next';
import Link from 'next/link';
import AnalyticsPageView from '@/components/analytics-page-view';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';
import { StickyAnalyzeBar } from '@/components/conversion/sticky-analyze-bar';
import { listDestinyEntityHubs } from '@/lib/content-os';
import { buildPageMetadata, buildItemListJsonLd } from '@/lib/seo';
import JsonLd from '@/components/seo/json-ld';

export const metadata: Metadata = buildPageMetadata({
  title: '人生命运主题库｜十维度·城市·行业·日主·决策问题',
  description:
    '以人生命运为中心的主题库：十维度研判、人生决策问题、城市迁移、行业节奏、日主发挥方式与工具指南。用结构·时位·环境帮助你把问题拆清楚。',
  path: '/topics',
  keywords: [
    '人生命运',
    '八字主题',
    '十维度',
    '城市观察',
    '行业节奏',
    '日主',
    '人生K线',
    'World Yi',
    'destiny topics',
  ],
  multiLanguage: true,
});

const KIND_LABEL: Record<string, string> = {
  dimension: '十维度',
  'life-question': '人生决策',
  city: '城市',
  industry: '行业',
  'day-master': '日主',
  tool: '工具',
  methodology: '方法论',
  seasonal: '时令',
  faq: '常见问题',
  'life-stage': '人生阶段',
};

export default function TopicsHubPage() {
  const hubs = listDestinyEntityHubs();
  const byKind = new Map<string, typeof hubs>();
  for (const hub of hubs) {
    const list = byKind.get(hub.kind) || [];
    list.push(hub);
    byKind.set(hub.kind, list);
  }

  const kinds = [
    'life-question',
    'dimension',
    'city',
    'industry',
    'day-master',
    'tool',
  ].filter((k) => byKind.has(k));

  const listLd = buildItemListJsonLd(
    '人生命运主题库',
    hubs.slice(0, 50).map((h) => ({ name: h.name, path: h.href })),
  );

  return (
    <AppPage>
      <AnalyticsPageView page="/topics" />
      <JsonLd data={listLd} />
      <FocusHero
        eyebrow="主题库"
        title="人生命运主题库"
        description="围绕真实人生问题组织主题：换工作、迁城、创业、婚恋、十维度与工具指南。每页先把问题说清楚，再连到可验证的下一步。"
        actions={
          <>
            <Link
              href="/analyze"
              className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
            >
              免费生成人生K线
            </Link>
            <Link
              href="/knowledge"
              className="text-[color:var(--ink-3)] underline-offset-2 hover:underline"
            >
              知识库
            </Link>
            <Link
              href="/cases"
              className="text-[color:var(--ink-3)] underline-offset-2 hover:underline"
            >
              案例库
            </Link>
          </>
        }
      />

      <section className="mx-auto max-w-6xl px-4 pb-4">
        <div className="rounded-2xl border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4 text-sm text-[color:var(--ink-3)]">
          <p className="font-medium text-[color:var(--ink-1)]">怎么用这套主题库</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>先选你真正在纠结的决策主题，而不是先找吉凶标签</li>
            <li>用结构 · 时位 · 环境 三层把条件拆开，再决定要不要行动</li>
            <li>读完后去排盘或十维度验证，并给自己一个 30 天回访点</li>
          </ul>
          <p className="mt-2 text-[color:var(--ink-4)]">当前主题 {hubs.length} 个</p>
        </div>
      </section>

      {kinds.map((kind) => {
        const list = byKind.get(kind) || [];
        return (
          <section key={kind} className="mx-auto max-w-6xl px-4 py-6">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-[color:var(--ink-1)]">
                  {KIND_LABEL[kind] || kind}
                </h2>
                <p className="mt-1 text-sm text-[color:var(--ink-4)]">{list.length} 个实体主题</p>
              </div>
              <Link
                href="/knowledge"
                className="text-sm text-[color:var(--brand-strong)] hover:underline"
              >
                相关知识 →
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((hub) => (
                <Link
                  key={hub.href}
                  href={hub.href}
                  className="group rounded-2xl border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4 shadow-sm transition hover:border-[color:var(--brand)] hover:shadow-md"
                >
                  <div className="text-xs font-medium uppercase tracking-wide text-[color:var(--brand-strong)]">
                    {KIND_LABEL[hub.kind] || hub.kind}
                  </div>
                  <h3 className="mt-1 text-base font-semibold text-[color:var(--ink-1)] group-hover:text-[color:var(--brand-strong)]">
                    {hub.name}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm text-[color:var(--ink-3)]">
                    {hub.description}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-2xl border border-[color:var(--hairline)] bg-[color:var(--paper)] p-6">
          <h2 className="text-lg font-semibold text-[color:var(--ink-1)]">内容体系怎么跑起来</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-[color:var(--ink-3)]">
            <li>矩阵规划：实体 × 模板 × 语言 × 市场</li>
            <li>LLM 火力生成：自建网关 auto 文本 + z-image-turbo 配图</li>
            <li>质量门：结构完整、可引用摘要、禁内部工程词</li>
            <li>发布与刷新：缺口优先 + 过期刷新 + 多语言扩展</li>
            <li>转化闭环：主题页 → 工具/十维度 → 邮箱保存 → 回访</li>
          </ol>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link href="/world-yi" className="text-[color:var(--brand-strong)] underline">
              世界易
            </Link>
            <Link href="/community" className="text-[color:var(--brand-strong)] underline">
              社区问答
            </Link>
            <Link href="/docs" className="text-[color:var(--brand-strong)] underline">
              帮助文档
            </Link>
            <Link href="/dimensions" className="text-[color:var(--brand-strong)] underline">
              十维度
            </Link>
          </div>
        </div>
      </section>

      <StickyAnalyzeBar />
    </AppPage>
  );
}
